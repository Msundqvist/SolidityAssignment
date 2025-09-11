// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

contract Prenumeration {

    address private owner;
    enum SubscriptionState { Paused, IsActive }

    struct Subscribe {
        string title;
        uint256 durationInDays;
        uint16 fee;
        bool exists;
    }

    mapping(string => Subscribe[]) public subscriptions;
    mapping (address =>uint) public subscriptionFees;

    SubscriptionState public subscriptionState;

    modifier inState(SubscriptionState state) {
        require(subscriptionState == state, "Invalid state, Action cannot be performed!");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function!!");
        _;
    }

    constructor() {
        owner = msg.sender;
        subscriptionState = SubscriptionState.Paused;
    }

    event SubscriptionCreated(string indexed title, uint256 durationInDays, uint16 fee);

    function setState(SubscriptionState state) public onlyOwner {
        subscriptionState = state;
    }

    function createSubscription(
        string memory title,
        uint256 durationInDays,
        uint16 fee
    )
        public
        onlyOwner
        inState(SubscriptionState.IsActive)
    {
        subscriptions[title].push(Subscribe({
            title: title,
            durationInDays: durationInDays,
            fee: fee,
            exists: true
        }));
        emit SubscriptionCreated(title, durationInDays, fee);
    }
}
