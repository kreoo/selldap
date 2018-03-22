pragma solidity ^0.4.18;

contract Ownable {
  address public owner;

  modifier onlyOwner(){
    require(msg.sender == owner);
    _;
  }

  function Ownable() public {
    owner = msg.sender;
  }
}
