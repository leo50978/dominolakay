import { auth } from "./JS/auth.js";

const RATE_HTG_TO_DOES = 20;
const STORAGE_PREFIX = "does_wallet_";

function uidKey(uid) {
  return `${STORAGE_PREFIX}${uid || "guest"}`;
}

function safeInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function readWallet(uid) {
  try {
    const raw = localStorage.getItem(uidKey(uid));
    if (!raw) return { exchangedGourdes: 0, does: 0 };
    const parsed = JSON.parse(raw);
    return {
      exchangedGourdes: safeInt(parsed.exchangedGourdes),
      does: safeInt(parsed.does),
    };
  } catch (_) {
    return { exchangedGourdes: 0, does: 0 };
  }
}

function writeWallet(uid, data) {
  localStorage.setItem(uidKey(uid), JSON.stringify({
    exchangedGourdes: safeInt(data.exchangedGourdes),
    does: safeInt(data.does),
  }));
}

function currentUid() {
  return auth.currentUser?.uid || "guest";
}

function emitXchangeUpdated(uid = currentUid()) {
  const updated = getXchangeState(window.__userBaseBalance || window.__userBalance || 0, uid);
  window.dispatchEvent(new CustomEvent("xchangeUpdated", { detail: updated }));
  return updated;
}

export function getXchangeState(balance = 0, uid = currentUid()) {
  const wallet = readWallet(uid);
  const totalBalance = safeInt(balance);
  const available = Math.max(0, totalBalance - wallet.exchangedGourdes);
  return {
    totalBalance,
    availableGourdes: available,
    exchangedGourdes: wallet.exchangedGourdes,
    does: wallet.does,
    rate: RATE_HTG_TO_DOES,
  };
}

export function getDoesBalance(uid = currentUid()) {
  const wallet = readWallet(uid);
  return safeInt(wallet.does);
}

export function spendDoes(amount, uid = currentUid()) {
  const cost = safeInt(amount);
  if (cost <= 0) return { ok: true, does: getDoesBalance(uid) };
  const wallet = readWallet(uid);
  if (wallet.does < cost) {
    return { ok: false, does: wallet.does };
  }
  wallet.does = safeInt(wallet.does - cost);
  writeWallet(uid, wallet);
  emitXchangeUpdated(uid);
  return { ok: true, does: wallet.does };
}

export function rewardDoes(amount, uid = currentUid()) {
  const bonus = safeInt(amount);
  if (bonus <= 0) return { ok: true, does: getDoesBalance(uid) };
  const wallet = readWallet(uid);
  wallet.does = safeInt(wallet.does + bonus);
  writeWallet(uid, wallet);
  emitXchangeUpdated(uid);
  return { ok: true, does: wallet.does };
}

function ensureXchangeModal() {
  const existing = document.getElementById("xchangeModalOverlay");
  if (existing) return existing;

  const overlay = document.createElement("div");
  overlay.id = "xchangeModalOverlay";
  overlay.className = "fixed inset-0 z-[3200] hidden items-center justify-center bg-black/45 p-4 backdrop-blur-sm";

  overlay.innerHTML = `
    <div id="xchangePanel" class="w-full max-w-md rounded-3xl border border-white/20 bg-[#3F4766]/55 p-5 shadow-[14px_14px_34px_rgba(16,23,40,0.5),-10px_-10px_24px_rgba(112,126,165,0.2)] backdrop-blur-xl sm:p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Xchange</p>
          <h3 class="mt-1 text-xl font-bold text-white">Xchange en crypto</h3>
        </div>
        <button id="xchangeClose" type="button" class="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white/90">
        <p>1 Gourde = <span class="font-semibold text-white">20 Does</span></p>
        <p class="mt-1">Solde HTG: <span id="xchangeAvailableHtg" class="font-semibold text-white">0</span> HTG</p>
        <p class="mt-1">Solde Does: <span id="xchangeAvailableDoes" class="font-semibold text-white">0</span> Does</p>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/20 bg-white/10 p-2">
        <button id="xchangeModeBuy" type="button" class="h-10 rounded-xl border border-[#ffb26e] bg-[#F57C00] text-sm font-semibold text-white transition hover:-translate-y-0.5">
          HTG vers Does
        </button>
        <button id="xchangeModeSell" type="button" class="h-10 rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-white/85 transition hover:bg-white/15">
          Does vers HTG
        </button>
      </div>

      <div class="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[inset_6px_6px_12px_rgba(19,26,43,0.42),inset_-6px_-6px_12px_rgba(120,134,172,0.22)]">
        <label for="xchangeAmount" id="xchangeAmountLabel" class="block text-sm font-medium text-white/90">Montant à échanger (HTG)</label>
        <input id="xchangeAmount" type="number" min="1" step="1" inputmode="numeric" class="mt-2 h-12 w-full rounded-xl border border-white/25 bg-white/10 px-4 text-white outline-none" />
        <p id="xchangeHint" class="mt-2 text-xs text-white/70">Décimales non autorisées.</p>
      </div>

      <div class="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white/90">
        <div class="flex items-center gap-2">
          <img src="./does.png" alt="Does" class="h-5 w-5 rounded-full object-cover" onerror="this.style.display='none'" />
          <p id="xchangePreviewText">Vous recevrez: <span id="xchangePreview" class="font-semibold text-white">0</span> Does</p>
        </div>
      </div>

      <div id="xchangeError" class="mt-3 min-h-5 text-sm text-[#ffb0b0]"></div>

      <button id="xchangeSubmit" type="button" class="mt-2 h-12 w-full rounded-2xl border border-[#ffb26e] bg-[#F57C00] font-semibold text-white shadow-[9px_9px_20px_rgba(155,78,25,0.45),-7px_-7px_16px_rgba(255,173,96,0.2)] transition hover:-translate-y-0.5">
        Xchanger
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const panel = overlay.querySelector("#xchangePanel");
  const closeBtn = overlay.querySelector("#xchangeClose");
  const amountInput = overlay.querySelector("#xchangeAmount");
  const previewTextEl = overlay.querySelector("#xchangePreviewText");
  const availableHtgEl = overlay.querySelector("#xchangeAvailableHtg");
  const availableDoesEl = overlay.querySelector("#xchangeAvailableDoes");
  const modeBuyBtn = overlay.querySelector("#xchangeModeBuy");
  const modeSellBtn = overlay.querySelector("#xchangeModeSell");
  const amountLabelEl = overlay.querySelector("#xchangeAmountLabel");
  const hintEl = overlay.querySelector("#xchangeHint");
  const errorEl = overlay.querySelector("#xchangeError");
  const submitBtn = overlay.querySelector("#xchangeSubmit");
  let mode = "buy";
  const getPreviewNode = () => overlay.querySelector("#xchangePreview");

  const setModeUi = (nextMode, state) => {
    mode = nextMode;
    const safeState = state || getXchangeState(window.__userBaseBalance || window.__userBalance || 0, currentUid());

    if (modeBuyBtn) {
      modeBuyBtn.className = mode === "buy"
        ? "h-10 rounded-xl border border-[#ffb26e] bg-[#F57C00] text-sm font-semibold text-white transition hover:-translate-y-0.5"
        : "h-10 rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-white/85 transition hover:bg-white/15";
    }
    if (modeSellBtn) {
      modeSellBtn.className = mode === "sell"
        ? "h-10 rounded-xl border border-[#ffb26e] bg-[#F57C00] text-sm font-semibold text-white transition hover:-translate-y-0.5"
        : "h-10 rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-white/85 transition hover:bg-white/15";
    }

    if (amountLabelEl) {
      amountLabelEl.textContent = mode === "buy"
        ? "Montant à échanger (HTG)"
        : "Montant à convertir (Does)";
    }
    if (hintEl) {
      hintEl.textContent = mode === "buy"
        ? "Décimales non autorisées."
        : `Décimales non autorisées. Le montant doit être multiple de ${RATE_HTG_TO_DOES} Does.`;
    }
    if (previewTextEl) {
      const currentPreview = getPreviewNode()?.textContent || "0";
      previewTextEl.innerHTML = mode === "buy"
        ? `Vous recevrez: <span id="xchangePreview" class="font-semibold text-white">${currentPreview}</span> Does`
        : `Vous recevrez: <span id="xchangePreview" class="font-semibold text-white">${currentPreview}</span> HTG`;
    }
    if (availableHtgEl) availableHtgEl.textContent = String(safeState.availableGourdes);
    if (availableDoesEl) availableDoesEl.textContent = String(safeState.does || 0);
  };

  const refreshPreview = () => {
    const raw = String(amountInput?.value || "").trim();
    const amount = /^\d+$/.test(raw) ? Number(raw) : 0;
    const value = mode === "buy" ? amount * RATE_HTG_TO_DOES : Math.floor(amount / RATE_HTG_TO_DOES);
    const previewNode = getPreviewNode();
    if (previewNode) previewNode.textContent = String(value);
  };

  const close = () => {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
    if (errorEl) errorEl.textContent = "";
  };

  const open = () => {
    const state = getXchangeState(window.__userBaseBalance || window.__userBalance || 0, currentUid());
    if (availableHtgEl) availableHtgEl.textContent = String(state.availableGourdes);
    if (availableDoesEl) availableDoesEl.textContent = String(state.does || 0);
    if (amountInput) amountInput.value = "";
    if (errorEl) errorEl.textContent = "";
    setModeUi("buy", state);
    const previewNode = getPreviewNode();
    if (previewNode) previewNode.textContent = "0";
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
  };

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
  if (panel) panel.addEventListener("click", (ev) => ev.stopPropagation());
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (amountInput) amountInput.addEventListener("input", refreshPreview);
  if (modeBuyBtn) {
    modeBuyBtn.addEventListener("click", () => {
      const state = getXchangeState(window.__userBaseBalance || window.__userBalance || 0, currentUid());
      if (amountInput) amountInput.value = "";
      if (errorEl) errorEl.textContent = "";
      setModeUi("buy", state);
      refreshPreview();
    });
  }
  if (modeSellBtn) {
    modeSellBtn.addEventListener("click", () => {
      const state = getXchangeState(window.__userBaseBalance || window.__userBalance || 0, currentUid());
      if (amountInput) amountInput.value = "";
      if (errorEl) errorEl.textContent = "";
      setModeUi("sell", state);
      refreshPreview();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const state = getXchangeState(window.__userBaseBalance || window.__userBalance || 0, currentUid());
      const raw = String(amountInput?.value || "").trim();

      if (!/^\d+$/.test(raw)) {
        if (errorEl) errorEl.textContent = "Entrez un nombre entier valide.";
        return;
      }

      const amount = Number(raw);
      if (amount <= 0) {
        if (errorEl) errorEl.textContent = "Le montant doit être supérieur à zéro.";
        return;
      }
      if (mode === "buy") {
        if (amount > state.availableGourdes) {
          if (errorEl) errorEl.textContent = "Montant supérieur au solde disponible.";
          return;
        }

        const exchangedGourdes = state.exchangedGourdes + amount;
        const does = state.does + amount * RATE_HTG_TO_DOES;
        writeWallet(currentUid(), { exchangedGourdes, does });
      } else {
        if (amount > state.does) {
          if (errorEl) errorEl.textContent = "Montant supérieur au solde Does disponible.";
          return;
        }
        if (amount % RATE_HTG_TO_DOES !== 0) {
          if (errorEl) errorEl.textContent = `Le montant Does doit être multiple de ${RATE_HTG_TO_DOES}.`;
          return;
        }

        const backToHtg = Math.floor(amount / RATE_HTG_TO_DOES);
        const exchangedGourdes = Math.max(0, state.exchangedGourdes - backToHtg);
        const does = Math.max(0, state.does - amount);
        writeWallet(currentUid(), { exchangedGourdes, does });
      }

      emitXchangeUpdated(currentUid());
      close();
    });
  }

  overlay.__openXchange = open;
  return overlay;
}

export function mountXchangeModal(options = {}) {
  const { triggerSelector = "#profileXchangeBtn" } = options;
  const overlay = ensureXchangeModal();
  const trigger = document.querySelector(triggerSelector);

  if (trigger && overlay.__openXchange && !trigger.dataset.boundXchange) {
    trigger.dataset.boundXchange = "1";
    trigger.addEventListener("click", () => {
      overlay.__openXchange();
    });
  }
}
