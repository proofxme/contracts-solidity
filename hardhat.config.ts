import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition-viem";
import { vars } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{version: "0.8.22"}],
    overrides: {
      "contracts/EulerToken.sol": {
        version: "0.7.6",
        settings: {}
      }
    }
  },
  networks: {
    hardhat: {},
    bnbtestnet: {
      url: "https://data-seed-prebsc-2-s2.bnbchain.org:8545",
      accounts: [vars.get("DEPLOYER_WALLET")],
      blockGasLimit: 8800000000,
    }
  },
};

export default config;
