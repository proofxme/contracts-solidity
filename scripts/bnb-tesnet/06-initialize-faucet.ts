import hre from "hardhat";
const path = require('path');
const fs = require('fs');

async function main() {
  // read the file config.json in this same directory and recover the status of the deployments
  const deploymentStatus = require("./deployment-status.json");

  // check that myToken value is null, if it is not null, it means that the contract has already been deployed
  // and we do not want to deploy it again
  if (!deploymentStatus['EulerFaucet']) {
    console.log("Faucet is not deployed please deploy it first");
    return;
  }

  if (!deploymentStatus['EulerToken']) {
    console.log("Old Token is not deployed please deploy it first");
    return;
  }

  const myFaucet = await hre.viem.getContractAt("EulerFaucet", deploymentStatus['EulerFaucet']);

  console.log('Faucet Address Found', myFaucet.address)
  console.log('Initializing Faucet')

  await myFaucet.write.initialize([deploymentStatus['EulerToken']]);
  // get the old token contract
  const myToken = await hre.viem.getContractAt("EulerTools", deploymentStatus['EulerToken']);
  // exclude the faucet from the old token
  await myToken.write.excludeAccount([myFaucet.address]);
  // approve the contract
  await myToken.write.approve([deploymentStatus['EulerToken'], BigInt(1_000_000_000 * 10 **18)]);
  await myToken.write.increaseAllowance([deploymentStatus['EulerToken'], BigInt(1_000_000_000* 10 **18)]);
  await myToken.write.transfer([deploymentStatus['EulerToken'], BigInt(40000*10**18)]);

  const balance = await myToken.read.balanceOf([myFaucet.address]);
  console.log("Faucet Balance updated to:", balance);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
