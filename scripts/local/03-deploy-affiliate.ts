import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function main() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myAffiliate = await hre.viem.deployContract("PoAffiliate", [deployerWallet.account.address, deployerWallet.account.address]);
  console.log('Affiliate Address', myAffiliate.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
