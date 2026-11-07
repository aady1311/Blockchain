// ============================================================
//  app.js — AuctionChain DApp
//  Replace CONTRACT_ADDRESS after deploying on Sepolia
// ============================================================

const CONTRACT_ADDRESS = "0x5aa24dECF721a4F8900247c774e4938cd159CE62";
const SEPOLIA_CHAIN_ID = 11155111;

const ABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"string","name":"itemName","type":"string"},{"indexed":false,"internalType":"uint256","name":"startingPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"endTime","type":"uint256"}],"name":"AuctionCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"auctionId","type":"uint256"},{"indexed":false,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"AuctionEnded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"auctionId","type":"uint256"},{"indexed":true,"internalType":"address","name":"bidder","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BidPlaced","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"auctionId","type":"uint256"},{"indexed":true,"internalType":"address","name":"bidder","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RefundWithdrawn","type":"event"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"auctionCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"string","name":"_itemName","type":"string"},{"internalType":"string","name":"_itemDescription","type":"string"},{"internalType":"uint256","name":"_startingPrice","type":"uint256"},{"internalType":"uint256","name":"_durationInMinutes","type":"uint256"}],"name":"createAuction","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_auctionId","type":"uint256"}],"name":"placeBid","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_auctionId","type":"uint256"}],"name":"getHighestBid","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_auctionId","type":"uint256"}],"name":"endAuction","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_auctionId","type":"uint256"}],"name":"getAuctionWinner","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_auctionId","type":"uint256"}],"name":"withdrawRefund","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"getAuction","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_auctionId","type":"uint256"},{"internalType":"address","name":"_bidder","type":"address"}],"name":"getMyRefund","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

let provider, signer, contract, userAddress, ownerAddress;
let selectedAuctionId = null;
let endAuctionId = null;
let countdownTimers = {};

// ── Wallet Connection ──────────────────────────────────────
async function connectWallet() {
    if (!window.ethereum) {
        showStatus("MetaMask not detected. Please install MetaMask.", "error");
        return;
    }
    try {
        showStatus("Connecting wallet…", "info");
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const network = await provider.getNetwork();

        if (network.chainId !== SEPOLIA_CHAIN_ID) {
            showStatus("Switching to Sepolia Testnet…", "warning");
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0xaa36a7" }]
                });
                provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            } catch (e) {
                showStatus("Please manually switch MetaMask to Sepolia Testnet.", "error");
                return;
            }
        }

        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        try {
            ownerAddress = await contract.owner();
        } catch (e) {
            showStatus("❌ Contract not found on Sepolia. Please deploy DecentralisedAuction.sol using Injected Provider - MetaMask in Remix.", "error");
            return;
        }

        document.getElementById("walletAddress").textContent =
            userAddress.slice(0, 6) + "…" + userAddress.slice(-4);
        document.getElementById("walletAddress").classList.add("connected");
        document.getElementById("connectBtn").textContent = "Connected";
        document.getElementById("connectBtn").disabled = true;

        if (userAddress.toLowerCase() === ownerAddress.toLowerCase()) {
            document.getElementById("adminPanel").classList.remove("hidden");
        }

        showStatus("✅ Wallet connected: " + userAddress, "success");
        await loadAuctions();
        await loadRefunds();

        window.ethereum.on("accountsChanged", () => location.reload());
        window.ethereum.on("chainChanged", () => location.reload());

    } catch (err) {
        showStatus("Connection failed: " + (err.reason || err.message), "error");
    }
}

// ── Create Auction ─────────────────────────────────────────
async function createAuction() {
    const name     = document.getElementById("itemName").value.trim();
    const desc     = document.getElementById("itemDesc").value.trim();
    const price    = parseFloat(document.getElementById("startPrice").value);
    const duration = parseInt(document.getElementById("duration").value);

    if (!name || !desc || isNaN(price) || price <= 0 || isNaN(duration) || duration <= 0) {
        showStatus("Please fill in all fields correctly.", "error");
        return;
    }
    try {
        showStatus("Creating auction… please confirm in MetaMask.", "info");
        const priceWei = ethers.utils.parseEther(price.toString());
        const tx = await contract.createAuction(name, desc, priceWei, duration);
        showStatus("Transaction sent. Waiting for confirmation…", "warning");
        await tx.wait();
        showStatus(`✅ Auction "${name}" created successfully!`, "success");
        document.getElementById("itemName").value  = "";
        document.getElementById("itemDesc").value  = "";
        document.getElementById("startPrice").value = "";
        document.getElementById("duration").value  = "";
        await loadAuctions();
    } catch (err) {
        showStatus("Error: " + (err.reason || err.message), "error");
    }
}

// ── Load Auctions ──────────────────────────────────────────
async function loadAuctions() {
    if (!contract) { showStatus("Connect your wallet first.", "error"); return; }
    const list = document.getElementById("auctionList");
    list.innerHTML = "<p class='muted'>Loading auctions…</p>";

    // Clear old timers
    Object.values(countdownTimers).forEach(clearInterval);
    countdownTimers = {};

    try {
        const count = (await contract.auctionCount()).toNumber();
        if (count === 0) {
            list.innerHTML = "<p class='muted'>No auctions yet. Create one using the Admin Panel.</p>";
            return;
        }

        list.innerHTML = "";
        const isOwner = userAddress && userAddress.toLowerCase() === ownerAddress.toLowerCase();

        for (let i = count; i >= 1; i--) {
            const [id, name, desc, startPrice, endTime, highBidder, highBid, ended] =
                await contract.getAuction(i);

            const startEth   = parseFloat(ethers.utils.formatEther(startPrice)).toFixed(4);
            const highEth    = parseFloat(ethers.utils.formatEther(highBid)).toFixed(4);
            const endTimeSec = endTime.toNumber();
            const now        = Math.floor(Date.now() / 1000);
            const isLive     = !ended && now < endTimeSec;
            const isExpired  = !ended && now >= endTimeSec;

            const bidderShort = highBidder === "0x0000000000000000000000000000000000000000"
                ? "No bids yet"
                : highBidder.slice(0, 8) + "…" + highBidder.slice(-6);

            const card = document.createElement("div");
            card.className = "auction-card";
            card.id = `auction-card-${i}`;

            let winnerHtml = "";
            if (ended) {
                const winnerAddr = highBidder === "0x0000000000000000000000000000000000000000"
                    ? "No winner (no bids)"
                    : highBidder.slice(0, 8) + "…" + highBidder.slice(-6);
                winnerHtml = `<div class="winner-banner">🏆 Winner: <strong>${winnerAddr}</strong> — ${highEth} ETH</div>`;
            }

            card.innerHTML = `
                <span class="auction-badge ${isLive ? 'badge-live' : 'badge-ended'}">${isLive ? '🟢 LIVE' : ended ? '🔴 ENDED' : '⏰ EXPIRED'}</span>
                <h3>${escHtml(name)}</h3>
                <p>${escHtml(desc)}</p>
                <div class="auction-stats">
                    <div class="stat"><span>Starting Price</span><span>${startEth} ETH</span></div>
                    <div class="stat"><span>Highest Bid</span><span>${highBid.toString() === "0" ? "—" : highEth + " ETH"}</span></div>
                    <div class="stat"><span>Highest Bidder</span><span style="font-size:0.78rem">${bidderShort}</span></div>
                    <div class="stat"><span>Auction ID</span><span>#${i}</span></div>
                </div>
                <div class="countdown ${!isLive ? 'expired' : ''}" id="countdown-${i}">
                    ${ended ? "Auction Finalised" : isExpired ? "Time Expired — Awaiting Finalisation" : ""}
                </div>
                ${winnerHtml}
                <div class="auction-actions">
                    ${isLive ? `<button class="btn btn-primary" onclick="openBid(${i},'${escHtml(name)}')">💰 Place Bid</button>` : ""}
                    ${isOwner && isExpired ? `<button class="btn btn-danger" onclick="openEndModal(${i},'${escHtml(name)}','${bidderShort}','${highEth}')">🔨 Finalise</button>` : ""}
                </div>`;
            list.appendChild(card);

            if (isLive) startCountdown(i, endTimeSec);
        }
    } catch (err) {
        list.innerHTML = "<p class='muted'>Error loading auctions.</p>";
        showStatus("Load error: " + err.message, "error");
    }
}

// ── Countdown Timer ────────────────────────────────────────
function startCountdown(id, endTimeSec) {
    const el = document.getElementById(`countdown-${id}`);
    function update() {
        const now = Math.floor(Date.now() / 1000);
        const diff = endTimeSec - now;
        if (!el) { clearInterval(countdownTimers[id]); return; }
        if (diff <= 0) {
            el.textContent = "⏰ Time Expired — Awaiting Finalisation";
            el.classList.add("expired");
            clearInterval(countdownTimers[id]);
            loadAuctions();
            return;
        }
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        el.textContent = `⏱ ${h > 0 ? h + "h " : ""}${m}m ${s}s remaining`;
    }
    update();
    countdownTimers[id] = setInterval(update, 1000);
}

// ── Place Bid ──────────────────────────────────────────────
async function openBid(id, name) {
    selectedAuctionId = id;
    document.getElementById("bidItemName").textContent = name;
    document.getElementById("bidSection").classList.remove("hidden");
    document.getElementById("bidSection").scrollIntoView({ behavior: "smooth" });

    try {
        const [,,,startPrice,,highBidder, highBid,] = await contract.getAuction(id);
        const highEth = parseFloat(ethers.utils.formatEther(highBid));
        const startEth = parseFloat(ethers.utils.formatEther(startPrice));
        document.getElementById("currentHighest").textContent =
            highBid.toString() === "0" ? startEth.toFixed(4) + " ETH (start)" : highEth.toFixed(4) + " ETH";
        document.getElementById("currentBidder").textContent =
            highBidder === "0x0000000000000000000000000000000000000000"
                ? "No bids yet"
                : highBidder.slice(0, 8) + "…" + highBidder.slice(-6);
    } catch (e) {}
}

function closeBid() {
    document.getElementById("bidSection").classList.add("hidden");
    document.getElementById("bidAmount").value = "";
    selectedAuctionId = null;
}

async function placeBid() {
    const amount = parseFloat(document.getElementById("bidAmount").value);
    if (!selectedAuctionId || isNaN(amount) || amount <= 0) {
        showStatus("Enter a valid bid amount.", "error");
        return;
    }
    try {
        showStatus("Placing bid… please confirm in MetaMask.", "info");
        const tx = await contract.placeBid(selectedAuctionId, {
            value: ethers.utils.parseEther(amount.toString())
        });
        showStatus("Transaction sent. Waiting for confirmation…", "warning");
        await tx.wait();
        showStatus(`✅ Bid of ${amount} ETH placed successfully!`, "success");
        closeBid();
        await loadAuctions();
        await loadRefunds();
    } catch (err) {
        showStatus("Bid failed: " + (err.reason || err.message), "error");
    }
}

// ── End Auction ────────────────────────────────────────────
function openEndModal(id, name, bidder, bid) {
    endAuctionId = id;
    document.getElementById("endItemName").textContent = name;
    document.getElementById("endWinner").textContent   = bidder;
    document.getElementById("endBid").textContent      = bid;
    document.getElementById("endModal").classList.remove("hidden");
}

function closeEndModal() {
    document.getElementById("endModal").classList.add("hidden");
    endAuctionId = null;
}

async function endAuction() {
    if (!endAuctionId) return;
    try {
        showStatus("Finalising auction… please confirm in MetaMask.", "info");
        const tx = await contract.endAuction(endAuctionId);
        showStatus("Transaction sent. Waiting for confirmation…", "warning");
        await tx.wait();
        showStatus("✅ Auction finalised! Funds transferred to owner.", "success");
        closeEndModal();
        await loadAuctions();
    } catch (err) {
        showStatus("Error: " + (err.reason || err.message), "error");
    }
}

// ── Refunds ────────────────────────────────────────────────
async function loadRefunds() {
    if (!contract || !userAddress) return;
    const container = document.getElementById("refundList");
    container.innerHTML = "<p class='muted'>Checking refunds…</p>";

    try {
        const count = (await contract.auctionCount()).toNumber();
        const refunds = [];

        for (let i = 1; i <= count; i++) {
            const amount = await contract.getMyRefund(i, userAddress);
            if (amount.toString() !== "0") {
                const [,name,,,,,,] = await contract.getAuction(i);
                refunds.push({ id: i, name, amount });
            }
        }

        if (refunds.length === 0) {
            container.innerHTML = "<p class='muted'>No pending refunds.</p>";
            return;
        }

        let html = `<table class="refund-table">
            <thead><tr><th>Auction</th><th>Refund Amount</th><th>Action</th></tr></thead><tbody>`;
        for (const r of refunds) {
            const eth = parseFloat(ethers.utils.formatEther(r.amount)).toFixed(6);
            html += `<tr>
                <td>#${r.id} — ${escHtml(r.name)}</td>
                <td>${eth} ETH</td>
                <td><button class="btn btn-success" onclick="withdrawRefund(${r.id})">💸 Withdraw</button></td>
            </tr>`;
        }
        html += "</tbody></table>";
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = "<p class='muted'>Error checking refunds.</p>";
    }
}

async function withdrawRefund(auctionId) {
    try {
        showStatus("Withdrawing refund… please confirm in MetaMask.", "info");
        const tx = await contract.withdrawRefund(auctionId);
        showStatus("Transaction sent. Waiting for confirmation…", "warning");
        await tx.wait();
        showStatus("✅ Refund withdrawn successfully!", "success");
        await loadRefunds();
    } catch (err) {
        showStatus("Refund failed: " + (err.reason || err.message), "error");
    }
}

// ── Helpers ────────────────────────────────────────────────
function showStatus(msg, type = "info") {
    const bar = document.getElementById("statusBar");
    bar.textContent = msg;
    bar.className = `status-bar ${type}`;
    bar.classList.remove("hidden");
    if (type === "success") setTimeout(() => bar.classList.add("hidden"), 5000);
}

function escHtml(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
