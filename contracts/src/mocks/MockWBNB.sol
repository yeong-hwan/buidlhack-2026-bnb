// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MockERC20} from "./MockERC20.sol";

/// @notice Demo-only wrapped native token for the local debug UI.
contract MockWBNB is MockERC20 {
    error EthTransferFailed();

    constructor(address owner_) MockERC20("Wrapped BNB", "WBNB", 18, owner_, 0, false) {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert EthTransferFailed();
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}
