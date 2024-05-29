import hre from "hardhat";
import { getAddress } from "viem";

// Fixture function for deploying the contract
export async function deployMigrator() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myMigration = await hre.viem.deployContract("PoXMigration", [deployerWallet.account.address]);

  return {myMigration};
}

export async function deployOldToken() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myOldToken = await hre.viem.deployContract("EulerTools");

  return {myOldToken};
}

export async function deployAffiliate() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myAffiliate = await hre.viem.deployContract("PoAffiliate", [deployerWallet.account.address, deployerWallet.account.address]);

  return {myAffiliate};
}

export async function deployMembership() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myMembership = await hre.viem.deployContract("PoMembership", [deployerWallet.account.address, deployerWallet.account.address]);

  return {myMembership};
}

export async function deployNewToken() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myNewToken = await hre.viem.deployContract("ProofOfX", [deployerWallet.account.address, deployerWallet.account.address]);

  return {myNewToken};
}

export async function deployFaucet() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myFaucet = await hre.viem.deployContract("EulerFaucet");

  return {myFaucet};
}

export async function deployVCardXFixture() {
  const [owner, minter, otherAccount, taxCollector] = await hre.viem.getWalletClients();

  const taxAmount = 10; // Example tax rate of 10%

  const vCardX = await hre.viem.deployContract("VCardX", [
      getAddress(owner.account.address),
      getAddress(minter.account.address),
      getAddress(owner.account.address)
    ]
  );

  return {
    vCardX,
    owner,
    minter,
    otherAccount,
    taxCollector,
    taxAmount,
  };
}

export async function deployVCardXCenterFixture() {
  const [owner] = await hre.viem.getWalletClients();
  const vCardCenterV1 = await hre.viem.deployContract("VCardCenterV1", [
    getAddress(owner.account.address)
  ]);

  return {
    vCardCenterV1,
    owner
  };
}
