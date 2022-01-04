//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract VerifyContract is EIP712{

    constructor() EIP712("SetTest","1"){}

    uint storedData;

    function set(uint x) internal {
        storedData = x;
    }

    function get() public view returns (uint) {
        return storedData;
    }

    function executeMyFunctionFromSignature(
        bytes memory signature,
        address owner,
        uint256 deadline,
        uint256 x
    ) external {
        bytes32 hashStruct = _hashTypedDataV4(keccak256(
            abi.encode(
                keccak256("set(address sender,uint x,uint deadline)"),
                owner,
                x,
                deadline
            )
        ));
        address signer = ECDSA.recover(hashStruct, signature);
        require(signer == owner, "MyFunction: invalid signature");
        require(signer != address(0), "ECDSA: invalid signature");

        require(block.timestamp < deadline, "MyFunction: signed transaction expired");
        set(x);
    }

}