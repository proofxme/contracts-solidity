import hre from "hardhat";
const path = require('path');
const fs = require('fs');

async function main() {
  // read the file config.json in this same directory and recover the status of the deployments
  const deploymentStatus = require("./deployment-status.json");

  // check that myToken value is null, if it is not null, it means that the contract has already been deployed
  // and we do not want to deploy it again
  if (deploymentStatus['EulerFaucet']) {
    console.log("Faucet already deployed at address", deploymentStatus['EulerFaucet']);
    return;
  }

  console.log("Faucet is not deployed: Deploying")

  console.log("deploying faucet")
  const myFaucet = await hre.viem.deployContract("EulerFaucet");

  // store the address of the deployed contract in the deploymentStatus object, and persist the file
  deploymentStatus['EulerFaucet'] = myFaucet.address;
  const filePath = path.join(__dirname, './deployment-status.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentStatus, null, 2));

  console.log('Faucet Address', myFaucet.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
