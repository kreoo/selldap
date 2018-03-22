import React, { Component } from "react";
import randomize from "randomatic";
import SellStuffContract from "../build/contracts/SellStuff.json";
import getWeb3 from "./utils/getWeb3";
import contract from "truffle-contract";
import "./css/oswald.css";
import "./css/open-sans.css";
import "./css/pure-min.css";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      articles: [],
      web3: null,
      coinbase: "",
      coinbaseBalance: 0,
      sellStuffInstance: null,
      sellStuff: contract(SellStuffContract),
      formDescription: "",
      formTitle: "",
      formValue: "",
      currentEvent: "",
      eventsList: [],
      reloading: false
    };
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        });

        // Instantiate contract once web3 provided.
        this.state.sellStuff.setProvider(this.state.web3.currentProvider);

        this.instantiateUserAccount();
      })
      .catch(() => {
        console.log("Error finding web3.");
      });
  }

  /*
   * SMART CONTRACT EXAMPLE
   *
   * Normally these functions would be called in the context of a
   * state management library, but for convenience I've placed them here.
   */

  // Declaring this for later so we can chain functions on SellStuff.

  instantiateUserAccount() {
    // Get accounts.

    this.state.web3.eth.getCoinbase((err, account) => {
      this.setState({ coinbase: account ? account : null });

      this.state.web3.eth.getBalance(this.state.coinbase, (err, bigBalance) => {
        const balance = this.state.web3.fromWei(bigBalance, "ether").toNumber();

        this.setState({ coinbaseBalance: balance ? balance : 0 });
      });
    });
    this.setupContractinstance();
  }
  setupContractinstance = () => {
    this.state.sellStuff.deployed().then(instance => {
      this.setState({ sellStuffInstance: instance }, () => {
        this.setupEvents();
        this.reloadArticles();
      });
    });
  };

  reloadArticles = () => {
    console.log("reloading at state: ", this.state.reloading);
    if (!this.state.reloading) {
      this.setState({ articles: [] });

      this.state.sellStuffInstance.getArticlesForSale
        .call({
          from: this.state.coinbase
        })
        .then(articleIds => {
          const totalArticles = articleIds.length;
          let counter = 0;
          if (totalArticles > 0) {
            for (let article of articleIds) {
              this.state.sellStuffInstance
                .articles(article.toNumber())
                // eslint-disable-next-line
                .then(data => {
                  this.setState(
                    prevState => {
                      // eslint-disable-next-line
                      return {
                        articles: prevState.articles.concat([data])
                      };
                    },
                    () => {
                      counter++;
                      if (counter === totalArticles) {
                        this.setState({ reloading: false });
                      }
                    }
                  );
                });
            }
          } else {
            this.setState({ reloading: false });
          }
        });
      this.setState({ reloading: true });
    }
  };

  formHandler = e => {
    e.preventDefault();
    if (
      this.state.formTitle !== "" &&
      this.state.formDescription !== "" &&
      this.state.formValue !== ""
    ) {
      this.state.sellStuffInstance
        .sellArticle(
          this.state.formTitle,
          this.state.formDescription,
          this.state.web3.toWei(this.state.formValue, "ether"),
          { from: this.state.coinbase, gas: 1000000 }
        )

        .catch(error => console.log(error));
    } else {
      console.log("no dice");
      return;
    }
  };

  handleFormChange = (e, type) => {
    switch (type) {
      case "title":
        this.setState({ formTitle: e.target.value });
        break;
      case "description":
        this.setState({ formDescription: e.target.value });
        break;
      case "value":
        this.setState({ formValue: e.target.value });
        break;
      default:
        return;
    }
  };
  setupEvents = () => {
    // first obj is related to filters,second is related to block height/ block range

    //we get this bitch from state but if its a 'high rotation' contract we need to already call the .deployed() and fetch a new instance to make sure we are interacting with the contract at the right address. maybe turn it a function that returns the object
    this.state.sellStuffInstance
      .LogSellArticle({}, {})
      .watch((error, event) => {
        if (!error) {
          this.setState(prevState => {
            const eventString = `${event.args._seller} Added: ${
              event.args._name
            }`;
            console.log(randomize("*", 4));
            return {
              currentEvent: eventString,
              eventsList: [
                ...prevState.eventsList,
                <li key={event.args._id + randomize("A", 4)}>{eventString}</li>
              ]
            };
          });
          this.reloadArticles();
        } else {
          console.log(error);
        }
      });
    this.state.sellStuffInstance.LogBuyArticle({}, {}).watch((error, event) => {
      if (!error) {
        this.setState(prevState => {
          const eventString = `${event.args._buyer} Bought ${event.args._name}`;
          //sold some shit, need to pluck the article from our list we can do it in one line
          console.log(event.args._id + randomize("*", 4));
          return {
            currentEvent: eventString,
            eventsList: [
              ...prevState.eventsList,
              <li key={event.args._id + randomize("A", 4)}>{eventString}</li>
            ]
          };
        });
        this.reloadArticles();
      } else {
        console.log(error);
      }
    });
  };
  renderEvent = () => {
    if (this.state.currentEvent !== "") {
      return (
        <div>
          <span>Yo, new event: {this.state.currentEvent}</span>
        </div>
      );
    } else {
      return null;
    }
  };

  buyButtonHandler = e => {
    let article = this.state.articles.filter(singleArticle => {
      return (
        singleArticle[0].toNumber() ===
        Number(e.target.attributes.getNamedItem("data-id").value)
      );
    })[0];

    if (article) {
      this.state.sellStuffInstance
        .buyArticle(article[0].toNumber(), {
          from: this.state.coinbase,
          value: article[5].toNumber(),
          gas: 1000000
        })
        .catch(error => {
          console.log("cant buy", error);
        });
    }
  };

  renderArticleList = () => {
    const articleList = this.state.articles.map(article => {
      // eslint-disable-next-line

      const articleId = article[0].toNumber();

      return (
        <div key={articleId}>
          <p>Title: {article[3]}</p>
          <p>Description: {article[4]}</p>
          <p>
            Seller: {article[1] === this.state.coinbase ? "You" : article[1]}
          </p>
          <p>
            Value(Eth):
            {this.state.web3.fromWei(article[5].toNumber(), "ether")}
          </p>

          {article[1] !== this.state.coinbase ? (
            <div>
              <p>For Sale!</p>
              <button onClick={this.buyButtonHandler} data-id={articleId}>
                Buy Now
              </button>
            </div>
          ) : null}
        </div>
      );
    });
    return articleList;
  };

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">
            Truffle Box
          </a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              {this.renderEvent()}
              <h1>Good to Go!</h1>
              <p style={{ display: "block" }}>
                Balance:{this.state.coinbaseBalance}
              </p>
              <p
                style={{
                  display: "block"
                }}
              >
                Account Address:{this.state.coinbase}
              </p>
              <h1>Articles List</h1>
              {this.renderArticleList()}
              <br />
              <div>
                <h1>Add Article</h1>
                <form onSubmit={this.formHandler}>
                  <label>Title</label>
                  <input
                    type="text"
                    id="title"
                    value={this.state.formTitle}
                    onChange={e => {
                      this.handleFormChange(e, "title");
                    }}
                  />
                  <br />
                  <label>Description</label>
                  <input
                    type="text"
                    id="description"
                    value={this.state.formDescription}
                    onChange={e => {
                      this.handleFormChange(e, "description");
                    }}
                  />
                  <br />
                  <label>Value</label>
                  <input
                    type="text"
                    id="value"
                    value={this.state.formValue}
                    onChange={e => {
                      this.handleFormChange(e, "value");
                    }}
                  />
                  <button type="submit">Send this shit</button>
                </form>
              </div>
              <div>
                <h1>Events</h1>
                <ul> {this.state.eventsList}</ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
