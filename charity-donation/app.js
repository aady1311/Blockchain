// ============================================================
//  app.js — CharityChain DApp
// ============================================================

const CONTRACT_ADDRESS = "0x2b25B0011C0cd456563d160756470260cA00b4F6";
const SEPOLIA_CHAIN_ID = 11155111;

const ABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"string","name":"title","type":"string"},{"indexed":false,"internalType":"uint256","name":"goal","type":"uint256"}],"name":"CampaignCreated","type":"event"},
  {"inputs":[{"internalType":"string","name":"_title","type":"string"},{"internalType":"string","name":"_description","type":"string"},{"internalType":"uint256","name":"_goal","type":"uint256"}],"name":"createCampaign","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"campaignId","type":"uint256"},{"indexed":true,"internalType":"address","name":"donor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"DonationReceived","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"campaignId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"FundsWithdrawn","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"withdrawDonations","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"campaignCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"campaigns","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"goal","type":"uint256"},{"internalType":"uint256","name":"totalDonations","type":"uint256"},{"internalType":"uint256","name":"donorCount","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"donorContributions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"getCampaign","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"},{"internalType":"address","name":"_donor","type":"address"}],"name":"getDonorContribution","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_donor","type":"address"}],"name":"getDonorHistory","outputs":[{"components":[{"internalType":"uint256","name":"campaignId","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"internalType":"struct CharityDonation.DonationRecord[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"getLeaderboard","outputs":[{"internalType":"address[]","name":"donors","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"getTotalDonations","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

let provider, signer, contract, userAddress, adminAddress;
let selectedCampaignId = null;

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
            adminAddress = await contract.admin();
        } catch (e) {
            showStatus("❌ Contract not found on Sepolia. Please redeploy using Injected Provider - MetaMask in Remix.", "error");
            return;
        }

        document.getElementById("walletAddress").textContent =
            userAddress.slice(0, 6) + "…" + userAddress.slice(-4);
        document.getElementById("walletAddress").classList.add("connected");
        document.getElementById("connectBtn").textContent = "Connected";
        document.getElementById("connectBtn").disabled = true;

        if (userAddress.toLowerCase() === adminAddress.toLowerCase()) {
            document.getElementById("adminPanel").classList.remove("hidden");
        }

        showStatus("✅ Wallet connected: " + userAddress, "success");
        await loadCampaigns();
        await loadHistory();

        window.ethereum.on("accountsChanged", () => location.reload());
        window.ethereum.on("chainChanged", () => location.reload());

    } catch (err) {
        showStatus("Connection failed: " + (err.reason || err.message), "error");
    }
}

// ── Create Campaign ────────────────────────────────────────
async function createCampaign() {
    const title = document.getElementById("campTitle").value.trim();
    const desc  = document.getElementById("campDesc").value.trim();
    const goal  = parseFloat(document.getElementById("campGoal").value);

    if (!title || !desc || isNaN(goal) || goal <= 0) {
        showStatus("Please fill in all campaign fields correctly.", "error");
        return;
    }
    try {
        showStatus("Creating campaign… please confirm in MetaMask.", "info");
        const goalWei = ethers.utils.parseEther(goal.toString());
        const tx = await contract.createCampaign(title, desc, goalWei);
        showStatus("Transaction sent. Waiting for confirmation…", "warning");
        await tx.wait();
        showStatus(`✅ Campaign "${title}" created successfully!`, "success");
        document.getElementById("campTitle").value = "";
        document.getElementById("campDesc").value  = "";
        document.getElementById("campGoal").value  = "";
        await loadCampaigns();
    } catch (err) {
        showStatus("Error: " + (err.reason || err.message), "error");
    }
}

// ── Load Campaigns ─────────────────────────────────────────
async function loadCampaigns() {
    if (!contract) { showStatus("Connect your wallet first.", "error"); return; }
    const list = document.getElementById("campaignList");
    const leaderSelect = document.getElementById("leaderCampSelect");
    list.innerHTML = "<p class='muted'>Loading campaigns…</p>";
    leaderSelect.innerHTML = '<option value="">-- Select Campaign --</option>';

    try {
        const count = (await contract.campaignCount()).toNumber();
        if (count === 0) {
            list.innerHTML = "<p class='muted'>No campaigns yet. Use the Admin Panel to create one.</p>";
            return;
        }
        list.innerHTML = "";
        for (let i = 1; i <= count; i++) {
            const [id, title, desc, goal, , donors] = await contract.getCampaign(i);
            const totalWei = await contract.getTotalDonations(i);
            const goalEth  = parseFloat(ethers.utils.formatEther(goal));
            const totalEth = parseFloat(ethers.utils.formatEther(totalWei));
            const pct      = goalEth > 0 ? Math.min((totalEth / goalEth) * 100, 100).toFixed(1) : 0;
            const isAdmin  = userAddress && userAddress.toLowerCase() === adminAddress.toLowerCase();

            const card = document.createElement("div");
            card.className = "campaign-card";
            card.innerHTML = `
                <h3>${escHtml(title)}</h3>
                <p>${escHtml(desc)}</p>
                <div class="campaign-stats">
                    <div class="stat"><span>Raised</span><span>${totalEth.toFixed(4)} ETH</span></div>
                    <div class="stat"><span>Goal</span><span>${goalEth.toFixed(4)} ETH</span></div>
                    <div class="stat"><span>Donors</span><span>${donors.toString()}</span></div>
                </div>
                <div class="progress-wrap">
                    <div class="progress-bar" style="width:${pct}%"></div>
                </div>
                <div class="progress-label">${pct}% funded</div>
                <div class="campaign-actions">
                    <button class="btn btn-accent" onclick="openDonate(${i},'${escHtml(title)}')">💸 Donate</button>
                    ${isAdmin ? `<button class="btn btn-danger" onclick="openWithdraw(${i},'${escHtml(title)}',${totalEth})">💰 Withdraw</button>` : ""}
                </div>`;
            list.appendChild(card);

            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = `#${i} – ${title}`;
            leaderSelect.appendChild(opt);
        }
    } catch (err) {
        list.innerHTML = "<p class='muted'>Error loading campaigns.</p>";
        showStatus("Load error: " + err.message, "error");
    }
}

// ── Donate ─────────────────────────────────────────────────
function openDonate(id, title) {
    selectedCampaignId = id;
    document.getElementById("donateCampTitle").textContent = title;
    document.getElementById("donateSection").classList.remove("hidden");
    document.getElementById("donateSection").scrollIntoView({ behavior: "smooth" });
}

function closeDonate() {
    document.getElementById("donateSection").classList.add("hidden");
    document.getElementById("donateAmount").value = "";
    selectedCampaignId = null;
}

async function donate() {
    const amount = parseFloat(document.getElementById("donateAmount").value);
    if (!selectedCampaignId || isNaN(amount) || amount <= 0) {
        showStatus("Enter a valid donation amount.", "error");
        return;
    }
    try {
        showStatus("Sending donation… please confirm in MetaMask.", "info");
        const tx = await contract.donate(selectedCampaignId, {
            value: ethers.utils.parseEther(amount.toString())
        });
        showStatus("Transaction sent. Waiting for confirmation…", "warning");
        await tx.wait();
        showStatus(`✅ Donated ${amount} ETH successfully! 🎉`, "success");
        closeDonate();
        await loadCampaigns();
        await loadHistory();
    } catch (err) {
        showStatus("Donation failed: " + (err.reason || err.message), "error");
    }
}

// ── Withdraw ───────────────────────────────────────────────
let withdrawCampaignId = null;

function openWithdraw(id, title, amount) {
    withdrawCampaignId = id;
    document.getElementById("withdrawCampName").textContent = title;
    document.getElementById("withdrawAmount").textContent   = parseFloat(amount).toFixed(6);
    document.getElementById("withdrawModal").classList.remove("hidden");
}

function closeWithdraw() {
    document.getElementById("withdrawModal").classList.add("hidden");
    withdrawCampaignId = null;
}

async function withdrawDonations() {
    if (!withdrawCampaignId) return;
    try {
        showStatus("Withdrawing funds… please confirm in MetaMask.", "info");
        const tx = await contract.withdrawDonations(withdrawCampaignId);
        showStatus("Transaction sent. Waiting for confirmation…", "warning");
        await tx.wait();
        showStatus("✅ Funds withdrawn successfully!", "success");
        closeWithdraw();
        await loadCampaigns();
    } catch (err) {
        showStatus("Withdrawal failed: " + (err.reason || err.message), "error");
    }
}

// ── Donor History ──────────────────────────────────────────
async function loadHistory() {
    if (!contract || !userAddress) return;
    const container = document.getElementById("historyList");
    container.innerHTML = "<p class='muted'>Loading…</p>";
    try {
        const records = await contract.getDonorHistory(userAddress);
        if (records.length === 0) {
            container.innerHTML = "<p class='muted'>No donations yet.</p>";
            return;
        }
        let html = `<table class="history-table">
            <thead><tr><th>Campaign ID</th><th>Amount (ETH)</th><th>Date</th><th>Certificate</th></tr></thead><tbody>`;
        for (const r of records) {
            const date = new Date(r.timestamp.toNumber() * 1000).toLocaleString();
            const eth  = parseFloat(ethers.utils.formatEther(r.amount)).toFixed(6);
            const campId = r.campaignId.toNumber ? r.campaignId.toNumber() : r.campaignId;
            html += `<tr><td>#${campId}</td><td>${eth} ETH</td><td>${date}</td><td><button class="btn btn-cert" onclick="generateCertificate('Campaign #${campId}','${eth}','${date}')">🎓 Certificate</button></td></tr>`;
        }
        html += "</tbody></table>";
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = "<p class='muted'>Error loading history.</p>";
    }
}

// ── Leaderboard ────────────────────────────────────────────
async function loadLeaderboard() {
    const campId = document.getElementById("leaderCampSelect").value;
    if (!campId) { showStatus("Select a campaign first.", "error"); return; }
    const container = document.getElementById("leaderboardList");
    container.innerHTML = "<p class='muted'>Loading…</p>";
    try {
        const [donors, amounts] = await contract.getLeaderboard(parseInt(campId));
        if (donors.length === 0) {
            container.innerHTML = "<p class='muted'>No donors yet.</p>";
            return;
        }
        let html = `<table class="leaderboard-table">
            <thead><tr><th>Rank</th><th>Address</th><th>Total Donated (ETH)</th></tr></thead><tbody>`;
        for (let i = 0; i < donors.length; i++) {
            const eth  = parseFloat(ethers.utils.formatEther(amounts[i])).toFixed(6);
            const addr = donors[i].slice(0, 8) + "…" + donors[i].slice(-6);
            const rankClass = i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
            html += `<tr class="${rankClass}"><td>${medal}</td><td class="addr-short">${addr}</td><td>${eth} ETH</td></tr>`;
        }
        html += "</tbody></table>";
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = "<p class='muted'>Error loading leaderboard.</p>";
        showStatus("Leaderboard error: " + err.message, "error");
    }
}

// ── Certificate Generator ─────────────────────────────────
function generateCertificate(campaignTitle, amountEth, dateStr) {
    const canvas = document.createElement("canvas");
    canvas.width = 900; canvas.height = 620;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer border
    ctx.strokeStyle = "#6c63ff";
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    // Inner border
    ctx.strokeStyle = "#00d4aa";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Header
    ctx.fillStyle = "#6c63ff";
    ctx.font = "bold 38px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⛓ CharityChain", canvas.width / 2, 100);

    ctx.fillStyle = "#00d4aa";
    ctx.font = "bold 26px Segoe UI, sans-serif";
    ctx.fillText("Certificate of Donation", canvas.width / 2, 150);

    // Divider
    ctx.strokeStyle = "#2a2a4a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 170); ctx.lineTo(820, 170);
    ctx.stroke();

    // Body text
    ctx.fillStyle = "#7a7a9a";
    ctx.font = "18px Segoe UI, sans-serif";
    ctx.fillText("This certifies that a donation was made to", canvas.width / 2, 220);

    ctx.fillStyle = "#e0e0f0";
    ctx.font = "bold 28px Segoe UI, sans-serif";
    ctx.fillText(campaignTitle, canvas.width / 2, 270);

    ctx.fillStyle = "#7a7a9a";
    ctx.font = "18px Segoe UI, sans-serif";
    ctx.fillText("on the Ethereum Sepolia Blockchain", canvas.width / 2, 310);

    // Amount
    ctx.fillStyle = "#00d4aa";
    ctx.font = "bold 42px Segoe UI, sans-serif";
    ctx.fillText(amountEth + " ETH", canvas.width / 2, 390);

    ctx.fillStyle = "#7a7a9a";
    ctx.font = "16px Segoe UI, sans-serif";
    ctx.fillText("Date: " + dateStr, canvas.width / 2, 440);

    // Footer
    ctx.strokeStyle = "#2a2a4a";
    ctx.beginPath();
    ctx.moveTo(80, 510); ctx.lineTo(820, 510);
    ctx.stroke();

    ctx.fillStyle = "#6c63ff";
    ctx.font = "14px Segoe UI, sans-serif";
    ctx.fillText("Powered by Ethereum Sepolia Testnet — CharityChain © 2025", canvas.width / 2, 545);

    // Download
    const link = document.createElement("a");
    link.download = `CharityChain_Certificate_${campaignTitle.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
