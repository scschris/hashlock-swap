// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MainCoinSwap {

    mapping(bytes32 => Swap) public swaps;

    struct Swap {
        address sender;
        address receiver;
        uint256 amount;
        uint256 lockTimestamp;
        bytes32 preimage;
        bytes32 hashLock; // hashLock = keccak256(abi.encodePacked(preimage))
        bool completed;
        bool refunded;
    }

    event SwapInitiated(bytes32 indexed swapId, address indexed sender, address indexed receiver, bytes32 hashLock, uint256 lockTimestamp, uint256 amount);
    event SwapRefunded(bytes32 indexed swapId, address indexed sender, address indexed receiver, bytes32 hashLock, uint256 lockTimestamp, uint256 amount);
    event SwapCompleted(bytes32 indexed swapId, address indexed sender, address indexed receiver, bytes32 hashLock, uint256 lockTimestamp, uint256 amount);



    function initiateSwap(address _receiver, uint256 _amount, uint256 _lockTimestamp, bytes32 _hashLock) external payable returns (bytes32 swapId){
        require(_receiver != address(0), "Invalid receiver address");
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value == _amount, "Ether value must match the amount");
        require(_lockTimestamp > block.timestamp, "Lock timestamp must be in the future");
        
        swapId = sha256(
            abi.encodePacked(
                msg.sender,
                _receiver,
                _amount,
                _lockTimestamp,
                _hashLock
            )
        );
        require(swaps[swapId].sender == address(0), "Swap already exists");

        swaps[swapId] = Swap({
            sender : msg.sender,
            receiver : _receiver,
            amount : _amount,
            lockTimestamp : _lockTimestamp,
            preimage : "0x0",
            hashLock : _hashLock,
            completed : false,
            refunded : false
        });

        emit SwapInitiated(
            swapId,
            msg.sender,
            _receiver,
            _hashLock,
            _lockTimestamp,
            _amount);
                    
    }

    function completeSwap(bytes32 _swapId, bytes32 _preimage) external returns (bool){
        require(swaps[_swapId].receiver != address(0), "Swap not exists");
        require(swaps[_swapId].hashLock == keccak256(abi.encodePacked(_preimage)), "Hashlock not match");
        require(swaps[_swapId].receiver == msg.sender, "Receiver not match");
        require(swaps[_swapId].completed == false, "Swap already complete");
        require(block.timestamp <= swaps[_swapId].lockTimestamp , "Current time has exceeded the lock time");
        
        swaps[_swapId].preimage = _preimage;
        swaps[_swapId].completed = true;
        
        (bool result, ) = payable(swaps[_swapId].receiver).call{value: swaps[_swapId].amount}("");
        require(result);
       
        emit SwapCompleted(
            _swapId,
            swaps[_swapId].sender,
            swaps[_swapId].receiver,
            swaps[_swapId].hashLock,
            swaps[_swapId].lockTimestamp,
            swaps[_swapId].amount
            );

        return true;
    }

    function refundSwap(bytes32 _swapId) external returns (bool){
        require(swaps[_swapId].sender != address(0), "Swap not exists");
        require(swaps[_swapId].sender == msg.sender, "Sender not match");
        require(swaps[_swapId].completed == false, "Swap already complete");
        require(swaps[_swapId].refunded == false, "Swap already refund");
        require(block.timestamp > swaps[_swapId].lockTimestamp , "Current time not exceeded the lock time");
        
        (bool result, ) = payable(swaps[_swapId].sender).call{value: swaps[_swapId].amount}("");
        require(result);

        swaps[_swapId].refunded = true;
        
        emit SwapRefunded(
            _swapId,
            swaps[_swapId].sender,
            swaps[_swapId].receiver,
            swaps[_swapId].hashLock,
            swaps[_swapId].lockTimestamp,
            swaps[_swapId].amount
            );

        return true;
    }

    function getHashLock(bytes32 _preimage) public pure returns (bytes32 hashLock){
        hashLock = keccak256(abi.encodePacked(_preimage));
    }

    function getSwap(bytes32 _swapId) public view
        returns (
            address sender,
            address receiver,
            uint256 amount,
            uint256 lockTimestamp,
            bytes32 preimage,
            bytes32 hashLock,
            bool completed,
            bool refunded
        )
    {
        Swap memory s = swaps[_swapId];
        return (
            s.sender,
            s.receiver,
            s.amount,
            s.lockTimestamp,
            s.preimage,
            s.hashLock,
            s.completed,
            s.refunded
        );
    }
}