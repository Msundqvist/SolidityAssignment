// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

contract Prenumeration{

    address private owner;
    enum PrenumerationState { Paused, Ongoing, Ended}

    struct Subscribe{
        string title;
        uint16 duration;
        uint16 price;
        bool exists;

    }

  mapping(string => Subscribe[]) public subscriptions;


    PrenumerationState public prenumerationState;

    modifier inState (PrenumerationState state){
        require(prenumerationState == state, "Invalid state, Action cannot be preformed!");
        _;
    }



    constructor (){
        owner = msg.sender;
    } 

    function createPren(string memory subscriptionTitle, string memory title, uint16 duration, uint16 price)  public{
        subscriptions[subscriptionTitle].push(Subscribe({
            title: title,
            duration: duration,
            price: price,
            exists: true
        }));
    }                                                                                    

}