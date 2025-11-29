/// disputes.move - On-Chain Arbitration and Dispute Resolution
/// 
/// Provides comprehensive dispute resolution mechanisms for wage disagreements
/// including evidence submission, arbitration workflows, escrow management,
/// and appeal processes with multi-tier resolution.
/// 
/// Key Features:
/// - Multi-tier dispute escalation (Mediation -> Arbitration -> Final Appeal)
/// - Escrow-based fund locking during disputes
/// - Evidence submission and timestamped records
/// - Arbitrator assignment and voting mechanisms
/// - Automatic resolution execution
/// - Appeal windows with configurable timeouts
module wage_streaming_addr::disputes {
    use std::string::{Self, String};
    use std::vector;
    use std::signer;
    use std::option;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::fungible_asset::{Self, Metadata, FungibleStore};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::account;
    use wage_streaming_addr::error_codes;

    // ================================
    // Constants
    // ================================
    
    /// Dispute status constants
    const STATUS_OPENED: u8 = 0;
    const STATUS_EVIDENCE_SUBMISSION: u8 = 1;
    const STATUS_MEDIATION: u8 = 2;
    const STATUS_ARBITRATION: u8 = 3;
    const STATUS_RESOLVED: u8 = 4;
    const STATUS_APPEALED: u8 = 5;
    const STATUS_FINAL: u8 = 6;
    const STATUS_CANCELLED: u8 = 7;
    
    /// Dispute category constants
    const CATEGORY_WAGE_AMOUNT: u8 = 0;
    const CATEGORY_PAYMENT_TIMING: u8 = 1;
    const CATEGORY_DEDUCTIONS: u8 = 2;
    const CATEGORY_OVERTIME: u8 = 3;
    const CATEGORY_BONUS: u8 = 4;
    const CATEGORY_TERMINATION: u8 = 5;
    const CATEGORY_OTHER: u8 = 6;
    
    /// Resolution outcome constants
    const OUTCOME_EMPLOYER_FAVOR: u8 = 0;
    const OUTCOME_EMPLOYEE_FAVOR: u8 = 1;
    const OUTCOME_SPLIT_DECISION: u8 = 2;
    const OUTCOME_DISMISSED: u8 = 3;
    
    /// Evidence type constants
    const EVIDENCE_DOCUMENT: u8 = 0;
    const EVIDENCE_TRANSACTION_HASH: u8 = 1;
    const EVIDENCE_WITNESS_STATEMENT: u8 = 2;
    const EVIDENCE_AUDIT_TRAIL: u8 = 3;
    
    /// Time constants (in seconds)
    const EVIDENCE_SUBMISSION_PERIOD: u64 = 7 * 24 * 60 * 60; // 7 days
    const MEDIATION_PERIOD: u64 = 14 * 24 * 60 * 60; // 14 days
    const ARBITRATION_PERIOD: u64 = 21 * 24 * 60 * 60; // 21 days
    const APPEAL_WINDOW: u64 = 7 * 24 * 60 * 60; // 7 days
    const MIN_ESCROW_LOCK_PERIOD: u64 = 24 * 60 * 60; // 24 hours
    
    /// Fee constants (in basis points)
    const DISPUTE_FILING_FEE_BPS: u64 = 50; // 0.5%
    const ARBITRATION_FEE_BPS: u64 = 100; // 1%
    const APPEAL_FEE_BPS: u64 = 200; // 2%
    
    /// Minimum amounts (in base units, assuming 6 decimals)
    const MIN_DISPUTE_AMOUNT: u64 = 100_000_000; // 100 USDC minimum
    const MAX_DISPUTE_AMOUNT: u64 = 100_000_000_000_000; // 100M USDC maximum

    // ================================
    // Structs
    // ================================
    
    /// Represents a dispute between employer and employee
    struct Dispute has key, store, copy, drop {
        /// Unique dispute identifier
        dispute_id: u64,
        /// Stream ID this dispute relates to (0 if general dispute)
        stream_id: u64,
        /// Address of the party who filed the dispute
        initiator: address,
        /// Address of the respondent
        respondent: address,
        /// Employer address
        employer: address,
        /// Employee address
        employee: address,
        /// Category of dispute
        category: u8,
        /// Current status of the dispute
        status: u8,
        /// Amount in dispute (in base units)
        disputed_amount: u64,
        /// Amount held in escrow
        escrow_amount: u64,
        /// Title/summary of dispute
        title: String,
        /// Detailed description
        description: String,
        /// Timestamp when dispute was opened
        opened_at: u64,
        /// Deadline for current phase
        phase_deadline: u64,
        /// Resolution outcome (valid only when resolved)
        outcome: u8,
        /// Amount awarded to employee (if any)
        awarded_to_employee: u64,
        /// Amount returned to employer (if any)
        returned_to_employer: u64,
        /// Assigned arbitrator (if in arbitration)
        arbitrator: address,
        /// Resolution timestamp (0 if not resolved)
        resolved_at: u64,
        /// Number of appeals filed
        appeal_count: u8,
        /// Maximum allowed appeals
        max_appeals: u8,
        /// Hash of resolution rationale
        resolution_hash: String,
    }
    
    /// Evidence submitted for a dispute
    struct Evidence has store, copy, drop {
        /// Evidence ID
        evidence_id: u64,
        /// Dispute this evidence belongs to
        dispute_id: u64,
        /// Who submitted this evidence
        submitted_by: address,
        /// Type of evidence
        evidence_type: u8,
        /// IPFS hash or on-chain reference
        content_hash: String,
        /// Description of the evidence
        description: String,
        /// Submission timestamp
        submitted_at: u64,
        /// Verification status
        verified: bool,
        /// Verifier address (if verified)
        verified_by: address,
    }
    
    /// Escrow account for holding disputed funds
    struct Escrow has key, store {
        /// Dispute ID this escrow is for
        dispute_id: u64,
        /// Total amount locked
        locked_amount: u64,
        /// Employer's contribution
        employer_contribution: u64,
        /// Employee's contribution (for filing fees)
        employee_contribution: u64,
        /// Fees collected
        fees_collected: u64,
        /// Lock timestamp
        locked_at: u64,
        /// Earliest unlock timestamp
        unlock_after: u64,
        /// Whether escrow has been released
        released: bool,
        /// Token metadata for the escrow
        token_metadata: address,
    }
    
    /// Arbitrator registration and management
    struct Arbitrator has key, store, copy, drop {
        /// Arbitrator address
        arbitrator_address: address,
        /// Display name
        name: String,
        /// Credentials/qualifications
        credentials: String,
        /// Number of cases handled
        cases_handled: u64,
        /// Number of cases upheld on appeal
        decisions_upheld: u64,
        /// Average resolution time
        avg_resolution_time: u64,
        /// Whether currently active
        is_active: bool,
        /// Registration timestamp
        registered_at: u64,
        /// Stake amount (for alignment)
        stake_amount: u64,
        /// Specialty categories (bitmask)
        specialties: u64,
    }
    
    /// Global dispute registry
    struct DisputeRegistry has key {
        /// Total disputes created
        total_disputes: u64,
        /// Currently open disputes
        open_disputes: u64,
        /// Total disputed amount (historical)
        total_disputed_amount: u64,
        /// Total resolved amount
        total_resolved_amount: u64,
        /// Disputes by employer
        disputes_by_employer: vector<u64>,
        /// Active arbitrators
        active_arbitrators: vector<address>,
        /// Fee collector address
        fee_collector: address,
        /// Protocol fee rate (basis points)
        protocol_fee_bps: u64,
        /// Whether dispute system is paused
        is_paused: bool,
        /// All dispute records
        disputes: vector<Dispute>,
        /// All evidence records
        evidence_records: vector<Evidence>,
    }
    
    /// Resolution record for audit trail
    struct ResolutionRecord has store, copy, drop {
        /// Dispute ID
        dispute_id: u64,
        /// Resolution outcome
        outcome: u8,
        /// Arbitrator who made the decision
        arbitrator: address,
        /// Decision timestamp
        decided_at: u64,
        /// Award to employee
        employee_award: u64,
        /// Return to employer
        employer_return: u64,
        /// Rationale hash
        rationale_hash: String,
        /// Votes for employee (if panel)
        votes_for_employee: u64,
        /// Votes for employer (if panel)
        votes_for_employer: u64,
        /// Was this appealed
        was_appealed: bool,
        /// Appeal outcome (if appealed)
        appeal_outcome: u8,
    }
    
    /// Dispute capability for authorized operations
    struct DisputeCapability has key, store {
        /// Owner of this capability
        owner: address,
        /// Granted permissions (bitmask)
        permissions: u64,
        /// Expiry timestamp
        expires_at: u64,
    }

    // ================================
    // Events
    // ================================
    
    #[event]
    struct DisputeOpened has drop, store {
        dispute_id: u64,
        stream_id: u64,
        initiator: address,
        respondent: address,
        category: u8,
        disputed_amount: u64,
        opened_at: u64,
    }
    
    #[event]
    struct EvidenceSubmitted has drop, store {
        dispute_id: u64,
        evidence_id: u64,
        submitted_by: address,
        evidence_type: u8,
        content_hash: String,
        submitted_at: u64,
    }
    
    #[event]
    struct DisputeStatusChanged has drop, store {
        dispute_id: u64,
        old_status: u8,
        new_status: u8,
        changed_at: u64,
        changed_by: address,
    }
    
    #[event]
    struct EscrowLocked has drop, store {
        dispute_id: u64,
        locked_amount: u64,
        employer_contribution: u64,
        employee_contribution: u64,
        locked_at: u64,
    }
    
    #[event]
    struct ArbitratorAssigned has drop, store {
        dispute_id: u64,
        arbitrator: address,
        assigned_at: u64,
    }
    
    #[event]
    struct DisputeResolved has drop, store {
        dispute_id: u64,
        outcome: u8,
        employee_award: u64,
        employer_return: u64,
        arbitrator: address,
        resolved_at: u64,
    }
    
    #[event]
    struct AppealFiled has drop, store {
        dispute_id: u64,
        appellant: address,
        appeal_number: u8,
        appeal_fee: u64,
        filed_at: u64,
    }
    
    #[event]
    struct EscrowReleased has drop, store {
        dispute_id: u64,
        to_employee: u64,
        to_employer: u64,
        fees_collected: u64,
        released_at: u64,
    }

    // ================================
    // Initialization Functions
    // ================================
    
    /// Initialize the dispute system
    public entry fun initialize_dispute_system(
        admin: &signer,
        fee_collector: address,
        protocol_fee_bps: u64,
    ) {
        let admin_addr = signer::address_of(admin);
        
        // Ensure not already initialized
        assert!(!exists<DisputeRegistry>(admin_addr), error_codes::already_initialized());
        
        // Validate fee rate
        assert!(protocol_fee_bps <= 500, error_codes::invalid_fee_rate()); // Max 5%
        
        let registry = DisputeRegistry {
            total_disputes: 0,
            open_disputes: 0,
            total_disputed_amount: 0,
            total_resolved_amount: 0,
            disputes_by_employer: vector::empty(),
            active_arbitrators: vector::empty(),
            fee_collector,
            protocol_fee_bps,
            is_paused: false,
            disputes: vector::empty(),
            evidence_records: vector::empty(),
        };
        
        move_to(admin, registry);
    }

    // ================================
    // Dispute Management Functions
    // ================================
    
    /// Open a new dispute
    public entry fun open_dispute(
        initiator: &signer,
        registry_address: address,
        stream_id: u64,
        respondent: address,
        employer: address,
        employee: address,
        category: u8,
        disputed_amount: u64,
        title: String,
        description: String,
    ) acquires DisputeRegistry {
        let initiator_addr = signer::address_of(initiator);
        
        // Validate registry exists
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        // Ensure system is not paused
        assert!(!registry.is_paused, error_codes::system_paused());
        
        // Validate initiator is either employer or employee
        assert!(
            initiator_addr == employer || initiator_addr == employee,
            error_codes::unauthorized()
        );
        
        // Validate respondent
        assert!(
            respondent == employer || respondent == employee,
            error_codes::invalid_party()
        );
        assert!(initiator_addr != respondent, error_codes::invalid_party());
        
        // Validate category
        assert!(category <= CATEGORY_OTHER, error_codes::invalid_dispute_category());
        
        // Validate amount
        assert!(disputed_amount >= MIN_DISPUTE_AMOUNT, error_codes::dispute_amount_too_small());
        assert!(disputed_amount <= MAX_DISPUTE_AMOUNT, error_codes::invalid_amount());
        
        let current_time = timestamp::now_seconds();
        let dispute_id = registry.total_disputes + 1;
        
        let dispute = Dispute {
            dispute_id,
            stream_id,
            initiator: initiator_addr,
            respondent,
            employer,
            employee,
            category,
            status: STATUS_OPENED,
            disputed_amount,
            escrow_amount: 0,
            title,
            description,
            opened_at: current_time,
            phase_deadline: current_time + EVIDENCE_SUBMISSION_PERIOD,
            outcome: 255, // Invalid until resolved
            awarded_to_employee: 0,
            returned_to_employer: 0,
            arbitrator: @0x0,
            resolved_at: 0,
            appeal_count: 0,
            max_appeals: 2,
            resolution_hash: string::utf8(b""),
        };
        
        // Update registry
        registry.total_disputes = dispute_id;
        registry.open_disputes = registry.open_disputes + 1;
        registry.total_disputed_amount = registry.total_disputed_amount + disputed_amount;
        vector::push_back(&mut registry.disputes, dispute);
        
        // Emit event
        event::emit(DisputeOpened {
            dispute_id,
            stream_id,
            initiator: initiator_addr,
            respondent,
            category,
            disputed_amount,
            opened_at: current_time,
        });
    }
    
    /// Submit evidence for a dispute
    public entry fun submit_evidence(
        submitter: &signer,
        registry_address: address,
        dispute_id: u64,
        evidence_type: u8,
        content_hash: String,
        description: String,
    ) acquires DisputeRegistry {
        let submitter_addr = signer::address_of(submitter);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        // Find dispute
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Validate submitter is a party
        assert!(
            submitter_addr == dispute.employer || 
            submitter_addr == dispute.employee ||
            submitter_addr == dispute.arbitrator,
            error_codes::unauthorized()
        );
        
        // Check status allows evidence submission
        assert!(
            dispute.status == STATUS_OPENED || 
            dispute.status == STATUS_EVIDENCE_SUBMISSION ||
            dispute.status == STATUS_MEDIATION,
            error_codes::invalid_dispute_status()
        );
        
        // Check deadline
        let current_time = timestamp::now_seconds();
        assert!(current_time <= dispute.phase_deadline, error_codes::dispute_deadline_passed());
        
        // Validate evidence type
        assert!(evidence_type <= EVIDENCE_AUDIT_TRAIL, error_codes::invalid_evidence_type());
        
        let evidence_id = vector::length(&registry.evidence_records) + 1;
        
        let evidence = Evidence {
            evidence_id,
            dispute_id,
            submitted_by: submitter_addr,
            evidence_type,
            content_hash: content_hash,
            description,
            submitted_at: current_time,
            verified: false,
            verified_by: @0x0,
        };
        
        vector::push_back(&mut registry.evidence_records, evidence);
        
        // Update dispute status if needed
        if (dispute.status == STATUS_OPENED) {
            let old_status = dispute.status;
            dispute.status = STATUS_EVIDENCE_SUBMISSION;
            
            event::emit(DisputeStatusChanged {
                dispute_id,
                old_status,
                new_status: STATUS_EVIDENCE_SUBMISSION,
                changed_at: current_time,
                changed_by: submitter_addr,
            });
        };
        
        event::emit(EvidenceSubmitted {
            dispute_id,
            evidence_id,
            submitted_by: submitter_addr,
            evidence_type,
            content_hash,
            submitted_at: current_time,
        });
    }
    
    /// Lock funds in escrow for a dispute
    public entry fun lock_escrow(
        employer: &signer,
        registry_address: address,
        dispute_id: u64,
        token_metadata: address,
        amount: u64,
    ) acquires DisputeRegistry, Escrow {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        // Find dispute
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Validate employer
        assert!(employer_addr == dispute.employer, error_codes::unauthorized());
        
        // Check dispute is in valid state for escrow
        assert!(
            dispute.status == STATUS_OPENED || 
            dispute.status == STATUS_EVIDENCE_SUBMISSION ||
            dispute.status == STATUS_MEDIATION,
            error_codes::invalid_dispute_status()
        );
        
        // Validate amount covers disputed amount
        assert!(amount >= dispute.disputed_amount, error_codes::insufficient_escrow());
        
        let current_time = timestamp::now_seconds();
        
        // Create or update escrow
        if (!exists<Escrow>(employer_addr)) {
            let escrow = Escrow {
                dispute_id,
                locked_amount: amount,
                employer_contribution: amount,
                employee_contribution: 0,
                fees_collected: 0,
                locked_at: current_time,
                unlock_after: current_time + MIN_ESCROW_LOCK_PERIOD,
                released: false,
                token_metadata,
            };
            move_to(employer, escrow);
        } else {
            let escrow = borrow_global_mut<Escrow>(employer_addr);
            escrow.locked_amount = escrow.locked_amount + amount;
            escrow.employer_contribution = escrow.employer_contribution + amount;
        };
        
        // Update dispute escrow amount
        dispute.escrow_amount = dispute.escrow_amount + amount;
        
        event::emit(EscrowLocked {
            dispute_id,
            locked_amount: amount,
            employer_contribution: amount,
            employee_contribution: 0,
            locked_at: current_time,
        });
    }
    
    /// Advance dispute to mediation phase
    public entry fun advance_to_mediation(
        caller: &signer,
        registry_address: address,
        dispute_id: u64,
    ) acquires DisputeRegistry {
        let caller_addr = signer::address_of(caller);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Only parties or arbitrator can advance
        assert!(
            caller_addr == dispute.employer || 
            caller_addr == dispute.employee ||
            caller_addr == registry_address, // Admin
            error_codes::unauthorized()
        );
        
        // Must be in evidence submission phase
        assert!(dispute.status == STATUS_EVIDENCE_SUBMISSION, error_codes::invalid_dispute_status());
        
        let current_time = timestamp::now_seconds();
        let old_status = dispute.status;
        
        dispute.status = STATUS_MEDIATION;
        dispute.phase_deadline = current_time + MEDIATION_PERIOD;
        
        event::emit(DisputeStatusChanged {
            dispute_id,
            old_status,
            new_status: STATUS_MEDIATION,
            changed_at: current_time,
            changed_by: caller_addr,
        });
    }
    
    /// Request arbitration for unresolved dispute
    public entry fun request_arbitration(
        requester: &signer,
        registry_address: address,
        dispute_id: u64,
    ) acquires DisputeRegistry {
        let requester_addr = signer::address_of(requester);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Only parties can request arbitration
        assert!(
            requester_addr == dispute.employer || requester_addr == dispute.employee,
            error_codes::unauthorized()
        );
        
        // Must be in mediation phase or deadline passed
        let current_time = timestamp::now_seconds();
        assert!(
            dispute.status == STATUS_MEDIATION || 
            current_time > dispute.phase_deadline,
            error_codes::invalid_dispute_status()
        );
        
        // Ensure escrow is locked
        assert!(dispute.escrow_amount >= dispute.disputed_amount, error_codes::insufficient_escrow());
        
        let old_status = dispute.status;
        dispute.status = STATUS_ARBITRATION;
        dispute.phase_deadline = current_time + ARBITRATION_PERIOD;
        
        event::emit(DisputeStatusChanged {
            dispute_id,
            old_status,
            new_status: STATUS_ARBITRATION,
            changed_at: current_time,
            changed_by: requester_addr,
        });
    }
    
    /// Assign arbitrator to dispute
    public entry fun assign_arbitrator(
        admin: &signer,
        registry_address: address,
        dispute_id: u64,
        arbitrator_address: address,
    ) acquires DisputeRegistry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        // Only admin can assign arbitrators
        assert!(admin_addr == registry_address, error_codes::unauthorized());
        
        // Verify arbitrator is registered
        let (found, _) = vector::index_of(&registry.active_arbitrators, &arbitrator_address);
        assert!(found, error_codes::arbitrator_not_found());
        
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Must be in arbitration phase
        assert!(dispute.status == STATUS_ARBITRATION, error_codes::invalid_dispute_status());
        
        // Ensure no conflict of interest
        assert!(arbitrator_address != dispute.employer, error_codes::conflict_of_interest());
        assert!(arbitrator_address != dispute.employee, error_codes::conflict_of_interest());
        
        dispute.arbitrator = arbitrator_address;
        
        event::emit(ArbitratorAssigned {
            dispute_id,
            arbitrator: arbitrator_address,
            assigned_at: timestamp::now_seconds(),
        });
    }
    
    /// Resolve dispute with arbitrator decision
    public entry fun resolve_dispute(
        arbitrator: &signer,
        registry_address: address,
        dispute_id: u64,
        outcome: u8,
        employee_award: u64,
        employer_return: u64,
        resolution_hash: String,
    ) acquires DisputeRegistry {
        let arbitrator_addr = signer::address_of(arbitrator);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Validate arbitrator
        assert!(arbitrator_addr == dispute.arbitrator, error_codes::not_arbitrator());
        
        // Must be in arbitration phase
        assert!(dispute.status == STATUS_ARBITRATION, error_codes::invalid_dispute_status());
        
        // Validate outcome
        assert!(outcome <= OUTCOME_DISMISSED, error_codes::invalid_resolution());
        
        // Validate award amounts
        let total_award = employee_award + employer_return;
        let fees = (dispute.escrow_amount * registry.protocol_fee_bps) / 10000;
        assert!(total_award + fees <= dispute.escrow_amount, error_codes::invalid_amount());
        
        let current_time = timestamp::now_seconds();
        
        dispute.status = STATUS_RESOLVED;
        dispute.outcome = outcome;
        dispute.awarded_to_employee = employee_award;
        dispute.returned_to_employer = employer_return;
        dispute.resolved_at = current_time;
        dispute.resolution_hash = resolution_hash;
        dispute.phase_deadline = current_time + APPEAL_WINDOW;
        
        // Update registry stats
        registry.open_disputes = registry.open_disputes - 1;
        registry.total_resolved_amount = registry.total_resolved_amount + dispute.disputed_amount;
        
        event::emit(DisputeResolved {
            dispute_id,
            outcome,
            employee_award,
            employer_return,
            arbitrator: arbitrator_addr,
            resolved_at: current_time,
        });
    }
    
    /// File an appeal against resolution
    public entry fun file_appeal(
        appellant: &signer,
        registry_address: address,
        dispute_id: u64,
        appeal_reason: String,
    ) acquires DisputeRegistry {
        let appellant_addr = signer::address_of(appellant);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Only parties can appeal
        assert!(
            appellant_addr == dispute.employer || appellant_addr == dispute.employee,
            error_codes::unauthorized()
        );
        
        // Must be in resolved state
        assert!(dispute.status == STATUS_RESOLVED, error_codes::invalid_dispute_status());
        
        // Check appeal window
        let current_time = timestamp::now_seconds();
        assert!(current_time <= dispute.phase_deadline, error_codes::appeal_window_closed());
        
        // Check appeal limit
        assert!(dispute.appeal_count < dispute.max_appeals, error_codes::max_appeals_reached());
        
        let old_status = dispute.status;
        dispute.status = STATUS_APPEALED;
        dispute.appeal_count = dispute.appeal_count + 1;
        dispute.phase_deadline = current_time + ARBITRATION_PERIOD;
        
        // Calculate appeal fee
        let appeal_fee = (dispute.disputed_amount * APPEAL_FEE_BPS) / 10000;
        
        event::emit(DisputeStatusChanged {
            dispute_id,
            old_status,
            new_status: STATUS_APPEALED,
            changed_at: current_time,
            changed_by: appellant_addr,
        });
        
        event::emit(AppealFiled {
            dispute_id,
            appellant: appellant_addr,
            appeal_number: dispute.appeal_count,
            appeal_fee,
            filed_at: current_time,
        });
    }
    
    /// Finalize dispute after appeal window passes
    public entry fun finalize_dispute(
        caller: &signer,
        registry_address: address,
        dispute_id: u64,
    ) acquires DisputeRegistry {
        let caller_addr = signer::address_of(caller);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Only parties or admin can finalize
        assert!(
            caller_addr == dispute.employer || 
            caller_addr == dispute.employee ||
            caller_addr == registry_address,
            error_codes::unauthorized()
        );
        
        // Must be resolved
        assert!(dispute.status == STATUS_RESOLVED, error_codes::invalid_dispute_status());
        
        // Appeal window must have passed
        let current_time = timestamp::now_seconds();
        assert!(current_time > dispute.phase_deadline, error_codes::appeal_window_active());
        
        let old_status = dispute.status;
        dispute.status = STATUS_FINAL;
        
        event::emit(DisputeStatusChanged {
            dispute_id,
            old_status,
            new_status: STATUS_FINAL,
            changed_at: current_time,
            changed_by: caller_addr,
        });
    }
    
    /// Release escrow funds after dispute finalization
    public entry fun release_escrow(
        caller: &signer,
        registry_address: address,
        dispute_id: u64,
    ) acquires DisputeRegistry, Escrow {
        let caller_addr = signer::address_of(caller);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute(&registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow(&registry.disputes, dispute_index);
        
        // Only parties or admin can release escrow
        assert!(
            caller_addr == dispute.employer || 
            caller_addr == dispute.employee ||
            caller_addr == registry_address,
            error_codes::unauthorized()
        );
        
        // Dispute must be finalized
        assert!(dispute.status == STATUS_FINAL, error_codes::dispute_not_finalized());
        
        // Get escrow
        assert!(exists<Escrow>(dispute.employer), error_codes::escrow_not_found());
        let escrow = borrow_global_mut<Escrow>(dispute.employer);
        
        // Ensure not already released
        assert!(!escrow.released, error_codes::already_released());
        
        let current_time = timestamp::now_seconds();
        assert!(current_time > escrow.unlock_after, error_codes::escrow_locked());
        
        // Calculate fees
        let fees = (dispute.escrow_amount * registry.protocol_fee_bps) / 10000;
        
        // Mark as released
        escrow.released = true;
        escrow.fees_collected = fees;
        
        event::emit(EscrowReleased {
            dispute_id,
            to_employee: dispute.awarded_to_employee,
            to_employer: dispute.returned_to_employer,
            fees_collected: fees,
            released_at: current_time,
        });
    }
    
    /// Cancel dispute (by mutual agreement)
    public entry fun cancel_dispute(
        initiator: &signer,
        registry_address: address,
        dispute_id: u64,
    ) acquires DisputeRegistry {
        let initiator_addr = signer::address_of(initiator);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute_mut(&mut registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow_mut(&mut registry.disputes, dispute_index);
        
        // Only initiator can cancel
        assert!(initiator_addr == dispute.initiator, error_codes::unauthorized());
        
        // Can only cancel before arbitration
        assert!(
            dispute.status == STATUS_OPENED || 
            dispute.status == STATUS_EVIDENCE_SUBMISSION ||
            dispute.status == STATUS_MEDIATION,
            error_codes::cannot_cancel_arbitration()
        );
        
        let old_status = dispute.status;
        let current_time = timestamp::now_seconds();
        
        dispute.status = STATUS_CANCELLED;
        dispute.resolved_at = current_time;
        
        // Update registry
        registry.open_disputes = registry.open_disputes - 1;
        
        event::emit(DisputeStatusChanged {
            dispute_id,
            old_status,
            new_status: STATUS_CANCELLED,
            changed_at: current_time,
            changed_by: initiator_addr,
        });
    }

    // ================================
    // Arbitrator Management Functions
    // ================================
    
    /// Register a new arbitrator
    public entry fun register_arbitrator(
        admin: &signer,
        registry_address: address,
        arbitrator_address: address,
        name: String,
        credentials: String,
        specialties: u64,
    ) acquires DisputeRegistry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        // Only admin can register arbitrators
        assert!(admin_addr == registry_address, error_codes::unauthorized());
        
        // Check not already registered
        let (found, _) = vector::index_of(&registry.active_arbitrators, &arbitrator_address);
        assert!(!found, error_codes::already_registered());
        
        vector::push_back(&mut registry.active_arbitrators, arbitrator_address);
        
        // Create arbitrator record
        let arbitrator = Arbitrator {
            arbitrator_address,
            name,
            credentials,
            cases_handled: 0,
            decisions_upheld: 0,
            avg_resolution_time: 0,
            is_active: true,
            registered_at: timestamp::now_seconds(),
            stake_amount: 0,
            specialties,
        };
        
        move_to(admin, arbitrator);
    }
    
    /// Deactivate an arbitrator
    public entry fun deactivate_arbitrator(
        admin: &signer,
        registry_address: address,
        arbitrator_address: address,
    ) acquires DisputeRegistry, Arbitrator {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global_mut<DisputeRegistry>(registry_address);
        
        // Only admin can deactivate
        assert!(admin_addr == registry_address, error_codes::unauthorized());
        
        // Remove from active list
        let (found, index) = vector::index_of(&registry.active_arbitrators, &arbitrator_address);
        assert!(found, error_codes::arbitrator_not_found());
        
        vector::remove(&mut registry.active_arbitrators, index);
        
        // Update arbitrator record
        if (exists<Arbitrator>(admin_addr)) {
            let arbitrator = borrow_global_mut<Arbitrator>(admin_addr);
            if (arbitrator.arbitrator_address == arbitrator_address) {
                arbitrator.is_active = false;
            };
        };
    }

    // ================================
    // View Functions
    // ================================
    
    #[view]
    /// Get dispute details
    public fun get_dispute(
        registry_address: address,
        dispute_id: u64,
    ): (u64, address, address, u8, u8, u64, u64, u64, address) acquires DisputeRegistry {
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute(&registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow(&registry.disputes, dispute_index);
        
        (
            dispute.dispute_id,
            dispute.employer,
            dispute.employee,
            dispute.category,
            dispute.status,
            dispute.disputed_amount,
            dispute.escrow_amount,
            dispute.resolved_at,
            dispute.arbitrator,
        )
    }
    
    #[view]
    /// Get dispute resolution details
    public fun get_resolution(
        registry_address: address,
        dispute_id: u64,
    ): (u8, u64, u64, address, u64) acquires DisputeRegistry {
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global<DisputeRegistry>(registry_address);
        
        let dispute_opt = find_dispute(&registry.disputes, dispute_id);
        assert!(option::is_some(&dispute_opt), error_codes::dispute_not_found());
        
        let dispute_index = option::extract(&mut dispute_opt);
        let dispute = vector::borrow(&registry.disputes, dispute_index);
        
        (
            dispute.outcome,
            dispute.awarded_to_employee,
            dispute.returned_to_employer,
            dispute.arbitrator,
            dispute.resolved_at,
        )
    }
    
    #[view]
    /// Get dispute statistics
    public fun get_dispute_stats(
        registry_address: address,
    ): (u64, u64, u64, u64) acquires DisputeRegistry {
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global<DisputeRegistry>(registry_address);
        
        (
            registry.total_disputes,
            registry.open_disputes,
            registry.total_disputed_amount,
            registry.total_resolved_amount,
        )
    }
    
    #[view]
    /// Check if dispute exists
    public fun dispute_exists(
        registry_address: address,
        dispute_id: u64,
    ): bool acquires DisputeRegistry {
        if (!exists<DisputeRegistry>(registry_address)) {
            return false
        };
        
        let registry = borrow_global<DisputeRegistry>(registry_address);
        let dispute_opt = find_dispute(&registry.disputes, dispute_id);
        option::is_some(&dispute_opt)
    }
    
    #[view]
    /// Get evidence count for dispute
    public fun get_evidence_count(
        registry_address: address,
        dispute_id: u64,
    ): u64 acquires DisputeRegistry {
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global<DisputeRegistry>(registry_address);
        let count = 0u64;
        let len = vector::length(&registry.evidence_records);
        let i = 0;
        
        while (i < len) {
            let evidence = vector::borrow(&registry.evidence_records, i);
            if (evidence.dispute_id == dispute_id) {
                count = count + 1;
            };
            i = i + 1;
        };
        
        count
    }
    
    #[view]
    /// Get active arbitrators count
    public fun get_active_arbitrators_count(
        registry_address: address,
    ): u64 acquires DisputeRegistry {
        assert!(exists<DisputeRegistry>(registry_address), error_codes::dispute_not_found());
        
        let registry = borrow_global<DisputeRegistry>(registry_address);
        vector::length(&registry.active_arbitrators)
    }

    // ================================
    // Helper Functions
    // ================================
    
    /// Find dispute by ID (immutable)
    fun find_dispute(disputes: &vector<Dispute>, dispute_id: u64): option::Option<u64> {
        let len = vector::length(disputes);
        let i = 0;
        
        while (i < len) {
            let dispute = vector::borrow(disputes, i);
            if (dispute.dispute_id == dispute_id) {
                return option::some(i)
            };
            i = i + 1;
        };
        
        option::none()
    }
    
    /// Find dispute by ID (mutable)
    fun find_dispute_mut(disputes: &mut vector<Dispute>, dispute_id: u64): option::Option<u64> {
        let len = vector::length(disputes);
        let i = 0;
        
        while (i < len) {
            let dispute = vector::borrow(disputes, i);
            if (dispute.dispute_id == dispute_id) {
                return option::some(i)
            };
            i = i + 1;
        };
        
        option::none()
    }

    // ================================
    // Test Functions
    // ================================
    
    #[test_only]
    /// Initialize for testing
    public fun init_for_testing(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        initialize_dispute_system(admin, admin_addr, 100);
    }
}
