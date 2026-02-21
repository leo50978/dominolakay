import "./JS/firebase-init.js";
import {
  formatAuthError,
  isValidEmail,
  isValidPassword,
  loginWithEmail,
  signupWithEmail,
  watchAuthState,
} from "./JS/auth.js";
import { renderPage2 } from "./page2.js";

let authMode = "signin";

function renderPage1() {
  const modeTitle = authMode === "signin" ? "SIGN IN" : "SIGN UP";
  const helperPrefix = authMode === "signin" ? "Don't have an account?" : "Already have an account?";
  const helperAction = authMode === "signin" ? "Sign Up" : "Sign In";

  document.body.innerHTML = `
    <div id="appRoot" class="min-h-screen bg-[#3f4766] text-white font-['Poppins']">
      <div class="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <section class="flex min-h-screen flex-col px-6 pb-6 pt-8 sm:px-10 lg:px-0 lg:pl-24 lg:pr-16 lg:pt-10">
          <div class="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[12px_12px_28px_rgba(25,30,44,0.42),-10px_-10px_24px_rgba(97,110,150,0.16)] backdrop-blur-md lg:mx-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
            <img src="logo.png" alt="Logo" class="h-auto w-[152px] max-w-full object-contain sm:w-[168px] lg:hidden" />

            <h1 class="mt-8 text-5xl font-extrabold leading-none tracking-tight sm:text-6xl lg:mt-10 lg:text-7xl">
              Dominoes
            </h1>

            <p class="mt-5 text-sm text-white/80 sm:text-base">
              ${helperPrefix}
              <button id="switchAuthMode" type="button" class="font-semibold text-[#f48f45] hover:text-[#ff9f58]">${helperAction}</button>
            </p>

            <form id="authForm" class="mt-7 space-y-4 sm:space-y-5">
              <input
                id="emailInput"
                type="email"
                placeholder="Email"
                autocomplete="email"
                class="block w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm text-white placeholder-white/60 shadow-[inset_6px_6px_12px_rgba(34,40,59,0.45),inset_-6px_-6px_12px_rgba(93,105,143,0.28)] backdrop-blur-md outline-none ring-0 transition focus:border-[#f48f45] sm:text-base"
              />
              <input
                id="passwordInput"
                type="password"
                placeholder="Password"
                autocomplete="current-password"
                class="block w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm text-white placeholder-white/60 shadow-[inset_6px_6px_12px_rgba(34,40,59,0.45),inset_-6px_-6px_12px_rgba(93,105,143,0.28)] backdrop-blur-md outline-none ring-0 transition focus:border-[#f48f45] sm:text-base"
              />
            </form>

            <div class="mt-3 text-right ${authMode === "signup" ? "hidden" : ""}">
              <a href="#" class="text-sm font-medium text-[#f48f45] hover:text-[#ff9f58]">Forgot password?</a>
            </div>

            <div id="authError" class="mt-4 min-h-5 text-sm text-[#ffb0b0]"></div>

            <button
              id="authSubmitBtn"
              type="button"
              class="mt-2 w-full rounded-full bg-[#f48f45] px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-[8px_8px_18px_rgba(179,92,34,0.45),-6px_-6px_14px_rgba(255,182,120,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ff9a4f] sm:text-base"
            >
              ${modeTitle}
            </button>

            <div class="mt-7 flex items-center gap-4 text-white/65">
              <div class="h-px flex-1 bg-white/20"></div>
              <span class="text-sm">or</span>
              <div class="h-px flex-1 bg-white/20"></div>
            </div>

            <button
              id="googleContinueBtn"
              type="button"
              class="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-white/35 bg-white/80 px-6 py-3.5 text-sm font-semibold text-[#1f2937] shadow-[8px_8px_18px_rgba(22,28,44,0.3),-6px_-6px_14px_rgba(255,255,255,0.28)] backdrop-blur-sm transition hover:-translate-y-0.5 sm:text-base"
            >
              <i class="fa-brands fa-google text-[#4285F4]"></i>
              Continuer avec Google
            </button>
          </div>

          <div class="mt-auto pt-8 text-[11px] leading-relaxed text-white/70 sm:text-xs">
            <div class="flex flex-wrap gap-x-4 gap-y-1">
              <a href="#" class="hover:text-white">Terms & Conditions</a>
              <a href="#" class="hover:text-white">Privacy Policy</a>
              <a href="#" class="hover:text-white">Legal Notice</a>
            </div>
          </div>
        </section>

        <aside class="relative hidden min-h-screen items-center justify-center border-l border-white/10 bg-white/5 backdrop-blur-md lg:flex">
          <img id="rightLogo" src="logo.png" alt="Logo" class="h-auto w-[220px] max-w-[70%] object-contain opacity-95" />
        </aside>
      </div>
    </div>
  `;

  bindPage1Events();
  animatePage1();
}

function bindPage1Events() {
  const switchBtn = document.getElementById("switchAuthMode");
  const submitBtn = document.getElementById("authSubmitBtn");
  const form = document.getElementById("authForm");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const googleBtn = document.getElementById("googleContinueBtn");

  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      authMode = authMode === "signin" ? "signup" : "signin";
      renderPage1();
    });
  }

  const submitAuth = async () => {
    const email = (emailInput?.value || "").trim();
    const password = passwordInput?.value || "";
    const errorEl = document.getElementById("authError");

    if (!isValidEmail(email)) {
      if (errorEl) errorEl.textContent = "Email invalide.";
      return;
    }
    if (!isValidPassword(password)) {
      if (errorEl) errorEl.textContent = "Mot de passe invalide (minimum 6 caractères).";
      return;
    }

    if (errorEl) errorEl.textContent = "";

    try {
      if (authMode === "signin") {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
    } catch (err) {
      console.error("Auth error:", err);
      if (errorEl) errorEl.textContent = formatAuthError(err, "Erreur d'authentification");
    }
  };

  if (submitBtn) submitBtn.addEventListener("click", submitAuth);
  if (form) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      submitAuth();
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      const errorEl = document.getElementById("authError");
      if (errorEl) errorEl.textContent = "Connexion Google à brancher dans la prochaine étape (popup OAuth).";
    });
  }
}

function animatePage1() {
  if (!window.anime) return;

  anime({
    targets: "#appRoot",
    opacity: [0, 1],
    duration: 650,
    easing: "easeOutQuad",
  });

  anime({
    targets: ["#emailInput", "#passwordInput"],
    translateY: [22, 0],
    opacity: [0, 1],
    delay: anime.stagger(120, { start: 200 }),
    duration: 600,
    easing: "easeOutCubic",
  });

  anime({
    targets: "#rightLogo",
    translateY: [-8, 8],
    direction: "alternate",
    loop: true,
    duration: 2200,
    easing: "easeInOutSine",
  });

  const signInBtn = document.getElementById("authSubmitBtn");
  if (signInBtn) {
    signInBtn.addEventListener("mouseenter", () => {
      anime({ targets: signInBtn, scale: 1.025, duration: 180, easing: "easeOutQuad" });
    });
    signInBtn.addEventListener("mouseleave", () => {
      anime({ targets: signInBtn, scale: 1, duration: 180, easing: "easeOutQuad" });
    });
  }
}

watchAuthState((user) => {
  if (user) {
    renderPage2(user);
    return;
  }
  renderPage1();
});
