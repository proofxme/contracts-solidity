//SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1155 {
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

interface ERC721 {
    function safeMint(address to, string memory uri) external;
}

contract VCardCenterV1 is Ownable {
    IERC1155 public membershipNFT;
    uint256 public membershipTokenId; // Assuming membership NFT has ID 1
    uint256 public shareContactFee = 0.001 ether;
    uint256 public memberDiscountPercentage = 50;
    address public taxCollector;
    ERC721 public vCardNFT;
    bool public isPaused;

    constructor(address _owner) Ownable(_owner) {}

    function setMembershipDetails(address _membershipNFT, uint256 _membershipTokenId, address _vCardNFT) public onlyOwner {
        membershipNFT = IERC1155(_membershipNFT);
        membershipTokenId = _membershipTokenId;
        vCardNFT = ERC721(_vCardNFT);
    }

    function setShareContactFee(uint256 _newFee) public onlyOwner {
        shareContactFee = _newFee;
    }

    function setTaxCollector(address _newTaxCollector) public onlyOwner {
        taxCollector = _newTaxCollector;
    }

    function AddContact(string memory _tokenUri) public payable {
        address _recipient = msg.sender;
        _shareContact(_recipient, _tokenUri);
    }

    function SendContact(address _recipient, string memory _tokenUri) public payable {
        _shareContact(_recipient, _tokenUri);
    }

    function calculateFee(address _recipient) public view returns (uint256) {
        uint256 fee = shareContactFee;
        uint256 discountedFee;
        if (isMember(_recipient)) {
            discountedFee = fee * (100 - memberDiscountPercentage) / 100;
        } else {
            discountedFee = fee;
        }
        return discountedFee;
    }

    function _shareContact(address _recipient, string memory _tokenUri) private {
        require(!isPaused, "Contract is paused");
        uint256 fee = calculateFee(msg.sender);
        require(msg.value >= fee, "Insufficient fee");
        vCardNFT.safeMint(_recipient, _tokenUri);
        payable(taxCollector).transfer(msg.value);
    }


    function isMember(address _address) public view returns (bool) {
        return membershipNFT.balanceOf(_address, membershipTokenId) > 0;
    }

    function pause() public onlyOwner {
        isPaused = true;
    }

    function unpause() public onlyOwner {
        isPaused = false;
    }
}
