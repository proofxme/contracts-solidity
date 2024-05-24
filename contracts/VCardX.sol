// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @custom:security-contact security@pox.me
contract VCardX is ERC721, ERC721Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant TAX_ADMIN_ROLE = keccak256("TAX_ADMIN_ROLE");

    // set a tax amount of 0.001 gwei
    uint256 public taxAmount = 0.001 ether;
    address payable public taxCollector;

    constructor(
        address defaultAdmin,
        address minter,
        address payable _taxCollector
    ) ERC721("VCardX", "VCARDX") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(TAX_ADMIN_ROLE, defaultAdmin); // Assuming the defaultAdmin is the taxAdmin
        taxCollector = _taxCollector;
    }

    function setTaxAmount(uint256 _taxAmount) public onlyRole(TAX_ADMIN_ROLE) {
        taxAmount = _taxAmount;
    }

    modifier tax() {
        require(msg.value >= taxAmount, "Insufficient value for tax, tax is 0.001 Ethereum");
        _;
        // Transfer the fixed tax amount to the tax collector
        taxCollector.transfer(taxAmount);
        // Refund the remaining value to the caller
        uint256 refundAmount = msg.value - taxAmount;
        if (refundAmount > 0) {
            (bool success,) = msg.sender.call{value: refundAmount}("");
            require(success, "Failed to refund remaining value");
        }
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://api.pox.me/vcard/";
    }

    function safeMint(address to, uint256 tokenId) public payable tax onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
