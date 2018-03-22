/* eslint-disable */
var SellStuff = artifacts.require("./SellStuff.sol");

//trufgfle test suits take vcontract name, a function
contract("SellStuff", function(accounts) {
  var sellStuffInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var articlePrice1 = 1;
  var articleTitle1 = "Hello";
  var articleDescription1 = "Mother fucker";
  var articlePrice2 = 2;
  var articleTitle2 = "Hello2";
  var articleDescription2 = "2Mother fucker";
  var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  it("should be initialized with empty values", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;
        return instance.getNumberOfArticles();
      })
      .then(function(data) {
        assert.equal(data.toNumber(), 0, "number of articles should be zero");
        return sellStuffInstance.getArticlesForSale();
      })
      .then(function(data) {
        assert.equal(data.length, 0, "there shouldnt be any article for sale");
      });
  });
  it("should sell an article", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;
        return sellStuffInstance.sellArticle(
          articleTitle1,
          articleDescription1,
          web3.toWei(articlePrice1, "ether"),
          { from: seller }
        );
      })
      .then(function(receipt) {
        assert.equal(receipt.logs.length, 1, "one event should be present");
        assert.equal(
          receipt.logs[0].event,
          "LogSellArticle",
          "should be event type LogSellArticle"
        );
        assert.equal(
          receipt.logs[0].args._id.toNumber(),
          1,
          "first article id should be 1"
        );
        assert.equal(receipt.logs[0].args._seller, seller, "same addresss");
        assert.equal(receipt.logs[0].args._name, articleTitle1, "same title");
        assert.equal(
          receipt.logs[0].args._price.toNumber(),
          web3.toWei(articlePrice1, "ether"),
          "same price"
        );
        return sellStuffInstance.getNumberOfArticles();
      })
      .then(function(data) {
        assert.equal(data, 1, "should return only 1 article");
        return sellStuffInstance.getArticlesForSale();
      })
      .then(function(data) {
        assert.equal(data.length, 1, "should have 1 article for sale");
        assert.equal(data[0].toNumber(), 1, "article id 1");
        return sellStuffInstance.articles(data[0]);
      })
      .then(function(data) {
        assert.equal(data[0].toNumber(), 1, "id of 1");
        assert.equal(data[1], seller, "seller must match");
        assert.equal(data[2], 0x0, "no buyer");
        assert.equal(data[3], articleTitle1, "matching article title");
        assert.equal(
          data[4],
          articleDescription1,
          "matching article description"
        );
        assert.equal(
          web3.fromWei(data[5].toNumber(), "ether"),
          articlePrice1,
          "matching article price"
        );
      });
  });

  it("should sell more than one article", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;
        return sellStuffInstance.sellArticle(
          articleTitle2,
          articleDescription2,
          web3.toWei(articlePrice2, "ether"),
          { from: seller }
        );
      })
      .then(function(receipt) {
        assert.equal(receipt.logs.length, 1, "one event should be present");
        assert.equal(
          receipt.logs[0].event,
          "LogSellArticle",
          "should be event type LogSellArticle"
        );
        assert.equal(
          receipt.logs[0].args._id.toNumber(),
          2,
          "first article id should be 2"
        );
        assert.equal(receipt.logs[0].args._seller, seller, "same addresss");
        assert.equal(receipt.logs[0].args._name, articleTitle2, "same title");
        assert.equal(
          receipt.logs[0].args._price.toNumber(),
          web3.toWei(articlePrice2, "ether"),
          "same price"
        );
        return sellStuffInstance.getNumberOfArticles();
      })
      .then(function(data) {
        assert.equal(data, 2, "should return only 2 article");
        return sellStuffInstance.getArticlesForSale();
      })
      .then(function(data) {
        assert.equal(data.length, 2, "should have 2 article for sale");
        assert.equal(data[1].toNumber(), 2, "article id 2");
        return sellStuffInstance.articles(data[1]);
      })
      .then(function(data) {
        assert.equal(data[0].toNumber(), 2, "id of 2");
        assert.equal(data[1], seller, "seller must match");
        assert.equal(data[2], 0x0, "no buyer");
        assert.equal(data[3], articleTitle2, "matching article title");
        assert.equal(
          data[4],
          articleDescription2,
          "matching article description"
        );
        assert.equal(
          web3.fromWei(data[5].toNumber(), "ether"),
          articlePrice2,
          "matching article price"
        );
      });
  });

  it("should trigger event, update balance, modify contract state when we buy an article", function() {
    return SellStuff.deployed()
      .then(function(instance) {
        sellStuffInstance = instance;
        //record balances before transfers
        sellerBalanceBeforeBuy = web3
          .fromWei(web3.eth.getBalance(seller), "ether")
          .toNumber();
        buyerBalanceBeforeBuy = web3
          .fromWei(web3.eth.getBalance(buyer), "ether")
          .toNumber();
        return sellStuffInstance.buyArticle(1, {
          from: buyer,
          value: web3.toWei(articlePrice1, "ether")
        });
      })
      .then(function(receipt) {
        assert.equal(receipt.logs.length, 1, "one event should be present");
        assert.equal(
          receipt.logs[0].event,
          "LogBuyArticle",
          "should be event type LogBuyArticle"
        );
        assert.equal(receipt.logs[0].args._id.toNumber(), 1, "article id 1");
        assert.equal(receipt.logs[0].args._seller, seller, "same addresss");
        assert.equal(receipt.logs[0].args._buyer, buyer, "same addresss");
        assert.equal(receipt.logs[0].args._name, articleTitle1, "same title");
        assert.equal(
          receipt.logs[0].args._price.toNumber(),
          web3.toWei(articlePrice1, "ether"),
          "same price"
        );

        //record new balances
        sellerBalanceAfterBuy = web3
          .fromWei(web3.eth.getBalance(seller), "ether")
          .toNumber();
        buyerBalanceAfterBuy = web3
          .fromWei(web3.eth.getBalance(buyer), "ether")
          .toNumber();

        //assert balances
        assert(
          sellerBalanceAfterBuy == sellerBalanceBeforeBuy + articlePrice1,
          "seller must have more money1"
        );
        assert(
          buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice1,
          "buyer must have less money1"
        );

        return sellStuffInstance.getArticlesForSale();
      })
      .then(function(data) {
        assert.equal(data.length, 1, "only 1 article left for sale");
        assert.equal(data[0].toNumber(), 2, " id 2 left for sale");
        return sellStuffInstance.getNumberOfArticles();
      })
      .then(function(data) {
        assert.equal(data.toNumber(), 2, "should list our 2 articles");
      });
  });
  /*it("should throw event when we sellArticle", function() {
    return SellStuff.deployed().then(function(instance) {
      sellStuffInstance = instance;
      return sellStuffInstance
        .sellArticle(
          articleTitle,
          articleDescription,
          web3.toWei(articlePrice, "ether"),
          { from: seller }
        )
        .then(function(receipt) {
          assert.equal(receipt.logs.length, 1, "one event should be present");
          assert.equal(
            receipt.logs[0].event,
            "LogSellArticle",
            "should be event type LogSellArticle"
          );
          assert.equal(receipt.logs[0].args._seller, seller, "same addresss");
          assert.equal(receipt.logs[0].args._name, articleTitle, "same title");
          assert.equal(
            receipt.logs[0].args._price.toNumber(),
            web3.toWei(articlePrice, "ether"),
            "same price"
          );
        });
    });
  });*/
});
