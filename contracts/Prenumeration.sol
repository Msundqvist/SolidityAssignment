// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

contract Prenumeration{

    enum PrenumerationState { Paused, Ongoing, Ended}

    struct PrenItem{
        uint id;
        uint duration;
        address private owner;
        string prenumerationTitle;
        bool isActive;

    }

    struct PrenOwner{
        uint prenId;
        uint duration;
        uint price;
        address owner;
    }

    prenumerationItem[] public items;

    PrenumerationState public prenumerationState;


    constructor (string [] memory prenumerationOptions ){
        for (uint i = 0 i < prenumerationOptions.length, i ++ ){
            items.puch(prenumerationItem({
                prenumerationTitle: prenumerationOptions[i],
                id: id 

            }))
            prenumerationOptions  = PrenumerationState.Paused;
        }
    }

}