pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20("MockERC20", "MOCK") {
    constructor() public {
        ERC20._mint(msg.sender, 1000 ether);
    }
}
