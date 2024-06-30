---
id: 23442930-365e-11ef-8e68-d5de669ea6da
title: Self-hosted wallet setup with Bitcoin Core using Docker
date: 2024-06-29T21:25:41.874Z
cover: /assets/posts/blog-46-self-hosted-wallet-setup-with-bitcoin-core-using-docker.png
description: This blog post explores how to self-host a Bitcoin wallet using two
  Bitcoin Core nodes in a pruned mode configuration. This approach offers
  increased control and security.
tags:
  - bitcoin
  - cryptocurrency
---
This project is a proof of concept to demonstrate how to set up a self-hosted wallet using two Bitcoin Core nodes in pruned mode. One node***,*** [`bitcoin-core-middleware`](https://github.com/willianantunes/tutorials/blob/af52af6ff53079c579676fc1f2242f3fba98f0f0/2024/06/self-hosted-wallet-bitcoin-core-docker/docker-compose.yaml#L4), acts as a regular node with no max peer connection limit, and the other node, [`bitcoin-core-wallet`](https://github.com/willianantunes/tutorials/blob/af52af6ff53079c579676fc1f2242f3fba98f0f0/2024/06/self-hosted-wallet-bitcoin-core-docker/docker-compose.yaml#L15), acts with a max peer connection limit of 1, with no internet access. The middleware node will act as a peer to the wallet node. The wallet node is the key component for interacting with the [`wallet.dat`](https://github.com/bitcoin/bitcoin/blob/2f6dca4d1c01ee47275a4292f128d714736837a1/doc/managing-wallets.md) in the self-hosted setup. It is the node you must use to access and manage the wallet. On the other hand, the middleware node serves as a peer to the wallet node, playing a supporting role in the setup.

## Requirements

The [JSON-RPC interface](https://github.com/bitcoin/bitcoin/blob/2f6dca4d1c01ee47275a4292f128d714736837a1/doc/JSON-RPC-interface.md) of both services will be exposed with a password. Let's generate them using [`rpcauth.py`](https://github.com/willianantunes/tutorials/blob/af52af6ff53079c579676fc1f2242f3fba98f0f0/2024/06/self-hosted-wallet-bitcoin-core-docker/rpcauth.py):

```shell
python rpcauth.py jaffar
python rpcauth.py jasmine
```

Sample output:

```text
String to be appended to bitcoin.conf:
rpcauth=jafar:4fa794addec8e955123456ab93cf137c$279369610574dc4059ce1fd36b9232702ff8b8429fe6490dc856c0db02119795
Your password:
CYa-7c9-M_0_va3Qg_3vJHaimN-kiM

String to be appended to bitcoin.conf:
rpcauth=jasmine:3b821b7$17b114961abb15e83421856067a3843c15cb29fe259afaeda177b023
Your password:
Llc5yNHoZGrF4ctPPh_12dCg
```

Configure the generated `rpcauth` string in the `bitcoin.conf` file of both services. Store the password in a secure location.

### Important notice about blockchain data

If possible, copy the entire blockchain data from someone else to avoid downloading it from scratch. Let's say you have it. Then you just copy the data and paste it somewhere, for example, in a folder named `bitcoin-core-middleware`. Now, you can create a volume to mount the folder to the container. Remember to copy the provided [`bitcoin.conf`](https://github.com/willianantunes/tutorials/blob/b641324dd06b2aaa9686427b33952ea350bd0a52/2024/06/self-hosted-wallet-bitcoin-core-docker/middleware/bitcoin.conf) file to the folder. Example:

```yaml
  bitcoin-core-middleware:
    build:
      context: .
    volumes:
      - "/tmp/bitcoin_core_middleware:/home/bitcoin/.bitcoin/"
    environment:
      - UID=$UID
      - GID=$GID
    networks:
      - web
      - no-internet
```

Run the service and wait for its full synchronization until it's fully pruned. Now, you can copy the entire folder and paste it with another name, for example, `bitcoin-core-wallet`. Again, remember to copy the provided [`bitcoin.conf`](https://github.com/willianantunes/tutorials/blob/b641324dd06b2aaa9686427b33952ea350bd0a52/2024/06/self-hosted-wallet-bitcoin-core-docker/wallet/bitcoin.conf) file to the folder. Example:

```yaml
  bitcoin-core-wallet:
    build:
      context: .
    volumes:
      - "/tmp/bitcoin_core_wallet:/home/bitcoin/.bitcoin/"
    environment:
      - UID=$UID
      - GID=$GID
    networks:
      - no-internet
```

## Running the project

At the root folder of the project, just issue the following command:

```shell
UID=$UID GID=$GID docker compose up bitcoin-core-middleware
```

Now spin up the wallet container:

```shell
UID=$UID GID=$GID docker compose up bitcoin-core-wallet
```

It will add the middleware as peer to the wallet bitcoin-core node.

## Interacting with the wallet

Given you have the `wallet.dat` file inside the `/home/bitcoin/.bitcoin/` folder in `bitcoin-core-wallet` container, you can interact with the wallet using the `bitcoin-cli` command. Execute the following command to get the balance of the wallet:

```shell
UID=$UID GID=$GID docker compose exec bitcoin-core-wallet \
bitcoin-cli \
-rpcconnect=bitcoin-core-wallet \
-rpcuser=jasmine \
-stdinrpcpass \
getbalance
```

You'll have to enter the password generated earlier. 🔐

## Using RegTest mode

Check out the blog [Bitcoin Node with RegTest mode using Docker](https://www.willianantunes.com/blog/2022/04/bitcoin-node-with-regtest-mode-using-docker/). You'll u how to create addresses, receive a blog reward of 50 bitcoins, and many more. You can easily adapt the provided [Bitcoin configuration files](https://en.bitcoin.it/wiki/Running_Bitcoin#Bitcoin.conf_Configuration_File) with [Bitcoin Core Config Generator](https://jlopp.github.io/bitcoin-core-config-generator/).

## Important notice

Try to keep your `wallet.dat` on a single computer. Don't keep it on multiple computers. For example, suppose you have your `wallet.dat` on device A and the very same file on device B. You create an address through device A, and then it receives money. If you try to check your balance through device B, it won't be able to retrieve the up-to-date value, even though your blockchain is fully synchronized. It happens because one wallet won't have addresses that are in the other. Don't lose your money. ⚠️

Another important point is that blockchain rescan capability on prune nodes is not possible at the time this article was written. Look at the [issue](https://github.com/bitcoin/bitcoin/issues/29183) regarding its implementation. This means you can't import your `wallet.dat` unless you [repeat the initial synchronization of the blockchain](https://bitcoin.stackexchange.com/a/99853), which takes a lot of time.

## Conclusion.

Using two nodes is more secure. The middleware node has a connection to the internet. The wallet node does not have it. In case the middleware node is compromised, your wallet node is protected. The walled node serves only to sign transactions and the middleware to propagate them to the network. Of course, the attacker might access the wallet node through the middleware, though the chances of that happening are astronomically low. By the way, you can use an alternative approach of [signing transactions offline and generating addresses with descriptors](https://bitcointalk.org/index.php?topic=5392824.0).

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2024/06/self-hosted-wallet-bitcoin-core-docker).

Posted listening to [Chitãozinho & Xororó, Majestado o Sabiá](https://youtu.be/TjfPerJVRZs?si=I0AJYspuFjqNDyXn) 🎶.
