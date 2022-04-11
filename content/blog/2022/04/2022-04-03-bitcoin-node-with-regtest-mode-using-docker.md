---
id: 00f144b0-b39a-11ec-8656-7922fea69c31
title: Bitcoin Node with RegTest mode using Docker
date: 2022-04-03T22:18:30.183Z
cover: /assets/posts/blog-19-bitcoin-node-with-regtest-mode-using-docker.png
description: Are you curious about Bitcoin but haven't started any study?
  Containerization makes it a lot easier. So let's see how we can create a
  private blockchain!
tags:
  - cryptocurrency
  - nodes
  - bitcoin
---
Recently I explained [how you can run an Ethereum node using Docker](https://www.willianantunes.com/blog/2021/12/how-to-set-up-an-ethereum-node-with-light-mode-using-docker/); now it's time to do the same thing but with Bitcoin! We'll follow the same principles, including how you can set up your wallet and use it to receive and send transactions. This time, I'll try to be as brief as possible, mainly showing the commands, expected results, and comments if needed. I think the course [Learning Bitcoin from the Command Line](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line) has everything you need in terms of more in-depth explanations. So let's get started 🚀!

## Bitcoin Core as Compose Service

You can [check out the project](https://github.com/willianantunes/tutorials/tree/master/2022/04/bitcoin-node-regtest-mode-docker) I created on GitHub. It was possible thanks to Rui Marinho, who made one of [the most famous container images for Bitcoin Core](https://github.com/ruimarinho/docker-bitcoin-core). We'll use it to do our explorations.

## Testing everything on RegTest

We can opt-in for the test network (testnet) or the main network (mainnet) when we want to play for real. For the former, we can get [some money through faucets](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/ff4d5167f8ab5dfc95aa45dadc325ad5f8989b76/03_4_Receiving_a_Transaction.md#get-some-money), which requires external procedures before executing any tests. The thing is: why play with random peers if we can use the [regression test mode](https://developer.bitcoin.org/examples/testing.html#regtest-mode)? This approach allows us to have our private blockchain. With that, we have complete control over the environment. Therefore, [using Bitcoin RegTest](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/8598756ae138608b21082d210f4f638a4507c67d/A3_0_Using_Bitcoin_Regtest.md#appendix-iii-using-bitcoin-regtest) is a must when creating bitcoin applications and testing Bitcoin concepts with complete control.

### Starting the node

At the root folder of the project, issue the following command:

```shell
UID=$UID GID=$GID docker-compose up bitcoin-core-regtest
```

We'll have something similar to the output:

```shell
bitcoin-core-regtest_1  | /entrypoint.sh: assuming bitcoin user:group 1000:1000
bitcoin-core-regtest_1  | /entrypoint.sh: assuming arguments for bitcoind
bitcoin-core-regtest_1  | /entrypoint.sh: setting data directory to /home/bitcoin/.bitcoin
bitcoin-core-regtest_1  | 
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Bitcoin Core version v22.0.0 (release build)
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Validating signatures for all blocks.
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Setting nMinimumChainWork=0000000000000000000000000000000000000000000000000000000000000000
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using the 'shani(1way,2way)' SHA256 implementation
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using RdSeed as additional entropy source
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using RdRand as an additional entropy source
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Default data directory /home/bitcoin/.bitcoin
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using data directory /home/bitcoin/.bitcoin/regtest
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Config file: /home/bitcoin/.bitcoin/bitcoin.conf (not found, skipping)
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Command-line arg: datadir="/home/bitcoin/.bitcoin"
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Command-line arg: printtoconsole=""
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Command-line arg: regtest="1"
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using at most 125 automatic connections (1048576 file descriptors available)
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using 16 MiB out of 32/2 requested for signature cache, able to store 524288 elements
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using 16 MiB out of 32/2 requested for script execution cache, able to store 524288 elements
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Script verification uses 7 additional threads
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z scheduler thread start
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z libevent: getaddrinfo: address family for nodename not supported
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Binding RPC on address ::1 port 18443 failed.
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z HTTP: creating work queue of depth 16
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using random cookie authentication.
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Generated RPC authentication cookie /home/bitcoin/.bitcoin/regtest/.cookie
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z HTTP: starting 4 worker threads
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using wallet directory /home/bitcoin/.bitcoin/regtest/wallets
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z init message: Verifying wallet(s)…
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z init message: Loading banlist…
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Missing or invalid file /home/bitcoin/.bitcoin/regtest/banlist.dat
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Recreating the banlist database
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z SetNetworkActive: true
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Failed to read fee estimates from /home/bitcoin/.bitcoin/regtest/fee_estimates.dat. Continue anyway.
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using /16 prefix for IP bucketing
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Cache configuration:
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z * Using 2.0 MiB for block index database
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z * Using 8.0 MiB for chain state database
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z * Using 440.0 MiB for in-memory UTXO set (plus up to 286.1 MiB of unused mempool space)
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z init message: Loading block index…
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Switching active chainstate to Chainstate [ibd] @ height -1 (null)
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Opening LevelDB in /home/bitcoin/.bitcoin/regtest/blocks/index
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Opened LevelDB successfully
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using obfuscation key for /home/bitcoin/.bitcoin/regtest/blocks/index: 0000000000000000
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z LoadBlockIndexDB: last block file = 0
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z LoadBlockIndexDB: last block file info: CBlockFileInfo(blocks=0, size=0, heights=0...0, time=1970-01-01...1970-01-01)
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Checking all blk files are present...
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Initializing databases...
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Opening LevelDB in /home/bitcoin/.bitcoin/regtest/chainstate
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Opened LevelDB successfully
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Wrote new obfuscate key for /home/bitcoin/.bitcoin/regtest/chainstate: 2309573c3bedc418
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Using obfuscation key for /home/bitcoin/.bitcoin/regtest/chainstate: 2309573c3bedc418
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z  block index               6ms
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z loadblk thread start
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z UpdateTip: new best=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206 height=0 version=0x00000001 log2_work=1.000000 tx=1 date='2011-02-02T23:16:42Z' progress=1.000000 cache=0.0MiB(0txo)
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z block tree size = 1
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z nBestHeight = 0
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Failed to open mempool file from disk. Continuing anyway.
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z loadblk thread exit
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z torcontrol thread start
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Bound to 127.0.0.1:18445
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Bound to [::]:18444
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Bound to 0.0.0.0:18444
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z init message: Loading P2P addresses…
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Missing or invalid file /home/bitcoin/.bitcoin/regtest/peers.dat
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Recreating peers.dat
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z Missing or invalid file /home/bitcoin/.bitcoin/regtest/anchors.dat
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z 0 block-relay-only anchors will be tried for connections.
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z init message: Starting network threads…
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z net thread start
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z dnsseed thread start
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z addcon thread start
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z 0 addresses found from DNS seeds
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z dnsseed thread exit
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z init message: Done loading
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z opencon thread start
bitcoin-core-regtest_1  | 2022-04-03T18:59:13Z msghand thread start
```

As we're [mapping the `btc` folder as a volume for `.bitcoin`](https://github.com/willianantunes/tutorials/blob/1cfb39ff5e39bdd52150c2c6f7b7e231780e0930/2022/04/bitcoin-node-regtest-mode-docker/docker-compose.yaml#L10), we can easily check the folder contents in the host machine. It's important to [know the bitcoin directory](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/5f0e49e8185d1a28318b0f37b996f15d041458b5/03_2_Knowing_Your_Bitcoin_Setup.md#know-your-bitcoin-directory). Here's its initial contents:

```
btc
└── regtest
    ├── banlist.json
    ├── bitcoind.pid
    ├── blocks
    │   ├── blk00000.dat
    │   └── index
    │       ├── 000003.log
    │       ├── CURRENT
    │       ├── LOCK
    │       └── MANIFEST-000002
    ├── chainstate
    │   ├── 000003.log
    │   ├── CURRENT
    │   ├── LOCK
    │   └── MANIFEST-000002
    ├── debug.log
    ├── peers.dat
    ├── settings.json
    └── wallets
```

Before going ahead, let's get attached to the container:

```shell
docker-compose exec --user bitcoin bitcoin-core-regtest sh
```

### Creating wallets and their addresses

Let's create two wallets, one for *Iago* and another for *Jafar*. The commands with their corresponding results:

```shell
$ bitcoin-cli -regtest createwallet "iago"
{
  "name": "iago",
  "warning": ""
}
$ bitcoin-cli -regtest createwallet "jafar"
{
  "name": "jafar",
  "warning": ""
}
```

If you list the addresses from Iago's wallet, you receive an empty array:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago listreceivedbyaddress 1 true
[
]
```

Let's create one address for each wallet:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago getnewaddress
bcrt1q7c6h8a4n6tvmkfcwhpe9gvpefgyfec2t75vwru
$ bitcoin-cli -regtest -rpcwallet=jafar getnewaddress
bcrt1qj28d8v3528ygqpjt2dp436sx3dhn7x5qwxnyc9
```

Now let's see the addresses from Iago's wallet again:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago listreceivedbyaddress 1 true
[
  {
    "address": "bcrt1q7c6h8a4n6tvmkfcwhpe9gvpefgyfec2t75vwru",
    "amount": 0.00000000,
    "confirmations": 0,
    "label": "",
    "txids": [
    ]
  }
]
```

By the way, how is our `btc` folder?

```
btc
└── regtest
    ├── banlist.json
    ├── bitcoind.pid
    ├── blocks
    │   ├── blk00000.dat
    │   └── index
    │       ├── 000003.log
    │       ├── CURRENT
    │       ├── LOCK
    │       └── MANIFEST-000002
    ├── chainstate
    │   ├── 000003.log
    │   ├── CURRENT
    │   ├── LOCK
    │   └── MANIFEST-000002
    ├── debug.log
    ├── peers.dat
    ├── settings.json
    └── wallets
        ├── iago
        │   ├── database
        │   │   ├── log.0000000003
        │   │   └── log.0000000004
        │   ├── db.log
        │   └── wallet.dat
        └── jafar
            ├── database
            │   ├── log.0000000003
            │   └── log.0000000004
            ├── db.log
            └── wallet.dat
```

Notice that `bitcoind` created two folders inside the wallets folder. By the way, I'm saying `bitcoind` instead of `bitcoin-cli` because [it is just an interface to interact with the `bitcoind`](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/ff4d5167f8ab5dfc95aa45dadc325ad5f8989b76/01_1_Introducing_Bitcoin.md#about-bitcoin).

### Receiving a block reward of 50 bitcoins

Let's use the command below to send 50 bitcoins to one address of Iago's wallet:

```shell
$ bitcoin-cli -regtest generatetoaddress 101 bcrt1q7c6h8a4n6tvmkfcwhpe9gvpefgyfec2t75vwru
[
  "06fb898d3f32545bd098e41736595841d7dbf149a44a9f80b4c8eb7fdcd5669d",
  "4f98e6d2d322c0107470d4dfc5b779de766ef8e558fce666875afb9ecbac769b",
  ...
  "26374885c6f95a845763e91a65ec0dc9e033d7ae77259afd399265d03b7abc1e",
  "24188db36163964fe5addf6fd5a7d4d5862af19c492521c49ada5f476ae1aa88"
]
```

Why 101 blocks? I strongly recommend reading [this explanation](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/8598756ae138608b21082d210f4f638a4507c67d/A3_0_Using_Bitcoin_Regtest.md#generate-blocks). Let's see Iago and Jafar's balance:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago getbalance
50.00000000
$ bitcoin-cli -regtest -rpcwallet=jafar getbalance
0.00000000
```

Verify that Iago now has 50 bitcoins available to spend.

### Sending coins from Iago to Jafar

Let's send 15 bitcoins to Jafar. We'll receive a transaction ID when the command executes with success.

```shell
$ bitcoin-cli -regtest -rpcwallet=iago -named sendtoaddress \
  address=bcrt1qj28d8v3528ygqpjt2dp436sx3dhn7x5qwxnyc9 \
  amount=15 \
  fee_rate=1000
d153b10e8eb4b348ab384e1888984c73f7dfc47508a1953eab3b63da65094a76
```

We can verify the transaction details using the following command:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago gettransaction d153b10e8eb4b348ab384e1888984c73f7dfc47508a1953eab3b63da65094a76
{
  "amount": -15.00000000,
  "fee": -0.00141000,
  "confirmations": 0,
  "trusted": true,
  "txid": "d153b10e8eb4b348ab384e1888984c73f7dfc47508a1953eab3b63da65094a76",
  "walletconflicts": [
  ],
  "time": 1649019280,
  "timereceived": 1649019280,
  "bip125-replaceable": "yes",
  "details": [
    {
      "address": "bcrt1qj28d8v3528ygqpjt2dp436sx3dhn7x5qwxnyc9",
      "category": "send",
      "amount": -15.00000000,
      "vout": 0,
      "fee": -0.00141000,
      "abandoned": false
    }
  ],
  "hex": "02000000000101088b5f16757036ad973ddf2a1976adf8da9d34760bb60eefc54e545dbbab1f050000000000fdffffff02002f685900000000160014928ed3b23451c880064b534358ea068b6f3f1a80389c9bd000000000160014e411bdf3c91885417786a671d60d4fc45bc3cb36024730440220190e8feceed5158a09bfb1bb0b80629303a19767c6e3422f7e1e723fd66bb03602204c37b9681044a9c7e8061b453b99b64fa024fdba858411daf949f1ee2c69329a0121036389b1d5744b6227ca7a20b7da24445328964e454b66c9ed31bf1a17d64b1f1e65000000"
}
```

Let's check Iago and Jafar's balance; we'll include the unconfirmed ones also:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago getbalance
34.99859000
$ bitcoin-cli -regtest -rpcwallet=iago getunconfirmedbalance
0.00000000
$ bitcoin-cli -regtest -rpcwallet=jafar getbalance
0.00000000
$ bitcoin-cli -regtest -rpcwallet=jafar getunconfirmedbalance
15.00000000
```

Notice Jafar does not have 15 BTC still. If you look at the `confirmations` value in the transaction details, you'll see `0`. This is because ***RegTest*** requires at least one confirmation.

### Mining blocks

To increase the `confirmations` value to `1`, we can generate (mine) a block to confirm the transaction:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago -generate 1
{
  "address": "bcrt1q9n7hpa8980h3krwdvckf7mwjx2wegqu4p8652l",
  "blocks": [
    "3c81b2ee64937d89969e04b993746b9a551b0a419f672f33ffebf7461cb50fab"
  ]
}
```

If we recheck the transaction details, we'll see the `confirmations` value as 1:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago gettransaction d153b10e8eb4b348ab384e1888984c73f7dfc47508a1953eab3b63da65094a76
{
  "amount": -15.00000000,
  "fee": -0.00141000,
  "confirmations": 1,
  "blockhash": "3c81b2ee64937d89969e04b993746b9a551b0a419f672f33ffebf7461cb50fab",
  "blockheight": 102,
  "blockindex": 1,
  "blocktime": 1649020402,
  "txid": "d153b10e8eb4b348ab384e1888984c73f7dfc47508a1953eab3b63da65094a76",
  "walletconflicts": [
  ],
  "time": 1649019280,
  "timereceived": 1649019280,
  "bip125-replaceable": "no",
  "details": [
    {
      "address": "bcrt1qj28d8v3528ygqpjt2dp436sx3dhn7x5qwxnyc9",
      "category": "send",
      "amount": -15.00000000,
      "vout": 0,
      "fee": -0.00141000,
      "abandoned": false
    }
  ],
  "hex": "02000000000101088b5f16757036ad973ddf2a1976adf8da9d34760bb60eefc54e545dbbab1f050000000000fdffffff02002f685900000000160014928ed3b23451c880064b534358ea068b6f3f1a80389c9bd000000000160014e411bdf3c91885417786a671d60d4fc45bc3cb36024730440220190e8feceed5158a09bfb1bb0b80629303a19767c6e3422f7e1e723fd66bb03602204c37b9681044a9c7e8061b453b99b64fa024fdba858411daf949f1ee2c69329a0121036389b1d5744b6227ca7a20b7da24445328964e454b66c9ed31bf1a17d64b1f1e65000000"
}
```

Finally, the confirmed and unconfirmed balance of everyone:

```shell
$ bitcoin-cli -regtest -rpcwallet=iago getbalance
84.99859000
$ bitcoin-cli -regtest -rpcwallet=iago getunconfirmedbalance
0.00000000
$ bitcoin-cli -regtest -rpcwallet=jafar getbalance
15.00000000
$ bitcoin-cli -regtest -rpcwallet=jafar getunconfirmedbalance
0.00000000
```

## Playing for real on mainnet

What we have done so far is not sufficient. It's very high level and has [some disadvantages](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/ff4d5167f8ab5dfc95aa45dadc325ad5f8989b76/04_1_Sending_Coins_The_Easy_Way.md#summary-sending-coins-the-easy-way). When I read [about the descriptor](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/ff4d5167f8ab5dfc95aa45dadc325ad5f8989b76/03_5_Understanding_the_Descriptor.md#35-understanding-the-descriptor), I comprehended that using one is the recommended way to create a wallet. Nonetheless, the wallets we made have no passphrase, which plays a vital role in security. We also didn't talk about [key reuse](https://developer.bitcoin.org/devguide/transactions.html#avoiding-key-reuse) also. Well, I think you get the point. No mistakes are allowed; otherwise, you might lose money.

## Conclusion

Whether you're going to develop or use a full node on your own to keep your wallet, it's a must to explore Bitcoin Core's nuances. So, as I said initially, how about [Learning Bitcoin from the Command Line](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line)? 

I hope this article is just a start of a series I'm about to do regarding Bitcoin 🤓.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/04/bitcoin-node-regtest-mode-docker).

Posted listening to [Falador Passa Mal, Originais Do Samba](https://youtu.be/B3nAXARhMLg) 🎶.