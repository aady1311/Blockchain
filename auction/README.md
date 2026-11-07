# 🔨 AuctionChain — Decentralised Online Auction Platform

A fully decentralised auction DApp built on **Ethereum Sepolia Testnet** using Solidity, Ethers.js, HTML, CSS and JavaScript.

---

## 📁 Project Structure

```
auction/
├── DecentralisedAuction.sol  ← Solidity smart contract
├── index.html                ← Frontend UI
├── style.css                 ← Styling
├── app.js                    ← Ethers.js logic
└── README.md                 ← This file
```

---

## ✅ Features

| Feature | Status |
|---|---|
| Owner creates auctions | ✅ |
| Item name, description, starting price, duration | ✅ |
| Users place bids with test ETH | ✅ |
| Each bid must be higher than previous | ✅ |
| Live countdown timer per auction | ✅ |
| Current highest bid displayed | ✅ |
| Highest bidder wallet address shown | ✅ |
| No bids accepted after auction ends | ✅ |
| Owner finalises auction | ✅ |
| Winner identified on-chain | ✅ |
| Refund mechanism for outbid bidders | ✅ |
| Withdraw refunds from UI | ✅ |

---

## 🚀 STEP-BY-STEP SETUP GUIDE

### STEP 1 — MetaMask & Sepolia ETH
- Install MetaMask from [https://metamask.io](https://metamask.io)
- Switch to **Sepolia Testnet**
- Get free ETH from [https://cloud.google.com/application/web3/faucet/ethereum/sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

---

### STEP 2 — Deploy in Remix

1. Go to [https://remix.ethereum.org](https://remix.ethereum.org)
2. Create new file → `DecentralisedAuction.sol`
3. Paste the contract code
4. Compile with Solidity **0.8.0+**
5. Deploy tab → Environment = **"Injected Provider - MetaMask"**
6. Network must show **Sepolia** in MetaMask
7. Click **Deploy** → confirm in MetaMask
8. Copy the contract address from **Deployed Contracts**

---

### STEP 3 — Connect Frontend

Open `app.js` and replace:
```javascript
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
```
With your deployed address:
```javascript
const CONTRACT_ADDRESS = "0xYourActualAddressHere";
```

---

### STEP 4 — Run the App

- Double-click `index.html` OR use VS Code Live Server
- Click **Connect Wallet**
- MetaMask must be on **Sepolia**

---

## 🎮 How to Use

### As Owner (deployer wallet):
1. Connect wallet → **Admin Panel** appears
2. Fill in item name, description, starting price, duration (minutes)
3. Click **Create Auction** → confirm in MetaMask
4. After auction time expires → click **🔨 Finalise** to end it
5. Winning bid is transferred to your wallet

### As Bidder (any wallet):
1. Connect wallet → browse auctions
2. Click **💰 Place Bid** on a live auction
3. Enter bid amount (must be higher than current highest)
4. Confirm in MetaMask
5. If outbid → your ETH appears in **My Refunds**
6. Click **💸 Withdraw** to get your ETH back

---

## 📜 Smart Contract Functions

| Function | Access | Description |
|---|---|---|
| `createAuction(name, desc, price, duration)` | Owner only | Creates a new auction |
| `placeBid(auctionId)` | Public (payable) | Places a bid on an auction |
| `getHighestBid(auctionId)` | Public (view) | Returns current highest bid |
| `endAuction(auctionId)` | Owner only | Finalises auction, transfers funds |
| `getAuctionWinner(auctionId)` | Public (view) | Returns winner address and amount |
| `withdrawRefund(auctionId)` | Public | Withdraws refund for outbid bidders |
| `getAuction(id)` | Public (view) | Returns full auction details |
| `getMyRefund(auctionId, addr)` | Public (view) | Returns pending refund amount |

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---|---|
| MetaMask not detected | Install MetaMask and refresh |
| Wrong network | Switch to Sepolia Testnet |
| Transaction fails | Get more Sepolia ETH from faucet |
| Admin panel not showing | Connect with the deployer wallet |
| Bid rejected | Your bid must be higher than current highest |
| Can't finalise | Auction time must have expired first |

---

## 🛠 Technologies Used

- **Solidity ^0.8.0** — Smart contract
- **Remix IDE** — Compile and deploy
- **MetaMask** — Wallet and transaction signing
- **Ethereum Sepolia Testnet** — Test blockchain
- **Ethers.js v5.7** — Blockchain interaction
- **HTML5 / CSS3 / Vanilla JavaScript** — Frontend

---

*Built for Ethereum Sepolia Testnet — use test ETH only.*
