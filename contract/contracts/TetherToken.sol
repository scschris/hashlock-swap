// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TetherToken is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 amount_) ERC20(name_, symbol_) {
        _mint(msg.sender, amount_);
    }
}
