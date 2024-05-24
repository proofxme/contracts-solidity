import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";

async function deployVCardXFixture() {
  const [owner, minter, otherAccount, taxCollector] = await hre.viem.getWalletClients();

  const taxAmount = 10; // Example tax rate of 10%

  const vCardX = await hre.viem.deployContract("VCardX", [
      getAddress(owner.account.address),
      getAddress(minter.account.address),
      getAddress(taxCollector.account.address)
    ]
  );

  return {
    vCardX,
    owner,
    minter,
    otherAccount,
    taxCollector,
    taxAmount,
  };
}

describe("VCardX", function () {
  let vCardX: any;
  let defaultAdmin: any;
  let defaultMinter: any;
  let taxCollectorWalletClient: any;
  let otherAccount: any;
  let publicClient: any;

  beforeEach(async function () {
    const fixture = await loadFixture(deployVCardXFixture);
    vCardX = fixture.vCardX;
    defaultAdmin = fixture.owner;
    defaultMinter = fixture.minter;
    taxCollectorWalletClient = fixture.taxCollector;
    otherAccount = fixture.otherAccount;
    publicClient = await hre.viem.getPublicClient();
  })

  describe("Deployment", function () {
    it("Should set the correct default admin, minter, and tax admin", async function () {
      expect(await vCardX.read.hasRole([await vCardX.read.DEFAULT_ADMIN_ROLE(), getAddress(defaultAdmin.account.address)])).to.be.true;
      expect(await vCardX.read.hasRole([await vCardX.read.MINTER_ROLE(), getAddress(defaultMinter.account.address)])).to.be.true;
      expect(await vCardX.read.hasRole([await vCardX.read.TAX_ADMIN_ROLE(), getAddress(defaultAdmin.account.address)])).to.be.true;
    });

    it("Should set the correct tax collector address", async function () {
      expect(await vCardX.read.taxCollector()).to.equal(getAddress(taxCollectorWalletClient.account.address));
    });

    it("Should set the initial tax rate to 0.001", async function () {
      expect(await vCardX.read.taxAmount()).to.equal(parseEther("0.001"));
    });
  });

  describe("Tax management", function () {
    it("Should allow the tax admin to set the tax rate", async function () {
      await vCardX.write.setTaxAmount([11])
      expect(await vCardX.read.taxAmount()).to.equal(11);
    });

    it("Should not allow non-tax admins to set the tax rate", async function () {
      try {
        const otherAccountVCardX = await hre.viem.getContractAt(
          "VCardX",
          vCardX.address,
          {client: {wallet: otherAccount}}
        );

        await otherAccountVCardX.write.setTaxAmount([BigInt(10)]);
      } catch (error: any) {
        expect(error.message).to.include("AccessControlUnauthorizedAccount");
      }
    });

    it("Should not allow setting the tax rate above 100%", async function () {
      try {
        await expect(vCardX.write.setTaxAmount([101])).to.be.revertedWith(
          "Tax rate must be between 0 and 100"
        );
      } catch (error: any) {
        expect(error.message).to.include("Tax rate must be between 0 and 100");
      }
    });
  });

  describe("SafeMint", function () {
    it("Should allow minters to mint new tokens", async function () {
      // Get the balance of the minter (aliceWalletClient) before the mint
      const minterBalanceBefore = await publicClient.getBalance({
        address: getAddress(defaultMinter.account.address),
      });

      // Get the balance of the tax collector before the mint
      const taxCollectorBalanceBefore = await publicClient.getBalance({
        address: getAddress(taxCollectorWalletClient.account.address),
      });

      // set the tax rate to 10%
      await vCardX.write.setTaxAmount([0]);

      const tokenId = BigInt(1);
      const tokenUri = "https://api.pox.me/vcard/1";
      const minterAccountVCardX = await hre.viem.getContractAt(
        "VCardX",
        vCardX.address,
        {client: {wallet: defaultMinter}}
      );

      await minterAccountVCardX.write.safeMint([otherAccount.account.address, tokenId])

      expect(await minterAccountVCardX.read.ownerOf([tokenId])).to.equal(getAddress(otherAccount.account.address));
      expect(await minterAccountVCardX.read.tokenURI([tokenId])).to.equal(tokenUri);
    });

    it("Should not allow non-minters to mint new tokens", async function () {
      const tokenId = 1;
      const tokenURI = "1";
      const value = parseEther("0.1");
      const otherAccountVcardX = await hre.viem.getContractAt(
        "VCardX",
        vCardX.address,
        {client: {wallet: otherAccount}}
      );

      try {
        await otherAccountVcardX.write.safeMint([defaultAdmin.account.address, BigInt(tokenId)], {
          value,
        });
      } catch (error: any) {
        expect(error.message).to.include("AccessControlUnauthorizedAccount");
      }

    });

    it("Should collect the tax on minting", async function () {
      const tokenId = 1;
      const tokenURI = "https://api.pox.me/vcard/1";
      const value = parseEther("0.0001");
      const taxAmount = parseEther("0.0001");

      await vCardX.write.setTaxAmount([taxAmount]);

      // Get the tax collector's balance before the minting
      const taxCollectorBalanceBefore = await publicClient.getBalance({
        address: getAddress(taxCollectorWalletClient.account.address),
      });

      const vcardXMinter = await hre.viem.getContractAt(
        "VCardX",
        vCardX.address,
        {client: {wallet: defaultMinter}}
      );

      // Mint a new token
      await vcardXMinter.write.safeMint([defaultAdmin.account.address, BigInt(tokenId)], {
        value,
      });

      // Get the tax collector's balance after the minting
      const taxCollectorBalanceAfter = await publicClient.getBalance({
        address: getAddress(taxCollectorWalletClient.account.address),
      });

      // Calculate the expected tax amount
      const expectedTaxAmount = BigInt(value);

      // Verify that the tax collector's balance has increased by the expected tax amount
      expect(taxCollectorBalanceAfter - taxCollectorBalanceBefore).to.equal(
        expectedTaxAmount, "Tax collector balance doesn't match with the exepcted amount"
      );
    });
  });
});
