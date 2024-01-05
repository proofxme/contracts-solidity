import hre from "hardhat";
import { assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { deployAffiliate, deployMembership, deployMigrator, deployNewToken, deployOldToken } from "./fixtures";

describe("PoXMigration Membership Program", function () {
  it("should be able to receive the memberships when claimed", async function () {
    // Load the contract instance using the fixture function
    const {myMigration} = await loadFixture(deployMigrator);
    const {myOldToken} = await loadFixture(deployOldToken)
    const {myNewToken} = await loadFixture(deployNewToken)
    const {myMembership} = await loadFixture(deployMembership)
    const {myAffiliate} = await loadFixture(deployAffiliate)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myOldToken as the Euler Token in the migration contract
    await myMigration.write.initialize([myOldToken.address, myNewToken.address, myMembership.address, myAffiliate.address]);

    // authorize the myMigration contract to mint and transfer from the new token
    await myNewToken.write.grantRole([await myNewToken.read.MINTER_ROLE(), myMigration.address]);
    await myMembership.write.grantRole([await myMembership.read.DEFAULT_ADMIN_ROLE(), myMigration.address]);
    await myMembership.write.grantRole([await myMembership.read.MINTER_ROLE(), myMigration.address]);

    // calculate 8 memberships to be claimed each one costing 4000
    const membershipsToClaim = 8;
    const membershipsCost = 4000

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(membershipsToClaim * membershipsCost) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();
    await myMigration.write.startMembershipMigration();
    await myMembership.write.mint([deployerWallet.account.address, BigInt(0), BigInt(25000), "0x00"]);
    await myMembership.write.safeTransferFrom([deployerWallet.account.address, myMigration.address, BigInt(0), BigInt(25000), "0x00"]);

    // check the balance of memberships for the mymigration contract
    const balanceOF = await myMembership.read.balanceOf([myMigration.address, BigInt(0)]);

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myOldToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myOldToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    await myMigration.write.deposit([amount]);

    // check the token balance of the migration contract
    const balance = await myOldToken.read.balanceOf([myMigration.address]);

    assert.equal(balance, amount);

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.deposited, amount);

    // approve the migration to spend the memberships
    await myMembership.write.setApprovalForAll([myMigration.address, true]);
    await myMembership.write.setApprovalForAll([deployerWallet.account.address, true]);

    // mine 256 blocks
    await hre.network.provider.send("hardhat_mine", ["0x100"]);

    // claim the new tokens for the user
    await myMigration.write.claimMemberships();

    // Check the balance of the memberships for the user
    const membershipBalance = await myMembership.read.balanceOf([deployerWallet.account.address, BigInt(0)]);
    assert.equal(membershipBalance, BigInt(membershipsToClaim));
  })
  it("should be able to receive more memberships if tokens are added", async function () {
    // Load the contract instance using the fixture function
    const {myMigration} = await loadFixture(deployMigrator);
    const {myOldToken} = await loadFixture(deployOldToken)
    const {myNewToken} = await loadFixture(deployNewToken)
    const {myMembership} = await loadFixture(deployMembership)
    const {myAffiliate} = await loadFixture(deployAffiliate)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myOldToken as the Euler Token in the migration contract
    await myMigration.write.initialize([myOldToken.address, myNewToken.address, myMembership.address, myAffiliate.address]);

    // authorize the myMigration contract to mint and transfer from the new token
    await myNewToken.write.grantRole([await myNewToken.read.MINTER_ROLE(), myMigration.address]);
    await myMembership.write.grantRole([await myMembership.read.DEFAULT_ADMIN_ROLE(), myMigration.address]);
    await myMembership.write.grantRole([await myMembership.read.MINTER_ROLE(), myMigration.address]);

    // calculate 8 memberships to be claimed each one costing 4000
    const membershipsToClaim = 8;
    const membershipsCost = 4000

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(membershipsToClaim * membershipsCost) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();
    await myMigration.write.startMembershipMigration();
    await myMembership.write.mint([deployerWallet.account.address, BigInt(0), BigInt(25000), "0x00"]);
    await myMembership.write.safeTransferFrom([deployerWallet.account.address, myMigration.address, BigInt(0), BigInt(25000), "0x00"]);

    // check the balance of memberships for the mymigration contract
    const balanceOF = await myMembership.read.balanceOf([myMigration.address, BigInt(0)]);

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myOldToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myOldToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    await myMigration.write.deposit([amount]);

    // check the token balance of the migration contract
    const balance = await myOldToken.read.balanceOf([myMigration.address]);

    assert.equal(balance, amount);

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.deposited, amount);

    // approve the migration to spend the memberships
    await myMembership.write.setApprovalForAll([myMigration.address, true]);
    await myMembership.write.setApprovalForAll([deployerWallet.account.address, true]);

    // mine 256 blocks
    await hre.network.provider.send("hardhat_mine", ["0x100"]);

    // claim the new tokens for the user
    await myMigration.write.claimMemberships();

    // Check the balance of the memberships for the user
    const membershipBalance = await myMembership.read.balanceOf([deployerWallet.account.address, BigInt(0)]);
    assert.equal(membershipBalance, BigInt(membershipsToClaim));

    // deposit 7000 tokens
    const amount2 = BigInt(7000) * BigInt(10 ** 18);
    await myOldToken.write.approve([myMigration.address, amount2]);
    await myMigration.write.deposit([amount2]);

    await hre.network.provider.send("hardhat_mine", ["0x100"]);

    // claim additional memberships
    await myMigration.write.claimMemberships();

    // check that the user got a new membership
    const membershipBalance2 = await myMembership.read.balanceOf([deployerWallet.account.address, BigInt(0)]);
    assert.equal(membershipBalance2, BigInt(membershipsToClaim + 1));

    // deposit 1000 more tokens to get an additional one
    const amount3 = BigInt(1000) * BigInt(10 ** 18);
    await myOldToken.write.approve([myMigration.address, amount3]);
    await myMigration.write.deposit([amount3]);
    await hre.network.provider.send("hardhat_mine", ["0x100"]);

    // claim the additional membership
    await myMigration.write.claimMemberships();

    // check that the user got a new membership
    const membershipBalance3 = await myMembership.read.balanceOf([deployerWallet.account.address, BigInt(0)]);
    assert.equal(membershipBalance3, BigInt(membershipsToClaim + 2));
  })
  it("should be able to receive more memberships if tokens are added", async function () {
    // Load the contract instance using the fixture function
    const {myMigration} = await loadFixture(deployMigrator);
    const {myOldToken} = await loadFixture(deployOldToken)
    const {myNewToken} = await loadFixture(deployNewToken)
    const {myMembership} = await loadFixture(deployMembership)
    const {myAffiliate} = await loadFixture(deployAffiliate)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myOldToken as the Euler Token in the migration contract
    await myMigration.write.initialize([myOldToken.address, myNewToken.address, myMembership.address, myAffiliate.address]);

    // authorize the myMigration contract to mint and transfer from the new token
    await myNewToken.write.grantRole([await myNewToken.read.MINTER_ROLE(), myMigration.address]);
    await myMembership.write.grantRole([await myMembership.read.DEFAULT_ADMIN_ROLE(), myMigration.address]);
    await myMembership.write.grantRole([await myMembership.read.MINTER_ROLE(), myMigration.address]);

    // calculate 8 memberships to be claimed each one costing 4000
    const membershipsToClaim = 8;
    const membershipsCost = 4000

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(membershipsToClaim * membershipsCost) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();
    await myMigration.write.startMembershipMigration();
    await myMembership.write.mint([deployerWallet.account.address, BigInt(0), BigInt(25000), "0x00"]);
    await myMembership.write.safeTransferFrom([deployerWallet.account.address, myMigration.address, BigInt(0), BigInt(25000), "0x00"]);

    // check the balance of memberships for the mymigration contract
    const balanceOF = await myMembership.read.balanceOf([myMigration.address, BigInt(0)]);

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myOldToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myOldToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    await myMigration.write.deposit([amount]);

    // check the token balance of the migration contract
    const balance = await myOldToken.read.balanceOf([myMigration.address]);

    assert.equal(balance, amount);

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.deposited, amount);

    // approve the migration to spend the memberships
    await myMembership.write.setApprovalForAll([myMigration.address, true]);
    await myMembership.write.setApprovalForAll([deployerWallet.account.address, true]);

    // mine 256 blocks
    await hre.network.provider.send("hardhat_mine", ["0x100"]);

    // claim the new tokens for the user
    await myMigration.write.claimMemberships();

    // Check the balance of the memberships for the user
    const membershipBalance = await myMembership.read.balanceOf([deployerWallet.account.address, BigInt(0)]);
    assert.equal(membershipBalance, BigInt(membershipsToClaim));

    // Validate the token uri format
    const tokenURI = await myMembership.read.uri([BigInt(0)]);
    assert.equal(tokenURI, "https://api.pox.me/memberships/{id}.json");
  })
});
