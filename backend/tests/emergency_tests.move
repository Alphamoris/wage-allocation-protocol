/// Tests for emergency module
module wage_streaming_addr::emergency_tests {
    use std::string;
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use wage_streaming_addr::emergency;

    // =========================================================================
    // TEST SETUP HELPERS
    // =========================================================================

    #[test_only]
    fun setup_test_env(aptos_framework: &signer) {
        timestamp::set_time_has_started_for_testing(aptos_framework);
    }

    #[test_only]
    fun create_account(addr: address) {
        if (!account::exists_at(addr)) {
            account::create_account_for_test(addr);
        };
    }

    // =========================================================================
    // INITIALIZATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_initialize_emergency_system_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        // Initialize emergency system
        // Signature: initialize_emergency_system(super_admin, emergency_contacts)
        let emergency_contacts = vector[@0x400, @0x500];
        emergency::initialize_emergency_system(admin, emergency_contacts);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_emergency_system_twice_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        emergency::initialize_emergency_system(admin, contacts); // Should fail
    }

    // =========================================================================
    // PAUSE/UNPAUSE TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_pause_system_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // Pause system
        // Signature: pause_system(pauser, registry_address, reason, duration_seconds)
        emergency::pause_system(
            admin,
            admin_addr,
            string::utf8(b"Scheduled maintenance"),
            3600, // 1 hour
        );
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_unpause_system_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // Pause first
        emergency::pause_system(
            admin,
            admin_addr,
            string::utf8(b"Maintenance"),
            3600,
        );
        
        // Then unpause
        // Signature: unpause_system(unpauser, registry_address)
        emergency::unpause_system(admin, admin_addr);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_pause_duration_too_short_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // Duration < MIN_PAUSE_DURATION (60 seconds) should fail
        emergency::pause_system(
            admin,
            admin_addr,
            string::utf8(b"Quick pause"),
            30, // Too short
        );
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_unpause_when_not_paused_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // Unpause without pausing first should fail
        emergency::unpause_system(admin, admin_addr);
    }

    // =========================================================================
    // EMERGENCY TRIGGER TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_trigger_emergency_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // Trigger emergency (admin is authorized)
        // Signature: trigger_emergency(caller, registry_address, reason)
        emergency::trigger_emergency(
            admin,
            admin_addr,
            string::utf8(b"Security vulnerability detected"),
        );
    }

    // =========================================================================
    // ROLE MANAGEMENT TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_has_role_super_admin(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // Super admin (role 0) should be assigned to initializer
        let has_super_admin = emergency::has_role(admin_addr, admin_addr, 0);
        assert!(has_super_admin, 1);
    }

    // =========================================================================
    // VIEW FUNCTION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_get_system_state(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // Check system state (returns: current_state, state_changed_at, state_changed_by, pause_expires_at)
        // STATE_NORMAL = 0
        let (current_state, _, _, _) = emergency::get_system_state(admin_addr);
        assert!(current_state == 0, 1);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_is_system_paused_false(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // System should not be paused initially
        let is_paused = emergency::is_system_paused(admin_addr);
        assert!(!is_paused, 1);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_is_system_paused_true(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        let contacts = vector[@0x400];
        emergency::initialize_emergency_system(admin, contacts);
        
        // Pause system
        emergency::pause_system(
            admin,
            admin_addr,
            string::utf8(b"Test pause"),
            3600,
        );
        
        // System should be paused
        let is_paused = emergency::is_system_paused(admin_addr);
        assert!(is_paused, 1);
    }
}
