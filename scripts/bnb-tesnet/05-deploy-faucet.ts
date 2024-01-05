import hre from "hardhat";

async function main() {
  console.log("deploying faucet")
  const myFaucet = await hre.viem.deployContract("EulerFaucet");
  console.log('Faucet Address', myFaucet.address);
  await myFaucet.write.initialize(["0xf74b72d10f0aafb96ab51c2d10d347ba364ec845"]);
  // get the old token contract
  const myToken = await hre.viem.getContractAt("EulerTools", "0xf74b72d10f0aafb96ab51c2d10d347ba364ec845");
  // exclude the faucet from the old token
  await myToken.write.excludeAccount(["0xfbc5006be97d9d3b201cd0930ca6f1be0cb95b01"]);
  // approve the contract
  await myToken.write.approve(["0xf74b72d10f0aafb96ab51c2d10d347ba364ec845", BigInt(1_000_000_000 * 10 **18)]);
  await myToken.write.increaseAllowance(["0xf74b72d10f0aafb96ab51c2d10d347ba364ec845", BigInt(1_000_000_000* 10 **18)]);
  await myToken.write.transfer(["0xf74b72d10f0aafb96ab51c2d10d347ba364ec845", BigInt(40000*10**18)]);
  const balance = await myToken.read.balanceOf(["0xfbc5006be97d9d3b201cd0930ca6f1be0cb95b01"]);
  console.log("balance", balance);
  await myFaucet.write.claimTokens();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
