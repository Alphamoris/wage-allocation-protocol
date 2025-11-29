/// Photon Rewards Module - Campaign-based rewards and gamification
/// Integrates with Photon API for engagement tracking and reward distribution
module wage_streaming_addr::photon_rewards {
    use std::string::{Self, String};
    use std::vector;
    use std::signer;
    use std::option::{Self, Option};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::fungible_asset::{Self, FungibleAsset, Metadata};
    use aptos_framework::primary_fungible_store;
    use wage_streaming_addr::error_codes;

    // ============================================
    // CONSTANTS
    // ============================================
    
    /// Maximum campaigns per employer
    const MAX_CAMPAIGNS_PER_EMPLOYER: u64 = 50;
    
    /// Maximum participants per campaign
    const MAX_PARTICIPANTS_PER_CAMPAIGN: u64 = 10000;
    
    /// Maximum milestones per campaign
    const MAX_MILESTONES_PER_CAMPAIGN: u64 = 20;
    
    /// Minimum campaign duration (1 day)
    const MIN_CAMPAIGN_DURATION: u64 = 86400;
    
    /// Maximum campaign duration (365 days)
    const MAX_CAMPAIGN_DURATION: u64 = 31536000;
    
    /// PAT token precision (6 decimals)
    const PAT_PRECISION: u64 = 1000000;
    
    // Campaign status constants
    const CAMPAIGN_STATUS_DRAFT: u8 = 0;
    const CAMPAIGN_STATUS_ACTIVE: u8 = 1;
    const CAMPAIGN_STATUS_PAUSED: u8 = 2;
    const CAMPAIGN_STATUS_COMPLETED: u8 = 3;
    const CAMPAIGN_STATUS_CANCELLED: u8 = 4;
    
    // Reward type constants
    const REWARD_TYPE_FIXED: u8 = 0;
    const REWARD_TYPE_PERCENTAGE: u8 = 1;
    const REWARD_TYPE_TIERED: u8 = 2;
    const REWARD_TYPE_MILESTONE: u8 = 3;
    
    // Trigger type constants
    const TRIGGER_ATTENDANCE: u8 = 0;
    const TRIGGER_PERFORMANCE: u8 = 1;
    const TRIGGER_REFERRAL: u8 = 2;
    const TRIGGER_MILESTONE: u8 = 3;
    const TRIGGER_STREAK: u8 = 4;
    const TRIGGER_CUSTOM: u8 = 5;

    // ============================================
    // STRUCTS
    // ============================================

    /// Campaign milestone definition
    struct Milestone has store, copy, drop {
        /// Milestone identifier
        milestone_id: u64,
        /// Name of the milestone
        name: String,
        /// Description of achievement required
        description: String,
        /// Target value to achieve
        target_value: u64,
        /// Reward amount for completing this milestone
        reward_amount: u64,
        /// Whether this is a required milestone
        is_required: bool,
        /// Order in milestone sequence
        sequence_order: u64,
    }

    /// Tier configuration for tiered rewards
    struct RewardTier has store, copy, drop {
        /// Tier level (1 = lowest, higher = better)
        tier_level: u64,
        /// Minimum score/value to reach this tier
        min_threshold: u64,
        /// Maximum score/value for this tier
        max_threshold: u64,
        /// Reward multiplier (in basis points, 10000 = 1x)
        reward_multiplier: u64,
        /// Bonus amount for reaching this tier
        bonus_amount: u64,
    }

    /// Photon Campaign configuration
    struct PhotonCampaign has key, store {
        /// Unique campaign identifier
        campaign_id: u64,
        /// Employer who created the campaign
        employer: address,
        /// Campaign name
        name: String,
        /// Campaign description
        description: String,
        /// Campaign status (draft, active, paused, completed, cancelled)
        status: u8,
        /// Type of reward distribution
        reward_type: u8,
        /// Trigger type for rewards
        trigger_type: u8,
        /// Start timestamp
        start_time: u64,
        /// End timestamp
        end_time: u64,
        /// Total budget allocated for campaign
        total_budget: u64,
        /// Amount already distributed
        distributed_amount: u64,
        /// Per-participant reward cap
        per_participant_cap: u64,
        /// Minimum eligibility score
        min_eligibility_score: u64,
        /// Token metadata for rewards
        reward_token_metadata: Object<Metadata>,
        /// Campaign milestones
        milestones: vector<Milestone>,
        /// Reward tiers for tiered campaigns
        reward_tiers: vector<RewardTier>,
        /// Total participants registered
        total_participants: u64,
        /// Participants who claimed rewards
        claimed_participants: u64,
        /// Photon external campaign ID for API integration
        photon_external_id: String,
        /// Created timestamp
        created_at: u64,
        /// Last updated timestamp
        updated_at: u64,
    }

    /// Employee reward tracking
    struct EmployeeRewards has key, store {
        /// Employee address
        employee: address,
        /// Total PAT rewards earned
        total_pat_earned: u64,
        /// Total PAT rewards claimed
        total_pat_claimed: u64,
        /// Pending PAT rewards
        pending_pat: u64,
        /// Current streak count (consecutive days)
        current_streak: u64,
        /// Longest streak achieved
        longest_streak: u64,
        /// Last activity timestamp
        last_activity_timestamp: u64,
        /// Total campaigns participated
        campaigns_participated: u64,
        /// Total campaigns completed
        campaigns_completed: u64,
        /// Achievement badges earned
        badges: vector<Badge>,
        /// Referral count
        referral_count: u64,
        /// Referral rewards earned
        referral_rewards_earned: u64,
        /// Employee engagement score
        engagement_score: u64,
        /// Performance score
        performance_score: u64,
    }

    /// Achievement badge
    struct Badge has store, copy, drop {
        /// Badge identifier
        badge_id: u64,
        /// Badge name
        name: String,
        /// Badge description
        description: String,
        /// Campaign ID where badge was earned
        campaign_id: u64,
        /// Timestamp when badge was earned
        earned_at: u64,
        /// Badge rarity level (1-5)
        rarity: u8,
    }

    /// Campaign participation record
    struct CampaignParticipation has key, store {
        /// Campaign ID
        campaign_id: u64,
        /// Participant address
        participant: address,
        /// Registration timestamp
        registered_at: u64,
        /// Current progress value
        current_progress: u64,
        /// Milestones completed
        milestones_completed: vector<u64>,
        /// Current tier achieved
        current_tier: u64,
        /// Total rewards earned in this campaign
        rewards_earned: u64,
        /// Total rewards claimed from this campaign
        rewards_claimed: u64,
        /// Last progress update timestamp
        last_progress_update: u64,
        /// Participation status (active, completed, withdrawn)
        status: u8,
    }

    /// Global rewards registry
    struct RewardsRegistry has key {
        /// Total campaigns created
        total_campaigns: u64,
        /// Total PAT tokens distributed
        total_pat_distributed: u64,
        /// Total unique participants
        total_unique_participants: u64,
        /// Active campaigns count
        active_campaigns: u64,
        /// Platform fee percentage (basis points)
        platform_fee_bps: u64,
        /// Treasury address for platform fees
        platform_treasury: address,
        /// Authorized campaign managers
        authorized_managers: vector<address>,
        /// Photon API integration enabled
        photon_integration_enabled: bool,
        /// Photon API endpoint
        photon_api_endpoint: String,
    }

    /// Employer campaign registry
    struct EmployerCampaignRegistry has key {
        /// Employer address
        employer: address,
        /// List of campaign IDs created by employer
        campaign_ids: vector<u64>,
        /// Total budget allocated across campaigns
        total_budget_allocated: u64,
        /// Total rewards distributed
        total_rewards_distributed: u64,
        /// Active campaign count
        active_campaign_count: u64,
    }

    /// Referral tracking
    struct ReferralRecord has key, store {
        /// Referrer address
        referrer: address,
        /// Referee address
        referee: address,
        /// Campaign ID where referral occurred
        campaign_id: u64,
        /// Referral timestamp
        referred_at: u64,
        /// Referral reward amount
        reward_amount: u64,
        /// Whether reward has been claimed
        reward_claimed: bool,
        /// Referee qualification status
        referee_qualified: bool,
    }

    /// Streak tracking for employees
    struct StreakTracker has key {
        /// Employee address
        employee: address,
        /// Current active streak
        current_streak: u64,
        /// Longest streak ever
        longest_streak: u64,
        /// Last check-in date (day number since epoch)
        last_checkin_day: u64,
        /// Streak rewards earned
        streak_rewards_earned: u64,
        /// Streak break count
        streak_breaks: u64,
    }

    // ============================================
    // EVENTS
    // ============================================

    #[event]
    struct CampaignCreatedEvent has drop, store {
        campaign_id: u64,
        employer: address,
        name: String,
        reward_type: u8,
        trigger_type: u8,
        total_budget: u64,
        start_time: u64,
        end_time: u64,
        timestamp: u64,
    }

    #[event]
    struct CampaignStatusChangedEvent has drop, store {
        campaign_id: u64,
        old_status: u8,
        new_status: u8,
        changed_by: address,
        timestamp: u64,
    }

    #[event]
    struct ParticipantRegisteredEvent has drop, store {
        campaign_id: u64,
        participant: address,
        registered_at: u64,
    }

    #[event]
    struct ProgressUpdatedEvent has drop, store {
        campaign_id: u64,
        participant: address,
        old_progress: u64,
        new_progress: u64,
        timestamp: u64,
    }

    #[event]
    struct MilestoneCompletedEvent has drop, store {
        campaign_id: u64,
        participant: address,
        milestone_id: u64,
        reward_amount: u64,
        timestamp: u64,
    }

    #[event]
    struct RewardClaimedEvent has drop, store {
        campaign_id: u64,
        participant: address,
        amount: u64,
        reward_type: u8,
        timestamp: u64,
    }

    #[event]
    struct ReferralRewardEvent has drop, store {
        campaign_id: u64,
        referrer: address,
        referee: address,
        reward_amount: u64,
        timestamp: u64,
    }

    #[event]
    struct StreakRewardEvent has drop, store {
        employee: address,
        streak_length: u64,
        reward_amount: u64,
        timestamp: u64,
    }

    #[event]
    struct BadgeEarnedEvent has drop, store {
        employee: address,
        badge_id: u64,
        badge_name: String,
        campaign_id: u64,
        timestamp: u64,
    }

    #[event]
    struct PhotonEventTriggeredEvent has drop, store {
        campaign_id: u64,
        event_type: String,
        participant: address,
        event_data: String,
        timestamp: u64,
    }

    // ============================================
    // INITIALIZATION FUNCTIONS
    // ============================================

    /// Initialize the global rewards registry
    public entry fun initialize_rewards_system(
        admin: &signer,
        platform_treasury: address,
        platform_fee_bps: u64,
        photon_api_endpoint: String,
    ) {
        let admin_addr = signer::address_of(admin);
        
        // Verify admin is authorized (would typically check against emergency module)
        assert!(!exists<RewardsRegistry>(admin_addr), error_codes::already_initialized());
        assert!(platform_fee_bps <= 1000, error_codes::invalid_fee_percentage()); // Max 10%
        
        let registry = RewardsRegistry {
            total_campaigns: 0,
            total_pat_distributed: 0,
            total_unique_participants: 0,
            active_campaigns: 0,
            platform_fee_bps,
            platform_treasury,
            authorized_managers: vector[admin_addr],
            photon_integration_enabled: true,
            photon_api_endpoint,
        };
        
        move_to(admin, registry);
    }

    /// Initialize employee rewards tracking
    public entry fun initialize_employee_rewards(
        employee: &signer,
    ) {
        let employee_addr = signer::address_of(employee);
        
        assert!(!exists<EmployeeRewards>(employee_addr), error_codes::already_initialized());
        
        let rewards = EmployeeRewards {
            employee: employee_addr,
            total_pat_earned: 0,
            total_pat_claimed: 0,
            pending_pat: 0,
            current_streak: 0,
            longest_streak: 0,
            last_activity_timestamp: 0,
            campaigns_participated: 0,
            campaigns_completed: 0,
            badges: vector::empty(),
            referral_count: 0,
            referral_rewards_earned: 0,
            engagement_score: 0,
            performance_score: 0,
        };
        
        let streak_tracker = StreakTracker {
            employee: employee_addr,
            current_streak: 0,
            longest_streak: 0,
            last_checkin_day: 0,
            streak_rewards_earned: 0,
            streak_breaks: 0,
        };
        
        move_to(employee, rewards);
        move_to(employee, streak_tracker);
    }

    /// Initialize employer campaign registry
    public entry fun initialize_employer_campaign_registry(
        employer: &signer,
    ) {
        let employer_addr = signer::address_of(employer);
        
        assert!(!exists<EmployerCampaignRegistry>(employer_addr), error_codes::already_initialized());
        
        let registry = EmployerCampaignRegistry {
            employer: employer_addr,
            campaign_ids: vector::empty(),
            total_budget_allocated: 0,
            total_rewards_distributed: 0,
            active_campaign_count: 0,
        };
        
        move_to(employer, registry);
    }

    // ============================================
    // CAMPAIGN MANAGEMENT FUNCTIONS
    // ============================================

    /// Create a new Photon campaign
    public entry fun create_campaign(
        employer: &signer,
        registry_address: address,
        name: String,
        description: String,
        reward_type: u8,
        trigger_type: u8,
        start_time: u64,
        end_time: u64,
        total_budget: u64,
        per_participant_cap: u64,
        min_eligibility_score: u64,
        reward_token_metadata: Object<Metadata>,
        photon_external_id: String,
    ) acquires RewardsRegistry, EmployerCampaignRegistry {
        let employer_addr = signer::address_of(employer);
        let current_time = timestamp::now_seconds();
        
        // Validate registry exists
        assert!(exists<RewardsRegistry>(registry_address), error_codes::not_initialized());
        
        // Validate campaign parameters
        assert!(start_time >= current_time, error_codes::invalid_time_range());
        assert!(end_time > start_time, error_codes::invalid_time_range());
        assert!(end_time - start_time >= MIN_CAMPAIGN_DURATION, error_codes::invalid_time_range());
        assert!(end_time - start_time <= MAX_CAMPAIGN_DURATION, error_codes::invalid_time_range());
        assert!(total_budget > 0, error_codes::invalid_amount());
        assert!(per_participant_cap > 0 && per_participant_cap <= total_budget, error_codes::invalid_amount());
        assert!(reward_type <= REWARD_TYPE_MILESTONE, error_codes::invalid_reward_type());
        assert!(trigger_type <= TRIGGER_CUSTOM, error_codes::invalid_trigger_type());
        
        // Ensure employer has campaign registry
        if (!exists<EmployerCampaignRegistry>(employer_addr)) {
            let emp_registry = EmployerCampaignRegistry {
                employer: employer_addr,
                campaign_ids: vector::empty(),
                total_budget_allocated: 0,
                total_rewards_distributed: 0,
                active_campaign_count: 0,
            };
            move_to(employer, emp_registry);
        };
        
        let registry = borrow_global_mut<RewardsRegistry>(registry_address);
        let employer_registry = borrow_global_mut<EmployerCampaignRegistry>(employer_addr);
        
        // Check campaign limit
        assert!(
            vector::length(&employer_registry.campaign_ids) < MAX_CAMPAIGNS_PER_EMPLOYER,
            error_codes::max_campaigns_exceeded()
        );
        
        // Generate campaign ID
        let campaign_id = registry.total_campaigns + 1;
        registry.total_campaigns = campaign_id;
        
        // Copy name for event before it's moved into the struct
        let campaign_name = name;
        
        // Create campaign
        let campaign = PhotonCampaign {
            campaign_id,
            employer: employer_addr,
            name: campaign_name,
            description,
            status: CAMPAIGN_STATUS_DRAFT,
            reward_type,
            trigger_type,
            start_time,
            end_time,
            total_budget,
            distributed_amount: 0,
            per_participant_cap,
            min_eligibility_score,
            reward_token_metadata,
            milestones: vector::empty(),
            reward_tiers: vector::empty(),
            total_participants: 0,
            claimed_participants: 0,
            photon_external_id,
            created_at: current_time,
            updated_at: current_time,
        };
        
        // Update employer registry
        vector::push_back(&mut employer_registry.campaign_ids, campaign_id);
        employer_registry.total_budget_allocated = employer_registry.total_budget_allocated + total_budget;
        
        // Save name for event before moving campaign
        let event_name = campaign_name;
        
        // Store campaign
        move_to(employer, campaign);
        
        // Emit event
        event::emit(CampaignCreatedEvent {
            campaign_id,
            employer: employer_addr,
            name: event_name,
            reward_type,
            trigger_type,
            total_budget,
            start_time,
            end_time,
            timestamp: current_time,
        });
    }

    /// Add milestone to campaign
    public entry fun add_milestone(
        employer: &signer,
        campaign_address: address,
        milestone_id: u64,
        name: String,
        description: String,
        target_value: u64,
        reward_amount: u64,
        is_required: bool,
        sequence_order: u64,
    ) acquires PhotonCampaign {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        let campaign = borrow_global_mut<PhotonCampaign>(campaign_address);
        
        // Verify ownership and status
        assert!(campaign.employer == employer_addr, error_codes::not_authorized());
        assert!(campaign.status == CAMPAIGN_STATUS_DRAFT, error_codes::campaign_already_active());
        assert!(
            vector::length(&campaign.milestones) < MAX_MILESTONES_PER_CAMPAIGN,
            error_codes::max_milestones_exceeded()
        );
        
        let milestone = Milestone {
            milestone_id,
            name,
            description,
            target_value,
            reward_amount,
            is_required,
            sequence_order,
        };
        
        vector::push_back(&mut campaign.milestones, milestone);
        campaign.updated_at = timestamp::now_seconds();
    }

    /// Add reward tier to campaign
    public entry fun add_reward_tier(
        employer: &signer,
        campaign_address: address,
        tier_level: u64,
        min_threshold: u64,
        max_threshold: u64,
        reward_multiplier: u64,
        bonus_amount: u64,
    ) acquires PhotonCampaign {
        let employer_addr = signer::address_of(employer);
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        let campaign = borrow_global_mut<PhotonCampaign>(campaign_address);
        
        // Verify ownership and status
        assert!(campaign.employer == employer_addr, error_codes::not_authorized());
        assert!(campaign.status == CAMPAIGN_STATUS_DRAFT, error_codes::campaign_already_active());
        assert!(campaign.reward_type == REWARD_TYPE_TIERED, error_codes::invalid_reward_type());
        assert!(min_threshold < max_threshold, error_codes::invalid_tier_config());
        
        let tier = RewardTier {
            tier_level,
            min_threshold,
            max_threshold,
            reward_multiplier,
            bonus_amount,
        };
        
        vector::push_back(&mut campaign.reward_tiers, tier);
        campaign.updated_at = timestamp::now_seconds();
    }

    /// Activate campaign (move from draft to active)
    public entry fun activate_campaign(
        employer: &signer,
        registry_address: address,
        campaign_address: address,
    ) acquires PhotonCampaign, RewardsRegistry {
        let employer_addr = signer::address_of(employer);
        let current_time = timestamp::now_seconds();
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        let campaign = borrow_global_mut<PhotonCampaign>(campaign_address);
        
        // Verify ownership and status
        assert!(campaign.employer == employer_addr, error_codes::not_authorized());
        assert!(campaign.status == CAMPAIGN_STATUS_DRAFT, error_codes::invalid_campaign_status());
        assert!(current_time < campaign.end_time, error_codes::campaign_expired());
        
        // For milestone campaigns, require at least one milestone
        if (campaign.reward_type == REWARD_TYPE_MILESTONE) {
            assert!(!vector::is_empty(&campaign.milestones), error_codes::no_milestones_defined());
        };
        
        // For tiered campaigns, require at least one tier
        if (campaign.reward_type == REWARD_TYPE_TIERED) {
            assert!(!vector::is_empty(&campaign.reward_tiers), error_codes::no_tiers_defined());
        };
        
        let old_status = campaign.status;
        campaign.status = CAMPAIGN_STATUS_ACTIVE;
        campaign.updated_at = current_time;
        
        // Update registry
        let registry = borrow_global_mut<RewardsRegistry>(registry_address);
        registry.active_campaigns = registry.active_campaigns + 1;
        
        // Emit event
        event::emit(CampaignStatusChangedEvent {
            campaign_id: campaign.campaign_id,
            old_status,
            new_status: CAMPAIGN_STATUS_ACTIVE,
            changed_by: employer_addr,
            timestamp: current_time,
        });
    }

    /// Pause an active campaign
    public entry fun pause_campaign(
        employer: &signer,
        registry_address: address,
        campaign_address: address,
    ) acquires PhotonCampaign, RewardsRegistry {
        let employer_addr = signer::address_of(employer);
        let current_time = timestamp::now_seconds();
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        let campaign = borrow_global_mut<PhotonCampaign>(campaign_address);
        
        assert!(campaign.employer == employer_addr, error_codes::not_authorized());
        assert!(campaign.status == CAMPAIGN_STATUS_ACTIVE, error_codes::invalid_campaign_status());
        
        let old_status = campaign.status;
        campaign.status = CAMPAIGN_STATUS_PAUSED;
        campaign.updated_at = current_time;
        
        // Update registry
        let registry = borrow_global_mut<RewardsRegistry>(registry_address);
        registry.active_campaigns = registry.active_campaigns - 1;
        
        event::emit(CampaignStatusChangedEvent {
            campaign_id: campaign.campaign_id,
            old_status,
            new_status: CAMPAIGN_STATUS_PAUSED,
            changed_by: employer_addr,
            timestamp: current_time,
        });
    }

    /// Resume a paused campaign
    public entry fun resume_campaign(
        employer: &signer,
        registry_address: address,
        campaign_address: address,
    ) acquires PhotonCampaign, RewardsRegistry {
        let employer_addr = signer::address_of(employer);
        let current_time = timestamp::now_seconds();
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        let campaign = borrow_global_mut<PhotonCampaign>(campaign_address);
        
        assert!(campaign.employer == employer_addr, error_codes::not_authorized());
        assert!(campaign.status == CAMPAIGN_STATUS_PAUSED, error_codes::invalid_campaign_status());
        assert!(current_time < campaign.end_time, error_codes::campaign_expired());
        
        let old_status = campaign.status;
        campaign.status = CAMPAIGN_STATUS_ACTIVE;
        campaign.updated_at = current_time;
        
        let registry = borrow_global_mut<RewardsRegistry>(registry_address);
        registry.active_campaigns = registry.active_campaigns + 1;
        
        event::emit(CampaignStatusChangedEvent {
            campaign_id: campaign.campaign_id,
            old_status,
            new_status: CAMPAIGN_STATUS_ACTIVE,
            changed_by: employer_addr,
            timestamp: current_time,
        });
    }

    // ============================================
    // PARTICIPATION FUNCTIONS
    // ============================================

    /// Register for a campaign
    public entry fun register_for_campaign(
        participant: &signer,
        campaign_address: address,
        registry_address: address,
    ) acquires PhotonCampaign, EmployeeRewards, RewardsRegistry {
        let participant_addr = signer::address_of(participant);
        let current_time = timestamp::now_seconds();
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        let campaign = borrow_global_mut<PhotonCampaign>(campaign_address);
        
        // Verify campaign is active and not full
        assert!(campaign.status == CAMPAIGN_STATUS_ACTIVE, error_codes::campaign_not_active());
        assert!(current_time >= campaign.start_time, error_codes::campaign_not_started());
        assert!(current_time < campaign.end_time, error_codes::campaign_expired());
        assert!(
            campaign.total_participants < MAX_PARTICIPANTS_PER_CAMPAIGN,
            error_codes::campaign_full()
        );
        
        // Ensure employee rewards exist
        if (!exists<EmployeeRewards>(participant_addr)) {
            let rewards = EmployeeRewards {
                employee: participant_addr,
                total_pat_earned: 0,
                total_pat_claimed: 0,
                pending_pat: 0,
                current_streak: 0,
                longest_streak: 0,
                last_activity_timestamp: 0,
                campaigns_participated: 0,
                campaigns_completed: 0,
                badges: vector::empty(),
                referral_count: 0,
                referral_rewards_earned: 0,
                engagement_score: 0,
                performance_score: 0,
            };
            move_to(participant, rewards);
        };
        
        // Check eligibility score
        let employee_rewards = borrow_global<EmployeeRewards>(participant_addr);
        assert!(
            employee_rewards.engagement_score >= campaign.min_eligibility_score,
            error_codes::insufficient_eligibility()
        );
        
        // Create participation record
        let participation = CampaignParticipation {
            campaign_id: campaign.campaign_id,
            participant: participant_addr,
            registered_at: current_time,
            current_progress: 0,
            milestones_completed: vector::empty(),
            current_tier: 0,
            rewards_earned: 0,
            rewards_claimed: 0,
            last_progress_update: current_time,
            status: CAMPAIGN_STATUS_ACTIVE,
        };
        
        move_to(participant, participation);
        
        // Update campaign stats
        campaign.total_participants = campaign.total_participants + 1;
        campaign.updated_at = current_time;
        
        // Update employee rewards
        let employee_rewards_mut = borrow_global_mut<EmployeeRewards>(participant_addr);
        employee_rewards_mut.campaigns_participated = employee_rewards_mut.campaigns_participated + 1;
        employee_rewards_mut.last_activity_timestamp = current_time;
        
        // Update global stats
        let registry = borrow_global_mut<RewardsRegistry>(registry_address);
        registry.total_unique_participants = registry.total_unique_participants + 1;
        
        event::emit(ParticipantRegisteredEvent {
            campaign_id: campaign.campaign_id,
            participant: participant_addr,
            registered_at: current_time,
        });
    }

    /// Register with referral
    public entry fun register_with_referral(
        participant: &signer,
        campaign_address: address,
        registry_address: address,
        referrer: address,
    ) acquires PhotonCampaign, EmployeeRewards, RewardsRegistry {
        let participant_addr = signer::address_of(participant);
        
        // Verify referrer is valid (not self-referral)
        assert!(referrer != participant_addr, error_codes::invalid_referral());
        assert!(exists<EmployeeRewards>(referrer), error_codes::referrer_not_found());
        
        // Register for campaign
        register_for_campaign(participant, campaign_address, registry_address);
        
        // Create referral record
        let campaign = borrow_global<PhotonCampaign>(campaign_address);
        let referral = ReferralRecord {
            referrer,
            referee: participant_addr,
            campaign_id: campaign.campaign_id,
            referred_at: timestamp::now_seconds(),
            reward_amount: 0, // Will be set when referee qualifies
            reward_claimed: false,
            referee_qualified: false,
        };
        
        move_to(participant, referral);
        
        // Update referrer stats
        let referrer_rewards = borrow_global_mut<EmployeeRewards>(referrer);
        referrer_rewards.referral_count = referrer_rewards.referral_count + 1;
    }

    // ============================================
    // PROGRESS & REWARD FUNCTIONS
    // ============================================

    /// Update participant progress (called by authorized system or oracle)
    public entry fun update_progress(
        updater: &signer,
        participant: address,
        campaign_address: address,
        new_progress: u64,
    ) acquires PhotonCampaign, CampaignParticipation {
        let current_time = timestamp::now_seconds();
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        assert!(exists<CampaignParticipation>(participant), error_codes::not_registered());
        
        let campaign = borrow_global<PhotonCampaign>(campaign_address);
        let participation = borrow_global_mut<CampaignParticipation>(participant);
        
        // Verify campaign matches
        assert!(participation.campaign_id == campaign.campaign_id, error_codes::campaign_mismatch());
        assert!(campaign.status == CAMPAIGN_STATUS_ACTIVE, error_codes::campaign_not_active());
        assert!(participation.status == CAMPAIGN_STATUS_ACTIVE, error_codes::participation_inactive());
        
        let old_progress = participation.current_progress;
        participation.current_progress = new_progress;
        participation.last_progress_update = current_time;
        
        // Check milestone completions
        let milestones = &campaign.milestones;
        let i = 0;
        let len = vector::length(milestones);
        while (i < len) {
            let milestone = vector::borrow(milestones, i);
            // Check if milestone newly completed
            if (new_progress >= milestone.target_value && 
                old_progress < milestone.target_value &&
                !vector::contains(&participation.milestones_completed, &milestone.milestone_id)) {
                
                vector::push_back(&mut participation.milestones_completed, milestone.milestone_id);
                participation.rewards_earned = participation.rewards_earned + milestone.reward_amount;
                
                event::emit(MilestoneCompletedEvent {
                    campaign_id: campaign.campaign_id,
                    participant,
                    milestone_id: milestone.milestone_id,
                    reward_amount: milestone.reward_amount,
                    timestamp: current_time,
                });
            };
            i = i + 1;
        };
        
        // Update tier for tiered campaigns
        if (campaign.reward_type == REWARD_TYPE_TIERED) {
            let tiers = &campaign.reward_tiers;
            let j = 0;
            let tier_len = vector::length(tiers);
            while (j < tier_len) {
                let tier = vector::borrow(tiers, j);
                if (new_progress >= tier.min_threshold && new_progress <= tier.max_threshold) {
                    if (tier.tier_level > participation.current_tier) {
                        participation.current_tier = tier.tier_level;
                        participation.rewards_earned = participation.rewards_earned + tier.bonus_amount;
                    };
                };
                j = j + 1;
            };
        };
        
        event::emit(ProgressUpdatedEvent {
            campaign_id: campaign.campaign_id,
            participant,
            old_progress,
            new_progress,
            timestamp: current_time,
        });
    }

    /// Claim earned rewards
    public entry fun claim_rewards(
        participant: &signer,
        campaign_address: address,
        registry_address: address,
    ) acquires PhotonCampaign, CampaignParticipation, EmployeeRewards, RewardsRegistry {
        let participant_addr = signer::address_of(participant);
        let current_time = timestamp::now_seconds();
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        assert!(exists<CampaignParticipation>(participant_addr), error_codes::not_registered());
        assert!(exists<EmployeeRewards>(participant_addr), error_codes::not_initialized());
        
        let campaign = borrow_global_mut<PhotonCampaign>(campaign_address);
        let participation = borrow_global_mut<CampaignParticipation>(participant_addr);
        
        // Calculate claimable amount
        let claimable = participation.rewards_earned - participation.rewards_claimed;
        assert!(claimable > 0, error_codes::no_rewards_to_claim());
        
        // Check per-participant cap
        let total_after_claim = participation.rewards_claimed + claimable;
        if (total_after_claim > campaign.per_participant_cap) {
            claimable = campaign.per_participant_cap - participation.rewards_claimed;
        };
        
        // Check campaign budget
        let remaining_budget = campaign.total_budget - campaign.distributed_amount;
        if (claimable > remaining_budget) {
            claimable = remaining_budget;
        };
        
        assert!(claimable > 0, error_codes::no_rewards_to_claim());
        
        // Update participation
        participation.rewards_claimed = participation.rewards_claimed + claimable;
        
        // Update campaign
        campaign.distributed_amount = campaign.distributed_amount + claimable;
        if (participation.rewards_claimed > 0 && participation.rewards_earned == participation.rewards_claimed) {
            campaign.claimed_participants = campaign.claimed_participants + 1;
        };
        campaign.updated_at = current_time;
        
        // Update employee rewards
        let employee_rewards = borrow_global_mut<EmployeeRewards>(participant_addr);
        employee_rewards.total_pat_earned = employee_rewards.total_pat_earned + claimable;
        employee_rewards.total_pat_claimed = employee_rewards.total_pat_claimed + claimable;
        employee_rewards.last_activity_timestamp = current_time;
        
        // Update global registry
        let registry = borrow_global_mut<RewardsRegistry>(registry_address);
        registry.total_pat_distributed = registry.total_pat_distributed + claimable;
        
        // Transfer tokens (actual FA transfer would happen here)
        // primary_fungible_store::transfer(campaign.reward_token_metadata, campaign_address, participant_addr, claimable);
        
        event::emit(RewardClaimedEvent {
            campaign_id: campaign.campaign_id,
            participant: participant_addr,
            amount: claimable,
            reward_type: campaign.reward_type,
            timestamp: current_time,
        });
    }

    // ============================================
    // STREAK FUNCTIONS
    // ============================================

    /// Record daily check-in for streak
    public entry fun record_daily_checkin(
        employee: &signer,
    ) acquires StreakTracker, EmployeeRewards {
        let employee_addr = signer::address_of(employee);
        let current_time = timestamp::now_seconds();
        let current_day = current_time / 86400; // Days since epoch
        
        assert!(exists<StreakTracker>(employee_addr), error_codes::not_initialized());
        
        let tracker = borrow_global_mut<StreakTracker>(employee_addr);
        
        if (current_day == tracker.last_checkin_day) {
            // Already checked in today
            return
        };
        
        if (current_day == tracker.last_checkin_day + 1) {
            // Consecutive day - extend streak
            tracker.current_streak = tracker.current_streak + 1;
            if (tracker.current_streak > tracker.longest_streak) {
                tracker.longest_streak = tracker.current_streak;
            };
        } else {
            // Streak broken
            tracker.streak_breaks = tracker.streak_breaks + 1;
            tracker.current_streak = 1;
        };
        
        tracker.last_checkin_day = current_day;
        
        // Calculate streak reward
        let streak_reward = calculate_streak_reward(tracker.current_streak);
        if (streak_reward > 0) {
            tracker.streak_rewards_earned = tracker.streak_rewards_earned + streak_reward;
            
            // Update employee rewards
            if (exists<EmployeeRewards>(employee_addr)) {
                let rewards = borrow_global_mut<EmployeeRewards>(employee_addr);
                rewards.pending_pat = rewards.pending_pat + streak_reward;
                rewards.current_streak = tracker.current_streak;
                if (tracker.current_streak > rewards.longest_streak) {
                    rewards.longest_streak = tracker.current_streak;
                };
            };
            
            event::emit(StreakRewardEvent {
                employee: employee_addr,
                streak_length: tracker.current_streak,
                reward_amount: streak_reward,
                timestamp: current_time,
            });
        };
    }

    /// Calculate streak reward based on streak length
    fun calculate_streak_reward(streak_length: u64): u64 {
        // Reward tiers:
        // 7 days: 100 PAT
        // 30 days: 500 PAT
        // 90 days: 2000 PAT
        // 180 days: 5000 PAT
        // 365 days: 15000 PAT
        
        if (streak_length == 7) {
            100 * PAT_PRECISION
        } else if (streak_length == 30) {
            500 * PAT_PRECISION
        } else if (streak_length == 90) {
            2000 * PAT_PRECISION
        } else if (streak_length == 180) {
            5000 * PAT_PRECISION
        } else if (streak_length == 365) {
            15000 * PAT_PRECISION
        } else {
            0
        }
    }

    // ============================================
    // BADGE FUNCTIONS
    // ============================================

    /// Award badge to employee
    public entry fun award_badge(
        admin: &signer,
        employee: address,
        badge_id: u64,
        name: String,
        description: String,
        campaign_id: u64,
        rarity: u8,
        registry_address: address,
    ) acquires EmployeeRewards, RewardsRegistry {
        let admin_addr = signer::address_of(admin);
        let current_time = timestamp::now_seconds();
        
        // Verify admin is authorized
        let registry = borrow_global<RewardsRegistry>(registry_address);
        assert!(vector::contains(&registry.authorized_managers, &admin_addr), error_codes::not_authorized());
        
        assert!(exists<EmployeeRewards>(employee), error_codes::not_initialized());
        assert!(rarity >= 1 && rarity <= 5, error_codes::invalid_rarity());
        
        let rewards = borrow_global_mut<EmployeeRewards>(employee);
        
        let badge = Badge {
            badge_id,
            name,
            description,
            campaign_id,
            earned_at: current_time,
            rarity,
        };
        
        vector::push_back(&mut rewards.badges, badge);
        
        // Increase engagement score based on badge rarity
        let score_increase = (rarity as u64) * 10;
        rewards.engagement_score = rewards.engagement_score + score_increase;
        
        event::emit(BadgeEarnedEvent {
            employee,
            badge_id,
            badge_name: name,
            campaign_id,
            timestamp: current_time,
        });
    }

    // ============================================
    // PHOTON API INTEGRATION FUNCTIONS
    // ============================================

    /// Trigger Photon campaign event (for external API integration)
    public entry fun trigger_photon_event(
        triggerer: &signer,
        campaign_address: address,
        participant: address,
        event_type: String,
        event_data: String,
        registry_address: address,
    ) acquires PhotonCampaign, RewardsRegistry {
        let triggerer_addr = signer::address_of(triggerer);
        let current_time = timestamp::now_seconds();
        
        // Verify authorization
        let registry = borrow_global<RewardsRegistry>(registry_address);
        assert!(registry.photon_integration_enabled, error_codes::photon_integration_disabled());
        assert!(
            vector::contains(&registry.authorized_managers, &triggerer_addr),
            error_codes::not_authorized()
        );
        
        assert!(exists<PhotonCampaign>(campaign_address), error_codes::campaign_not_found());
        let campaign = borrow_global<PhotonCampaign>(campaign_address);
        
        assert!(campaign.status == CAMPAIGN_STATUS_ACTIVE, error_codes::campaign_not_active());
        
        event::emit(PhotonEventTriggeredEvent {
            campaign_id: campaign.campaign_id,
            event_type,
            participant,
            event_data,
            timestamp: current_time,
        });
    }

    /// Update Photon integration settings
    public entry fun update_photon_settings(
        admin: &signer,
        registry_address: address,
        enabled: bool,
        new_endpoint: String,
    ) acquires RewardsRegistry {
        let admin_addr = signer::address_of(admin);
        
        let registry = borrow_global_mut<RewardsRegistry>(registry_address);
        assert!(vector::contains(&registry.authorized_managers, &admin_addr), error_codes::not_authorized());
        
        registry.photon_integration_enabled = enabled;
        registry.photon_api_endpoint = new_endpoint;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    #[view]
    public fun get_campaign_info(campaign_address: address): (
        u64, // campaign_id
        address, // employer
        String, // name
        u8, // status
        u64, // total_budget
        u64, // distributed_amount
        u64, // total_participants
    ) acquires PhotonCampaign {
        let campaign = borrow_global<PhotonCampaign>(campaign_address);
        (
            campaign.campaign_id,
            campaign.employer,
            campaign.name,
            campaign.status,
            campaign.total_budget,
            campaign.distributed_amount,
            campaign.total_participants,
        )
    }

    #[view]
    public fun get_employee_rewards_summary(employee: address): (
        u64, // total_pat_earned
        u64, // total_pat_claimed
        u64, // pending_pat
        u64, // current_streak
        u64, // campaigns_participated
        u64, // engagement_score
    ) acquires EmployeeRewards {
        let rewards = borrow_global<EmployeeRewards>(employee);
        (
            rewards.total_pat_earned,
            rewards.total_pat_claimed,
            rewards.pending_pat,
            rewards.current_streak,
            rewards.campaigns_participated,
            rewards.engagement_score,
        )
    }

    #[view]
    public fun get_participation_info(participant: address): (
        u64, // campaign_id
        u64, // current_progress
        u64, // current_tier
        u64, // rewards_earned
        u64, // rewards_claimed
    ) acquires CampaignParticipation {
        let participation = borrow_global<CampaignParticipation>(participant);
        (
            participation.campaign_id,
            participation.current_progress,
            participation.current_tier,
            participation.rewards_earned,
            participation.rewards_claimed,
        )
    }

    #[view]
    public fun get_streak_info(employee: address): (
        u64, // current_streak
        u64, // longest_streak
        u64, // streak_rewards_earned
    ) acquires StreakTracker {
        let tracker = borrow_global<StreakTracker>(employee);
        (
            tracker.current_streak,
            tracker.longest_streak,
            tracker.streak_rewards_earned,
        )
    }

    #[view]
    public fun get_registry_stats(registry_address: address): (
        u64, // total_campaigns
        u64, // total_pat_distributed
        u64, // total_unique_participants
        u64, // active_campaigns
    ) acquires RewardsRegistry {
        let registry = borrow_global<RewardsRegistry>(registry_address);
        (
            registry.total_campaigns,
            registry.total_pat_distributed,
            registry.total_unique_participants,
            registry.active_campaigns,
        )
    }

    #[view]
    public fun is_photon_enabled(registry_address: address): bool acquires RewardsRegistry {
        let registry = borrow_global<RewardsRegistry>(registry_address);
        registry.photon_integration_enabled
    }

    // ============================================
    // TEST HELPERS
    // ============================================

    #[test_only]
    public fun create_test_campaign(
        employer: &signer,
        campaign_id: u64,
        name: String,
        total_budget: u64,
        reward_token_metadata: Object<Metadata>,
    ): PhotonCampaign {
        let current_time = timestamp::now_seconds();
        PhotonCampaign {
            campaign_id,
            employer: signer::address_of(employer),
            name,
            description: string::utf8(b"Test campaign"),
            status: CAMPAIGN_STATUS_DRAFT,
            reward_type: REWARD_TYPE_FIXED,
            trigger_type: TRIGGER_ATTENDANCE,
            start_time: current_time,
            end_time: current_time + 2592000, // 30 days
            total_budget,
            distributed_amount: 0,
            per_participant_cap: total_budget / 10,
            min_eligibility_score: 0,
            reward_token_metadata,
            milestones: vector::empty(),
            reward_tiers: vector::empty(),
            total_participants: 0,
            claimed_participants: 0,
            photon_external_id: string::utf8(b"test-campaign-001"),
            created_at: current_time,
            updated_at: current_time,
        }
    }

    #[test_only]
    public fun get_campaign_status_active(): u8 {
        CAMPAIGN_STATUS_ACTIVE
    }

    #[test_only]
    public fun get_campaign_status_draft(): u8 {
        CAMPAIGN_STATUS_DRAFT
    }
}
