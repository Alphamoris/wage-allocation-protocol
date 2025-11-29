/// Tests for compliance module
module wage_streaming_addr::compliance_tests {
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use wage_streaming_addr::compliance;

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
    fun test_initialize_compliance_success(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        // Initialize compliance - takes only admin signer
        compliance::initialize(admin);
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100)]
    #[expected_failure]
    fun test_initialize_compliance_twice_fails(aptos_framework: &signer, admin: &signer) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        create_account(admin_addr);
        
        compliance::initialize(admin);
        compliance::initialize(admin); // Should fail
    }

    // =========================================================================
    // EMPLOYER REGISTRATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200)]
    fun test_register_employer_success(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
    ) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let employer_addr = signer::address_of(employer);
        create_account(admin_addr);
        create_account(employer_addr);
        
        // Initialize compliance first
        compliance::initialize(admin);
        
        // Register employer with compliance info
        // Signature: register_employer(employer, registry_addr, pan_hash, gstin_hash, 
        //            epf_code_hash, esi_code_hash, state_code, epf_registered, esi_registered)
        compliance::register_employer(
            employer,
            admin_addr,
            vector[1, 2, 3, 4, 5], // pan_hash
            vector[6, 7, 8, 9, 10], // gstin_hash  
            vector[11, 12, 13], // epf_code_hash
            vector[14, 15, 16], // esi_code_hash
            1, // state_code (Karnataka)
            true, // epf_registered
            true, // esi_registered
        );
    }

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200)]
    #[expected_failure]
    fun test_register_employer_twice_fails(
        aptos_framework: &signer,
        admin: &signer,
        employer: &signer,
    ) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let employer_addr = signer::address_of(employer);
        create_account(admin_addr);
        create_account(employer_addr);
        
        compliance::initialize(admin);
        
        // First registration
        compliance::register_employer(
            employer,
            admin_addr,
            vector[1, 2, 3, 4, 5],
            vector[6, 7, 8, 9, 10],
            vector[11, 12, 13],
            vector[14, 15, 16],
            1,
            true,
            true,
        );
        
        // Second registration should fail
        compliance::register_employer(
            employer,
            admin_addr,
            vector[1, 2, 3, 4, 5],
            vector[6, 7, 8, 9, 10],
            vector[11, 12, 13],
            vector[14, 15, 16],
            1,
            true,
            true,
        );
    }

    // =========================================================================
    // EMPLOYEE REGISTRATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employee = @0x300)]
    fun test_register_employee_success(
        aptos_framework: &signer,
        admin: &signer,
        employee: &signer,
    ) {
        setup_test_env(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let employee_addr = signer::address_of(employee);
        create_account(admin_addr);
        create_account(employee_addr);
        
        // Initialize compliance first
        compliance::initialize(admin);
        
        // Register employee
        // Signature: register_employee(employee, registry_addr, pan_hash, aadhaar_hash,
        //            uan_hash, bank_account_hash, tax_regime, declared_annual_income, epf_member)
        compliance::register_employee(
            employee,
            admin_addr,
            vector[1, 2, 3, 4, 5], // pan_hash
            vector[6, 7, 8, 9, 10, 11, 12], // aadhaar_hash
            vector[13, 14, 15], // uan_hash
            vector[16, 17, 18, 19], // bank_account_hash
            1, // tax_regime (new regime)
            600000_00000000, // declared_annual_income (6 lakh)
            true, // epf_member
        );
    }

    // =========================================================================
    // DEDUCTION CALCULATION TESTS
    // =========================================================================

    #[test(aptos_framework = @aptos_framework, admin = @0x100, employer = @0x200, employee = @0x300)]
    fun test_calculate_deductions(
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
        
        // Initialize compliance
        compliance::initialize(admin);
        
        // Register employer and employee
        compliance::register_employer(
            employer, admin_addr,
            vector[1, 2, 3], vector[4, 5, 6], vector[7, 8, 9], vector[10, 11, 12],
            1, true, true,
        );
        
        compliance::register_employee(
            employee, admin_addr,
            vector[1, 2, 3], vector[4, 5, 6, 7], vector[8, 9, 10], vector[11, 12, 13],
            1, 600000_00000000, true,
        );
        
        // Calculate deductions for a wage amount
        // Returns: (epf, esi, tds, pt, net)
        let (epf, esi, tds, pt, net) = compliance::calculate_deductions(
            admin_addr,
            employer_addr,
            employee_addr,
            50000_00000000, // 50,000 gross wage
        );
        
        // Verify calculations produced values
        assert!(net > 0, 1);
    }
}
