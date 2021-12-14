# Ballot Box

A semi-decentralized & effective way of distributing rewards to workstream contributors. With one list for the voters and another list for the candidates.

This build uses a Firebase data store for storing members and votes. The distribution creation and the votes are verified using signed messages. Then the distribution is done on-chain based on the information from the off-chain distribution.

## Prerequisites

- **Node** - v16.x.x
- **npm** - v8.1.x (preferrably 7.6.0)
- **Web3.js** - v1.5.x (preferrably 1.5.3)
- **Solidity** - v0.5.x (preferrably 0.5.16)

#### 1. Clone repository

```
git clone https://github.com/itissandeep98/Blockchain-Voting-System.git
cd Blockchain-Voting-System
```

#### 2. Deploy contract on Hardhat:

- Deploy the contracts on an online blockchain (ropsten,bsscan etc)
- Replace the Infura ID in `backend/index.js`

#### 3. Frontend:

```
yarn start
```

Open http://localhost:3000 to see the app

#### 4. Run backend:

In a second terminal window, run the backend or Use an already deployed backend

The project can use a local json file store or an online hosted service like firebase to store the off chain data

To start the server Locally

```bash
yarn backend
```
