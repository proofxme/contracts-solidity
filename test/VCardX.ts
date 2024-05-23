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

    it("Should set the initial tax rate to 0", async function () {
      expect(await vCardX.read.taxAmount()).to.equal(0);
    });
  });

  describe("Tax management", function () {
    it("Should allow the tax admin to set the tax rate", async function () {
      await expect(vCardX.write.setTaxAmount([10])).to.not.be.reverted;
      expect(await vCardX.read.taxAmount()).to.equal(10);
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

      console.log("minter balance before", minterBalanceBefore);

      // Get the balance of the tax collector before the mint
      const taxCollectorBalanceBefore = await publicClient.getBalance({
        address: getAddress(taxCollectorWalletClient.account.address),
      });
      console.log("tax collector balance before", taxCollectorBalanceBefore);

      // set the tax rate to 10%
      await vCardX.write.setTaxAmount([0]);

      const tokenId = BigInt(1);
      const tokenUri = "https://api.pox.me/vcard/1";
      const minterAccountVCardX = await hre.viem.getContractAt(
        "VCardX",
        vCardX.address,
        {client: {wallet: defaultMinter}}
      );

      await expect(
        minterAccountVCardX.write.safeMint([otherAccount.account.address, tokenId])
      ).to.not.be.reverted;

      expect(await minterAccountVCardX.read.ownerOf([tokenId])).to.equal(getAddress(otherAccount.account.address));
      expect(await minterAccountVCardX.read.tokenURI([tokenId])).to.equal(tokenUri);


      // Get the balance of the minter (aliceWalletClient) after the mint
      const minterBalanceAfter = await publicClient.getBalance({
        address: getAddress(defaultMinter.account.address),
      });
      console.log("minter balance after", minterBalanceAfter);

      // Get the balance of the tax collector after the mint
      const taxCollectorBalanceAfter = await publicClient.getBalance({
        address: getAddress(taxCollectorWalletClient.account.address),
      });
      console.log("tax collector balance after", taxCollectorBalanceAfter);

      // Get the contract balance after the mint
      const contractBalanceAfter = await publicClient.getBalance({
        address: vCardX.address,
      });
      console.log("contract balance after", contractBalanceAfter);
    });

    xit("Should not allow non-minters to mint new tokens", async function () {
      const tokenId = 1;
      const tokenURI = "1";
      const value = parseEther("0.1");

      await expect(
        vCardX.write.safeMint(defaultAdmin.address, tokenId, {
          value,
        })
      ).to.be.revertedWith(
        "AccessControl: account 0x0... is missing role 0x..."
      );
    });

    xit("Should collect the tax on minting", async function () {
      const tokenId = 1;
      const tokenURI = "https://api.pox.me/vcard/1";
      const value = parseEther("0.1");
      const taxAmount = 10;

      await vCardX.connect(defaultAdmin).setTaxAmount(taxAmount);

      const taxCollectorBalanceBefore = await publicClient.getBalance({
        address: getAddress(taxCollectorWalletClient.account.address),
      })

      await expect(
        vCardX.write.safeMint([defaultAdmin.address, tokenId], {
          value,
        })
      ).to.not.be.reverted;

      const taxCollectorBalanceAfter = await publicClient.getBalance({
        address: getAddress(taxCollectorWalletClient.account.address),
      })
      const expectedTaxAmount = (Number(value) * Number(taxAmount)) / 100
      expect(taxCollectorBalanceAfter.sub(taxCollectorBalanceBefore)).to.equal(expectedTaxAmount);
    });
  });
});
