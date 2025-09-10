// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

contract Prenumeration{

    address private owner;
    enum SubscriptionState { Paused, Ongoing, Ended}

    struct Subscribe{
        string title;
        uint16 duration;
        uint16 price;
        bool exists;

    }

  mapping(string => Subscribe[]) public subscriptions;


    SubscriptionState public subscriptionState;

    modifier inState (PrenumerationState state){
        require(prenumerationState == state, "Invalid state, Action cannot be preformed!");
        _;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Only owner can call this function!!")
        
    }



    constructor (){
        owner = msg.sender;
        subscriptions = SubscriptionState.Paused;
    } 

    function setState(SubscriptionState state) public onlyOwner{
        subscriptionState = state; 
    }

    function createSubscription(string memory subscriptionTitle, string memory title, uint16 duration, uint16 price)  public onlyOwner inState(subscriptionState.Ongoing){
        subscriptions[subscriptionTitle].push(Subscribe({
            title: title,
            duration: duration,
            price: price,
            exists: true
        }));
    }                                                                                    

}