/*
  KOMUNIFY PROTOTYPE -- shared state + data layer
  Simulated wallet/subscription state in localStorage. No real chain calls.
  Data constants mirror the REAL deployed testnet contract where possible.
*/

const KDATA = {
  // Real deployed KomunifyContract (Stellar testnet, deployed 2026-07-05)
  contractId: "CCJNKBUQAA7SAANVGJF4WFF4UFXMPCDDZACD5ERHILUHBWEROQZ2BQVC",
  demoTxHash: "29d91130a2163c0f0e36e576f69350aeb6695d349829327125383bbfb4f96a78",
  explorerBase: "https://stellar.expert/explorer/testnet",
  demoAddress: "GBUA4BW4NBE6T3XVYLXAQX7RBSM5NXNCKXEIW36KL6NYIUNZOAYRP4D2",
  demoBalanceXlm: 9873.42,

  priceXlm: 10,

  // 70/20/10 split, as configured in the deployed contract constructor
  split: [
    { name: "Project owner", pct: 70, cls: "" },
    { name: "Community manager", pct: 20, cls: "dim" },
    { name: "Komunify platform", pct: 10, cls: "dimmer" }
  ],

  // Whitelisted partner communities (MVP: static metadata)
  partners: [
    {
      id: "dwb",
      name: "Dev Web3 Bandung",
      initial: "D",
      avatarCls: "",
      benefits: [
        "Weekly builder workshop seat",
        "Private Soroban study group"
      ],
      content: [
        { type: "course", title: "Soroban 101: Build Your First Contract", meta: "6 modules · 2h 10m", modules: ["Accounts, keys and testnet XLM", "Your first contract in Rust", "Deploy and invoke from the frontend"] },
        { type: "video", title: "Day 2 Bootcamp Recording", meta: "1h 42m · members only" },
        { type: "link", title: "Members WhatsApp Group", meta: "Invite link for active subscribers" }
      ]
    },
    {
      id: "sid",
      name: "Stellar ID Collective",
      initial: "S",
      avatarCls: "a2",
      benefits: [
        "Testnet office hours access",
        "Ecosystem job board early access"
      ],
      content: [
        { type: "ebook", title: "Stellar Ecosystem Playbook 2026", meta: "48 pages · PDF" },
        { type: "video", title: "Office Hours Replay: Testnet to Mainnet", meta: "38m · members only" },
        { type: "link", title: "Ecosystem Job Board", meta: "Early access for subscribers" }
      ]
    },
    {
      id: "ccl",
      name: "Circolo Creative Lab",
      initial: "C",
      avatarCls: "a3",
      benefits: [
        "Co-working day pass, 2x per month"
      ],
      content: [
        { type: "course", title: "Creative Ops Mini-Class", meta: "4 modules · 55m", modules: ["Running a studio calendar", "Pricing creative work", "Client handoff rituals"] },
        { type: "ebook", title: "Co-working Guide and House Rules", meta: "12 pages · PDF" },
        { type: "link", title: "Booking Calendar", meta: "Reserve your day pass" }
      ]
    }
  ],

  // Tokenized listing layer (Feature 7.2): partner items with subscriber discount
  listings: [
    {
      name: "Soroban Bootcamp Recording Pack",
      partner: "Dev Web3 Bandung",
      priceXlm: 25,
      memberPriceXlm: 15,
      kind: "Digital resource"
    },
    {
      name: "Circolo Event Voucher",
      partner: "Circolo Creative Lab",
      priceXlm: 12,
      memberPriceXlm: 8,
      kind: "Tokenized voucher"
    }
  ],

  // Traction dashboard mock reads (prototype numbers; real contract has count=1, volume=10)
  stats: {
    subscribers: 128,
    volumeXlm: 1280,
    payoutEvents: 384
  },

  activity: [
    { kind: "Subscribe", detail: "10 XLM split 7 / 2 / 1", when: "2m ago" },
    { kind: "Payout", detail: "7 XLM to project owner", when: "2m ago" },
    { kind: "Payout", detail: "2 XLM to community manager", when: "2m ago" },
    { kind: "Subscribe", detail: "10 XLM split 7 / 2 / 1", when: "18m ago" },
    { kind: "Benefit redeemed", detail: "Circolo Event Voucher", when: "1h ago" }
  ]
};

const K = {
  get wallet() {
    return localStorage.getItem("k_wallet");
  },
  connect() {
    localStorage.setItem("k_wallet", KDATA.demoAddress);
  },
  disconnect() {
    localStorage.removeItem("k_wallet");
    localStorage.removeItem("k_sub");
  },
  get subscribed() {
    return localStorage.getItem("k_sub") === "1";
  },
  // Simulates the tx lifecycle: onPending fires immediately,
  // onSuccess fires after a fake confirmation delay.
  subscribe(onPending, onSuccess) {
    if (typeof onPending === "function") onPending();
    window.setTimeout(function () {
      localStorage.setItem("k_sub", "1");
      if (typeof onSuccess === "function") onSuccess(KDATA.demoTxHash);
    }, 1600);
  },
  reset() {
    localStorage.removeItem("k_wallet");
    localStorage.removeItem("k_sub");
  }
};

function shortAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 4) + "…" + addr.slice(-4);
}

function shortHash(hash) {
  if (!hash) return "";
  return hash.slice(0, 8) + "…" + hash.slice(-8);
}

function fmtXlm(n) {
  return (
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + " XLM"
  );
}

// Shared chrome: show the connected wallet in the topbar when present.
document.addEventListener("DOMContentLoaded", function () {
  var tw = document.getElementById("topbar-wallet");
  if (tw && K.wallet) {
    tw.textContent = shortAddr(K.wallet);
    tw.title = K.wallet;
    tw.classList.remove("hidden");
  }
});
