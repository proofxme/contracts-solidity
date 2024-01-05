import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function main() {
  const myToken = await hre.viem.deployContract("EulerTools");

  console.log('token Address', myToken.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
