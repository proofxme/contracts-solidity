import hre from "hardhat";

const path = require('path');
const fs = require('fs');

async function main() {
  // read the file config.json in this same directory and recover the status of the deployments
  const deploymentStatus = require("./deployment-status.json");

  // check that myToken value is null, if it is not null, it means that the contract has already been deployed
  // and we do not want to deploy it again
  if (!deploymentStatus['VCardX']) {
    console.log("VCardX is not deployed please deploy it first");
    return;
  }

  if (!deploymentStatus['VCardCenterV1']) {
    console.log("VCardCenterV1 is not deployed please deploy it first");
    return;
  }

  if (!deploymentStatus['PoMembership']) {
    console.log("PoMembership is not deployed please deploy it first");
    return;
  }

  const VCardCenterV1 = await hre.viem.getContractAt("VCardCenterV1", deploymentStatus['VCardCenterV1']);
  const PoMembership = await hre.viem.getContractAt("PoMembership", deploymentStatus['PoMembership']);
  const VCardX = await hre.viem.getContractAt("VCardX", deploymentStatus['VCardX']);

  console.log('PoMembership Address Found', PoMembership.address)
  console.log('VCardX Address Found', VCardX.address)
  console.log('VCardCenterV1 Address Found', VCardCenterV1.address)
  console.log('Initializing VCardCenterV1')

  await VCardCenterV1.write.setMembershipDetails([
    PoMembership.address,
    BigInt(0),
    VCardX.address
  ]);

  console.log('Allow VCardCenterV1 to mint VCardX')
  await VCardX.write.grantRole([await VCardX.read.MINTER_ROLE(), VCardCenterV1.address]);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
