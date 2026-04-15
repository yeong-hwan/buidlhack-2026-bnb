// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal local ERC20 used only for demo/devnet testing.
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public immutable owner;
    bool public immutable publicMintEnabled;

    error InvalidAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier onlyOwner() {
        if (msg.sender != owner) revert InvalidAddress();
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address owner_,
        uint256 initialOwnerMint,
        bool publicMintEnabled_
    ) {
        if (owner_ == address(0)) revert InvalidAddress();

        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        owner = owner_;
        publicMintEnabled = publicMintEnabled_;

        if (initialOwnerMint > 0) {
            _mint(owner_, initialOwnerMint);
        }
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert InvalidAddress();

        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed < amount) revert InsufficientAllowance();
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        if (!publicMintEnabled && msg.sender != owner) revert InvalidAddress();
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        if (to == address(0)) revert InvalidAddress();
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        if (from == address(0)) revert InvalidAddress();
        if (balanceOf[from] < amount) revert InsufficientBalance();

        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function _spendAllowance(address owner_, address spender, uint256 amount) private {
        if (owner_ != spender) {
            uint256 allowed = allowance[owner_][spender];
            if (allowed < amount) revert InsufficientAllowance();
            allowance[owner_][spender] = allowed - amount;
            emit Approval(owner_, spender, allowance[owner_][spender]);
        }
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (from == address(0) || to == address(0)) revert InvalidAddress();
        if (balanceOf[from] < amount) revert InsufficientBalance();

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
