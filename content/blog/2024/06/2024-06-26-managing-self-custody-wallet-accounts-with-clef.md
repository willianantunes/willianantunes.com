---
id: 2bfcadd0-3407-11ef-8c23-bf40368cfae4
title: Managing self-custody wallet accounts with Clef
date: 2024-06-26T21:58:07.939Z
cover: /assets/posts/blog-44-managing-self-custody-wallet-accounts-with-clef.png
description: Manage your self-custody wallet accounts with Clef. This tutorial
  will equip you with the necessary knowledge to handle your accounts
  confidently.
tags:
  - ethereum
  - cryptocurrency
---
According to the [primary documentation](https://geth.ethereum.org/docs/fundamentals/account-management), Clef is an external signer. It ensures that every transaction and balance check requires your explicit approval. Let's dive into a real-world example with a practical project. We are going to create an Ethereum proof-of-stake development network locally using Docker. It's easier to create ethers—there's no need for a faucet. [Download the project](https://github.com/willianantunes/tutorials/tree/master/2024/06/account_management_with_clef_ethereum), and let's start it. 🏃

## Initializing Clef and the network

The project is a modified version of [OffchainLabs/eth-pos-devnet](https://github.com/OffchainLabs/eth-pos-devnet). Refer to its [main article](https://rauljordan.com/how-to-setup-a-proof-of-stake-devnet/) for more details. The key distinction is that instead of using [Geth](https://geth.ethereum.org/docs) to manage accounts, we're employing Clef. First, we must initialize Clef. Execute the following command:

```shell
docker compose run gethtools sh
```

Execute `clef init` and configure the master seed. If you want to use the current [`masterseed.json`](https://github.com/willianantunes/tutorials/blob/master/2024/06/account_management_with_clef_ethereum/account-manager/masterseed.json), its password is `1234567890`. Then you can start the Clef service:

```shell
clef --chainid 32382 --loglevel 6 --http --http.addr=0.0.0.0
```

The chain ID configured in the file [`execution/genesis.json`](https://github.com/willianantunes/tutorials/blob/41b2177514b6ea05fca62b84a4b629dd5031f243/2024/06/account_management_with_clef_ethereum/execution/genesis.json#L3) must be the same. That is why we used `32382`. Take the container's IP address with the command `docker inspect CONTAINER_ID | grep IPAddress` and replace the placeholder `CLEF_CONTAINER_IP_ADDRESS` in the file `docker-compose.yaml`. If the IP is `192.168.80.2`, the line will be `--signer=http://192.168.80.2:8550`.

Now, we can spin up the Ethereum proof of stake development network. Execute the following command:

```shell
docker compose up validator beacon-chain geth
```

We can proceed to interact with it.

## How to create an account

Execute the following command:

```shell
docker compose run gethtools sh
```

Then issue the following command:

```shell
clef --chainid 32382 newaccount
```

## Listing account

Execute the following command:

```shell
docker compose run geth --datadir /execution attach
```

List all the accounts executing:

```shell
eth.accounts
```

On the Clef terminal, you'll see a message like this:

```
A request has been made to list all accounts. 
You can select which accounts the caller can see
  [x] 0x123463a4B065722E99115D6c222f267d9cABb524
    URL: keystore:///root/.ethereum/keystore/UTC--2022-08-19T17-38-31.257380510Z--123463a4b065722e99115d6c222f267d9cabb524
  [x] 0x25815ef1C6Eb80D88A5E31412022B8870B7B1C43
    URL: keystore:///root/.ethereum/keystore/UTC--2024-05-30T21-30-23.388457648Z--25815ef1c6eb80d88a5e31412022b8870b7b1c43
  [x] 0x646a916f656F39e1EFA98d4D8eBA2BBdb7C6779B
    URL: keystore:///root/.ethereum/keystore/UTC--2024-05-30T21-31-02.131044750Z--646a916f656f39e1efa98d4d8eba2bbdb7c6779b
  [x] 0xC0802Cace6c5Ed6a58b8D27E9991aDeD3BD0e546
    URL: keystore:///root/.ethereum/keystore/UTC--2024-05-31T16-00-49.547032179Z--c0802cace6c5ed6a58b8d27e9991aded3bd0e546
-------------------------------------------
Request context:
	192.168.80.4:40264 -> http -> 192.168.80.2:8550

Additional HTTP header data, provided by the external caller:
	User-Agent: "Go-http-client/1.1"
	Origin: ""
Approve? [y/N]:
```

Type `y` and press `Enter`. The accounts are now listed.

## Checking balance

Know how much ether we have:

```shell
web3.fromWei(eth.getBalance(eth.accounts[0]), "ether")
web3.fromWei(eth.getBalance(eth.accounts[1]), "ether")
web3.fromWei(eth.getBalance(eth.accounts[2]), "ether")
```

We'll have to approve the request on the Clef terminal for each command.

## Sending ether

Send some ether to another account:

```javascript
eth.getTransaction(
    web3.eth.sendTransaction(
        {
            from: eth.accounts[0],
            to: eth.accounts[1],
            value: web3.toWei(0.5, 'ether')
        }
    )
)
```

The account `eth.accounts[0]` password is an empty string. Approve the request again on the Clef terminal. The key `blockNumber` will be `null` until the transaction is mined. Example:

```json
{
  "accessList": [],
  "blockHash": null,
  "blockNumber": null,
  "chainId": "0x7e7e",
  "from": "0x123463a4b065722e99115d6c222f267d9cabb524",
  "gas": 21000,
  "gasPrice": 3000000000,
  "hash": "0xf7a2c5ec2b44f99b159876efb0254ba87f8def7e43a2afcc29232544cbe16691",
  "input": "0x",
  "maxFeePerGas": 3000000000,
  "maxPriorityFeePerGas": 1000000000,
  "nonce": 0,
  "r": "0x25101edad9141ebe5305df494627afc079c0d6298277038084a89916e6dd4925",
  "s": "0x2a4c75f595abd8f6d6f4cdbd2bdcdf5634ac75d011ff4c71fa6e724ea1b87d14",
  "to": "0x25815ef1c6eb80d88a5e31412022b8870b7b1c43",
  "transactionIndex": null,
  "type": "0x2",
  "v": "0x0",
  "value": 500000000000000000,
  "yParity": "0x0"
}
```

The key `blockNumber` will have the block number as soon as it's mined. If we execute:

```shell
eth.getTransaction("0xf7a2c5ec2b44f99b159876efb0254ba87f8def7e43a2afcc29232544cbe16691")
```

We'll get the following, for example:

```json
{
  "accessList": [],
  "blockHash": "0x6a62924efeecc56af3bebb1244995973de0c4202f2c94b05b6b38b1318d76477",
  "blockNumber": 1,
  "chainId": "0x7e7e",
  "from": "0x123463a4b065722e99115d6c222f267d9cabb524",
  "gas": 21000,
  "gasPrice": 1875000000,
  "hash": "0xf7a2c5ec2b44f99b159876efb0254ba87f8def7e43a2afcc29232544cbe16691",
  "input": "0x",
  "maxFeePerGas": 3000000000,
  "maxPriorityFeePerGas": 1000000000,
  "nonce": 0,
  "r": "0x25101edad9141ebe5305df494627afc079c0d6298277038084a89916e6dd4925",
  "s": "0x2a4c75f595abd8f6d6f4cdbd2bdcdf5634ac75d011ff4c71fa6e724ea1b87d14",
  "to": "0x25815ef1c6eb80d88a5e31412022b8870b7b1c43",
  "transactionIndex": 0,
  "type": "0x2",
  "v": "0x0",
  "value": 500000000000000000,
  "yParity": "0x0"
}
```

You can also check the transaction receipt when it's mined:

```shell
eth.getTransactionReceipt("0xf7a2c5ec2b44f99b159876efb0254ba87f8def7e43a2afcc29232544cbe16691")
```

Sample output:

```json
{
  "blockHash": "0x6a62924efeecc56af3bebb1244995973de0c4202f2c94b05b6b38b1318d76477",
  "blockNumber": 1,
  "contractAddress": null,
  "cumulativeGasUsed": 21000,
  "effectiveGasPrice": 1875000000,
  "from": "0x123463a4b065722e99115d6c222f267d9cabb524",
  "gasUsed": 21000,
  "logs": [],
  "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "status": "0x1",
  "to": "0x25815ef1c6eb80d88a5e31412022b8870b7b1c43",
  "transactionHash": "0xf7a2c5ec2b44f99b159876efb0254ba87f8def7e43a2afcc29232544cbe16691",
  "transactionIndex": 0,
  "type": "0x2"
}
```

## Sending ether from an account that requires a password

If we do the following:

```javascript
web3.eth.sendTransaction(
    {
        from: eth.accounts[1],
        to: eth.accounts[2],
        value: web3.toWei(0.02, 'ether')
    }
)
```

The password for the account `eth.accounts[1]` is in the file [`account-manager/keystore/25815-pass.txt`](https://github.com/willianantunes/tutorials/blob/master/2024/06/account_management_with_clef_ethereum/account-manager/keystore/25815-pass.txt). Approve the request on the Clef terminal again.

## Bonus: Using web3py to send transaction

Your proof of stake development network must be running. If so, execute `poetry install`, and then you can run the file [`account_operations.py`](https://github.com/willianantunes/tutorials/blob/master/2024/06/account_management_with_clef_ethereum/account_operations.py). Change how it interacts with the network by modifying the file. Then execute:

```shell
poetry run python account_operations.py
```

Sample output:

```text
Is connected to the network:  True
Middleware injected because some specific protocols given some ExtraBytes in the response.
Gathering all accounts details
Account 0x123463a4B065722E99115D6c222f267d9cABb524 has been loaded. Current balance: 19999.500020429262021 ETH
Account 0x25815ef1C6Eb80D88A5E31412022B8870B7B1C43 has been loaded. Current balance: 0.489978999999853 ETH
Account 0x646a916f656F39e1EFA98d4D8eBA2BBdb7C6779B has been loaded. Current balance: 0.01 ETH
Get and determine gas parameters
Defining the transaction parameters
Explorer link Mainnet: https://etherscan.io/tx/0x5dcd1eafe355d703401f3e8e2cac5ad1d169f60125605b7b11433e1052b4638e
Transaction receipt: AttributeDict({'blockHash': HexBytes('0x10d3efbda638eabfbb3a230410c703bb0a742201a60be5047842ce243dfd5f61'), 'blockNumber': 818, 'contractAddress': None, 'cumulativeGasUsed': 21000, 'effectiveGasPrice': 1000000007, 'from': '0x123463a4B065722E99115D6c222f267d9cABb524', 'gasUsed': 21000, 'logs': [], 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'), 'status': 1, 'to': '0x646a916f656F39e1EFA98d4D8eBA2BBdb7C6779B', 'transactionHash': HexBytes('0x5dcd1eafe355d703401f3e8e2cac5ad1d169f60125605b7b11433e1052b4638e'), 'transactionIndex': 0, 'type': 2})
Get and determine gas parameters
Defining the transaction parameters
Explorer link Mainnet: https://etherscan.io/tx/0x49116b6f365f56903062b52b8a6390cb0d0ef0abe5d97ab88cfa0ba514eb22c3
Transaction receipt: AttributeDict({'blockHash': HexBytes('0x45ca254db2a48d5fb5a0128c21a2321e64b785031da4a9a61a65b0e8785f2e9e'), 'blockNumber': 819, 'contractAddress': None, 'cumulativeGasUsed': 21000, 'effectiveGasPrice': 1000000007, 'from': '0x123463a4B065722E99115D6c222f267d9cABb524', 'gasUsed': 21000, 'logs': [], 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'), 'status': 1, 'to': '0x646a916f656F39e1EFA98d4D8eBA2BBdb7C6779B', 'transactionHash': HexBytes('0x49116b6f365f56903062b52b8a6390cb0d0ef0abe5d97ab88cfa0ba514eb22c3'), 'transactionIndex': 0, 'type': 2})
Get and determine gas parameters
Defining the transaction parameters
Explorer link Mainnet: https://etherscan.io/tx/0xa258f78d34f3d25c063ee4cc4987c1d138d3937dbcf42edfce94a0e3ae9827e2
Transaction receipt: AttributeDict({'blockHash': HexBytes('0xa055ac00bf9108026b8f259b4079a12ddad20c669ab1e635133637e25f401ed6'), 'blockNumber': 820, 'contractAddress': None, 'cumulativeGasUsed': 21000, 'effectiveGasPrice': 1000000007, 'from': '0x123463a4B065722E99115D6c222f267d9cABb524', 'gasUsed': 21000, 'logs': [], 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'), 'status': 1, 'to': '0x646a916f656F39e1EFA98d4D8eBA2BBdb7C6779B', 'transactionHash': HexBytes('0xa258f78d34f3d25c063ee4cc4987c1d138d3937dbcf42edfce94a0e3ae9827e2'), 'transactionIndex': 0, 'type': 2})
```

## Destroy the network

To stop all services execute:

```shell
docker compose down -t 0
```

Run the script [`clean.sh`](https://github.com/willianantunes/tutorials/blob/master/2024/06/account_management_with_clef_ethereum/clean.sh) to remove all files created by the network. If an error `Permission denied` occurs, execute `sudo chown -R YOUR_OWNER:YOUR_GROUP .` and then rerun the script.

## Conclusion

Self-custody is no joke at all. It seems easy to use external tools that abstract all issues from you, though are they trustworthy? While self-custody requires effort, the financial freedom and security it offers are invaluable. Consider exploring self-custody options like Clef to take control of your crypto assets. Don't just trust, verify! For example, we can adapt this project to use [Infura](https://www.infura.io/) or [Chainstack](https://chainstack.com/) to explore further.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2024/06/account_management_with_clef_ethereum).

Posted listening to [Chico Mineiro, Tonico & Tinoco](https://youtu.be/On3Cx-Pn7uI?si=kvQrxa9_WsPmHzQX) 🎶.
