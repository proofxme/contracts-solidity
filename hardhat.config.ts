import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition-viem";
import "@nomicfoundation/hardhat-verify";
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
    bscTestnet: {
      url: "https://solemn-autumn-thunder.bsc-testnet.quiknode.pro/ab6e492235c134e533ae20e9c5dfd7740ce6c50a/",
      accounts: [vars.get("DEPLOYER_WALLET")],
      gasPrice: 10000000000,
      blockGasLimit: 10000000000,
    },
    bsc: {
      url: "https://bsc.publicnode.com",
      accounts: [vars.get("DEPLOYER_WALLET")],
      gasPrice: 10000000000,
      blockGasLimit: 10000000000,
    }
  },
  sourcify: {
    enabled: true
  },
  etherscan: {
    apiKey: {
      bsc: vars.get("BSCSCAN_API_KEY"),
      bscTestnet: vars.get("BSCSCAN_API_KEY")
    }
  }
};

export default config;
