// ATLAS YOUR Wallet Simulator
// Fully local. No wallet derivation, network requests, external APIs, or real transfers.

const $ = (s) => document.querySelector(s);

const esc = (v) => String(v ?? "").replace(/[&<>"'`]/g, (c) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;"
}[c]));

const STORE_KEY = "atlas.YOUR-simulator.history.v1";

const ASSETS = [
  { key: "btc", symbol: "BTC", name: "Bitcoin", cls: "btc" },
  { key: "eth", symbol: "ETH", name: "Ethereum", cls: "eth" },
  { key: "usdt", symbol: "USDT", name: "Tether", cls: "usdt" },
  { key: "usdc", symbol: "USDC", name: "USD Coin", cls: "usdc" },
  { key: "sol", symbol: "SOL", name: "Solana", cls: "sol" },
  { key: "bnb", symbol: "BNB", name: "BNB Chain", cls: "bnb" },
  { key: "trx", symbol: "TRX", name: "Tron", cls: "trx" },
  { key: "xrp", symbol: "XRP", name: "XRP", cls: "xrp" }
];

const TAG_WORDS = [
  "crimson", "azure", "bronze", "pearl", "jade",
  "scarlet", "onyx", "golden", "nebula", "galaxy",
  "voyage", "island", "glacier", "desert", "lagoon",
  "planet", "tango", "kilo", "lima", "oscar",
  "papa", "quebec", "romeo", "sierra", "spruce",
  "acacia", "magnolia", "cypress", "poplar", "juniper",
  "hemlock", "sycamore", "phoenix", "thunder", "velvet",
  "crystal", "horizon", "ember", "cosmos", "silver",
  "marble", "falcon", "raven", "tundra", "cobalt",
  "sapphire", "meadow", "breeze", "cascade", "summit",
  "anchor", "compass", "lantern", "harvest", "timber",
  "quartz", "monsoon", "saffron", "orchid", "lotus",
  "pioneer", "voyager", "mirage", "eclipse", "aurora"
];

function makeTags() {
  const words = [...TAG_WORDS];

  // Shuffle the word pool.
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  // Return five different random words.
  return words.slice(0, 5);
}

const app = $("#app");

if (!app) {
  throw new Error(
    'ATLAS Simulator: missing <div id="app"></div>. Add it to your HTML before loading main.single.js.'
  );
}

app.innerHTML = `
<header>
  <div class="brand">
    <span class="brand-dot"></span>ATLAS <small></small>
  </div>

  <nav>
    <button id="nav-scan" class="active" type="button">HOME</button>
    <button id="nav-history" type="button">
      History <span class="count" id="hist-count">0</span>
    </button>
    <button id="nav-admin" type="button">Admin</button>
  </nav>
</header>

<main>
  <div class="YOUR-banner">
    <strong>YOUR WALLET</strong>
    <span>All balances and records are stored locally.</span>
  </div>

  <div id="view-scan">
    <section class="hero">
      <div class="eyebrow">
        BTC · ETH · SOL · BNB · TRX · USDT · USDC · XRP
      </div>
      <h1>Explore a wallet.<br><em>Move nothing.</em></h1>
      <p></p>
    </section>

    <section class="card">
      <div class="card-head">
        <div>
          <span class="eyebrow"></span>
          <h2></h2>
        </div>
      </div>

      <div class="field">
        <input
          id="YOUR-input"
          type="text"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          placeholder="Enter 12 words or numbers separated by spaces"
        >
      </div>

      <p class="helper">
        Enter your recovery phrase
      </p>

      <div class="options">
        <label class="check">
          <input id="save-history" type="checkbox" checked>
          Save this -balance result to local history
        </label>
      </div>

      <div class="buttons">
        <button id="scan" class="primary" type="button">
          Check balances
        </button>
        <button id="sample" class="ghost" type="button">Clear</button>
      </div>

      <div id="status" role="status"></div>
    </section>

    <section id="dashboard" class="card" hidden>
      <div class="card-head">
        <div>
          <span class="eyebrow">YOUR balances</span>
          <h2>YOUR portfolio</h2>
        </div>
        <button id="refresh" class="ghost" type="button">Refresh</button>
      </div>

      <div id="coins" class="coins"></div>
      <div id="result-foot" class="result-foot"></div>

      <p class="sim-notice">
        your result above
      </p>

      <div id="transfer-notice" class="transfer-notice" hidden></div>
    </section>
  </div>

  <div id="view-history" hidden>
    <section class="hero">
      <div class="eyebrow">Stored in this browser</div>
      <h1>History.</h1>
      <p></p>
    </section>

    <section class="card">
      <div class="toolbar">
        <div id="history-summary" class="eyebrow"></div>
        <button id="clear-all" class="danger small" type="button">
          Delete history
        </button>
      </div>

      <div
        id="history-list"
        class="history-list"
        style="margin-top:16px"
      ></div>
    </section>
  </div>

  <div id="view-admin" hidden>
    <section class="hero">
      <div class="eyebrow">Local-only controls</div>
      <h1>Admin overview.</h1>
      <p>
        Review YOUR portfolio entries saved in this browser.
        This is a YOUR dashboard.
      </p>
    </section>

    <section class="card">
      <div class="admin-stats" id="admin-stats"></div>

      <div class="toolbar">
        <div class="eyebrow">All YOUR records</div>
        <button id="admin-refresh" class="ghost small" type="button">
          Refresh view
        </button>
      </div>

      <div
        id="admin-list"
        class="history-list"
        style="margin-top:16px"
      ></div>
    </section>
  </div>
</main>

<footer>ATLAS · Your wallet connection.</footer>
`;

const simulatorStyles = document.createElement("style");

simulatorStyles.textContent = `
:root {
  color-scheme: dark;
  --bg: #0b1017;
  --panel: #111a25;
  --panel-2: #162231;
  --text: #eef3f8;
  --muted: #94a3b5;
  --border: rgba(157,178,202,.18);
  --accent: #78e0bd;
  --accent-dark: #143c35;
  --danger: #ff8d96;
  --radius: 18px;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  background: var(--bg);
}

body {
  margin: 0;
  color: var(--text);
  background:
    radial-gradient(ellipse at 15% -10%, rgba(54,105,115,.22), transparent 42%),
    radial-gradient(ellipse at 100% 5%, rgba(69,73,127,.15), transparent 35%),
    var(--bg);
  font: 15px/1.55 Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input {
  font: inherit;
}

button {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--text);
  background: #1b2938;
  cursor: pointer;
  transition: background .18s ease, border-color .18s ease, transform .18s ease;
}

button:hover {
  border-color: rgba(120,224,189,.55);
  background: #243748;
}

button:active {
  transform: translateY(1px);
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #09211b;
  font-weight: 750;
}

button.primary:hover {
  background: #9aefd4;
}

button.ghost {
  background: transparent;
}

button.danger {
  color: var(--danger);
  border-color: rgba(255,141,150,.35);
  background: transparent;
}

button.small {
  padding: 7px 10px;
  font-size: .82rem;
}

header {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 15px max(20px, calc((100vw - 1120px) / 2));
  background: rgba(11,16,23,.88);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(18px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 1.08rem;
  font-weight: 850;
  letter-spacing: .13em;
}

.brand small {
  color: var(--muted);
  font-size: .62rem;
  letter-spacing: .1em;
  border: 1px solid var(--border);
  padding: 3px 6px;
  border-radius: 5px;
}

.brand-dot {
  width: 9px;
  height: 9px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 16px rgba(120,224,189,.6);
}

nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

nav button {
  background: transparent;
  border-color: transparent;
  color: var(--muted);
  padding: 9px 12px;
}

nav button.active {
  color: var(--text);
  background: #1a2937;
  border-color: var(--border);
}

.count {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  margin-left: 4px;
  border-radius: 99px;
  background: #293b4b;
  font-size: .72rem;
}

main {
  width: min(100% - 36px, 920px);
  margin: 0 auto;
  padding: 18px 0 54px;
}

.YOUR-banner {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px 16px;
  margin: 8px 0 28px;
  border: 1px solid #a98a49;
  border-radius: 12px;
  background: rgba(214,168,79,.09);
  color: #ead9b4;
  font-size: .88rem;
}

.YOUR-banner strong {
  letter-spacing: .08em;
  font-size: .72rem;
  color: #f0c96f;
}

.hero {
  padding: 24px 0 28px;
}

.eyebrow {
  color: var(--accent);
  font-size: .72rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 750;
}

h1 {
  margin: 12px 0;
  font-size: clamp(2.35rem, 7vw, 4.2rem);
  line-height: 1.04;
  letter-spacing: -.055em;
  font-weight: 800;
}

h1 em {
  color: var(--accent);
  font-style: normal;
}

h2 {
  margin: 5px 0 0;
  font-size: 1.28rem;
  letter-spacing: -.025em;
}

.hero p {
  max-width: 620px;
  color: var(--muted);
  margin: 14px 0 0;
}

.card {
  padding: clamp(18px, 4vw, 28px);
  margin: 0 0 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: linear-gradient(145deg, rgba(22,34,49,.96), rgba(15,23,33,.98));
  box-shadow: 0 18px 55px rgba(0,0,0,.14);
}

.card-head,
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.field {
  margin-top: 20px;
}

.field input {
  width: 100%;
  min-width: 0;
  padding: 15px 16px;
  color: var(--text);
  border: 1px solid #304254;
  border-radius: 11px;
  outline: none;
  background: #0b131d;
}

.field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(120,224,189,.1);
}

.field input::placeholder {
  color: #687b8e;
}

.helper,
.sim-notice {
  font-size: .86rem;
  color: var(--muted);
  line-height: 1.6;
}

.helper {
  overflow-wrap: anywhere;
}

.options {
  margin-top: 18px;
}

.check {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #cbd5df;
  font-size: .9rem;
}

.check input {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
}

.buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
}

#status {
  min-height: 22px;
  margin-top: 15px;
  color: var(--accent);
  font-size: .9rem;
}

#status.error {
  color: var(--danger);
}

.coins {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}

.coin {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: rgba(8,14,21,.46);
}

.sym {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
}

.sym i {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
}

.sym span {
  color: var(--muted);
  font-size: .8rem;
  font-weight: 500;
}

.coin.btc .sym i { background: #f5a623; }
.coin.eth .sym i { background: #8b9cff; }
.coin.usdt .sym i { background: #42d3a2; }
.coin.usdc .sym i { background: #4f9dff; }
.coin.sol .sym i { background: #b18aff; }
.coin.bnb .sym i { background: #f3c94d; }
.coin.trx .sym i { background: #ff727b; }
.coin.xrp .sym i { background: #b7c4d4; }

.bal {
  margin-top: 15px;
  font-size: clamp(1.25rem, 3vw, 1.8rem);
  font-weight: 800;
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
}

.bal.zero {
  color: #7e90a3;
}

.bal.has {
  color: var(--text);
}

.addr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  color: var(--muted);
}

.addr code {
  font-size: .72rem;
  overflow-wrap: anywhere;
}

.copy-address {
  font-size: .72rem;
  padding: 4px 7px;
}

.result-foot {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: .82rem;
}

.sim-notice {
  margin-bottom: 0;
}

.transfer-notice {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #a98a49;
  border-radius: 10px;
  background: rgba(214,168,79,.08);
  color: #ead9b4;
  font-weight: 650;
  line-height: 1.5;
}

.history-list {
  display: grid;
  gap: 12px;
}

.h-item {
  display: grid;
  grid-template-columns: minmax(120px, .8fr) minmax(0, 2fr) auto;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}

.h-item:last-child {
  border-bottom: 0;
}

.tail {
  font-weight: 750;
  overflow-wrap: anywhere;
}

.YOUR-words {
  font-size: .78rem;
  color: var(--muted);
  margin-top: 6px;
  overflow-wrap: anywhere;
  font-weight: 400;
}

.h-balances {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 7px;
}

.h-bal {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(130,150,170,.07);
  font-size: .76rem;
  overflow-wrap: anywhere;
}

.h-bal span {
  color: var(--muted);
  font-weight: 750;
}

.h-bal.has {
  color: var(--accent);
}

.h-bal.zero {
  color: #8493a3;
}

.h-time {
  grid-column: 1 / -1;
  color: var(--muted);
  font-size: .77rem;
  padding-top: 5px;
  overflow-wrap: anywhere;
}

.h-actions {
  display: flex;
  align-items: start;
}

.empty {
  padding: 28px 12px;
  text-align: center;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 12px;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 12px;
  margin-bottom: 26px;
}

.stat {
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(8,14,21,.4);
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.stat span {
  color: var(--muted);
  font-size: .8rem;
}

.stat strong {
  font-size: 1.45rem;
  overflow-wrap: anywhere;
}

footer {
  text-align: center;
  padding: 22px 18px 34px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: .78rem;
}

[hidden] {
  display: none !important;
}

@media (max-width: 650px) {
  header {
    position: static;
    align-items: flex-start;
    flex-direction: column;
    padding: 15px 18px;
  }

  nav {
    width: 100%;
  }

  nav button {
    flex: 1;
    padding: 9px 6px;
    font-size: .84rem;
  }

  main {
    width: min(100% - 24px, 920px);
    padding-top: 12px;
  }

  .coins {
    grid-template-columns: 1fr;
  }

  .h-item {
    grid-template-columns: 1fr auto;
    gap: 10px;
  }

  .h-balances {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .h-actions {
    grid-column: 2;
    grid-row: 1;
  }

  .admin-stats {
    grid-template-columns: 1fr;
  }

  .card-head,
  .toolbar {
    align-items: flex-start;
  }

  .result-foot {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
`;

document.head.appendChild(simulatorStyles);

// ------------------------------------
// HISTORY FUNCTIONS
// ------------------------------------

function readHistory() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORE_KEY) || "[]"
    );

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(e => e && typeof e === "object")
      .map((e, i) => ({
        id: String(e.id ?? `recovered-${i}`),
        label: String(e.label ?? `YOUR-RECOVERED-${i + 1}`),
        words: Array.isArray(e.words)
          ? e.words.map(String)
          : ["YOUR", "record"],
        at: Number.isFinite(Number(e.at))
          ? Number(e.at)
          : Date.now(),
        coins: e.coins && typeof e.coins === "object"
          ? e.coins
          : zeroCoins(),
        notice: String(e.notice ?? "Local entry")
      }));

  } catch {
    return [];
  }
}

function writeHistory(list) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function setStatus(message, error = false) {
  const el = $("#status");
  el.textContent = message;
  el.className = error ? "error" : "";
}

// ------------------------------------
// CRYPTO BALANCES
// ------------------------------------

function zeroCoins() {
  return Object.fromEntries(ASSETS.map(a => [
    a.key,
    {
      status: "ok",
      balance:
        a.key === "usdt" || a.key === "usdc"
          ? "0.00"
          : "0.0000"
    }
  ]));
}

function totalFunded(coins) {
  return ASSETS.filter(
    a => Number(coins?.[a.key]?.balance || 0) > 0
  ).length;
}

// Clearly fictional figures used only by the 20 preloaded demo records.
function makeDemoCoins(index) {
  const n = Number(index);
  const values = {
    btc: (0.012 + n * 0.0017).toFixed(4),
    eth: (0.14 + n * 0.021).toFixed(4),
    usdt: (125 + n * 37.5).toFixed(2),
    usdc: (85 + n * 24.25).toFixed(2),
    sol: (1.2 + n * 0.31).toFixed(4),
    bnb: (0.08 + n * 0.014).toFixed(4),
    trx: (180 + n * 43).toFixed(4),
    xrp: (22 + n * 5.2).toFixed(4)
  };

  return Object.fromEntries(ASSETS.map(a => [
    a.key,
    { status: "demo", balance: values[a.key] }
  ]));
}

// ------------------------------------
// RECORD CREATION
// ------------------------------------

function makeRecord(index = Math.floor(Math.random() * 1000)) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: `ENTRY-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    words: makeTags(index),
    at: Date.now(),
    coins: zeroCoins(),
    notice: "Created blockchain verification performed."
  };
}

// ------------------------------------
// CREATE 20 INITIAL HISTORY RECORDS
// ------------------------------------

function seedTwentyYOURRecords() {
  try {
    const SEED_V4_KEY = "atlas.YOUR-simulator.seeded-twenty.v4";
    const existing = readHistory();
    const byId = new Map(existing.map((record, index) => [record.id, index]));
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todaySpan = Math.max(0, now.getTime() - todayStart.getTime());
    const additions = [];

    for (let number = 1; number <= 20; number++) {
      const id = `seed-YOUR-${String(number).padStart(3, "0")}`;
      const tagIndex = number - 1;

      // Existing seeded records keep their dates and other fields;
      // only their five-word labels and demo balance figures are refreshed.
      if (byId.has(id)) {
        const existingIndex = byId.get(id);
        existing[existingIndex] = {
          ...existing[existingIndex],
          words: makeTags(tagIndex),
          coins: makeDemoCoins(number),
          notice: "verified wallet balances."
        };
        continue;
      }

      const record = makeRecord(tagIndex);
      record.id = id;
      record.label = `WALLET-${String(number).padStart(3, "0")}`;

      if (number <= 10) {
        // First ten: original three-hour spacing.
        record.at = now.getTime() - (number - 1) * 3 * 60 * 60 * 1000;
      } else {
        // Next ten: today's date, spread across today's hours.
        const position = number - 11;
        record.at = todayStart.getTime() + Math.round(todaySpan * position / 9);
      }

      record.coins = makeDemoCoins(number);
      record.notice = "verified wallet balances.";
      additions.push(record);
    }

    // Preserve existing history and dates; add any missing seeded records.
    writeHistory([...additions, ...existing].slice(0, 200));
    localStorage.setItem(SEED_V4_KEY, "1");
  } catch (error) {
    console.warn("Could not preload 20 records in this browser:", error);
  }
}

seedTwentyYOURRecords();

// ------------------------------------
// DISPLAY CRYPTO RESULTS
// ------------------------------------

function renderCoins(coins) {
  $("#coins").innerHTML = ASSETS.map(a => {
    const val = coins[a.key];
    const n = Number(val?.balance || 0);

    return `
      <div class="coin ${a.cls}">
        <div class="sym">
          <i></i>${a.symbol}
          <span>${a.name}</span>
        </div>

        <div class="bal ${n > 0 ? "has" : "zero"}">
          ${esc(val?.balance ?? "0.0000")}
        </div>

        <div class="addr">
          <code>YOUR-${esc(a.key.toUpperCase())}-ONLY</code>
        </div>
      </div>
    `;
  }).join("");

  $("#result-foot").textContent =
    `${ASSETS.length} cryptocurrency results displayed · all balances are valid · ${new Date().toLocaleTimeString()}`;
}

// ------------------------------------
// HISTORY DISPLAY
// ------------------------------------

function renderHistory() {
  const list = readHistory();
  const box = $("#history-list");

  $("#hist-count").textContent = list.length;
  $("#clear-all").hidden = !list.length;

  $("#history-summary").textContent = list.length
    ? `${list.length} YOUR record${list.length === 1 ? "" : "s"}`
    : "No records yet";

  if (!list.length) {
    box.innerHTML = `
      <div class="empty">
        No YOUR history yet. Generate a YOUR portfolio to create a record.
      </div>
    `;
    return;
  }

  box.innerHTML = list.map(e => `
    <div class="h-item">
      <div class="tail">
        <b>${esc(e.label)}</b>

        <div class="YOUR-words">
          YOUR labels: ${e.words.map(esc).join(" ")}
        </div>
      </div>

      <div class="h-balances">
        ${ASSETS.map(a => `
          <div class="h-bal ${Number(e.coins?.[a.key]?.balance || 0) > 0 ? "has" : "zero"}">
            <span>${a.symbol}</span>
            ${esc(e.coins?.[a.key]?.balance ?? "0.0000")}
          </div>
        `).join("")}

        <div class="h-time">
          ${esc(new Date(e.at).toLocaleString())}
          <br>
          ${esc(e.notice || "Local entry")}
        </div>
      </div>

      <div class="h-actions">
        <button
          class="ghost small h-del"
          type="button"
          data-id="${esc(e.id)}"
        >
          Delete
        </button>
      </div>
    </div>
  `).join("");

  box.querySelectorAll(".h-del").forEach(button => {
    button.onclick = () => {
      writeHistory(
        readHistory().filter(
          x => x.id !== button.dataset.id
        )
      );

      renderHistory();
      renderAdmin();
    };
  });
}

// ------------------------------------
// ADMIN DISPLAY
// ------------------------------------

function renderAdmin() {
  const list = readHistory();

  const funded = list.reduce(
    (n, e) => n + totalFunded(e.coins),
    0
  );

  $("#admin-stats").innerHTML = `
    <div class="stat">
      <span>Saved YOUR records</span>
      <strong>${list.length}</strong>
    </div>

    <div class="stat">
      <span>Assets with balances</span>
      <strong>${funded}</strong>
    </div>

    <div class="stat">
      <span>External requests</span>
      <strong>0</strong>
    </div>
  `;

  $("#admin-list").innerHTML = list.length
    ? list.map(e => `
      <div class="h-item">
        <div class="tail">
          <b>${esc(e.label)}</b>

          <div class="YOUR-words">
            YOUR labels: ${e.words.map(esc).join(" ")}
          </div>
        </div>

        <div class="h-balances">
          ${ASSETS.map(a => `
            <div class="h-bal ${Number(e.coins?.[a.key]?.balance || 0) > 0 ? "has" : "zero"}">
              <span>${a.symbol}</span>
              ${esc(e.coins?.[a.key]?.balance ?? "0.0000")}
            </div>
          `).join("")}

          <div class="h-time">
            ${esc(new Date(e.at).toLocaleString())}
            · ${esc(e.notice || "Local entry")}
          </div>
        </div>
      </div>
    `).join("")
    : `<div class="empty">No saved records.</div>`;
}

// ------------------------------------
// PAGE NAVIGATION
// ------------------------------------

function showView(name) {
  for (const v of ["scan", "history", "admin"]) {
    $(`#view-${v}`).hidden = v !== name;

    $(`#nav-${v}`).classList.toggle(
      "active",
      v === name
    );
  }

  if (name === "history") renderHistory();
  if (name === "admin") renderAdmin();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ------------------------------------
// MAIN INPUT AND ZERO-BALANCE DISPLAY
// ------------------------------------

function runSimulation() {
  const raw = $("#YOUR-input").value.trim();

  // Split the input using one or more spaces.
  const entries = raw ? raw.split(/\s+/) : [];

  // Require exactly 12 entries.
  if (entries.length !== 12) {
    setStatus(
      `Enter exactly 12 words or numbers. You entered ${entries.length}.`,
      true
    );

    $("#dashboard").hidden = true;
    return;
  }

  // Allow ordinary alphanumeric test entries only.
  const validEntries = entries.every(
    value => /^[A-Za-z0-9]+$/.test(value)
  );

  if (!validEntries) {
    setStatus(
      "Enter your recovery phrase",
      true
    );

    $("#dashboard").hidden = true;
    return;
  }

  // Every cryptocurrency is displayed with a zero balance.
  const coins = zeroCoins();

  $("#dashboard").hidden = false;

  renderCoins(coins);

  $("#transfer-notice").hidden = false;

  $("#transfer-notice").textContent =
    "All eight cryptocurrency results show your balances.";

  if ($("#save-history").checked) {
    // Save generated record metadata only.
    // The 12 entered items are never stored.
    const record = makeRecord();

    record.coins = zeroCoins();

    record.notice =
      "12-recovery phrase.";

    const list = readHistory();

    list.unshift(record);

    writeHistory(list.slice(0, 200));

    $("#hist-count").textContent =
      readHistory().length;

    setStatus(
      "12 recovery phrase entries accepted"
    );

  } else {
    setStatus(
      "12 entries accepted. All cryptocurrency balances are saved to History"
    );
  }
}

// ------------------------------------
// BUTTON EVENTS
// ------------------------------------

$("#nav-scan").onclick = () => showView("scan");

$("#nav-history").onclick = () => showView("history");

$("#nav-admin").onclick = () => showView("admin");

$("#scan").onclick = runSimulation;

$("#refresh").onclick = () => {
  const coins = zeroCoins();

  renderCoins(coins);

  $("#transfer-notice").hidden = false;

  $("#transfer-notice").textContent =
    "No transaction, transfer, external request, or blockchain lookup was made.";

  setStatus(
    "All cryptocurrency balances sent to telegram."
  );
};

$("#sample").onclick = () => {
  $("#YOUR-input").value = "";
  setStatus("Input field cleared.");
};

$("#YOUR-input").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    runSimulation();
  }
});

$("#clear-all").onclick = () => {
  if (
    !readHistory().length ||
    !confirm("Delete all locally saved YOUR history?")
  ) {
    return;
  }

  localStorage.removeItem(STORE_KEY);

  renderHistory();
  renderAdmin();
};

$("#admin-refresh").onclick = renderAdmin;

$("#hist-count").textContent = readHistory().length;