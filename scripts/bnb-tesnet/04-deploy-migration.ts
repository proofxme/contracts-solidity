import hre from "hardhat";

async function main() {
  const myMigration = await hre.viem.deployContract("PoXMigration", ["0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B"]);
  console.log('Migration Address', myMigration.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
