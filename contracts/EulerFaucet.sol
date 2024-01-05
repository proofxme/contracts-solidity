// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EulerFaucet {
    IERC20 public token;
    mapping(address => uint) public lastClaimedBlock;
    uint public constant blocksBetweenClaims = 100;
    uint public constant tokensPerClaim = 41000 * 10 ** 18;
    address owner;

    constructor() {
      owner = msg.sender;
    }

    function initialize(IERC20 _token) public {
        require(owner == msg.sender, "Only owner can initialize");
        require(_token.balanceOf(address(this)) == 0, "Already initialized");
        token = _token;
    }

    function claimTokens() external returns (bool) {
        require(block.number >= lastClaimedBlock[msg.sender] + blocksBetweenClaims, "Wait for more blocks to pass before claiming again");
        //require(token.balanceOf(address(this)) >= tokensPerClaim, "Not enough tokens left to claim");

        lastClaimedBlock[msg.sender] = block.number;
        // Transfer tokens safely
        bool sent = token.transfer(msg.sender, tokensPerClaim);
        require(sent, "Token transfer failed");
        return sent;
    }
}