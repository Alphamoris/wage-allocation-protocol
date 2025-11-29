/// ============================================================================
/// WAGE STREAMING MODULE - DAILY WAGE ALLOCATION PROTOCOL
/// ============================================================================
/// This module implements the core wage streaming functionality for the Daily
/// Wage Allocation Protocol on Aptos. It enables real-time, per-second wage
/// accrual with instant settlement capabilities.
///
/// Key Features:
/// - Per-second wage accrual with high precision (10^8 decimals)
/// - Multi-stream support for employees with multiple employers
/// - Pause/Resume functionality with accurate time tracking
/// - Instant withdrawals with sub-$0.001 transaction costs
/// - Emergency stop mechanisms for compliance and safety
///
/// @author Daily Wage Protocol Team
/// @version 1.0.0
/// ============================================================================

module wage_streaming_addr::wage_streaming {
    use std::signer;
    use std::vector;
    use std::option;
    use std::string::String;
    use aptos_framework::timestamp;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    
    use wage_streaming_addr::error_codes;

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    /// Precision for wage rate calculations (8 decimal places)
    const PRECISION: u64 = 100_000_000;
    
    /// Minimum stream duration (1 hour in seconds)
    const MIN_STREAM_DURATION: u64 = 3600;
    
    /// Maximum active streams per employee
    const MAX_STREAMS_PER_EMPLOYEE: u64 = 10;
    
    /// Maximum stream duration (2 years in seconds)
    const MAX_STREAM_DURATION: u64 = 63072000;

    // =========================================================================
    // STREAM STATUS CODES
    // =========================================================================

    const STATUS_ACTIVE: u8 = 1;
    const STATUS_PAUSED: u8 = 2;
    const STATUS_COMPLETED: u8 = 3;
    const STATUS_TERMINATED: u8 = 4;
    const STATUS_DISPUTED: u8 = 5;

    // =========================================================================
    // DATA STRUCTURES
    // =========================================================================

    /// Core wage stream structure - represents an active payment stream
    struct WageStream has store, drop, copy {
        /// Unique stream identifier
        stream_id: u64,
        /// Employer's address
        employer: address,
        /// Employee's address  
        employee: address,
        /// Wage rate per second (in APT smallest units * PRECISION)
        rate_per_second: u64,
        /// Total amount deposited for this stream
        total_deposited: u64,
        /// Amount already withdrawn by employee
        total_withdrawn: u64,
        /// Stream creation timestamp
        start_time: u64,
        /// Stream end timestamp
        end_time: u64,
        /// Last withdrawal timestamp
        last_withdrawal_time: u64,
        /// Time when stream was paused (0 if not paused)
        pause_time: u64,
        /// Total accumulated pause duration
        total_pause_duration: u64,
        /// Current stream status
        status: u8,
        /// Job description or role identifier
        job_description: String,
        /// Compliance verified flag
        compliance_verified: bool,
    }

    /// Global stream registry maintained at protocol address
    struct StreamRegistry has key {
        /// Global stream counter
        next_stream_id: u64,
        /// Total value locked in streams
        total_value_locked: u64,
        /// Total active streams count
        active_streams_count: u64,
        /// Total completed streams count
        completed_streams_count: u64,
        /// Protocol fee rate (basis points, e.g., 25 = 0.25%)
        fee_rate_bps: u64,
        /// Accumulated protocol fees
        accumulated_fees: u64,
        /// Protocol admin address
        admin: address,
        /// Emergency pause state
        is_paused: bool,
        /// Stream creation events
        stream_created_events: EventHandle<StreamCreatedEvent>,
        /// Withdrawal events
        withdrawal_events: EventHandle<WithdrawalEvent>,
        /// Stream status change events
        status_change_events: EventHandle<StatusChangeEvent>,
    }

    /// Employee's stream collection
    struct EmployeeStreams has key {
        /// List of active stream IDs
        active_stream_ids: vector<u64>,
        /// Total earnings across all streams
        total_earnings: u64,
        /// Total withdrawals across all streams
        total_withdrawals: u64,
        /// Last activity timestamp
        last_activity: u64,
    }

    /// Employer's stream collection
    struct EmployerStreams has key {
        /// List of stream IDs created by employer
        stream_ids: vector<u64>,
        /// Total allocated across all streams
        total_allocated: u64,
        /// Total disbursed to employees
        total_disbursed: u64,
    }

    /// Individual stream storage at protocol address
    struct StreamStore has key {
        /// Map of stream_id to WageStream
        streams: vector<WageStream>,
    }

    /// Stream escrow account to hold funds
    struct StreamEscrow has key {
        /// Funds held in escrow for stream payments
        funds: Coin<AptosCoin>,
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    struct StreamCreatedEvent has drop, store {
        stream_id: u64,
        employer: address,
        employee: address,
        rate_per_second: u64,
        total_amount: u64,
        start_time: u64,
        end_time: u64,
    }

    struct WithdrawalEvent has drop, store {
        stream_id: u64,
        employee: address,
        amount: u64,
        timestamp: u64,
        remaining_balance: u64,
    }

    struct StatusChangeEvent has drop, store {
        stream_id: u64,
        old_status: u8,
        new_status: u8,
        timestamp: u64,
        changed_by: address,
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /// Initialize the wage streaming protocol
    /// Can only be called once by the protocol deployer
    public entry fun initialize(admin: &signer, fee_rate_bps: u64) {
        let admin_addr = signer::address_of(admin);
        
        // Ensure not already initialized
        assert!(!exists<StreamRegistry>(admin_addr), error_codes::already_initialized());
        
        // Validate fee rate (max 5% = 500 bps)
        assert!(fee_rate_bps <= 500, error_codes::invalid_amount());
        
        // Create stream registry
        move_to(admin, StreamRegistry {
            next_stream_id: 1,
            total_value_locked: 0,
            active_streams_count: 0,
            completed_streams_count: 0,
            fee_rate_bps,
            accumulated_fees: 0,
            admin: admin_addr,
            is_paused: false,
            stream_created_events: account::new_event_handle<StreamCreatedEvent>(admin),
            withdrawal_events: account::new_event_handle<WithdrawalEvent>(admin),
            status_change_events: account::new_event_handle<StatusChangeEvent>(admin),
        });
        
        // Create stream store
        move_to(admin, StreamStore {
            streams: vector::empty(),
        });

        // Create escrow account
        move_to(admin, StreamEscrow {
            funds: coin::zero<AptosCoin>(),
        });
    }

    // =========================================================================
    // STREAM CREATION
    // =========================================================================

    /// Create a new wage stream from employer to employee
    /// Funds are transferred to escrow immediately
    public entry fun create_stream(
        employer: &signer,
        registry_addr: address,
        employee: address,
        total_amount: u64,
        duration_seconds: u64,
        job_description: String,
    ) acquires StreamRegistry, StreamStore, EmployerStreams, EmployeeStreams, StreamEscrow {
        let employer_addr = signer::address_of(employer);
        
        // Validate registry exists
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        
        // Get mutable reference to registry
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        
        // Check protocol not paused
        assert!(!registry.is_paused, error_codes::protocol_paused());
        
        // Validate employee address
        assert!(employee != employer_addr, error_codes::invalid_address());
        assert!(employee != @0x0, error_codes::invalid_address());
        
        // Validate amount
        assert!(total_amount > 0, error_codes::invalid_amount());
        assert!(total_amount >= PRECISION, error_codes::amount_too_small());
        
        // Validate duration
        assert!(duration_seconds >= MIN_STREAM_DURATION, error_codes::duration_too_short());
        assert!(duration_seconds <= MAX_STREAM_DURATION, error_codes::duration_too_long());
        
        // Check employee stream limit
        if (exists<EmployeeStreams>(employee)) {
            let emp_streams = borrow_global<EmployeeStreams>(employee);
            assert!(
                vector::length(&emp_streams.active_stream_ids) < MAX_STREAMS_PER_EMPLOYEE,
                error_codes::too_many_streams()
            );
        };
        
        // Calculate rate per second
        let rate_per_second = (total_amount * PRECISION) / duration_seconds;
        assert!(rate_per_second > 0, error_codes::rate_too_low());
        
        // Get current time
        let current_time = timestamp::now_seconds();
        let end_time = current_time + duration_seconds;
        
        // Calculate fee
        let fee_amount = (total_amount * registry.fee_rate_bps) / 10000;
        let net_amount = total_amount - fee_amount;
        
        // Transfer funds from employer to escrow
        let payment = coin::withdraw<AptosCoin>(employer, total_amount);
        
        // Split fee if any
        if (fee_amount > 0) {
            let fee_coin = coin::extract(&mut payment, fee_amount);
            // Deposit fee to protocol admin
            coin::deposit(registry.admin, fee_coin);
            registry.accumulated_fees = registry.accumulated_fees + fee_amount;
        };
        
        // Add remaining to escrow
        let escrow = borrow_global_mut<StreamEscrow>(registry_addr);
        coin::merge(&mut escrow.funds, payment);
        
        // Create new stream
        let stream_id = registry.next_stream_id;
        let new_stream = WageStream {
            stream_id,
            employer: employer_addr,
            employee,
            rate_per_second,
            total_deposited: net_amount,
            total_withdrawn: 0,
            start_time: current_time,
            end_time,
            last_withdrawal_time: current_time,
            pause_time: 0,
            total_pause_duration: 0,
            status: STATUS_ACTIVE,
            job_description,
            compliance_verified: false,
        };
        
        // Store stream
        let store = borrow_global_mut<StreamStore>(registry_addr);
        vector::push_back(&mut store.streams, new_stream);
        
        // Update registry
        registry.next_stream_id = stream_id + 1;
        registry.total_value_locked = registry.total_value_locked + net_amount;
        registry.active_streams_count = registry.active_streams_count + 1;
        
        // Update employer streams
        if (!exists<EmployerStreams>(employer_addr)) {
            move_to(employer, EmployerStreams {
                stream_ids: vector::empty(),
                total_allocated: 0,
                total_disbursed: 0,
            });
        };
        let emp_streams = borrow_global_mut<EmployerStreams>(employer_addr);
        vector::push_back(&mut emp_streams.stream_ids, stream_id);
        emp_streams.total_allocated = emp_streams.total_allocated + net_amount;
        
        // Initialize or update employee streams
        if (!exists<EmployeeStreams>(employee)) {
            // Create a temporary signer capability would be needed here
            // For now, we'll track in registry
        } else {
            let employee_data = borrow_global_mut<EmployeeStreams>(employee);
            vector::push_back(&mut employee_data.active_stream_ids, stream_id);
        };
        
        // Emit event
        event::emit_event(
            &mut registry.stream_created_events,
            StreamCreatedEvent {
                stream_id,
                employer: employer_addr,
                employee,
                rate_per_second,
                total_amount: net_amount,
                start_time: current_time,
                end_time,
            }
        );
    }

    // =========================================================================
    // WITHDRAWALS
    // =========================================================================

    /// Withdraw accrued wages from a stream
    public entry fun withdraw_wages(
        employee: &signer,
        registry_addr: address,
        stream_id: u64,
    ) acquires StreamRegistry, StreamStore, EmployeeStreams, StreamEscrow {
        let employee_addr = signer::address_of(employee);
        
        // Validate registry
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        assert!(!registry.is_paused, error_codes::protocol_paused());
        
        // Get stream
        let store = borrow_global_mut<StreamStore>(registry_addr);
        let stream = get_stream_mut(&mut store.streams, stream_id);
        
        // Validate employee
        assert!(stream.employee == employee_addr, error_codes::unauthorized());
        
        // Check stream is active or paused (can withdraw if paused)
        assert!(
            stream.status == STATUS_ACTIVE || stream.status == STATUS_PAUSED,
            error_codes::stream_not_active()
        );
        
        // Calculate withdrawable amount
        let withdrawable = calculate_withdrawable_internal(stream);
        assert!(withdrawable > 0, error_codes::nothing_to_withdraw());
        
        // Update stream state
        let current_time = timestamp::now_seconds();
        stream.total_withdrawn = stream.total_withdrawn + withdrawable;
        stream.last_withdrawal_time = current_time;
        
        // Check if stream is complete
        if (stream.total_withdrawn >= stream.total_deposited) {
            stream.status = STATUS_COMPLETED;
            registry.active_streams_count = registry.active_streams_count - 1;
            registry.completed_streams_count = registry.completed_streams_count + 1;
        };
        
        // Update TVL
        registry.total_value_locked = registry.total_value_locked - withdrawable;
        
        // Transfer funds from escrow
        let escrow = borrow_global_mut<StreamEscrow>(registry_addr);
        let payment = coin::extract(&mut escrow.funds, withdrawable);
        coin::deposit(employee_addr, payment);
        
        // Update employee data if exists
        if (exists<EmployeeStreams>(employee_addr)) {
            let emp_data = borrow_global_mut<EmployeeStreams>(employee_addr);
            emp_data.total_withdrawals = emp_data.total_withdrawals + withdrawable;
            emp_data.last_activity = current_time;
        };
        
        // Emit event
        event::emit_event(
            &mut registry.withdrawal_events,
            WithdrawalEvent {
                stream_id,
                employee: employee_addr,
                amount: withdrawable,
                timestamp: current_time,
                remaining_balance: stream.total_deposited - stream.total_withdrawn,
            }
        );
    }

    /// Withdraw from all active streams for an employee
    public entry fun withdraw_all(
        employee: &signer,
        registry_addr: address,
    ) acquires StreamRegistry, StreamStore, EmployeeStreams, StreamEscrow {
        let employee_addr = signer::address_of(employee);
        
        assert!(exists<EmployeeStreams>(employee_addr), error_codes::no_active_streams());
        
        let emp_streams = borrow_global<EmployeeStreams>(employee_addr);
        let stream_ids = *&emp_streams.active_stream_ids;
        let len = vector::length(&stream_ids);
        
        let i = 0;
        while (i < len) {
            let stream_id = *vector::borrow(&stream_ids, i);
            // Use internal withdrawal that skips some checks
            withdraw_wages_internal(
                employee_addr,
                registry_addr,
                stream_id,
            );
            i = i + 1;
        };
    }

    /// Internal withdrawal function
    fun withdraw_wages_internal(
        employee_addr: address,
        registry_addr: address,
        stream_id: u64,
    ) acquires StreamRegistry, StreamStore, EmployeeStreams, StreamEscrow {
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        if (registry.is_paused) return;
        
        let store = borrow_global_mut<StreamStore>(registry_addr);
        
        // Find stream index
        let stream_index_opt = find_stream_index(&store.streams, stream_id);
        if (option::is_none(&stream_index_opt)) return;
        
        let stream_index = option::extract(&mut stream_index_opt);
        let stream = vector::borrow_mut(&mut store.streams, stream_index);
        
        if (stream.employee != employee_addr) return;
        if (stream.status != STATUS_ACTIVE && stream.status != STATUS_PAUSED) return;
        
        let withdrawable = calculate_withdrawable_internal(stream);
        if (withdrawable == 0) return;
        
        let current_time = timestamp::now_seconds();
        stream.total_withdrawn = stream.total_withdrawn + withdrawable;
        stream.last_withdrawal_time = current_time;
        
        if (stream.total_withdrawn >= stream.total_deposited) {
            stream.status = STATUS_COMPLETED;
            registry.active_streams_count = registry.active_streams_count - 1;
            registry.completed_streams_count = registry.completed_streams_count + 1;
        };
        
        registry.total_value_locked = registry.total_value_locked - withdrawable;
        
        let escrow = borrow_global_mut<StreamEscrow>(registry_addr);
        let payment = coin::extract(&mut escrow.funds, withdrawable);
        coin::deposit(employee_addr, payment);
        
        if (exists<EmployeeStreams>(employee_addr)) {
            let emp_data = borrow_global_mut<EmployeeStreams>(employee_addr);
            emp_data.total_withdrawals = emp_data.total_withdrawals + withdrawable;
            emp_data.last_activity = current_time;
        };
    }

    /// Find stream index by ID (returns Option<u64>)
    fun find_stream_index(streams: &vector<WageStream>, stream_id: u64): option::Option<u64> {
        let len = vector::length(streams);
        let i = 0;
        while (i < len) {
            let stream = vector::borrow(streams, i);
            if (stream.stream_id == stream_id) {
                return option::some(i)
            };
            i = i + 1;
        };
        option::none()
    }

    // =========================================================================
    // STREAM CONTROL
    // =========================================================================

    /// Pause a stream (only employer can pause)
    public entry fun pause_stream(
        employer: &signer,
        registry_addr: address,
        stream_id: u64,
    ) acquires StreamRegistry, StreamStore {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        
        let store = borrow_global_mut<StreamStore>(registry_addr);
        let stream = get_stream_mut(&mut store.streams, stream_id);
        
        // Validate employer
        assert!(stream.employer == employer_addr, error_codes::unauthorized());
        
        // Check stream is active
        assert!(stream.status == STATUS_ACTIVE, error_codes::stream_not_active());
        
        // Set pause state
        let current_time = timestamp::now_seconds();
        let old_status = stream.status;
        stream.status = STATUS_PAUSED;
        stream.pause_time = current_time;
        
        // Emit event
        event::emit_event(
            &mut registry.status_change_events,
            StatusChangeEvent {
                stream_id,
                old_status,
                new_status: STATUS_PAUSED,
                timestamp: current_time,
                changed_by: employer_addr,
            }
        );
    }

    /// Resume a paused stream
    public entry fun resume_stream(
        employer: &signer,
        registry_addr: address,
        stream_id: u64,
    ) acquires StreamRegistry, StreamStore {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        
        let store = borrow_global_mut<StreamStore>(registry_addr);
        let stream = get_stream_mut(&mut store.streams, stream_id);
        
        // Validate employer
        assert!(stream.employer == employer_addr, error_codes::unauthorized());
        
        // Check stream is paused
        assert!(stream.status == STATUS_PAUSED, error_codes::stream_not_paused());
        
        // Calculate pause duration
        let current_time = timestamp::now_seconds();
        let pause_duration = current_time - stream.pause_time;
        
        // Update stream
        let old_status = stream.status;
        stream.status = STATUS_ACTIVE;
        stream.total_pause_duration = stream.total_pause_duration + pause_duration;
        stream.pause_time = 0;
        stream.end_time = stream.end_time + pause_duration;
        
        // Emit event
        event::emit_event(
            &mut registry.status_change_events,
            StatusChangeEvent {
                stream_id,
                old_status,
                new_status: STATUS_ACTIVE,
                timestamp: current_time,
                changed_by: employer_addr,
            }
        );
    }

    /// Terminate a stream early (returns remaining funds to employer)
    public entry fun terminate_stream(
        caller: &signer,
        registry_addr: address,
        stream_id: u64,
    ) acquires StreamRegistry, StreamStore, StreamEscrow, EmployerStreams {
        let caller_addr = signer::address_of(caller);
        
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        
        let store = borrow_global_mut<StreamStore>(registry_addr);
        let stream = get_stream_mut(&mut store.streams, stream_id);
        
        // Only employer or admin can terminate
        assert!(
            stream.employer == caller_addr || registry.admin == caller_addr,
            error_codes::unauthorized()
        );
        
        // Can only terminate active or paused streams
        assert!(
            stream.status == STATUS_ACTIVE || stream.status == STATUS_PAUSED,
            error_codes::invalid_status()
        );
        
        // Calculate what's owed to employee
        let owed_to_employee = calculate_withdrawable_internal(stream);
        let remaining = stream.total_deposited - stream.total_withdrawn - owed_to_employee;
        
        let current_time = timestamp::now_seconds();
        let old_status = stream.status;
        
        // Update stream
        stream.status = STATUS_TERMINATED;
        stream.end_time = current_time;
        
        // Transfer owed amount to employee
        let escrow = borrow_global_mut<StreamEscrow>(registry_addr);
        
        if (owed_to_employee > 0) {
            let emp_payment = coin::extract(&mut escrow.funds, owed_to_employee);
            coin::deposit(stream.employee, emp_payment);
            stream.total_withdrawn = stream.total_withdrawn + owed_to_employee;
        };
        
        // Return remaining to employer
        if (remaining > 0) {
            let refund = coin::extract(&mut escrow.funds, remaining);
            coin::deposit(stream.employer, refund);
            
            if (exists<EmployerStreams>(stream.employer)) {
                let emp_data = borrow_global_mut<EmployerStreams>(stream.employer);
                emp_data.total_allocated = emp_data.total_allocated - remaining;
            };
        };
        
        // Update registry
        registry.active_streams_count = registry.active_streams_count - 1;
        registry.total_value_locked = registry.total_value_locked - owed_to_employee - remaining;
        
        // Emit event
        event::emit_event(
            &mut registry.status_change_events,
            StatusChangeEvent {
                stream_id,
                old_status,
                new_status: STATUS_TERMINATED,
                timestamp: current_time,
                changed_by: caller_addr,
            }
        );
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    #[view]
    /// Get current withdrawable balance for a stream
    public fun get_withdrawable_balance(
        registry_addr: address,
        stream_id: u64,
    ): u64 acquires StreamStore {
        let store = borrow_global<StreamStore>(registry_addr);
        let stream = get_stream(&store.streams, stream_id);
        calculate_withdrawable_internal(stream)
    }

    #[view]
    /// Get stream details
    public fun get_stream_info(
        registry_addr: address,
        stream_id: u64,
    ): (address, address, u64, u64, u64, u64, u64, u8) acquires StreamStore {
        let store = borrow_global<StreamStore>(registry_addr);
        let stream = get_stream(&store.streams, stream_id);
        (
            stream.employer,
            stream.employee,
            stream.rate_per_second,
            stream.total_deposited,
            stream.total_withdrawn,
            stream.start_time,
            stream.end_time,
            stream.status,
        )
    }

    #[view]
    /// Get registry statistics
    public fun get_registry_stats(
        registry_addr: address,
    ): (u64, u64, u64, u64) acquires StreamRegistry {
        let registry = borrow_global<StreamRegistry>(registry_addr);
        (
            registry.total_value_locked,
            registry.active_streams_count,
            registry.completed_streams_count,
            registry.accumulated_fees,
        )
    }

    #[view]
    /// Check if employee has active streams
    public fun has_active_streams(employee: address): bool acquires EmployeeStreams {
        if (!exists<EmployeeStreams>(employee)) {
            return false
        };
        let emp = borrow_global<EmployeeStreams>(employee);
        vector::length(&emp.active_stream_ids) > 0
    }

    // =========================================================================
    // INTERNAL HELPERS
    // =========================================================================

    /// Calculate withdrawable amount for a stream
    fun calculate_withdrawable_internal(stream: &WageStream): u64 {
        if (stream.status == STATUS_COMPLETED || stream.status == STATUS_TERMINATED) {
            return 0
        };
        
        let current_time = timestamp::now_seconds();
        let effective_time: u64;
        
        if (stream.status == STATUS_PAUSED) {
            effective_time = stream.pause_time;
        } else if (current_time > stream.end_time) {
            effective_time = stream.end_time;
        } else {
            effective_time = current_time;
        };
        
        // Calculate effective duration
        let start = stream.start_time;
        if (effective_time <= start) {
            return 0
        };
        
        let elapsed = effective_time - start - stream.total_pause_duration;
        
        // Calculate accrued amount
        let accrued = (elapsed * stream.rate_per_second) / PRECISION;
        
        // Cap at total deposited
        if (accrued > stream.total_deposited) {
            accrued = stream.total_deposited;
        };
        
        // Return withdrawable (accrued - already withdrawn)
        if (accrued > stream.total_withdrawn) {
            accrued - stream.total_withdrawn
        } else {
            0
        }
    }

    /// Get stream by ID (immutable)
    fun get_stream(streams: &vector<WageStream>, stream_id: u64): &WageStream {
        let len = vector::length(streams);
        let i = 0;
        while (i < len) {
            let stream = vector::borrow(streams, i);
            if (stream.stream_id == stream_id) {
                return stream
            };
            i = i + 1;
        };
        abort error_codes::stream_not_found()
    }

    /// Get stream by ID (mutable)
    fun get_stream_mut(streams: &mut vector<WageStream>, stream_id: u64): &mut WageStream {
        let len = vector::length(streams);
        let i = 0;
        while (i < len) {
            let stream = vector::borrow_mut(streams, i);
            if (stream.stream_id == stream_id) {
                return stream
            };
            i = i + 1;
        };
        abort error_codes::stream_not_found()
    }

    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================

    /// Update protocol fee rate (admin only)
    public entry fun update_fee_rate(
        admin: &signer,
        registry_addr: address,
        new_fee_rate_bps: u64,
    ) acquires StreamRegistry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        assert!(new_fee_rate_bps <= 500, error_codes::invalid_amount());
        
        registry.fee_rate_bps = new_fee_rate_bps;
    }

    /// Emergency pause protocol (admin only)
    public entry fun emergency_pause(
        admin: &signer,
        registry_addr: address,
    ) acquires StreamRegistry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        registry.is_paused = true;
    }

    /// Resume protocol from emergency pause (admin only)
    public entry fun emergency_resume(
        admin: &signer,
        registry_addr: address,
    ) acquires StreamRegistry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        registry.is_paused = false;
    }

    /// Transfer admin role (admin only)
    public entry fun transfer_admin(
        admin: &signer,
        registry_addr: address,
        new_admin: address,
    ) acquires StreamRegistry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<StreamRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        assert!(new_admin != @0x0, error_codes::invalid_address());
        
        registry.admin = new_admin;
    }

    // =========================================================================
    // COMPLIANCE INTEGRATION
    // =========================================================================

    /// Mark stream as compliance verified (called by compliance module)
    public fun mark_compliance_verified(
        registry_addr: address,
        stream_id: u64,
    ) acquires StreamStore {
        let store = borrow_global_mut<StreamStore>(registry_addr);
        let stream = get_stream_mut(&mut store.streams, stream_id);
        stream.compliance_verified = true;
    }

    /// Set stream to disputed status (called by disputes module)
    public fun set_disputed_status(
        registry_addr: address,
        stream_id: u64,
    ) acquires StreamStore, StreamRegistry {
        let registry = borrow_global_mut<StreamRegistry>(registry_addr);
        let store = borrow_global_mut<StreamStore>(registry_addr);
        let stream = get_stream_mut(&mut store.streams, stream_id);
        
        let old_status = stream.status;
        stream.status = STATUS_DISPUTED;
        
        event::emit_event(
            &mut registry.status_change_events,
            StatusChangeEvent {
                stream_id,
                old_status,
                new_status: STATUS_DISPUTED,
                timestamp: timestamp::now_seconds(),
                changed_by: @0x0, // System action
            }
        );
    }
}
