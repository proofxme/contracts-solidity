import hre from "hardhat";

// Fixture function for deploying the contract
export async function deployMigrator() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myMigration = await hre.viem.deployContract("PoXMigration", [deployerWallet.account.address]);

  return { myMigration };
}

export async function deployOldToken() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myOldToken = await hre.viem.deployContract("EulerTools");

  return { myOldToken };
}

export async function deployAffiliate() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myAffiliate = await hre.viem.deployContract("PoAffiliate", [deployerWallet.account.address, deployerWallet.account.address]);

  return { myAffiliate };
}

export async function deployMembership() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myMembership = await hre.viem.deployContract("PoMembership", [deployerWallet.account.address, deployerWallet.account.address]);

  return { myMembership };
}

export async function deployNewToken() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myNewToken = await hre.viem.deployContract("ProofOfX", [deployerWallet.account.address, deployerWallet.account.address]);

  return { myNewToken };
}

export async function deployFaucet() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myFaucet = await hre.viem.deployContract("EulerFaucet");

  return { myFaucet };
}