/// ============================================================================
/// EMPLOYER TREASURY MODULE - DAILY WAGE ALLOCATION PROTOCOL
/// ============================================================================
/// This module manages employer fund pools and liquidity for the wage streaming
/// protocol. It handles deposits, allocations, and ensures sufficient funds
/// for wage disbursements.
///
/// Key Features:
/// - Employer fund pool management
/// - Automatic liquidity allocation to streams
/// - Treasury health monitoring
/// - Multi-currency support preparation
///
/// @author Daily Wage Protocol Team
/// @version 1.0.0
/// ============================================================================

module wage_streaming_addr::employer_treasury {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    
    use wage_streaming_addr::error_codes;

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    /// Minimum deposit amount (0.1 APT)
    const MIN_DEPOSIT: u64 = 10_000_000;
    
    /// Maximum allocation per stream (100,000 APT)
    const MAX_ALLOCATION_PER_STREAM: u64 = 100_000_00000000;
    
    /// Reserve ratio requirement (10%)
    const RESERVE_RATIO_BPS: u64 = 1000;
    
    /// Treasury health threshold for warnings (20%)
    const HEALTH_WARNING_THRESHOLD_BPS: u64 = 2000;
    
    /// Critical health threshold (5%)
    const HEALTH_CRITICAL_THRESHOLD_BPS: u64 = 500;

    // =========================================================================
    // TREASURY STATUS CODES
    // =========================================================================

    const STATUS_HEALTHY: u8 = 1;
    const STATUS_WARNING: u8 = 2;
    const STATUS_CRITICAL: u8 = 3;
    const STATUS_FROZEN: u8 = 4;

    // =========================================================================
    // DATA STRUCTURES
    // =========================================================================

    /// Global treasury registry
    struct TreasuryRegistry has key {
        /// Total number of treasuries
        total_treasuries: u64,
        /// Total value across all treasuries
        total_value: u64,
        /// Total allocated to streams
        total_allocated: u64,
        /// Protocol admin
        admin: address,
        /// Global freeze state
        is_frozen: bool,
        /// Treasury created events
        treasury_created_events: EventHandle<TreasuryCreatedEvent>,
        /// Deposit events
        deposit_events: EventHandle<DepositEvent>,
        /// Allocation events
        allocation_events: EventHandle<AllocationEvent>,
        /// Withdrawal events
        withdrawal_events: EventHandle<WithdrawalEvent>,
    }

    /// Individual employer treasury
    struct EmployerTreasury has key {
        /// Employer address
        employer: address,
        /// Total balance in treasury
        total_balance: u64,
        /// Amount allocated to active streams
        allocated_balance: u64,
        /// Available for new allocations
        available_balance: u64,
        /// Reserve amount (locked)
        reserve_balance: u64,
        /// Number of active streams funded
        active_stream_count: u64,
        /// Treasury creation timestamp
        created_at: u64,
        /// Last activity timestamp
        last_activity: u64,
        /// Treasury status
        status: u8,
        /// Funds storage
        funds: Coin<AptosCoin>,
        /// Is treasury frozen
        is_frozen: bool,
        /// Auto-top-up threshold (0 = disabled)
        auto_topup_threshold: u64,
    }

    /// Stream allocation record
    struct StreamAllocation has store, drop, copy {
        /// Stream ID
        stream_id: u64,
        /// Allocated amount
        amount: u64,
        /// Amount already disbursed
        disbursed: u64,
        /// Allocation timestamp
        allocated_at: u64,
        /// Is active
        is_active: bool,
    }

    /// Employer's stream allocations
    struct EmployerAllocations has key {
        /// List of allocations
        allocations: vector<StreamAllocation>,
        /// Total allocated
        total_allocated: u64,
        /// Total disbursed
        total_disbursed: u64,
    }

    /// Treasury analytics
    struct TreasuryAnalytics has key {
        /// Total deposits all time
        total_deposits: u64,
        /// Total withdrawals all time
        total_withdrawals: u64,
        /// Total disbursements all time
        total_disbursements: u64,
        /// Average allocation per stream
        avg_allocation: u64,
        /// Peak balance
        peak_balance: u64,
        /// Low balance alerts count
        low_balance_alerts: u64,
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    struct TreasuryCreatedEvent has drop, store {
        employer: address,
        initial_deposit: u64,
        timestamp: u64,
    }

    struct DepositEvent has drop, store {
        employer: address,
        amount: u64,
        new_balance: u64,
        timestamp: u64,
    }

    struct AllocationEvent has drop, store {
        employer: address,
        stream_id: u64,
        amount: u64,
        remaining_available: u64,
        timestamp: u64,
    }

    struct WithdrawalEvent has drop, store {
        employer: address,
        amount: u64,
        remaining_balance: u64,
        timestamp: u64,
    }

    struct DisbursementEvent has drop, store {
        employer: address,
        stream_id: u64,
        employee: address,
        amount: u64,
        timestamp: u64,
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /// Initialize the treasury registry
    public entry fun initialize_registry(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        assert!(!exists<TreasuryRegistry>(admin_addr), error_codes::already_initialized());
        
        move_to(admin, TreasuryRegistry {
            total_treasuries: 0,
            total_value: 0,
            total_allocated: 0,
            admin: admin_addr,
            is_frozen: false,
            treasury_created_events: account::new_event_handle<TreasuryCreatedEvent>(admin),
            deposit_events: account::new_event_handle<DepositEvent>(admin),
            allocation_events: account::new_event_handle<AllocationEvent>(admin),
            withdrawal_events: account::new_event_handle<WithdrawalEvent>(admin),
        });
    }

    /// Initialize employer treasury with initial deposit
    public entry fun initialize_treasury(
        employer: &signer,
        registry_addr: address,
        initial_deposit: u64,
    ) acquires TreasuryRegistry {
        let employer_addr = signer::address_of(employer);
        
        // Validate registry
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        
        // Check not already initialized
        assert!(!exists<EmployerTreasury>(employer_addr), error_codes::already_initialized());
        
        // Validate deposit
        assert!(initial_deposit >= MIN_DEPOSIT, error_codes::amount_too_small());
        
        // Calculate reserve
        let reserve = (initial_deposit * RESERVE_RATIO_BPS) / 10000;
        let available = initial_deposit - reserve;
        
        // Withdraw from employer
        let deposit_coins = coin::withdraw<AptosCoin>(employer, initial_deposit);
        
        let current_time = timestamp::now_seconds();
        
        // Create treasury
        move_to(employer, EmployerTreasury {
            employer: employer_addr,
            total_balance: initial_deposit,
            allocated_balance: 0,
            available_balance: available,
            reserve_balance: reserve,
            active_stream_count: 0,
            created_at: current_time,
            last_activity: current_time,
            status: STATUS_HEALTHY,
            funds: deposit_coins,
            is_frozen: false,
            auto_topup_threshold: 0,
        });
        
        // Create allocations tracker
        move_to(employer, EmployerAllocations {
            allocations: vector::empty(),
            total_allocated: 0,
            total_disbursed: 0,
        });
        
        // Create analytics
        move_to(employer, TreasuryAnalytics {
            total_deposits: initial_deposit,
            total_withdrawals: 0,
            total_disbursements: 0,
            avg_allocation: 0,
            peak_balance: initial_deposit,
            low_balance_alerts: 0,
        });
        
        // Update registry
        let registry = borrow_global_mut<TreasuryRegistry>(registry_addr);
        registry.total_treasuries = registry.total_treasuries + 1;
        registry.total_value = registry.total_value + initial_deposit;
        
        // Emit event
        event::emit_event(
            &mut registry.treasury_created_events,
            TreasuryCreatedEvent {
                employer: employer_addr,
                initial_deposit,
                timestamp: current_time,
            }
        );
    }

    // =========================================================================
    // DEPOSIT FUNCTIONS
    // =========================================================================

    /// Deposit funds into treasury
    public entry fun deposit_funds(
        employer: &signer,
        registry_addr: address,
        amount: u64,
    ) acquires TreasuryRegistry, EmployerTreasury, TreasuryAnalytics {
        let employer_addr = signer::address_of(employer);
        
        // Validate
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        assert!(amount >= MIN_DEPOSIT, error_codes::amount_too_small());
        
        let registry = borrow_global_mut<TreasuryRegistry>(registry_addr);
        assert!(!registry.is_frozen, error_codes::protocol_paused());
        
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        assert!(!treasury.is_frozen, error_codes::treasury_frozen());
        
        // Calculate reserve for new deposit
        let reserve = (amount * RESERVE_RATIO_BPS) / 10000;
        let available = amount - reserve;
        
        // Withdraw from employer and merge
        let deposit_coins = coin::withdraw<AptosCoin>(employer, amount);
        coin::merge(&mut treasury.funds, deposit_coins);
        
        let current_time = timestamp::now_seconds();
        
        // Update treasury
        treasury.total_balance = treasury.total_balance + amount;
        treasury.available_balance = treasury.available_balance + available;
        treasury.reserve_balance = treasury.reserve_balance + reserve;
        treasury.last_activity = current_time;
        
        // Update status if improved
        update_treasury_status(treasury);
        
        // Update analytics
        let analytics = borrow_global_mut<TreasuryAnalytics>(employer_addr);
        analytics.total_deposits = analytics.total_deposits + amount;
        if (treasury.total_balance > analytics.peak_balance) {
            analytics.peak_balance = treasury.total_balance;
        };
        
        // Update registry
        registry.total_value = registry.total_value + amount;
        
        // Emit event
        event::emit_event(
            &mut registry.deposit_events,
            DepositEvent {
                employer: employer_addr,
                amount,
                new_balance: treasury.total_balance,
                timestamp: current_time,
            }
        );
    }

    // =========================================================================
    // ALLOCATION FUNCTIONS
    // =========================================================================

    /// Allocate funds to a stream
    public entry fun allocate_to_stream(
        employer: &signer,
        registry_addr: address,
        stream_id: u64,
        amount: u64,
    ) acquires TreasuryRegistry, EmployerTreasury, EmployerAllocations, TreasuryAnalytics {
        let employer_addr = signer::address_of(employer);
        
        // Validate
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        assert!(amount > 0, error_codes::invalid_amount());
        assert!(amount <= MAX_ALLOCATION_PER_STREAM, error_codes::allocation_too_large());
        
        let registry = borrow_global_mut<TreasuryRegistry>(registry_addr);
        assert!(!registry.is_frozen, error_codes::protocol_paused());
        
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        assert!(!treasury.is_frozen, error_codes::treasury_frozen());
        assert!(treasury.available_balance >= amount, error_codes::insufficient_funds());
        
        // Check stream not already allocated
        let allocations = borrow_global_mut<EmployerAllocations>(employer_addr);
        let len = vector::length(&allocations.allocations);
        let i = 0;
        while (i < len) {
            let alloc = vector::borrow(&allocations.allocations, i);
            assert!(!(alloc.stream_id == stream_id && alloc.is_active), error_codes::stream_already_funded());
            i = i + 1;
        };
        
        let current_time = timestamp::now_seconds();
        
        // Create allocation
        let allocation = StreamAllocation {
            stream_id,
            amount,
            disbursed: 0,
            allocated_at: current_time,
            is_active: true,
        };
        vector::push_back(&mut allocations.allocations, allocation);
        allocations.total_allocated = allocations.total_allocated + amount;
        
        // Update treasury
        treasury.available_balance = treasury.available_balance - amount;
        treasury.allocated_balance = treasury.allocated_balance + amount;
        treasury.active_stream_count = treasury.active_stream_count + 1;
        treasury.last_activity = current_time;
        
        update_treasury_status(treasury);
        
        // Update analytics
        let analytics = borrow_global_mut<TreasuryAnalytics>(employer_addr);
        let total_streams = treasury.active_stream_count;
        if (total_streams > 0) {
            analytics.avg_allocation = allocations.total_allocated / total_streams;
        };
        
        // Update registry
        registry.total_allocated = registry.total_allocated + amount;
        
        // Emit event
        event::emit_event(
            &mut registry.allocation_events,
            AllocationEvent {
                employer: employer_addr,
                stream_id,
                amount,
                remaining_available: treasury.available_balance,
                timestamp: current_time,
            }
        );
    }

    /// Deallocate funds from a completed/terminated stream
    public entry fun deallocate_from_stream(
        employer: &signer,
        registry_addr: address,
        stream_id: u64,
        unused_amount: u64,
    ) acquires TreasuryRegistry, EmployerTreasury, EmployerAllocations {
        let employer_addr = signer::address_of(employer);
        
        // Validate
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        
        let registry = borrow_global_mut<TreasuryRegistry>(registry_addr);
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        let allocations = borrow_global_mut<EmployerAllocations>(employer_addr);
        
        // Find and update allocation
        let len = vector::length(&allocations.allocations);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let alloc = vector::borrow_mut(&mut allocations.allocations, i);
            if (alloc.stream_id == stream_id && alloc.is_active) {
                alloc.is_active = false;
                found = true;
                break
            };
            i = i + 1;
        };
        
        assert!(found, error_codes::allocation_not_found());
        
        // Return unused funds to available
        if (unused_amount > 0) {
            treasury.allocated_balance = treasury.allocated_balance - unused_amount;
            treasury.available_balance = treasury.available_balance + unused_amount;
            registry.total_allocated = registry.total_allocated - unused_amount;
        };
        
        treasury.active_stream_count = treasury.active_stream_count - 1;
        treasury.last_activity = timestamp::now_seconds();
        
        update_treasury_status(treasury);
    }

    // =========================================================================
    // DISBURSEMENT FUNCTIONS  
    // =========================================================================

    /// Record a wage disbursement (called by wage_streaming module)
    public fun record_disbursement(
        employer_addr: address,
        stream_id: u64,
        amount: u64,
    ) acquires EmployerTreasury, EmployerAllocations, TreasuryAnalytics {
        // Validate
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        let allocations = borrow_global_mut<EmployerAllocations>(employer_addr);
        
        // Find allocation
        let len = vector::length(&allocations.allocations);
        let i = 0;
        
        while (i < len) {
            let alloc = vector::borrow_mut(&mut allocations.allocations, i);
            if (alloc.stream_id == stream_id && alloc.is_active) {
                assert!(alloc.amount - alloc.disbursed >= amount, error_codes::insufficient_allocation());
                alloc.disbursed = alloc.disbursed + amount;
                break
            };
            i = i + 1;
        };
        
        // Update treasury
        treasury.allocated_balance = treasury.allocated_balance - amount;
        treasury.total_balance = treasury.total_balance - amount;
        treasury.last_activity = timestamp::now_seconds();
        
        allocations.total_disbursed = allocations.total_disbursed + amount;
        
        // Update analytics
        let analytics = borrow_global_mut<TreasuryAnalytics>(employer_addr);
        analytics.total_disbursements = analytics.total_disbursements + amount;
        
        update_treasury_status(treasury);
    }

    /// Disburse wages to employee (transfers actual funds)
    public fun disburse_wages(
        employer_addr: address,
        employee: address,
        stream_id: u64,
        amount: u64,
    ) acquires EmployerTreasury, EmployerAllocations, TreasuryAnalytics {
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        assert!(coin::value(&treasury.funds) >= amount, error_codes::insufficient_funds());
        
        // Extract and transfer
        let payment = coin::extract(&mut treasury.funds, amount);
        coin::deposit(employee, payment);
        
        // Record disbursement
        record_disbursement(employer_addr, stream_id, amount);
    }

    // =========================================================================
    // WITHDRAWAL FUNCTIONS
    // =========================================================================

    /// Withdraw available funds from treasury
    public entry fun withdraw_funds(
        employer: &signer,
        registry_addr: address,
        amount: u64,
    ) acquires TreasuryRegistry, EmployerTreasury, TreasuryAnalytics {
        let employer_addr = signer::address_of(employer);
        
        // Validate
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        
        let registry = borrow_global_mut<TreasuryRegistry>(registry_addr);
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        
        assert!(!treasury.is_frozen, error_codes::treasury_frozen());
        assert!(amount > 0, error_codes::invalid_amount());
        assert!(treasury.available_balance >= amount, error_codes::insufficient_funds());
        
        // Ensure reserve is maintained
        let post_withdrawal_balance = treasury.total_balance - amount;
        let required_reserve = (treasury.allocated_balance * RESERVE_RATIO_BPS) / 10000;
        assert!(
            post_withdrawal_balance >= treasury.allocated_balance + required_reserve,
            error_codes::reserve_required()
        );
        
        // Extract and transfer
        let withdrawal = coin::extract(&mut treasury.funds, amount);
        coin::deposit(employer_addr, withdrawal);
        
        let current_time = timestamp::now_seconds();
        
        // Update treasury
        treasury.total_balance = treasury.total_balance - amount;
        treasury.available_balance = treasury.available_balance - amount;
        treasury.last_activity = current_time;
        
        update_treasury_status(treasury);
        
        // Update analytics
        let analytics = borrow_global_mut<TreasuryAnalytics>(employer_addr);
        analytics.total_withdrawals = analytics.total_withdrawals + amount;
        
        // Update registry
        registry.total_value = registry.total_value - amount;
        
        // Emit event
        event::emit_event(
            &mut registry.withdrawal_events,
            WithdrawalEvent {
                employer: employer_addr,
                amount,
                remaining_balance: treasury.total_balance,
                timestamp: current_time,
            }
        );
    }

    /// Emergency withdrawal of all available funds
    public entry fun emergency_withdraw(
        employer: &signer,
        registry_addr: address,
    ) acquires TreasuryRegistry, EmployerTreasury, TreasuryAnalytics {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        
        let treasury = borrow_global<EmployerTreasury>(employer_addr);
        let available = treasury.available_balance;
        
        if (available > 0) {
            withdraw_funds(employer, registry_addr, available);
        };
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    #[view]
    /// Get treasury balance details
    public fun get_treasury_balance(employer: address): (u64, u64, u64, u64) acquires EmployerTreasury {
        assert!(exists<EmployerTreasury>(employer), error_codes::treasury_not_initialized());
        let treasury = borrow_global<EmployerTreasury>(employer);
        (
            treasury.total_balance,
            treasury.allocated_balance,
            treasury.available_balance,
            treasury.reserve_balance,
        )
    }

    #[view]
    /// Get treasury status
    public fun get_treasury_status(employer: address): (u8, bool, u64) acquires EmployerTreasury {
        assert!(exists<EmployerTreasury>(employer), error_codes::treasury_not_initialized());
        let treasury = borrow_global<EmployerTreasury>(employer);
        (treasury.status, treasury.is_frozen, treasury.active_stream_count)
    }

    #[view]
    /// Get treasury health ratio (available / total in bps)
    public fun get_treasury_health(employer: address): u64 acquires EmployerTreasury {
        assert!(exists<EmployerTreasury>(employer), error_codes::treasury_not_initialized());
        let treasury = borrow_global<EmployerTreasury>(employer);
        
        if (treasury.total_balance == 0) {
            return 0
        };
        
        ((treasury.available_balance + treasury.reserve_balance) * 10000) / treasury.total_balance
    }

    #[view]
    /// Get allocation details for a stream
    public fun get_allocation(employer: address, stream_id: u64): (u64, u64, bool) acquires EmployerAllocations {
        assert!(exists<EmployerAllocations>(employer), error_codes::treasury_not_initialized());
        
        let allocations = borrow_global<EmployerAllocations>(employer);
        let len = vector::length(&allocations.allocations);
        let i = 0;
        
        while (i < len) {
            let alloc = vector::borrow(&allocations.allocations, i);
            if (alloc.stream_id == stream_id) {
                return (alloc.amount, alloc.disbursed, alloc.is_active)
            };
            i = i + 1;
        };
        
        (0, 0, false)
    }

    #[view]
    /// Get treasury analytics
    public fun get_treasury_analytics(employer: address): (u64, u64, u64, u64) acquires TreasuryAnalytics {
        assert!(exists<TreasuryAnalytics>(employer), error_codes::treasury_not_initialized());
        let analytics = borrow_global<TreasuryAnalytics>(employer);
        (
            analytics.total_deposits,
            analytics.total_withdrawals,
            analytics.total_disbursements,
            analytics.peak_balance,
        )
    }

    #[view]
    /// Check if treasury exists
    public fun treasury_exists(employer: address): bool {
        exists<EmployerTreasury>(employer)
    }

    #[view]
    /// Get registry statistics
    public fun get_registry_stats(registry_addr: address): (u64, u64, u64) acquires TreasuryRegistry {
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global<TreasuryRegistry>(registry_addr);
        (registry.total_treasuries, registry.total_value, registry.total_allocated)
    }

    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================

    /// Freeze a treasury (admin only)
    public entry fun freeze_treasury(
        admin: &signer,
        registry_addr: address,
        employer: address,
    ) acquires TreasuryRegistry, EmployerTreasury {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global<TreasuryRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        assert!(exists<EmployerTreasury>(employer), error_codes::treasury_not_initialized());
        let treasury = borrow_global_mut<EmployerTreasury>(employer);
        
        treasury.is_frozen = true;
        treasury.status = STATUS_FROZEN;
    }

    /// Unfreeze a treasury (admin only)
    public entry fun unfreeze_treasury(
        admin: &signer,
        registry_addr: address,
        employer: address,
    ) acquires TreasuryRegistry, EmployerTreasury {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global<TreasuryRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        assert!(exists<EmployerTreasury>(employer), error_codes::treasury_not_initialized());
        let treasury = borrow_global_mut<EmployerTreasury>(employer);
        
        treasury.is_frozen = false;
        update_treasury_status(treasury);
    }

    /// Global freeze (admin only)
    public entry fun global_freeze(
        admin: &signer,
        registry_addr: address,
    ) acquires TreasuryRegistry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<TreasuryRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        registry.is_frozen = true;
    }

    /// Global unfreeze (admin only)
    public entry fun global_unfreeze(
        admin: &signer,
        registry_addr: address,
    ) acquires TreasuryRegistry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<TreasuryRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<TreasuryRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        registry.is_frozen = false;
    }

    // =========================================================================
    // CONFIGURATION FUNCTIONS
    // =========================================================================

    /// Set auto top-up threshold
    public entry fun set_auto_topup_threshold(
        employer: &signer,
        threshold: u64,
    ) acquires EmployerTreasury {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        
        treasury.auto_topup_threshold = threshold;
    }

    // =========================================================================
    // INTERNAL HELPERS
    // =========================================================================

    /// Update treasury status based on health
    fun update_treasury_status(treasury: &mut EmployerTreasury) {
        if (treasury.is_frozen) {
            treasury.status = STATUS_FROZEN;
            return
        };
        
        if (treasury.total_balance == 0 || treasury.allocated_balance == 0) {
            treasury.status = STATUS_HEALTHY;
            return
        };
        
        let available_ratio = (treasury.available_balance * 10000) / treasury.total_balance;
        
        if (available_ratio < HEALTH_CRITICAL_THRESHOLD_BPS) {
            treasury.status = STATUS_CRITICAL;
        } else if (available_ratio < HEALTH_WARNING_THRESHOLD_BPS) {
            treasury.status = STATUS_WARNING;
        } else {
            treasury.status = STATUS_HEALTHY;
        };
    }

    /// Check if treasury needs top-up
    public fun needs_topup(employer: address): bool acquires EmployerTreasury {
        if (!exists<EmployerTreasury>(employer)) {
            return false
        };
        
        let treasury = borrow_global<EmployerTreasury>(employer);
        
        if (treasury.auto_topup_threshold == 0) {
            return false
        };
        
        treasury.available_balance < treasury.auto_topup_threshold
    }

    /// Get funds balance from treasury
    public fun get_funds_balance(employer: address): u64 acquires EmployerTreasury {
        if (!exists<EmployerTreasury>(employer)) {
            return 0
        };
        let treasury = borrow_global<EmployerTreasury>(employer);
        coin::value(&treasury.funds)
    }

    // =========================================================================
    // FRIEND FUNCTIONS (for inter-module calls)
    // =========================================================================

    /// Check if employer has sufficient funds for allocation
    public fun has_sufficient_funds(employer: address, amount: u64): bool acquires EmployerTreasury {
        if (!exists<EmployerTreasury>(employer)) {
            return false
        };
        let treasury = borrow_global<EmployerTreasury>(employer);
        treasury.available_balance >= amount
    }

    /// Reserve funds for a pending stream (doesn't allocate yet)
    public fun reserve_funds(
        employer_addr: address,
        amount: u64,
    ) acquires EmployerTreasury {
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        assert!(treasury.available_balance >= amount, error_codes::insufficient_funds());
        
        treasury.available_balance = treasury.available_balance - amount;
        treasury.reserve_balance = treasury.reserve_balance + amount;
    }

    /// Release reserved funds back to available
    public fun release_reserved_funds(
        employer_addr: address,
        amount: u64,
    ) acquires EmployerTreasury {
        assert!(exists<EmployerTreasury>(employer_addr), error_codes::treasury_not_initialized());
        
        let treasury = borrow_global_mut<EmployerTreasury>(employer_addr);
        assert!(treasury.reserve_balance >= amount, error_codes::insufficient_reserve());
        
        treasury.reserve_balance = treasury.reserve_balance - amount;
        treasury.available_balance = treasury.available_balance + amount;
    }
}
