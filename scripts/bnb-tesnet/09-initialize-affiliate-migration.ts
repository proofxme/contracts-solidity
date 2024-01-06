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
  console.log('Initializing Affiliate Migration')

  //get the affiliate contract
  const myAffiliate = await hre.viem.getContractAt("PoAffiliate", deploymentStatus['PoAffiliate']);

  console.log('Allow Migration to mint Affiliates')
  await myAffiliate.write.grantRole([await myAffiliate.read.MINTER_ROLE(), myMigration.address]);

  console.log('Start affiliate Migration')
  await myMigration.write.startAffiliateMigration();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
