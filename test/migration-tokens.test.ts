import hre from "hardhat";
import { assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { deployAffiliate, deployMembership, deployMigrator, deployNewToken, deployOldToken } from "./fixtures";
import { advanceBlocks } from "./helpers";

describe("PoXMigration Token Program", function () {
  it("should be able to deposit if the value is 4000 tokens", async function () {
    // Load the contract instance using the fixture function
    const {myMigration} = await loadFixture(deployMigrator);
    const {myOldToken} = await loadFixture(deployOldToken)
    const {myNewToken} = await loadFixture(deployNewToken)
    const {myMembership} = await loadFixture(deployMembership)
    const {myAffiliate} = await loadFixture(deployAffiliate)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myOldToken as the Euler Token in the migration contract
    await myMigration.write.initialize([myOldToken.address, myNewToken.address, myMembership.address, myAffiliate.address]);

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(4000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();

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
  })
  it("should not be able to deposit if the value is less than 4000 tokens", async function () {
    // Load the contract instance using the fixture function
    const {myMigration} = await loadFixture(deployMigrator);
    const {myOldToken} = await loadFixture(deployOldToken)
    const {myNewToken} = await loadFixture(deployNewToken)
    const {myMembership} = await loadFixture(deployMembership)
    const {myAffiliate} = await loadFixture(deployAffiliate)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myOldToken as the Euler Token in the migration contract
    await myMigration.write.initialize([myOldToken.address, myNewToken.address, myMembership.address, myAffiliate.address]);

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(1000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myOldToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myOldToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    try {
      await myMigration.write.deposit([amount]);
    } catch (err: any) {
      assert.isTrue(err.message.includes("The minimum deposit amount is 4000 tokens!"));
    }
  })
  it("should be able to redeposit to get additional rewards", async function () {
    // Load the contract instance using the fixture function
    const {myMigration} = await loadFixture(deployMigrator);
    const {myOldToken} = await loadFixture(deployOldToken)
    const {myNewToken} = await loadFixture(deployNewToken)
    const {myMembership} = await loadFixture(deployMembership)
    const {myAffiliate} = await loadFixture(deployAffiliate)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myOldToken as the Euler Token in the migration contract
    await myMigration.write.initialize([myOldToken.address, myNewToken.address, myMembership.address, myAffiliate.address]);

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(4000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myOldToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myOldToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    await myMigration.write.deposit([amount]);

    // deposit 1000 more tokens
    const amount2 = BigInt(1000) * BigInt(10 ** 18);
    await myOldToken.write.approve([myMigration.address, amount2]);
    await myMigration.write.deposit([amount2]);

    // check the token balance of the migration contract
    const balance = await myOldToken.read.balanceOf([myMigration.address]);

    assert.equal(balance, amount + amount2);

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.deposited, amount + amount2);
  })
  it("should be able to receive the new token when claimed", async function () {
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

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(4000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();

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

    await advanceBlocks(100);

    // claim the new tokens for the user
    await myMigration.write.claimTokens();

    // get the balance of the new token
    const newTokenBalance = await myNewToken.read.balanceOf([deployerWallet.account.address]);
    assert.equal(newTokenBalance, amount);
  })
  it("should not apply the Migration Tax Penalty entirely if the user deposited before the penalty", async function () {
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

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(40000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myOldToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myOldToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    await myMigration.write.deposit([amount]);

    // mine 5184000 blocks
    await advanceBlocks(5184000);

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.deposited, amount, "The balance of the user in the migration contract doesn't match");

    // claim the new tokens for the user
    await myMigration.write.claimTokens();

    // get the balance of the new token
    const newTokenBalance = await myNewToken.read.balanceOf([deployerWallet.account.address]);
    assert.equal(newTokenBalance, amount, "The Balance of the new token doesn't match");
  })
  it("should apply the Migration Tax Penalty partially if the user already migrated some tokens", async function () {
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

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(40000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();
    await myMigration.write.startTokenMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myOldToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myOldToken.write.approve([myMigration.address, amount]);

    // deposit half
    await myMigration.write.deposit([amount / BigInt(2)]);

    // check that the migration tax isn't applied
    const userBalance1 = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance1.deposited, amount / BigInt(2), "The user should have deposited half of the tokens");

    // deposit the rest of the tokens
    await myMigration.write.deposit([amount / BigInt(2)]);

    // mine blocks
    await advanceBlocks(100);

    // check that the migration tax is not applied
    const userBalance2 = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance2.deposited, amount, "The user should have deposited the full amount of tokens");

    // claim the new tokens for the user
    await myMigration.write.claimTokens();

    // get the balance of the new token
    const newTokenBalance = await myNewToken.read.balanceOf([deployerWallet.account.address]);
    assert.equal(newTokenBalance, amount, "The user should receive the full amount of new tokens");
  })
});
