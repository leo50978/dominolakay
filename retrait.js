import {
  auth,
  db,
  collection,
  getDocs,
  addDoc,
} from "./JS/firebase-init.js";
const MIN_WITHDRAWAL_HTG = 50;

function escapeHtml(input) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatAmount(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("fr-HT", {
    style: "currency",
    currency: "HTG",
    maximumFractionDigits: 0,
  }).format(amount);
}

function safeInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

async function loadActiveMethods() {
  const methodsRef = collection(db, "paymentMethods");
  const snap = await getDocs(methodsRef);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => m && m.isActive !== false);
}

function ensureRetraitModal() {
  const existing = document.getElementById("retraitModalOverlay");
  if (existing) return existing;

  const overlay = document.createElement("div");
  overlay.id = "retraitModalOverlay";
  overlay.className = "fixed inset-0 z-[3300] hidden items-center justify-center bg-black/45 p-4 backdrop-blur-sm";

  overlay.innerHTML = `
    <div id="retraitPanel" class="w-full max-w-2xl rounded-3xl border border-white/20 bg-[#3F4766]/55 p-5 shadow-[14px_14px_34px_rgba(16,23,40,0.5),-10px_-10px_24px_rgba(112,126,165,0.2)] backdrop-blur-xl sm:p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Retrait</p>
          <h3 class="mt-1 text-2xl font-bold text-white">Faire un retrait</h3>
        </div>
        <button id="retraitClose" type="button" class="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="mt-3 rounded-xl border border-white/15 bg-white/10 p-3 text-sm text-white/80">
        Solde disponible: <span id="retraitAvailable" class="font-semibold text-white">0 HTG</span>
      </div>

      <div class="mt-4">
        <div id="retraitStep1">
          <p class="text-sm font-semibold text-white">Étape 1: Choisir une méthode</p>
          <div id="retraitMethods" class="mt-3 grid gap-2"></div>
        </div>

        <div id="retraitStep2" class="hidden">
          <p class="text-sm font-semibold text-white">Étape 2: Vos informations de retrait</p>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input id="retraitAmount" type="number" min="50" step="1" placeholder="Montant HTG" class="h-12 rounded-xl border border-white/25 bg-white/10 px-4 text-white outline-none sm:col-span-2" />
            <input id="retraitFirstName" type="text" placeholder="Nom" class="h-12 rounded-xl border border-white/25 bg-white/10 px-4 text-white outline-none" />
            <input id="retraitLastName" type="text" placeholder="Prénom" class="h-12 rounded-xl border border-white/25 bg-white/10 px-4 text-white outline-none" />
            <input id="retraitPhone" type="tel" placeholder="Numéro de téléphone" class="h-12 rounded-xl border border-white/25 bg-white/10 px-4 text-white outline-none sm:col-span-2" />
          </div>
          <p id="retraitMethodLabel" class="mt-3 text-xs text-white/75"></p>
        </div>
      </div>

      <div id="retraitError" class="mt-3 min-h-5 text-sm text-[#ffb0b0]"></div>

      <div class="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button id="retraitBack" type="button" class="hidden h-11 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white">Retour</button>
        <button id="retraitNext" type="button" class="h-11 rounded-xl border border-[#ffb26e] bg-[#F57C00] px-5 text-sm font-semibold text-white shadow-[9px_9px_20px_rgba(155,78,25,0.45),-7px_-7px_16px_rgba(255,173,96,0.2)]">Suivant</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const panel = overlay.querySelector("#retraitPanel");
  const closeBtn = overlay.querySelector("#retraitClose");
  const errorEl = overlay.querySelector("#retraitError");
  const availableEl = overlay.querySelector("#retraitAvailable");
  const methodsEl = overlay.querySelector("#retraitMethods");
  const step1El = overlay.querySelector("#retraitStep1");
  const step2El = overlay.querySelector("#retraitStep2");
  const methodLabelEl = overlay.querySelector("#retraitMethodLabel");
  const nextBtn = overlay.querySelector("#retraitNext");
  const backBtn = overlay.querySelector("#retraitBack");
  const amountInput = overlay.querySelector("#retraitAmount");
  const firstNameInput = overlay.querySelector("#retraitFirstName");
  const lastNameInput = overlay.querySelector("#retraitLastName");
  const phoneInput = overlay.querySelector("#retraitPhone");

  let step = 1;
  let selectedMethod = null;
  let methods = [];

  const close = () => {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
    if (errorEl) errorEl.textContent = "";
  };

  const setStep = (value) => {
    step = value;
    if (step1El) step1El.classList.toggle("hidden", step !== 1);
    if (step2El) step2El.classList.toggle("hidden", step !== 2);
    if (backBtn) backBtn.classList.toggle("hidden", step !== 2);
    if (nextBtn) nextBtn.textContent = step === 1 ? "Suivant" : "Soumettre";
  };

  const renderMethods = () => {
    if (!methodsEl) return;
    if (!methods.length) {
      methodsEl.innerHTML = `<p class="text-sm text-white/75">Aucune méthode active.</p>`;
      return;
    }
    methodsEl.innerHTML = methods.map((m) => `
      <button type="button" data-method-id="${escapeHtml(m.id)}" class="retrait-method w-full rounded-xl border border-white/20 bg-white/10 p-3 text-left text-white transition hover:bg-white/15">
        <div class="flex items-center gap-3">
          ${m.image ? `
            <img src="${escapeHtml(m.image)}" alt="${escapeHtml(m.name || "Méthode")}" class="h-10 w-10 rounded-xl object-cover border border-white/15 bg-white/10" onerror="this.style.display='none'">
          ` : `
            <div class="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/10">
              <i class="fa-solid fa-wallet text-white/80"></i>
            </div>
          `}
          <p class="text-sm font-semibold">${escapeHtml(m.name || "Méthode")}</p>
        </div>
      </button>
    `).join("");

    methodsEl.querySelectorAll(".retrait-method").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-method-id");
        selectedMethod = methods.find((m) => m.id === id) || null;
        methodsEl.querySelectorAll(".retrait-method").forEach((b) => {
          b.classList.remove("border-[#ffb26e]", "bg-[#F57C00]/20");
        });
        btn.classList.add("border-[#ffb26e]", "bg-[#F57C00]/20");
      });
    });
  };

  const open = async () => {
    const user = auth.currentUser;
    if (!user) {
      if (errorEl) errorEl.textContent = "Utilisateur non connecté.";
      return;
    }

    const available = safeInt(window.__userBalance || 0);
    if (availableEl) availableEl.textContent = formatAmount(available);

    selectedMethod = null;
    methods = [];
    if (amountInput) amountInput.value = "";
    if (firstNameInput) firstNameInput.value = "";
    if (lastNameInput) lastNameInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (methodLabelEl) methodLabelEl.textContent = "";
    if (errorEl) errorEl.textContent = "";
    setStep(1);
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    try {
      methods = await loadActiveMethods();
      renderMethods();
    } catch (err) {
      console.error("Erreur chargement méthodes retrait:", err);
      if (errorEl) errorEl.textContent = "Impossible de charger les méthodes.";
    }
  };

  if (nextBtn) {
    nextBtn.addEventListener("click", async () => {
      if (errorEl) errorEl.textContent = "";

      if (step === 1) {
        if (!selectedMethod) {
          if (errorEl) errorEl.textContent = "Choisissez une méthode de retrait.";
          return;
        }
        if (methodLabelEl) {
          methodLabelEl.textContent = `Méthode: ${selectedMethod.name || selectedMethod.id}`;
        }
        setStep(2);
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        if (errorEl) errorEl.textContent = "Utilisateur non connecté.";
        return;
      }

      const amount = safeInt(amountInput?.value || 0);
      const available = safeInt(window.__userBalance || 0);
      const firstName = String(firstNameInput?.value || "").trim();
      const lastName = String(lastNameInput?.value || "").trim();
      const phone = String(phoneInput?.value || "").trim();

      if (amount < MIN_WITHDRAWAL_HTG) {
        if (errorEl) errorEl.textContent = `Le montant minimum est ${MIN_WITHDRAWAL_HTG} HTG.`;
        return;
      }
      if (amount > available) {
        if (errorEl) errorEl.textContent = "Montant supérieur au solde disponible.";
        return;
      }
      if (!firstName || !lastName || !phone) {
        if (errorEl) errorEl.textContent = "Nom, prénom et téléphone sont requis.";
        return;
      }

      try {
        await addDoc(collection(db, "clients", user.uid, "withdrawals"), {
          amount,
          methodId: selectedMethod?.id || "",
          methodName: selectedMethod?.name || "",
          status: "pending",
          firstName,
          lastName,
          phone,
          customerName: `${firstName} ${lastName}`.trim(),
          customerEmail: user.email || "",
          customerPhone: phone,
          userHiddenByClient: false,
          createdAt: new Date().toISOString(),
          type: "withdrawal",
        });

        window.dispatchEvent(new CustomEvent("withdrawalSubmitted"));
        close();
      } catch (err) {
        console.error("Erreur soumission retrait:", err);
        if (errorEl) errorEl.textContent = "Impossible de soumettre la demande.";
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (errorEl) errorEl.textContent = "";
      setStep(1);
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
  if (panel) panel.addEventListener("click", (ev) => ev.stopPropagation());

  overlay.__openRetrait = open;
  return overlay;
}

export function mountRetraitModal(options = {}) {
  const { triggerSelector = "#profileWithdrawBtn" } = options;
  const overlay = ensureRetraitModal();
  const trigger = document.querySelector(triggerSelector);

  if (trigger && overlay.__openRetrait && !trigger.dataset.boundRetrait) {
    trigger.dataset.boundRetrait = "1";
    trigger.addEventListener("click", () => {
      overlay.__openRetrait();
    });
  }

  window.openRetraitDirectly = () => {
    if (overlay.__openRetrait) overlay.__openRetrait();
  };
}
