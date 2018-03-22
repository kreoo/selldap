/* eslint-disable */
var SellStuff = artifacts.require("./SellStuff.sol");

contract("SellStuff", function(accounts) {
  var sellStuffInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var articleTitle = "article 1";
  var articleDescription = "description art 1";
  var articlePrice = 10;

  it("should throw an exception if you try to buy an article when there is no article for sale", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;
        return sellStuffInstance.buyArticle(1, {
          from: buyer,
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(assert.fail)
      .catch(function(error) {
        assert(true);
        //so if the transaction fails and the proimise hit the catch we assert the the passed, 'behaved as expected'.
      })
      .then(function() {
        return sellStuffInstance.getNumberOfArticles();
      })
      .then(function(data) {
        assert.equal(data.toNumber(), 0, "number of articles must be zero");
      });
  });

  it("shold throw if you try to buy a non existing article", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;

        return sellStuffInstance.sellArticle(
          articleTitle,
          articleDescription,
          web3.toWei(articlePrice, "ether"),
          { from: seller, gas: 1000000 }
        );
      })
      .then(function(receipt) {
        return sellStuffInstance.buyArticle(2, {
          from: buyer,
          value: web3.toWei(articlePrice, "ether"),
          gas: 1000000
        });
      })
      .then(assert.fail)
      .catch(function(error) {
        assert(true);
      })
      .then(function() {
        return sellStuffInstance.articles(1);
      })
      .then(function(data) {
        assert.equal(data[0].toNumber(), 1, "should have id of 1");
        assert.equal(data[1], seller, "seller should match");
        assert.equal(data[2], 0x0, "no buyer");
        assert.equal(data[3], articleTitle, "should have same title");
        assert.equal(data[4], articleDescription, "should have same descr");
        assert.equal(
          data[5].toNumber(),
          web3.toWei(articlePrice, "ether"),
          "same price"
        );
      });
  });
  it("should thrown an exception if you try to buy your own article", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;

        return sellStuffInstance.buyArticle(1, {
          from: seller,
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(assert.fail)
      .catch(function(error) {
        assert(true);
      })
      .then(function() {
        return sellStuffInstance.articles(1);
      })
      .then(function(data) {
        assert.equal(data[0].toNumber(), 1, "id must be 1");
        assert.equal(data[1], seller, "seller must be equal");
        assert.equal(data[2], 0x0, "buyer must be empty");
        assert.equal(data[3], articleTitle, "title must be equal");
        assert.equal(data[4], articleDescription, "desc must be equal");
        assert.equal(
          web3.fromWei(data[5].toNumber(), "ether"),
          articlePrice,
          "price must be equal"
        );
      });
  });

  it("should thrown an exception if you try to buy using the wrong price", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;
        return sellStuffInstance.buyArticle(1, {
          from: seller,
          value: web3.toWei(articlePrice + 1, "ether")
        });
      })
      .then(assert.fail)
      .catch(function(error) {
        assert(true);
      })
      .then(function() {
        return sellStuffInstance.articles(1);
      })
      .then(function(data) {
        assert.equal(data[0].toNumber(), 1, "id must be 1");
        assert.equal(data[1], seller, "seller must be equal");
        assert.equal(data[2], 0x0, "buyer must be empty");
        assert.equal(data[3], articleTitle, "title must be equal");
        assert.equal(data[4], articleDescription, "desc must be equal");
        assert.equal(
          web3.fromWei(data[5].toNumber(), "ether"),
          articlePrice,
          "price must be equal"
        );
      });
  });
  it("should throw error if you try to buy a bought article", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;

        return sellStuffInstance.buyArticle(1, {
          from: buyer,
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(function(receipt) {
        return sellStuffInstance.buyArticle(1, {
          from: web3.eth.accounts[0],
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(assert.fail)
      .catch(function(error) {
        assert(true);
      })
      .then(function() {
        return sellStuffInstance.articles(1);
      })
      .then(function(data) {
        assert.equal(data[0].toNumber(), 1, "id must be 1");
        assert.equal(data[1], seller, "seller must be equal");
        assert.equal(data[2], buyer, "buyer must be the first");
        assert.equal(data[3], articleTitle, "title must be equal");
        assert.equal(data[4], articleDescription, "desc must be equal");
        assert.equal(
          web3.fromWei(data[5].toNumber(), "ether"),
          articlePrice,
          "price must be equal"
        );
      });
  });
});
