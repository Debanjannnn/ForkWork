// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FreelanceGigEscrow is ReentrancyGuard, Ownable {
    // --- STRUCTS (DECOMPOSED TO AVOID STACK TOO DEEP) ---

    // Original Gig struct for maintaining external compatibility in view functions
    struct Gig {
        address client;
        string title;
        string description;
        string detailsUri;
        uint256 usdtAmount;
        uint256 nativeStakeRequired;
        address selectedFreelancer;
        bool isApproved;
        bool isFunded;
        bool isStakeDeposited;
        bool isCompleted;
        uint256 deadline;
        uint256 proposalDeadline;
        uint256 stakingDeadline;
        uint256 createdAt;
    }

    // CHANGED: Split the Gig struct into two smaller structs.
    // GigCore holds data that is set at creation and doesn't change.
    struct GigCore {
        address client;
        string title;
        string description;
        string detailsUri;
        uint256 usdtAmount;
        uint256 nativeStakeRequired;
        uint256 createdAt;
    }

    // GigStatus holds data that changes during the gig's lifecycle.
    struct GigStatus {
        address selectedFreelancer;
        bool isApproved;
        bool isFunded;
        bool isStakeDeposited;
        bool isCompleted;
        uint256 deadline;
        uint256 proposalDeadline;
        uint256 stakingDeadline;
    }

    struct Proposal {
        address freelancer;
        string proposalUri;
        uint256 submittedAt;
        uint256 lastUpdatedAt;
        bool isSelected;
        bool isWithdrawn;
        bool isAutoExpired;
    }

    // --- STATE VARIABLES ---
    
    IERC20 public mockUSDT;
    uint256 public gigCount;
    uint256 public platformFeePercent = 250; // 2.5% (250 basis points)
    // CHANGED: Made stakingGracePeriod a variable instead of a constant to allow updates.
    uint256 public stakingGracePeriod = 24 hours;

    // CHANGED: Replaced the single `gigs` mapping with two separate mappings.
    mapping(uint256 => GigCore) public gigCoreDetails;
    mapping(uint256 => GigStatus) public gigStatusDetails;
    
    mapping(uint256 => address[]) public applicants;
    mapping(uint256 => mapping(address => bool)) public hasEverApplied;
    mapping(uint256 => mapping(address => Proposal)) public proposals;
    mapping(address => uint256[]) public clientGigs;
    mapping(address => uint256[]) public freelancerGigs;

    // --- EVENTS (Unchanged) ---
    event GigPosted(uint256 indexed gigId, address indexed client, uint256 usdtAmount, uint256 deadline, uint256 proposalDeadline, string detailsUri);
    event ProposalSubmitted(uint256 indexed gigId, address indexed freelancer, string proposalUri);
    event ProposalUpdated(uint256 indexed gigId, address indexed freelancer, string newProposalUri);
    event ProposalWithdrawn(uint256 indexed gigId, address indexed freelancer);
    event FreelancerSelected(uint256 indexed gigId, address indexed freelancer, uint256 stakingDeadline);
    event SelectionAutoExpired(uint256 indexed gigId, address indexed freelancer);
    event GigFunded(uint256 indexed gigId, uint256 amount);
    event StakeDeposited(uint256 indexed gigId, address indexed freelancer, uint256 amount);
    event WorkApproved(uint256 indexed gigId);
    event PayoutReleased(uint256 indexed gigId, address indexed freelancer, uint256 amount, uint256 platformFee);
    event GigCanceled(uint256 indexed gigId, string reason);
    event DeadlineExtended(uint256 indexed gigId, uint256 newDeadline);
    
    // --- MODIFIERS ---

    modifier gigExists(uint256 gigId) {
        require(gigId < gigCount, "Gig does not exist");
        _;
    }

    modifier onlyClient(uint256 gigId) {
        require(msg.sender == gigCoreDetails[gigId].client, "Only client can perform this action");
        _;
    }

    modifier onlySelectedFreelancer(uint256 gigId) {
        require(msg.sender == gigStatusDetails[gigId].selectedFreelancer, "Only selected freelancer can perform this action");
        _;
    }

    constructor(address _mockUSDT) Ownable(msg.sender) {
        mockUSDT = IERC20(_mockUSDT);
    }
    
    // --- CORE FUNCTIONS (Refactored to use new structs) ---

    function postGig(
        string calldata title, 
        string calldata description, 
        string calldata detailsUri,
        uint256 usdtAmount, 
        uint256 nativeStakeRequired,
        uint256 durationDays,
        uint256 proposalDurationDays
    ) external {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(detailsUri).length > 0, "Details URI cannot be empty");
        require(usdtAmount > 0, "Payment amount must be greater than 0");
        require(durationDays > 0 && durationDays <= 365, "Duration must be between 1-365 days");
        require(proposalDurationDays > 0 && proposalDurationDays <= durationDays, "Proposal duration must be between 1 and gig duration");

        uint256 deadline = block.timestamp + (durationDays * 1 days);
        uint256 proposalDeadline = block.timestamp + (proposalDurationDays * 1 days);
        
        // CHANGED: Populate the two new structs instead of one large one.
        gigCoreDetails[gigCount] = GigCore({
            client: msg.sender,
            title: title,
            description: description,
            detailsUri: detailsUri,
            usdtAmount: usdtAmount,
            nativeStakeRequired: nativeStakeRequired,
            createdAt: block.timestamp
        });

        gigStatusDetails[gigCount] = GigStatus({
            selectedFreelancer: address(0),
            isApproved: false,
            isFunded: false,
            isStakeDeposited: false,
            isCompleted: false,
            deadline: deadline,
            proposalDeadline: proposalDeadline,
            stakingDeadline: 0
        });

        clientGigs[msg.sender].push(gigCount);
        emit GigPosted(gigCount, msg.sender, usdtAmount, deadline, proposalDeadline, detailsUri);
        gigCount++;
    }

    function submitProposal(uint256 gigId, string calldata proposalUri) external gigExists(gigId) {
        // CHANGED: Load from specific structs to reduce stack usage.
        GigStatus storage status = gigStatusDetails[gigId];
        GigCore storage core = gigCoreDetails[gigId];

        require(status.selectedFreelancer == address(0), "Freelancer already selected");
        require(msg.sender != core.client, "Client cannot apply to own gig");
        require(block.timestamp < status.proposalDeadline, "Proposal deadline passed");
        require(bytes(proposalUri).length > 0, "Proposal URI cannot be empty");
        require(!hasEverApplied[gigId][msg.sender], "Cannot re-propose on the same gig");

        applicants[gigId].push(msg.sender);
        hasEverApplied[gigId][msg.sender] = true;

        proposals[gigId][msg.sender] = Proposal({
            freelancer: msg.sender,
            proposalUri: proposalUri,
            submittedAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            isSelected: false,
            isWithdrawn: false,
            isAutoExpired: false
        });

        emit ProposalSubmitted(gigId, msg.sender, proposalUri);
    }
    
    function updateProposal(uint256 gigId, string calldata newProposalUri) external gigExists(gigId) {
        GigStatus storage status = gigStatusDetails[gigId];
        require(status.selectedFreelancer == address(0), "Freelancer already selected");
        require(hasEverApplied[gigId][msg.sender], "Must submit initial proposal first");
        require(block.timestamp < status.proposalDeadline, "Proposal deadline passed");
        require(bytes(newProposalUri).length > 0, "Proposal URI cannot be empty");
        
        Proposal storage proposal = proposals[gigId][msg.sender];
        require(!proposal.isWithdrawn, "Cannot update withdrawn proposal");

        proposal.proposalUri = newProposalUri;
        proposal.lastUpdatedAt = block.timestamp;

        emit ProposalUpdated(gigId, msg.sender, newProposalUri);
    }

    function withdrawProposal(uint256 gigId) external gigExists(gigId) {
        GigStatus storage status = gigStatusDetails[gigId];
        require(status.selectedFreelancer == address(0), "Freelancer already selected");
        require(hasEverApplied[gigId][msg.sender], "No proposal to withdraw");
        require(block.timestamp < status.proposalDeadline, "Proposal deadline passed");
        
        Proposal storage proposal = proposals[gigId][msg.sender];
        require(!proposal.isWithdrawn, "Proposal already withdrawn");

        proposal.isWithdrawn = true;
        proposal.lastUpdatedAt = block.timestamp;

        emit ProposalWithdrawn(gigId, msg.sender);
    }

    function selectFreelancer(uint256 gigId, address freelancer) external gigExists(gigId) onlyClient(gigId) {
        GigStatus storage status = gigStatusDetails[gigId];
        require(status.selectedFreelancer == address(0), "Freelancer already selected");
        require(hasEverApplied[gigId][freelancer], "Address has not applied to this gig");
        require(block.timestamp < status.proposalDeadline, "Selection deadline passed");
        
        Proposal storage proposal = proposals[gigId][freelancer];
        require(!proposal.isWithdrawn, "Selected freelancer has withdrawn proposal");

        // CHANGED: Use the state variable for grace period.
        status.selectedFreelancer = freelancer;
        status.stakingDeadline = block.timestamp + stakingGracePeriod;
        freelancerGigs[freelancer].push(gigId);
        
        proposal.isSelected = true;
        
        emit FreelancerSelected(gigId, freelancer, status.stakingDeadline);
    }
    
    function expireSelection(uint256 gigId) external gigExists(gigId) {
        GigStatus storage status = gigStatusDetails[gigId];
        GigCore storage core = gigCoreDetails[gigId];
        require(status.selectedFreelancer != address(0), "No freelancer selected");
        require(!status.isStakeDeposited, "Stake already deposited");
        require(core.nativeStakeRequired > 0, "No stake required");
        require(block.timestamp > status.stakingDeadline, "Staking deadline not passed");
        
        address expiredFreelancer = status.selectedFreelancer;
        
        status.selectedFreelancer = address(0);
        status.stakingDeadline = 0;
        
        proposals[gigId][expiredFreelancer].isAutoExpired = true;
        
        _removeFromFreelancerGigs(expiredFreelancer, gigId);
        
        emit SelectionAutoExpired(gigId, expiredFreelancer);
    }

    function fundGig(uint256 gigId) external gigExists(gigId) onlyClient(gigId) nonReentrant {
        GigStatus storage status = gigStatusDetails[gigId];
        GigCore storage core = gigCoreDetails[gigId];
        require(!status.isFunded, "Gig already funded");
        require(status.selectedFreelancer != address(0), "No freelancer selected");
        
        if (core.nativeStakeRequired > 0) {
            require(status.isStakeDeposited || block.timestamp <= status.stakingDeadline, "Staking deadline passed");
        }
        
        require(mockUSDT.balanceOf(msg.sender) >= core.usdtAmount, "Insufficient USDT balance");
        require(mockUSDT.transferFrom(msg.sender, address(this), core.usdtAmount), "USDT transfer failed");

        status.isFunded = true;
        emit GigFunded(gigId, core.usdtAmount);
    }

    function depositStake(uint256 gigId) external payable gigExists(gigId) onlySelectedFreelancer(gigId) {
        GigStatus storage status = gigStatusDetails[gigId];
        GigCore storage core = gigCoreDetails[gigId];
        require(core.nativeStakeRequired > 0, "No stake required for this gig");
        require(!status.isStakeDeposited, "Stake already deposited");
        require(msg.value == core.nativeStakeRequired, "Incorrect stake amount");
        require(block.timestamp <= status.stakingDeadline, "Staking deadline passed");

        status.isStakeDeposited = true;
        emit StakeDeposited(gigId, msg.sender, msg.value);
    }

    function approveWork(uint256 gigId) external gigExists(gigId) onlyClient(gigId) {
        GigStatus storage status = gigStatusDetails[gigId];
        GigCore storage core = gigCoreDetails[gigId];
        require(status.selectedFreelancer != address(0), "No freelancer selected");
        require(status.isFunded, "Gig not funded");
        require(!status.isApproved, "Work already approved");
        require(!status.isCompleted, "Gig already completed");

        if (core.nativeStakeRequired > 0) {
            require(status.isStakeDeposited, "Required stake not deposited");
        }

        status.isApproved = true;
        emit WorkApproved(gigId);
    }

    function releasePayment(uint256 gigId) external gigExists(gigId) nonReentrant {
        GigStatus storage status = gigStatusDetails[gigId];
        GigCore storage core = gigCoreDetails[gigId];
        require(status.isApproved, "Work not approved yet");
        require(!status.isCompleted, "Payment already released");
        
        address freelancer = status.selectedFreelancer;
        uint256 totalAmount = core.usdtAmount;
        uint256 platformFee = (totalAmount * platformFeePercent) / 10000;
        uint256 freelancerAmount = totalAmount - platformFee;

        status.isCompleted = true;

        require(mockUSDT.transfer(freelancer, freelancerAmount), "Freelancer USDT transfer failed");
        if (platformFee > 0) {
            require(mockUSDT.transfer(owner(), platformFee), "Platform fee transfer failed");
        }

        if (core.nativeStakeRequired > 0 && status.isStakeDeposited) {
            payable(freelancer).transfer(core.nativeStakeRequired);
        }

        emit PayoutReleased(gigId, freelancer, freelancerAmount, platformFee);
    }

    function cancelGig(uint256 gigId, string calldata reason) external gigExists(gigId) onlyClient(gigId) nonReentrant {
        GigStatus storage status = gigStatusDetails[gigId];
        GigCore storage core = gigCoreDetails[gigId];
        require(!status.isApproved, "Cannot cancel approved work");
        require(!status.isCompleted, "Cannot cancel completed gig");

        if (status.isFunded) {
            require(mockUSDT.transfer(core.client, core.usdtAmount), "Client refund failed");
        }

        if (status.isStakeDeposited) {
            payable(status.selectedFreelancer).transfer(core.nativeStakeRequired);
        }

        status.isCompleted = true;
        emit GigCanceled(gigId, reason);
    }
    
    function extendDeadline(uint256 gigId, uint256 additionalDays) external gigExists(gigId) {
        require(additionalDays > 0 && additionalDays <= 90, "Additional days must be 1-90");
        
        GigStatus storage status = gigStatusDetails[gigId];
        require(!status.isCompleted, "Cannot extend completed gig");
        
        require(
            msg.sender == gigCoreDetails[gigId].client || 
            msg.sender == status.selectedFreelancer || 
            msg.sender == owner(),
            "Not authorized to extend deadline"
        );

        uint256 newDeadline = status.deadline + (additionalDays * 1 days);
        status.deadline = newDeadline;
        emit DeadlineExtended(gigId, newDeadline);
    }

    // --- PLATFORM OWNER FUNCTIONS ---
    
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = newFeePercent;
    }

    // CHANGED: This function now correctly updates the state variable.
    function setStakingGracePeriod(uint256 newGracePeriod) external onlyOwner {
        require(newGracePeriod >= 1 hours && newGracePeriod <= 7 days, "Grace period must be 1 hour to 7 days");
        stakingGracePeriod = newGracePeriod;
    }

    // --- INTERNAL HELPERS (Unchanged) ---
    
    function _removeFromFreelancerGigs(address freelancer, uint256 gigId) internal {
        uint256[] storage gigs = freelancerGigs[freelancer];
        for (uint256 i = 0; i < gigs.length; i++) {
            if (gigs[i] == gigId) {
                gigs[i] = gigs[gigs.length - 1];
                gigs.pop();
                break;
            }
        }
    }
    
    // --- VIEW FUNCTIONS (Refactored to assemble data for external calls) ---

    function getGigDetails(uint256 gigId) external view gigExists(gigId) returns (Gig memory) {
        // This function re-assembles the original Gig struct for external consumers.
        // It's less gas-efficient but maintains the original API.
        GigCore memory core = gigCoreDetails[gigId];
        GigStatus memory status = gigStatusDetails[gigId];

        return Gig({
            client: core.client,
            title: core.title,
            description: core.description,
            detailsUri: core.detailsUri,
            usdtAmount: core.usdtAmount,
            nativeStakeRequired: core.nativeStakeRequired,
            createdAt: core.createdAt,
            selectedFreelancer: status.selectedFreelancer,
            isApproved: status.isApproved,
            isFunded: status.isFunded,
            isStakeDeposited: status.isStakeDeposited,
            isCompleted: status.isCompleted,
            deadline: status.deadline,
            proposalDeadline: status.proposalDeadline,
            stakingDeadline: status.stakingDeadline
        });
    }

    function isGigActive(uint256 gigId) external view gigExists(gigId) returns (bool) {
        GigStatus memory status = gigStatusDetails[gigId];
        return !status.isCompleted && block.timestamp < status.deadline;
    }

    function isProposalPeriodActive(uint256 gigId) external view gigExists(gigId) returns (bool) {
        GigStatus memory status = gigStatusDetails[gigId];
        return !status.isCompleted && status.selectedFreelancer == address(0) && block.timestamp < status.proposalDeadline;
    }

    function canUserPropose(uint256 gigId, address user) external view gigExists(gigId) returns (bool) {
        GigStatus memory status = gigStatusDetails[gigId];
        GigCore memory core = gigCoreDetails[gigId];
        return !hasEverApplied[gigId][user] && 
               user != core.client && 
               status.selectedFreelancer == address(0) && 
               block.timestamp < status.proposalDeadline &&
               !status.isCompleted;
    }

    function isStakingRequired(uint256 gigId) external view gigExists(gigId) returns (bool) {
        return gigCoreDetails[gigId].nativeStakeRequired > 0;
    }

    function getStakingDeadline(uint256 gigId) external view gigExists(gigId) returns (uint256) {
        return gigStatusDetails[gigId].stakingDeadline;
    }

    function canExpireSelection(uint256 gigId) external view gigExists(gigId) returns (bool) {
        GigStatus memory status = gigStatusDetails[gigId];
        GigCore memory core = gigCoreDetails[gigId];
        return status.selectedFreelancer != address(0) && 
               !status.isStakeDeposited && 
               core.nativeStakeRequired > 0 && 
               block.timestamp > status.stakingDeadline;
    }

    // --- OTHER UNCHANGED FUNCTIONS ---

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = mockUSDT.balanceOf(address(this));
        if (balance > 0) {
            mockUSDT.transfer(owner(), balance);
        }
        
        uint256 nativeBalance = address(this).balance;
        if (nativeBalance > 0) {
            payable(owner()).transfer(nativeBalance);
        }
    }

    receive() external payable {}
    
    // Unchanged view functions that were already stack-safe
    function getApplicants(uint256 gigId) external view gigExists(gigId) returns (address[] memory) { return applicants[gigId]; }
    function getProposal(uint256 gigId, address freelancer) external view gigExists(gigId) returns (Proposal memory) { require(hasEverApplied[gigId][freelancer], "Freelancer has not submitted a proposal"); return proposals[gigId][freelancer]; }
    function getClientGigs(address client) external view returns (uint256[] memory) { return clientGigs[client]; }
    function getFreelancerGigs(address freelancer) external view returns (uint256[] memory) { return freelancerGigs[freelancer]; }
    function getActiveApplicants(uint256 gigId) external view gigExists(gigId) returns (address[] memory) { /* ... implementation unchanged ... */ address[] memory allApplicants = applicants[gigId]; uint256 activeCount = 0; for (uint256 i = 0; i < allApplicants.length; i++) { if (!proposals[gigId][allApplicants[i]].isWithdrawn) { activeCount++; } } address[] memory activeApplicants = new address[](activeCount); uint256 currentIndex = 0; for (uint256 i = 0; i < allApplicants.length; i++) { if (!proposals[gigId][allApplicants[i]].isWithdrawn) { activeApplicants[currentIndex] = allApplicants[i]; currentIndex++; } } return activeApplicants; }
    function getAllProposals(uint256 gigId) external view gigExists(gigId) returns (Proposal[] memory) { /* ... implementation unchanged ... */ address[] memory gigApplicants = applicants[gigId]; uint256 length = gigApplicants.length; Proposal[] memory allProposals = new Proposal[](length); for (uint256 i = 0; i < length; i++) { allProposals[i] = proposals[gigId][gigApplicants[i]]; } return allProposals; }
    function getActiveProposals(uint256 gigId) external view gigExists(gigId) returns (Proposal[] memory) { /* ... implementation unchanged ... */ address[] memory gigApplicants = applicants[gigId]; uint256 activeCount = 0; for (uint256 i = 0; i < gigApplicants.length; i++) { if (!proposals[gigId][gigApplicants[i]].isWithdrawn) { activeCount++; } } Proposal[] memory activeProposals = new Proposal[](activeCount); uint256 currentIndex = 0; for (uint256 i = 0; i < gigApplicants.length; i++) { if (!proposals[gigId][gigApplicants[i]].isWithdrawn) { activeProposals[currentIndex] = proposals[gigId][gigApplicants[i]]; currentIndex++; } } return activeProposals; }
}