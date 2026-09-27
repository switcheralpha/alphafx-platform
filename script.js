// Set your confirmed Deriv credential tokens
const APP_ID = '34wcxRVEdodj1YqoCWJP0'; 
const REDIRECT_URI = 'https://alphafx.com';
const wsUrl = `wss://://derivws.com{APP_ID}`;

let ws;
let currentAsset = 'R_100';
let digitHistory = [];
let isBotActive = false;

// Initialize layout elements
let priceDisplay, connectionStatus, assetSelector, botToggleBtn, botLogs;

function setupElements() {
    priceDisplay = document.getElementById('price-display');
    connectionStatus = document.getElementById('connection-status');
    assetSelector = document.getElementById('asset-selector');
    botToggleBtn = document.getElementById('bot-toggle-btn');
    botLogs = document.getElementById('bot-logs');

    if (assetSelector) {
        assetSelector.addEventListener('change', (e) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ forget: currentAsset })); 
                currentAsset = e.target.value;
                digitHistory = []; 
                ws.send(JSON.stringify({ ticks: currentAsset })); 
            }
        });
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = `https://deriv.com{APP_ID}&l=en&brand=deriv&redirect_uri=${REDIRECT_URI}`;
        });
    }
}

// Initialize Connection
function initWebSocket() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        if (connectionStatus) {
            connectionStatus.innerText = "Live Connected";
            connectionStatus.className = "bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-medium";
        }
        ws.send(JSON.stringify({ ticks: currentAsset }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.msg_type === 'tick' && data.tick.symbol === currentAsset) {
            const price = data.tick.quote;
            if (priceDisplay) priceDisplay.innerText = price.toFixed(4);

            const priceStr = price.toString();
            const lastDigit = parseInt(priceStr.charAt(priceStr.length - 1));
            if (!isNaN(lastDigit)) {
                processDigits(lastDigit);
            }
        }
    };

    ws.onclose = () => {
        if (connectionStatus) {
            connectionStatus.innerText = "Reconnecting...";
            connectionStatus.className = "bg-rose-950 border border-rose-800 text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-medium animate-pulse";
        }
        setTimeout(initWebSocket, 3000);
    };
}

function processDigits(newDigit) {
    digitHistory.push(newDigit);
    if (digitHistory.length > 100) digitHistory.shift();

    const counts = Array(10).fill(0);
    digitHistory.forEach(d => counts[d]++);

    const container = document.getElementById('digit-bars-container');
    if (!container) return;

    let html = '';
    counts.forEach((count, idx) => {
        const pct = (count / digitHistory.length) * 100;
        let colorClass = 'bg-cyan-500';
        if (pct > 13) colorClass = 'bg-emerald-500';
        if (pct < 7) colorClass = 'bg-rose-500';

        html += `
            <div class="flex items-center gap-3 text-[11px] font-mono">
                <span class="w-3 font-bold text-slate-300 text-right">${idx}</span>
                <div class="flex-1 bg-slate-950 h-3 rounded overflow-hidden border border-slate-800">
                    <div class="h-full ${colorClass} transition-all duration-300" style="width: ${Math.max(pct * 3, 2)}%"></div>
                </div>
                <span class="w-10 text-slate-400 font-bold">${pct.toFixed(1)}%</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.switchTab = function(tabName) {
    ['trader', 'digits', 'bot'].forEach(t => {
        const view = document.getElementById(`view-${t}`);
        const tab = document.getElementById(`tab-${t}`);
        if (view) view.classList.add('hidden');
        if (tab) tab.className = "px-3 py-3 border-b-2 border-transparent text-slate-400";
    });
    const activeView = document.getElementById(`view-${tabName}`);
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeView) {
        activeView.classList.remove('hidden');
        activeView.classList.add('flex');
    }
    if (activeTab) activeTab.className = "px-3 py-3 border-b-2 border-[#ff444f] text-white";
}

window.onload = () => {
    setupElements();
    initWebSocket();
};
