import hre from "hardhat";
const path = require('path');
const fs = require('fs');

async function main() {
  // read the file config.json in this same directory and recover the status of the deployments
  const deploymentStatus = require("./deployment-status.json");

  // check that myToken value is null, if it is not null, it means that the contract has already been deployed
  // and we do not want to deploy it again
  if (!deploymentStatus['EulerToken']) {
    console.log("EulerToken is not deployed please deploy it first");
    return;
  }

  if (!deploymentStatus['PoxmeToken']) {
    console.log("PoxmeToken is not deployed please deploy it first");
    return;
  }

  if (!deploymentStatus['PoMembership']) {
    console.log("PoMembership is not deployed please deploy it first");
    return;
  }

  if (!deploymentStatus['PoAffiliate']) {
    console.log("PoAffiliate is not deployed please deploy it first");
    return;
  }

  if (!deploymentStatus['PoXMigration']) {
    console.log("PoXMigration is not deployed please deploy it first");
    return;
  }

  const myMigration = await hre.viem.getContractAt("PoXMigration", deploymentStatus['PoXMigration']);

  console.log('Migration Address Found', myMigration.address)
  console.log('Initializing migration')

  await myMigration.write.initialize(
    [
      deploymentStatus['EulerToken'],
      deploymentStatus['PoxmeToken'],
      deploymentStatus['PoMembership'],
      deploymentStatus['PoAffiliate']
    ]
  );

  console.log("Updating allowances")

  // approve the myMigration to use the eulerToken
  const myToken = await hre.viem.getContractAt("EulerTools", deploymentStatus['EulerToken']);
  await myToken.write.approve([myMigration.address, BigInt(1_000_000_000 * 10 **18)]);
  await myToken.write.increaseAllowance([myMigration.address, BigInt(1_000_000_000* 10 **18)]);

  console.log("Approve token address")

  // approve the myMigration to use the poxmeToken
  const myPoxmeToken = await hre.viem.getContractAt("ProofOfX", deploymentStatus['PoxmeToken']);
  await myPoxmeToken.write.approve([myMigration.address, BigInt(1_000_000_000 * 10 **18)]);

  console.log("Approve migration as minter")
  //get the new token contract
  const myNewToken = await hre.viem.getContractAt("ProofOfX", deploymentStatus['PoxmeToken']);
  // allow the migration to mint new tokens
  await myNewToken.write.grantRole([await myNewToken.read.MINTER_ROLE(), myMigration.address]);

  console.log("Exclude migration from burn")
  // exclude the migration from the old token burn
  // get the old token contract
  const myOldToken = await hre.viem.getContractAt("EulerTools", deploymentStatus['EulerToken']);
  // exclude the faucet from the old token
  await myOldToken.write.excludeAccount([myMigration.address]);

  console.log("Starting migration")

  await myMigration.write.startMigration();
  await myMigration.write.startTokenMigration();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
