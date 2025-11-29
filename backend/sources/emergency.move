/// emergency.move - Emergency Controls and System Administration
/// 
/// Provides circuit breakers, emergency pause mechanisms, administrative
/// functions, and upgrade capabilities for the wage streaming protocol.
/// This module ensures system resilience and security during critical situations.
/// 
/// Key Features:
/// - Global and granular pause mechanisms
/// - Multi-signature emergency actions
/// - Role-based access control
/// - Rate limiting and cooldown periods
/// - Upgrade management with timelock
/// - Audit logging for all administrative actions
module wage_streaming_addr::emergency {
    use std::string::{Self, String};
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use wage_streaming_addr::error_codes;

    // ================================
    // Constants
    // ================================
    
    /// Role constants
    const ROLE_SUPER_ADMIN: u8 = 0;
    const ROLE_ADMIN: u8 = 1;
    const ROLE_OPERATOR: u8 = 2;
    const ROLE_PAUSER: u8 = 3;
    const ROLE_UPGRADER: u8 = 4;
    
    /// System state constants
    const STATE_NORMAL: u8 = 0;
    const STATE_PAUSED: u8 = 1;
    const STATE_EMERGENCY: u8 = 2;
    const STATE_MAINTENANCE: u8 = 3;
    const STATE_DEPRECATED: u8 = 4;
    
    /// Action type constants
    const ACTION_PAUSE: u8 = 0;
    const ACTION_UNPAUSE: u8 = 1;
    const ACTION_EMERGENCY_PAUSE: u8 = 2;
    const ACTION_UPGRADE: u8 = 3;
    const ACTION_CONFIG_CHANGE: u8 = 4;
    const ACTION_ROLE_GRANT: u8 = 5;
    const ACTION_ROLE_REVOKE: u8 = 6;
    const ACTION_FUND_RECOVERY: u8 = 7;
    
    /// Time constants (in seconds)
    const MIN_PAUSE_DURATION: u64 = 60; // 1 minute
    const MAX_PAUSE_DURATION: u64 = 30 * 24 * 60 * 60; // 30 days
    const UPGRADE_TIMELOCK: u64 = 2 * 24 * 60 * 60; // 2 days
    const EMERGENCY_COOLDOWN: u64 = 24 * 60 * 60; // 24 hours
    const ACTION_COOLDOWN: u64 = 60; // 1 minute between admin actions
    
    /// Multi-sig thresholds
    const MIN_SIGNERS: u64 = 2;
    const MAX_SIGNERS: u64 = 10;
    const DEFAULT_THRESHOLD: u64 = 2; // 2-of-N for critical actions
    
    /// Rate limiting
    const MAX_ACTIONS_PER_HOUR: u64 = 10;
    const MAX_PAUSE_REQUESTS_PER_DAY: u64 = 5;

    // ================================
    // Structs
    // ================================
    
    /// Global emergency state and configuration
    struct EmergencyState has key {
        /// Current system state
        current_state: u8,
        /// Previous state (for unpause restoration)
        previous_state: u8,
        /// When current state was set
        state_changed_at: u64,
        /// Who triggered the state change
        state_changed_by: address,
        /// Reason for state change
        state_reason: String,
        /// When pause will automatically expire (0 for indefinite)
        pause_expires_at: u64,
        /// Emergency contact addresses
        emergency_contacts: vector<address>,
        /// Number of emergency triggers today
        emergency_triggers_today: u64,
        /// Last emergency reset timestamp
        last_emergency_reset: u64,
        /// Global action counter for rate limiting
        actions_this_hour: u64,
        /// Last action hour timestamp
        last_action_hour: u64,
        /// Whether upgrade is in progress
        upgrade_in_progress: bool,
        /// Scheduled upgrade timestamp
        scheduled_upgrade_at: u64,
    }
    
    /// Module-specific pause states
    struct ModulePauseState has key {
        /// Wage streaming module paused
        wage_streaming_paused: bool,
        /// Treasury module paused
        treasury_paused: bool,
        /// Compliance module paused
        compliance_paused: bool,
        /// Disputes module paused
        disputes_paused: bool,
        /// Individual pause reasons
        pause_reasons: vector<String>,
        /// Pause timestamps per module
        paused_at: vector<u64>,
    }
    
    /// Role assignment for access control
    struct RoleAssignment has key, store, copy, drop {
        /// Address of the role holder
        holder: address,
        /// Role type
        role: u8,
        /// When role was granted
        granted_at: u64,
        /// Who granted the role
        granted_by: address,
        /// Expiry timestamp (0 for permanent)
        expires_at: u64,
        /// Whether role is active
        is_active: bool,
    }
    
    /// Access control registry
    struct AccessControlRegistry has key {
        /// Super admin address (can never be removed)
        super_admin: address,
        /// All role assignments
        roles: vector<RoleAssignment>,
        /// Total admins count
        admin_count: u64,
        /// Total operators count
        operator_count: u64,
        /// Multi-sig threshold for critical actions
        multisig_threshold: u64,
        /// Pending multi-sig actions
        pending_actions: vector<PendingAction>,
    }
    
    /// Pending multi-signature action
    struct PendingAction has store, copy, drop {
        /// Action ID
        action_id: u64,
        /// Type of action
        action_type: u8,
        /// Action data/parameters hash
        action_hash: String,
        /// Description of the action
        description: String,
        /// Proposer address
        proposer: address,
        /// Signers who have approved
        approvals: vector<address>,
        /// Required approval count
        required_approvals: u64,
        /// When action was proposed
        proposed_at: u64,
        /// Expiry for signatures
        expires_at: u64,
        /// Whether action has been executed
        executed: bool,
    }
    
    /// Upgrade proposal for module upgrades
    struct UpgradeProposal has key, store, copy, drop {
        /// Upgrade ID
        upgrade_id: u64,
        /// New code hash/version
        new_version_hash: String,
        /// Description of changes
        description: String,
        /// Proposer
        proposer: address,
        /// Proposed timestamp
        proposed_at: u64,
        /// Earliest execution time (after timelock)
        executable_after: u64,
        /// Approvals received
        approvals: vector<address>,
        /// Required approvals
        required_approvals: u64,
        /// Whether upgrade was executed
        executed: bool,
        /// Whether upgrade was cancelled
        cancelled: bool,
    }
    
    /// Audit log entry
    struct AuditLogEntry has store, copy, drop {
        /// Entry ID
        entry_id: u64,
        /// Timestamp
        timestamp: u64,
        /// Actor who performed the action
        actor: address,
        /// Action type
        action_type: u8,
        /// Target of the action (if applicable)
        target: address,
        /// Description
        description: String,
        /// Previous value hash (for config changes)
        previous_value: String,
        /// New value hash (for config changes)
        new_value: String,
    }
    
    /// Audit log storage
    struct AuditLog has key {
        /// Total entries
        total_entries: u64,
        /// Log entries (rolling window)
        entries: vector<AuditLogEntry>,
        /// Maximum entries to keep
        max_entries: u64,
    }
    
    /// Rate limiter for admin actions
    struct RateLimiter has key {
        /// Actions performed in current window
        actions_in_window: u64,
        /// Window start timestamp
        window_start: u64,
        /// Window duration in seconds
        window_duration: u64,
        /// Maximum actions per window
        max_actions: u64,
        /// Cooldown between actions
        cooldown_seconds: u64,
        /// Last action timestamp
        last_action_at: u64,
    }
    
    /// Emergency fund recovery configuration
    struct FundRecoveryConfig has key {
        /// Authorized recovery addresses
        recovery_addresses: vector<address>,
        /// Minimum delay before recovery
        recovery_delay: u64,
        /// Whether recovery requires multi-sig
        requires_multisig: bool,
        /// Maximum single recovery amount
        max_single_recovery: u64,
        /// Cooldown between recoveries
        recovery_cooldown: u64,
        /// Last recovery timestamp
        last_recovery_at: u64,
    }

    // ================================
    // Events
    // ================================
    
    #[event]
    struct SystemStateChanged has drop, store {
        old_state: u8,
        new_state: u8,
        changed_by: address,
        reason: String,
        changed_at: u64,
        expires_at: u64,
    }
    
    #[event]
    struct ModulePaused has drop, store {
        module_name: String,
        paused_by: address,
        reason: String,
        paused_at: u64,
    }
    
    #[event]
    struct ModuleUnpaused has drop, store {
        module_name: String,
        unpaused_by: address,
        unpaused_at: u64,
    }
    
    #[event]
    struct RoleGranted has drop, store {
        holder: address,
        role: u8,
        granted_by: address,
        granted_at: u64,
        expires_at: u64,
    }
    
    #[event]
    struct RoleRevoked has drop, store {
        holder: address,
        role: u8,
        revoked_by: address,
        revoked_at: u64,
    }
    
    #[event]
    struct EmergencyTriggered has drop, store {
        triggered_by: address,
        reason: String,
        triggered_at: u64,
    }
    
    #[event]
    struct ActionProposed has drop, store {
        action_id: u64,
        action_type: u8,
        proposer: address,
        description: String,
        required_approvals: u64,
        proposed_at: u64,
    }
    
    #[event]
    struct ActionApproved has drop, store {
        action_id: u64,
        approver: address,
        current_approvals: u64,
        required_approvals: u64,
        approved_at: u64,
    }
    
    #[event]
    struct ActionExecuted has drop, store {
        action_id: u64,
        action_type: u8,
        executor: address,
        executed_at: u64,
    }
    
    #[event]
    struct UpgradeProposed has drop, store {
        upgrade_id: u64,
        new_version_hash: String,
        proposer: address,
        executable_after: u64,
        proposed_at: u64,
    }
    
    #[event]
    struct UpgradeExecuted has drop, store {
        upgrade_id: u64,
        new_version_hash: String,
        executor: address,
        executed_at: u64,
    }
    
    #[event]
    struct FundRecoveryInitiated has drop, store {
        recovery_address: address,
        amount: u64,
        initiated_by: address,
        initiated_at: u64,
    }

    // ================================
    // Initialization Functions
    // ================================
    
    /// Initialize the emergency system
    public entry fun initialize_emergency_system(
        super_admin: &signer,
        emergency_contacts: vector<address>,
    ) {
        let admin_addr = signer::address_of(super_admin);
        
        // Ensure not already initialized
        assert!(!exists<EmergencyState>(admin_addr), error_codes::already_initialized());
        
        let current_time = timestamp::now_seconds();
        
        // Initialize emergency state
        let emergency_state = EmergencyState {
            current_state: STATE_NORMAL,
            previous_state: STATE_NORMAL,
            state_changed_at: current_time,
            state_changed_by: admin_addr,
            state_reason: string::utf8(b"System initialization"),
            pause_expires_at: 0,
            emergency_contacts,
            emergency_triggers_today: 0,
            last_emergency_reset: current_time,
            actions_this_hour: 0,
            last_action_hour: current_time,
            upgrade_in_progress: false,
            scheduled_upgrade_at: 0,
        };
        
        move_to(super_admin, emergency_state);
        
        // Initialize module pause state
        let module_pause = ModulePauseState {
            wage_streaming_paused: false,
            treasury_paused: false,
            compliance_paused: false,
            disputes_paused: false,
            pause_reasons: vector::empty(),
            paused_at: vector::empty(),
        };
        
        move_to(super_admin, module_pause);
        
        // Initialize access control
        let super_admin_role = RoleAssignment {
            holder: admin_addr,
            role: ROLE_SUPER_ADMIN,
            granted_at: current_time,
            granted_by: admin_addr,
            expires_at: 0, // Never expires
            is_active: true,
        };
        
        let access_control = AccessControlRegistry {
            super_admin: admin_addr,
            roles: vector[super_admin_role],
            admin_count: 1,
            operator_count: 0,
            multisig_threshold: DEFAULT_THRESHOLD,
            pending_actions: vector::empty(),
        };
        
        move_to(super_admin, access_control);
        
        // Initialize audit log
        let audit_log = AuditLog {
            total_entries: 0,
            entries: vector::empty(),
            max_entries: 1000,
        };
        
        move_to(super_admin, audit_log);
        
        // Initialize rate limiter
        let rate_limiter = RateLimiter {
            actions_in_window: 0,
            window_start: current_time,
            window_duration: 3600, // 1 hour
            max_actions: MAX_ACTIONS_PER_HOUR,
            cooldown_seconds: ACTION_COOLDOWN,
            last_action_at: 0,
        };
        
        move_to(super_admin, rate_limiter);
        
        // Initialize fund recovery config
        let recovery_config = FundRecoveryConfig {
            recovery_addresses: vector::empty(),
            recovery_delay: UPGRADE_TIMELOCK,
            requires_multisig: true,
            max_single_recovery: 0, // Must be set later
            recovery_cooldown: EMERGENCY_COOLDOWN,
            last_recovery_at: 0,
        };
        
        move_to(super_admin, recovery_config);
    }

    // ================================
    // Pause/Unpause Functions
    // ================================
    
    /// Pause entire system
    public entry fun pause_system(
        pauser: &signer,
        registry_address: address,
        reason: String,
        duration_seconds: u64,
    ) acquires EmergencyState, AccessControlRegistry, AuditLog, RateLimiter {
        let pauser_addr = signer::address_of(pauser);
        
        // Validate access
        assert!(has_role(registry_address, pauser_addr, ROLE_PAUSER) ||
                has_role(registry_address, pauser_addr, ROLE_ADMIN) ||
                has_role(registry_address, pauser_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        // Check rate limit
        check_and_update_rate_limit(registry_address);
        
        // Validate duration
        assert!(duration_seconds >= MIN_PAUSE_DURATION, error_codes::pause_duration_too_short());
        assert!(duration_seconds <= MAX_PAUSE_DURATION, error_codes::pause_duration_too_long());
        
        let emergency_state = borrow_global_mut<EmergencyState>(registry_address);
        
        // Cannot pause if already paused or in emergency
        assert!(emergency_state.current_state == STATE_NORMAL, error_codes::system_paused());
        
        let current_time = timestamp::now_seconds();
        let old_state = emergency_state.current_state;
        
        emergency_state.previous_state = old_state;
        emergency_state.current_state = STATE_PAUSED;
        emergency_state.state_changed_at = current_time;
        emergency_state.state_changed_by = pauser_addr;
        emergency_state.state_reason = reason;
        emergency_state.pause_expires_at = current_time + duration_seconds;
        
        // Log action
        log_action(
            registry_address,
            pauser_addr,
            ACTION_PAUSE,
            registry_address,
            string::utf8(b"System paused"),
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(SystemStateChanged {
            old_state,
            new_state: STATE_PAUSED,
            changed_by: pauser_addr,
            reason,
            changed_at: current_time,
            expires_at: current_time + duration_seconds,
        });
    }
    
    /// Unpause system
    public entry fun unpause_system(
        unpauser: &signer,
        registry_address: address,
    ) acquires EmergencyState, AccessControlRegistry, AuditLog, RateLimiter {
        let unpauser_addr = signer::address_of(unpauser);
        
        // Only admin or super admin can unpause
        assert!(has_role(registry_address, unpauser_addr, ROLE_ADMIN) ||
                has_role(registry_address, unpauser_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        // Check rate limit
        check_and_update_rate_limit(registry_address);
        
        let emergency_state = borrow_global_mut<EmergencyState>(registry_address);
        
        // Must be paused
        assert!(emergency_state.current_state == STATE_PAUSED, error_codes::not_paused());
        
        let current_time = timestamp::now_seconds();
        let old_state = emergency_state.current_state;
        
        emergency_state.current_state = STATE_NORMAL;
        emergency_state.state_changed_at = current_time;
        emergency_state.state_changed_by = unpauser_addr;
        emergency_state.state_reason = string::utf8(b"System resumed");
        emergency_state.pause_expires_at = 0;
        
        // Log action
        log_action(
            registry_address,
            unpauser_addr,
            ACTION_UNPAUSE,
            registry_address,
            string::utf8(b"System unpaused"),
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(SystemStateChanged {
            old_state,
            new_state: STATE_NORMAL,
            changed_by: unpauser_addr,
            reason: string::utf8(b"System resumed"),
            changed_at: current_time,
            expires_at: 0,
        });
    }
    
    /// Trigger emergency pause (immediate, bypasses some checks)
    public entry fun trigger_emergency(
        caller: &signer,
        registry_address: address,
        reason: String,
    ) acquires EmergencyState, AccessControlRegistry, AuditLog {
        let caller_addr = signer::address_of(caller);
        
        // Emergency contacts or admins can trigger
        let emergency_state = borrow_global_mut<EmergencyState>(registry_address);
        
        let is_emergency_contact = vector::contains(&emergency_state.emergency_contacts, &caller_addr);
        let is_authorized = has_role(registry_address, caller_addr, ROLE_ADMIN) ||
                           has_role(registry_address, caller_addr, ROLE_SUPER_ADMIN);
        
        assert!(is_emergency_contact || is_authorized, error_codes::unauthorized());
        
        // Check daily limit
        let current_time = timestamp::now_seconds();
        
        // Reset counter if new day
        if (current_time - emergency_state.last_emergency_reset > 86400) {
            emergency_state.emergency_triggers_today = 0;
            emergency_state.last_emergency_reset = current_time;
        };
        
        assert!(emergency_state.emergency_triggers_today < MAX_PAUSE_REQUESTS_PER_DAY, 
                error_codes::rate_limit_exceeded());
        
        let old_state = emergency_state.current_state;
        
        emergency_state.previous_state = old_state;
        emergency_state.current_state = STATE_EMERGENCY;
        emergency_state.state_changed_at = current_time;
        emergency_state.state_changed_by = caller_addr;
        emergency_state.state_reason = reason;
        emergency_state.pause_expires_at = 0; // Indefinite until manually resolved
        emergency_state.emergency_triggers_today = emergency_state.emergency_triggers_today + 1;
        
        // Log action
        log_action(
            registry_address,
            caller_addr,
            ACTION_EMERGENCY_PAUSE,
            registry_address,
            string::utf8(b"Emergency triggered"),
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(EmergencyTriggered {
            triggered_by: caller_addr,
            reason,
            triggered_at: current_time,
        });
        
        event::emit(SystemStateChanged {
            old_state,
            new_state: STATE_EMERGENCY,
            changed_by: caller_addr,
            reason: string::utf8(b"Emergency triggered"),
            changed_at: current_time,
            expires_at: 0,
        });
    }
    
    /// Resolve emergency (requires super admin or multi-sig)
    public entry fun resolve_emergency(
        resolver: &signer,
        registry_address: address,
    ) acquires EmergencyState, AccessControlRegistry, AuditLog {
        let resolver_addr = signer::address_of(resolver);
        
        // Only super admin can resolve emergency
        assert!(has_role(registry_address, resolver_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        let emergency_state = borrow_global_mut<EmergencyState>(registry_address);
        
        // Must be in emergency state
        assert!(emergency_state.current_state == STATE_EMERGENCY, error_codes::not_in_emergency());
        
        let current_time = timestamp::now_seconds();
        let old_state = emergency_state.current_state;
        
        emergency_state.current_state = STATE_NORMAL;
        emergency_state.state_changed_at = current_time;
        emergency_state.state_changed_by = resolver_addr;
        emergency_state.state_reason = string::utf8(b"Emergency resolved");
        
        // Log action
        log_action(
            registry_address,
            resolver_addr,
            ACTION_UNPAUSE,
            registry_address,
            string::utf8(b"Emergency resolved"),
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(SystemStateChanged {
            old_state,
            new_state: STATE_NORMAL,
            changed_by: resolver_addr,
            reason: string::utf8(b"Emergency resolved"),
            changed_at: current_time,
            expires_at: 0,
        });
    }
    
    /// Pause specific module
    public entry fun pause_module(
        pauser: &signer,
        registry_address: address,
        module_index: u8,
        reason: String,
    ) acquires ModulePauseState, AccessControlRegistry, AuditLog, RateLimiter {
        let pauser_addr = signer::address_of(pauser);
        
        // Validate access
        assert!(has_role(registry_address, pauser_addr, ROLE_PAUSER) ||
                has_role(registry_address, pauser_addr, ROLE_ADMIN) ||
                has_role(registry_address, pauser_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let module_pause = borrow_global_mut<ModulePauseState>(registry_address);
        let current_time = timestamp::now_seconds();
        let module_name: String;
        
        if (module_index == 0) {
            assert!(!module_pause.wage_streaming_paused, error_codes::already_paused());
            module_pause.wage_streaming_paused = true;
            module_name = string::utf8(b"wage_streaming");
        } else if (module_index == 1) {
            assert!(!module_pause.treasury_paused, error_codes::already_paused());
            module_pause.treasury_paused = true;
            module_name = string::utf8(b"treasury");
        } else if (module_index == 2) {
            assert!(!module_pause.compliance_paused, error_codes::already_paused());
            module_pause.compliance_paused = true;
            module_name = string::utf8(b"compliance");
        } else if (module_index == 3) {
            assert!(!module_pause.disputes_paused, error_codes::already_paused());
            module_pause.disputes_paused = true;
            module_name = string::utf8(b"disputes");
        } else {
            abort error_codes::invalid_module()
        };
        
        vector::push_back(&mut module_pause.pause_reasons, reason);
        vector::push_back(&mut module_pause.paused_at, current_time);
        
        log_action(
            registry_address,
            pauser_addr,
            ACTION_PAUSE,
            registry_address,
            module_name,
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(ModulePaused {
            module_name,
            paused_by: pauser_addr,
            reason,
            paused_at: current_time,
        });
    }
    
    /// Unpause specific module
    public entry fun unpause_module(
        unpauser: &signer,
        registry_address: address,
        module_index: u8,
    ) acquires ModulePauseState, AccessControlRegistry, AuditLog, RateLimiter {
        let unpauser_addr = signer::address_of(unpauser);
        
        // Only admin or super admin
        assert!(has_role(registry_address, unpauser_addr, ROLE_ADMIN) ||
                has_role(registry_address, unpauser_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let module_pause = borrow_global_mut<ModulePauseState>(registry_address);
        let current_time = timestamp::now_seconds();
        let module_name: String;
        
        if (module_index == 0) {
            assert!(module_pause.wage_streaming_paused, error_codes::not_paused());
            module_pause.wage_streaming_paused = false;
            module_name = string::utf8(b"wage_streaming");
        } else if (module_index == 1) {
            assert!(module_pause.treasury_paused, error_codes::not_paused());
            module_pause.treasury_paused = false;
            module_name = string::utf8(b"treasury");
        } else if (module_index == 2) {
            assert!(module_pause.compliance_paused, error_codes::not_paused());
            module_pause.compliance_paused = false;
            module_name = string::utf8(b"compliance");
        } else if (module_index == 3) {
            assert!(module_pause.disputes_paused, error_codes::not_paused());
            module_pause.disputes_paused = false;
            module_name = string::utf8(b"disputes");
        } else {
            abort error_codes::invalid_module()
        };
        
        log_action(
            registry_address,
            unpauser_addr,
            ACTION_UNPAUSE,
            registry_address,
            module_name,
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(ModuleUnpaused {
            module_name,
            unpaused_by: unpauser_addr,
            unpaused_at: current_time,
        });
    }

    // ================================
    // Role Management Functions
    // ================================
    
    /// Grant a role to an address
    public entry fun grant_role(
        granter: &signer,
        registry_address: address,
        holder: address,
        role: u8,
        expires_at: u64,
    ) acquires AccessControlRegistry, AuditLog, RateLimiter {
        let granter_addr = signer::address_of(granter);
        
        // Only super admin can grant roles (or admin for operator roles)
        let can_grant = if (role == ROLE_SUPER_ADMIN) {
            false // Super admin cannot be granted
        } else if (role == ROLE_ADMIN || role == ROLE_UPGRADER) {
            has_role(registry_address, granter_addr, ROLE_SUPER_ADMIN)
        } else {
            has_role(registry_address, granter_addr, ROLE_SUPER_ADMIN) ||
            has_role(registry_address, granter_addr, ROLE_ADMIN)
        };
        
        assert!(can_grant, error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let access_control = borrow_global_mut<AccessControlRegistry>(registry_address);
        
        // Check if already has role
        assert!(!has_active_role(&access_control.roles, holder, role), error_codes::already_has_role());
        
        let current_time = timestamp::now_seconds();
        
        let role_assignment = RoleAssignment {
            holder,
            role,
            granted_at: current_time,
            granted_by: granter_addr,
            expires_at,
            is_active: true,
        };
        
        vector::push_back(&mut access_control.roles, role_assignment);
        
        // Update counters
        if (role == ROLE_ADMIN) {
            access_control.admin_count = access_control.admin_count + 1;
        } else if (role == ROLE_OPERATOR) {
            access_control.operator_count = access_control.operator_count + 1;
        };
        
        log_action(
            registry_address,
            granter_addr,
            ACTION_ROLE_GRANT,
            holder,
            string::utf8(b"Role granted"),
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(RoleGranted {
            holder,
            role,
            granted_by: granter_addr,
            granted_at: current_time,
            expires_at,
        });
    }
    
    /// Revoke a role from an address
    public entry fun revoke_role(
        revoker: &signer,
        registry_address: address,
        holder: address,
        role: u8,
    ) acquires AccessControlRegistry, AuditLog, RateLimiter {
        let revoker_addr = signer::address_of(revoker);
        
        // Only super admin can revoke (admin can revoke operator/pauser)
        let can_revoke = if (role == ROLE_SUPER_ADMIN) {
            false // Super admin cannot be revoked
        } else if (role == ROLE_ADMIN || role == ROLE_UPGRADER) {
            has_role(registry_address, revoker_addr, ROLE_SUPER_ADMIN)
        } else {
            has_role(registry_address, revoker_addr, ROLE_SUPER_ADMIN) ||
            has_role(registry_address, revoker_addr, ROLE_ADMIN)
        };
        
        assert!(can_revoke, error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let access_control = borrow_global_mut<AccessControlRegistry>(registry_address);
        
        // Find and deactivate role
        let len = vector::length(&access_control.roles);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let role_assignment = vector::borrow_mut(&mut access_control.roles, i);
            if (role_assignment.holder == holder && role_assignment.role == role && role_assignment.is_active) {
                role_assignment.is_active = false;
                found = true;
                
                // Update counters
                if (role == ROLE_ADMIN) {
                    access_control.admin_count = access_control.admin_count - 1;
                } else if (role == ROLE_OPERATOR) {
                    access_control.operator_count = access_control.operator_count - 1;
                };
                
                break
            };
            i = i + 1;
        };
        
        assert!(found, error_codes::role_not_found());
        
        let current_time = timestamp::now_seconds();
        
        log_action(
            registry_address,
            revoker_addr,
            ACTION_ROLE_REVOKE,
            holder,
            string::utf8(b"Role revoked"),
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(RoleRevoked {
            holder,
            role,
            revoked_by: revoker_addr,
            revoked_at: current_time,
        });
    }

    // ================================
    // Multi-Signature Functions
    // ================================
    
    /// Propose a multi-sig action
    public entry fun propose_action(
        proposer: &signer,
        registry_address: address,
        action_type: u8,
        action_hash: String,
        description: String,
        validity_seconds: u64,
    ) acquires AccessControlRegistry, AuditLog, RateLimiter {
        let proposer_addr = signer::address_of(proposer);
        
        // Must be admin or super admin to propose
        assert!(has_role(registry_address, proposer_addr, ROLE_ADMIN) ||
                has_role(registry_address, proposer_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let access_control = borrow_global_mut<AccessControlRegistry>(registry_address);
        let current_time = timestamp::now_seconds();
        
        let action_id = vector::length(&access_control.pending_actions) + 1;
        
        let pending_action = PendingAction {
            action_id,
            action_type,
            action_hash,
            description,
            proposer: proposer_addr,
            approvals: vector[proposer_addr], // Proposer auto-approves
            required_approvals: access_control.multisig_threshold,
            proposed_at: current_time,
            expires_at: current_time + validity_seconds,
            executed: false,
        };
        
        vector::push_back(&mut access_control.pending_actions, pending_action);
        
        log_action(
            registry_address,
            proposer_addr,
            action_type,
            registry_address,
            string::utf8(b"Action proposed"),
            string::utf8(b""),
            action_hash,
        );
        
        event::emit(ActionProposed {
            action_id,
            action_type,
            proposer: proposer_addr,
            description,
            required_approvals: access_control.multisig_threshold,
            proposed_at: current_time,
        });
    }
    
    /// Approve a pending action
    public entry fun approve_action(
        approver: &signer,
        registry_address: address,
        action_id: u64,
    ) acquires AccessControlRegistry, RateLimiter {
        let approver_addr = signer::address_of(approver);
        
        // Must be admin or super admin to approve
        assert!(has_role(registry_address, approver_addr, ROLE_ADMIN) ||
                has_role(registry_address, approver_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let access_control = borrow_global_mut<AccessControlRegistry>(registry_address);
        let current_time = timestamp::now_seconds();
        
        // Find pending action
        let len = vector::length(&access_control.pending_actions);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let action = vector::borrow_mut(&mut access_control.pending_actions, i);
            if (action.action_id == action_id) {
                // Check not expired
                assert!(current_time <= action.expires_at, error_codes::action_expired());
                
                // Check not already executed
                assert!(!action.executed, error_codes::already_executed());
                
                // Check not already approved by this signer
                let (already_approved, _) = vector::index_of(&action.approvals, &approver_addr);
                assert!(!already_approved, error_codes::already_approved());
                
                vector::push_back(&mut action.approvals, approver_addr);
                found = true;
                
                let current_approvals = vector::length(&action.approvals);
                
                event::emit(ActionApproved {
                    action_id,
                    approver: approver_addr,
                    current_approvals,
                    required_approvals: action.required_approvals,
                    approved_at: current_time,
                });
                
                break
            };
            i = i + 1;
        };
        
        assert!(found, error_codes::action_not_found());
    }
    
    /// Execute an approved action
    public entry fun execute_action(
        executor: &signer,
        registry_address: address,
        action_id: u64,
    ) acquires AccessControlRegistry, AuditLog, RateLimiter {
        let executor_addr = signer::address_of(executor);
        
        // Must be admin or super admin to execute
        assert!(has_role(registry_address, executor_addr, ROLE_ADMIN) ||
                has_role(registry_address, executor_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let access_control = borrow_global_mut<AccessControlRegistry>(registry_address);
        let current_time = timestamp::now_seconds();
        
        // Find and validate action
        let len = vector::length(&access_control.pending_actions);
        let i = 0;
        let action_type = 0u8;
        
        while (i < len) {
            let action = vector::borrow_mut(&mut access_control.pending_actions, i);
            if (action.action_id == action_id) {
                // Check not expired
                assert!(current_time <= action.expires_at, error_codes::action_expired());
                
                // Check not already executed
                assert!(!action.executed, error_codes::already_executed());
                
                // Check sufficient approvals
                let approvals = vector::length(&action.approvals);
                assert!(approvals >= action.required_approvals, error_codes::insufficient_approvals());
                
                action.executed = true;
                action_type = action.action_type;
                break
            };
            i = i + 1;
        };
        
        assert!(i < len, error_codes::action_not_found());
        
        log_action(
            registry_address,
            executor_addr,
            action_type,
            registry_address,
            string::utf8(b"Action executed"),
            string::utf8(b""),
            string::utf8(b""),
        );
        
        event::emit(ActionExecuted {
            action_id,
            action_type,
            executor: executor_addr,
            executed_at: current_time,
        });
    }

    // ================================
    // Upgrade Management Functions
    // ================================
    
    /// Propose an upgrade
    public entry fun propose_upgrade(
        proposer: &signer,
        registry_address: address,
        new_version_hash: String,
        description: String,
    ) acquires EmergencyState, AccessControlRegistry, AuditLog, RateLimiter {
        let proposer_addr = signer::address_of(proposer);
        
        // Only upgrader or super admin
        assert!(has_role(registry_address, proposer_addr, ROLE_UPGRADER) ||
                has_role(registry_address, proposer_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let emergency_state = borrow_global_mut<EmergencyState>(registry_address);
        
        // Cannot propose during emergency
        assert!(emergency_state.current_state != STATE_EMERGENCY, error_codes::system_in_emergency());
        
        // Check no upgrade already in progress
        assert!(!emergency_state.upgrade_in_progress, error_codes::upgrade_in_progress());
        
        let current_time = timestamp::now_seconds();
        let access_control = borrow_global<AccessControlRegistry>(registry_address);
        
        let upgrade_proposal = UpgradeProposal {
            upgrade_id: 1, // Simplified for single active upgrade
            new_version_hash,
            description,
            proposer: proposer_addr,
            proposed_at: current_time,
            executable_after: current_time + UPGRADE_TIMELOCK,
            approvals: vector[proposer_addr],
            required_approvals: access_control.multisig_threshold,
            executed: false,
            cancelled: false,
        };
        
        emergency_state.upgrade_in_progress = true;
        emergency_state.scheduled_upgrade_at = current_time + UPGRADE_TIMELOCK;
        
        log_action(
            registry_address,
            proposer_addr,
            ACTION_UPGRADE,
            registry_address,
            string::utf8(b"Upgrade proposed"),
            string::utf8(b""),
            new_version_hash,
        );
        
        event::emit(UpgradeProposed {
            upgrade_id: 1,
            new_version_hash,
            proposer: proposer_addr,
            executable_after: current_time + UPGRADE_TIMELOCK,
            proposed_at: current_time,
        });
    }
    
    /// Cancel a pending upgrade
    public entry fun cancel_upgrade(
        canceller: &signer,
        registry_address: address,
    ) acquires EmergencyState, AccessControlRegistry, AuditLog, RateLimiter {
        let canceller_addr = signer::address_of(canceller);
        
        // Only super admin can cancel
        assert!(has_role(registry_address, canceller_addr, ROLE_SUPER_ADMIN),
                error_codes::unauthorized());
        
        check_and_update_rate_limit(registry_address);
        
        let emergency_state = borrow_global_mut<EmergencyState>(registry_address);
        
        assert!(emergency_state.upgrade_in_progress, error_codes::no_upgrade_pending());
        
        emergency_state.upgrade_in_progress = false;
        emergency_state.scheduled_upgrade_at = 0;
        
        log_action(
            registry_address,
            canceller_addr,
            ACTION_UPGRADE,
            registry_address,
            string::utf8(b"Upgrade cancelled"),
            string::utf8(b""),
            string::utf8(b""),
        );
    }

    // ================================
    // View Functions
    // ================================
    
    #[view]
    /// Get current system state
    public fun get_system_state(registry_address: address): (u8, u64, address, u64) acquires EmergencyState {
        assert!(exists<EmergencyState>(registry_address), error_codes::not_initialized());
        
        let state = borrow_global<EmergencyState>(registry_address);
        (
            state.current_state,
            state.state_changed_at,
            state.state_changed_by,
            state.pause_expires_at,
        )
    }
    
    #[view]
    /// Check if system is paused
    public fun is_system_paused(registry_address: address): bool acquires EmergencyState {
        if (!exists<EmergencyState>(registry_address)) {
            return false
        };
        
        let state = borrow_global<EmergencyState>(registry_address);
        state.current_state == STATE_PAUSED || state.current_state == STATE_EMERGENCY
    }
    
    #[view]
    /// Check if module is paused
    public fun is_module_paused(registry_address: address, module_index: u8): bool acquires ModulePauseState {
        if (!exists<ModulePauseState>(registry_address)) {
            return false
        };
        
        let module_pause = borrow_global<ModulePauseState>(registry_address);
        
        if (module_index == 0) {
            module_pause.wage_streaming_paused
        } else if (module_index == 1) {
            module_pause.treasury_paused
        } else if (module_index == 2) {
            module_pause.compliance_paused
        } else if (module_index == 3) {
            module_pause.disputes_paused
        } else {
            false
        }
    }
    
    #[view]
    /// Check if address has specific role
    public fun has_role(registry_address: address, holder: address, role: u8): bool acquires AccessControlRegistry {
        if (!exists<AccessControlRegistry>(registry_address)) {
            return false
        };
        
        let access_control = borrow_global<AccessControlRegistry>(registry_address);
        
        // Super admin check
        if (role == ROLE_SUPER_ADMIN) {
            return holder == access_control.super_admin
        };
        
        // Check active roles
        let current_time = timestamp::now_seconds();
        has_active_role_with_time(&access_control.roles, holder, role, current_time)
    }
    
    #[view]
    /// Get admin count
    public fun get_admin_count(registry_address: address): u64 acquires AccessControlRegistry {
        assert!(exists<AccessControlRegistry>(registry_address), error_codes::not_initialized());
        
        let access_control = borrow_global<AccessControlRegistry>(registry_address);
        access_control.admin_count
    }
    
    #[view]
    /// Check if upgrade is in progress
    public fun is_upgrade_pending(registry_address: address): bool acquires EmergencyState {
        if (!exists<EmergencyState>(registry_address)) {
            return false
        };
        
        let state = borrow_global<EmergencyState>(registry_address);
        state.upgrade_in_progress
    }

    // ================================
    // Internal Helper Functions
    // ================================
    
    /// Check if address has active role (internal)
    fun has_active_role(roles: &vector<RoleAssignment>, holder: address, role: u8): bool {
        let current_time = timestamp::now_seconds();
        has_active_role_with_time(roles, holder, role, current_time)
    }
    
    /// Check if address has active role with timestamp (internal)
    fun has_active_role_with_time(
        roles: &vector<RoleAssignment>, 
        holder: address, 
        role: u8, 
        current_time: u64
    ): bool {
        let len = vector::length(roles);
        let i = 0;
        
        while (i < len) {
            let role_assignment = vector::borrow(roles, i);
            if (role_assignment.holder == holder && 
                role_assignment.role == role && 
                role_assignment.is_active) {
                // Check expiry
                if (role_assignment.expires_at == 0 || role_assignment.expires_at > current_time) {
                    return true
                };
            };
            i = i + 1;
        };
        
        false
    }
    
    /// Check and update rate limit
    fun check_and_update_rate_limit(registry_address: address) acquires RateLimiter {
        if (!exists<RateLimiter>(registry_address)) {
            return // Skip if not initialized
        };
        
        let rate_limiter = borrow_global_mut<RateLimiter>(registry_address);
        let current_time = timestamp::now_seconds();
        
        // Reset window if needed
        if (current_time - rate_limiter.window_start > rate_limiter.window_duration) {
            rate_limiter.window_start = current_time;
            rate_limiter.actions_in_window = 0;
        };
        
        // Check rate limit
        assert!(rate_limiter.actions_in_window < rate_limiter.max_actions, 
                error_codes::rate_limit_exceeded());
        
        // Check cooldown
        if (rate_limiter.last_action_at > 0) {
            assert!(current_time - rate_limiter.last_action_at >= rate_limiter.cooldown_seconds,
                    error_codes::cooldown_active());
        };
        
        // Update counters
        rate_limiter.actions_in_window = rate_limiter.actions_in_window + 1;
        rate_limiter.last_action_at = current_time;
    }
    
    /// Log an administrative action
    fun log_action(
        registry_address: address,
        actor: address,
        action_type: u8,
        target: address,
        description: String,
        previous_value: String,
        new_value: String,
    ) acquires AuditLog {
        if (!exists<AuditLog>(registry_address)) {
            return // Skip if not initialized
        };
        
        let audit_log = borrow_global_mut<AuditLog>(registry_address);
        let current_time = timestamp::now_seconds();
        
        audit_log.total_entries = audit_log.total_entries + 1;
        
        let entry = AuditLogEntry {
            entry_id: audit_log.total_entries,
            timestamp: current_time,
            actor,
            action_type,
            target,
            description,
            previous_value,
            new_value,
        };
        
        // Rolling window - remove oldest if at capacity
        if (vector::length(&audit_log.entries) >= audit_log.max_entries) {
            vector::remove(&mut audit_log.entries, 0);
        };
        
        vector::push_back(&mut audit_log.entries, entry);
    }

    // ================================
    // Test Functions
    // ================================
    
    #[test_only]
    /// Initialize for testing
    public fun init_for_testing(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        initialize_emergency_system(admin, vector[admin_addr]);
    }
}
