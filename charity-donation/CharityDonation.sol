// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CharityDonation {
    address public admin;

    struct Campaign {
        uint id;
        string title;
        string description;
        uint goal;
        uint totalDonations;
        uint donorCount;
        bool exists;
    }

    struct DonationRecord {
        uint campaignId;
        uint amount;
        uint timestamp;
    }

    uint public campaignCount;
    mapping(uint => Campaign) public campaigns;
    mapping(uint => mapping(address => uint)) public donorContributions;
    mapping(uint => address[]) private campaignDonors;
    mapping(address => DonationRecord[]) private donorHistory;

    event CampaignCreated(uint indexed id, string title, uint goal);
    event DonationReceived(uint indexed campaignId, address indexed donor, uint amount);
    event FundsWithdrawn(uint indexed campaignId, uint amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier campaignExists(uint _id) {
        require(campaigns[_id].exists, "Campaign does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createCampaign(string memory _title, string memory _description, uint _goal) external onlyAdmin {
        require(bytes(_title).length > 0, "Title required");
        require(_goal > 0, "Goal must be greater than 0");
        campaignCount++;
        campaigns[campaignCount] = Campaign(campaignCount, _title, _description, _goal, 0, 0, true);
        emit CampaignCreated(campaignCount, _title, _goal);
    }

    function donate(uint _campaignId) external payable campaignExists(_campaignId) {
        require(msg.value > 0, "Donation must be greater than 0");
        Campaign storage c = campaigns[_campaignId];
        if (donorContributions[_campaignId][msg.sender] == 0) {
            c.donorCount++;
            campaignDonors[_campaignId].push(msg.sender);
        }
        donorContributions[_campaignId][msg.sender] += msg.value;
        c.totalDonations += msg.value;
        donorHistory[msg.sender].push(DonationRecord(_campaignId, msg.value, block.timestamp));
        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

    function getTotalDonations(uint _campaignId) external view campaignExists(_campaignId) returns (uint) {
        return campaigns[_campaignId].totalDonations;
    }

    function getDonorContribution(uint _campaignId, address _donor) external view campaignExists(_campaignId) returns (uint) {
        return donorContributions[_campaignId][_donor];
    }

    function withdrawDonations(uint _campaignId) external onlyAdmin campaignExists(_campaignId) {
        uint amount = campaigns[_campaignId].totalDonations;
        require(amount > 0, "No funds to withdraw");
        campaigns[_campaignId].totalDonations = 0;
        payable(admin).transfer(amount);
        emit FundsWithdrawn(_campaignId, amount);
    }

    function getDonorHistory(address _donor) external view returns (DonationRecord[] memory) {
        return donorHistory[_donor];
    }

    function getLeaderboard(uint _campaignId) external view campaignExists(_campaignId) returns (address[] memory donors, uint[] memory amounts) {
        address[] memory d = campaignDonors[_campaignId];
        uint len = d.length;
        donors = new address[](len);
        amounts = new uint[](len);
        for (uint i = 0; i < len; i++) {
            donors[i] = d[i];
            amounts[i] = donorContributions[_campaignId][d[i]];
        }
        // Bubble sort descending
        for (uint i = 0; i < len; i++) {
            for (uint j = i + 1; j < len; j++) {
                if (amounts[j] > amounts[i]) {
                    (amounts[i], amounts[j]) = (amounts[j], amounts[i]);
                    (donors[i], donors[j]) = (donors[j], donors[i]);
                }
            }
        }
    }

    function getCampaign(uint _id) external view campaignExists(_id) returns (uint, string memory, string memory, uint, uint, uint) {
        Campaign memory c = campaigns[_id];
        return (c.id, c.title, c.description, c.goal, c.totalDonations, c.donorCount);
    }
}
