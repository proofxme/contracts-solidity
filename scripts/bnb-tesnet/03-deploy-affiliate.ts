import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function main() {
  const myAffiliate = await hre.viem.deployContract("PoAffiliate", ["0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B", "0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B"]);
  console.log('Affiliate Address', myAffiliate.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
