// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralisedAuction {

    address public owner;

    struct Auction {
        uint id;
        string itemName;
        string itemDescription;
        uint startingPrice;
        uint endTime;
        address highestBidder;
        uint highestBid;
        bool ended;
        bool exists;
    }

    uint public auctionCount;
    mapping(uint => Auction) public auctions;

    // pending refunds: auctionId => bidder => amount
    mapping(uint => mapping(address => uint)) public pendingRefunds;

    event AuctionCreated(uint indexed id, string itemName, uint startingPrice, uint endTime);
    event BidPlaced(uint indexed auctionId, address indexed bidder, uint amount);
    event AuctionEnded(uint indexed auctionId, address winner, uint amount);
    event RefundWithdrawn(uint indexed auctionId, address indexed bidder, uint amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier auctionExists(uint _id) {
        require(auctions[_id].exists, "Auction does not exist");
        _;
    }

    modifier auctionActive(uint _id) {
        require(!auctions[_id].ended, "Auction already ended");
        require(block.timestamp < auctions[_id].endTime, "Auction time has expired");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createAuction(
        string memory _itemName,
        string memory _itemDescription,
        uint _startingPrice,
        uint _durationInMinutes
    ) external onlyOwner {
        require(bytes(_itemName).length > 0, "Item name required");
        require(_startingPrice > 0, "Starting price must be greater than 0");
        require(_durationInMinutes > 0, "Duration must be greater than 0");

        auctionCount++;
        uint endTime = block.timestamp + (_durationInMinutes * 1 minutes);

        auctions[auctionCount] = Auction({
            id: auctionCount,
            itemName: _itemName,
            itemDescription: _itemDescription,
            startingPrice: _startingPrice,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            exists: true
        });

        emit AuctionCreated(auctionCount, _itemName, _startingPrice, endTime);
    }

    function placeBid(uint _auctionId) external payable auctionExists(_auctionId) auctionActive(_auctionId) {
        Auction storage a = auctions[_auctionId];

        require(msg.value > a.startingPrice, "Bid must be above starting price");
        require(msg.value > a.highestBid, "Bid must be higher than current highest bid");
        require(msg.sender != a.highestBidder, "You are already the highest bidder");

        // Refund previous highest bidder
        if (a.highestBidder != address(0)) {
            pendingRefunds[_auctionId][a.highestBidder] += a.highestBid;
        }

        a.highestBidder = msg.sender;
        a.highestBid = msg.value;

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    function getHighestBid(uint _auctionId) external view auctionExists(_auctionId) returns (uint) {
        return auctions[_auctionId].highestBid;
    }

    function endAuction(uint _auctionId) external onlyOwner auctionExists(_auctionId) {
        Auction storage a = auctions[_auctionId];
        require(!a.ended, "Auction already ended");
        require(block.timestamp >= a.endTime, "Auction has not ended yet");

        a.ended = true;

        if (a.highestBidder != address(0)) {
            payable(owner).transfer(a.highestBid);
        }

        emit AuctionEnded(_auctionId, a.highestBidder, a.highestBid);
    }

    function getAuctionWinner(uint _auctionId) external view auctionExists(_auctionId) returns (address, uint) {
        Auction storage a = auctions[_auctionId];
        require(a.ended, "Auction has not ended yet");
        return (a.highestBidder, a.highestBid);
    }

    function withdrawRefund(uint _auctionId) external auctionExists(_auctionId) {
        uint amount = pendingRefunds[_auctionId][msg.sender];
        require(amount > 0, "No refund available");

        pendingRefunds[_auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit RefundWithdrawn(_auctionId, msg.sender, amount);
    }

    function getAuction(uint _id) external view auctionExists(_id) returns (
        uint, string memory, string memory, uint, uint, address, uint, bool
    ) {
        Auction storage a = auctions[_id];
        return (a.id, a.itemName, a.itemDescription, a.startingPrice, a.endTime, a.highestBidder, a.highestBid, a.ended);
    }

    function getMyRefund(uint _auctionId, address _bidder) external view returns (uint) {
        return pendingRefunds[_auctionId][_bidder];
    }
}
