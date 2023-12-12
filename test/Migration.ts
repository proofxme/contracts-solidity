import hre from "hardhat";
import { assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

// Fixture function for deploying the contract
async function deployFixture() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myMigration = await hre.viem.deployContract("PoXMigration", [deployerWallet.account.address]);

  return { myMigration };
}

async function deployTokenFixture() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myToken = await hre.viem.deployContract("EulerTools");

  return { myToken };
}

describe("PoXMigration deploy", function () {
  it("should deploy the contract with the proper owner", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployFixture);

    const [deployerWallet] = await hre.viem.getWalletClients();

    // validate the owner
    const owner = await myMigration.read.owner();
    assert.equal(owner.toLowerCase(), deployerWallet.account.address.toLowerCase());
  });
  it("should not be started", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployFixture);

    //check that the migration is not started
    const started = await myMigration.read.isMigrationActive();
    assert.isFalse(started);
  });

  it("should be able to start", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployFixture);
    const [deployerWallet, depositerWallet] = await hre.viem.getWalletClients();

    // the owner should be able to start the migration
    await myMigration.write.startMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);
  })

  it("shouldn't be able to start if not owner", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployFixture);
    const [deployerWallet, depositerWallet] = await hre.viem.getWalletClients();

    // import the contract with the depositerWallet
    const myMigrationDepositer = await hre.viem.getContractAt("PoXMigration", myMigration.address, { walletClient: depositerWallet});

    // Attempt to start the migration in the myMigrationDepositers contract, and capture the rpc error that is thrown to validate Ownable
    let error: any;
    try {
      await myMigrationDepositer.write.startMigration();
    } catch (err) {
      // assert that the error is OwnableUnauthorizedAccount with the proper address
      error = err;
    }
    assert.isTrue(error.message.includes("OwnableUnauthorizedAccount"));
  })
});

describe("PoXMigration process", function () {
  it("should be able to deposit if the value is 4000 tokens", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployFixture);
    const { myToken } = await loadFixture(deployTokenFixture)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myToken as the Euler Token in the migration contract
    await myMigration.write.setEulerToken([myToken.address]);

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(4000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    await myMigration.write.deposit([amount]);

    // check the token balance of the migration contract
    const balance = await myToken.read.balanceOf([myMigration.address]);

    assert.equal(balance, amount);

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.amount, amount);
  })
  it("should not be able to deposit if the value is less than 4000 tokens", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployFixture);
    const { myToken } = await loadFixture(deployTokenFixture)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myToken as the Euler Token in the migration contract
    await myMigration.write.setEulerToken([myToken.address]);

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(1000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    try {
      await myMigration.write.deposit([amount]);
    } catch (err: any) {
      assert.isTrue(err.message.includes("The minimum deposit amount is 4000 tokens!"));
    }
  })
  it("should be able to redeposit to get more benefits", async function () {
    // Load the contract instance using the fixture function
    const { myMigration } = await loadFixture(deployFixture);
    const { myToken } = await loadFixture(deployTokenFixture)
    const [deployerWallet] = await hre.viem.getWalletClients();

    // set the myToken as the Euler Token in the migration contract
    await myMigration.write.setEulerToken([myToken.address]);

    // create a bigint for 4000 tokens with 18 decimals
    const amount = BigInt(4000) * BigInt(10 ** 18);

    // the owner should be able to start the migration
    await myMigration.write.startMigration();

    // check that the migration is started
    const started = await myMigration.read.isMigrationActive();
    assert.isTrue(started);

    // exclude the migration contract from the transfer fee
    await myToken.write.excludeAccount([myMigration.address]);

    // approve the migration to spend the tokens
    await myToken.write.approve([myMigration.address, amount]);

    // deposit the tokens in the migration contract
    await myMigration.write.deposit([amount]);

    // deposit 1000 more tokens
    const amount2 = BigInt(1000) * BigInt(10 ** 18);
    await myToken.write.approve([myMigration.address, amount2]);
    await myMigration.write.deposit([amount2]);

    // check the token balance of the migration contract
    const balance = await myToken.read.balanceOf([myMigration.address]);

    assert.equal(balance, amount + amount2);

    // check the balance of the user in the migration contract
    const userBalance = await myMigration.read.getUserInfo([deployerWallet.account.address]);
    assert.equal(userBalance.amount, amount + amount2);
  })
});