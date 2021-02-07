pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/Address.sol";

contract Execute {
    using Address for address;

    constructor(address target, bytes[] memory data) {
        for (uint256 index = 0; index < data.length; index++) {
            target.functionCall(data[index]);
        }
    }
}
