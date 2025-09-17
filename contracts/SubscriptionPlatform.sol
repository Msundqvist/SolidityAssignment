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
    bool private _locked;
    uint public contractBalance;

    mapping(uint=> SubscribeService) public subService;
    mapping(uint =>mapping(address=>Subscription)) public subscriptions;
    mapping(address => uint[]) public createdSubscriptions;
    mapping(address => uint) internal balances;
    mapping(address => uint[]) public currentSubscriptions;

    error NotSubscriptionOwner();

    modifier onlySubscriptionOwner(uint subId){
        if(subService[subId].owner != msg.sender){
            revert NotSubscriptionOwner();
        }
        _;
    }

    modifier noReentrancy() {
    require(!_locked, "Stop making re-entracy calls. Please hold");
    _locked = true;
    _;
    _locked = false;
    }

    modifier hasSufficientBalance(uint withdrawalAmount) {
    require(balances[msg.sender] >= withdrawalAmount, "You have an insufficient balance");
    _;
    }
    constructor(address contractOwner) {
        subOwner = contractOwner;
    }

    event SubscriptionCreated(uint indexed id, string name, address indexed owner);
    event Subscribed (address indexed subscriber, uint indexed subscriptionId, uint endtime);
    event SubscriptionGifted(address indexed from , address indexed to , uint indexed subscriptionId, uint endtime); 
    event WithdrawalMade(address indexed accountAddress, uint amount);

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
            state: SubscriptionState.IsActive,
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

    function getCurrentSubscriptions() external view returns(uint[] memory){
        return currentSubscriptions[msg.sender]; 
    }

    function changeFee(uint subId, uint newFee) external onlySubscriptionOwner(subId){
        subService[subId].fee = newFee;
    }

    function pauseSubscription(uint subId) external onlySubscriptionOwner(subId){
        subService[subId].state = SubscriptionState.Paused;
    }

    function resumeSucription(uint subId) external onlySubscriptionOwner(subId){
        subService[subId].state = SubscriptionState.IsActive;
    }

    function hasActiveSubscription(uint subId, address user) external view returns(bool){
        Subscription storage subscriber = subscriptions[subId][user];
        return (subscriber.exists && subscriber.endtime > block.timestamp);
    }



    function subscribe(uint subscriptionId) external payable noReentrancy{
        SubscribeService storage service = subService[subscriptionId];
        require(service.state == SubscriptionState.IsActive, "Subscription is paused.");
        require(msg.value>= service.fee, "Insuffient payment.");

        Subscription storage customerSub = subscriptions[subscriptionId][msg.sender];

        require(!customerSub.exists || block.timestamp >= customerSub.endtime, "Subscription is still active.");
        require(msg.value == service.fee, "Please send in the correct fee for this subscription.");

        uint newEndtime = block.timestamp + (service.durationInDays * 1 days);
        subscriptions[subscriptionId][msg.sender] = Subscription({
            endtime:newEndtime,
            exists: true

        });
         service.earnings += msg.value;
         balances[service.owner] += msg.value;
         contractBalance += msg.value;

        bool alreadyExists = false;
        uint[] storage subscriber = currentSubscriptions[msg.sender];

        for(uint i = 0; i < subscriber.length; i ++ ){
            if (subscriber[i] == subscriptionId){
                alreadyExists = true; 
                break;
            }
        }

        if(!alreadyExists){
            subscriber.push(subscriptionId);
        }

    emit Subscribed ( msg.sender, subscriptionId, newEndtime);

    assert(subscriptions[subscriptionId][msg.sender].endtime == newEndtime);


    }

    function giftSubscription(uint subscriptionId, address recipient)external payable noReentrancy{
        require( recipient != msg.sender, "You cannot gift yourself a subscription.");

        SubscribeService storage service = subService[subscriptionId];
        require(service.state == SubscriptionState.IsActive, "Subscription is paused.");
        require(msg.value == service.fee, "incorrect fee.");

        Subscription storage subs = subscriptions[subscriptionId][recipient];

        if( subs.exists && block.timestamp < subs.endtime){
            subs.endtime += service.durationInDays * 1 days;
        }else{
            subs.endtime = block.timestamp + (service.durationInDays * 1 days);
            subs.exists = true;
        }

        service.earnings += msg.value;
        balances[service.owner] += msg.value;
        contractBalance += msg.value;

        bool alreadyExists = false;
        uint[] storage recipientSub = currentSubscriptions[recipient];

        for (uint i = 0; i < recipientSub.length; i ++){
            if(recipientSub[i] == subscriptionId){
                alreadyExists = true;
                break;
            }
        }

    if (!alreadyExists) {
        recipientSub.push(subscriptionId);
    }

        emit SubscriptionGifted(msg.sender, recipient, subscriptionId, subs.endtime);

    }

    function withdrawEarnings(uint subId , uint amount)external noReentrancy onlySubscriptionOwner(subId) hasSufficientBalance(amount) {
    require(amount <= 1 ether, "You cannot withdraw more than 1 ETH per transaction");


    balances[msg.sender] -= amount;
    contractBalance -= amount;

    payable(msg.sender).transfer(amount);

    assert(contractBalance == address(this).balance);

    emit WithdrawalMade(msg.sender, amount);
    }

}