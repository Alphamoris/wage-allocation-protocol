/// Tests for photon_rewards module
module wage_streaming_addr::photon_rewards_tests {
    use std::string;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use wage_streaming_addr::photon_rewards;

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
    fun test_initialize_rewards_system_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        // Initialize rewards system
        // Signature: initialize_rewards_system(admin, platform_treasury, platform_fee_bps, photon_api_endpoint)
        photon_rewards::initialize_rewards_system(
            admin,
            admin_addr, // platform_treasury
            100, // platform_fee_bps (1%)
            string::utf8(b"https://api.photon.example.com"),
        );
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_rewards_system_twice_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        photon_rewards::initialize_rewards_system(
            admin, admin_addr, 100, string::utf8(b"https://api.photon.example.com"),
        );
        
        // Second initialization should fail
        photon_rewards::initialize_rewards_system(
            admin, admin_addr, 100, string::utf8(b"https://api.photon.example.com"),
        );
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_invalid_fee_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        // Fee > 1000 bps (10%) should fail
        photon_rewards::initialize_rewards_system(
            admin, admin_addr, 1500, string::utf8(b"https://api.example.com"),
        );
    }

    // =========================================================================
    // EMPLOYEE REWARDS INITIALIZATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, employee = @0x300)]
    fun test_initialize_employee_rewards_success(aptos_framework: &signer, employee: &signer) {
        setup_test_env(aptos_framework);
        
        let employee_addr = signer::address_of(employee);
        create_account(employee_addr);
        
        // Initialize employee rewards
        // Signature: initialize_employee_rewards(employee)
        photon_rewards::initialize_employee_rewards(employee);
    }

    #[test(aptos_framework = @aptos_framework, employee = @0x300)]
    #[expected_failure]
    fun test_initialize_employee_rewards_twice_fails(aptos_framework: &signer, employee: &signer) {
        setup_test_env(aptos_framework);
        
        let employee_addr = signer::address_of(employee);
        create_account(employee_addr);
        
        photon_rewards::initialize_employee_rewards(employee);
        photon_rewards::initialize_employee_rewards(employee); // Should fail
    }

    // =========================================================================
    // EMPLOYER CAMPAIGN REGISTRY TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, employer = @0x200)]
    fun test_initialize_employer_campaign_registry_success(aptos_framework: &signer, employer: &signer) {
        setup_test_env(aptos_framework);
        
        let employer_addr = signer::address_of(employer);
        create_account(employer_addr);
        
        // Initialize employer campaign registry
        // Signature: initialize_employer_campaign_registry(employer)
        photon_rewards::initialize_employer_campaign_registry(employer);
    }

    #[test(aptos_framework = @aptos_framework, employer = @0x200)]
    #[expected_failure]
    fun test_initialize_employer_campaign_registry_twice_fails(aptos_framework: &signer, employer: &signer) {
        setup_test_env(aptos_framework);
        
        let employer_addr = signer::address_of(employer);
        create_account(employer_addr);
        
        photon_rewards::initialize_employer_campaign_registry(employer);
        photon_rewards::initialize_employer_campaign_registry(employer); // Should fail
    }

    // =========================================================================
    // STREAK TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, employee = @0x300)]
    fun test_record_daily_checkin_success(aptos_framework: &signer, employee: &signer) {
        setup_test_env(aptos_framework);
        
        let employee_addr = signer::address_of(employee);
        create_account(employee_addr);
        
        // Initialize employee rewards first (creates StreakTracker)
        photon_rewards::initialize_employee_rewards(employee);
        
        // Record daily check-in
        // Signature: record_daily_checkin(employee)
        photon_rewards::record_daily_checkin(employee);
    }

    #[test(aptos_framework = @aptos_framework, employee = @0x300)]
    #[expected_failure]
    fun test_record_daily_checkin_without_init_fails(aptos_framework: &signer, employee: &signer) {
        setup_test_env(aptos_framework);
        
        let employee_addr = signer::address_of(employee);
        create_account(employee_addr);
        
        // Try to check in without initializing (no StreakTracker)
        photon_rewards::record_daily_checkin(employee);
    }

    // =========================================================================
    // VIEW FUNCTION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_get_registry_stats(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        photon_rewards::initialize_rewards_system(
            admin, admin_addr, 100, string::utf8(b"https://api.example.com"),
        );
        
        // Get registry stats
        // Returns: (total_campaigns, total_pat_distributed, total_unique_participants, active_campaigns)
        let (total_campaigns, total_pat, total_participants, active_campaigns) = 
            photon_rewards::get_registry_stats(admin_addr);
        
        assert!(total_campaigns == 0, 1);
        assert!(total_pat == 0, 2);
        assert!(total_participants == 0, 3);
        assert!(active_campaigns == 0, 4);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_is_photon_enabled(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        photon_rewards::initialize_rewards_system(
            admin, admin_addr, 100, string::utf8(b"https://api.example.com"),
        );
        
        // Check if photon is enabled (should be true by default)
        let enabled = photon_rewards::is_photon_enabled(admin_addr);
        assert!(enabled, 1);
    }

    #[test(aptos_framework = @aptos_framework, employee = @0x300)]
    fun test_get_employee_rewards_summary(aptos_framework: &signer, employee: &signer) {
        setup_test_env(aptos_framework);
        
        let employee_addr = signer::address_of(employee);
        create_account(employee_addr);
        
        photon_rewards::initialize_employee_rewards(employee);
        
        // Get employee rewards summary
        // Returns: (total_pat_earned, total_pat_claimed, pending_pat, current_streak, campaigns_participated, engagement_score)
        let (earned, claimed, pending, streak, campaigns, score) = 
            photon_rewards::get_employee_rewards_summary(employee_addr);
        
        assert!(earned == 0, 1);
        assert!(claimed == 0, 2);
        assert!(pending == 0, 3);
        assert!(streak == 0, 4);
        assert!(campaigns == 0, 5);
        assert!(score == 0, 6);
    }

    #[test(aptos_framework = @aptos_framework, employee = @0x300)]
    fun test_get_streak_info(aptos_framework: &signer, employee: &signer) {
        setup_test_env(aptos_framework);
        
        let employee_addr = signer::address_of(employee);
        create_account(employee_addr);
        
        photon_rewards::initialize_employee_rewards(employee);
        
        // Get streak info
        // Returns: (current_streak, longest_streak, streak_rewards_earned)
        let (current, longest, rewards) = photon_rewards::get_streak_info(employee_addr);
        
        assert!(current == 0, 1);
        assert!(longest == 0, 2);
        assert!(rewards == 0, 3);
    }

    // =========================================================================
    // TEST HELPER FUNCTION TESTS
    // =========================================================================

    #[test]
    fun test_get_campaign_status_constants() {
        let active = photon_rewards::get_campaign_status_active();
        let draft = photon_rewards::get_campaign_status_draft();
        
        // CAMPAIGN_STATUS_ACTIVE = 1, CAMPAIGN_STATUS_DRAFT = 0
        assert!(active == 1, 1);
        assert!(draft == 0, 2);
    }
}
