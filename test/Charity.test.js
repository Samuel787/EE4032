const { expect, assert } = require("chai");
const { expectRevert, time } = require("@openzeppelin/test-helpers");
const { address } = require("faker");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const Charity = artifacts.require("Charity");

describe("Charity Contract", () => {
  contract("Charity", function (accounts) {
    let charityInstance;
    let contractAddress;
    before(async ()=> {
      accounts = await web3.eth.getAccounts();
      charityInstance = await Charity.deployed();
      contractAddress = charityInstance.address;
      console.log(contractAddress);
    });

    it("should be able to submit a new request", async ()=> {
      await charityInstance.new_request.sendTransaction(
        web3.utils.toWei("3"),
        "Very sus proof",
        { from: accounts[9] }
      );
      await charityInstance.new_request.sendTransaction(
        web3.utils.toWei("4"),
        "not sus proof",
        { from: accounts[8] }
      );
      await charityInstance.new_request.sendTransaction(
        web3.utils.toWei("5"),
        "kinda sus proof",
        { from: accounts[7] }
      );
      await charityInstance.new_request.sendTransaction(
        web3.utils.toWei("6"),
        "sus proof",
        { from: accounts[5] }
      );
      await charityInstance.new_request.sendTransaction(
        web3.utils.toWei("6"),
        "legit proof",
        { from: accounts[4] }
      );
      // console.log(await charityInstance.getRequests())
      // assert.equal(await charityInstance.requesters(0), accounts[9])
      // console.log(await charityInstance.requests(accounts[9]))
    });

    it("should update donors list and keep track of donated amount", async ()=> {
      await charityInstance.donate.sendTransaction({
        from: accounts[0],
        value: web3.utils.toWei("30"),
      });
      assert.equal(
        await web3.eth.getBalance(contractAddress),
        web3.utils.toWei("30")
      );
      assert.equal(await charityInstance.donors(0), accounts[0]);
      assert.equal(
        await charityInstance.donatedAmount(accounts[0]),
        web3.utils.toWei("30")
      );
      await charityInstance.donate.sendTransaction({
        from: accounts[1],
        value: web3.utils.toWei("10"),
      });
      await charityInstance.donate.sendTransaction({
        from: accounts[2],
        value: web3.utils.toWei("20"),
      });
      await charityInstance.donate.sendTransaction({
        from: accounts[3],
        value: web3.utils.toWei("40"),
      });
    });

    it("should prevent donations less that 0.01 eth", async ()=> {
      await expectRevert(
        charityInstance.donate.sendTransaction({
          from: accounts[0],
          value: web3.utils.toWei("0.005"),
        }),
        "you have to donate more than 0.01 ETH!"
      );
    });

    it("should be able to vote", async ()=> {
      await charityInstance.voteForRequest.sendTransaction(accounts[4]);
      assert.equal(
        await charityInstance.requestorDonors(accounts[4], 0),
        accounts[0]
      );
      //vote for a few more times for account 4, a few more for the others also
    });

    it("should be able to detect non-existent requests", async () => {
      await expectRevert(
        charityInstance.voteForRequest.sendTransaction(accounts[3]),
        "request does not exist"
      );
    });

    it("should not be able to vote after voting", async ()=> {
      await expectRevert(
        charityInstance.voteForRequest.sendTransaction(accounts[4]),
        "you have already voted"
      );
      //vote for a few more times for account 4, a few more for the others also
    });

    it("should be able to handle more votes", async ()=> {
      await charityInstance.voteForRequest.sendTransaction(accounts[4], {
        from: accounts[1],
      });
      await charityInstance.voteForRequest.sendTransaction(accounts[9], {
        from: accounts[2],
      });
      await charityInstance.voteForRequest.sendTransaction(accounts[4], {
        from: accounts[3],
      });
    });

    it("should be able to get correct winning address", async ()=> {
        console.log(await charityInstance.getRequests())
        assert.equal(await charityInstance.getWinningRequestAddress(), accounts[4]);
    });


    it("winning requester should not be able to withdraw early", async ()=> {
        await expectRevert(
            charityInstance.withdraw({
              from: accounts[4],
            }),
            "the round has not ended yet!"
          );
    });

    it("non winning requester should not be able to withdraw", async ()=> {
        await time.increase(time.duration.days(1));
        await expectRevert(
            charityInstance.withdraw({
              from: accounts[9],
            }),
            "You do not have the most votes this round :("
          );
    });

    it("requester should be able to withdraw", async ()=> {
        await charityInstance.withdraw({
            from: accounts[4],
          }) 
      assert(web3.eth.getBalance(accounts[4]) > web3.utils.toWei('105'));
    });

    it("requester's request should be able removed", async ()=> {
      
    });

    it("donors should be removed after withdrawal of winning request", async()=>{})

    it("donors should be able to vote again if winning request is a stale request",async()=>{})

    it("donation excess after withdrawal should be used for the next winning request",async()=>{})
  });
});
