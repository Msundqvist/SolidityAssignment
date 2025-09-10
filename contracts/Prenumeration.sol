// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

contract Prenumeration{

    enum PrenumerationState { Paused, Ongoing, Ended}

    struct PrenItem{
        uint id;
        uint duration;
        uint price;
        address owner;
        string prenumerationTitle;
        bool isActive;

    }




    PrenumerationState public prenumerationState;


    constructor {
      
        }
    }

