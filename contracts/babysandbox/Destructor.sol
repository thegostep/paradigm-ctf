pragma solidity 0.7.0;

contract Destructor {
    Destructor public other;
    uint foo;

    constructor(address payable _other) public {
        other = Destructor(_other);
        foo = 1;
    }
    function increment() external payable {
        foo += 1;
    }
    fallback() external payable {
        try Destructor(0xc5e4ff84122F0895802eA82BcE728A7DCEF64a53).increment() {
            selfdestruct(msg.sender);
        } catch(bytes memory _err) { }
    }
}
