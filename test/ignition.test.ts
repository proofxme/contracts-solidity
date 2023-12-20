import hre from "hardhat";
import { assert } from "chai";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenModule = buildModule("Token", (m) => {
  const deployerWallet = m.getAccount(0);
  const myToken = m.contract("ProofOfX", [deployerWallet, deployerWallet]);

  return {myToken};
});

it("should have named the Proof of X", async function () {
  const [deployerWallet] = await hre.viem.getWalletClients();
  const {myToken} = await hre.ignition.deploy(TokenModule);

  assert.equal(await myToken.read.name(), "Proof of X", "Proof of X");
});
