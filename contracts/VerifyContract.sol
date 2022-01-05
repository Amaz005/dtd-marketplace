//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract VerifyContract is EIP712{

    constructor() EIP712("SetTest","1"){}

    string storedData;
    address signer;
    bytes32 _hashStruct;
    uint _storedData;

    function set(uint x) internal {
        _storedData = x;
    }

    function get() public view returns (uint) {
        return _storedData;
    }

    function setHashStruct(bytes32 __hashStruct) internal {
        _hashStruct = __hashStruct;
    }

    function getHashStruct() public view returns(bytes32) {
        return _hashStruct;
    }

    function setSign(address _signature) internal {
        signer = _signature;
    }

    function getSign() public view returns(address) {
        return signer;
    }

    function setContent(string memory x) internal {
        storedData = x;
    }

    function getContent() public view returns (string memory){
        return storedData;
    }

    function executeMyFunctionFromSignature(
        bytes memory signature,
        address owner,
        uint deadline,
        string memory content
    ) external {
        bytes32 hashStruct = _hashTypedDataV4(keccak256(
            abi.encode(
                keccak256("set(address sender,string content,uint deadline)"),
                owner,
                keccak256(bytes(content)),
                deadline
            )
        ));
        address _signer = ECDSA.recover(hashStruct, signature);
        setSign(_signer);
        setHashStruct(hashStruct);
        require(signer == owner, "MyFunction: invalid signature");
        require(signer != address(0), "ECDSA: invalid signature");

        require(block.timestamp < deadline, "MyFunction: signed transaction expired");
        setContent(content);
    }

    function executeSetIfSignatureMatch(
        uint8 v,
        bytes32 r,
        bytes32 s,
        address sender,
        uint256 deadline,
        string memory x
    ) external {
        require(block.timestamp < deadline, "Signed transaction expired");

        uint chainId;
        assembly {
            chainId := chainid()
        }
        bytes32 eip712DomainHash = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("SetTest")),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );  

        bytes32 hashStruct = keccak256(
        abi.encode(
            keccak256("set(address sender,string content,uint deadline)"),
            sender,
            keccak256(bytes(x)),
            deadline
            )
        );

        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", eip712DomainHash, hashStruct));
        address _signer = ecrecover(hash, v, r, s);
        setSign(_signer);
        setHashStruct(hashStruct);
        require(_signer == sender, "MyFunction: invalid signature");
        require(_signer != address(0), "ECDSA: invalid signature");

        setContent(x);
    }

}