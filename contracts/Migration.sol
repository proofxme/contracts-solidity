//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract PoXMigration is Ownable {
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint256 amount;
    }

    struct GetUserInfo {
        uint256 amount;
    }

    IERC20 public euler;
    uint256 public eulerTxFee = 100;
    uint256 public minDepositAmount = 4000 * 10**18;
    bool public isMigrationActive = false;

    mapping(address => UserInfo) public userInfo;

    event Deposit(address indexed user, uint256 amount);
    event StartMigration(address indexed user, uint256 startBlock);
    event SetEulerToken(address indexed user,address token);

    constructor(address _owner) Ownable(_owner) {}

    function setEulerToken(IERC20 _euler) external onlyOwner {
        require(address(_euler) != address(0), "Token address is not valid");
        require(address(euler) == address(0), "Token already set!");
        euler = _euler;
        emit SetEulerToken(msg.sender, address(_euler));
    }

    function startMigration() external onlyOwner {
        isMigrationActive = true;
        // use current block
        uint256 startBlock = block.number;
        emit StartMigration(msg.sender, startBlock);
    }

    function stopMigration() external onlyOwner {
        isMigrationActive = false;
        uint256 startBlock = block.number;
        emit StartMigration(msg.sender, startBlock);
    }

    function getUserInfo(address _user)
        public
        view
        returns (GetUserInfo memory) {
                UserInfo storage user = userInfo[_user];
                GetUserInfo memory userAux;
                userAux.amount = user.amount;
                return userAux;
    }

    function deposit(uint256 amount) external {
        UserInfo storage user = userInfo[msg.sender];
        uint256 sumAmount = amount + user.amount;

        require(
            sumAmount >= minDepositAmount,
            "The minimum deposit amount is 4000 tokens!"
        );

        if (amount > 0) {
            euler.transferFrom(address(msg.sender), address(this), amount);
            user.amount = user.amount + amount;
        }

        emit Deposit(msg.sender, amount);
    }

    function safeEulerTransfer(
        address to,
        uint256 amount
    ) internal returns (uint256) {
        uint256 _bal = euler.balanceOf(address(this));
        if (amount > _bal) amount = _bal;
        euler.safeTransfer(to, amount);
        return amount;
    }
}