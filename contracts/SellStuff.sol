pragma solidity ^0.4.18;

import "./Ownable.sol";
contract SellStuff is Ownable{

  //custom types

  struct Article {
    uint id;
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price; //in web 1^-18 ether
  }

  //state
  mapping (uint => Article) public articles;
  uint articleCounter;


  //addEventListener
  event LogSellArticle(
    uint indexed _id,
    address indexed _seller,
    string _name,
    string _description,
    uint256 _price
    );

  event LogBuyArticle(
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint256 _price
    );


  //kill contact and refund funds to owner

  function kill() public onlyOwner{
    selfdestruct(owner);
  }


    //indexed means we can filter events per address, like a 'key' in a object
  function sellArticle(string _name, string _description, uint256 _price) public {
    articleCounter++;
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      0x0,
      _name,
      _description,
      _price
    );

    LogSellArticle(articleCounter, msg.sender, _name, _description, _price);
  }

  //get number of articles
  function getNumberOfArticles() public view returns (uint){
    return articleCounter;
  }

  // fetch and return all article ids up for grabs

  function getArticlesForSale() public view returns (uint[]){
    //arrays outside our state need their size predefined
    //we dont know how many articles are for sale so we start with a array the size of our articleCounter.
    uint[] memory articleIds = new uint[](articleCounter);

    //but we really wanna find out how many are actually for sale aka no buyer set
    uint numberOfArticlesForSale = 0;

    //we look through all articles in our mapping and only add to articleIds the ones that can be purchased, but since articleIds is a big array we might end up with a lot of 'null spaces' since its size is predefined and based on the total amount of articles since the contract epoch.
    for(uint i = 1; i<= articleCounter; i++){
      if(articles[i].buyer == 0x0){
        articleIds[numberOfArticlesForSale] = articles[i].id;
        numberOfArticlesForSale++;
      }
    }
    //so we now know how many contracts can actually be purchased by our control variable numberOfArticlesForSale, we create an array exactly its size (no empty spaces) and iterate through articleIds to fill that new array of ids.
    uint[] memory forSale = new uint[](numberOfArticlesForSale);
    for(uint j=0; j<numberOfArticlesForSale; j++){
      forSale[j] = articleIds[j];
    }
    return forSale;
  }
  function buyArticle(uint _id) payable public {
    //check if our contract is initialised
    require(articleCounter > 0);
    //check if id is within acceptable range
    require(_id > 0 && _id <=articleCounter);

    Article storage article = articles[_id];

    //not sold
    require(article.buyer == 0x0);

    //cant buy your own shit
    require(msg.sender != article.seller);

    require(msg.value == article.price);
    //first we set the 'canceling' effect before sending money to avoid double spend
    article.buyer = msg.sender;

    //transfer amount form the contract to the seller in the total of msg.value
    article.seller.transfer(msg.value);

    LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);

  }
}
