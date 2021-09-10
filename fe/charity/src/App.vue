<template>
  <div>
    <div>{{ msg }}</div>
    <button v-if="!provider" @click="enableMetamask">Enable Metamask</button>
    <div v-if="provider">
      <h1>Total Donated Amount: {{ contractBalance }} Ether</h1>
      <div>Time left till end of this voting round: {{ timeRemaining }}</div>
      <div>
        Winning address can withdraw between: {{ withdrawStart }} and
        {{ withdrawEnd }}
      </div>
      <button @click="donate">Donate</button>
      <input
        type="number"
        step=".01"
        v-model="donateAmount"
        placeholder="1"
        min="0"
      />
      Ether
      <div v-if="showWithdraw">
        Congrats you were the winning request last round!
        <button @click="withdraw">Withdraw</button>
      </div>
    </div>
    <NewRequest
      v-if="provider"
      v-bind:provider="provider"
      v-bind:contract="contract"
      v-bind:ethers="ethers"
    />
    <div v-for="request in requests" :key="request">
      <div v-if="request[0] != 0">
        <div v-if="winningRequest && winningRequest[0] == request[0]">
          This is the currently winning request!
        </div>
        <div v-if="userAddress == request[0]">This is your request!</div>
        <div v-if="donorVote == request[0]">You voted for this!</div>
        Address: {{ request[0] }} Requesting
        {{ ethers.utils.formatEther(request[1]) }} Ether for the purpose of
        {{ request[2] }}
        has {{ request[3] }} vote(s)
        <button @click="vote(request[0])" v-if="voteEligible">Vote</button>
      </div>
    </div>
    <p>Frontend built by Lucas Foo</p>
  </div>
</template>

<script>
import NewRequest from "./components/NewRequest.vue";
const { ethers } = require("ethers");
const moment = require("moment");

import { markRaw } from "vue";
export default {
  name: "App",
  components: {
    NewRequest,
  },
  data() {
    return {
      ethers: ethers,
      provider: undefined,
      userAddress: undefined,
      contractAddress: "0x6d6cd2D017114e9e803bf86Af5909dF81109d4b5",
      contract: undefined,
      contractBalance: undefined,
      donateAmount: 1,
      msg: undefined,
      voteEligible: false,
      requests: [],
      donorVote: undefined,
      lastRoundDate: undefined,
      timeRemaining: undefined,
      withdrawStart: undefined,
      withdrawEnd: undefined,
      winningRequest: undefined,
      allowWithdraw: false,
      showWithdraw: false,
    };
  },
  methods: {
    enableMetamask: async function () {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      this.provider = markRaw(
        new this.ethers.providers.Web3Provider(window.ethereum)
      );
      this.contractBalance = this.ethers.utils.formatEther(
        await this.provider.getBalance(this.contractAddress)
      );
      const charityAbi = require("../../../build/contracts/Charity.json");
      this.contract = markRaw(
        new this.ethers.Contract(
          this.contractAddress,
          charityAbi.abi,
          this.provider
        )
      );
      this.requests = await this.contract.getRequests();
      this.userAddress = await this.provider.getSigner().getAddress();
      const donatedAmount = await this.contract.donatedAmount(this.userAddress);
      this.donorVote = await this.contract.donorVote(this.userAddress);
      this.voteEligible = donatedAmount > 0.1 && this.donorVote == 0;
      const lastVoteEndTime = await this.contract.getLastVoteEndTime();
      this.lastRoundDate = new Date(lastVoteEndTime.toNumber() * 1000);
      this.withdrawStart = moment(this.lastRoundDate).add(5, "minutes");
      this.withdrawEnd = moment(this.lastRoundDate).add(7, "minutes");
      this.timeRemaining = moment(this.lastRoundDate)
        .add(5, "minutes")
        .fromNow();
      if (this.requests.length > 0)
        this.winningRequest = await this.contract.getWinningRequest();
      console.log(this.winningRequest)
      if(this.winningRequest[0] == this.userAddress && new Date() > this.withdrawStart)
        this.showWithdraw = true
    },
    donate: async function () {
      const signer = this.provider.getSigner();
      const contract = this.contract.connect(signer);
      contract
        .donate({
          value: this.ethers.utils.parseEther(this.donateAmount.toString()),
        })
        .then(async (res) => {
          console.log(res);
          this.msg = "Thank you for your donation! Tx hash: " + res.hash;
          this.contractBalance = this.ethers.utils.formatEther(
            await this.provider.getBalance(this.contractAddress)
          );
        });
    },
    vote: async function (requestor) {
      const signer = this.provider.getSigner();
      const contract = this.contract.connect(signer);
      contract.voteForRequest(requestor).then(async (res) => {
        console.log(res);
        this.msg =
          "You have voted for " +
          requestor +
          "'s request! Tx hash: " +
          res.hash;
      });
    },
    withdraw: async function () {
      const signer = this.provider.getSigner();
      const contract = this.contract.connect(signer);
      contract.withdraw();
    },
  },
  mounted() {
    this.enableMetamask()
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
