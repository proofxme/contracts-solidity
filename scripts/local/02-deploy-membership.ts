import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function main() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myMembership = await hre.viem.deployContract("PoMembership", [deployerWallet.account.address, deployerWallet.account.address]);
  const initialSupply = await myMembership.read.totalSupply();
  console.log(`Initial supply of MyToken: ${initialSupply}`);
  console.log('Membership Address', myMembership.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
