import hre from "hardhat";
import { assert, expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { deployAffiliate, deployMembership, deployMigrator, deployNewToken, deployOldToken } from "./fixtures";

describe("PoXMigration deploy", function () {
  it("should deploy the contract with the proper owner", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployMigrator);

    const [deployerWallet] = await hre.viem.getWalletClients();

    // validate the owner
    const owner = await myMigration.read.owner();
    assert.equal(owner.toLowerCase(), deployerWallet.account.address.toLowerCase());
  });
  it("should be initialized with the proper values", async function () {
    //load the fixtures for the token, the membership and the affiliates
    const { myMigration } = await loadFixture(deployMigrator);
  })
  it("should not be started", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployMigrator);

    //check that the migration is not started
    const started = await myMigration.read.isMigrationActive();
    assert.isFalse(started);
  });

  it("should be able to start", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployMigrator);
    const [deployerWallet, depositerWallet] = await hre.viem.getWalletClients();

    // the owner should be able to start the migration
    await myMigration.write.startMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);
  })

  it("shouldn't be able to start if not owner", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployMigrator);
    const [deployerWallet, depositerWallet] = await hre.viem.getWalletClients();

    // import the contract with the depositerWallet
    const myMigrationDepositer = await hre.viem.getContractAt("PoXMigration", myMigration.address, { walletClient: depositerWallet });

    // Attempt to start the migration in the myMigrationDepositers contract, and capture the rpc error that is thrown to validate Ownable
    let error: any;
    // check that the transaction fails with the OwnableUnauthorizedAccount error
    await expect(myMigrationDepositer.write.startMigration()).to.be.rejectedWith(
      'OwnableUnauthorizedAccount'
    );
  })
  it("should allow the owner to send eulers to the staking contract", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployMigrator);
    const { myOldToken } = await loadFixture(deployOldToken)
    const { myNewToken } = await loadFixture(deployNewToken)
    const { myMembership } = await loadFixture(deployMembership)
    const { myAffiliate } = await loadFixture(deployAffiliate)
    const [deployerWallet, stakingAddress] = await hre.viem.getWalletClients();

    // set the myOldToken as the Euler Token in the migration contract
    await myMigration.write.initialize([myOldToken.address, myNewToken.address, myMembership.address, myAffiliate.address]);

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(4000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();

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
    assert.equal(balance, amount, "Balance is not correct");

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.deposited, amount, "Old Token balance is not correct");

    // approve the migration contract to transfer the tokens
    await myOldToken.write.approve([myMigration.address, amount]);

    // increase the allowance of the migration contract to transfer old tokens
    await myOldToken.write.increaseAllowance([myMigration.address, amount]);

    //check the allowance of the migration contract
    const allowance = await myOldToken.read.allowance([deployerWallet.account.address, myMigration.address]);
    assert.equal(allowance, amount * BigInt(2), "Allowance is not correct");

    // check the token balance in the migration contract
    const migrationBalance = await myOldToken.read.balanceOf([myMigration.address]);
    assert.equal(migrationBalance, amount, "Migration balance is not correct");

    // transfer eulers to the staking contract
    await myMigration.write.transferToStaking([stakingAddress.account.address, amount]);

    // check the balance of the stakingAddress
    const stakingBalance = await myOldToken.read.balanceOf([stakingAddress.account.address]);
    assert.equal(stakingBalance, amount, "Staking address balance is not correct");
  })
});
