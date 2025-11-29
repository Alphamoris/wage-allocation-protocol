/// Error codes and constants used across all wage protocol modules
/// 
/// Error Code Ranges:
/// - 1000-1099: Wage streaming errors
/// - 1100-1199: Treasury errors
/// - 1200-1299: Compliance errors
/// - 1300-1399: Dispute errors
/// - 1400-1499: Access control errors
/// - 1500-1599: Input validation errors
/// - 1600-1699: Emergency/system errors
/// - 1700-1799: Rate limiting/throttling errors
module wage_streaming_addr::error_codes {
    
    // ==================== Wage Streaming Errors (1000-1099) ====================
    
    /// No active stream found for the employee
    const E_STREAM_NOT_FOUND: u64 = 1000;
    /// An active stream already exists for this employee-employer pair
    const E_STREAM_ALREADY_EXISTS: u64 = 1001;
    /// Stream is not in active status
    const E_STREAM_NOT_ACTIVE: u64 = 1002;
    /// Withdrawal amount exceeds accrued wages
    const E_INSUFFICIENT_ACCRUED_WAGES: u64 = 1003;
    /// Invalid wage rate (zero or out of bounds)
    const E_INVALID_WAGE_RATE: u64 = 1004;
    /// Invalid timestamp provided
    const E_INVALID_TIMESTAMP: u64 = 1005;
    /// Stream is paused
    const E_STREAM_PAUSED: u64 = 1006;
    /// Stream is already terminated
    const E_STREAM_TERMINATED: u64 = 1007;
    /// Stream is already paused
    const E_STREAM_ALREADY_PAUSED: u64 = 1008;
    /// Cannot resume a non-paused stream
    const E_STREAM_NOT_PAUSED: u64 = 1009;
    /// Employee cannot have multiple active streams from same employer
    const E_DUPLICATE_STREAM: u64 = 1010;
    
    // ==================== Treasury Errors (1100-1199) ====================
    
    /// Employer treasury balance is insufficient
    const E_INSUFFICIENT_TREASURY_BALANCE: u64 = 1100;
    /// Cannot withdraw more than available surplus
    const E_INSUFFICIENT_SURPLUS: u64 = 1101;
    /// Treasury has not been initialized for this employer
    const E_TREASURY_NOT_INITIALIZED: u64 = 1102;
    /// Deposit amount is below minimum threshold
    const E_MINIMUM_DEPOSIT_NOT_MET: u64 = 1103;
    /// Treasury already initialized for this employer
    const E_TREASURY_ALREADY_INITIALIZED: u64 = 1104;
    /// Cannot process: employer treasury is locked
    const E_TREASURY_LOCKED: u64 = 1105;
    /// Withdrawal would exceed safe reserve threshold
    const E_RESERVE_VIOLATION: u64 = 1106;
    
    // ==================== Compliance Errors (1200-1299) ====================
    
    /// Invalid compliance data provided
    const E_INVALID_COMPLIANCE_DATA: u64 = 1200;
    /// Certificate not found
    const E_CERTIFICATE_NOT_FOUND: u64 = 1201;
    /// Certificate has expired
    const E_CERTIFICATE_EXPIRED: u64 = 1202;
    /// Invalid tax regime selection
    const E_INVALID_TAX_REGIME: u64 = 1203;
    /// Employee PAN not registered
    const E_PAN_NOT_REGISTERED: u64 = 1204;
    /// Form generation failed
    const E_FORM_GENERATION_FAILED: u64 = 1205;
    /// Compliance record already exists
    const E_COMPLIANCE_RECORD_EXISTS: u64 = 1206;
    
    // ==================== Dispute Errors (1300-1399) ====================
    
    /// Dispute not found
    const E_DISPUTE_NOT_FOUND: u64 = 1300;
    /// Dispute has already been resolved
    const E_DISPUTE_ALREADY_RESOLVED: u64 = 1301;
    /// Appeal window has expired
    const E_APPEAL_WINDOW_EXPIRED: u64 = 1302;
    /// Insufficient funds in escrow
    const E_INSUFFICIENT_ESCROW: u64 = 1303;
    /// Dispute amount exceeds allowed threshold
    const E_DISPUTE_AMOUNT_EXCEEDS_LIMIT: u64 = 1304;
    /// Not authorized to respond to this dispute
    const E_NOT_DISPUTE_PARTY: u64 = 1305;
    /// Negotiation period has not elapsed
    const E_NEGOTIATION_PERIOD_ACTIVE: u64 = 1306;
    /// Dispute has already been appealed
    const E_ALREADY_APPEALED: u64 = 1307;
    /// Not assigned as arbitrator for this dispute
    const E_NOT_ARBITRATOR: u64 = 1308;
    /// Ruling amounts do not match escrowed amount
    const E_RULING_AMOUNT_MISMATCH: u64 = 1309;
    /// Duplicate dispute for the same period
    const E_DUPLICATE_DISPUTE: u64 = 1310;
    /// Invalid dispute category
    const E_INVALID_DISPUTE_CATEGORY: u64 = 1311;
    /// Invalid dispute status for operation
    const E_INVALID_DISPUTE_STATUS: u64 = 1312;
    /// Dispute deadline has passed
    const E_DISPUTE_DEADLINE_PASSED: u64 = 1313;
    /// Invalid evidence type
    const E_INVALID_EVIDENCE_TYPE: u64 = 1314;
    /// Invalid party specified
    const E_INVALID_PARTY: u64 = 1315;
    /// Dispute amount too small
    const E_DISPUTE_AMOUNT_TOO_SMALL: u64 = 1316;
    /// Invalid resolution provided
    const E_INVALID_RESOLUTION: u64 = 1317;
    /// Arbitrator not found
    const E_ARBITRATOR_NOT_FOUND: u64 = 1318;
    /// Conflict of interest detected
    const E_CONFLICT_OF_INTEREST: u64 = 1319;
    /// Maximum appeals reached
    const E_MAX_APPEALS_REACHED: u64 = 1320;
    /// Appeal window closed
    const E_APPEAL_WINDOW_CLOSED: u64 = 1321;
    /// Appeal window still active
    const E_APPEAL_WINDOW_ACTIVE: u64 = 1322;
    /// Dispute not finalized
    const E_DISPUTE_NOT_FINALIZED: u64 = 1323;
    /// Escrow not found
    const E_ESCROW_NOT_FOUND: u64 = 1324;
    /// Already released
    const E_ALREADY_RELEASED: u64 = 1325;
    /// Escrow locked
    const E_ESCROW_LOCKED: u64 = 1326;
    /// Cannot cancel after arbitration started
    const E_CANNOT_CANCEL_ARBITRATION: u64 = 1327;
    /// Already registered
    const E_ALREADY_REGISTERED: u64 = 1328;
    
    // ==================== Access Control Errors (1400-1499) ====================
    
    /// Caller is not authorized to perform this action
    const E_UNAUTHORIZED: u64 = 1400;
    /// Required capability not found
    const E_MISSING_CAPABILITY: u64 = 1401;
    /// Invalid signer provided
    const E_INVALID_SIGNER: u64 = 1402;
    /// Only employer can perform this action
    const E_NOT_EMPLOYER: u64 = 1403;
    /// Only employee can perform this action
    const E_NOT_EMPLOYEE: u64 = 1404;
    /// Only admin can perform this action
    const E_NOT_ADMIN: u64 = 1405;
    /// Multi-sig threshold not met
    const E_MULTISIG_THRESHOLD_NOT_MET: u64 = 1406;
    /// Capability already granted
    const E_CAPABILITY_ALREADY_GRANTED: u64 = 1407;
    /// Role already assigned to holder
    const E_ALREADY_HAS_ROLE: u64 = 1408;
    /// Role not found
    const E_ROLE_NOT_FOUND: u64 = 1409;
    /// Action not found
    const E_ACTION_NOT_FOUND: u64 = 1410;
    /// Action has expired
    const E_ACTION_EXPIRED: u64 = 1411;
    /// Action already executed
    const E_ALREADY_EXECUTED: u64 = 1412;
    /// Already approved by this signer
    const E_ALREADY_APPROVED: u64 = 1413;
    /// Insufficient approvals
    const E_INSUFFICIENT_APPROVALS: u64 = 1414;
    
    // ==================== Input Validation Errors (1500-1599) ====================
    
    /// Zero address provided
    const E_ZERO_ADDRESS: u64 = 1500;
    /// Zero amount provided where non-zero expected
    const E_ZERO_AMOUNT: u64 = 1501;
    /// Amount exceeds allowed bounds
    const E_AMOUNT_OUT_OF_BOUNDS: u64 = 1502;
    /// String length exceeds maximum
    const E_INVALID_STRING_LENGTH: u64 = 1503;
    /// Invalid percentage value (must be <= 10000 basis points)
    const E_INVALID_PERCENTAGE: u64 = 1504;
    /// Start date is in the past (beyond grace period)
    const E_INVALID_START_DATE: u64 = 1505;
    /// Duration exceeds maximum allowed
    const E_INVALID_DURATION: u64 = 1506;
    /// Self-reference not allowed
    const E_SELF_REFERENCE: u64 = 1507;
    /// Invalid amount
    const E_INVALID_AMOUNT: u64 = 1508;
    /// Invalid fee rate
    const E_INVALID_FEE_RATE: u64 = 1509;
    /// Invalid module index
    const E_INVALID_MODULE: u64 = 1510;
    
    // ==================== Emergency/System Errors (1600-1699) ====================
    
    /// Protocol is currently paused
    const E_PROTOCOL_PAUSED: u64 = 1600;
    /// Emergency pause already active
    const E_ALREADY_PAUSED: u64 = 1601;
    /// Protocol is not paused
    const E_NOT_PAUSED: u64 = 1602;
    /// Upgrade failed
    const E_UPGRADE_FAILED: u64 = 1603;
    /// Migration in progress
    const E_MIGRATION_IN_PROGRESS: u64 = 1604;
    /// System not initialized
    const E_NOT_INITIALIZED: u64 = 1605;
    /// System already initialized
    const E_ALREADY_INITIALIZED: u64 = 1606;
    /// System is paused
    const E_SYSTEM_PAUSED: u64 = 1607;
    /// Pause duration too short
    const E_PAUSE_DURATION_TOO_SHORT: u64 = 1608;
    /// Pause duration too long
    const E_PAUSE_DURATION_TOO_LONG: u64 = 1609;
    /// System in emergency state
    const E_SYSTEM_IN_EMERGENCY: u64 = 1610;
    /// Not in emergency state
    const E_NOT_IN_EMERGENCY: u64 = 1611;
    /// Upgrade already in progress
    const E_UPGRADE_IN_PROGRESS: u64 = 1612;
    /// No upgrade pending
    const E_NO_UPGRADE_PENDING: u64 = 1613;
    
    // ==================== Rate Limiting Errors (1700-1799) ====================
    
    /// Rate limit exceeded
    const E_RATE_LIMIT_EXCEEDED: u64 = 1700;
    /// Cooldown period active
    const E_COOLDOWN_ACTIVE: u64 = 1701;

    // ==================== Public Accessor Functions ====================
    // These functions expose error codes for use by other modules

    // Wage Streaming Errors
    public fun stream_not_found(): u64 { E_STREAM_NOT_FOUND }
    public fun stream_already_exists(): u64 { E_STREAM_ALREADY_EXISTS }
    public fun stream_not_active(): u64 { E_STREAM_NOT_ACTIVE }
    public fun insufficient_accrued_wages(): u64 { E_INSUFFICIENT_ACCRUED_WAGES }
    public fun invalid_wage_rate(): u64 { E_INVALID_WAGE_RATE }
    public fun invalid_timestamp(): u64 { E_INVALID_TIMESTAMP }
    public fun stream_paused(): u64 { E_STREAM_PAUSED }
    public fun stream_terminated(): u64 { E_STREAM_TERMINATED }
    public fun stream_already_paused(): u64 { E_STREAM_ALREADY_PAUSED }
    public fun stream_not_paused(): u64 { E_STREAM_NOT_PAUSED }
    public fun duplicate_stream(): u64 { E_DUPLICATE_STREAM }

    // Treasury Errors
    public fun insufficient_treasury_balance(): u64 { E_INSUFFICIENT_TREASURY_BALANCE }
    public fun insufficient_surplus(): u64 { E_INSUFFICIENT_SURPLUS }
    public fun treasury_not_initialized(): u64 { E_TREASURY_NOT_INITIALIZED }
    public fun minimum_deposit_not_met(): u64 { E_MINIMUM_DEPOSIT_NOT_MET }
    public fun treasury_already_initialized(): u64 { E_TREASURY_ALREADY_INITIALIZED }
    public fun treasury_locked(): u64 { E_TREASURY_LOCKED }
    public fun reserve_violation(): u64 { E_RESERVE_VIOLATION }

    // Compliance Errors
    public fun invalid_compliance_data(): u64 { E_INVALID_COMPLIANCE_DATA }
    public fun certificate_not_found(): u64 { E_CERTIFICATE_NOT_FOUND }
    public fun certificate_expired(): u64 { E_CERTIFICATE_EXPIRED }
    public fun invalid_tax_regime(): u64 { E_INVALID_TAX_REGIME }
    public fun pan_not_registered(): u64 { E_PAN_NOT_REGISTERED }
    public fun form_generation_failed(): u64 { E_FORM_GENERATION_FAILED }
    public fun compliance_record_exists(): u64 { E_COMPLIANCE_RECORD_EXISTS }

    // Dispute Errors
    public fun dispute_not_found(): u64 { E_DISPUTE_NOT_FOUND }
    public fun dispute_already_resolved(): u64 { E_DISPUTE_ALREADY_RESOLVED }
    public fun appeal_window_expired(): u64 { E_APPEAL_WINDOW_EXPIRED }
    public fun insufficient_escrow(): u64 { E_INSUFFICIENT_ESCROW }
    public fun dispute_amount_exceeds_limit(): u64 { E_DISPUTE_AMOUNT_EXCEEDS_LIMIT }
    public fun not_dispute_party(): u64 { E_NOT_DISPUTE_PARTY }
    public fun negotiation_period_active(): u64 { E_NEGOTIATION_PERIOD_ACTIVE }
    public fun already_appealed(): u64 { E_ALREADY_APPEALED }
    public fun not_arbitrator(): u64 { E_NOT_ARBITRATOR }
    public fun ruling_amount_mismatch(): u64 { E_RULING_AMOUNT_MISMATCH }
    public fun duplicate_dispute(): u64 { E_DUPLICATE_DISPUTE }
    public fun invalid_dispute_category(): u64 { E_INVALID_DISPUTE_CATEGORY }
    public fun invalid_dispute_status(): u64 { E_INVALID_DISPUTE_STATUS }
    public fun dispute_deadline_passed(): u64 { E_DISPUTE_DEADLINE_PASSED }
    public fun invalid_evidence_type(): u64 { E_INVALID_EVIDENCE_TYPE }
    public fun invalid_party(): u64 { E_INVALID_PARTY }
    public fun dispute_amount_too_small(): u64 { E_DISPUTE_AMOUNT_TOO_SMALL }
    public fun invalid_resolution(): u64 { E_INVALID_RESOLUTION }
    public fun arbitrator_not_found(): u64 { E_ARBITRATOR_NOT_FOUND }
    public fun conflict_of_interest(): u64 { E_CONFLICT_OF_INTEREST }
    public fun max_appeals_reached(): u64 { E_MAX_APPEALS_REACHED }
    public fun appeal_window_closed(): u64 { E_APPEAL_WINDOW_CLOSED }
    public fun appeal_window_active(): u64 { E_APPEAL_WINDOW_ACTIVE }
    public fun dispute_not_finalized(): u64 { E_DISPUTE_NOT_FINALIZED }
    public fun escrow_not_found(): u64 { E_ESCROW_NOT_FOUND }
    public fun already_released(): u64 { E_ALREADY_RELEASED }
    public fun escrow_locked(): u64 { E_ESCROW_LOCKED }
    public fun cannot_cancel_arbitration(): u64 { E_CANNOT_CANCEL_ARBITRATION }
    public fun already_registered(): u64 { E_ALREADY_REGISTERED }

    // Access Control Errors
    public fun unauthorized(): u64 { E_UNAUTHORIZED }
    public fun missing_capability(): u64 { E_MISSING_CAPABILITY }
    public fun invalid_signer(): u64 { E_INVALID_SIGNER }
    public fun not_employer(): u64 { E_NOT_EMPLOYER }
    public fun not_employee(): u64 { E_NOT_EMPLOYEE }
    public fun not_admin(): u64 { E_NOT_ADMIN }
    public fun multisig_threshold_not_met(): u64 { E_MULTISIG_THRESHOLD_NOT_MET }
    public fun capability_already_granted(): u64 { E_CAPABILITY_ALREADY_GRANTED }
    public fun already_has_role(): u64 { E_ALREADY_HAS_ROLE }
    public fun role_not_found(): u64 { E_ROLE_NOT_FOUND }
    public fun action_not_found(): u64 { E_ACTION_NOT_FOUND }
    public fun action_expired(): u64 { E_ACTION_EXPIRED }
    public fun already_executed(): u64 { E_ALREADY_EXECUTED }
    public fun already_approved(): u64 { E_ALREADY_APPROVED }
    public fun insufficient_approvals(): u64 { E_INSUFFICIENT_APPROVALS }

    // Validation Errors
    public fun zero_address(): u64 { E_ZERO_ADDRESS }
    public fun zero_amount(): u64 { E_ZERO_AMOUNT }
    public fun amount_out_of_bounds(): u64 { E_AMOUNT_OUT_OF_BOUNDS }
    public fun invalid_string_length(): u64 { E_INVALID_STRING_LENGTH }
    public fun invalid_percentage(): u64 { E_INVALID_PERCENTAGE }
    public fun invalid_start_date(): u64 { E_INVALID_START_DATE }
    public fun invalid_duration(): u64 { E_INVALID_DURATION }
    public fun self_reference(): u64 { E_SELF_REFERENCE }
    public fun invalid_amount(): u64 { E_INVALID_AMOUNT }
    public fun invalid_fee_rate(): u64 { E_INVALID_FEE_RATE }
    public fun invalid_module(): u64 { E_INVALID_MODULE }

    // Emergency/System Errors
    public fun protocol_paused(): u64 { E_PROTOCOL_PAUSED }
    public fun already_paused(): u64 { E_ALREADY_PAUSED }
    public fun not_paused(): u64 { E_NOT_PAUSED }
    public fun upgrade_failed(): u64 { E_UPGRADE_FAILED }
    public fun migration_in_progress(): u64 { E_MIGRATION_IN_PROGRESS }
    public fun not_initialized(): u64 { E_NOT_INITIALIZED }
    public fun already_initialized(): u64 { E_ALREADY_INITIALIZED }
    public fun system_paused(): u64 { E_SYSTEM_PAUSED }
    public fun pause_duration_too_short(): u64 { E_PAUSE_DURATION_TOO_SHORT }
    public fun pause_duration_too_long(): u64 { E_PAUSE_DURATION_TOO_LONG }
    public fun system_in_emergency(): u64 { E_SYSTEM_IN_EMERGENCY }
    public fun not_in_emergency(): u64 { E_NOT_IN_EMERGENCY }
    public fun upgrade_in_progress(): u64 { E_UPGRADE_IN_PROGRESS }
    public fun no_upgrade_pending(): u64 { E_NO_UPGRADE_PENDING }

    // Rate Limiting Errors
    public fun rate_limit_exceeded(): u64 { E_RATE_LIMIT_EXCEEDED }
    public fun cooldown_active(): u64 { E_COOLDOWN_ACTIVE }

    // Additional Wage Streaming Errors
    public fun invalid_address(): u64 { E_ZERO_ADDRESS }
    public fun amount_too_small(): u64 { E_MINIMUM_DEPOSIT_NOT_MET }
    public fun duration_too_short(): u64 { E_INVALID_DURATION }
    public fun duration_too_long(): u64 { E_INVALID_DURATION }
    public fun too_many_streams(): u64 { E_AMOUNT_OUT_OF_BOUNDS }
    public fun rate_too_low(): u64 { E_INVALID_WAGE_RATE }
    public fun nothing_to_withdraw(): u64 { E_INSUFFICIENT_ACCRUED_WAGES }
    public fun no_active_streams(): u64 { E_STREAM_NOT_FOUND }
    public fun invalid_status(): u64 { E_INVALID_DISPUTE_STATUS }

    // Additional Treasury Errors
    public fun treasury_frozen(): u64 { E_TREASURY_LOCKED }
    public fun allocation_too_large(): u64 { E_AMOUNT_OUT_OF_BOUNDS }
    public fun insufficient_funds(): u64 { E_INSUFFICIENT_TREASURY_BALANCE }
    public fun stream_already_funded(): u64 { E_STREAM_ALREADY_EXISTS }
    public fun allocation_not_found(): u64 { E_STREAM_NOT_FOUND }
    public fun insufficient_allocation(): u64 { E_INSUFFICIENT_TREASURY_BALANCE }
    public fun reserve_required(): u64 { E_RESERVE_VIOLATION }
    public fun insufficient_reserve(): u64 { E_RESERVE_VIOLATION }

    // Additional Compliance Errors
    public fun employer_not_registered(): u64 { E_TREASURY_NOT_INITIALIZED }
    public fun employee_not_registered(): u64 { E_PAN_NOT_REGISTERED }

    // Additional Photon/Rewards Errors
    public fun not_authorized(): u64 { E_UNAUTHORIZED }
    public fun invalid_rarity(): u64 { E_INVALID_AMOUNT }
    public fun photon_integration_disabled(): u64 { E_PROTOCOL_PAUSED }
    public fun campaign_not_found(): u64 { E_STREAM_NOT_FOUND }
    public fun campaign_not_active(): u64 { E_STREAM_NOT_ACTIVE }
    
    // Photon Campaign Errors
    public fun invalid_fee_percentage(): u64 { E_INVALID_PERCENTAGE }
    public fun invalid_time_range(): u64 { E_INVALID_DURATION }
    public fun invalid_reward_type(): u64 { E_INVALID_AMOUNT }
    public fun invalid_trigger_type(): u64 { E_INVALID_AMOUNT }
    public fun max_campaigns_exceeded(): u64 { E_AMOUNT_OUT_OF_BOUNDS }
    public fun campaign_already_active(): u64 { E_STREAM_ALREADY_EXISTS }
    public fun max_milestones_exceeded(): u64 { E_AMOUNT_OUT_OF_BOUNDS }
    public fun invalid_tier_config(): u64 { E_INVALID_AMOUNT }
    public fun invalid_campaign_status(): u64 { E_INVALID_DISPUTE_STATUS }
    public fun campaign_expired(): u64 { E_CERTIFICATE_EXPIRED }
    public fun no_milestones_defined(): u64 { E_INVALID_COMPLIANCE_DATA }
    public fun no_tiers_defined(): u64 { E_INVALID_COMPLIANCE_DATA }
    public fun campaign_not_started(): u64 { E_INVALID_START_DATE }
    public fun campaign_full(): u64 { E_AMOUNT_OUT_OF_BOUNDS }
    public fun insufficient_eligibility(): u64 { E_UNAUTHORIZED }
    public fun invalid_referral(): u64 { E_SELF_REFERENCE }
    public fun referrer_not_found(): u64 { E_STREAM_NOT_FOUND }
    public fun not_registered(): u64 { E_NOT_INITIALIZED }
    public fun campaign_mismatch(): u64 { E_INVALID_AMOUNT }
    public fun participation_inactive(): u64 { E_STREAM_NOT_ACTIVE }
    public fun no_rewards_to_claim(): u64 { E_INSUFFICIENT_ACCRUED_WAGES }
}
