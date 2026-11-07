# ⛓ CharityChain — Blockchain-Based Charity Donation Platform

A fully decentralised charity donation DApp built on **Ethereum Sepolia Testnet** using Solidity, Ethers.js, HTML, CSS and JavaScript.

---

## 📁 Project Structure

```
blockchain/
├── CharityDonation.sol   ← Solidity smart contract
├── index.html            ← Frontend UI
├── style.css             ← Styling
├── app.js                ← Ethers.js logic
└── README.md             ← This file
```

---

## ✅ Features

| Feature | Status |
|---|---|
| Admin creates donation campaigns | ✅ |
| Campaign title, description, goal | ✅ |
| Users donate test ETH | ✅ |
| Total donations displayed | ✅ |
| Donor count displayed | ✅ |
| Donor contribution history | ✅ |
| Campaign details publicly visible | ✅ |
| Admin-only fund withdrawal | ✅ |
| All donations on blockchain | ✅ |
| Leaderboard of top contributors | ✅ |

---

## 🚀 STEP-BY-STEP SETUP GUIDE

### STEP 1 — Install MetaMask

1. Go to [https://metamask.io](https://metamask.io) and install the browser extension (Chrome/Firefox/Brave).
2. Create a new wallet and **save your Secret Recovery Phrase** safely.
3. Set a strong password.

---

### STEP 2 — Switch MetaMask to Sepolia Testnet

1. Open MetaMask → click the network dropdown at the top (shows "Ethereum Mainnet").
2. Click **"Show test networks"** if Sepolia is not visible.
3. Select **Sepolia test network**.
4. Your network should now show **Sepolia**.

---

### STEP 3 — Get Free Sepolia Test ETH (Faucet)

You need test ETH to pay for gas fees. Use any of these faucets:

- **Alchemy Faucet** → [https://sepoliafaucet.com](https://sepoliafaucet.com)
- **Infura Faucet** → [https://www.infura.io/faucet/sepolia](https://www.infura.io/faucet/sepolia)
- **Chainlink Faucet** → [https://faucets.chain.link/sepolia](https://faucets.chain.link/sepolia)

Steps:
1. Copy your MetaMask wallet address (click the account name to copy).
2. Paste it into the faucet website.
3. Request test ETH — you should receive **0.5 ETH** within a minute.

---

### STEP 4 — Open Remix IDE and Load the Contract

1. Go to [https://remix.ethereum.org](https://remix.ethereum.org)
2. In the **File Explorer** (left panel), click the **"+"** icon to create a new file.
3. Name it `CharityDonation.sol`.
4. Copy the entire contents of `CharityDonation.sol` from this project and paste it into Remix.

---

### STEP 5 — Compile the Smart Contract

1. Click the **Solidity Compiler** icon in the left sidebar (looks like `< >`).
2. Set compiler version to **0.8.0** or higher (e.g., `0.8.20`).
3. Make sure **"Auto compile"** is checked, OR click the blue **"Compile CharityDonation.sol"** button.
4. You should see a **green checkmark** — no errors.

---

### STEP 6 — Deploy the Smart Contract to Sepolia

1. Click the **Deploy & Run Transactions** icon in the left sidebar (looks like Ethereum logo with an arrow).
2. In the **Environment** dropdown, select:
   ```
   Injected Provider - MetaMask
   ```
3. MetaMask will pop up — click **Connect** and select your account.
4. Confirm the network shows **Sepolia** in Remix (check top right of the Deploy panel).
5. Under **Contract**, make sure `CharityDonation` is selected.
6. Click the orange **"Deploy"** button.
7. MetaMask will pop up asking to confirm the transaction — click **Confirm**.
8. Wait ~15–30 seconds for the transaction to be mined.
9. Once deployed, you will see the contract appear under **"Deployed Contracts"** in Remix.

---

### STEP 7 — Copy the Contract Address

1. In Remix, under **"Deployed Contracts"**, expand your contract.
2. At the top you will see the **contract address** (e.g., `0xAbC123...`).
3. Click the **copy icon** next to it to copy the address.

---

### STEP 8 — Paste the Contract Address into app.js

1. Open `app.js` in your code editor.
2. Find this line near the top:
   ```javascript
   const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
   ```
3. Replace `YOUR_CONTRACT_ADDRESS_HERE` with the address you copied:
   ```javascript
   const CONTRACT_ADDRESS = "0xYourActualContractAddressHere";
   ```
4. Save the file.

---

### STEP 9 — Run the Frontend

**Option A — Open directly in browser (simplest):**
1. Navigate to your project folder.
2. Double-click `index.html` to open it in your browser.

**Option B — Use VS Code Live Server (recommended):**
1. Install the **Live Server** extension in VS Code.
2. Right-click `index.html` → **"Open with Live Server"**.
3. The app opens at `http://127.0.0.1:5500`.

**Option C — Use a simple HTTP server:**
```bash
# Python 3
cd path/to/blockchain
python -m http.server 8080
# Then open http://localhost:8080
```

---

### STEP 10 — Use the Application

#### As Admin (the wallet that deployed the contract):

1. Open the app in your browser.
2. Click **"Connect Wallet"** — MetaMask will ask for permission, click **Connect**.
3. Make sure MetaMask is on **Sepolia** network.
4. The **Admin Panel** will appear at the top (only visible to the deployer wallet).
5. Fill in:
   - **Campaign Title** (e.g., "Help Flood Victims")
   - **Description** (e.g., "Raising funds for flood relief")
   - **Goal in ETH** (e.g., `1.5`)
6. Click **"Create Campaign"** → confirm in MetaMask.
7. After confirmation, the campaign appears in the **Active Campaigns** section.

#### As a Donor (any wallet):

1. Open the app and click **"Connect Wallet"**.
2. Browse the **Active Campaigns**.
3. Click **"💸 Donate"** on any campaign.
4. Enter the amount in ETH (e.g., `0.01`).
5. Click **"Send Donation"** → confirm in MetaMask.
6. Your donation is recorded on the blockchain.
7. View your donation history in **"My Donation History"**.

#### Leaderboard:

1. Scroll to the **Leaderboard** section.
2. Select a campaign from the dropdown.
3. Click **"Show Leaderboard"** to see top donors ranked by contribution.

#### Admin Withdrawal:

1. Connect with the admin wallet.
2. In any campaign card, click **"💰 Withdraw"**.
3. Confirm the withdrawal in the popup → confirm in MetaMask.
4. Funds are transferred to the admin wallet.

---

## 🔍 Verify on Etherscan

After deploying, you can view your contract on:
```
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

All transactions (donations, withdrawals) are publicly visible here.

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---|---|
| MetaMask not detected | Install MetaMask extension and refresh |
| Wrong network error | Switch MetaMask to Sepolia Testnet |
| Transaction fails | Make sure you have enough Sepolia ETH for gas |
| Admin panel not showing | Connect with the wallet that deployed the contract |
| Contract not responding | Double-check CONTRACT_ADDRESS in app.js |
| Remix compile error | Make sure compiler version is 0.8.0 or higher |

---

## 🛠 Technologies Used

- **Solidity ^0.8.0** — Smart contract language
- **Remix IDE** — Online Solidity compiler and deployer
- **MetaMask** — Browser wallet for signing transactions
- **Ethereum Sepolia Testnet** — Test blockchain network
- **Ethers.js v5.7** — JavaScript library to interact with Ethereum
- **HTML5 / CSS3 / Vanilla JavaScript** — Frontend

---

## 📜 Smart Contract Functions

| Function | Access | Description |
|---|---|---|
| `createCampaign(title, desc, goal)` | Admin only | Creates a new donation campaign |
| `donate(campaignId)` | Public (payable) | Sends ETH to a campaign |
| `getTotalDonations(campaignId)` | Public (view) | Returns total ETH raised |
| `getDonorContribution(campaignId, addr)` | Public (view) | Returns a donor's contribution |
| `withdrawDonations(campaignId)` | Admin only | Withdraws funds to admin wallet |
| `getDonorHistory(address)` | Public (view) | Returns all donations by an address |
| `getLeaderboard(campaignId)` | Public (view) | Returns sorted donor leaderboard |
| `getCampaign(id)` | Public (view) | Returns full campaign details |

---

*Built for Ethereum Sepolia Testnet — use test ETH only.*
