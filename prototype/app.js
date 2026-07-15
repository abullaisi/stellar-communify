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

  priceUsdc: 10,

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
      logo: "communities/dev-web3-bandung.png",
      members: "+2.4K members",
      benefits: [
        { t: "Weekly builder workshop seat", d: "Reserved spot every Thursday, on site or online" },
        { t: "Private Soroban study group", d: "Small-group sessions with a community mentor" }
      ],
      content: [
        { type: "course", title: "Soroban 101: Build Your First Contract", meta: "6 modules · 2h 10m", thumb: "assets/dwb-0.jpg", done: 1, modules: ["Accounts, keys and testnet XLM", "Your first contract in Rust", "Deploy and invoke from the frontend"] },
        { type: "video", title: "Day 2 Bootcamp Recording", meta: "1h 42m · members only", thumb: "assets/dwb-1.jpg" },
        { type: "link", title: "Members WhatsApp Group", meta: "Invite link for active subscribers", url: "https://chat.whatsapp.com" }
      ]
    },
    {
      id: "swg",
      name: "Sawargy",
      initial: "SW",
      avatarCls: "a2",
      logo: "communities/sawargy.png",
      members: "Pilot partner",
      benefits: [
        { t: "Member discount on Sawargy services", d: "10% off productized design and PM services for active subscribers" },
        { t: "Digital asset library access", d: "Templates, frameworks, and PM-OS resources for members" }
      ],
      content: [
        { type: "ebook", title: "Sawargy PM Operating System Starter Kit", meta: "32 pages · PDF" },
        { type: "video", title: "Sawargy Studio Walkthrough", meta: "22m · members only" },
        { type: "link", title: "Members Community Chat", meta: "Invite link for active subscribers", url: "https://t.me/" }
      ]
    },
    {
      id: "srn",
      name: "Serenity",
      initial: "SR",
      avatarCls: "a3",
      logo: "communities/serenity.webp",
      members: "Pilot partner",
      benefits: [
        { t: "Premium access to Serenity retreats", d: "Priority booking for members-only wellness sessions" },
        { t: "Learning resources: mindful productivity", d: "Guided courses on focus, rest, and sustainable work" }
      ],
      content: [
        { type: "course", title: "Mindful Productivity Fundamentals", meta: "4 modules · 1h 05m", done: 0, modules: ["Designing a rest rhythm", "Attention and deep work", "Recovery between sprints", "Building a sustainable week"] },
        { type: "ebook", title: "Serenity Wellbeing Guide", meta: "20 pages · PDF" },
        { type: "link", title: "Retreat Booking", meta: "Reserve your members-only session", url: "https://cal.com" }
      ]
    },
    {
      id: "mnx",
      name: "Manexus",
      initial: "M",
      avatarCls: "",
      logo: "communities/manexus.png",
      members: "Pilot partner",
      benefits: [
        { t: "Member discount on Manexus tooling", d: "15% off partner software and services for active subscribers" },
        { t: "Digital asset drops", d: "Early access to new templates and creative assets" }
      ],
      content: [
        { type: "video", title: "Manexus Product Walkthrough", meta: "18m · members only" },
        { type: "ebook", title: "Manexus Toolkit Guide", meta: "16 pages · PDF" },
        { type: "link", title: "Partner Discount Portal", meta: "Redeem your member pricing", url: "https://cal.com" }
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
      name: "Serenity Retreat Voucher",
      partner: "Serenity",
      priceXlm: 12,
      memberPriceXlm: 8,
      kind: "Tokenized voucher"
    }
  ],

  // Traction dashboard mock reads (prototype numbers; real contract has count=1, volume=10)
  stats: {
    subscribers: 128,
    volumeUsdc: 1280,
    payoutEvents: 384
  },

  activity: [
    { kind: "Subscribe", detail: "10 USDC split 7 / 2 / 1", addr: "GAJX…K3TQ", reward: "+10 USDC", when: "2m ago" },
    { kind: "Payout", detail: "to project owner", addr: "GDMV…HK2A", reward: "+7 USDC", when: "2m ago" },
    { kind: "Payout", detail: "to community manager", addr: "GDS7…M7FQ", reward: "+2 USDC", when: "2m ago" },
    { kind: "Subscribe", detail: "10 USDC split 7 / 2 / 1", addr: "GCRZ…9WLN", reward: "+10 USDC", when: "18m ago" },
    { kind: "Benefit redeemed", detail: "Circolo Event Voucher", addr: "GAJX…K3TQ", reward: "", when: "1h ago" }
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
  get lastViewed() {
    try { return JSON.parse(localStorage.getItem("k_last") || "null"); } catch (e) { return null; }
  },
  setLastViewed(v) {
    localStorage.setItem("k_last", JSON.stringify(v));
  },
  // Per-item progress, keyed "pid:idx". Course: {doneModules:[i,...]}. Video/ebook: {pct:0|100}.
  getProgress(pid, idx) {
    try {
      var all = JSON.parse(localStorage.getItem("k_progress") || "{}");
      return all[pid + ":" + idx] || { doneModules: [], pct: 0 };
    } catch (e) { return { doneModules: [], pct: 0 }; }
  },
  setProgress(pid, idx, prog) {
    var all;
    try { all = JSON.parse(localStorage.getItem("k_progress") || "{}"); } catch (e) { all = {}; }
    all[pid + ":" + idx] = prog;
    localStorage.setItem("k_progress", JSON.stringify(all));
  },
  // Member-price listing purchases (indexes into KDATA.listings).
  get owned() {
    try { return JSON.parse(localStorage.getItem("k_owned") || "[]"); } catch (e) { return []; }
  },
  addOwned(i) {
    var list = K.owned;
    if (list.indexOf(i) === -1) list.push(i);
    localStorage.setItem("k_owned", JSON.stringify(list));
  },
  // Personal activity log (newest first, capped at 8).
  get activity() {
    try { return JSON.parse(localStorage.getItem("k_act") || "[]"); } catch (e) { return []; }
  },
  logActivity(kind, detail) {
    var list = K.activity;
    list.unshift({ kind: kind, detail: detail, at: Date.now() });
    localStorage.setItem("k_act", JSON.stringify(list.slice(0, 8)));
  },
  reset() {
    ["k_wallet", "k_sub", "k_last", "k_progress", "k_owned", "k_act"].forEach(function (k) {
      localStorage.removeItem(k);
    });
  }
};

// Progress percentage for a content item: courses derive from modules, others store pct directly.
// Content-type icons (Feather Icons, MIT) + designed thumbnail tiles.
// Tiles are token-driven so they adapt to light/dark automatically.
var CONTENT_ICONS = {
  course: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
  ebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
};
function contentIcon(type) { return CONTENT_ICONS[type] || CONTENT_ICONS.link; }

// Nav + chrome icons (Feather Icons, MIT, monoline, currentColor -> theme-aware).
var NAV_ICONS = {
  "dashboard.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  "benefits.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>',
  "traction.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'
};
var ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
function contentThumb(type, size) {
  var cls = 'thumb ' + type + (size ? ' ' + size : '');
  return '<div class="' + cls + '">' + contentIcon(type) + '</div>';
}

function itemPct(item, prog) {
  if (item.modules && item.modules.length) {
    return Math.round(100 * (prog.doneModules || []).length / item.modules.length);
  }
  return prog.pct || 0;
}

function timeAgo(ts) {
  var s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  var m = Math.round(s / 60);
  if (m < 60) return m + "m ago";
  var h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}

// Theme: dark is the brand default; stored preference wins. Not cleared by demo reset.
(function () {
  document.documentElement.setAttribute("data-theme", localStorage.getItem("k_theme") || "dark");
})();

// Demo-state seeding via URL (?demo=fresh|wallet|sub): shareable states + headless captures.
(function () {
  var demo = new URLSearchParams(location.search).get("demo");
  if (!demo) return;
  if (demo === "fresh") {
    ["k_wallet", "k_sub", "k_last", "k_progress", "k_owned", "k_act"].forEach(function (k) {
      localStorage.removeItem(k);
    });
  }
  if (demo === "wallet") {
    localStorage.setItem("k_wallet", KDATA.demoAddress);
    localStorage.removeItem("k_sub");
  }
  if (demo === "sub") {
    localStorage.setItem("k_wallet", KDATA.demoAddress);
    localStorage.setItem("k_sub", "1");
    if (!localStorage.getItem("k_last")) {
      localStorage.setItem("k_last", JSON.stringify({ pid: "dwb", idx: 0 }));
      localStorage.setItem("k_progress", JSON.stringify({ "dwb:0": { doneModules: [0], pct: 0 } }));
      localStorage.setItem("k_act", JSON.stringify([
        { kind: "Module done", detail: "Accounts, keys and testnet XLM", at: Date.now() - 60000 },
        { kind: "Subscribed", detail: "Community Bundle · 10 USDC", at: Date.now() - 120000 }
      ]));
    }
  }
})();

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

function fmtUsdc(n) {
  return (
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + " USDC"
  );
}

function avatarInner(p) {
  return p.logo ? '<img src="' + p.logo + '" alt="' + p.name + '" loading="lazy">' : p.initial;
}

// Shared chrome: wallet chips (topbar on funnel pages, sidenav on app pages)
// and the data-driven PARTNERS nav group with active-partner highlight.
document.addEventListener("DOMContentLoaded", function () {
  // Disconnect link, placed next to whichever wallet chip is shown.
  // Skipped on pages that already have their own disconnect control (index.html).
  function disconnectLink() {
    var a = document.createElement("a");
    a.href = "#";
    a.className = "disconnect-link";
    a.textContent = "Disconnect";
    a.setAttribute("aria-label", "Disconnect wallet");
    a.addEventListener("click", function (e) {
      e.preventDefault();
      K.disconnect();
      location.href = "index.html";
    });
    return a;
  }
  var hasOwnDisconnect = !!document.getElementById("disconnect-btn");

  var tw = document.getElementById("topbar-wallet");
  if (tw && K.wallet) {
    tw.textContent = shortAddr(K.wallet);
    tw.title = K.wallet;
    tw.classList.remove("hidden");
    if (!hasOwnDisconnect) tw.parentNode.appendChild(disconnectLink());
  }
  var sw = document.getElementById("side-wallet");
  if (sw && K.wallet) {
    sw.textContent = shortAddr(K.wallet);
    sw.title = K.wallet;
    sw.classList.remove("hidden");
    if (!hasOwnDisconnect) sw.parentNode.insertBefore(disconnectLink(), sw.nextSibling);
  }
  // Feather Icons sun/moon (MIT), inline with currentColor.
  var ICON_SUN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  var ICON_MOON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

  function themeToggle() {
    var btn = document.createElement("button");
    btn.className = "ghost icon-btn";
    btn.id = "theme-toggle";
    function render() {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.innerHTML = dark ? ICON_SUN : ICON_MOON;
      var to = dark ? "light" : "dark";
      btn.title = "Switch to " + to + " mode";
      btn.setAttribute("aria-label", "Switch to " + to + " mode");
    }
    render();
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("k_theme", next);
      render();
    });
    return btn;
  }
  var tnav = document.querySelector(".topbar-nav");
  if (tnav) tnav.appendChild(themeToggle());
  var sfoot = document.querySelector(".sidenav-foot");
  if (sfoot) sfoot.insertBefore(themeToggle(), sfoot.firstChild);

  // MEMBER nav-item icons (by href; partner items keep their avatars).
  document.querySelectorAll(".sidenav .nav-group .nav-item").forEach(function (a) {
    var href = a.getAttribute("href");
    if (NAV_ICONS[href] && !a.querySelector("svg")) {
      a.insertAdjacentHTML("afterbegin", '<span class="nav-icon">' + NAV_ICONS[href] + '</span>');
    }
  });

  // Mobile drawer: hamburger topbar + overlay, injected only on app-shell pages.
  var appEl = document.querySelector(".app");
  var appMain = document.querySelector(".app-main");
  var sidenav = document.querySelector(".sidenav");
  if (appEl && appMain && sidenav && !document.querySelector(".mobile-topbar")) {
    var overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    appEl.insertBefore(overlay, appMain);

    var mtop = document.createElement("div");
    mtop.className = "mobile-topbar";
    mtop.innerHTML =
      '<button class="hamburger ghost" aria-label="Open menu" aria-expanded="false">' + ICON_MENU + '</button>' +
      '<a class="logo" href="index.html"><img src="logo-mark.png" alt="" class="logo-mark">Komunify</a>';
    appMain.insertBefore(mtop, appMain.firstChild);

    var hb = mtop.querySelector(".hamburger");
    function setNav(open) {
      document.body.classList.toggle("nav-open", open);
      hb.setAttribute("aria-expanded", open ? "true" : "false");
    }
    hb.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
    overlay.addEventListener("click", function () { setNav(false); });
    sidenav.querySelectorAll(".nav-item").forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
  }

  var np = document.getElementById("nav-partners");
  if (np) {
    var activePid = new URLSearchParams(location.search).get("p");
    np.innerHTML = '<div class="label">PARTNERS</div>' + KDATA.partners.map(function (p) {
      var act = activePid === p.id ? " active" : "";
      return '<a class="nav-item' + act + '" href="partner.html?p=' + p.id + '">' +
        '<span class="avatar' + (p.avatarCls ? " " + p.avatarCls : "") + '">' + avatarInner(p) + '</span>' +
        p.name + '</a>';
    }).join("");
  }
});
