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
      url: "https://solemn-autumn-thunder.bsc-testnet.quiknode.pro/ab6e492235c134e533ae20e9c5dfd7740ce6c50a/",
      accounts: [vars.get("DEPLOYER_WALLET")],
      gasPrice: 10000000000,
      blockGasLimit: 10000000000,
    },
    bnbmainnet: {
      url: "https://binance.llamarpc.com",
      accounts: [vars.get("DEPLOYER_WALLET")],
      gasPrice: 10000000000,
      blockGasLimit: 10000000000,
    }
  }
};

export default config;
