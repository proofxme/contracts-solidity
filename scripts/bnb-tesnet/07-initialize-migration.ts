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

  const myMigration = await hre.viem.getContractAt("PoXMigration", deploymentStatus['EulerFaucet']);

  console.log('Migration Address Found', myMigration.address)
  console.log('Initializing Faucet')

  await myMigration.write.initialize(
    [
      deploymentStatus['EulerToken'],
      deploymentStatus['PoxmeToken'],
      deploymentStatus['PoMembership'],
      deploymentStatus['PoAffiliate']
    ]
  );

  // approve the myMigration to use the eulerToken
  const myToken = await hre.viem.getContractAt("EulerTools", deploymentStatus['EulerToken']);
  await myToken.write.approve([myMigration.address, BigInt(1_000_000_000 * 10 **18)]);
  await myToken.write.increaseAllowance([myMigration.address, BigInt(1_000_000_000* 10 **18)]);

  // approve the myMigration to use the poxmeToken
  const myPoxmeToken = await hre.viem.getContractAt("PoxmeToken", deploymentStatus['PoxmeToken']);
  await myPoxmeToken.write.approve([myMigration.address, BigInt(1_000_000_000 * 10 **18)]);
  await myPoxmeToken.write.increaseAllowance([myMigration.address, BigInt(1_000_000_000* 10 **18)]);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
