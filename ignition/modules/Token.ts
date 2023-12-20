import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenModule = buildModule("Token", (m) => {
  const deployerWallet = m.getAccount(0);
  const myToken = m.contract("ProofOfX", [deployerWallet, deployerWallet]);

  m.call(myToken, "name", [])

  return {myToken};
});

export default TokenModule
