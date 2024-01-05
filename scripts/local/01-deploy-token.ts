import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function main() {
  const [deployerWallet] = await hre.viem.getWalletClients();

  const myToken = await hre.viem.deployContract("ProofOfX", [deployerWallet.account.address, deployerWallet.account.address]);
  const initialSupply = await myToken.read.totalSupply();
  console.log(`Initial supply of MyToken: ${initialSupply}`);
  await myToken.write.mint([deployerWallet.account.address, parseEther("1000")]);
  console.log('token Address', myToken.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
