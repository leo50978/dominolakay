import { mountProfileModal } from "./profil.js";
import { mountSoldeModal } from "./solde.js";

export function renderPage2(user) {
  document.body.innerHTML = `
    <div id="page2Root" class="min-h-screen bg-[#3F4766] px-0 pt-0 pb-8 text-white font-['Poppins']">
      <div class="w-full">
        <section class="relative h-[80vh] min-h-[420px] w-full overflow-hidden rounded-none">
          <img src="hero.jpg" alt="Hero" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-[#3F4766]/55 backdrop-blur-[1px]"></div>
          <header class="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3 sm:p-4">
            <div class="flex items-center">
              <img id="p2Logo" src="./logo.png" alt="Logo" class="h-auto w-[138px] max-w-full object-contain sm:w-[154px]" />
              <span id="p2LogoFallback" class="hidden text-2xl font-bold tracking-tight">Dominoes</span>
            </div>
            <div class="flex items-center gap-3">
              <button id="soldBadge" type="button" class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 shadow-[inset_4px_4px_10px_rgba(20,28,45,0.36),inset_-4px_-4px_10px_rgba(123,137,180,0.2)] backdrop-blur-md transition hover:bg-white/15">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">+</span>
                <span>Faire un dépôt</span>
              </button>
              <button id="p2Profile" type="button" class="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white/85 shadow-[8px_8px_18px_rgba(22,29,45,0.35),-6px_-6px_14px_rgba(118,131,172,0.25)] backdrop-blur-md transition hover:bg-white/15 hover:text-white" aria-label="Profile">
                <i class="fa-regular fa-circle-user text-[19px]"></i>
              </button>
            </div>
          </header>
          <div class="absolute inset-0 flex items-end p-6 sm:p-8">
            <div class="rounded-2xl border border-white/15 bg-[#3F4766]/55 px-6 py-5 shadow-[10px_10px_26px_rgba(18,24,38,0.45),-8px_-8px_20px_rgba(110,126,165,0.15)] backdrop-blur-md">
              <h1 class="text-[34px] font-bold leading-none tracking-tight sm:text-[42px] lg:text-[56px]">Dominoes</h1>
              <p class="mt-3 text-sm text-white/80 sm:text-base">Domino Lakay.</p>
            </div>
          </div>
        </section>

        <section class="mt-8 flex justify-center px-6">
          <div class="flex w-[70vw] max-w-[780px] flex-col items-center gap-3">
            <button id="startGameBtn" type="button" class="h-14 w-full rounded-[18px] border border-[#ffb26e] bg-[#F57C00] px-8 text-base font-semibold text-white shadow-[9px_9px_20px_rgba(155,78,25,0.45),-7px_-7px_16px_rgba(255,173,96,0.2)] transition hover:-translate-y-0.5">
                START GAME
            </button>
            <button id="gameRulesBtn" type="button" class="h-12 w-full rounded-[16px] border border-white/25 bg-white/10 px-8 text-sm font-semibold text-white shadow-[8px_8px_18px_rgba(22,29,45,0.35),-6px_-6px_14px_rgba(118,131,172,0.2)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15">
              Les règles
            </button>
          </div>
        </section>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="rulesModalOverlay" class="fixed inset-0 z-[3400] hidden items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div id="rulesModalPanel" class="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/20 bg-[#3F4766]/60 p-5 text-white shadow-[14px_14px_34px_rgba(16,23,40,0.5),-10px_-10px_24px_rgba(112,126,165,0.2)] backdrop-blur-xl sm:p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold">🎮 RÈGLEMENT DU JEU</h3>
          <button id="rulesModalClose" type="button" class="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="mt-4 space-y-4 text-sm text-white/90 sm:text-base">
          <div>
            <p class="font-semibold text-white">💰 Dépôt & Conversion</p>
            <p class="mt-1">Le dépôt minimum est de 25 Gdes.</p>
            <p>25 Gdes = 500 Does (monnaie virtuelle du jeu).</p>
            <p>Les Does sont utilisés exclusivement pour participer aux parties.</p>
          </div>

          <div>
            <p class="font-semibold text-white">🎯 Participation</p>
            <p class="mt-1">Chaque partie coûte 50 Does.</p>
            <p>Le montant est automatiquement déduit du solde lors de l’inscription à une partie.</p>
            <p>Une partie démarre uniquement lorsqu’il y a au moins 4 joueurs.</p>
          </div>

          <div>
            <p class="font-semibold text-white">🏆 Gains</p>
            <p class="mt-1">Il y a un seul gagnant par partie.</p>
            <p>Le gagnant reçoit 150 Does.</p>
            <p>Les autres participants ne récupèrent pas leur mise.</p>
          </div>

          <div>
            <p class="font-semibold text-white">🔁 Conditions de jeu</p>
            <p class="mt-1">Un joueur peut participer à plusieurs parties tant qu’il dispose d’un solde suffisant.</p>
            <p>Les Does ne peuvent être utilisés que sur la plateforme.</p>
          </div>

          <div>
            <p class="font-semibold text-white">📌 Règles générales</p>
            <p class="mt-1">Toute tentative de fraude entraîne la suspension du compte.</p>
            <p>La participation au jeu implique l’acceptation complète du règlement.</p>
            <p>L’organisateur se réserve le droit de modifier les règles à tout moment si nécessaire.</p>
          </div>
        </div>
      </div>
    </div>
  `);

  if (window.anime) {
    anime({
      targets: "#page2Root",
      opacity: [0, 1],
      duration: 550,
      easing: "easeOutQuad",
    });

    anime({
      targets: "header, section, #startGameBtn",
      translateY: [16, 0],
      opacity: [0, 1],
      delay: anime.stagger(90, { start: 130 }),
      duration: 520,
      easing: "easeOutCubic",
    });
  }

  const logo = document.getElementById("p2Logo");
  const logoFallback = document.getElementById("p2LogoFallback");
  const startGameBtn = document.getElementById("startGameBtn");
  const rulesBtn = document.getElementById("gameRulesBtn");
  const rulesOverlay = document.getElementById("rulesModalOverlay");
  const rulesPanel = document.getElementById("rulesModalPanel");
  const rulesClose = document.getElementById("rulesModalClose");
  if (logo && logoFallback) {
    logo.addEventListener("error", () => {
      logo.classList.add("hidden");
      logoFallback.classList.remove("hidden");
    });
  }

  const closeRules = () => {
    if (!rulesOverlay) return;
    rulesOverlay.classList.add("hidden");
    rulesOverlay.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  };
  const openRules = () => {
    if (!rulesOverlay) return;
    rulesOverlay.classList.remove("hidden");
    rulesOverlay.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  };
  if (rulesBtn) rulesBtn.addEventListener("click", openRules);
  if (rulesClose) rulesClose.addEventListener("click", closeRules);
  if (rulesOverlay) {
    rulesOverlay.addEventListener("click", (ev) => {
      if (ev.target === rulesOverlay) closeRules();
    });
  }
  if (rulesPanel) {
    rulesPanel.addEventListener("click", (ev) => ev.stopPropagation());
  }

  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      window.location.href = "./index.html?autostart=1";
    });
  }

  mountProfileModal({ triggerSelector: "#p2Profile" });
  mountSoldeModal({ triggerSelector: "#soldBadge" });
}
