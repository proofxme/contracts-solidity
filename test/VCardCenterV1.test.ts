import { config, expect } from "chai";
import hre from "hardhat";
import { formatEther, getAddress, parseEther } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { deployMembership, deployVCardXCenterFixture, deployVCardXFixture } from "./fixtures";

describe("VCardCenterV1", function () {
  let vCardCenter: any;
  let owner: any;
  let vCardNFT: any;
  let otherAccount: any;
  let VCardX: any;
  let membershipNFT: any;
  let publicClient: any;

  beforeEach(async function () {
    config.truncateThreshold = 0;
    const fixture = await loadFixture(deployVCardXCenterFixture);
    vCardCenter = fixture.vCardCenterV1;
    owner = fixture.owner;
    const {myMembership} = await loadFixture(deployMembership)
    membershipNFT = myMembership;
    const {vCardX} = await loadFixture(deployVCardXFixture);
    VCardX = vCardX;
    publicClient = await hre.viem.getPublicClient()
  });

  describe("setMembershipDetails", function () {
    it("Should set the correct membership details", async function () {

      await vCardCenter.write.setMembershipDetails([
        membershipNFT.address,
        BigInt(0),
        VCardX.address
      ]);

      expect(await vCardCenter.read.membershipNFT()).to.equal(getAddress(membershipNFT.address));
      expect(await vCardCenter.read.membershipTokenId()).to.equal(0);
      expect(await vCardCenter.read.vCardNFT()).to.equal(getAddress(VCardX.address));
    });

    it("Should only allow the owner to set the membership details", async function () {
      const otherAccountVCardCenter = await hre.viem.getContractAt(
        "VCardCenterV1",
        vCardCenter.address,
        {client: {wallet: otherAccount}}
      );

      try {
        await otherAccountVCardCenter.write.setMembershipDetails([
          membershipNFT.address,
          BigInt(0),
          VCardX.address,
        ])
      } catch (error: any) {
        expect(error.message).to.equal("Ownable: caller is not the owner");
      }
    });
  });

  describe("setShareContactFee", function () {
    it("Should set the correct share contact fee", async function () {
      const newFee = parseEther("0.002");
      await vCardCenter.write.setShareContactFee([newFee]);
      expect(await vCardCenter.read.shareContactFee()).to.equal(newFee);
    });

    it("Should only allow the owner to set the share contact fee", async function () {
      const newFee = parseEther("0.002");

      const otherAccountVCardCenter = await hre.viem.getContractAt(
        "VCardCenterV1",
        vCardCenter.address,
        {client: {wallet: otherAccount}}
      );

      try {
        await otherAccountVCardCenter.write.setShareContactFee([newFee])
      } catch (error: any) {
        expect(error.message).to.equal("Ownable: caller is not the owner");
      }
    });

    it("Should apply the member discount if the sender is not a member", async function () {
      const [sender, recipient] = await hre.viem.getWalletClients();

      // grant the appropiate roles to the vCardCenter contract
      await vCardCenter.write.setMembershipDetails([
        membershipNFT.address,
        BigInt(0),
        VCardX.address
      ]);

      //send 1 membership to the sender address
      await membershipNFT.write.mint([getAddress(sender.account.address), BigInt(0), BigInt(1), "0x0"]);

      // calculate the fee from the contract calculateFee function:
      const shareFeeWei = await vCardCenter.read.calculateFee([getAddress(sender.account.address)]);

      expect(shareFeeWei).to.equal(parseEther("0.0005"));
    });

    it("Should not apply the member discount if the sender is not a member", async function () {
      const [sender, recipient] = await hre.viem.getWalletClients();
      const tokenUri = "tebayoso";

      // grant the appropiate roles to the vCardCenter contract
      await vCardCenter.write.setMembershipDetails([
        membershipNFT.address,
        BigInt(0),
        VCardX.address
      ]);

      // calculate the fee from the contract calculateFee function:
      const shareFeeWei = await vCardCenter.read.calculateFee([getAddress(sender.account.address)]);

      expect(shareFeeWei).to.equal(parseEther("0.001"));
    });
  });

  describe("setMemberDiscountPercentage", function () {
    it("Should set and apply the correct fee", async function () {
      const newFee = parseEther("0.1");
      await vCardCenter.write.setShareContactFee([newFee]);
      expect(await vCardCenter.read.shareContactFee()).to.equal(parseEther("0.1"));
    });

    it("Should only allow the owner to set the member discount percentage", async function () {
      const newPercentage = BigInt(75);

      const otherAccountVCardCenter = await hre.viem.getContractAt(
        "VCardCenterV1",
        vCardCenter.address,
        {client: {wallet: otherAccount}}
      );

      try {
        await otherAccountVCardCenter.write.setShareContactFee([newPercentage])
      } catch (error: any) {
        expect(error.message).to.equal("Ownable: caller is not the owner");
      }
    });
  });

  describe("setTaxCollector", function () {
    it("Should set the correct tax collector address", async function () {
      const [wallet, otherWallet] = await hre.viem.getWalletClients();
      await vCardCenter.write.setTaxCollector([otherWallet.account.address]);
      expect(await vCardCenter.read.taxCollector()).to.equal(getAddress(otherWallet.account.address));
    });

    it("Should only allow the owner to set the tax collector address", async function () {
      const [wallet, otherWallet] = await hre.viem.getWalletClients();

      const otherAccountVCardCenter = await hre.viem.getContractAt(
        "VCardCenterV1",
        vCardCenter.address,
        {client: {wallet: otherAccount}}
      );

      try {
        await otherAccountVCardCenter.write.setTaxCollector([otherWallet.account.address])
      } catch (error: any) {
        expect(error.message).to.equal("Ownable: caller is not the owner");
      }
    });
  });

  describe("AddContact", function () {
    it("Should mint a new vCard NFT for the requester", async function () {
      const [sender] = await hre.viem.getWalletClients();
      const tokenId = BigInt(0);
      const fee = parseEther("1");

      await vCardCenter.write.setMembershipDetails([
        membershipNFT.address,
        BigInt(0),
        VCardX.address
      ]);

      await VCardX.write.grantRole([await VCardX.read.MINTER_ROLE(), getAddress(vCardCenter.address)]);

      await vCardCenter.write.AddContact(["tebayoso"], {value: fee});

      expect(await VCardX.read.ownerOf([tokenId])).to.equal(
        getAddress(sender.account.address), "Owner Mismatch"
      );

      expect(await VCardX.read.tokenURI([tokenId])).to.equal("https://api.pox.me/vcard/tebayoso", "Token URI Mismatch");
    });

    it("Should apply the member discount if the recipient is a member", async function () {
      const [sender, recipient] = await hre.viem.getWalletClients();
      const tokenUri = "tebayoso";

      // grant the appropiate roles to the vCardCenter contract
      await vCardCenter.write.setMembershipDetails([
        membershipNFT.address,
        BigInt(0),
        VCardX.address
      ]);

      await VCardX.write.grantRole([await VCardX.read.MINTER_ROLE(), getAddress(vCardCenter.address)]);

      //send 1 membership to the sender address
      await membershipNFT.write.mint([getAddress(sender.account.address), BigInt(0), BigInt(1), "0x0"]);

      // Get the share contact fee and convert it to a decimal number
      const shareFeeWei = await vCardCenter.read.shareContactFee();
      const shareFeeEther = formatEther(shareFeeWei);
      const memberDiscountPercentage = await vCardCenter.read.memberDiscountPercentage();
      const shareFeeWithDiscount = parseFloat(shareFeeEther) * (100 - Number(memberDiscountPercentage)) / 100;

      const finalFee = parseEther(shareFeeWithDiscount.toString());

      await vCardCenter.write.SendContact([recipient.account.address, tokenUri], {value: finalFee});

      const tokenId = BigInt(0)

      expect(await VCardX.read.ownerOf([tokenId])).to.equal(
        getAddress(recipient.account.address), "Owner Mismatch"
      );

      expect(await VCardX.read.tokenURI([tokenId])).to.equal("https://api.pox.me/vcard/tebayoso", "Token URI Mismatch");
    });

    xit("Should fail if the fee is not paid", async function () {
      const [sender] = await hre.viem.getWalletClients();
      const tokenUri = "tebayoso";

      // grant the appropiate roles to the vCardCenter contract
      await vCardCenter.write.setMembershipDetails([
        membershipNFT.address,
        BigInt(0),
        VCardX.address
      ]);

      try {
        await vCardCenter.write.AddContact([tokenUri], {value: parseEther("0")});
      } catch (error: any) {
        expect(error.details).to.include("Insufficient fee paid", "Error message mismatch");
      }
    });
  });

  describe("SendContact", function () {
    it("Should mint a new VCard and send it to the recipient", async function () {
      const [sender, recipient] = await hre.viem.getWalletClients();
      const tokenUri = "tebayoso";

      // grant the appropiate roles to the vCardCenter contract
      await vCardCenter.write.setMembershipDetails([
        membershipNFT.address,
        BigInt(0),
        VCardX.address
      ]);

      await VCardX.write.grantRole([await VCardX.read.MINTER_ROLE(), getAddress(vCardCenter.address)]);

      //send 1 membership to the sender address
      await membershipNFT.write.mint([getAddress(sender.account.address), BigInt(0), BigInt(1), "0x0"]);

      // Get the share contact fee and convert it to a decimal number
      const shareFeeWei = await vCardCenter.read.shareContactFee();
      const shareFeeEther = formatEther(shareFeeWei);
      const memberDiscountPercentage = await vCardCenter.read.memberDiscountPercentage();
      const shareFeeWithDiscount = parseFloat(shareFeeEther) * (100 - Number(memberDiscountPercentage)) / 100;

      const finalFee = parseEther(shareFeeWithDiscount.toString());

      await vCardCenter.write.SendContact([recipient.account.address, tokenUri], {value: finalFee});

      const tokenId = BigInt(0)

      expect(await VCardX.read.ownerOf([tokenId])).to.equal(
        getAddress(recipient.account.address), "Owner Mismatch"
      );

      expect(await VCardX.read.tokenURI([tokenId])).to.equal("https://api.pox.me/vcard/tebayoso", "Token URI Mismatch");
    });

    xit("Should fail if the fee is not paid", async function () {
      const tokenUri = "tebayoso";

      // grant the appropiate roles to the vCardCenter contract
      await vCardCenter.write.setMembershipDetails([
        membershipNFT.address,
        BigInt(0),
        VCardX.address
      ]);

      try {
        await vCardCenter.write.AddContact([tokenUri], {value: 0});
      } catch (error: any) {
        expect(error.details).to.include("Insufficient fee paid", "Error message mismatch");
      }
    });
  });

})
