// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Allin1Bounty
 * @dev A comprehensive bounty platform supporting USDT payments and dynamic prize distributions
 * @author Web3 Bounty Platform
 */
contract Allin1Bounty is ReentrancyGuard, Ownable {
    // =============================================================================
    // ENUMS & STRUCTS
    // =============================================================================
     
    enum Category {
        Content,
        Development,
        Design,
        Research,
        Marketing,
        Other
    }
    
    enum BountyStatus {
        Open,
        Closed,
        Cancelled
    }
    
    struct Winner {
        address recipient;
        uint256 prize;
    }
    
    struct Submission {
        address submitter;
        string mainUri;
        string[] evidenceUris;
        uint256 timestamp;
    }
    
    struct Bounty {
        uint256 id;
        address creator;
        string name;
        string description;
        Category category;
        uint256 deadline;
        uint256 totalReward;
        BountyStatus status;
        uint256 submissionCount;
        Winner[] winners;
        uint256 createdAt;
    }
    
    // =============================================================================
    // STATE VARIABLES
    // =============================================================================
    
    IERC20 public immutable usdtToken;

    constructor(address _usdt) Ownable(msg.sender) {
        usdtToken = IERC20(_usdt);
    }
    
    uint256 public nextBountyId = 1;
    uint256 public constant MAX_PENALTY_PERCENTAGE = 50; // 50% max penalty
    
    // Mappings
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission[]) public bountySubmissions;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;
    mapping(address => uint256[]) public userBounties;
    mapping(address => uint256[]) public userSubmissions;
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        string name,
        Category category,
        uint256 totalReward,
        uint256 deadline
    );
    
    event SubmissionMade(
        uint256 indexed bountyId,
        address indexed submitter,
        string mainUri,
        uint256 timestamp
    );
    
    event BountyCancelled(
        uint256 indexed bountyId,
        address indexed creator,
        uint256 penaltyAmount,
        uint256 refundAmount
    );
    
    event WinnersSelected(
        uint256 indexed bountyId,
        address indexed creator,
        Winner[] winners,
        uint256 totalDistributed
    );
    
    event PenaltyDistributed(
        uint256 indexed bountyId,
        address indexed recipient,
        uint256 amount
    );
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
 
    // =============================================================================
    // MODIFIERS
    // =============================================================================
    
    modifier bountyExists(uint256 bountyId) {
        require(bounties[bountyId].creator != address(0), "Bounty does not exist");
        _;
    }
    
    modifier onlyBountyCreator(uint256 bountyId) {
        require(bounties[bountyId].creator == msg.sender, "Not bounty creator");
        _;
    }
    
    modifier bountyIsOpen(uint256 bountyId) {
        require(bounties[bountyId].status == BountyStatus.Open, "Bounty not open");
        _;
    }
    
    modifier beforeDeadline(uint256 bountyId) {
        require(block.timestamp < bounties[bountyId].deadline, "Deadline passed");
        _;
    }
    
    modifier afterDeadline(uint256 bountyId) {
        require(block.timestamp >= bounties[bountyId].deadline, "Deadline not reached");
        _;
    }
    
    // =============================================================================
    // MAIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Create a new bounty with USDT funding
     * @param name The bounty title
     * @param description Detailed bounty description
     * @param category The bounty category
     * @param deadline Unix timestamp for bounty deadline
     * @param totalReward Total USDT reward amount
     */
    function createBounty(
        string memory name,
        string memory description,
        Category category,
        uint256 deadline,
        uint256 totalReward
    ) external nonReentrant returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(totalReward > 0, "Reward must be greater than 0");
        
        // Transfer USDT from creator to contract
        require(
            usdtToken.transferFrom(msg.sender, address(this), totalReward),
            "USDT transfer failed"
        );
        
        uint256 bountyId = nextBountyId++;
        
        Bounty storage newBounty = bounties[bountyId];
        newBounty.id = bountyId;
        newBounty.creator = msg.sender;
        newBounty.name = name;
        newBounty.description = description;
        newBounty.category = category;
        newBounty.deadline = deadline;
        newBounty.totalReward = totalReward;
        newBounty.status = BountyStatus.Open;
        newBounty.submissionCount = 0;
        newBounty.createdAt = block.timestamp;
        
        userBounties[msg.sender].push(bountyId);
        
        emit BountyCreated(bountyId, msg.sender, name, category, totalReward, deadline);
        
        return bountyId;
    }
    
    /**
     * @dev Submit to a bounty (one submission per address per bounty)
     * @param bountyId The target bounty ID
     * @param mainUri Main submission content URI
     * @param evidenceUris Array of supporting evidence URIs
     */
    function submitToBounty(
        uint256 bountyId,
        string memory mainUri,
        string[] memory evidenceUris
    ) external bountyExists(bountyId) bountyIsOpen(bountyId) beforeDeadline(bountyId) {
        require(bounties[bountyId].creator != msg.sender, "Creator cannot submit");
        require(!hasSubmitted[bountyId][msg.sender], "Already submitted");
        require(bytes(mainUri).length > 0, "Main URI cannot be empty");
        
        Submission memory newSubmission = Submission({
            submitter: msg.sender,
            mainUri: mainUri,
            evidenceUris: evidenceUris,
            timestamp: block.timestamp
        });
        
        bountySubmissions[bountyId].push(newSubmission);
        hasSubmitted[bountyId][msg.sender] = true;
        bounties[bountyId].submissionCount++;
        userSubmissions[msg.sender].push(bountyId);
        
        
        emit SubmissionMade(bountyId, msg.sender, mainUri, block.timestamp);
    }
    
    /**
     * @dev Cancel a bounty with penalty calculation
     * @param bountyId The bounty to cancel
     */
    function cancelBounty(uint256 bountyId) 
        external 
        bountyExists(bountyId) 
        onlyBountyCreator(bountyId) 
        bountyIsOpen(bountyId) 
        beforeDeadline(bountyId) 
        nonReentrant 
    {
        Bounty storage bounty = bounties[bountyId];
        
        uint256 penaltyAmount = _calculatePenalty(bountyId);
        uint256 refundAmount = bounty.totalReward - penaltyAmount;
        
        bounty.status = BountyStatus.Cancelled;
        
        // Distribute penalty among submitters (if any)
        if (penaltyAmount > 0 && bounty.submissionCount > 0) {
            _distributePenalty(bountyId, penaltyAmount);
        }
        
        // Refund remaining amount to creator
        if (refundAmount > 0) {
            require(usdtToken.transfer(bounty.creator, refundAmount), "Refund failed");
        }
        
        emit BountyCancelled(bountyId, bounty.creator, penaltyAmount, refundAmount);
    }
    
    /**
     * @dev Select winners and distribute prizes
     * @param bountyId The bounty ID
     * @param winners Array of winners with their prize amounts
     */
    function selectWinners(uint256 bountyId, Winner[] memory winners)
        external
        bountyExists(bountyId)
        onlyBountyCreator(bountyId)
        bountyIsOpen(bountyId)
        afterDeadline(bountyId)
        nonReentrant
    {
        require(winners.length > 0, "Must have at least one winner");
        
        Bounty storage bounty = bounties[bountyId];
        uint256 totalDistribution = 0;
        
        // Validate winners and calculate total distribution
        for (uint256 i = 0; i < winners.length; i++) {
            require(winners[i].recipient != address(0), "Invalid winner address");
            require(winners[i].prize > 0, "Prize must be greater than 0");
            require(hasSubmitted[bountyId][winners[i].recipient], "Winner must have submitted");
            
            totalDistribution += winners[i].prize;
        }
        
        require(totalDistribution <= bounty.totalReward, "Total distribution exceeds reward");
        
        // Store winners and distribute prizes
        for (uint256 i = 0; i < winners.length; i++) {
            bounty.winners.push(winners[i]);
            require(
                usdtToken.transfer(winners[i].recipient, winners[i].prize),
                "Prize transfer failed"
            );
        }
        
        bounty.status = BountyStatus.Closed;
        
        // Refund any remaining amount to creator
        uint256 remainder = bounty.totalReward - totalDistribution;
        if (remainder > 0) {
            require(usdtToken.transfer(bounty.creator, remainder), "Remainder refund failed");
        }
        
        emit WinnersSelected(bountyId, bounty.creator, winners, totalDistribution);
    }
    
    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Get bounty details
     */
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        require(bounties[bountyId].creator != address(0), "Bounty does not exist");
        return bounties[bountyId];
    }
    
    /**
     * @dev Get all submissions for a bounty
     */
    function getBountySubmissions(uint256 bountyId) external view returns (Submission[] memory) {
        return bountySubmissions[bountyId];
    }
    
    /**
     * @dev Get bounties created by a user
     */
    function getUserBounties(address user) external view returns (uint256[] memory) {
        return userBounties[user];
    }
    
    /**
     * @dev Get bounties where user has submitted
     */
    function getUserSubmissions(address user) external view returns (uint256[] memory) {
        return userSubmissions[user];
    }
    
    /**
     * @dev Get winners of a bounty
     */
    function getBountyWinners(uint256 bountyId) external view returns (Winner[] memory) {
        return bounties[bountyId].winners;
    }
    
    /**
     * @dev Check if user has submitted to a bounty
     */
    function hasUserSubmitted(uint256 bountyId, address user) external view returns (bool) {
        return hasSubmitted[bountyId][user];
    }
    
    /**
     * @dev Calculate penalty for cancelling a bounty
     */
    function calculatePenalty(uint256 bountyId) external view returns (uint256) {
        return _calculatePenalty(bountyId);
    }
    
    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Calculate cancellation penalty based on time elapsed
     */
    function _calculatePenalty(uint256 bountyId) internal view returns (uint256) {
        Bounty storage bounty = bounties[bountyId];
        
        uint256 elapsed = block.timestamp - bounty.createdAt;
        uint256 duration = bounty.deadline - bounty.createdAt;
        
        if (elapsed >= duration) {
            return (bounty.totalReward * MAX_PENALTY_PERCENTAGE) / 100;
        }
        
        // Linear penalty calculation: (elapsed / duration) * MAX_PENALTY_PERCENTAGE
        uint256 penaltyPercentage = (elapsed * MAX_PENALTY_PERCENTAGE) / duration;
        return (bounty.totalReward * penaltyPercentage) / 100;
    }
    
    /**
     * @dev Distribute penalty equally among all submitters
     */
    function _distributePenalty(uint256 bountyId, uint256 penaltyAmount) internal {
        Submission[] storage submissions = bountySubmissions[bountyId];
        uint256 submissionCount = submissions.length;
        
        if (submissionCount == 0) return;
        
        uint256 amountPerSubmitter = penaltyAmount / submissionCount;
        uint256 remainder = penaltyAmount % submissionCount;
        
        for (uint256 i = 0; i < submissionCount; i++) {
            uint256 payout = amountPerSubmitter;
            
            // Distribute remainder to first few submitters
            if (i < remainder) {
                payout += 1;
            }
            
            if (payout > 0) {
                require(
                    usdtToken.transfer(submissions[i].submitter, payout),
                    "Penalty distribution failed"
                );
                
                emit PenaltyDistributed(bountyId, submissions[i].submitter, payout);
            }
        }
    }
    
    // =============================================================================
    // EMERGENCY FUNCTIONS (OWNER ONLY)
    // =============================================================================
    
    /**
     * @dev Emergency function to recover stuck tokens (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @dev Pause contract in emergency (could be extended with Pausable)
     */
    function emergencyPause() external onlyOwner {
        // Implementation depends on whether you want to add Pausable functionality
        // This is a placeholder for emergency pause logic
    }
}