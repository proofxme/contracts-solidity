import hre from "hardhat";

const advanceBlocks = async (blocks: number) => {
  //convert the blocks from number to hexadecimal
  const hexBlocks = "0x" + blocks.toString(16);
  await hre.network.provider.request({
    method: "hardhat_mine",
    params: [hexBlocks],
  });
}

export {
  advanceBlocks
}
