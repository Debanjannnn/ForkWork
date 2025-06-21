// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract FreelanceGigEscrow {
    struct Gig {
        address client;
        string title;
        string description;
        uint256 usdtAmount;
        uint256 nativeStakeRequired;
        address selectedFreelancer;
        bool isApproved;
        bool isFunded;
        bool isStakeDeposited;
        bool isCompleted;
        uint256 deadline; // New: deadline for completion
        uint256 createdAt; // New: timestamp when gig was created
    }

    IERC20 public mockUSDT;
    uint256 public gigCount;
    uint256 public platformFeePercent = 250; // 2.5% platform fee (250 basis points)
    address public platformOwner;
    
    mapping(uint256 => Gig) public gigs;
    mapping(uint256 => address[]) public applicants;
    mapping(uint256 => mapping(address => bool)) public hasApplied; // Prevent duplicate applications
    mapping(address => uint256[]) public clientGigs; // Track gigs by client
    mapping(address => uint256[]) public freelancerGigs; // Track gigs by freelancer

    event GigPosted(uint256 indexed gigId, address indexed client, uint256 usdtAmount, uint256 deadline);
    event AppliedToGig(uint256 indexed gigId, address indexed freelancer);
    event FreelancerSelected(uint256 indexed gigId, address indexed freelancer);
    event GigFunded(uint256 indexed gigId, uint256 amount);
    event StakeDeposited(uint256 indexed gigId, address indexed freelancer, uint256 amount);
    event WorkApproved(uint256 indexed gigId);
    event PayoutReleased(uint256 indexed gigId, address indexed freelancer, uint256 amount, uint256 platformFee);
    event GigCanceled(uint256 indexed gigId, string reason);
    event DeadlineExtended(uint256 indexed gigId, uint256 newDeadline);

    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Only platform owner");
        _;
    }

    modifier gigExists(uint256 gigId) {
        require(gigId < gigCount, "Gig does not exist");
        _;
    }

    modifier onlyClient(uint256 gigId) {
        require(msg.sender == gigs[gigId].client, "Only client can perform this action");
        _;
    }

    modifier onlySelectedFreelancer(uint256 gigId) {
        require(msg.sender == gigs[gigId].selectedFreelancer, "Only selected freelancer can perform this action");
        _;
    }

    constructor(address _mockUSDT) {
        mockUSDT = IERC20(_mockUSDT);
        platformOwner = msg.sender;
    }

    // Post a new gig with deadline
    function postGig(
        string calldata title, 
        string calldata description, 
        uint256 usdtAmount, 
        uint256 nativeStakeRequired,
        uint256 durationDays
    ) external {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(usdtAmount > 0, "Payment amount must be greater than 0");
        require(durationDays > 0 && durationDays <= 365, "Duration must be between 1-365 days");

        uint256 deadline = block.timestamp + (durationDays * 1 days);
        
        gigs[gigCount] = Gig({
            client: msg.sender,
            title: title,
            description: description,
            usdtAmount: usdtAmount,
            nativeStakeRequired: nativeStakeRequired,
            selectedFreelancer: address(0),
            isApproved: false,
            isFunded: false,
            isStakeDeposited: false,
            isCompleted: false,
            deadline: deadline,
            createdAt: block.timestamp
        });

        clientGigs[msg.sender].push(gigCount);
        emit GigPosted(gigCount, msg.sender, usdtAmount, deadline);
        gigCount++;
    }

    // Apply to a gig (prevent duplicate applications)
    function applyToGig(uint256 gigId) external gigExists(gigId) {
        Gig storage gig = gigs[gigId];
        require(gig.selectedFreelancer == address(0), "Freelancer already selected");
        require(!hasApplied[gigId][msg.sender], "Already applied to this gig");
        require(msg.sender != gig.client, "Client cannot apply to own gig");
        require(block.timestamp < gig.deadline, "Application deadline passed");

        applicants[gigId].push(msg.sender);
        hasApplied[gigId][msg.sender] = true;
        emit AppliedToGig(gigId, msg.sender);
    }

    // Select a freelancer
    function selectFreelancer(uint256 gigId, address freelancer) external gigExists(gigId) onlyClient(gigId) {
        Gig storage gig = gigs[gigId];
        require(gig.selectedFreelancer == address(0), "Freelancer already selected");
        require(hasApplied[gigId][freelancer], "Address has not applied to this gig");
        require(block.timestamp < gig.deadline, "Selection deadline passed");

        gig.selectedFreelancer = freelancer;
        freelancerGigs[freelancer].push(gigId);
        emit FreelancerSelected(gigId, freelancer);
    }

    // Fund the gig escrow in USDT
    function fundGig(uint256 gigId) external gigExists(gigId) onlyClient(gigId) {
        Gig storage gig = gigs[gigId];
        require(!gig.isFunded, "Gig already funded");
        require(gig.selectedFreelancer != address(0), "No freelancer selected");
        
        // Check client has sufficient balance
        require(mockUSDT.balanceOf(msg.sender) >= gig.usdtAmount, "Insufficient USDT balance");
        require(mockUSDT.transferFrom(msg.sender, address(this), gig.usdtAmount), "USDT transfer failed");

        gig.isFunded = true;
        emit GigFunded(gigId, gig.usdtAmount);
    }

    // Freelancer deposits stake
    function depositStake(uint256 gigId) external payable gigExists(gigId) onlySelectedFreelancer(gigId) {
        Gig storage gig = gigs[gigId];
        require(gig.nativeStakeRequired > 0, "No stake required for this gig");
        require(!gig.isStakeDeposited, "Stake already deposited");
        require(msg.value == gig.nativeStakeRequired, "Incorrect stake amount");
        require(block.timestamp < gig.deadline, "Deadline passed");

        gig.isStakeDeposited = true;
        emit StakeDeposited(gigId, msg.sender, msg.value);
    }

    // Client approves the work
    function approveWork(uint256 gigId) external gigExists(gigId) onlyClient(gigId) {
        Gig storage gig = gigs[gigId];
        require(gig.selectedFreelancer != address(0), "No freelancer selected");
        require(gig.isFunded, "Gig not funded");
        require(!gig.isApproved, "Work already approved");
        require(!gig.isCompleted, "Gig already completed");

        // Check stake requirement
        if (gig.nativeStakeRequired > 0) {
            require(gig.isStakeDeposited, "Required stake not deposited");
        }

        gig.isApproved = true;
        emit WorkApproved(gigId);
    }

    // Release payment to freelancer (with platform fee)
    function releasePayment(uint256 gigId) external gigExists(gigId) {
        Gig storage gig = gigs[gigId];
        require(gig.isApproved, "Work not approved yet");
        require(!gig.isCompleted, "Payment already released");
        
        address freelancer = gig.selectedFreelancer;
        uint256 totalAmount = gig.usdtAmount;
        uint256 platformFee = (totalAmount * platformFeePercent) / 10000;
        uint256 freelancerAmount = totalAmount - platformFee;

        // Mark as completed first to prevent reentrancy
        gig.isCompleted = true;

        // Transfer USDT
        require(mockUSDT.transfer(freelancer, freelancerAmount), "Freelancer USDT transfer failed");
        if (platformFee > 0) {
            require(mockUSDT.transfer(platformOwner, platformFee), "Platform fee transfer failed");
        }

        // Return native stake if applicable
        if (gig.nativeStakeRequired > 0 && gig.isStakeDeposited) {
            payable(freelancer).transfer(gig.nativeStakeRequired);
        }

        emit PayoutReleased(gigId, freelancer, freelancerAmount, platformFee);
    }

    // Cancel gig and refund (only if no freelancer selected or work not started)
    function cancelGig(uint256 gigId, string calldata reason) external gigExists(gigId) onlyClient(gigId) {
        Gig storage gig = gigs[gigId];
        require(!gig.isApproved, "Cannot cancel approved work");
        require(!gig.isCompleted, "Cannot cancel completed gig");

        // Refund client if funded
        if (gig.isFunded) {
            require(mockUSDT.transfer(gig.client, gig.usdtAmount), "Client refund failed");
        }

        // Refund freelancer stake if deposited
        if (gig.isStakeDeposited) {
            payable(gig.selectedFreelancer).transfer(gig.nativeStakeRequired);
        }

        gig.isCompleted = true; // Mark as completed to prevent further actions
        emit GigCanceled(gigId, reason);
    }

    // Extend deadline (mutual agreement or platform decision)
    function extendDeadline(uint256 gigId, uint256 additionalDays) external gigExists(gigId) {
        require(additionalDays > 0 && additionalDays <= 90, "Additional days must be 1-90");
        
        Gig storage gig = gigs[gigId];
        require(!gig.isCompleted, "Cannot extend completed gig");
        
        // Allow client, selected freelancer, or platform owner to extend
        require(
            msg.sender == gig.client || 
            msg.sender == gig.selectedFreelancer || 
            msg.sender == platformOwner,
            "Not authorized to extend deadline"
        );

        uint256 newDeadline = gig.deadline + (additionalDays * 1 days);
        gig.deadline = newDeadline;
        emit DeadlineExtended(gigId, newDeadline);
    }

    // Platform owner functions
    function setPlatformFee(uint256 newFeePercent) external onlyPlatformOwner {
        require(newFeePercent <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFeePercent = newFeePercent;
    }

    function transferOwnership(address newOwner) external onlyPlatformOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        platformOwner = newOwner;
    }

    // View functions
    function getApplicants(uint256 gigId) external view returns (address[] memory) {
        return applicants[gigId];
    }

    function getClientGigs(address client) external view returns (uint256[] memory) {
        return clientGigs[client];
    }

    function getFreelancerGigs(address freelancer) external view returns (uint256[] memory) {
        return freelancerGigs[freelancer];
    }

    function getGigDetails(uint256 gigId) external view returns (
        address client,
        string memory title,
        string memory description,
        uint256 usdtAmount,
        uint256 nativeStakeRequired,
        address selectedFreelancer,
        bool isApproved,
        bool isFunded,
        bool isStakeDeposited,
        bool isCompleted,
        uint256 deadline,
        uint256 createdAt
    ) {
        Gig storage gig = gigs[gigId];
        return (
            gig.client,
            gig.title,
            gig.description,
            gig.usdtAmount,
            gig.nativeStakeRequired,
            gig.selectedFreelancer,
            gig.isApproved,
            gig.isFunded,
            gig.isStakeDeposited,
            gig.isCompleted,
            gig.deadline,
            gig.createdAt
        );
    }

    function isGigActive(uint256 gigId) external view returns (bool) {
        Gig storage gig = gigs[gigId];
        return !gig.isCompleted && block.timestamp < gig.deadline;
    }

    // Emergency functions (only platform owner)
    function emergencyWithdraw() external onlyPlatformOwner {
        // Only for emergency situations - should be used carefully
        uint256 balance = mockUSDT.balanceOf(address(this));
        if (balance > 0) {
            mockUSDT.transfer(platformOwner, balance);
        }
        
        uint256 nativeBalance = address(this).balance;
        if (nativeBalance > 0) {
            payable(platformOwner).transfer(nativeBalance);
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
}