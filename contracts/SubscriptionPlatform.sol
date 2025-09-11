// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

contract SubscriptionPlatform {


    enum SubscriptionState { Paused, IsActive }

    struct SubscribeService {
        uint id;
        string name;
        address owner;
        uint durationInDays;
        uint fee;
        SubscriptionState state;
        uint earnings;
    }

    struct Subscription{
        uint endtime;
        bool exists;
    }


    
    address private subOwner;
    uint public subCount;

    mapping(uint=> SubscribeService) public subService;
    mapping(uint =>mapping(address=>Subscription)) public subscriptions;
    mapping(address => uint[]) public createdSubscriptions;

    error NotOwner();


    modifier onlyOwner() {
        if(msg.sender != subOwner) revert NotOwner();
        _;
    }

    constructor(address contractOwner) {
        subOwner = contractOwner;
    }

    event SubscriptionCreated(uint256 indexed id, string name, address indexed owner);


    function createSubscription(
        string calldata name,
        uint durationInDays,
        uint fee
    )
        external
    {
        ++subCount;
        uint id = subCount;

        subService[id] = SubscribeService({
            id: id,
            name: name,
            owner: msg.sender,
            durationInDays: durationInDays,
            fee: fee,
            state: SubscriptionState.Paused,
            earnings: 0
        });

        createdSubscriptions[msg.sender].push(id);

        emit SubscriptionCreated(id,name,msg.sender);
    }
    function getSubscriptions() external view returns (uint[] memory, string[] memory) {
        uint[] storage ids = createdSubscriptions[msg.sender];
        uint idLenght = ids.length;

        string[] memory names = new string[](idLenght);

        for (uint i = 0; i < idLenght; i++) {
            names[i] = subService[ids[i]].name;
        }

        return (ids, names);
    }

}