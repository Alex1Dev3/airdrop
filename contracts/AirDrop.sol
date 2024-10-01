// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract AirDrop {
    bytes32 private immutable USERS_ROOT;
    address private immutable TOKEN;
    uint256 private immutable CLAIM_AMOUNT;

    mapping(address => bool) private hasClaimed;

    error AlreadyClaimed();
    error NotEnoughBalance();
    error InvalidUser();

    event Claimed(address user);

    constructor(
        address token,
        uint256 claim_amount,
        bytes32 users_root
    )
    {
        TOKEN = token;
        CLAIM_AMOUNT = claim_amount;
        USERS_ROOT = users_root;
    }

    /**
     * @notice Claims tokens from airdrop if user is eligible
     * @param proof - Merkle tree proof to verify caller's eligibility
     */
    function claim(bytes32[] memory proof)
    external
    {
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();
        if (IERC20(TOKEN).balanceOf(address(this)) < CLAIM_AMOUNT) revert NotEnoughBalance();
        if (!MerkleProof.verify(proof, USERS_ROOT, keccak256(bytes.concat(keccak256(abi.encode(msg.sender)))))) revert InvalidUser();

        hasClaimed[msg.sender] = true;

        IERC20(TOKEN).transfer(msg.sender, CLAIM_AMOUNT);
        emit Claimed(msg.sender);
    }
}