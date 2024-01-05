import hre from "hardhat";

async function main() {
  const myFaucet = await hre.viem.deployContract("EulerFaucet");
  console.log('Faucet Address', myFaucet.address);
  await myFaucet.write.initialize(["0xf74b72d10f0aafb96ab51c2d10d347ba364ec845"]);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
