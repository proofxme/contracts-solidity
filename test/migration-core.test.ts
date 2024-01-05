import hre from "hardhat";
import { assert, expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { deployAffiliate, deployMembership, deployMigrator, deployNewToken, deployOldToken, deployFaucet } from "./fixtures";

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
    await myOldToken.write.approve([myMigration.address, amount * BigInt(100)]);

    // deposit the tokens in the migration contract
    await myMigration.write.deposit([amount]);

    // check the token balance of the migration contract
    const balance = await myOldToken.read.balanceOf([myMigration.address]);
    assert.equal(balance, amount, "Balance is not correct");

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.deposited, amount, "Old Token balance is not correct");

    // check the token balance in the migration contract
    const migrationBalance = await myOldToken.read.balanceOf([myMigration.address]);
    assert.equal(migrationBalance, amount, "Migration balance is not correct");

    // transfer eulers to the staking contract
    await myMigration.write.transferToStaking([stakingAddress.account.address, amount]);

    // check the balance of the stakingAddress
    const stakingBalance = await myOldToken.read.balanceOf([stakingAddress.account.address]);
    assert.equal(stakingBalance, amount, "Staking address balance is not correct");
  })
  it("should deploy the faucet contract", async function () {
    // Load the contract instance using the fixture function
    const { myFaucet } = await loadFixture(deployFaucet);
    const { myOldToken } = await loadFixture(deployOldToken)

    //initialize the faucet
    await myFaucet.write.initialize([myOldToken.address]);

    // get the deployer wallet
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the amount of minted tokens
    const amount = BigInt(100_000_000) * BigInt(10 ** 18);

    // check the balance of tokens of the deployer wallet
    const balance = await myOldToken.read.balanceOf([deployerWallet.account.address]);
    assert.equal(balance, amount, "Wallet Balance is not correct after initialize");

    // approve the faucet to spend the tokens
    await myOldToken.write.approve([myFaucet.address, amount]);

    // increase the allowance of the faucet to transfer old tokens
    await myOldToken.write.increaseAllowance([myFaucet.address, amount]);

    // exclude the faucet from the transfer fee
    await myOldToken.write.excludeAccount([myFaucet.address]);

    //transfer 10_000_000 tokens to the faucet
    const amountToTransfer = BigInt(10_000_000) * BigInt(10 ** 18);
    await myOldToken.write.transfer([myFaucet.address, amountToTransfer]);

    // check the wallet balance after the transfer
    const balanceAfterTransfer = await myOldToken.read.balanceOf([deployerWallet.account.address]);
    assert.equal(balanceAfterTransfer, amount - amountToTransfer, "Wallet Balance is not correct after transfer");

    // check the balance of the faucet
    const faucetBalance = await myOldToken.read.balanceOf([myFaucet.address]);
    assert.equal(faucetBalance, amountToTransfer, "Faucet balance is not correct");

    // claim 40k tokens from the faucet
    await myFaucet.write.claimTokens();

    // check the balance of the deployer wallet
    const balanceAfterClaim = await myOldToken.read.balanceOf([deployerWallet.account.address]);
    assert.equal(balanceAfterClaim, amount - amountToTransfer + BigInt(40_000) * BigInt(10 ** 18), "Wallet Balance Balance is not correct after claim");

    // check the balance of the faucet
    const faucetBalanceAfterClaim = await myOldToken.read.balanceOf([myFaucet.address]);
    assert.equal(faucetBalanceAfterClaim, amountToTransfer - BigInt(40_000) * BigInt(10 ** 18), "Faucet balance is not correct after claim");
  })
});
