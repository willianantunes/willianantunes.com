---
id: befb01c0-6684-11ec-a37a-4925a3e189c4
title: How to set up an Ethereum Node with Light Mode using Docker
date: 2021-12-26T20:04:01.287Z
cover: /assets/posts/blog-13-how-to-set-up-an-ethereum-node-with-light-mode-using-docker.png
description: Just fire one single command and run your light Ethereum node.
  Don't know how to do it? No problem! Step by and learn how!
tags:
  - ethereum
  - web3
  - cryptocurrency
  - nodes
---
I already use [Bitcoin Core](https://github.com/bitcoin/bitcoin) for studying purposes. You can check [how I've been installing it](https://github.com/willianantunes/personal-environment/blob/1c933779687e8ad122bb7b62b5f3b5184119b72b/src/scripts/languages_and_related_tools.sh#L76-L87). However, with the rise of [Web3](https://en.wikipedia.org/wiki/Web3), one of the most famous buzzwords currently circulating on the internet, I thought it was time to take another step into something different, like understanding how Ethereum works so one can interact with it to create applications. As it always worked for me, I tend to go over practice while reading a thing's documentation. To avoid doing things blindly as the topic is totally different from the ones I'm used to, I read all [the foundational topics about Ethereum Development](https://ethereum.org/en/developers/docs/) before touching anything.

## Choosing a client

So, on the [Nodes and Clients](https://ethereum.org/en/developers/docs/nodes-and-clients/) page, I understood that I needed a client application to run a node on my own, pretty much like [Bitcoin needs to](https://bitcoin.org/en/full-node#setup-a-full-node), and there are many options. So which one should I pick? Just to list some of them:

* [Geth](https://geth.ethereum.org/)
* [Nethermind](http://nethermind.io/)
* [Besu](https://pegasys.tech/solutions/hyperledger-besu/)
* [Erigon](https://github.com/ledgerwatch/erigon)

Just because it's the original implementation of the Ethereum protocol, I chose Go Ethereum (Geth for short). Beyond that, it's the most widespread client, so it's a good idea to start with something solid and well-known. 

Its documentation describes [many container images](https://geth.ethereum.org/docs/install-and-build/installing-geth#run-inside-docker-container) that you can use, though lacking detailed explanations about how to execute it with an opinionated configuration through Compose. Let's create one!

## Creating a Dockerfile

Before running the container to test things, first, I looked at [its Dockerfile](https://github.com/ethereum/go-ethereum/blob/356bbe343a30789e77bb38f25983c8f2f2bfbb47/Dockerfile#L21). Unfortunately, it creates no dedicated user and runs as root by default, which is [a problem in terms of security](https://security.stackexchange.com/a/102350). Run the command below and see it by yourself:

```shellsession
▶ docker run --entrypoint /bin/sh --rm -it ethereum/client-go:stable
/ # whoami
root
```

After testing in the container itself, I created the following Dockerfile:

```dockerfile
ARG CUSTOM_USER=aladdin

FROM ethereum/client-go:stable

ARG CUSTOM_USER

RUN addgroup -S "$CUSTOM_USER"

RUN adduser \
    --disabled-password \
    --gecos "" \
    --ingroup "$CUSTOM_USER" \
    "$CUSTOM_USER"

WORKDIR /home/$CUSTOM_USER

USER "$CUSTOM_USER"
```

## Creating the Compose file

To understand all the options available in Geth, we can execute the following command:

```shell
docker run --rm -it ethereum/client-go:stable --help
```

The idea is to run a node with [synchronization mode as light](https://github.com/ethereum/ethereum-org-website/blob/d6a72e94fcda11cf09ecd77d7f18f75acb892cb7/src/content/developers/docs/nodes-and-clients/index.md#light-node-light-node) and interact with the Ethereum network through some API; thus, I came up with the following Compose file:

```yaml
version: "3.8"

services:
  ethereum-geth:
    build:
      context: .
    user: "$USER:$GROUP"
    volumes:
      - ./eth:/home/aladdin/.ethereum
      # https://github.com/compose-spec/compose-spec/blob/e8db8022c0b2e3d5eb007d629ff684cbe49a17a4/spec.md#short-syntax-4
      - '/etc/passwd:/etc/passwd:ro'
      - '/etc/group:/etc/group:ro'
    ports:
      # HTTP server / GraphQL API
      - 8545:8545
      # WebSocket
      - 8546:8546
      # Network listening port (P2P networking)
      - 30303:30303
    command:
      [
        # Blockchain sync mode ("snap", "full" or "light")
        "--syncmode=light",
        # Megabytes of memory allocated to internal caching
        "--cache=8192",
        # Enable the WS-RPC server
        "--ws",
        "--ws.addr=0.0.0.0",
        # Enable the HTTP-RPC server
        "--http",
        "--http.addr=0.0.0.0",
        "--http.vhosts=*",
        # Enable GraphQL on the HTTP-RPC server. Note that GraphQL can only be started if an HTTP server is started as well.
        "--graphql",
        "--graphql.vhosts=*",
        # Enable metrics collection and reporting
        "--metrics",
        # Ethereum mainnet
        "--mainnet",
        # Maximum number of network peers (network disabled if set to 0) (default: 50)
        "--maxpeers=30",
        # Data directory for the databases and keystore (default: "/root/.ethereum")
        "--datadir=/home/aladdin/.ethereum"
      ]
```

If you look at the [volume section](https://github.com/willianantunes/tutorials/blob/2bbc8a0722b3dc3d7afc7c6ec9e66386ad7c1493/2021/12/how-to-set-up-ethereum-node-using-docker/docker-compose.yaml#L8), you'll see it will mount the directory responsible for storing the database and the keystore. If we don't do that, we won't be able to keep the state, so it's a must. By the way, the other [two volumes](https://github.com/willianantunes/tutorials/blob/2bbc8a0722b3dc3d7afc7c6ec9e66386ad7c1493/2021/12/how-to-set-up-ethereum-node-using-docker/docker-compose.yaml#L11-L12) are just [a trick to execute the container using my current user](https://stackoverflow.com/a/66112924/3899136). 

## Running the node and exploring it

Finally, we're ready to go! Let's run it. You'll see something like this:

```shellsession
▶ mkdir -p eth && USER=$(id -u) GROUP=$(id -g) docker-compose up
Recreating how-to-set-up-ethereum-node-using-docker_ethereum-geth_1 ... done
Attaching to how-to-set-up-ethereum-node-using-docker_ethereum-geth_1
ethereum-geth_1  | INFO [12-26|19:55:22.225] Starting Geth on Ethereum mainnet... 
ethereum-geth_1  | INFO [12-26|19:55:22.225] Enabling metrics collection 
ethereum-geth_1  | INFO [12-26|19:55:22.227] Maximum peer count                       ETH=0 LES=10 total=30
ethereum-geth_1  | INFO [12-26|19:55:22.227] Smartcard socket not found, disabling    err="stat /run/pcscd/pcscd.comm: no such file or directory"
ethereum-geth_1  | INFO [12-26|19:55:22.227] Set global gas cap                       cap=50,000,000
ethereum-geth_1  | INFO [12-26|19:55:22.233] Allocated cache and file handles         database=/home/aladdin/.ethereum/geth/lightchaindata cache=4.00GiB handles=524,288
ethereum-geth_1  | INFO [12-26|19:55:22.246] Allocated cache and file handles         database=/home/aladdin/.ethereum/geth/les.client cache=16.00MiB handles=16
ethereum-geth_1  | INFO [12-26|19:55:22.249] Writing custom genesis block 
ethereum-geth_1  | INFO [12-26|19:55:22.372] Persisted trie from memory database      nodes=12356 size=1.78MiB time=28.150243ms gcnodes=0 gcsize=0.00B gctime=0s livenodes=1 livesize=0.00B
ethereum-geth_1  | INFO [12-26|19:55:22.373] Initialised chain configuration          config="{ChainID: 1 Homestead: 1150000 DAO: 1920000 DAOSupport: true EIP150: 2463000 EIP155: 2675000 EIP158: 2675000 Byzantium: 4370000 Constantinople: 7280000 Petersburg: 7280000 Istanbul: 9069000, Muir Glacier: 9200000, Berlin: 12244000, London: 12965000, Arrow Glacier: 13773000, MergeFork: <nil>, Engine: ethash}"
ethereum-geth_1  | INFO [12-26|19:55:22.373] Disk storage enabled for ethash caches   dir=/home/aladdin/.ethereum/geth/ethash count=3
ethereum-geth_1  | INFO [12-26|19:55:22.373] Disk storage enabled for ethash DAGs     dir=/home/willianantunes/.ethash        count=2
ethereum-geth_1  | INFO [12-26|19:55:22.373] Added trusted checkpoint                 block=13,565,951 hash=8aa8e6..200083
ethereum-geth_1  | INFO [12-26|19:55:22.373] Loaded most recent local header          number=0 hash=d4e567..cb8fa3 td=17,179,869,184 age=52y8mo3w
ethereum-geth_1  | INFO [12-26|19:55:22.373] Configured checkpoint oracle             address=0x9a9070028361F7AAbeB3f2F2Dc07F82C4a98A02a signers=5 threshold=2
ethereum-geth_1  | INFO [12-26|19:55:22.373] Gasprice oracle is ignoring threshold set threshold=2
ethereum-geth_1  | WARN [12-26|19:55:22.374] Error reading unclean shutdown markers   error="leveldb: not found"
ethereum-geth_1  | INFO [12-26|19:55:22.376] Starting peer-to-peer node               instance=Geth/v1.10.14-stable-11a3a350/linux-amd64/go1.17.5
ethereum-geth_1  | INFO [12-26|19:55:22.390] New local node record                    seq=1,640,548,522,390 id=b2923f7363ed1061 ip=127.0.0.1 udp=30303 tcp=30303
ethereum-geth_1  | INFO [12-26|19:55:22.391] Started P2P networking                   self=enode://43b021b78b55472cd2fc231591338ce58c88f07152ba8d9636fca7ce02131c382dc8d74e5653d16c70f38a99ee93836b18d9e150c06aada7d6429e9aad69933d@127.0.0.1:30303
ethereum-geth_1  | INFO [12-26|19:55:22.391] IPC endpoint opened                      url=/home/aladdin/.ethereum/geth.ipc
ethereum-geth_1  | INFO [12-26|19:55:22.392] HTTP server started                      endpoint=[::]:8545 prefix= cors= vhosts=*
ethereum-geth_1  | INFO [12-26|19:55:22.392] GraphQL enabled                          url=http://[::]:8545/graphql
ethereum-geth_1  | INFO [12-26|19:55:22.392] GraphQL UI enabled                       url=http://[::]:8545/graphql/ui
ethereum-geth_1  | INFO [12-26|19:55:22.392] WebSocket enabled                        url=ws://[::]:8546
ethereum-geth_1  | WARN [12-26|19:55:22.392] Light client mode is an experimental feature
```

While it is running, you can explore the client issuing many commands; for instance, you can [create a new account (wallet)](https://geth.ethereum.org/docs/interface/managing-your-accounts):

```shellsession
▶ USER=$(id -u) GROUP=$(id -g) docker-compose run ethereum-geth --datadir /home/aladdin/.ethereum account new
Creating how-to-set-up-ethereum-node-using-docker_ethereum-geth_run ... done
INFO [12-26|19:56:14.216] Maximum peer count                       ETH=50 LES=0 total=50
INFO [12-26|19:56:14.217] Smartcard socket not found, disabling    err="stat /run/pcscd/pcscd.comm: no such file or directory"
Your new account is locked with a password. Please give a password. Do not forget this password.
Password: 
Repeat password: 

Your new key was generated

Public address of the key:   0x5926553a65bACF63B0194b7Aeb2928CAbf43C4aB
Path of the secret key file: /home/aladdin/.ethereum/keystore/UTC--2021-12-26T19-56-35.276306583Z--5926553a65bacf63b0194b7aeb2928cabf43c4ab

- You can share your public address with anyone. Others need it to interact with you.
- You must NEVER share the secret key with anyone! The key controls access to your funds!
- You must BACKUP your key file! Without the key, it's impossible to access account funds!
- You must REMEMBER your password! Without the password, it's impossible to decrypt the key!
```

You can start an [interactive JavaScript environment](https://geth.ethereum.org/docs/interface/javascript-console) connected to the light node using the following:

```shellsession
▶ USER=$(id -u) GROUP=$(id -g) docker-compose run ethereum-geth --datadir /home/aladdin/.ethereum attach
Creating how-to-set-up-ethereum-node-using-docker_ethereum-geth_run ... done
Welcome to the Geth JavaScript console!

instance: Geth/v1.10.14-stable-11a3a350/linux-amd64/go1.17.5
at block: 13590527 (Wed Nov 10 2021 20:06:06 GMT+0000 (UTC))
 datadir: /home/aladdin/.ethereum
 modules: admin:1.0 debug:1.0 eth:1.0 ethash:1.0 les:1.0 net:1.0 personal:1.0 rpc:1.0 txpool:1.0 vflux:1.0 web3:1.0

To exit, press ctrl-d or type exit
> 
```

Then you'll have a variety of commands available, such as (just copy one and execute it by yourself):

```
eth.accounts
personal.newAccount("123456")
personal.listWallets
eth.accounts
eth.getBlockByHash('0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3')
web3.currentProvider
```

You can easily find documentation for these commands, such as for [web3](https://web3js.readthedocs.io/en/v1.5.2/). 

### GraphQL API

If you access `http://127.0.0.1:8545/graphql/ui`, you can execute a query like the following:

```json
{
  block(number: 0) {
    hash
    miner {
      address
      transactionCount
      balance
    }
  }
}
```

Then the following is returned:

```json
{
  "data": {
    "block": {
      "hash": "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
      "miner": {
        "address": "0x0000000000000000000000000000000000000000",
        "transactionCount": "0x0",
        "balance": "0x0"
      }
    }
  }
}
```

Check out more [example use cases for interacting with the GraphQL API](https://github.com/ConsenSys/ethql/wiki/Example-Use-Cases).

### Folder structure

Everything is being saved in `eth` folder. So how is its structure after the client runs for a while? Given we created some wallets previously, here's the output of the `tree` command on it:

```shellsession
▶ tree eth
eth
├── geth
│   ├── ethash
│   │   ├── cache-R23-1bccaca36bfde6e5
│   │   ├── cache-R23-70de525794a9c888
│   │   └── cache-R23-74efb201dab10dd5
│   ├── les.client
│   │   ├── 000001.log
│   │   ├── CURRENT
│   │   ├── LOCK
│   │   ├── LOG
│   │   └── MANIFEST-000000
│   ├── lightchaindata
│   │   ├── 000002.log
│   │   ├── 000004.ldb
│   │   ├── CURRENT
│   │   ├── LOCK
│   │   ├── LOG
│   │   └── MANIFEST-000000
│   ├── LOCK
│   ├── nodekey
│   └── nodes
│       ├── 000001.log
│       ├── CURRENT
│       ├── LOCK
│       ├── LOG
│       └── MANIFEST-000000
├── geth.ipc
├── history
└── keystore
    ├── UTC--2021-12-26T19-56-35.276306583Z--5926553a65bacf63b0194b7aeb2928cabf43c4ab
    └── UTC--2021-12-26T19-59-03.606317985Z--fa11874442f3e8681abc3b7ea95d5951393fefc7
```

## Conclusion

Something important to say for newcomers is that what we did here is just a foundation for more complex things, such as setting up an [entire private network on our own](https://geth.ethereum.org/docs/interface/private-network). By the way, what we did here can be used to set up a [testnet](https://github.com/ethereum/ethereum-org-website/blob/d6a72e94fcda11cf09ecd77d7f18f75acb892cb7/src/content/developers/docs/networks/index.md#testnets-testnets). Then we can use [Faucets](https://github.com/ethereum/ethereum-org-website/blob/d6a72e94fcda11cf09ecd77d7f18f75acb892cb7/src/content/developers/docs/networks/index.md#testnet-faucets-testnet-faucets) and utilize them without worrying about losing money. This is quite interesting if you want to explore the technology itself before using it as a way to store real tokens. Maybe I'll create more posts showing how to accomplish such things.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2021/12/how-to-set-up-ethereum-node-using-docker).

Posted listening to [The Breeze of Petal Meadows, Paper Mario: The Thousand-Year Door](https://youtu.be/3j3VL70JpBo?t=1759) 🎶.
