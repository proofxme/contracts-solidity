import hre from "hardhat";
import { assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

// Fixture function for deploying the contract
async function deployFixture() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myMigration = await hre.viem.deployContract("PoXMigration", [deployerWallet.account.address]);

  return { myMigration };
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