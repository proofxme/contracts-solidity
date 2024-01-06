import hre from "hardhat";
const path = require('path');
const fs = require('fs');

async function main() {
  // read the file config.json in this same directory and recover the status of the deployments
  const deploymentStatus = require("./deployment-status.json");
  if (deploymentStatus['PoxmeToken']) {
    console.log("New Token already deployed at address", deploymentStatus['PoxmeToken']);
    return;
  }

  console.log("Token is not deployed: Deploying")

  const myToken = await hre.viem.deployContract("ProofOfX", ["0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B","0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B"]);

  // store the address of the deployed contract in the deploymentStatus object, and persist the file
  deploymentStatus['PoxmeToken'] = myToken.address;
  const filePath = path.join(__dirname, './deployment-status.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentStatus, null, 2));

  console.log('Token Address', myToken.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
