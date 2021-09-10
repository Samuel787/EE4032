<template>
  <div>
    <div>{{ msg }}</div>
    <button v-if="!provider" @click="enableMetamask">Enable Metamask</button>
    <div v-if="provider">
      <div>Total Donated Amount: {{ contractBalance }} Ether</div>
      <button @click="donate">Donate</button>
      <input
        type="number"
        step=".01"
        v-model="donateAmount"
        placeholder="1"
        min="0"
      />
      Ether
    </div>
    <NewRequest
      v-if="provider"
      v-bind:provider="provider"
      v-bind:contract="contract"
      v-bind:ethers="ethers"      
    />
    <div v-for="request in requests" :key="request" >
        <p v-if="donorVote == request[0]">You voted for this!</p>
        Address: {{request[0]}}
        Requesting {{ethers.utils.formatEther(request[1])}} Ether for the purpose of
        {{request[2]}}
        <button @click="vote(request[0])" v-if="voteEligible">Vote</button>
    </div>
  </div>
</template>

<script>
import NewRequest from "./components/NewRequest.vue";

import { markRaw } from "vue";
export default {
  name: "App",
  components: {
    NewRequest,
  },
  data() {
    const { ethers } = require("ethers");
    return {
      ethers: ethers,
      provider: undefined,
      contractAddress: "0x6d6cd2D017114e9e803bf86Af5909dF81109d4b5",
      contract: undefined,
      contractBalance: undefined,
      donateAmount: 1,
      msg: undefined,
      voteEligible: false,
      requests: [],
      donorVote: undefined,
      lastVoteEndTime: undefined
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
      this.requests = await this.contract.getRequests()
      const address = await this.provider.getSigner().getAddress()
      const donatedAmount = await this.contract.donatedAmount(address)
      this.donorVote = await this.contract.donorVote(address)
      this.voteEligible = donatedAmount > 0.1 && this.donorVote == 0
      this.lastVoteEndTime = await this.contract.lastVoteEndTime();
      console.log(this.lastVoteEndTime)
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
    vote: async function(requestor) {
      const signer = this.provider.getSigner();
      const contract = this.contract.connect(signer);
      contract
        .voteForRequest(requestor)
        .then(async (res) => {
          console.log(res);
          this.msg = "You have voted for " + requestor + "'s request! Tx hash: " + res.hash;
        });
    }
  },
  created() {},
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
