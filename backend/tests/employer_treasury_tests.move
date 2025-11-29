/// Tests for employer_treasury module
module wage_streaming_addr::employer_treasury_tests {
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use wage_streaming_addr::employer_treasury;

    // =========================================================================
    // TEST SETUP HELPERS
    // =========================================================================

    #[test_only]
    fun setup_test_env(aptos_framework: &signer) {
        timestamp::set_time_has_started_for_testing(aptos_framework);
    }

    #[test_only]
    fun create_funded_account(
        aptos_framework: &signer,
        account_signer: &signer,
        amount: u64,
    ): (coin::BurnCapability<AptosCoin>, coin::MintCapability<AptosCoin>) {
        let addr = signer::address_of(account_signer);
        
        if (!account::exists_at(addr)) {
            account::create_account_for_test(addr);
        };
        
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        coin::register<AptosCoin>(account_signer);
        
        let coins = coin::mint<AptosCoin>(amount, &mint_cap);
        coin::deposit(addr, coins);
        
        (burn_cap, mint_cap)
    }

    // =========================================================================
    // REGISTRY INITIALIZATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    fun test_initialize_registry_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        account::create_account_for_test(admin_addr);
        
        // Initialize registry - takes only admin signer
        employer_treasury::initialize_registry(admin);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_registry_twice_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        account::create_account_for_test(admin_addr);
        
        employer_treasury::initialize_registry(admin);
        employer_treasury::initialize_registry(admin); // Should fail
    }

    // =========================================================================
    // TREASURY INITIALIZATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200)]
    fun test_initialize_treasury_success(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
    ) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        account::create_account_for_test(admin_addr);
        
        // Create and fund employer account
        let (burn_cap, mint_cap) = create_funded_account(aptos_framework, employer, 100_000_000_000);
        
        // Initialize registry first
        employer_treasury::initialize_registry(admin);
        
        // Initialize employer treasury with deposit (minimum 0.1 APT = 10_000_000)
        // Signature: initialize_treasury(employer: &signer, registry_addr: address, initial_deposit: u64)
        employer_treasury::initialize_treasury(employer, admin_addr, 50_000_000_000);
        
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200)]
    #[expected_failure]
    fun test_initialize_treasury_below_minimum_fails(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
    ) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        account::create_account_for_test(admin_addr);
        
        let (burn_cap, mint_cap) = create_funded_account(aptos_framework, employer, 100_000_000_000);
        
        employer_treasury::initialize_registry(admin);
        
        // Amount below MIN_DEPOSIT (0.1 APT = 10_000_000) should fail
        employer_treasury::initialize_treasury(employer, admin_addr, 1_000_000);
        
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}
