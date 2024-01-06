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
  console.log('Initializing Membership Migration')

  //get the membership contract
  const myMembership = await hre.viem.getContractAt("PoMembership", deploymentStatus['PoMembership']);

  console.log('Minting Memberships')
  // transfer the memberships to the migration contract
  //await myMembership.write.mint(["0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B", BigInt(0), BigInt(25000), "0x00"]);
  console.log('Transfering Memberships')
  //await myMembership.write.safeTransferFrom(["0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B", myMigration.address, BigInt(0), BigInt(25000), "0x00"]);

  console.log('Approving Memberships')
  await myMembership.write.setApprovalForAll([myMigration.address, true]);

  console.log('Start membership Migration')
  await myMigration.write.startMembershipMigration();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
