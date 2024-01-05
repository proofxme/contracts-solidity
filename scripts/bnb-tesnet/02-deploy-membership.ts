import hre from "hardhat";

async function main() {
  const myMembership = await hre.viem.deployContract("PoMembership", ["0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B", "0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B"]);
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
