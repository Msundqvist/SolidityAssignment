// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

contract Prenumeration {

    address private owner;
    enum SubscriptionState { Paused, IsActive }

    struct Subscribe {
        string title;
        uint16 duration;
        uint16 price;
        bool exists;
    }

    mapping(string => Subscribe[]) public subscriptions;

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

    event SubscriptionCreated(string indexed subscriptionTitle, uint16 duration, uint16 price);

    function setState(SubscriptionState state) public onlyOwner {
        subscriptionState = state;
    }

    function createSubscription(
        string memory title,
        uint16 duration,
        uint16 price
    )
        public
        onlyOwner
        inState(SubscriptionState.IsActive)
    {
        subscriptions[title].push(Subscribe({
            title: title,
            duration: duration,
            price: price,
            exists: true
        }));
        emit SubscriptionCreated(title, duration, price);
    }
}
