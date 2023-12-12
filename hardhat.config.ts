import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{version: "0.8.20"}],
    overrides: {
      "contracts/EulerToken.sol": {
        version: "0.7.6",
        settings: { }
      }
    }
  }
};

export default config;
