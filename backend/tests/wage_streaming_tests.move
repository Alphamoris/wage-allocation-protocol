/// Tests for wage_streaming module
module wage_streaming_addr::wage_streaming_tests {
    use std::string;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use wage_streaming_addr::wage_streaming;

    // =========================================================================
    // TEST SETUP HELPERS
    // =========================================================================

    #[test_only]
    fun setup_test_env(aptos_framework: &signer) {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
    }

    #[test_only]
    fun create_test_accounts(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
        employee: &signer,
    ) {
        // Create accounts
        let admin_addr = signer::address_of(admin);
        let employer_addr = signer::address_of(employer);
        let employee_addr = signer::address_of(employee);
        
        if (!account::exists_at(admin_addr)) {
            account::create_account_for_test(admin_addr);
        };
        if (!account::exists_at(employer_addr)) {
            account::create_account_for_test(employer_addr);
        };
        if (!account::exists_at(employee_addr)) {
            account::create_account_for_test(employee_addr);
        };
        
        // Initialize AptosCoin for testing
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        
        // Register and fund accounts
        coin::register<AptosCoin>(admin);
        coin::register<AptosCoin>(employer);
        coin::register<AptosCoin>(employee);
        
        // Mint coins to employer
        let coins = coin::mint<AptosCoin>(100_000_000_000, &mint_cap);
        coin::deposit(employer_addr, coins);
        
        // Clean up capabilities
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // =========================================================================
    // INITIALIZATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_initialize_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        account::create_account_for_test(admin_addr);
        
        // Initialize with 0.25% fee (25 basis points)
        wage_streaming::initialize(admin, 25);
        
        // Verify initialization by checking registry stats
        let (_, _, _, _) = wage_streaming::get_registry_stats(admin_addr);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_twice_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        account::create_account_for_test(admin_addr);
        
        // First initialization
        wage_streaming::initialize(admin, 25);
        
        // Second initialization should fail
        wage_streaming::initialize(admin, 25);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_invalid_fee_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        account::create_account_for_test(admin_addr);
        
        // Fee > 500 bps (5%) should fail
        wage_streaming::initialize(admin, 600);
    }

    // =========================================================================
    // STREAM CREATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200, employee = @0x300)]
    fun test_create_stream_success(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
        employee: &signer,
    ) {
        setup_test_env(aptos_framework);
        create_test_accounts(aptos_framework, admin, employer, employee);
        
        let admin_addr = signer::address_of(admin);
        let employee_addr = signer::address_of(employee);
        
        // Initialize the registry
        wage_streaming::initialize(admin, 25);
        
        // Create stream: 10 APT over 30 days (2592000 seconds)
        wage_streaming::create_stream(
            employer,
            admin_addr,
            employee_addr,
            10_000_000_000, // 10 APT
            2592000, // 30 days
            string::utf8(b"Software Developer"),
        );
    }

    // =========================================================================
    // VIEW FUNCTION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_get_registry_stats(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        account::create_account_for_test(admin_addr);
        
        wage_streaming::initialize(admin, 25);
        
        // Get registry stats - returns (total_value_locked, active_streams_count, completed_streams_count, accumulated_fees)
        let (tvl, active, completed, accumulated_fees) = wage_streaming::get_registry_stats(admin_addr);
        
        assert!(tvl == 0, 1);
        assert!(active == 0, 2);
        assert!(completed == 0, 3);
        assert!(accumulated_fees == 0, 4);
    }
}
