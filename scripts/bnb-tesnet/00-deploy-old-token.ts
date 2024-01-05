import { parseEther, formatEther } from "viem";
import hre from "hardhat";
const path = require('path');
const fs = require('fs');

async function main() {
  // read the file config.json in this same directory and recover the status of the deployments
  const deploymentStatus = require("./deployment-status.json");

  // check that myToken value is null, if it is not null, it means that the contract has already been deployed
  // and we do not want to deploy it again
  if (deploymentStatus['EulerToken']) {
    console.log("Old Token already deployed at address", deploymentStatus['EulerToken']);
    return;
  }

  // if the token is not deployed, deploy it and store it in the deploymentStatus object
  const myToken = await hre.viem.deployContract("EulerTools");

  // store the address of the deployed contract in the deploymentStatus object, and persist the file in this same folder
  deploymentStatus['EulerToken'] = myToken.address;
  const filePath = path.join(__dirname, './deployment-status.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentStatus, null, 2));

  console.log('token Address', myToken.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
