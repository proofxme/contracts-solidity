import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition-viem";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{version: "0.8.22"}],
    overrides: {
      "contracts/EulerToken.sol": {
        version: "0.7.6",
        settings: {}
      }
    }
  }
};

export default config;
