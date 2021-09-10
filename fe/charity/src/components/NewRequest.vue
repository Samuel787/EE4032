<template>
  <div class="New Request">
    <div>Submit a new request for {{ address }}</div>
    <div>
      Request Amount
      <input
        type="number"
        step=".01"
        v-model="requestAmount"
        placeholder="1"
        min="0"
      />Ether
    </div>
    <div>
      Reason & Proof
      <input v-model="proof" placeholder="Insert reason/proof here" />
    </div>
    <button @click="postRequest" >Upload request</button>
  </div>
</template>

<script>
export default {
  name: "NewRequest",
  props: ["provider", "ethers", "contract"],
  data() {
    return {
      address: undefined,
      requestAmount: 1,
      proof: undefined,
      signer: undefined,
    };
  },
  async mounted() {
    const signer = this.provider.getSigner();
    this.signer = signer;
    this.address = await signer.getAddress();
  },
  methods: {
    postRequest: function() {
      const contract = this.contract.connect(this.signer);
      contract.new_request(
        this.ethers.utils.parseEther(this.requestAmount.toString()),
        this.proof
      ).then(async(res) => {
        console.log(res)
        this.msg = "Request uploaded! Tx hash: " + res.hash
      })
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
