var SellStuff = artifacts.require("./SellStuff.sol");

module.exports = function(deployer) {
  deployer.deploy(SellStuff);
};
