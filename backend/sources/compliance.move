/// ============================================================================
/// COMPLIANCE MODULE - DAILY WAGE ALLOCATION PROTOCOL
/// ============================================================================
/// This module handles Indian labor law compliance for wage streams, including
/// EPF (Employee Provident Fund), ESI (Employee State Insurance), and TDS
/// (Tax Deducted at Source) calculations and reporting.
///
/// Key Features:
/// - Automatic statutory deduction calculations
/// - Compliance certificate generation
/// - Audit trail maintenance
/// - Multi-state compliance support
///
/// @author Daily Wage Protocol Team
/// @version 1.0.0
/// ============================================================================

module wage_streaming_addr::compliance {
    use std::signer;
    use std::vector;
    use std::string::String;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    
    use wage_streaming_addr::error_codes;

    // =========================================================================
    // CONSTANTS - INDIAN STATUTORY RATES (in basis points)
    // =========================================================================

    /// EPF Employee Contribution (12%)
    const EPF_EMPLOYEE_RATE_BPS: u64 = 1200;
    
    /// EPF Employer Contribution (12%)  
    const EPF_EMPLOYER_RATE_BPS: u64 = 1200;
    
    /// ESI Employee Contribution (0.75%)
    const ESI_EMPLOYEE_RATE_BPS: u64 = 75;
    
    /// ESI Employer Contribution (3.25%)
    const ESI_EMPLOYER_RATE_BPS: u64 = 325;
    
    /// ESI Wage Ceiling (₹21,000 monthly, converted to APT equivalent)
    const ESI_WAGE_CEILING: u64 = 21000_00000000;
    
    /// EPF Wage Ceiling (₹15,000 basic monthly)
    const EPF_WAGE_CEILING: u64 = 15000_00000000;
    
    /// Professional Tax Maximum (varies by state, using ₹2,500)
    const PT_MAX_MONTHLY: u64 = 2500_00000000;
    
    /// Minimum wage requirement check (daily in APT)
    const MIN_DAILY_WAGE: u64 = 500_00000000;

    // =========================================================================
    // TDS SLABS (Old Tax Regime - for reference)
    // =========================================================================

    const TDS_SLAB_1_LIMIT: u64 = 250000_00000000;  // ₹2.5L
    const TDS_SLAB_2_LIMIT: u64 = 500000_00000000;  // ₹5L
    const TDS_SLAB_3_LIMIT: u64 = 1000000_00000000; // ₹10L
    
    const TDS_RATE_SLAB_1: u64 = 0;     // 0%
    const TDS_RATE_SLAB_2: u64 = 500;   // 5%
    const TDS_RATE_SLAB_3: u64 = 2000;  // 20%
    const TDS_RATE_SLAB_4: u64 = 3000;  // 30%

    // =========================================================================
    // COMPLIANCE STATUS
    // =========================================================================

    const STATUS_PENDING: u8 = 1;
    const STATUS_VERIFIED: u8 = 2;
    const STATUS_FLAGGED: u8 = 3;
    const STATUS_EXEMPT: u8 = 4;

    // =========================================================================
    // DATA STRUCTURES
    // =========================================================================

    /// Compliance registry for protocol-wide settings
    struct ComplianceRegistry has key {
        /// Admin address
        admin: address,
        /// Total registered employers
        total_employers: u64,
        /// Total registered employees
        total_employees: u64,
        /// Total compliance reports generated
        total_reports: u64,
        /// Compliance verification events
        verification_events: EventHandle<ComplianceVerificationEvent>,
        /// Deduction events
        deduction_events: EventHandle<DeductionEvent>,
        /// Certificate events
        certificate_events: EventHandle<CertificateEvent>,
    }

    /// Statutory rates configuration (can be updated)
    struct StatutoryRates has key {
        /// EPF employee rate in bps
        epf_employee_rate: u64,
        /// EPF employer rate in bps
        epf_employer_rate: u64,
        /// ESI employee rate in bps
        esi_employee_rate: u64,
        /// ESI employer rate in bps
        esi_employer_rate: u64,
        /// ESI wage ceiling
        esi_ceiling: u64,
        /// EPF wage ceiling
        epf_ceiling: u64,
        /// Last updated timestamp
        last_updated: u64,
        /// Updated by
        updated_by: address,
    }

    /// Employer compliance profile
    struct EmployerCompliance has key {
        /// Employer address
        employer: address,
        /// PAN number (hashed)
        pan_hash: vector<u8>,
        /// GSTIN (hashed)
        gstin_hash: vector<u8>,
        /// EPF establishment code (hashed)
        epf_code_hash: vector<u8>,
        /// ESI code (hashed)
        esi_code_hash: vector<u8>,
        /// State code for PT
        state_code: u8,
        /// Is EPF registered
        epf_registered: bool,
        /// Is ESI registered
        esi_registered: bool,
        /// Registration timestamp
        registered_at: u64,
        /// Last compliance check
        last_compliance_check: u64,
        /// Compliance status
        status: u8,
        /// Total employees registered
        employee_count: u64,
        /// Total deductions processed
        total_deductions: u64,
    }

    /// Employee compliance profile
    struct EmployeeCompliance has key {
        /// Employee address
        employee: address,
        /// PAN number (hashed)
        pan_hash: vector<u8>,
        /// Aadhaar (hashed)
        aadhaar_hash: vector<u8>,
        /// UAN (Universal Account Number for EPF)
        uan_hash: vector<u8>,
        /// Bank account hash
        bank_account_hash: vector<u8>,
        /// Tax regime (0 = old, 1 = new)
        tax_regime: u8,
        /// Annual income declared
        declared_annual_income: u64,
        /// Is EPF member
        epf_member: bool,
        /// Is ESI eligible
        esi_eligible: bool,
        /// Registration timestamp
        registered_at: u64,
        /// KYC verified
        kyc_verified: bool,
        /// Compliance status
        status: u8,
    }

    /// Monthly compliance record for employer
    struct MonthlyComplianceRecord has store, drop, copy {
        /// Month (YYYYMM format)
        month: u64,
        /// Total wages paid
        total_wages: u64,
        /// EPF employee deductions
        epf_employee: u64,
        /// EPF employer contributions
        epf_employer: u64,
        /// ESI employee deductions
        esi_employee: u64,
        /// ESI employer contributions
        esi_employer: u64,
        /// TDS deducted
        tds_deducted: u64,
        /// Professional tax
        professional_tax: u64,
        /// Number of employees paid
        employee_count: u64,
        /// Submitted timestamp
        submitted_at: u64,
        /// Is verified
        is_verified: bool,
    }

    /// Employer's compliance records
    struct EmployerComplianceRecords has key {
        /// Monthly records
        records: vector<MonthlyComplianceRecord>,
        /// Total EPF deposited
        total_epf: u64,
        /// Total ESI deposited
        total_esi: u64,
        /// Total TDS deposited
        total_tds: u64,
    }

    /// Stream compliance details
    struct StreamCompliance has store, drop, copy {
        /// Stream ID
        stream_id: u64,
        /// Employer address
        employer: address,
        /// Employee address
        employee: address,
        /// Total wages in stream
        total_wages: u64,
        /// EPF deducted
        epf_deducted: u64,
        /// ESI deducted
        esi_deducted: u64,
        /// TDS deducted
        tds_deducted: u64,
        /// Professional tax
        pt_deducted: u64,
        /// Net payable
        net_payable: u64,
        /// Is compliant
        is_compliant: bool,
        /// Last updated
        last_updated: u64,
    }

    /// Stream compliance storage
    struct StreamComplianceStore has key {
        /// Compliance records by stream
        compliances: vector<StreamCompliance>,
    }

    /// Compliance certificate
    struct ComplianceCertificate has store, drop, copy {
        /// Certificate ID
        certificate_id: u64,
        /// Employer address
        employer: address,
        /// Period covered (YYYYMM)
        period: u64,
        /// Certificate type (1 = EPF, 2 = ESI, 3 = TDS, 4 = Combined)
        cert_type: u8,
        /// Issue timestamp
        issued_at: u64,
        /// Valid until
        valid_until: u64,
        /// Certificate hash
        certificate_hash: vector<u8>,
        /// Is valid
        is_valid: bool,
    }

    /// Certificate storage
    struct CertificateStore has key {
        /// Next certificate ID
        next_id: u64,
        /// Certificates
        certificates: vector<ComplianceCertificate>,
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    struct ComplianceVerificationEvent has drop, store {
        employer: address,
        employee: address,
        stream_id: u64,
        is_compliant: bool,
        timestamp: u64,
    }

    struct DeductionEvent has drop, store {
        stream_id: u64,
        epf_amount: u64,
        esi_amount: u64,
        tds_amount: u64,
        pt_amount: u64,
        net_amount: u64,
        timestamp: u64,
    }

    struct CertificateEvent has drop, store {
        certificate_id: u64,
        employer: address,
        period: u64,
        cert_type: u8,
        timestamp: u64,
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /// Initialize compliance registry
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        assert!(!exists<ComplianceRegistry>(admin_addr), error_codes::already_initialized());
        
        // Create registry
        move_to(admin, ComplianceRegistry {
            admin: admin_addr,
            total_employers: 0,
            total_employees: 0,
            total_reports: 0,
            verification_events: account::new_event_handle<ComplianceVerificationEvent>(admin),
            deduction_events: account::new_event_handle<DeductionEvent>(admin),
            certificate_events: account::new_event_handle<CertificateEvent>(admin),
        });
        
        // Create statutory rates with current values
        move_to(admin, StatutoryRates {
            epf_employee_rate: EPF_EMPLOYEE_RATE_BPS,
            epf_employer_rate: EPF_EMPLOYER_RATE_BPS,
            esi_employee_rate: ESI_EMPLOYEE_RATE_BPS,
            esi_employer_rate: ESI_EMPLOYER_RATE_BPS,
            esi_ceiling: ESI_WAGE_CEILING,
            epf_ceiling: EPF_WAGE_CEILING,
            last_updated: timestamp::now_seconds(),
            updated_by: admin_addr,
        });
        
        // Create stream compliance store
        move_to(admin, StreamComplianceStore {
            compliances: vector::empty(),
        });
        
        // Create certificate store
        move_to(admin, CertificateStore {
            next_id: 1,
            certificates: vector::empty(),
        });
    }

    // =========================================================================
    // REGISTRATION FUNCTIONS
    // =========================================================================

    /// Register employer for compliance
    public entry fun register_employer(
        employer: &signer,
        registry_addr: address,
        pan_hash: vector<u8>,
        gstin_hash: vector<u8>,
        epf_code_hash: vector<u8>,
        esi_code_hash: vector<u8>,
        state_code: u8,
        epf_registered: bool,
        esi_registered: bool,
    ) acquires ComplianceRegistry {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        assert!(!exists<EmployerCompliance>(employer_addr), error_codes::already_initialized());
        
        let current_time = timestamp::now_seconds();
        
        move_to(employer, EmployerCompliance {
            employer: employer_addr,
            pan_hash,
            gstin_hash,
            epf_code_hash,
            esi_code_hash,
            state_code,
            epf_registered,
            esi_registered,
            registered_at: current_time,
            last_compliance_check: current_time,
            status: STATUS_PENDING,
            employee_count: 0,
            total_deductions: 0,
        });
        
        move_to(employer, EmployerComplianceRecords {
            records: vector::empty(),
            total_epf: 0,
            total_esi: 0,
            total_tds: 0,
        });
        
        let registry = borrow_global_mut<ComplianceRegistry>(registry_addr);
        registry.total_employers = registry.total_employers + 1;
    }

    /// Register employee for compliance
    public entry fun register_employee(
        employee: &signer,
        registry_addr: address,
        pan_hash: vector<u8>,
        aadhaar_hash: vector<u8>,
        uan_hash: vector<u8>,
        bank_account_hash: vector<u8>,
        tax_regime: u8,
        declared_annual_income: u64,
        epf_member: bool,
    ) acquires ComplianceRegistry {
        let employee_addr = signer::address_of(employee);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        assert!(!exists<EmployeeCompliance>(employee_addr), error_codes::already_initialized());
        
        // Determine ESI eligibility (monthly wage < ₹21,000)
        let monthly_income = declared_annual_income / 12;
        let esi_eligible = monthly_income <= ESI_WAGE_CEILING;
        
        let current_time = timestamp::now_seconds();
        
        move_to(employee, EmployeeCompliance {
            employee: employee_addr,
            pan_hash,
            aadhaar_hash,
            uan_hash,
            bank_account_hash,
            tax_regime,
            declared_annual_income,
            epf_member,
            esi_eligible,
            registered_at: current_time,
            kyc_verified: false,
            status: STATUS_PENDING,
        });
        
        let registry = borrow_global_mut<ComplianceRegistry>(registry_addr);
        registry.total_employees = registry.total_employees + 1;
    }

    // =========================================================================
    // DEDUCTION CALCULATION FUNCTIONS
    // =========================================================================

    /// Calculate statutory deductions for a wage amount
    #[view]
    public fun calculate_deductions(
        registry_addr: address,
        employer: address,
        employee: address,
        gross_wage: u64,
    ): (u64, u64, u64, u64, u64) acquires StatutoryRates, EmployerCompliance, EmployeeCompliance {
        assert!(exists<StatutoryRates>(registry_addr), error_codes::not_initialized());
        
        let rates = borrow_global<StatutoryRates>(registry_addr);
        
        let epf_deduction: u64 = 0;
        let esi_deduction: u64 = 0;
        let tds_deduction: u64 = 0;
        let pt_deduction: u64 = 0;
        
        // Check employer compliance
        if (exists<EmployerCompliance>(employer)) {
            let emp_compliance = borrow_global<EmployerCompliance>(employer);
            
            // EPF calculation (if registered)
            if (emp_compliance.epf_registered && exists<EmployeeCompliance>(employee)) {
                let ee_compliance = borrow_global<EmployeeCompliance>(employee);
                if (ee_compliance.epf_member) {
                    let epf_base = if (gross_wage > rates.epf_ceiling) {
                        rates.epf_ceiling
                    } else {
                        gross_wage
                    };
                    epf_deduction = (epf_base * rates.epf_employee_rate) / 10000;
                };
            };
            
            // ESI calculation (if registered)
            if (emp_compliance.esi_registered && exists<EmployeeCompliance>(employee)) {
                let ee_compliance = borrow_global<EmployeeCompliance>(employee);
                if (ee_compliance.esi_eligible && gross_wage <= rates.esi_ceiling) {
                    esi_deduction = (gross_wage * rates.esi_employee_rate) / 10000;
                };
            };
        };
        
        // TDS calculation (simplified - based on declared annual income)
        if (exists<EmployeeCompliance>(employee)) {
            let ee_compliance = borrow_global<EmployeeCompliance>(employee);
            tds_deduction = calculate_tds(ee_compliance.declared_annual_income, gross_wage);
        };
        
        // Professional tax (simplified - flat deduction)
        if (exists<EmployerCompliance>(employer)) {
            let emp_compliance = borrow_global<EmployerCompliance>(employer);
            pt_deduction = calculate_professional_tax(gross_wage, emp_compliance.state_code);
        };
        
        let net_wage = gross_wage - epf_deduction - esi_deduction - tds_deduction - pt_deduction;
        
        (epf_deduction, esi_deduction, tds_deduction, pt_deduction, net_wage)
    }

    /// Calculate TDS based on annual income and current payment
    fun calculate_tds(annual_income: u64, current_payment: u64): u64 {
        // Simplified TDS calculation
        // In production, this would be more sophisticated
        
        if (annual_income <= TDS_SLAB_1_LIMIT) {
            return 0
        };
        
        let effective_rate: u64;
        
        if (annual_income <= TDS_SLAB_2_LIMIT) {
            effective_rate = TDS_RATE_SLAB_2;
        } else if (annual_income <= TDS_SLAB_3_LIMIT) {
            effective_rate = TDS_RATE_SLAB_3;
        } else {
            effective_rate = TDS_RATE_SLAB_4;
        };
        
        (current_payment * effective_rate) / 10000
    }

    /// Calculate professional tax by state
    fun calculate_professional_tax(monthly_wage: u64, state_code: u8): u64 {
        // Professional tax varies by state
        // Using simplified calculation
        
        // State codes: 1 = Maharashtra, 2 = Karnataka, 3 = Gujarat, etc.
        let pt: u64;
        
        if (state_code == 1) {
            // Maharashtra
            if (monthly_wage <= 7500_00000000) {
                pt = 0;
            } else if (monthly_wage <= 10000_00000000) {
                pt = 175_00000000;
            } else {
                pt = 200_00000000;
            };
        } else if (state_code == 2) {
            // Karnataka  
            if (monthly_wage <= 15000_00000000) {
                pt = 0;
            } else {
                pt = 200_00000000;
            };
        } else {
            // Default
            if (monthly_wage > 10000_00000000) {
                pt = 150_00000000;
            } else {
                pt = 0;
            };
        };
        
        pt
    }

    // =========================================================================
    // COMPLIANCE VERIFICATION
    // =========================================================================

    /// Verify stream compliance
    public entry fun verify_stream_compliance(
        verifier: &signer,
        registry_addr: address,
        stream_id: u64,
        employer: address,
        employee: address,
        total_wages: u64,
    ) acquires ComplianceRegistry, StatutoryRates, EmployerCompliance, EmployeeCompliance, StreamComplianceStore {
        let verifier_addr = signer::address_of(verifier);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<ComplianceRegistry>(registry_addr);
        
        // Only admin can verify
        assert!(registry.admin == verifier_addr, error_codes::unauthorized());
        
        // Calculate deductions
        let (epf, esi, tds, pt, net) = calculate_deductions(
            registry_addr,
            employer,
            employee,
            total_wages,
        );
        
        // Check minimum wage compliance
        let daily_wage = total_wages / 30; // Approximate
        let is_compliant = daily_wage >= MIN_DAILY_WAGE;
        
        let current_time = timestamp::now_seconds();
        
        // Store compliance record
        let store = borrow_global_mut<StreamComplianceStore>(registry_addr);
        
        let compliance = StreamCompliance {
            stream_id,
            employer,
            employee,
            total_wages,
            epf_deducted: epf,
            esi_deducted: esi,
            tds_deducted: tds,
            pt_deducted: pt,
            net_payable: net,
            is_compliant,
            last_updated: current_time,
        };
        
        // Update or add
        let found = false;
        let len = vector::length(&store.compliances);
        let i = 0;
        
        while (i < len) {
            let existing = vector::borrow_mut(&mut store.compliances, i);
            if (existing.stream_id == stream_id) {
                *existing = compliance;
                found = true;
                break
            };
            i = i + 1;
        };
        
        if (!found) {
            vector::push_back(&mut store.compliances, compliance);
        };
        
        // Emit event
        event::emit_event(
            &mut registry.verification_events,
            ComplianceVerificationEvent {
                employer,
                employee,
                stream_id,
                is_compliant,
                timestamp: current_time,
            }
        );
    }

    /// Submit monthly compliance report
    public entry fun submit_monthly_report(
        employer: &signer,
        registry_addr: address,
        month: u64,
        total_wages: u64,
        epf_employee: u64,
        epf_employer: u64,
        esi_employee: u64,
        esi_employer: u64,
        tds_deducted: u64,
        professional_tax: u64,
        employee_count: u64,
    ) acquires ComplianceRegistry, EmployerCompliance, EmployerComplianceRecords {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        assert!(exists<EmployerCompliance>(employer_addr), error_codes::employer_not_registered());
        assert!(exists<EmployerComplianceRecords>(employer_addr), error_codes::employer_not_registered());
        
        let current_time = timestamp::now_seconds();
        
        let record = MonthlyComplianceRecord {
            month,
            total_wages,
            epf_employee,
            epf_employer,
            esi_employee,
            esi_employer,
            tds_deducted,
            professional_tax,
            employee_count,
            submitted_at: current_time,
            is_verified: false,
        };
        
        let records = borrow_global_mut<EmployerComplianceRecords>(employer_addr);
        vector::push_back(&mut records.records, record);
        
        records.total_epf = records.total_epf + epf_employee + epf_employer;
        records.total_esi = records.total_esi + esi_employee + esi_employer;
        records.total_tds = records.total_tds + tds_deducted;
        
        let emp_compliance = borrow_global_mut<EmployerCompliance>(employer_addr);
        emp_compliance.last_compliance_check = current_time;
        emp_compliance.total_deductions = emp_compliance.total_deductions + 
            epf_employee + esi_employee + tds_deducted + professional_tax;
        
        let registry = borrow_global_mut<ComplianceRegistry>(registry_addr);
        registry.total_reports = registry.total_reports + 1;
    }

    // =========================================================================
    // CERTIFICATE FUNCTIONS
    // =========================================================================

    /// Issue compliance certificate
    public entry fun issue_certificate(
        admin: &signer,
        registry_addr: address,
        employer: address,
        period: u64,
        cert_type: u8,
        certificate_hash: vector<u8>,
        validity_days: u64,
    ) acquires ComplianceRegistry, CertificateStore {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global_mut<ComplianceRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        let store = borrow_global_mut<CertificateStore>(registry_addr);
        let current_time = timestamp::now_seconds();
        
        let certificate = ComplianceCertificate {
            certificate_id: store.next_id,
            employer,
            period,
            cert_type,
            issued_at: current_time,
            valid_until: current_time + (validity_days * 86400),
            certificate_hash,
            is_valid: true,
        };
        
        vector::push_back(&mut store.certificates, certificate);
        
        event::emit_event(
            &mut registry.certificate_events,
            CertificateEvent {
                certificate_id: store.next_id,
                employer,
                period,
                cert_type,
                timestamp: current_time,
            }
        );
        
        store.next_id = store.next_id + 1;
    }

    /// Revoke compliance certificate
    public entry fun revoke_certificate(
        admin: &signer,
        registry_addr: address,
        certificate_id: u64,
    ) acquires ComplianceRegistry, CertificateStore {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global<ComplianceRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        let store = borrow_global_mut<CertificateStore>(registry_addr);
        let len = vector::length(&store.certificates);
        let i = 0;
        
        while (i < len) {
            let cert = vector::borrow_mut(&mut store.certificates, i);
            if (cert.certificate_id == certificate_id) {
                cert.is_valid = false;
                return
            };
            i = i + 1;
        };
        
        abort error_codes::certificate_not_found()
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    #[view]
    /// Get employer compliance status
    public fun get_employer_status(employer: address): (u8, bool, bool, u64) acquires EmployerCompliance {
        assert!(exists<EmployerCompliance>(employer), error_codes::employer_not_registered());
        let compliance = borrow_global<EmployerCompliance>(employer);
        (
            compliance.status,
            compliance.epf_registered,
            compliance.esi_registered,
            compliance.employee_count,
        )
    }

    #[view]
    /// Get employee compliance status
    public fun get_employee_status(employee: address): (u8, bool, bool, bool) acquires EmployeeCompliance {
        assert!(exists<EmployeeCompliance>(employee), error_codes::employee_not_registered());
        let compliance = borrow_global<EmployeeCompliance>(employee);
        (
            compliance.status,
            compliance.epf_member,
            compliance.esi_eligible,
            compliance.kyc_verified,
        )
    }

    #[view]
    /// Get stream compliance details
    public fun get_stream_compliance(
        registry_addr: address,
        stream_id: u64,
    ): (u64, u64, u64, u64, u64, bool) acquires StreamComplianceStore {
        assert!(exists<StreamComplianceStore>(registry_addr), error_codes::not_initialized());
        
        let store = borrow_global<StreamComplianceStore>(registry_addr);
        let len = vector::length(&store.compliances);
        let i = 0;
        
        while (i < len) {
            let compliance = vector::borrow(&store.compliances, i);
            if (compliance.stream_id == stream_id) {
                return (
                    compliance.epf_deducted,
                    compliance.esi_deducted,
                    compliance.tds_deducted,
                    compliance.pt_deducted,
                    compliance.net_payable,
                    compliance.is_compliant,
                )
            };
            i = i + 1;
        };
        
        (0, 0, 0, 0, 0, false)
    }

    #[view]
    /// Get current statutory rates
    public fun get_statutory_rates(registry_addr: address): (u64, u64, u64, u64) acquires StatutoryRates {
        assert!(exists<StatutoryRates>(registry_addr), error_codes::not_initialized());
        let rates = borrow_global<StatutoryRates>(registry_addr);
        (
            rates.epf_employee_rate,
            rates.epf_employer_rate,
            rates.esi_employee_rate,
            rates.esi_employer_rate,
        )
    }

    #[view]
    /// Verify certificate validity
    public fun verify_certificate(
        registry_addr: address,
        certificate_id: u64,
    ): (bool, u64, u64) acquires CertificateStore {
        assert!(exists<CertificateStore>(registry_addr), error_codes::not_initialized());
        
        let store = borrow_global<CertificateStore>(registry_addr);
        let len = vector::length(&store.certificates);
        let current_time = timestamp::now_seconds();
        let i = 0;
        
        while (i < len) {
            let cert = vector::borrow(&store.certificates, i);
            if (cert.certificate_id == certificate_id) {
                let is_valid = cert.is_valid && current_time < cert.valid_until;
                return (is_valid, cert.issued_at, cert.valid_until)
            };
            i = i + 1;
        };
        
        (false, 0, 0)
    }

    #[view]
    /// Check if employer is registered
    public fun is_employer_registered(employer: address): bool {
        exists<EmployerCompliance>(employer)
    }

    #[view]
    /// Check if employee is registered
    public fun is_employee_registered(employee: address): bool {
        exists<EmployeeCompliance>(employee)
    }

    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================

    /// Update statutory rates
    public entry fun update_statutory_rates(
        admin: &signer,
        registry_addr: address,
        epf_employee_rate: u64,
        epf_employer_rate: u64,
        esi_employee_rate: u64,
        esi_employer_rate: u64,
        esi_ceiling: u64,
        epf_ceiling: u64,
    ) acquires ComplianceRegistry, StatutoryRates {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global<ComplianceRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        let rates = borrow_global_mut<StatutoryRates>(registry_addr);
        rates.epf_employee_rate = epf_employee_rate;
        rates.epf_employer_rate = epf_employer_rate;
        rates.esi_employee_rate = esi_employee_rate;
        rates.esi_employer_rate = esi_employer_rate;
        rates.esi_ceiling = esi_ceiling;
        rates.epf_ceiling = epf_ceiling;
        rates.last_updated = timestamp::now_seconds();
        rates.updated_by = admin_addr;
    }

    /// Verify employer KYC
    public entry fun verify_employer_kyc(
        admin: &signer,
        registry_addr: address,
        employer: address,
    ) acquires ComplianceRegistry, EmployerCompliance {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global<ComplianceRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        assert!(exists<EmployerCompliance>(employer), error_codes::employer_not_registered());
        let compliance = borrow_global_mut<EmployerCompliance>(employer);
        compliance.status = STATUS_VERIFIED;
    }

    /// Verify employee KYC
    public entry fun verify_employee_kyc(
        admin: &signer,
        registry_addr: address,
        employee: address,
    ) acquires ComplianceRegistry, EmployeeCompliance {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global<ComplianceRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        assert!(exists<EmployeeCompliance>(employee), error_codes::employee_not_registered());
        let compliance = borrow_global_mut<EmployeeCompliance>(employee);
        compliance.kyc_verified = true;
        compliance.status = STATUS_VERIFIED;
    }

    /// Flag compliance issue
    public entry fun flag_compliance_issue(
        admin: &signer,
        registry_addr: address,
        employer: address,
    ) acquires ComplianceRegistry, EmployerCompliance {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<ComplianceRegistry>(registry_addr), error_codes::not_initialized());
        let registry = borrow_global<ComplianceRegistry>(registry_addr);
        assert!(registry.admin == admin_addr, error_codes::unauthorized());
        
        assert!(exists<EmployerCompliance>(employer), error_codes::employer_not_registered());
        let compliance = borrow_global_mut<EmployerCompliance>(employer);
        compliance.status = STATUS_FLAGGED;
    }

    /// Get employer compliance records
    #[view]
    public fun get_employer_compliance_summary(employer: address): (u64, u64, u64) acquires EmployerComplianceRecords {
        assert!(exists<EmployerComplianceRecords>(employer), error_codes::employer_not_registered());
        let records = borrow_global<EmployerComplianceRecords>(employer);
        (records.total_epf, records.total_esi, records.total_tds)
    }
}
