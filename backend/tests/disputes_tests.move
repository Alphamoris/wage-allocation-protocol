/// Tests for disputes module
module wage_streaming_addr::disputes_tests {
    use std::string;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use wage_streaming_addr::disputes;

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
    fun test_initialize_dispute_system_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        // Initialize dispute system
        // Signature: initialize_dispute_system(admin, fee_collector, protocol_fee_bps)
        disputes::initialize_dispute_system(admin, admin_addr, 100); // 1% fee
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_dispute_system_twice_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        disputes::initialize_dispute_system(admin, admin_addr, 100);
        disputes::initialize_dispute_system(admin, admin_addr, 100); // Should fail
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_high_fee_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        // Fee > 500 bps (5%) should fail
        disputes::initialize_dispute_system(admin, admin_addr, 600);
    }

    // =========================================================================
    // DISPUTE OPENING TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200, employee = @0x300)]
    fun test_open_dispute_success(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
        employee: &signer,
    ) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let employer_addr = signer::address_of(employer);
        let employee_addr = signer::address_of(employee);
        create_account(admin_addr);
        create_account(employer_addr);
        create_account(employee_addr);
        
        // Initialize dispute system
        disputes::initialize_dispute_system(admin, admin_addr, 100);
        
        // Open dispute (by employee against employer)
        // Signature: open_dispute(initiator, registry_address, stream_id, respondent, 
        //            employer, employee, category, disputed_amount, title, description)
        disputes::open_dispute(
            employee, // initiator
            admin_addr, // registry_address
            1, // stream_id
            employer_addr, // respondent
            employer_addr, // employer
            employee_addr, // employee
            0, // category (CATEGORY_WAGE_AMOUNT)
            100_000_000, // disputed_amount (100 USDC minimum)
            string::utf8(b"Wage Dispute"),
            string::utf8(b"Employer did not pay agreed wages"),
        );
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200, employee = @0x300)]
    #[expected_failure]
    fun test_open_dispute_amount_too_small_fails(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
        employee: &signer,
    ) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let employer_addr = signer::address_of(employer);
        let employee_addr = signer::address_of(employee);
        create_account(admin_addr);
        create_account(employer_addr);
        create_account(employee_addr);
        
        disputes::initialize_dispute_system(admin, admin_addr, 100);
        
        // Amount below MIN_DISPUTE_AMOUNT (100_000_000) should fail
        disputes::open_dispute(
            employee,
            admin_addr,
            1,
            employer_addr,
            employer_addr,
            employee_addr,
            0,
            1000, // Too small
            string::utf8(b"Small Dispute"),
            string::utf8(b"Description"),
        );
    }

    // =========================================================================
    // EVIDENCE SUBMISSION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200, employee = @0x300)]
    fun test_submit_evidence_success(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
        employee: &signer,
    ) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let employer_addr = signer::address_of(employer);
        let employee_addr = signer::address_of(employee);
        create_account(admin_addr);
        create_account(employer_addr);
        create_account(employee_addr);
        
        // Initialize and open dispute
        disputes::initialize_dispute_system(admin, admin_addr, 100);
        
        disputes::open_dispute(
            employee,
            admin_addr,
            1,
            employer_addr,
            employer_addr,
            employee_addr,
            0,
            100_000_000,
            string::utf8(b"Wage Dispute"),
            string::utf8(b"Description"),
        );
        
        // Submit evidence
        // Signature: submit_evidence(submitter, registry_address, dispute_id, 
        //            evidence_type, content_hash, description)
        disputes::submit_evidence(
            employee,
            admin_addr,
            1, // dispute_id
            0, // evidence_type (EVIDENCE_DOCUMENT)
            string::utf8(b"QmHash123456789"),
            string::utf8(b"Employment contract showing agreed wages"),
        );
    }
}
