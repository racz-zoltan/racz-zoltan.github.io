
const MAX_CALLS_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; 


let callTimes = [];

function isRateLimited() {
const currentTime = Date.now();

callTimes = callTimes.filter(time => (currentTime - time) < RATE_LIMIT_WINDOW);
return callTimes.length >= MAX_CALLS_PER_MINUTE;
}
 

function updateCounter() {
callTimes.push(Date.now());
}

const MAX_ATTEMPTS_PER_MIN = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
let unlockAttempts = [];

function isViewerRateLimited() {
const now = Date.now();
unlockAttempts = unlockAttempts.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
return unlockAttempts.length >= MAX_ATTEMPTS_PER_MIN;
}

function recordViewerAttempt() {
unlockAttempts.push(Date.now());
}

let vault = {};

function enforceDigitInput(inputId) {
const inputElement = document.getElementById(inputId);
if (!inputElement) return;

inputElement.addEventListener('input', function() {
this.value = this.value.replace(/[^0-9]/g, '');
});
}
enforceDigitInput('iterationCount');


function ensureToastContainer() {
  let container = document.getElementById('toastContainer');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  return container;
}

function removeConfirmToast(toast, callback) {
  if (!toast || toast.classList.contains('removing')) return;

  toast.classList.add('removing');

  setTimeout(() => {
    toast.remove();

    if (typeof callback === 'function') {
      callback();
    }
  }, 170);
}

async function confirmModal(key, params = {}) {
  return new Promise(resolve => {
    const message = t(key, params);
    showConfirmation(message, result => resolve(result));
  });
}

function showConfirmation(message, onConfirm) {
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = 'toast-confirm';
  toast.setAttribute('role', 'alertdialog');
  toast.setAttribute('aria-modal', 'false');

  const icon = document.createElement('div');
  icon.className = 'toast-confirm-icon';
  icon.textContent = '?';

  const content = document.createElement('div');
  content.className = 'toast-confirm-content';

  const title = document.createElement('div');
  title.className = 'toast-confirm-title';
  setTranslatedHTML(title, t('confirmationTitle') || 'Confirmation');

  const messageEl = document.createElement('div');
  messageEl.className = 'toast-confirm-message';
  setTranslatedHTML(messageEl, message);

  content.appendChild(title);
  content.appendChild(messageEl);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'toast-confirm-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', t('close') || 'Close');

  const actions = document.createElement('div');
  actions.className = 'toast-confirm-actions';

  const noBtn = document.createElement('button');
  noBtn.type = 'button';
  noBtn.className = 'toast-confirm-btn toast-confirm-btn-no';
  noBtn.textContent = t('confirmNoBtn') || 'No';

  const yesBtn = document.createElement('button');
  yesBtn.type = 'button';
  yesBtn.className = 'toast-confirm-btn toast-confirm-btn-yes';
  yesBtn.textContent = t('confirmYesBtn') || 'Yes';

  const finish = (result) => {
    closeBtn.onclick = null;
    noBtn.onclick = null;
    yesBtn.onclick = null;

    removeConfirmToast(toast, () => {
      if (typeof onConfirm === 'function') {
        onConfirm(result);
      }
    });
  };

  closeBtn.onclick = () => finish(false);
  noBtn.onclick = () => finish(false);
  yesBtn.onclick = () => finish(true);

  actions.appendChild(noBtn);
  actions.appendChild(yesBtn);

  toast.appendChild(icon);
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  toast.appendChild(actions);

  container.appendChild(toast);

  yesBtn.focus();

  return toast;
}

const translations = window.translations || {};


async function loadLanguage(lang) {
  if (!translations[lang]) {
    console.error(`Language not loaded: ${lang}`);
  }
}


function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}


function tWithVars(key, vars = {}) {
  const lang = localStorage.getItem('preferredLanguage') || 'en';
  let template = translations[lang]?.[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    template = template.replaceAll(`\${${k}}`, escapeHtml(v));
  }
  return template;
}


function t(key, params = {}) {
  const lang = localStorage.getItem('preferredLanguage') || 'en';
  let str = translations[lang]?.[key] || key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replaceAll(`\${${k}}`, escapeHtml(v));
  }
  return str;
}


const TRANSLATION_ALLOWED_TAGS = ['em', 'br', 'strong', 'b', 'i', 'span', 'sub', 'sup'];
const TRANSLATION_ALLOWED_ATTR = ['class'];


function setTranslatedHTML(el, translated) {
  el.innerHTML = DOMPurify.sanitize(translated, {
    ALLOWED_TAGS: TRANSLATION_ALLOWED_TAGS,
    ALLOWED_ATTR: TRANSLATION_ALLOWED_ATTR,
  });
}


function applyTranslationsToRoot(root) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    setTranslatedHTML(el, t(key));
  });

  root.querySelectorAll("[data-i18n-tooltip]").forEach(el => {
    const key = el.getAttribute("data-i18n-tooltip");
    setTranslatedHTML(el, t(key));
  });

  root.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    const translated = t(key);
    setTranslatedHTML(el, translated);
    el.title = translated;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });

  root.querySelectorAll("[data-i18n-value]").forEach(el => {
    const key = el.getAttribute("data-i18n-value");
    const translated = t(key);
    if ("value" in el) {
      el.value = translated;
    } else {
      setTranslatedHTML(el, translated);
    }
  });
}


function translateDynamicElement(root) {
  applyTranslationsToRoot(root);
}


async function updateLanguage(lang) {
  localStorage.setItem('preferredLanguage', lang);
  await loadLanguage(lang);
  applyTranslationsToRoot(document);

  setTimeout(() => applyTranslationsToRoot(document), 100);
}


document.getElementById('languageSwitcher').addEventListener('change', async function () {
  const selectedLang = this.value;
  await updateLanguage(selectedLang);
});


document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  setCurrentYear();
  await initLanguage();
}

function setCurrentYear() {
  const year = new Date().getFullYear();

  document.querySelectorAll(".current-year").forEach(el => {
    el.textContent = year;
  });
}

async function initLanguage() {
  const savedLang = localStorage.getItem("preferredLanguage") || "en";
  const languageSwitcher = document.getElementById("languageSwitcher");

  if (languageSwitcher) {
    languageSwitcher.value = savedLang;
  }

  await updateLanguage(savedLang);
}




function getToastIcon(type) {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '!';
    case 'warning':
      return '!';
    case 'confirm':
      return '?';
    case 'info':
    default:
      return 'i';
  }
}

function removeToast(toast, onClose) {
  if (!toast || toast.classList.contains('removing')) return;

  toast.classList.add('removing');

  setTimeout(() => {
    toast.remove();
    if (typeof onClose === 'function') {
      onClose();
    }
  }, 170);
}


function showToast(input, options = {}) {
  const {
    type = 'info',
    titleKey = null,
    duration = 4500,
    dismissible = true,
    onClose = null,
    isTranslated = false
  } = options;

  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.textContent = getToastIcon(type);

  const content = document.createElement('div');
  content.className = 'toast-content';

  if (titleKey) {
    const title = document.createElement('div');
    title.className = 'toast-title';
    setTranslatedHTML(title, t(titleKey));
    content.appendChild(title);
  }

  const message = document.createElement('div');
  message.className = 'toast-message';

  const finalMessage = isTranslated ? input : t(input);

  setTranslatedHTML(message, finalMessage);
  content.appendChild(message);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', t('close') || 'Close');
  closeBtn.innerHTML = '&times;';

  closeBtn.onclick = () => removeToast(toast, onClose);

  toast.appendChild(icon);
  toast.appendChild(content);

  if (dismissible) {
    toast.appendChild(closeBtn);
  } else {
    const spacer = document.createElement('span');
    toast.appendChild(spacer);
  }

  container.appendChild(toast);

  if (duration && duration > 0) {
    setTimeout(() => {
      removeToast(toast, onClose);
    }, duration);
  }

  return toast;
}


function showModalAlert(messageOrKey, onClose, type = 'info', params = null) {
  const message = params
    ? t(messageOrKey, params)
    : t(messageOrKey);

  showToast(message, {
    type,
    duration: 4500,
    dismissible: true,
    onClose,
    isTranslated: true
  });
}


let generatedPasswords = [];

let currentPasswordIndex = 0;



function updateCredentialPreviews() {

const passwordField = document.getElementById('passwordPreview');

if (generatedPasswords.length > 0) {
passwordField.value = generatedPasswords[currentPasswordIndex];
document.getElementById('passwordPreview').value = generatedPasswords[currentPasswordIndex];
document.getElementById('passwordIndexLabel').textContent = `(${currentPasswordIndex + 1}/6)`;
}
}


function cyclePassword(up) {
if (up) {
currentPasswordIndex = (currentPasswordIndex + 1) % generatedPasswords.length;
} else {
currentPasswordIndex = (currentPasswordIndex - 1 + generatedPasswords.length) % generatedPasswords.length;
}
updateCredentialPreviews();
}



function capitalize(word) {
return word.charAt(0).toUpperCase() + word.slice(1);
}

function updateGeneratedPasswords(passwords) {
generatedPasswords = passwords;

if (typeof currentPasswordIndex !== "number" || isNaN(currentPasswordIndex)) {
currentPasswordIndex = 0;
}

updateCredentialPreviews();
}



function showAlert(message, type = "info", container = document.body) {
const alert = document.createElement("div");
alert.className = `custom-alert custom-alert-${type}`;

const messageSpan = document.createElement("span");
messageSpan.textContent = message; 

const closeBtn = document.createElement("button");
closeBtn.type = 'button';
closeBtn.className = "custom-alert-close";
closeBtn.textContent = "×";
closeBtn.addEventListener("click", () => alert.remove());

alert.appendChild(messageSpan);
alert.appendChild(closeBtn);

container.prepend(alert);

setTimeout(() => {
alert.remove();
}, 4000);
}


const autoHideTimers = {};

function showManyPassword(button) {
const inputId = button.name;
const passwordInput = document.getElementById(inputId);

if (!passwordInput) {
showAlert(`No field found for: ${inputId}`, "error");
return;
}

const textSpan = button.querySelector('.toggle-text');
if (textSpan) {
textSpan.setAttribute('data-i18n', passwordInput.type === "password" ? "hideButton" : "showButton");
const lang = localStorage.getItem('preferredLanguage') || 'en';
const key = textSpan.getAttribute('data-i18n');
textSpan.innerText = translations[lang]?.[key] || key;
}

if (autoHideTimers[inputId]) {
clearTimeout(autoHideTimers[inputId]);
delete autoHideTimers[inputId];
}

const isHidden = passwordInput.type === "password";

passwordInput.type = isHidden ? "text" : "password";
button.textContent = isHidden ? t("hide") : t("show");

if (isHidden) {
autoHideTimers[inputId] = setTimeout(() => {
  passwordInput.type = "password";
  button.textContent = t("show");
  delete autoHideTimers[inputId];
}, 30000);
}
}


let masterPasswordHideTimeout = null;

function showMasterPassword(button) {
const inputId = button.name;
const passwordInput = document.getElementById(inputId);

if (!passwordInput) {
showAlert(`No field found for: ${inputId}`, "error");
return;
}

const textSpan = button.querySelector('.toggle-text');
const isCurrentlyHidden = passwordInput.type === "password";

if (isCurrentlyHidden) {

passwordInput.type = "text";
if (textSpan) {
  textSpan.setAttribute('data-i18n', 'showButton');
  textSpan.textContent = t('hide');
}
lucide.createIcons();


clearTimeout(masterPasswordHideTimeout);

masterPasswordHideTimeout = setTimeout(() => {
  passwordInput.type = "password";
  if (textSpan) {
    textSpan.setAttribute('data-i18n', 'showButton');
    textSpan.textContent = t('show');
  }
  lucide.createIcons();
}, 4000);

} else {

clearTimeout(masterPasswordHideTimeout);
passwordInput.type = "password";
if (textSpan) {
  textSpan.setAttribute('data-i18n', 'showButton');
  textSpan.textContent = t('show');
}
lucide.createIcons();
}
}



function clearPasswordCard() {

document.getElementById('serviceLabel').textContent = "Service Name";
generatedPasswords = [];
currentPasswordIndex = 0;;
document.getElementById('passwordPreview').value = ""; 
document.getElementById('identifierInput').value = "";
document.getElementById('profileSelector').value = "structured";
document.getElementById('counter').value = 0;
document.getElementById('passwordIndexLabel').innerText = "(1/6)";
let generated = document.getElementById('passwordCard');
hideSmooth(generated);

}



if ('serviceWorker' in navigator) {
window.addEventListener('load', function() {
navigator.serviceWorker.register('/service-worker.js', {
  updateViaCache: 'none'
}).then(function(registration) {
}, function(err) {
  console.error('ServiceWorker registration failed: ', err);
});
});
}



const fileButton = document.getElementById("fileButton");
const fileInput = document.getElementById("fileInput");

if (fileButton && fileInput) {
fileButton.addEventListener("click", function() {
  fileInput.click(); 
});
}


const fileButtonDecrypt = document.getElementById("fileButtonDecrypt");
const encryptedFileInput = document.getElementById("encryptedFileInput");

if (fileButtonDecrypt && encryptedFileInput) {
fileButtonDecrypt.addEventListener("click", function() {
  encryptedFileInput.click(); 
});
}

document.addEventListener("DOMContentLoaded", function() {
const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(function(navLink) {
navLink.addEventListener("click", function() {
const navbarCollapse = document.querySelector(".navbar-collapse");
if (navbarCollapse.classList.contains("show")) {
  navbarCollapse.classList.remove("show");
}
});
});
});



function updatePasswordStrength(password) {
const strengthBar = document.getElementById("passwordStrengthBar");
const strengthText = document.getElementById("passwordStrengthText");
const entropyText = document.getElementById("entropyText");

if (!password) {
strengthText.innerText = '';
strengthText.className = 'strength-text-default';
strengthBar.className = '';
entropyText.innerText = '';
return;
}

const entropy = calculateEntropyMaster(password);
let strengthLevel = 'Weak';
let strengthClass = 'strength-weak';

if (entropy >= ENTROPY_THRESHOLDS.good) {
strengthLevel = 'Extra Strong';
strengthClass = 'strength-extrastrong';
} else if (entropy >= ENTROPY_THRESHOLDS.low) {
strengthLevel = 'Strong';
strengthClass = 'strength-strong';
} else if (entropy >= ENTROPY_THRESHOLDS.low * 0.6) {
strengthLevel = 'Medium';
strengthClass = 'strength-medium';
}

strengthBar.className = '';
strengthBar.classList.add(strengthLevel.toLowerCase().replace(' ', ''));
strengthText.innerText = strengthLevel;
strengthText.className = strengthClass;
entropyText.innerText = `Entropy: ${entropy.toFixed(2)} bits`;
}


function updatePasswordStrengthUI(barId, labelId, entropyLabelId, password) {
const bar = document.getElementById(barId);
const label = document.getElementById(labelId);
const entropyLabel = document.getElementById(entropyLabelId);

if (!password) {
label.innerText = '';
label.className = '';
entropyLabel.innerText = '';
bar.className = '';
return;
}

const entropy = calculateEntropyMaster(password);
let strength = 'low';

if (entropy >= ENTROPY_THRESHOLDS.good) strength = 'excellent';
else if (entropy >= ENTROPY_THRESHOLDS.low) strength = 'good';

bar.className = '';
bar.classList.add(strength);
label.innerText = strength.charAt(0).toUpperCase() + strength.slice(1);
label.className = `strength-${strength}`;
entropyLabel.innerText = `Entropy: ${entropy.toFixed(2)} bits`;
}


function copyPasswordCheck(button) {
resetTimer();
const passwordField = document.getElementById(button.name);
const successIcon = document.getElementById('copySuccessIcon-' + button.getAttribute('data-password-id'));
const clearBtn = document.getElementById('clearClipboardBtn');

navigator.clipboard.writeText(passwordField.value).then(() => {
successIcon.classList.replace("nodisplay", "inline-block");
clearBtn.classList.remove("nodisplay");
clearBtn.classList.add("flex-display");

setTimeout(() => {
  clearBtn.classList.add("nodisplay");
}, 90000);

setTimeout(() => {
  successIcon.classList.replace("inline-block", "nodisplay");
}, 2000);
}).catch(err => {
console.error('Error copying text: ', err);
});
}


document.getElementById('clearClipboardBtn').addEventListener('click', () => {
const clearBtn = document.getElementById('clearClipboardBtn');

const hide = () => {
clearBtn.classList.remove("flex-display");
clearBtn.classList.add("nodisplay");
};

navigator.clipboard.writeText('').then(() => {
hide();
}).catch(err => {
console.warn("Clipboard clear failed:", err);
hide();
showAlert("Unable to clear clipboard. Please copy something else manually to clear sensitive data.");
});
});



let entropyEstimate = null;

function conservativeEntropyEstimate(pass) {
if (!pass || !pass.trim()) return 0;
try {
const result = zxcvbn(pass.trim());
entropyEstimate = result.guesses_log10 * Math.log2(10);
return entropyEstimate;
} catch (err) {
console.error("Entropy calculation error:", err);
entropyEstimate = 0;
return 0;
}
}


function updateEntropyUI(bits) {
const bar = document.getElementById('entropyFill');
const text = document.getElementById('entropyText');

const MAX_BITS = 160;
const pct = Math.min(100, (bits / MAX_BITS) * 100);
bar.style.setProperty('--entropy-width', pct + "%");

bar.classList.remove('entropy-low', 'entropy-medium', 'entropy-high');

if (bits < 80 ) {
bar.classList.add('entropy-low');
} else if (bits < 100) {
bar.classList.add('entropy-medium');
} else {
bar.classList.add('entropy-high');
}
}



const ADAPTIVE_ICON_ROUNDS = 3;
const ICONS_PER_ROUND = 4;
const ADAPTIVE_GRID_SIZE = 25;
const REGISTER_ICON_ENTROPY_THRESHOLD = 80;
const ICON_PRACTICE_TOTAL_PASSES = 3;

const ICON_STEP_ARGON2_TIME = 2;
const ICON_STEP_ARGON2_MEMORY_KIB = 64 * 1024;
const ICON_FINAL_ARGON2_TIME = 3;
const ICON_FINAL_ARGON2_MEMORY_KIB = 96 * 1024;

let selectedRegister = [];
let selectedLogin = [];

let iconHashBytesGlobal = null;
let loginIconHashBytesGlobal = null;

let iconRegisterTimeout = null;
let iconLoginTimeout = null;

let registerAdaptivePass = "";
let loginAdaptivePass = "";

let iconPracticeEnabled = true;

function syncIconPracticeSetting() {
  const toggle = document.getElementById("iconPracticeToggle");
  iconPracticeEnabled = toggle ? toggle.checked : true;
}

let adaptiveMode = null;
let adaptivePhase = "initial";

let adaptiveRound = 1;
let adaptiveState = null;
let adaptiveRoundStartState = null;
let adaptiveRoundIcons = [];

let adaptiveSelectedIcons = [];
let adaptiveRoundSelections = [];

let adaptiveComplete = false;
let adaptiveFinalHash = null;

let targetEmojiSequence = null;
let currentPracticePass = 0;

let adaptiveIconBusy = false;
let adaptiveStateStack = [];


const GRID_COLOR_CLASS_PREFIX = "grid-color-";
const GRID_COLOR_COUNT = 8;

function getGridColorIndexFromState(stateHex) {
  const slice = String(stateHex || "").slice(0, 8);
  const value = parseInt(slice, 16);

  if (Number.isNaN(value)) return 0;

  return value % GRID_COLOR_COUNT;
}

function applyAdaptiveGridColorClass(grid) {
  if (!grid || !adaptiveRoundStartState) return;

  for (let i = 0; i < GRID_COLOR_COUNT; i++) {
    grid.classList.remove(`${GRID_COLOR_CLASS_PREFIX}${i}`);
  }

  const colorIndex = getGridColorIndexFromState(adaptiveRoundStartState);
  grid.classList.add(`${GRID_COLOR_CLASS_PREFIX}${colorIndex}`);
}


function cpJoin(...parts) {
  return parts.map(p => String(p)).join("::");
}

function cpBytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function cpSha256Bytes(input) {
  const data = new TextEncoder().encode(String(input));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

async function cpSha256Hex(input) {
  return cpBytesToHex(await cpSha256Bytes(input));
}

async function cpArgon2idHex({ pass, salt, time, mem, hashLen = 32, parallelism = 1 }) {
  if (typeof argon2 === "undefined") {
    throw new Error("argon2-browser is not loaded.");
  }

  const result = await argon2.hash({
    pass: String(pass),
    salt: String(salt),
    time,
    mem,
    hashLen,
    parallelism,
    type: argon2.ArgonType.Argon2id,
    raw: true
  });

  if (result.hash instanceof Uint8Array) return cpBytesToHex(result.hash);
  if (result.hashHex) return result.hashHex;

  throw new Error("Unexpected Argon2 result format.");
}

async function deterministicBytes(seedHex, context, byteLength) {
  const output = new Uint8Array(byteLength);
  let offset = 0;
  let counter = 0;

  while (offset < byteLength) {
    const block = await cpSha256Bytes(
      cpJoin("CarryPass/deterministic-random/v4", seedHex, context, counter)
    );

    output.set(block.slice(0, byteLength - offset), offset);
    offset += Math.min(block.length, byteLength - offset);
    counter++;
  }

  return output;
}

async function deterministicRandomInt(seedHex, context, maxExclusive, counterObj) {
  const maxUint32 = 0x100000000;
  const limit = Math.floor(maxUint32 / maxExclusive) * maxExclusive;

  while (true) {
    const bytes = await deterministicBytes(seedHex, `${context}/${counterObj.value}`, 4);
    counterObj.value++;

    const value = new DataView(bytes.buffer).getUint32(0, false);

    if (value < limit) {
      return value % maxExclusive;
    }
  }
}

async function deterministicShuffle(array, seedHex, context) {
  const arr = [...array];
  const counterObj = { value: 0 };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = await deterministicRandomInt(seedHex, context, i + 1, counterObj);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

async function deriveInitialAdaptiveState(masterPassword) {
  return await cpArgon2idHex({
    pass: cpJoin("CarryPass/adaptive-icon-base/v4", masterPassword),
    salt: "CarryPass adaptive icon base v4",
    time: ICON_STEP_ARGON2_TIME,
    mem: ICON_STEP_ARGON2_MEMORY_KIB
  });
}

async function deriveNextAdaptiveState(previousStateHex, iconName, absoluteStep) {
  const nextState = await cpArgon2idHex({
    pass: cpJoin(
      "CarryPass/adaptive-icon-step/v4",
      previousStateHex,
      iconName,
      absoluteStep
    ),
    salt: `CarryPass adaptive icon step ${absoluteStep} v4`,
    time: ICON_STEP_ARGON2_TIME,
    mem: ICON_STEP_ARGON2_MEMORY_KIB
  });

  return nextState;
}


async function deriveFinalAdaptiveHashBytes(finalStateHex) {
  if (!finalStateHex) {
    throw new Error("Missing final adaptive state.");
  }

  const finalHashHex = await cpArgon2idHex({
    pass: cpJoin(
      "CarryPass/adaptive-icon-final/v4",
      finalStateHex
    ),
    salt: "CarryPass adaptive icon final v4",
    time: ICON_FINAL_ARGON2_TIME,
    mem: ICON_FINAL_ARGON2_MEMORY_KIB
  });

  const finalHashBytes = hexStringToBytes(finalHashHex);

  return finalHashBytes;
}


async function deriveAdaptiveGrid(roundStartStateHex, roundNumber) {
  const shuffled = await deterministicShuffle(
    ICON_POOL,
    roundStartStateHex,
    `CarryPass/adaptive-icon-grid/v4/round-${roundNumber}`
  );

  return shuffled.slice(0, ADAPTIVE_GRID_SIZE);
}

function resetAdaptiveStateOnly() {
  adaptiveRound = 1;
  adaptiveState = null;
  adaptiveRoundStartState = null;
  adaptiveRoundIcons = [];

  adaptiveSelectedIcons = [];
  adaptiveRoundSelections = [];
  adaptiveStateStack = [];

  adaptiveComplete = false;
  adaptiveFinalHash = null;
  
  document.querySelectorAll(".emoji-grid-container").forEach(container => {
    container.style.backgroundColor = "";
  });
}

function resetRegisterPracticeState() {
  targetEmojiSequence = null;
  currentPracticePass = 0;
  iconHash = null;
  selectedRegister.length = 0;
}

function getActiveGridId() {
  return adaptiveMode === "login" ? "emojiGridLogin" : "emojiGridRegister";
}

function getActiveSelectedArray() {
  return adaptiveMode === "login" ? selectedLogin : selectedRegister;
}


function getActiveConfirmButton() {
  return adaptiveMode === "login"
    ? document.getElementById("submitPassCode")
    : document.getElementById("confirmEmojiSequence");
}


function secureShuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);

    const max = 0x100000000;
    const limit = Math.floor(max / (i + 1)) * (i + 1);

    let value = rand[0];
    while (value >= limit) {
      crypto.getRandomValues(rand);
      value = rand[0];
    }

    const j = value % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}


async function startAdaptiveIconSelection(masterPassword, mode, phase = "initial") {
  adaptiveMode = mode;
  adaptivePhase = phase;

  resetAdaptiveStateOnly();

  if (mode === "register") {
    selectedRegister.length = 0;
  } else {
    selectedLogin.length = 0;
    loginIconHash = null;
  }

  const confirmBtn = getActiveConfirmButton();
  if (confirmBtn) confirmBtn.disabled = true;

  adaptiveState = await deriveInitialAdaptiveState(masterPassword);
  adaptiveRoundStartState = adaptiveState;
  adaptiveStateStack = [adaptiveState];
  adaptiveRoundIcons = secureShuffle(
    await deriveAdaptiveGrid(adaptiveRoundStartState, adaptiveRound)
  );

  renderAdaptiveIconGrid();
}


function renderAdaptiveIconGrid() {
  const grid = document.getElementById(getActiveGridId());
  if (!grid) return;

  applyAdaptiveGridColorClass(grid);

  const shouldShowMemoryHint =
    adaptiveMode === "register" &&
    adaptivePhase === "practice" &&
    currentPracticePass === 1 &&
    targetEmojiSequence;

  let currentRoundCorrectIcons = [];

  if (shouldShowMemoryHint) {
    const currentRoundStart =
      (adaptiveRound - 1) * ICONS_PER_ROUND;

    currentRoundCorrectIcons =
      targetEmojiSequence
        .split("::")
        .slice(
          currentRoundStart,
          currentRoundStart + ICONS_PER_ROUND
        );
  }

  grid.replaceChildren();
  grid.classList.remove("practice-mode");
  grid.classList.add("icon-grid", "grid-mode");

  adaptiveRoundIcons.forEach((name, index) => {
    const div = document.createElement("div");
    div.className = "emoji-tile";

    if (currentRoundCorrectIcons.includes(name)) {
      div.classList.add("memory-flash");
    }

    const icon = document.createElement("i");
    icon.dataset.lucide = name;
    div.appendChild(icon);

    const selectedIndex = adaptiveRoundSelections.indexOf(name);

    if (selectedIndex !== -1) {
      div.classList.add("selected");

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = selectedIndex + 1;
      div.appendChild(badge);
    }

    div.addEventListener("click", async () => {
      await handleAdaptiveIconClick(name);
    });

    grid.appendChild(div);
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  const confirmBtn = getActiveConfirmButton();
  if (confirmBtn) confirmBtn.disabled = !adaptiveComplete;
}


async function handleAdaptiveRegisterRoundComplete() {
  if (!adaptiveComplete || adaptiveMode !== "register") return;

  syncIconPracticeSetting();

  const selectedSequence = getAdaptiveSequenceString();

  if (adaptivePhase === "initial") {
    targetEmojiSequence = selectedSequence;

    if (!iconPracticeEnabled) {
      targetEmojiSequence = null;
      currentPracticePass = 0;

      const submitPassCodeRegister = document.getElementById("submitPassCodeRegister");

      if (submitPassCodeRegister) {
        submitPassCodeRegister.disabled = false;
        submitPassCodeRegister.classList.remove("invisible");
        submitPassCodeRegister.click();
      }

      return;
    }

    currentPracticePass = 1;

    await startAdaptiveIconSelection(
      registerAdaptivePass,
      "register",
      "practice"
    );

    showModalAlert(
      t("tryReselect", { currentPracticePass }),
      null,
      "success"
    );

    return;
  }

  if (selectedSequence === targetEmojiSequence) {
    currentPracticePass++;

    if (currentPracticePass >= ICON_PRACTICE_TOTAL_PASSES) {
      targetEmojiSequence = null;
      currentPracticePass = 0;

      const submitPassCodeRegister = document.getElementById("submitPassCodeRegister");

      if (submitPassCodeRegister) {
        submitPassCodeRegister.disabled = false;
        submitPassCodeRegister.classList.remove("invisible");
        submitPassCodeRegister.click();
      }

      return;
    }

    await startAdaptiveIconSelection(
      registerAdaptivePass,
      "register",
      "practice"
    );

    showModalAlert(
      t("correctSequence", { currentPracticePass }),
      null,
      "success"
    );

    return;
  }

  showModalAlert("wrongSequence", null, "error");

  resetRegisterPracticeState();
  resetAdaptiveStateOnly();

  const currentPassInput = document.getElementById("passCodeInputRegister");
  if (currentPassInput) currentPassInput.value = "";

  resetAuthState();
}


function setAdaptiveGridBusy(isBusy) {
  const grid = document.getElementById(getActiveGridId());
  if (!grid) return;

  grid.classList.toggle("icon-grid-busy", isBusy);
}


function undoAdaptiveSelectionFromCurrentRound(existingIndex) {
  const removeCount = adaptiveRoundSelections.length - existingIndex;

  adaptiveRoundSelections = adaptiveRoundSelections.slice(0, existingIndex);

  adaptiveSelectedIcons.splice(
    adaptiveSelectedIcons.length - removeCount,
    removeCount
  );

  const selectedArray = getActiveSelectedArray();

  selectedArray.splice(
    selectedArray.length - removeCount,
    removeCount
  );

  adaptiveStateStack.splice(
    adaptiveStateStack.length - removeCount,
    removeCount
  );

  adaptiveState = adaptiveStateStack[adaptiveStateStack.length - 1];

  adaptiveComplete = false;
  adaptiveFinalHash = null;

  const confirmBtn = getActiveConfirmButton();
  if (confirmBtn) confirmBtn.disabled = true;

  if (adaptiveMode === "login") {
    loginIconHash = null;
  } else {
    iconHash = null;
  }
}

function waitForPaint() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}


async function handleAdaptiveIconClick(iconName) {
  if (adaptiveIconBusy) return;

  const existingIndex = adaptiveRoundSelections.indexOf(iconName);

  if (existingIndex !== -1) {
    undoAdaptiveSelectionFromCurrentRound(existingIndex);
    renderAdaptiveIconGrid();
    return;
  }

  if (adaptiveComplete) return;
  if (adaptiveRoundSelections.length >= ICONS_PER_ROUND) return;

  adaptiveRoundSelections.push(iconName);
  adaptiveSelectedIcons.push(iconName);

  getActiveSelectedArray().push({
    index: adaptiveSelectedIcons.length - 1,
    name: iconName
  });

  renderAdaptiveIconGrid();

  adaptiveIconBusy = true;
  setAdaptiveGridBusy(true);

  await waitForPaint();

  try {
    adaptiveState = await deriveNextAdaptiveState(
      adaptiveState,
      iconName,
      adaptiveSelectedIcons.length
    );

    adaptiveStateStack.push(adaptiveState);

    if (adaptiveRoundSelections.length < ICONS_PER_ROUND) {
      return;
    }

    if (adaptiveRound >= ADAPTIVE_ICON_ROUNDS) {
      adaptiveComplete = true;

      adaptiveFinalHash = await deriveFinalAdaptiveHashBytes(adaptiveState);

      if (adaptiveMode === "login") {
        if (loginIconHashBytesGlobal) {
          loginIconHashBytesGlobal.fill(0);
        }

        loginIconHashBytesGlobal = adaptiveFinalHash;
        adaptiveFinalHash = null;

        const submitBtn = document.getElementById("submitPassCode");

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.click();
        }

        return;
      }

      if (adaptiveMode === "register") {
        if (iconHashBytesGlobal) {
          iconHashBytesGlobal.fill(0);
        }

        iconHashBytesGlobal = adaptiveFinalHash;
        adaptiveFinalHash = null;

        await handleAdaptiveRegisterRoundComplete();
        return;
      }

      return;
    }

    adaptiveRound++;
    adaptiveRoundSelections = [];

    adaptiveRoundStartState = adaptiveState;

    const deterministicGrid = await deriveAdaptiveGrid(
      adaptiveRoundStartState,
      adaptiveRound
    );

    adaptiveRoundIcons = secureShuffle(deterministicGrid);

    renderAdaptiveIconGrid();
  } catch (err) {
    console.error("Adaptive icon step failed:", err);
    showModalAlert("unexpectedError", null, "error");
  } finally {
    adaptiveIconBusy = false;
    setAdaptiveGridBusy(false);
  }
}


function reverseCurrentAdaptiveRound() {
  if (adaptiveIconBusy) return;

  const removeCount = adaptiveRoundSelections.length;
  if (removeCount === 0) return;

  adaptiveRoundSelections = [];

  adaptiveSelectedIcons.splice(
    adaptiveSelectedIcons.length - removeCount,
    removeCount
  );

  const selectedArray = getActiveSelectedArray();

  selectedArray.splice(
    selectedArray.length - removeCount,
    removeCount
  );

  adaptiveStateStack.splice(
    adaptiveStateStack.length - removeCount, 
    removeCount
  );

  adaptiveState = adaptiveRoundStartState;

  adaptiveComplete = false;
  adaptiveFinalHash = null;

  if (adaptiveMode === "login") {
    loginIconHash = null;
  } else {
    iconHash = null;
  }

  const confirmBtn = getActiveConfirmButton();
  if (confirmBtn) confirmBtn.disabled = true;

  renderAdaptiveIconGrid();
}


async function restartAdaptiveAttempt() {
  if (adaptiveIconBusy) return;

  const masterPassword = adaptiveMode === "login"
    ? loginAdaptivePass
    : registerAdaptivePass;

  if (!masterPassword) return;

  if (adaptiveMode === "login") {
    loginIconHash = null;
  } else {
    iconHash = null;
  }

  await startAdaptiveIconSelection(
    masterPassword,
    adaptiveMode,
    adaptivePhase
  );
}


async function rebuildCurrentRoundState() {
  const completedBeforeCurrentRound =
    (adaptiveRound - 1) * ICONS_PER_ROUND;

  adaptiveSelectedIcons = adaptiveSelectedIcons.slice(
    0,
    completedBeforeCurrentRound
  );

  const selectedArray = getActiveSelectedArray();
  selectedArray.length = completedBeforeCurrentRound;

  adaptiveState = adaptiveRoundStartState;

  const remainingRoundSelections = [...adaptiveRoundSelections];

  for (const iconName of remainingRoundSelections) {
    adaptiveSelectedIcons.push(iconName);

    selectedArray.push({
      index: adaptiveSelectedIcons.length - 1,
      name: iconName
    });

    adaptiveState = await deriveNextAdaptiveState(
      adaptiveState,
      iconName,
      adaptiveSelectedIcons.length
    );
  }
}

function getAdaptiveSequenceString() {
  return adaptiveSelectedIcons.join("::");
}


document.getElementById("passCodeInputRegister")?.addEventListener("input", (e) => {
  const pass = e.target.value.trim();

  if (iconRegisterTimeout) clearTimeout(iconRegisterTimeout);

  iconRegisterTimeout = setTimeout(async () => {
    if (pass.length > 0 && entropyEstimate > REGISTER_ICON_ENTROPY_THRESHOLD) {
      registerAdaptivePass = pass;
      resetRegisterPracticeState();

      await startAdaptiveIconSelection(
        registerAdaptivePass,
        "register",
        "initial"
      );
    }
  }, 400);
});


const LOGIN_ICON_ENTROPY_THRESHOLD = REGISTER_ICON_ENTROPY_THRESHOLD;

document.getElementById("passCodeInput")?.addEventListener("input", (e) => {
  const pass = e.target.value.trim();

  if (iconLoginTimeout) clearTimeout(iconLoginTimeout);

  iconLoginTimeout = setTimeout(async () => {
    const estimatedEntropy = conservativeEntropyEstimate(pass);

    if (!pass || estimatedEntropy <= LOGIN_ICON_ENTROPY_THRESHOLD) {
      loginAdaptivePass = "";

      selectedLogin = [];

      const gridLogin = document.getElementById("emojiGridLogin");
      if (gridLogin) {
        gridLogin.replaceChildren();
        gridLogin.classList.remove("icon-grid-busy");
      }

      if (loginIconHashBytesGlobal) {
        loginIconHashBytesGlobal.fill(0);
        loginIconHashBytesGlobal = null;
      }

      resetAdaptiveStateOnly();
      return;
    }

    loginAdaptivePass = pass;

    await startAdaptiveIconSelection(
      loginAdaptivePass,
      "login",
      "login"
    );
  }, 400);
});


async function getIconSequenceHash() {
  if (!iconHash) {
    throw new Error("Registration icon sequence is not confirmed yet.");
  }

  return iconHash;
}

async function getLoginIconSequenceHash() {
  if (!loginIconHash) {
    throw new Error("Login icon sequence is not completed yet.");
  }

  return loginIconHash;
}


async function encryptWithKey(key, data) {
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
return { ciphertext: new Uint8Array(ciphertext), iv };
}

async function decryptWithKey(key, data, iv) {
return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
}



function resetAuthState() {
  iconHash = null;
  loginIconHash = null;

  selectedRegister = [];
  selectedLogin = [];

  registerAdaptivePass = "";
  loginAdaptivePass = "";

  adaptiveMode = null;
  adaptivePhase = "initial";

  adaptiveRound = 1;
  adaptiveState = null;
  adaptiveRoundStartState = null;
  adaptiveRoundIcons = [];

  adaptiveSelectedIcons = [];
  adaptiveRoundSelections = [];

  adaptiveComplete = false;
  adaptiveFinalHash = null;

  targetEmojiSequence = null;
  currentPracticePass = 0;

  adaptiveIconBusy = false;
  adaptiveStateStack = [];

  if (iconRegisterTimeout) {
    clearTimeout(iconRegisterTimeout);
    iconRegisterTimeout = null;
  }

  if (iconLoginTimeout) {
    clearTimeout(iconLoginTimeout);
    iconLoginTimeout = null;
  }

  const registerInput = document.getElementById("passCodeInputRegister");
  const loginInput = document.getElementById("passCodeInput");

  if (registerInput) registerInput.value = "";
  if (loginInput) loginInput.value = "";

  const overlay = document.getElementById("fingerprint-overlay");
  const overlayLogin = document.getElementById("fingerprint-overlay-login");

  if (overlay) overlay.textContent = "";
  if (overlayLogin) overlayLogin.textContent = "";

  const gridLogin = document.getElementById("emojiGridLogin");
  const gridRegister = document.getElementById("emojiGridRegister");

  if (gridLogin) {
    gridLogin.replaceChildren();
    gridLogin.classList.remove("icon-grid-busy");

    for (let i = 0; i < GRID_COLOR_COUNT; i++) {
      gridLogin.classList.remove(`grid-color-${i}`);
    }
  }

  if (gridRegister) {
    gridRegister.replaceChildren();
    gridRegister.classList.remove("icon-grid-busy");

    for (let i = 0; i < GRID_COLOR_COUNT; i++) {
      gridRegister.classList.remove(`grid-color-${i}`);
    }
  }

  const hazeOverlay = document.getElementById("gridHazeOverlay");
  const hazeOverlayRegister = document.getElementById("gridHazeOverlayRegister");

  if (hazeOverlay) {
    hazeOverlay.classList.remove(
      "haze-mode-dark",
      "haze-mode-privacy",
      "haze-mode-none"
    );
    hazeOverlay.classList.add("haze-mode-privacy");
  }

  if (hazeOverlayRegister) {
    hazeOverlayRegister.classList.remove(
      "haze-mode-dark",
      "haze-mode-privacy",
      "haze-mode-none"
    );
    hazeOverlayRegister.classList.add("haze-mode-privacy");
  }

  document.querySelectorAll(".emoji-grid-container").forEach(container => {
    container.classList.remove(
      "haze-active-dark",
      "haze-active-privacy",
      "haze-active-none"
    );
    container.classList.add("haze-active-privacy");
  });

  const submitPassCode = document.getElementById("submitPassCode");
  const submitPassCodeRegister = document.getElementById("submitPassCodeRegister");
  const confirmEmojiSequence = document.getElementById("confirmEmojiSequence");

  if (submitPassCode) submitPassCode.disabled = true;

  if (submitPassCodeRegister) {
    submitPassCodeRegister.disabled = true;
    submitPassCodeRegister.classList.add("invisible");
  }

  if (confirmEmojiSequence) {
    confirmEmojiSequence.disabled = true;
    confirmEmojiSequence.classList.remove("invisible");
  }

  const entropyFill = document.getElementById("entropyFill");

  if (entropyFill) {
    entropyFill.style.setProperty("--entropy-width", "0%");
  }
}


let sessionKey = null;
let appMaster = null;
let screenLockBaseKey = null;
let passwordKey = null;
let totpSecretKey = null;
let vaultCanaryKey = null;


let useAppIdentity = true;
let screenLockActive = false;

let cachedServiceList = [];
let cachedServiceMap = {};
let settingsDirty = false;
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

let pinRetryCount = 0;
const MAX_RETRIES = 3;
let lastActiveScreen = null;

let lastInteractionTime = Date.now();

let sessionExpiredHandled = false;
let screenLockTimer = null;
let countdownTimer = null;

const DEFAULT_SCREEN_LOCK_MINUTES = 10;
const DEFAULT_SESSION_TIMEOUT_MINUTES = 30;

const MIN_SCREEN_LOCK_MINUTES = 1;
const MAX_SCREEN_LOCK_MINUTES = 120;

const MIN_SESSION_TIMEOUT_MINUTES = 5;
const MAX_SESSION_TIMEOUT_MINUTES = 480;

let lastVaultScreen = null;


function bootstrapSecurityTimeoutSettings() {
  getScreenLockMinutes();
  getSessionTimeoutMinutes();
  normalizeTimeoutSettings();
  syncSecurityTimeoutSelects();
}


function syncSecurityTimeoutSelects() {
  const screenLockSelect = document.getElementById("screenLockMinutes");
  const sessionTimeoutSelect = document.getElementById("sessionTimeoutMinutes");

  if (screenLockSelect) {
    screenLockSelect.value = String(getScreenLockMinutes());
  }

  if (sessionTimeoutSelect) {
    sessionTimeoutSelect.value = String(getSessionTimeoutMinutes());
  }
}

function getScreenLockMinutes() {
  return ensureStoredNumberSetting(
    "screenLockMinutes",
    DEFAULT_SCREEN_LOCK_MINUTES,
    MIN_SCREEN_LOCK_MINUTES,
    MAX_SCREEN_LOCK_MINUTES
  );
}

function getSessionTimeoutMinutes() {
  return ensureStoredNumberSetting(
    "sessionTimeoutMinutes",
    DEFAULT_SESSION_TIMEOUT_MINUTES,
    MIN_SESSION_TIMEOUT_MINUTES,
    MAX_SESSION_TIMEOUT_MINUTES
  );
}


function setScreenLockMinutes(minutes) {
  localStorage.setItem("screenLockMinutes", String(minutes));
}

function setSessionTimeoutMinutes(minutes) {
  localStorage.setItem("sessionTimeoutMinutes", String(minutes));
}


function resetScreenLockTimer() {
  lastInteractionTime = Date.now();

  if (screenLockTimer) {
    clearTimeout(screenLockTimer);
    screenLockTimer = null;
  }

  const lockAfterMs = getScreenLockMinutes() * 60 * 1000;

  screenLockTimer = setTimeout(() => {
    const currentScreen = getCurrentScreenId();

    if (currentScreen === "registrationView" || currentScreen === "loginView") {
      return;
    }

    if (screenLockActive) {
      return;
    }

    triggerAutoLock();
  }, lockAfterMs);
}


const APPMASTER_VERSION = "carrypass-appMaster-v4";
const CANARY_VERSION   = "carrypass-canary-key-v4";
const SESSION_VERSION   = "carrypass-session-key-v4";
const TOTP_SECRET_VERSION  = "carrypass-totp-secret-key-v4";
const PASSWORD_KEY_VERSION = "carrypass-password-key-v4";
const SCREENLOCK_BASE_VERSION = "carrypass-screenlock-base-v4";

const SITE_INPUT_VERSION = "carrypass-site-input-v4";


const ARGON_LOGIN_OPTIONS_V4 = {
time: 4,
mem: 131072,
parallelism: 1,
type: argon2.ArgonType.Argon2id
};

const ARGON_PASSWORD_OPTIONS_V4 = {
time: 3,
mem: 65536,
parallelism: 1,
type: argon2.ArgonType.Argon2id
};

const ARGON_VAULT_OPTIONS_V4 = {
time: 3,
mem: 98304,
parallelism: 1,
type: argon2.ArgonType.Argon2id
};

async function deriveAppMaster(passphraseBytes, iconHashBytes) {

  const saltInput = new Uint8Array(
    new TextEncoder().encode(APPMASTER_VERSION + "::").length + iconHashBytes.length
  );
  const versionPrefix = new TextEncoder().encode(APPMASTER_VERSION + "::");
  saltInput.set(versionPrefix, 0);
  saltInput.set(iconHashBytes, versionPrefix.length);
  const saltDigest = await crypto.subtle.digest("SHA-256", saltInput);
  const salt = new Uint8Array(saltDigest);
  
  const result = await argon2.hash({
    pass: passphraseBytes,
    salt: salt,
    ...ARGON_LOGIN_OPTIONS_V4,
    hashLen: 32,
    raw: true
  });
  
  return new Uint8Array(result.hash);
}


async function deriveVaultCanaryKey(appMasterBytes) {
  const baseKey = await crypto.subtle.importKey(
    "raw", appMasterBytes, "HKDF", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(CANARY_VERSION)
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}


async function deriveSessionKey(appMasterBytes) {
  const baseKey = await crypto.subtle.importKey(
    "raw", appMasterBytes, "HKDF", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(SESSION_VERSION)
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}


async function deriveTotpSecretKey(appMasterBytes) {
  const baseKey = await crypto.subtle.importKey(
    "raw", appMasterBytes, "HKDF", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(TOTP_SECRET_VERSION)
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function derivePasswordKey(appMasterBytes) {
  const baseKey = await crypto.subtle.importKey(
    "raw", appMasterBytes, "HKDF", false, ["deriveBits"]
  );
  
  const passwordKeyBytes = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(PASSWORD_KEY_VERSION)
    },
    baseKey,
    256
  );
  
  const result = await crypto.subtle.importKey(
    "raw", passwordKeyBytes, "HKDF", false, ["deriveBits"]
  );
  
  new Uint8Array(passwordKeyBytes).fill(0);
  
  return result;
}



async function deriveScreenLockBaseKey(appMasterBytes) {
  const baseKey = await crypto.subtle.importKey(
    "raw", appMasterBytes, "HKDF", false, ["deriveBits"]
  );
  
  const screenLockBytes = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(SCREENLOCK_BASE_VERSION)
    },
    baseKey,
    256
  );
  
  const result = await crypto.subtle.importKey(
    "raw", screenLockBytes, "HKDF", false, ["deriveKey"]
  );
  
  new Uint8Array(screenLockBytes).fill(0);
  return result;
}



async function writeVaultCanary(vaultCanaryKey) {

  const { ciphertext, iv } = await encryptWithKey(vaultCanaryKey, new Uint8Array(0));
  
  localStorage.setItem('vaultCanary', JSON.stringify({
    iv: Array.from(iv),
    ciphertext: Array.from(ciphertext)
  }));
}


async function verifyVaultCanary(vaultCanaryKey) {
  const raw = localStorage.getItem('vaultCanary');
  if (!raw) return "missing";

  let stored;
  try {
    stored = JSON.parse(raw);
  } catch {
    return "missing";
  }
  if (!stored?.iv || !stored?.ciphertext) return "missing";

  const iv = new Uint8Array(stored.iv);
  const ciphertext = new Uint8Array(stored.ciphertext);

  try {
    await decryptWithKey(vaultCanaryKey, ciphertext, iv);
    return "ok";
  } catch {
    return "fail";
  }
}


function zeroAppMaster() {
  if (appMaster instanceof Uint8Array) {
    appMaster.fill(0);
  }

  appMaster = null;
}


function hexStringToBytes(hex) {
const out = new Uint8Array(hex.length / 2);
for (let i = 0; i < out.length; i++) {
  out[i] = parseInt(hex.substr(i * 2, 2), 16);
}
return out;
}


async function getLoginIconSequenceHashBytes() {
  if (!loginIconHashBytesGlobal) {
    throw new Error("Login icon sequence is not completed yet.");
  }

  const bytes = loginIconHashBytesGlobal;
  loginIconHashBytesGlobal = null;

  return bytes;
}


function setDefaultSecurityTimeouts() {
  localStorage.setItem(
    "screenLockMinutes",
    String(DEFAULT_SCREEN_LOCK_MINUTES)
  );

  localStorage.setItem(
    "sessionTimeoutMinutes",
    String(DEFAULT_SESSION_TIMEOUT_MINUTES)
  );
}


const handlePasscodeSubmit = async (mode) => {
const inputId = mode === 'register' ? 'passCodeInputRegister' : 'passCodeInput';
const inputEl = document.getElementById(inputId);


let rawValue = inputEl?.value;
inputEl.value = '';

if (!rawValue) {
  return;
}

let trimmed = rawValue.trim();
rawValue = null;


if (trimmed.length < 16) {
  trimmed = null;
  showModalAlert("sufficientPassphrase", null, "warning");
  return;
}


if (mode === 'register') {
  const estimatedEntropy = conservativeEntropyEstimate(trimmed);
  if (estimatedEntropy < 80) {
    trimmed = null;
    showModalAlert(t("weakPassphrase", { estimatedEntropy }), null, "warning");
    return;
  }
}


let passphraseBytes = new TextEncoder().encode(trimmed);
trimmed = null;


let iconHashBytes;
if (mode === "register") {
  if (!iconHashBytesGlobal) {
    passphraseBytes.fill(0);
    showModalAlert("iconSequenceMissing", null, "warning");
    return;
  }

  iconHashBytes = iconHashBytesGlobal;
  iconHashBytesGlobal = null;
} else {
  try {
    iconHashBytes = await getLoginIconSequenceHashBytes();
  } catch {
    passphraseBytes.fill(0);
    showModalAlert("selectSix", null, "warning");
    return;
  }
}


if (mode === 'login' && !localStorage.getItem('vaultCanary')) {
  passphraseBytes.fill(0);
  iconHashBytes.fill(0);
  showModalAlert("registrationMissing", null, "warning");
  return;
}


const spinner1 = document.getElementById("spinner1");
const spinner2 = document.getElementById("spinner2");
spinner1.classList.remove("invisible");
spinner2.classList.remove("invisible");

await waitForPaint();

try {
  appMaster = await deriveAppMaster(passphraseBytes, iconHashBytes);
  passphraseBytes.fill(0);
  iconHashBytes.fill(0);

  vaultCanaryKey = await deriveVaultCanaryKey(appMaster);
  sessionKey = await deriveSessionKey(appMaster);
  totpSecretKey = await deriveTotpSecretKey(appMaster);
  passwordKey = await derivePasswordKey(appMaster);
  screenLockBaseKey = await deriveScreenLockBaseKey(appMaster);
  
  zeroAppMaster();
  
  if (mode === "register") {
    await writeVaultCanary(vaultCanaryKey);

    setDefaultSecurityTimeouts();
    initSecurityTimeoutSettings();
    resetScreenLockTimer();
    updateCountdownDisplay();
  } else {
    const status = await verifyVaultCanary(vaultCanaryKey);
    if (status !== "ok") {
      zeroAppMaster();
      sessionKey = null;
      screenLockBaseKey = null;
      passwordKey = null;
      totpSecretKey = null;
      vaultCanaryKey = null;
      if (status === "missing") {
        showModalAlert("registrationMissing", null, "warning");
      } else {
        showModalAlert("invalidPersonalKey", null, "error");
      }
      resetAuthState();
      return;
    }
    
    try {
      await loadServiceSettingsBlobs(sessionKey);
      buildSavedServicesList();
    } catch (err) {
      console.error("Failed to load saved services:", err);
      showModalAlert("notLoadServices", null, "warning");
    }
    
    await loadCustomProfilesIntoSelector();
    await decryptStoredTOTPSecret();
    await decryptStoredLabel();
    updateIdentityIndicator();
  }
  
  localStorage.setItem('lastAccessTime', Date.now().toString());

  sessionExpiredHandled = false;
  startLockCountdown();

  bootstrapSecurityTimeoutSettings();

  updateTrustedDeviceIndicator();
  showScreen('appView');
  startLockCountdown();
  resetAuthState();
  
} catch (err) {
  console.error("Login failed:", err);
  if (appMaster) zeroAppMaster();
  sessionKey = null;
  screenLockBaseKey = null;
  passwordKey = null;
  totpSecretKey = null;
  vaultCanaryKey = null;
  resetAuthState();
  showModalAlert("loginFailed", null, "error");
} finally {
  if (passphraseBytes) {
    passphraseBytes.fill(0);
    passphraseBytes = null;
  }

  if (iconHashBytes) {
    iconHashBytes.fill(0);
    iconHashBytes = null;
  }

  if (appMaster) {
    zeroAppMaster();
  }

  trimmed = null;

  if (spinner1) spinner1.classList.add("invisible");
  if (spinner2) spinner2.classList.add("invisible");
}
};



function refreshLockTimer() {
lastInteractionTime = Date.now();
}


function ensureStoredNumberSetting(key, defaultValue, min, max) {
  const raw = localStorage.getItem(key);
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    localStorage.setItem(key, String(defaultValue));
    return defaultValue;
  }

  const clamped = Math.min(max, Math.max(min, value));

  if (clamped !== value) {
    localStorage.setItem(key, String(clamped));
  }

  return clamped;
}


function stopLockCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  if (screenLockTimer) {
    clearTimeout(screenLockTimer);
    screenLockTimer = null;
  }
}


function startLockCountdown() {
  sessionExpiredHandled = false;

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  resetScreenLockTimer();

  countdownTimer = setInterval(() => {
    updateCountdownDisplay();

    const currentScreen = getCurrentScreenId();

    if (currentScreen === "registrationView" || currentScreen === "loginView") {
      stopLockCountdown();
      return;
    }

    const lastAccessTime = parseInt(localStorage.getItem("lastAccessTime"), 10) || 0;
    const sessionDuration = getSessionTimeoutMinutes() * 60 * 1000;

    if (!sessionExpiredHandled && Date.now() - lastAccessTime > sessionDuration) {
      sessionExpiredHandled = true;
      stopLockCountdown();
      switchOff();
    }
  }, 1000);
}


async function triggerAutoLock() {
  try {
    if (!identity || !sessionKey) return;

    const pin = await loadDecryptedPIN();

    if (!pin) {
      switchOff();
      return;
    }

    await lockAppWithPIN(pin);
  } catch (err) {
    console.error("Auto screen lock failed:", err);
    switchOff();
  }
}


function updateCountdownDisplay() {
  const countdownEl = document.getElementById("sessionCountdown");
  const countdownTimeEl = document.getElementById("countdownTime");

  if (!countdownEl || !countdownTimeEl) return;

  const lastAccessTime = parseInt(localStorage.getItem("lastAccessTime"), 10) || 0;
  const currentTime = Date.now();

  const sessionDuration = getSessionTimeoutMinutes() * 60 * 1000;
  const timeLeft = Math.max(0, sessionDuration - (currentTime - lastAccessTime));

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  countdownTimeEl.innerText = formatted;

  if (timeLeft <= 0) {
    countdownEl.classList.add("nodisplay");
  } else {
    countdownEl.classList.remove("nodisplay");
  }
}



document.getElementById("savePinBtn").addEventListener("click", async () => {
  const pin = document.getElementById("setPinInput").value.trim();

  if (!pin || pin.length < 6) {
    showModalAlert("pinMin", null, "warning");
    return;
  }

  await saveEncryptedPIN(pin);

  bootstrapSecurityTimeoutSettings();
  resetScreenLockTimer();
  updateCountdownDisplay();

  showModalAlert("pinSaved", null, "success");
  document.getElementById("pinSettingsModal").classList.add("hidden");
});



function normalizeTimeoutSettings() {
  const screenLock = getScreenLockMinutes();
  const sessionTimeout = getSessionTimeoutMinutes();

  if (screenLock > sessionTimeout) {
    setScreenLockMinutes(sessionTimeout);
  }
}


let securityTimeoutSettingsInitialized = false;

function initSecurityTimeoutSettings() {
  if (securityTimeoutSettingsInitialized) {
    syncSecurityTimeoutSelects();
    return;
  }

  securityTimeoutSettingsInitialized = true;

  bootstrapSecurityTimeoutSettings();

  const screenLockSelect = document.getElementById("screenLockMinutes");
  const sessionTimeoutSelect = document.getElementById("sessionTimeoutMinutes");

  if (screenLockSelect) {
    screenLockSelect.addEventListener("change", () => {
      const minutes = Number(screenLockSelect.value);

      setScreenLockMinutes(minutes);
      normalizeTimeoutSettings();
      syncSecurityTimeoutSelects();

      resetScreenLockTimer();
      updateCountdownDisplay();
      resetTimer();
    });
  }

  if (sessionTimeoutSelect) {
    sessionTimeoutSelect.addEventListener("change", () => {
      const minutes = Number(sessionTimeoutSelect.value);

      setSessionTimeoutMinutes(minutes);
      normalizeTimeoutSettings();
      syncSecurityTimeoutSelects();

      touchSessionActivity();
      updateCountdownDisplay();
      resetScreenLockTimer();
    });
  }
}


let identity = true;

function updateIdentityIndicator() {
const indicator = document.getElementById("identityIndicator");
const label = indicator.querySelector(".identity-label");
const icon = document.getElementById("identityToggleIcon");

const identityFields = document.getElementById("identityModeFields");
const manualFields = document.getElementById("manualModeFields");

if (identity) {
indicator.classList.remove("off");
label.textContent = t("identityOn");
indicator.title = "Identity mode enabled";
icon.setAttribute("data-lucide", "orbit");

if (identityFields) identityFields.classList.remove("nodisplay");
if (manualFields) manualFields.classList.add("nodisplay");
} else {
indicator.classList.add("off");
label.textContent = t("identityOff");
indicator.title = "Identity mode disabled";
icon.setAttribute("data-lucide", "circuit-board");

if (identityFields) identityFields.classList.add("nodisplay");
if (manualFields) manualFields.classList.remove("nodisplay");
}

if (typeof lucide !== "undefined") lucide.createIcons();
}



function toggleIdentityMode() {
identity = !identity;
updateIdentityIndicator();
}


document.addEventListener("DOMContentLoaded", () => {
document.getElementById("toggleIdentityBtn").addEventListener("click", toggleIdentityMode);
updateIdentityIndicator();
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("iconPracticeToggle")?.addEventListener("change", () => {
    syncIconPracticeSetting();
  });
});

function updatePasswordIndexLabel(index) {
const label = document.getElementById('passwordIndexLabel');
if (label) label.textContent = `(${index + 1}/6)`;
}


function displayPasswordFromIndex(index) {
const passwordOutput = document.getElementById("passwordPreview");
if (passwordOutput && generatedPasswords[index]) {
passwordOutput.value = generatedPasswords[index];
}
}



async function encryptSettingsData(obj, key) {
const encoded = new TextEncoder().encode(JSON.stringify(obj));
const nonce = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, encoded);
return { nonce: Array.from(nonce), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}

async function decryptSettingsData(stored, key) {
const nonce = new Uint8Array(stored.nonce);
const ciphertext = new Uint8Array(stored.ciphertext);
const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ciphertext);
return JSON.parse(new TextDecoder().decode(decrypted));
}

async function loadServiceSettingsBlobs(key) {
sessionKey = key;
const listRaw = localStorage.getItem("serviceListEncrypted");
const mapRaw = localStorage.getItem("serviceMapEncrypted");

cachedServiceList = listRaw ? await decryptSettingsData(JSON.parse(listRaw), sessionKey) : [];
cachedServiceMap = mapRaw ? await decryptSettingsData(JSON.parse(mapRaw), sessionKey) : {};
}

async function saveServiceSettingsBlobs() {
if (!settingsDirty || !sessionKey) return;
settingsDirty = false;

const listEncrypted = await encryptSettingsData(cachedServiceList, sessionKey);
const mapEncrypted = await encryptSettingsData(cachedServiceMap, sessionKey);

localStorage.setItem("serviceListEncrypted", JSON.stringify(listEncrypted));
localStorage.setItem("serviceMapEncrypted", JSON.stringify(mapEncrypted));
}



function updateServiceSettings(serviceName, updates) {
if (!cachedServiceList.includes(serviceName)) {
cachedServiceList.push(serviceName);
}
cachedServiceMap[serviceName] = {
...(cachedServiceMap[serviceName] || {}),
...updates
};
settingsDirty = true;
}




window.addEventListener("beforeunload", async () => {
await saveServiceSettingsBlobs();
zeroAppMaster();
sessionKey = null;
screenLockBaseKey = null;
passwordKey = null;
totpSecretKey = null;
vaultCanaryKey = null;
});

setInterval(() => {
saveServiceSettingsBlobs();
}, AUTO_SAVE_INTERVAL);




let sessionTOTPSecret = null;

async function decryptStoredTOTPSecret() {
const encryptedQR = localStorage.getItem("encryptedQR");
if (!encryptedQR) {
sessionTOTPSecret = null;
return;
}

try {
const { ciphertext, nonce, tag } = JSON.parse(encryptedQR);

const key = totpSecretKey;

const decrypted = await crypto.subtle.decrypt(
  {
    name: "AES-GCM",
    iv: new Uint8Array(nonce),
    tagLength: 128
  },
  key,
  new Uint8Array([...ciphertext, ...tag])
);

sessionTOTPSecret = new TextDecoder().decode(decrypted);

} catch (err) {
sessionTOTPSecret = null;
console.warn("⚠️ Failed to decrypt TOTP secret:", err);
}
}


async function saveEncryptedPIN(pin) {
resetTimer();
if (!sessionKey) {
console.error("Session key is not available");
return;
}

const iv = crypto.getRandomValues(new Uint8Array(12));
const encodedPIN = new TextEncoder().encode(pin);
const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sessionKey, encodedPIN);

const payload = {
iv: Array.from(iv),
cipher: Array.from(new Uint8Array(encrypted))
};

localStorage.setItem("carrypass_encryptedPIN", JSON.stringify(payload));
}


async function loadDecryptedPIN() {
if (!sessionKey) return null;

const raw = localStorage.getItem("carrypass_encryptedPIN");
if (!raw) return null;

try {
const { iv, cipher } = JSON.parse(raw);
const decrypted = await crypto.subtle.decrypt(
  { name: "AES-GCM", iv: new Uint8Array(iv) },
  sessionKey,
  new Uint8Array(cipher)
);
return new TextDecoder().decode(decrypted);
} catch (err) {
console.warn("PIN decryption failed:", err);
return null;
}
}


function getCurrentScreenId() {
const screens = document.querySelectorAll('.screen');
for (const screen of screens) {
const style = window.getComputedStyle(screen);
if (style.display !== 'none') { 

  return screen.id;
}
}
return 'appView';
}


async function lockAppWithPIN(pin) {
  if (!pin) {
    switchOff();
    return;
  }
  if (!screenLockBaseKey) {
    switchOff();
    return;
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const verifyKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: new TextEncoder().encode("carrypass-screenlock-v4::" + pin)
    },
    screenLockBaseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    verifyKey,
    new Uint8Array(0)
  );

  screenLockState = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    cipher: Array.from(new Uint8Array(encrypted))
  };

  screenLockActive = true;
  screenLockActivatedAt = Date.now();
  pinRetryCount = 0;
  lastActiveScreen = getCurrentScreenId();
  showScreen('screenLockView');
}


async function unlockWithPIN() {
  const pin = document.getElementById("pinInput")?.value.trim();
  const pinInput = document.getElementById("pinInput");
  if (!pin || !screenLockState || !screenLockBaseKey) return;

  const salt = new Uint8Array(screenLockState.salt);

  const verifyKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: new TextEncoder().encode("carrypass-screenlock-v4::" + pin)
    },
    screenLockBaseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  try {
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(screenLockState.iv) },
      verifyKey,
      new Uint8Array(screenLockState.cipher)
    );

    screenLockState = null;
    screenLockActive = false;
    screenLockActivatedAt = null;
    pinRetryCount = 0;
    pinInput.value = "";

    if (lastActiveScreen) {
      showScreen(lastActiveScreen);
      lastActiveScreen = null;
    } else {
      showScreen('appView');
    }
  } catch {
    pinRetryCount++;
    pinInput.value = "";

    if (pinRetryCount >= MAX_RETRIES) {
      switchOff();
      showScreen('loginView');
    } else {
      const remaining = MAX_RETRIES - pinRetryCount;
      showModalAlert(t("incorrectPinAttempts", { remaining: remaining }), null, "error");
    }
  }
}



let sessionMemberId = null;

async function decryptStoredLabel() {
const encryptedLabel = localStorage.getItem("encryptedLabel");
if (!encryptedLabel) {
sessionMemberId = null;
return;
}

try {
const { ciphertext, nonce, tag } = JSON.parse(encryptedLabel);

const key = totpSecretKey;

const decrypted = await crypto.subtle.decrypt(
  {
    name: "AES-GCM",
    iv: new Uint8Array(nonce),
    tagLength: 128
  },
  key,
  new Uint8Array([...ciphertext, ...tag])
);

sessionMemberId = new TextDecoder().decode(decrypted);

} catch (e) {
sessionMemberId = null;
console.warn("⚠️ Failed to decrypt label:", e);
}
}



let lastLoadedService = '';

document.getElementById('webAddress').addEventListener('input', () => {
const currentInput = normalizeServiceName(document.getElementById('webAddress').value.trim());

if (lastLoadedService && currentInput !== lastLoadedService) {
document.getElementById('length').value = '43';
document.getElementById('iterationCount').value = '50000';
document.getElementById('toggle1').checked = true;
document.getElementById('toggle2').checked = true;
document.getElementById('toggle3').checked = true;
document.getElementById('toggle4').checked = true;
document.getElementById('toggle5').checked = false;
updateArgonTierLabel();

}
});

document.getElementById('webAddress').addEventListener('keydown', (e) => {
if (e.key === 'Enter') {
  e.preventDefault();
  collectInputData();
}
});


document.getElementById('pinInput').addEventListener('keydown', (e) => {
if (e.key === 'Enter') {
  e.preventDefault();
  unlockWithPIN();
}
});


document.addEventListener('DOMContentLoaded', () => {
document.getElementById('toggle1Admin').checked = true;
document.getElementById('toggle2Admin').checked = true;
document.getElementById('toggle3Admin').checked = true;
document.getElementById('toggle4Admin').checked = true;
document.getElementById('toggle5Admin').checked = false;

document.getElementById('saltAdmin').value = "";
document.getElementById('lengthAdmin').value = 43;
document.getElementById('iterationCountAdmin').value = 50000;
});


const webAddressInput = document.getElementById('webAddress');
const dot = document.getElementById('dot');
let debounceTimer;

function runServiceMatchCheck() {
  const input = webAddressInput.value.trim();
  if (!input) {
    dot.style.setProperty('--dot-color', '');
    return;
  }

  const settings = cachedServiceMap[input];

  if (!settings) {
    dot.style.setProperty('--dot-color', 'red');
    clearPasswordCard();

    const profileSelector = document.getElementById('profileSelector');
    if (profileSelector) profileSelector.value = "structured";

    const variantInput = document.getElementById('counter');
    if (variantInput) variantInput.value = 0;

    sessionStorage.removeItem("carrypass_indexPassword");

    const identifierInput = document.getElementById('identifierInput');
    if (identifierInput) identifierInput.value = '';

    lastLoadedService = '';
    return;
  }

  dot.style.setProperty('--dot-color', 'green');
  clearPasswordCard();

  const profileSelector = document.getElementById('profileSelector');
  if (profileSelector && settings.passwordType) {
    profileSelector.value = settings.passwordType.toLowerCase();
  }

  const variantInput = document.getElementById('counter');
  if (variantInput && typeof settings.variant === 'number') {
    variantInput.value = settings.variant;
  }

  if (typeof settings.passwordIndex === 'number') {
    sessionStorage.setItem("carrypass_indexPassword", settings.passwordIndex);
  }

  const identifierInput = document.getElementById('identifierInput');
  if (identifierInput) identifierInput.value = settings.identifier;


  lastLoadedService = input;
}


webAddressInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runServiceMatchCheck, 300);
});

webAddressInput.addEventListener('blur', () => {
  clearTimeout(debounceTimer);
  runServiceMatchCheck();
});


function handleSessionTimeout() {

const storedPasscode = localStorage.getItem('vaultCanary');
if (storedPasscode) {

showScreen('loginView');

} else {

showScreen('registrationView');

}
}


function clearSensitiveSessionState() {
  if (sessionKey) sessionKey = null;
  if (screenLockBaseKey) screenLockBaseKey = null;
  if (passwordKey) passwordKey = null;
  if (totpSecretKey) totpSecretKey = null;
  if (vaultCanaryKey) vaultCanaryKey = null;
  if (appMaster) appMaster = null;

  if (typeof sessionTOTPSecret !== "undefined") {
    sessionTOTPSecret = null;
  }

  if (typeof sessionMemberId !== "undefined") {
    sessionMemberId = null;
  }

  vault = {};
  generatedPasswords = [];
  currentPasswordIndex = 0;
}

function resetMainAppUIAfterSessionTimeout() {
  const serviceLabel = document.getElementById("serviceLabel");
  if (serviceLabel) serviceLabel.innerText = "Service Name";

  const passwordPreview = document.getElementById("passwordPreview");
  if (passwordPreview) passwordPreview.value = "";

  const profileSelector = document.getElementById("profileSelector");
  if (profileSelector) profileSelector.value = "structured";

  const counter = document.getElementById("counter");
  if (counter) counter.value = 0;

  const passwordIndexLabel = document.getElementById("passwordIndexLabel");
  if (passwordIndexLabel) passwordIndexLabel.innerText = "(1/6)";
}

function forceSessionLogout() {
  const storedPasscode = localStorage.getItem("vaultCanary");

  clearSensitiveSessionState();
  resetMainAppUIAfterSessionTimeout();

  showScreen(storedPasscode ? "loginView" : "registrationView");
}

function isSessionExpired() {
  const lastAccessTime = parseInt(localStorage.getItem("lastAccessTime"), 10) || 0;
  const currentTime = Date.now();

  const sessionDuration = getSessionTimeoutMinutes() * 60 * 1000;

  return currentTime - lastAccessTime > sessionDuration;
}

function touchSessionActivity() {
  localStorage.setItem("lastAccessTime", Date.now().toString());
  updateCountdownDisplay();
}

const checkSessionTimeout = () => {
  const currentScreen = getCurrentScreenId();

  if (currentScreen === "registrationView" || currentScreen === "loginView") {
    return;
  }

  if (isSessionExpired()) {
    forceSessionLogout();
    return;
  }

  updateCountdownDisplay();
};


const resetSessionTimer = () => {
localStorage.setItem('lastAccessTime', Date.now().toString());

updateCountdownDisplay(); 

};


setInterval(checkSessionTimeout, 30 * 1000);



document.addEventListener('click', (e) => {
const link = e.target.closest('[data-section]');
if (!link) return;

e.preventDefault();
const screenId = link.getAttribute('data-section');
showScreen(screenId);
});


function clearSensitiveInputs() {
const fieldIds = [
"memberId",
"memberPassword",
"adminPasswordEditorInput",
"passCodeInput",
"passCodeInputRegister"
];

fieldIds.forEach(id => {
const el = document.getElementById(id);
if (el) el.value = '';
});

const fileInputs = document.querySelectorAll('input[type="file"]');
fileInputs.forEach(input => {
input.value = '';
});
}


const TEAM_ENTRY_SCREEN_IDS = [
  "adminVaultEditorPanel",
  "memberUnlockPanel",
  "adminPanel",
  "memberPanel"
];

function hasOpenVaultSession() {
  return (
    typeof vault === "object" &&
    vault !== null &&
    (
      Object.keys(vault.members || {}).length > 0 ||
      Object.keys(vault.teams || {}).length > 0
    )
  );
}

function resolveRequestedScreenId(screenId) {
  const isTeamEntryScreen = TEAM_ENTRY_SCREEN_IDS.includes(screenId);

  if (
    isTeamEntryScreen &&
    hasOpenVaultSession() &&
    (lastVaultScreen === "adminPanel" || lastVaultScreen === "memberPanel")
  ) {
    return lastVaultScreen;
  }

  return screenId;
}


function showScreen(screenId) {
  screenId = resolveRequestedScreenId(screenId);

  const isFullExit =
    screenId === "loginView" ||
    screenId === "registrationView";

  document.querySelectorAll(".screen").forEach(screen => {
    if (screen.id === screenId) {
      screen.classList.remove("nodisplay");
      screen.classList.remove("hiding");

      screen.classList.remove("active");

      void screen.offsetWidth;

      setTimeout(() => {
        screen.classList.add("active");
      }, 10);

      if (screenId !== "screenLockView") {
        lastActiveScreen = screenId;
      }

      if (screenId === "adminPanel" || screenId === "memberPanel") {
        lastVaultScreen = screenId;
      }

    } else {
      screen.classList.remove("active");

      if (screen.id === "memberPanel") {
        const memberVaultContent1 = document.getElementById("memberVaultContent1");
        const memberVaultContent2 = document.getElementById("memberVaultContent2");

        if (memberVaultContent1) memberVaultContent1.textContent = "";
        if (memberVaultContent2) memberVaultContent2.textContent = "";
      }

      if (isFullExit && screen.id === "adminPanel") {
        vault = {};
        generatedPasswords = [];
        currentPasswordIndex = 0;
        lastVaultScreen = null;

        const membersList = document.getElementById("membersList");
        const teamsList = document.getElementById("teamsList");
        const assignmentsList = document.getElementById("assignmentsList");
        const credentialsList = document.getElementById("credentialsList");

        if (membersList) membersList.textContent = "";
        if (teamsList) teamsList.textContent = "";
        if (assignmentsList) assignmentsList.textContent = "";
        if (credentialsList) credentialsList.textContent = "";

        const webAddressAdmin = document.getElementById("webAddressAdmin");
        const passwordAdmin = document.getElementById("passwordAdmin");
        const mainPasswordAdmin = document.getElementById("mainPasswordAdmin");
        const createdforAdmin = document.getElementById("createdforAdmin");
        const generationStatusAdmin = document.getElementById("generationStatusAdmin");

        if (webAddressAdmin) webAddressAdmin.value = "";
        if (passwordAdmin) passwordAdmin.value = "";
        if (mainPasswordAdmin) mainPasswordAdmin.value = "";
        if (createdforAdmin) createdforAdmin.textContent = "";

        if (generationStatusAdmin) {
          generationStatusAdmin.classList.add("generation-status-hidden");
        }

        updatePasswordStrengthUI(
          "passwordStrengthBarAdminInput",
          "passwordStrengthTextAdminInput",
          "entropyTextAdminInput",
          ""
        );

        const passwordModalText = document.getElementById("passwordModalText");
        const passwordModal = document.getElementById("passwordModal");

        if (passwordModalText) passwordModalText.value = "";
        if (passwordModal) passwordModal.classList.add("hidden");

        const credentialLabel = document.getElementById("credentialLabel");
        const credentialURL = document.getElementById("credentialURL");
        const credentialUsername = document.getElementById("credentialUsername");
        const credentialPassword = document.getElementById("credentialPassword");
        const credentialPasswordText = document.getElementById("credentialPasswordText");
        const credentialNotes = document.getElementById("credentialNotes");
        const credentialTeam = document.getElementById("credentialTeam");

        if (credentialLabel) credentialLabel.value = "";
        if (credentialURL) credentialURL.value = "";
        if (credentialUsername) credentialUsername.value = "";
        if (credentialPassword) credentialPassword.value = "";
        if (credentialPasswordText) credentialPasswordText.value = "";
        if (credentialNotes) credentialNotes.value = "";
        if (credentialTeam) credentialTeam.textContent = "";

        const editCredentialLabel = document.getElementById("editCredentialLabel");
        const editCredentialURL = document.getElementById("editCredentialURL");
        const editCredentialUsername = document.getElementById("editCredentialUsername");
        const editCredentialPassword = document.getElementById("editCredentialPassword");
        const editCredentialPasswordText = document.getElementById("editCredentialPasswordText");
        const editCredentialNotes = document.getElementById("editCredentialNotes");

        if (editCredentialLabel) editCredentialLabel.value = "";
        if (editCredentialURL) editCredentialURL.value = "";
        if (editCredentialUsername) editCredentialUsername.value = "";
        if (editCredentialPassword) editCredentialPassword.value = "";
        if (editCredentialPasswordText) editCredentialPasswordText.value = "";
        if (editCredentialNotes) editCredentialNotes.value = "";

        const qrOutput = document.getElementById("qrOutput");
        if (qrOutput) qrOutput.textContent = "";

        const qrPlace = document.getElementById("hiddenQr");
        if (qrPlace) qrPlace.classList.add("nodisplay");

        closeAllModals();
      }

      if (screen.id === "appView") {
        clearPasswordCard();
      }

      setTimeout(() => {
        screen.classList.add("nodisplay");
        screen.classList.remove("hiding");
      }, 400);
    }
  });

  if (
    isFullExit &&
    document.querySelector(".modal.active, .modal.visible, .modal.show, .modal[open]")
  ) {
    closeAllModals();
  }

  if (isFullExit) {
    lastVaultScreen = null;

    if (typeof vault === "object" && vault !== null) {
      for (const key in vault) {
        if (Object.hasOwn(vault, key)) {
          delete vault[key];
        }
      }
    }
  }
}



const resetTimer = () => {
  const currentScreen = getCurrentScreenId();

  if (currentScreen === "registrationView" || currentScreen === "loginView") {
    return;
  }

  if (isSessionExpired()) {
    forceSessionLogout();
    return;
  }

  touchSessionActivity();
  resetScreenLockTimer();
};


function closeAllModals() {
if (window.openModals) {
window.openModals.forEach(closeFn => {
  try {
    if (typeof closeFn === 'function') closeFn();
  } catch (e) {
    console.warn("Error closing tracked modal:", e);
  }
});
window.openModals = [];
}

document.querySelectorAll('.modal').forEach(modal => {
modal.classList.remove('active', 'visible', 'show');

if (!modal.classList.contains('hidden')) {
  modal.classList.add('hidden');
}

if (typeof modal.close === 'function' && modal.hasAttribute('open')) {
  try {
    modal.close();
  } catch (e) {}
}
});

document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
}


function switchOff(skipShowScreen = false) {

stopLockCountdown();
sessionExpiredHandled = true;

document.querySelectorAll('input, textarea').forEach(el => {
if (el.type !== 'checkbox' && el.type !== 'radio') {
  el.value = '';
} else {
  el.checked = false;
}
});

['mainPassword', 'username', 'supplementaryone', 'supplementarytwo', 'supplementarythree', 'supplementaryfour', 'supplementaryfive'].forEach(id => {
const el = document.getElementById(id);
if (el) el.value = '';
});

zeroAppMaster()
if (sessionKey) sessionKey = null;
if (screenLockBaseKey) screenLockBaseKey = null;
if (passwordKey)  passwordKey = null;
if (totpSecretKey)  totpSecretKey = null;
if (vaultCanaryKey)  vaultCanaryKey = null;
if (appMaster) appMaster = null;

sessionTOTPSecret = null;
sessionMemberId = null;
iconHash = "";
selectedRegister = [];
selectedLogin = [];
vault = {};
auditLogQueue.length = 0;
securelyEraseMemory();

sessionStorage.clear();

auditLogQueue.length = 0;

generatedPasswords = [];
currentPasswordIndex = 0;

document.getElementById('serviceLabel').innerText = "Service Name";
document.getElementById('passwordPreview').value = "";
document.getElementById('profileSelector').value = "structured";
document.getElementById('counter').value = 0;
document.getElementById('passwordIndexLabel').innerText = "(1/6)";

document.querySelectorAll('.modal, .modal-edit, .modal-confirm, .carrypass-modal').forEach(modal => {
modal.classList.add('hidden');
modal.classList.remove('active');
});

const backdrop = document.getElementById('modalBackdrop');
if (backdrop) backdrop.classList.add('hidden');

document.querySelectorAll('.modal-error').forEach(errBox => {
errBox.textContent = '';
errBox.classList.add('hidden');
errBox.classList.remove('active');
});

const passwordModalText = document.getElementById("passwordModalText");
if (passwordModalText) passwordModalText.value = "";

const fieldsToClear = [
"adminPasswordEditorInput",
"memberPassword"
];
fieldsToClear.forEach(id => {
const el = document.getElementById(id);
if (el) el.value = '';
});

const elementsToClear = [
"teamsList",
"membersList",
"credentialsList",
"assignmentsList",
"vaultExpirationDisplay",
"memberVaultContent1",
"memberVaultContent2"
];
elementsToClear.forEach(id => {
const el = document.getElementById(id);
if (el) el.textContent = '';
});

const searchInputs = [
"teamSearchInput",
"memberSearchInput",
"credentialSearchInput",
"credentialSearchByTeam",
"assignmentSearchInput",
"assignmentSearchByTeam"
];
searchInputs.forEach(id => {
const el = document.getElementById(id);
if (el) el.value = '';
});

const qrOutput = document.getElementById("qrOutput");
if (qrOutput) qrOutput.textContent = "";
const qrPlace = document.getElementById("hiddenQr");
if (qrPlace) qrPlace.classList.add("nodisplay");

const expirySortBtn = document.getElementById("toggleExpirySort");
if (expirySortBtn) expirySortBtn.setAttribute("data-active", "false");

if (!skipShowScreen) {
const storedPasscode = localStorage.getItem('vaultCanary');
showScreen(storedPasscode ? 'loginView' : 'registrationView');
}
}


function deleteQrCode() {
const qrOutput = document.getElementById("qrOutput");
const qrPlace = document.getElementById("hiddenQr");
if (qrOutput) qrOutput.textContent = "";
if (qrOutput) qrPlace.classList.add("nodisplay");
}


document.addEventListener('DOMContentLoaded', () => {
  const resetButton = document.getElementById('resetAppButton');
  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      setTimeout(async () => {
        const confirmed = await confirmModal("resetApplicationConfirm");
        if (confirmed) {
          resetCompleteApp();
        }
      }, 100);
    });
  }
});


async function resetCompleteApp() {
  switchOff();

  localStorage.clear();
  sessionStorage.clear();

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }

  location.replace(location.origin + location.pathname + "?reset=" + Date.now());
}

document.getElementById("appViewLogout").addEventListener("click", switchOff);
document.getElementById("adminEditViewLogout").addEventListener("click", switchOff);
document.getElementById("memberPanelLogout").addEventListener("click", switchOff);
document.getElementById("memberVaultLogout").addEventListener("click", switchOff);
document.getElementById("adminEditorLoginLogout").addEventListener("click", switchOff);


window.addEventListener('load', checkSessionTimeout);  
window.addEventListener('popstate', checkSessionTimeout); 
window.addEventListener('hashchange', checkSessionTimeout);


document.addEventListener("DOMContentLoaded", function() {
lucide.createIcons();
});


document.addEventListener("DOMContentLoaded", () => {
  setupPasswordTextareaToggle({
    inputId: "credentialPassword",
    textareaId: "credentialPasswordText",
    toggleId: "createPasswordToggle"
  });

  setupPasswordTextareaToggle({
    inputId: "editCredentialPassword",
    textareaId: "editCredentialPasswordText",
    toggleId: "editPasswordToggle"
  });
});


document.addEventListener("DOMContentLoaded", () => {
  initSecurityTimeoutSettings();
  bootstrapSecurityTimeoutSettings();
  updateCountdownDisplay();

  setInterval(checkSessionTimeout, 1000);
  setInterval(updateCountdownDisplay, 1000);
});


function syncPasswordTextareaToInput(inputId, textareaId) {
  const input = document.getElementById(inputId);
  const textarea = document.getElementById(textareaId);

  if (!input || !textarea) return;

  if (!textarea.classList.contains("hidden")) {
    input.value = textarea.value;
  }
}

function resetPasswordTextareaToggle(inputId, textareaId, toggleId) {
  const input = document.getElementById(inputId);
  const textarea = document.getElementById(textareaId);
  const toggle = document.getElementById(toggleId);

  if (!input || !textarea || !toggle) return;

  textarea.value = input.value || "";
  textarea.classList.add("hidden");
  input.classList.remove("hidden");

  toggle.textContent = typeof t === "function" ? t("showButton") : "Show";
}

function setupPasswordTextareaToggle({ inputId, textareaId, toggleId }) {
  const input = document.getElementById(inputId);
  const textarea = document.getElementById(textareaId);
  const toggle = document.getElementById(toggleId);

  if (!input || !textarea || !toggle) return;

  let visible = false;

  function setToggleText(isVisible) {
    toggle.textContent = typeof t === "function"
      ? t(isVisible ? "hideButton" : "showButton")
      : isVisible ? "Hide" : "Show";
  }

  toggle.addEventListener("click", () => {
    visible = !visible;

    if (visible) {
      textarea.value = input.value;

      input.classList.add("hidden");
      textarea.classList.remove("hidden");

      setToggleText(true);
      textarea.focus();
    } else {
      input.value = textarea.value;

      textarea.classList.add("hidden");
      input.classList.remove("hidden");

      setToggleText(false);
      input.focus();
    }
  });

  input.addEventListener("input", () => {
    if (!visible) {
      textarea.value = input.value;
    }
  });

  textarea.addEventListener("input", () => {
    if (visible) {
      input.value = textarea.value;
    }
  });
}


const counterInput = document.getElementById('counter');

counterInput.addEventListener('input', (e) => {
e.target.value = e.target.value.replace(/\D/g, '');
});

counterInput.addEventListener('keydown', (e) => {
const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];
if (!/\d/.test(e.key) && !allowedKeys.includes(e.key)) {
e.preventDefault();
}
});

function showSmooth(element) {
if (!element) return;
element.classList.add('visible');
}

function hideSmooth(element) {
if (!element) return;
element.classList.remove('visible');
}



function toggleSliderState(sliderId, buttonId) {
  const slider = document.getElementById(sliderId);
  const ball = document.getElementById(buttonId);

  var settingsState = document.getElementById('settings');
  resetTimer();
  
  if (slider.classList.contains('active')) {
    slider.classList.remove('active');
    ball.classList.remove('active');
    if (buttonId == 'btn1') {
      hideSmooth(settingsState);
    }   
  } else {
    slider.classList.add('active');
    ball.classList.add('active');

    if (buttonId == 'btn1') {
      showSmooth(settingsState);
    }
  }
}


function activateToggle() {
  const toggle1 = document.getElementById('toggle1');
  toggle1.checked = true; 
  const toggle2 = document.getElementById('toggle2');
  toggle2.checked = true; 
  const toggle3 = document.getElementById('toggle3');
  toggle3.checked = true; 
  const toggle4 = document.getElementById('toggle4');
  toggle4.checked = true;
  const toggle5 = document.getElementById('toggle5');
  toggle5.checked = false;    

  const event = new Event('change');
  toggle1.dispatchEvent(event);
  toggle2.dispatchEvent(event);
  toggle3.dispatchEvent(event);
  toggle4.dispatchEvent(event);
  toggle5.dispatchEvent(event);
  resetTimer();
}


document.addEventListener('DOMContentLoaded', (event) => {
  activateToggle(); 
});


document.getElementById('iterationCount').addEventListener('input', function () {
  const value = this.value;
  if (value.length > 5) {
    this.value = value.slice(0, 5);
  }
});

document.getElementById('length').addEventListener('input', function () {
  const value = this.value;
  if (value.length > 3) {
    this.value = value.slice(0, 3);
  }
});

  document.getElementById('iterationCount').addEventListener('focus', function() {
    this.value = ''; 
  });


  document.getElementById('iterationCount').addEventListener('blur', function() {
    if (this.value === '') { 
      this.value = '50000';
    }
  });

  document.getElementById('length').addEventListener('focus', function() {
    this.value = ''; 
  });

  document.getElementById('length').addEventListener('blur', function() {
    if (this.value === '') { 
      this.value = '43'; 
    }
  });

  document.getElementById('iterationCount').addEventListener('input', function() {
    if (this.value === '0') {
      this.value = ''; 
    } else if (this.value.startsWith('0') && this.value.length > 1) {
      this.value = this.value.slice(1);
    }
  });


  document.getElementById('length').addEventListener('input', function() {
    if (this.value === '0') {
      this.value = ''; 
    } else if (this.value.startsWith('0') && this.value.length > 1) {
      this.value = this.value.slice(1);
    }
  });


  function generateSafeId(name) {
    return name
      .toLowerCase()
      .normalize("NFD")                    
      .replace(/[\u0300-\u036f]/g, "")  
      .replace(/[^a-z0-9]+/g, "-")    
      .replace(/^-+|-+$/g, "");   
  }

  function collectCustomProfileFromAdminUI() {
    return {
      length: parseInt(document.getElementById("lengthCustomSettings").value, 10),
      iterationCount: parseInt(document.getElementById("iterationCountCustomSettings").value, 10),
      uppercase: document.getElementById("toggle1CustomSettings").checked,
      lowercase: document.getElementById("toggle2CustomSettings").checked,
      numbers: document.getElementById("toggle3CustomSettings").checked,
      symbols: document.getElementById("toggle4CustomSettings").checked,
      separator: document.getElementById("toggle5CustomSettings").checked
    };
  }

  async function saveCustomProfile(label, settings) {
    const id = generateSafeId(label);
    const entry = { label, ...settings };
    const allEncrypted = localStorage.getItem("carrypass_customTypesEnc");
    let all = {};

    if (allEncrypted) {
      try {
        all = await decryptWithSessionKey(allEncrypted);
      } catch (e) {
        console.warn("Failed to decrypt custom profiles. Starting fresh.");
      }
    }

    const overwrite = all[id] !== undefined;
    const doSave = () => {
      all[id] = entry;
      encryptWithSessionKey(all).then(enc => {
        localStorage.setItem("carrypass_customTypesEnc", enc);
        loadCustomProfilesIntoSelector();
      });
    };

    if (overwrite) {
      const msg = tWithVars("overwriteCustomProfile", { profileName: label });
      showConfirmation(msg, confirmed => confirmed && doSave());
    } else {
      doSave();
    }
  }


  async function encryptWithSessionKey(obj) {
    if (!sessionKey) throw new Error("No session key available");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(obj));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sessionKey, encoded);
    return JSON.stringify({
      iv: Array.from(iv),
      cipher: Array.from(new Uint8Array(ciphertext))
    });
  }

  async function decryptWithSessionKey(blob) {
    if (!sessionKey) throw new Error("No session key available");
    const { iv, cipher } = JSON.parse(blob);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      sessionKey,
      new Uint8Array(cipher)
    );
    return JSON.parse(new TextDecoder().decode(plaintext));
  }

  async function loadCustomProfilesIntoSelector() {
    const selector = document.getElementById("profileSelector");
    if (!selector) return;

    [...selector.options].forEach(opt => {
      if (opt.dataset.dynamic === "true") opt.remove();
    });

    const raw = localStorage.getItem("carrypass_customTypesEnc");
    if (!raw) return;

    let customProfiles = {};
    try {
      customProfiles = await decryptWithSessionKey(raw);
    } catch (e) {
      console.warn("Could not decrypt custom profiles:", e);
      return;
    }

    const keys = Object.keys(customProfiles);
    if (keys.length > 0) {
      const separator = document.createElement("option");
      separator.textContent = t("customProfilesSeparator")
      separator.disabled = true;
      separator.dataset.dynamic = "true";
      selector.appendChild(separator);
    }

    for (const id of keys) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = customProfiles[id].label || id;
      opt.dataset.dynamic = "true";
      selector.appendChild(opt);
    }
  }


  function ensureCustomProfileInSelector(name) {
    const selector = document.getElementById("profileSelector");
    if (!selector || !name) return;

    const exists = [...selector.options].some(opt => opt.value === name);
    if (!exists) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      opt.dataset.dynamic = "true";
      selector.appendChild(opt);
    }
  }


  const PASSWORD_PROFILES = {
    "pin": {
      length: 4,
      iterationCount: 10004,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
      separator: false
    },
    "pinsix": {
      length: 6,
      iterationCount: 10006,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
      separator: false
    },
    "short": {
      length: 10,
      iterationCount: 15010,
      uppercase: false,
      lowercase: true,
      numbers: true,
      symbols: false,
      separator: false
    },
    "medium": {
      length: 21,
      iterationCount: 42021,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      separator: false
    },
    "structured": {
      length: 23,
      iterationCount: 68023,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      separator: true
    },
    "long": {
      length: 51,
      iterationCount: 70051,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      separator: false
    },
    "diceware": {
      length: 4,
      iterationCount: 50004,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
      separator: true
    },
    "diceware-short": {
      length: 6,
      iterationCount: 30006,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
      separator: true
    },
    "diceware-memorable": {
      length: 5,
      iterationCount: 40005,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
      separator: true
    },
    "diceware-hungarian": {
      length: 6,
      iterationCount: 60006,
      uppercase: false,
      lowercase: true,
      numbers: true,
      symbols: false,
      separator: true
    },
    "mixed": {
      length: 21,
      iterationCount: 30021,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      separator: false
    }
  };

let isIdentityOn = false

async function collectInputData(){

  const variantCounter = parseInt(document.getElementById('counter').value.trim(), 10) || 0;

  let lengthInput, iterationCountInput, uppercaseChecked, lowercaseChecked, numbersChecked, symbolsChecked, separatorChecked;

  const profileSelected = document.getElementById("profileSelector")?.value;

  if (identity) {
    isIdentityOn = true;

    const builtIns = ["structured", "medium", "short", "mixed", "pin", "pinsix", "long", "diceware", "diceware-short", "diceware-memorable", "diceware-hungarian"];
    if (!builtIns.includes(profileSelected)) {
      try {
        const encryptedBlob = localStorage.getItem("carrypass_customTypesEnc");
        if (!encryptedBlob) throw new Error("No encrypted custom types found.");

        const customProfiles = await decryptWithSessionKey(encryptedBlob);
        const selectedProfile = customProfiles[profileSelected];

        if (selectedProfile) {
          applyPasswordSettingsToUI(selectedProfile);

          lengthInput = selectedProfile.length ?? 43;
          iterationCountInput = selectedProfile.iterationCount ?? 50000;
          uppercaseChecked = selectedProfile.uppercase ?? true;
          lowercaseChecked = selectedProfile.lowercase ?? true;
          numbersChecked = selectedProfile.numbers ?? true;
          symbolsChecked = selectedProfile.symbols ?? true;
          separatorChecked = selectedProfile.separator ?? false;
        } else {
          showModalAlert("passwordTypesNotFound", null, "error");
          return;
        }
      } catch (err) {
        console.error("Failed to decrypt custom profiles:", err);
        showModalAlert("passwordTypesLoad", null, "error");
        return;
      }
    }


    if (profileSelected && PASSWORD_PROFILES[profileSelected]) {
      const profile = PASSWORD_PROFILES[profileSelected];
      lengthInput = profile.length;
      iterationCountInput = profile.iterationCount;
      uppercaseChecked = profile.uppercase;
      lowercaseChecked = profile.lowercase;
      numbersChecked = profile.numbers;
      symbolsChecked = profile.symbols;
      separatorChecked = profile.separator;

      document.getElementById("length").value = profile.length;
      document.getElementById("iterationCount").value = profile.iterationCount;
      document.getElementById("toggle1").checked = profile.uppercase;
      document.getElementById("toggle2").checked = profile.lowercase;
      document.getElementById("toggle3").checked = profile.numbers;
      document.getElementById("toggle4").checked = profile.symbols;
      document.getElementById("toggle5").checked = profile.separator;
    }
  } else {
    isIdentityOn = false

    lengthInput = document.getElementById('length').value;
    iterationCountInput = document.getElementById('iterationCount').value;
    uppercaseChecked = document.getElementById('toggle1').checked;
    lowercaseChecked = document.getElementById('toggle2').checked;
    numbersChecked = document.getElementById('toggle3').checked;
    symbolsChecked = document.getElementById('toggle4').checked;
    separatorChecked = document.getElementById('toggle5').checked;
  }

    const isBuiltIn = PASSWORD_PROFILES.hasOwnProperty(profileSelected);
    const tunedIterationCount = parseInt(iterationCountInput, 10);

    const button = document.getElementById('collectInput');

    const webAddressField = document.getElementById('webAddress');
    const passwordField = document.getElementById('password');

    if (!webAddressField.value.trim()) {
      webAddressField.focus();
      return; 
    }

    if (!identity) {

      if (!passwordField.value.trim()) {
        passwordField.focus();
        return; 
      }

      if (passwordField.value.trim().length < 16) {
        showModalAlert("masterPasswordLength", null, "warning");
        passwordField.focus();
        return;
      }

    }


    button.disabled = true;

    const spinner3 = document.getElementById("spinner3");
    spinner3.classList.remove("invisible");

    const webAddressInput = document.getElementById('webAddress').value;

    const passwordInput = identity ? null : document.getElementById('password').value.trim();

    resetTimer();

    let charTypes = {
      uppercase: !!uppercaseChecked,
      lowercase: !!lowercaseChecked,
      numbers: !!numbersChecked,
      symbols: !!symbolsChecked
    };

    setTimeout(async () => {

      await generateDeterministicPasswordsWithArgon(
        webAddressInput,
        passwordInput,
        lengthInput,
        tunedIterationCount,
        charTypes,
        separatorChecked,
        variantCounter
      );

      const storedPasswordIndex = parseInt(sessionStorage.getItem("carrypass_indexPassword"), 10);

      if (!isNaN(storedPasswordIndex)) {
        currentPasswordIndex = storedPasswordIndex;
      } else {
        currentPasswordIndex = 0;
      }
      updatePasswordIndexLabel(currentPasswordIndex);
      displayPasswordFromIndex?.(currentPasswordIndex);

      sessionStorage.removeItem("carrypass_indexPassword");

      button.disabled = false;
      spinner3.classList.add("invisible");
      resetSingleFeedbackIcon();
    }, 10);

}




function segmentKeyFixedLength(password, groupSize = 7, separator = '-') {
  const chars = password.split('');
  const maxInsertions = Math.floor(password.length / (groupSize + 1));

  for (let i = 1; i <= maxInsertions; i++) {
    const insertPos = i * groupSize + (i - 1);
    if (insertPos < chars.length) {
      chars[insertPos] = separator;
    }
  }

  return chars.join('');
}



async function generateDicewarePassphrases(masterKey, service, iterationCount, variant = 1, wordListType = "standard", count = 6) {
  
  const wordCount = Math.max(1, variant);
  
  const saltInput = `diceware::${service}::${iterationCount}::${wordCount}::${wordListType}`;
  const salt = new TextEncoder().encode(saltInput);
  
  const wordLists = {
    standard: EFF_WORDS,
    short: EFF_SHORT_WORDS,
    memorable: EFF_MEMORABLE_WORDS,
    hungarian: HUNGARIAN_WORDS
  };
  const wordList = wordLists[wordListType] || EFF_WORDS;
  const wordListLength = wordList.length;
  const maxAcceptable = Math.floor(65536 / wordListLength) * wordListLength;
  
  let passwordInputBytes;
  if (identity) {
    passwordInputBytes = await materializeSiteSpecificBytes(
      passwordKey,
      service,
      "diceware"
    );
  } else {
    if (!masterKey) {
      throw new Error("Diceware generation requires identity mode or a master password");
    }
    passwordInputBytes = new TextEncoder().encode(masterKey);
  }
  
  const hash = await argon2.hash({
    pass: passwordInputBytes,
    salt,
    ...ARGON_PASSWORD_OPTIONS_V4,
    hashLen: 32,
    raw: true
  });
  
  passwordInputBytes.fill(0);
  
  const secret = new Uint8Array(hash.hash);
  
  const passphrases = [];
  for (let i = 0; i < count; i++) {
    const passphrase = await deriveDicewareVariant(
      secret,
      service,
      i,
      wordCount,
      wordList,
      wordListLength,
      maxAcceptable
    );
    passphrases.push(passphrase);
  }
  
  return passphrases;
}


async function deriveDicewareVariant(secret, service, index, wordCount, wordList, wordListLength, maxAcceptable) {
  const keystreamBytes = wordCount * 8 + 32;
  
  const info = `${VERSION_TAG}::diceware::${service}::${index}`;
  const keystream = await hkdfExpand(secret, info, keystreamBytes);
  
  const words = [];
  let i = 0;
  while (words.length < wordCount && i + 1 < keystream.length) {
    const number = (keystream[i] << 8) | keystream[i + 1];
    i += 2;
    
    if (number < maxAcceptable) {
      const wordIndex = number % wordListLength;
      words.push(wordList[wordIndex]);
    }
  }
  
  if (words.length < wordCount) {
    throw new Error(
      `Diceware keystream exhausted for variant ${index} at wordCount=${wordCount}. ` +
      `Generated ${words.length} of ${wordCount} words.`
    );
  }
  
  return words.join(" ");
}



function finalizePasswordGenerationUI(service) {
  const serviceLabel = document.getElementById("serviceLabel");
  const bold = document.createElement("b");
  bold.textContent = service;
  serviceLabel.replaceChildren(bold);
  document.getElementById("webAddress").value = "";
  document.getElementById("password").value = "";
  updatePasswordStrengthUI("passwordStrengthBarMaster", "passwordStrengthTextMaster", "entropyTextMaster", "");
  document.getElementById("password").disabled = true;
  const dot = document.getElementById("dot");
  dot.style.setProperty("--dot-color", "#e7f1ff");
  updateCounter();
  resetTimer();
}


const VERSION_TAG = "v4";

async function materializeSiteSpecificBytes(key, normalizedService, kind) {
  const infoString = SITE_INPUT_VERSION + "::" + kind + "::" + normalizedService;

  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(infoString)
    },
    key,
    256
  );

  return new Uint8Array(bits);
}

const PASSWORDCHARSETS = {
upperAlpha: 'ZJVEQSLBWRGNMYXDOCHIPATUKF',
lowerAlpha: 'pvjaqukxhyngorfizwmtlbdecs',
numbers:    '7294053861',
special:    '!@#&$%*^()_+[]{}|;:,.<>?/'
};



async function hkdfExpand(secretBytes, infoString, neededBytes) {
const baseKey = await crypto.subtle.importKey(
  "raw",
  secretBytes,
  { name: "HKDF" },
  false,
  ["deriveBits"]
);

const bits = await crypto.subtle.deriveBits(
  {
    name: "HKDF",
    hash: "SHA-256",
    salt: new Uint8Array(0),
    info: new TextEncoder().encode(infoString),
  },
  baseKey,
  neededBytes * 8
);

return new Uint8Array(bits);
}


function buildCharsetAndRules(charTypes) {
let charset = '';
const rules = [];
if (charTypes.uppercase) { charset += PASSWORDCHARSETS.upperAlpha; rules.push('[A-Z]'); }
if (charTypes.lowercase) { charset += PASSWORDCHARSETS.lowerAlpha; rules.push('[a-z]'); }
if (charTypes.numbers)   { charset += PASSWORDCHARSETS.numbers;    rules.push('[0-9]'); }
if (charTypes.symbols)   { charset += PASSWORDCHARSETS.special;    rules.push('[!@#$%^&*()\\-_=+\\[\\]{}|;:,.<>?]'); }
return { charset, rules };
}


function canonicalCharsetSignature(charset) {
return [...new Set(charset)].sort().join('');
}


function mapKeystreamToPassword(keystream, alphabet, length) {
const alphabetLen = alphabet.length;
const maxValid = Math.floor(256 / alphabetLen) * alphabetLen;

const out = [];
let i = 0;

while (out.length < length) {
  if (i >= keystream.length) {
    throw new Error("Keystream exhausted during rejection sampling");
  }
  const byte = keystream[i++];
  if (byte < maxValid) {
    out.push(alphabet[byte % alphabetLen]);
  }
}

return { chars: out, nextByte: i };
}


function enforceCharacterClasses(chars, rules, charset, keystream, startByte) {
const present = {};
for (let i = 0; i < chars.length; i++) {
  for (const rule of rules) {
    if (!present[rule] && new RegExp(rule).test(chars[i])) {
      present[rule] = i;
    }
  }
}

let byteIdx = startByte;

for (const rule of rules) {
  if (rule in present) continue;

  const subChars = charset.split('').filter(c => new RegExp(rule).test(c));
  if (subChars.length === 0) continue;

  const subMaxValid = Math.floor(256 / subChars.length) * subChars.length;

  let replacement = null;
  while (replacement === null && byteIdx < keystream.length) {
    const b = keystream[byteIdx++];
    if (b < subMaxValid) replacement = subChars[b % subChars.length];
  }
  if (replacement === null) {
    throw new Error("Keystream exhausted during character-class enforcement");
  }

  let insertPos = null;
  while (insertPos === null && byteIdx < keystream.length) {
    const candidate = keystream[byteIdx++] % chars.length;
    const isPinned = Object.values(present).includes(candidate);
    if (!isPinned) insertPos = candidate;
  }
  if (insertPos === null) {
    for (let p = 0; p < chars.length; p++) {
      if (!Object.values(present).includes(p)) { insertPos = p; break; }
    }
  }

  chars[insertPos] = replacement;
  present[rule] = insertPos;
}

return chars;
}


function buildArgonSaltInput({ mode, service, length, iterations, charsetSignature, variant }) {
if (mode !== "regular" && mode !== "identity") {
  throw new Error(`Unknown derivation mode: ${mode}`);
}

let s =
  `${VERSION_TAG}` +
  `::mode=${mode}` +
  `::service=${service}` +
  `::length=${length}` +
  `::iter=${iterations}` +
  `::charset=${charsetSignature}`;

if (mode === "identity") {
  s += `::variant=${variant}`;
}

return s;
}


async function derivePasswords({
mode,
masterPassword,
normalizedService,
length,
iterationCount,
charTypes,
variant = 0,
count = 6,
segmented = false,
}) {
const { charset, rules } = buildCharsetAndRules(charTypes);
if (!charset) {
  showModalAlert("selectMinCharType", null, "warning");
  return [];
}

const charsetSignature = canonicalCharsetSignature(charset);


const saltInput = buildArgonSaltInput({
  mode,
  service: normalizedService,
  length,
  iterations: iterationCount,
  charsetSignature,
  variant,
});

const argonSalt = new TextEncoder().encode(saltInput);

let passwordInputBytes;
if (mode === "identity") {
  passwordInputBytes = await materializeSiteSpecificBytes(
    passwordKey,
    normalizedService,
    "password"
  );
} else {
  passwordInputBytes = new TextEncoder().encode(masterPassword);
}

const argonResult = await argon2.hash({
  pass: passwordInputBytes,
  salt: argonSalt,
  ...ARGON_PASSWORD_OPTIONS_V4,
  hashLen: 32,
  raw: true
});

passwordInputBytes.fill(0);

const secret = argonResult.hash;


const passwords = [];
for (let index = 0; index < count; index++) {
  const keystreamBytes = (length + rules.length) * 8 + 32;
  const info = `${VERSION_TAG}::pwgen::${mode}::${normalizedService}::${index}`;
  const keystream = await hkdfExpand(secret, info, keystreamBytes);

  const { chars, nextByte } = mapKeystreamToPassword(keystream, charset, length);
  const enforced = enforceCharacterClasses(chars, rules, charset, keystream, nextByte);

  let password = enforced.join('');
  if (segmented) {
    password = segmentKeyFixedLength(password, 7, '-');
  }
  passwords.push(password);
}

return passwords;
}



async function generateDeterministicPasswordsWithArgon(
webAddress,
masterPassword,
length,
iterationCount,
charTypes,
segmented = false,
variant = 0
) {
const normalizedService = normalizeServiceName(webAddress);
const profileSelected = document.getElementById("profileSelector")?.value;


const isDicewareProfile = profileSelected?.startsWith("diceware");
if (isDicewareProfile) {
  let wordListType = "standard";
  if (profileSelected === "diceware-short")          wordListType = "short";
  if (profileSelected === "diceware-hungarian")     wordListType = "hungarian";
  else if (profileSelected === "diceware-memorable") wordListType = "memorable";

  const passwords = await generateDicewarePassphrases(
    masterPassword,
    normalizedService,
    iterationCount,
    variant,
    wordListType,
    6
  );
 
  updateGeneratedPasswords(passwords);
  finalizePasswordGenerationUI(webAddress);
  document.getElementById('length').value = '43';
  document.getElementById('iterationCount').value = '50000';
  document.getElementById('toggle1').checked = true;
  document.getElementById('toggle2').checked = true;
  document.getElementById('toggle3').checked = true;
  document.getElementById('toggle4').checked = true;
  document.getElementById('toggle5').checked = false;
  showSmooth(document.getElementById("passwordCard"));
  return;
}


const mode = identity ? "identity" : "regular";

const passwords = await derivePasswords({
  mode,
  masterPassword,
  normalizedService,
  length,
  iterationCount,
  charTypes,
  variant,
  count: 6,
  segmented,
});

if (passwords.length === 0) return [];

updateGeneratedPasswords(passwords);

showSmooth(document.getElementById("passwordCard"));

const serviceLabel = document.getElementById("serviceLabel");
const bold = document.createElement("b");
bold.textContent = webAddress;
serviceLabel.replaceChildren(bold);

document.getElementById("webAddress").value = "";
document.getElementById("password").value = "";
updatePasswordStrengthUI(
  "passwordStrengthBarMaster",
  "passwordStrengthTextMaster",
  "entropyTextMaster",
  ""
);
document.getElementById("password").disabled = true;

document.getElementById("dot").style.setProperty("--dot-color", "#e7f1ff");

document.getElementById('length').value = '43';
document.getElementById('iterationCount').value = '50000';
document.getElementById('toggle1').checked = true;
document.getElementById('toggle2').checked = true;
document.getElementById('toggle3').checked = true;
document.getElementById('toggle4').checked = true;
document.getElementById('toggle5').checked = false;

updateCounter();
resetTimer();
}



  document.addEventListener('DOMContentLoaded', () => {
  const webAddress = document.getElementById('webAddress');
  const password = document.getElementById('password');

  if (!webAddress || !password) return;

  webAddress.addEventListener('input', () => {
    if (webAddress.value.trim().length > 0) {
      password.disabled = false;
    } else {
      password.disabled = true;
      password.value = ''; 
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const toggle1 = document.getElementById('toggle1');
  const toggle2 = document.getElementById('toggle2');
  const toggle3 = document.getElementById('toggle3');
  const toggle4 = document.getElementById('toggle4');

  const trackedToggles = [toggle1, toggle2, toggle3, toggle4];

  trackedToggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      const checkedCount = trackedToggles.filter(t => t.checked).length;

      if (checkedCount === 0) {
        toggle.checked = true;

        const container = toggle.closest('.toggle-container');
        if (container) {
          container.classList.add('bounce');
          setTimeout(() => {
            container.classList.remove('bounce');
          }, 300); 
        }
      }
    });
  });
});



function applyPasswordSettingsToUI(settings) {
if (!settings) return;

const lengthInput = document.getElementById('length');
const iterationInput = document.getElementById('iterationCount');
const toggleUpper = document.getElementById('toggle1');
const toggleLower = document.getElementById('toggle2');
const toggleNums  = document.getElementById('toggle3');
const toggleSyms  = document.getElementById('toggle4');
const toggleSep   = document.getElementById('toggle5');

if (lengthInput) lengthInput.value = settings.length ?? 43;
if (iterationInput) iterationInput.value = settings.iterationCount ?? 50000;

if (toggleUpper) toggleUpper.checked = settings.uppercase ?? true;
if (toggleLower) toggleLower.checked = settings.lowercase ?? true;
if (toggleNums)  toggleNums.checked  = settings.numbers ?? true;
if (toggleSyms)  toggleSyms.checked  = settings.symbols ?? true;
if (toggleSep)   toggleSep.checked   = settings.separator ?? false;

}


async function decryptCustomProfiles() {
const raw = localStorage.getItem("carrypass_customTypesEnc");
if (!raw) return {};
try {
return await decryptWithSessionKey(raw);
} catch (err) {
console.warn("Custom profile decryption failed:", err);
return {};
}
}

function cleanIdentifier(rawValue) {
if (typeof rawValue !== 'string') return null;
const trimmed = rawValue.trim();
if (trimmed.length === 0) return null;
if (trimmed.length > 256) return null;
return trimmed;
}


function buildSavedServicesList() {
const listContainer = document.getElementById('savedServicesList');
listContainer.textContent = '';

for (const serviceName of cachedServiceList) {
const li = document.createElement('li');
li.className = "saved-service-item";

const link = document.createElement('a');
link.href = "#toggleSavedServices";
link.textContent = serviceName;
link.className = "saved-service-link";

link.addEventListener('click', async (e) => {
  e.preventDefault();
  clearPasswordCard();

  document.getElementById('webAddress').value = serviceName;

  const passwordField = document.getElementById('password');
  if (passwordField) passwordField.disabled = false;

  const settings = cachedServiceMap[serviceName] || {};

  await loadCustomProfilesIntoSelector();
  const allProfiles = await decryptCustomProfiles();

  if (settings.passwordType) {
    ensureCustomProfileInSelector(settings.passwordType);

    const profileSelector = document.getElementById("profileSelector");
    if (profileSelector) profileSelector.value = settings.passwordType;

    const selectedProfile = allProfiles[settings.passwordType];
    if (selectedProfile) applyPasswordSettingsToUI(selectedProfile);
  }

  const variantInput = document.getElementById('counter');
  if (variantInput && typeof settings.variant === 'number') {
    variantInput.value = settings.variant;
  }

  const identifierInput = document.getElementById('identifierInput');
  if (identifierInput) {
    identifierInput.value = settings.identifier ?? '';
  }

  sessionStorage.setItem("carrypass_indexPassword", settings.passwordIndex ?? 0);

  document.getElementById('webAddress').dispatchEvent(new Event('blur'));

  const panel = document.getElementById('savedServicesPanel');
  if (panel) panel.classList.remove('open');
});

const trashWrapper = document.createElement('button');
trashWrapper.type = 'button';
trashWrapper.className = "saved-service-delete";
trashWrapper.setAttribute('aria-label', 'Delete service');

const trashIcon = document.createElement('i');
trashIcon.setAttribute('data-lucide', 'trash-2');
trashIcon.classList.add('icon-trash');

trashWrapper.appendChild(trashIcon);

trashWrapper.addEventListener('click', (event) => {
  event.stopPropagation();
  event.preventDefault();

  const message = tWithVars("deleteServiceConfirm", { service: serviceName });
  showConfirmation(message, async (confirmed) => {
    if (confirmed) {
      const index = cachedServiceList.indexOf(serviceName);
      if (index !== -1) cachedServiceList.splice(index, 1);
      delete cachedServiceMap[serviceName];
      settingsDirty = true;
      await saveServiceSettingsBlobs();
      buildSavedServicesList();

      const manageButton = document.getElementById('toggleSavedServices');
      if (manageButton) {
        manageButton.classList.add('import-delete-flash');
        setTimeout(() => manageButton.classList.remove('import-delete-flash'), 1000);
      }
    }
  });
});

li.appendChild(link);
li.appendChild(trashWrapper);
listContainer.appendChild(li);
}

if (typeof lucide !== 'undefined') lucide.createIcons();

filterSavedServicesList();

}


function filterSavedServicesList() {
  const searchInput = document.getElementById('savedServicesSearch');
  const listContainer = document.getElementById('savedServicesList');

  if (!searchInput || !listContainer) return;

  const filter = searchInput.value.trim().toLowerCase();
  const listItems = listContainer.querySelectorAll('.saved-service-item');

  listItems.forEach(li => {
    const text = li.querySelector('.saved-service-link')?.textContent.trim().toLowerCase() || '';
    const shouldHide = Boolean(filter && !text.includes(filter));

    li.classList.toggle('saved-service-hidden', shouldHide);
  });
}


document.addEventListener('input', (event) => {
  if (event.target?.id === 'savedServicesSearch') {
    filterSavedServicesList();
  }
});



document.addEventListener('DOMContentLoaded', () => {
const toggleButton = document.getElementById('toggleSavedServices');
const panel = document.getElementById('savedServicesPanel');

if (!toggleButton || !panel) return;

toggleButton.addEventListener('click', () => {
  panel.classList.toggle('open');
});
});



async function exportEncryptedSettings(passcode) {
const exportData = {};

for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('encryptedSettings_')) {
        exportData[key] = JSON.parse(localStorage.getItem(key));
    }
}
resetTimer();
const jsonData = JSON.stringify(exportData);
const encryptedBlob = await encryptPasswordCpsData(jsonData, passcode);
const blob = new Blob([encryptedBlob], { type: "application/octet-stream" });
const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = "carrypass-encrypted-settings.cps";
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
}



async function importEncryptedSettings(file, passcode) {

const arrayBuffer = await file.arrayBuffer();

const encryptedBlob = new Uint8Array(arrayBuffer);

const decryptedText = await decryptPasswordCpsData(encryptedBlob, passcode);

const importedData = JSON.parse(decryptedText);

for (const [key, value] of Object.entries(importedData)) {
    if (key.startsWith('encryptedSettings_')) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}
buildSavedServicesList(); 
resetTimer();
const manageButton = document.getElementById('toggleSavedServices');
if (manageButton) {
  manageButton.classList.add('import-success-flash');
  setTimeout(() => {
    manageButton.classList.remove('import-success-flash');
  }, 1200);
}

}


async function encryptAESGCM(plaintext, key, iv) {
const enc = new TextEncoder().encode(plaintext);
const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

async function decryptAESGCM(ciphertext, key, iv) {
const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
return new TextDecoder().decode(decrypted);
}


let passwordModalTimeout = null;

function showCredentialPasswordModal(password) {
document.getElementById("passwordModalText").value = password;
document.getElementById("passwordModal").classList.remove("hidden");

if (passwordModalTimeout) clearTimeout(passwordModalTimeout);
passwordModalTimeout = setTimeout(() => {
document.getElementById("passwordModal").classList.add("hidden");
document.getElementById("passwordModalText").value = "";
}, 30000);
}


function renderMemberVault(decryptedVault) {
const container1 = document.getElementById("memberVaultContent1");
const container2 = document.getElementById("memberVaultContent2");

container1.textContent = "";
container2.textContent = "";

let counter = 0;

Object.entries(decryptedVault.team_data || {}).forEach(([teamId, team]) => {
  const targetContainer = (counter % 2 === 0) ? container1 : container2;
  counter++;

  const teamBlock = document.createElement("div");
  teamBlock.className = "team-section card";

  const heading = document.createElement("h4");
  heading.textContent = tWithVars("teamHeading", { name: team.name });
  teamBlock.appendChild(heading);

  const creds = team.credentials || [];

  if (creds.length === 0) {
    const noCredP = document.createElement("p");
    noCredP.textContent = t("noCredentialsInTeam");
    teamBlock.appendChild(noCredP);
  } else {
    creds.forEach((cred, index) => {
      const uniqueSuffix = `${teamId}__${index}`;

      const credBlock = document.createElement("div");
      credBlock.className = "credential-block";

      const credLabel = document.createElement("strong");
      credLabel.textContent = cred.label;
      credBlock.appendChild(credLabel);
      credBlock.appendChild(document.createElement("br"));

      credBlock.appendChild(createLabelRow("credBlockUsername__" + uniqueSuffix, "generatedUsernameLabel"));
      const usernameGroup = document.createElement("div");
      usernameGroup.className = "input-group";
      const usernameInput = document.createElement("input");
      usernameInput.id = `credBlockUsername__${uniqueSuffix}`;
      usernameInput.readOnly = true;
      usernameInput.value = cred.username;
      const usernameCopyBtn = createCopyButton(`credBlockUsername__${uniqueSuffix}`);
      const usernameIcon = createCopyIcon(`credBlockUsername__${uniqueSuffix}`);
      usernameGroup.append(usernameInput, usernameCopyBtn, usernameIcon);
      credBlock.appendChild(usernameGroup);

      credBlock.appendChild(createLabelRow("credBlockPassword__" + uniqueSuffix, "editCredPassword"));
      const passwordGroup = document.createElement("div");
      passwordGroup.className = "input-group";
      const passwordInput = document.createElement("input");
      passwordInput.id = `credBlockPassword__${uniqueSuffix}`;
      passwordInput.readOnly = true;
      passwordInput.type = "password";
      passwordInput.value = cred.password;
      const showBtn = document.createElement("button");
      showBtn.type = "button";
      showBtn.className = "btn outline";
      showBtn.dataset.i18n = "viewFull";
      showBtn.textContent = "View";
      showBtn.addEventListener("click", () => showCredentialPasswordModal(cred.password));

      const passwordCopyBtn = createCopyButton(`credBlockPassword__${uniqueSuffix}`);
      const passwordIcon = createCopyIcon(`credBlockPassword__${uniqueSuffix}`);
      passwordGroup.append(passwordInput, showBtn, passwordCopyBtn, passwordIcon);
      credBlock.appendChild(passwordGroup);

      credBlock.appendChild(createLabelRow(null, "editCredUrl"));
      const urlGroup = document.createElement("div");
      urlGroup.className = "input-group";
      const urlInput = document.createElement("input");
      urlInput.readOnly = true;
      urlInput.value = cred.url;
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "btn secondary-outline open-url-button btn-open-url";
      openBtn.dataset.url = cred.url;
      openBtn.dataset.i18n = "openButton";
      openBtn.textContent = "Open";
      urlGroup.append(urlInput, openBtn);
      credBlock.appendChild(urlGroup);

      credBlock.appendChild(createLabelRow(null, "editCredNotes"));
      const textarea = document.createElement("textarea");
      textarea.readOnly = true;
      textarea.textContent = cred.notes || "";
      credBlock.appendChild(textarea);

      teamBlock.appendChild(credBlock);
      translateDynamicElement(credBlock);
    });
  }

  targetContainer.appendChild(teamBlock);
});

lucide.createIcons();
}


function createLabelRow(forId, i18nKey) {
const wrapper = document.createElement("div");
wrapper.className = "label-full-width";
const label = document.createElement("label");
if (forId) label.htmlFor = forId;
label.className = "label-push-right";
label.dataset.i18n = i18nKey;
label.textContent = i18nKey;
wrapper.appendChild(label);
return wrapper;
}


function createCopyButton(passwordId) {
const btn = document.createElement("button");
btn.type = "button";
btn.className = "btn outline-gold";
btn.dataset.passwordId = passwordId;
btn.name = passwordId;
btn.dataset.i18n = "copyButton";
btn.textContent = "Copy";
return btn;
}


function createCopyIcon(passwordId) {
const span = document.createElement("span");
span.id = `copySuccessIcon-${passwordId}`;
span.className = "icon copy-success-icon nodisplay";
const icon = document.createElement("i");
icon.dataset.lucide = "copy-check";
icon.className = "icon-success";
span.appendChild(icon);
return span;
}



function openMemberFinalizeModal(memberId) {
document.getElementById('memberFinalizeUsername').value = memberId;
document.getElementById('memberFinalizeMasterPassword').value = '';
const modal = document.getElementById('memberFinalizeModal');
modal.classList.add('active');
modal.classList.remove('hidden');
}

function closeMemberFinalizeModal() {
const modal = document.getElementById('memberFinalizeModal');
modal.classList.add('hidden');
modal.classList.remove('active');
document.getElementById('memberFinalizeUsername').value = '';
document.getElementById('memberFinalizeMasterPassword').value = '';
document.getElementById('passwordStrengthBarMember').innerText = '';
document.getElementById('passwordStrengthTextMember').innerText = '';
document.getElementById('entropyTextMember').innerText = '';
}


function hexToBytes(hex) {
const bytes = new Uint8Array(hex.length / 2);
for (let i = 0; i < bytes.length; i++) {
bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
}
return bytes;
}




function arrayBufferToBase64(buffer) {
const bytes = new Uint8Array(buffer);
let binary = '';
for (let b of bytes) binary += String.fromCharCode(b);
return btoa(binary);
}


function base64ToArrayBuffer(base64) {
try {
  if (!base64 || typeof base64 !== 'string') {
      throw new Error("Input must be a base64 string");
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
} catch (e) {
  console.error("❗ base64ToArrayBuffer failed:", e);
  throw new Error("Invalid base64 input");
}
}



let _currentAssigningMemberId = null;

function openAssignMemberToTeamModal(memberId) {
_currentAssigningMemberId = memberId;

const member = vault.members[memberId];
document.getElementById('assignMemberNameLabel').textContent = t("assignToMember", { assignedMember: member.encrypted_vault.name });

const teamSelect = document.getElementById('assignTeamSelect');
teamSelect.textContent = '';

Object.entries(vault.teams).forEach(([teamId, team]) => {
const option = document.createElement('option');
option.value = teamId;
option.textContent = team.encrypted_team.name;
teamSelect.appendChild(option);
});

document.getElementById('assignMemberModal').classList.remove('hidden');
}


function closeAssignMemberModal() {
document.getElementById('assignMemberModal').classList.add('hidden');
_currentAssigningMemberId = null;
}

function confirmAssignMemberToTeam() {
const teamId = document.getElementById('assignTeamSelect').value;
if (!_currentAssigningMemberId || !teamId) {
showModalAlert('teamMmemberSelectReq', null, "error");
return;
}

assignMemberToTeamAdminTool(_currentAssigningMemberId, teamId);

updateAssignmentsUI();
closeAssignMemberModal();
}


async function assignMemberToTeamAdminTool(memberId, teamId) {
const member = vault.members[memberId];
const team = vault.teams[teamId];

if (!member || !team) {
console.error("❗ Invalid member or team.");
return;
}

if (!member.encrypted_vault.team_keys) {
member.encrypted_vault.team_keys = {};
}

member.encrypted_vault.team_keys[teamId] = {
data: team.encrypted_team.password_derived_key
};
logAdminAction("team_assigned_to_member", { member_id: memberId, team_id: teamId });

}


function generateId() {
const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
return Array.from(crypto.getRandomValues(new Uint8Array(8)))
.map(b => chars[b % chars.length])
.join('');
}


let finalizeTargetMemberId = null;


async function generatePseudoPad(accessSettings, strongPassword, variant = "Vortex") {
const base = accessSettings + strongPassword + variant;

const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base));
const hashHex = Array.from(new Uint8Array(hashBuffer))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

const saltHex = hashHex.substring(0, 32);

return {
  salt: hexToBytes(saltHex)
};
}



function hexToBytes(hex) {
const bytes = new Uint8Array(hex.length / 2);
for (let i = 0; i < bytes.length; i++) {
bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
}
return bytes;
}



function normalizeServiceName(service) {
if (!service) return '';
return service.trim().toLowerCase();
}



function onAdminEntry() {
resetTimer();
checkVaultExistence(); 
}



function base32ToBytes(base32) {
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
let bits = "";
for (let i = 0; i < base32.length; i++) {
  const val = alphabet.indexOf(base32[i].toUpperCase());
  if (val === -1) continue;
  bits += val.toString(2).padStart(5, '0');
}

const bytes = [];
for (let i = 0; i + 8 <= bits.length; i += 8) {
  bytes.push(parseInt(bits.substr(i, 8), 2));
}
return bytes;
}


async function generateTOTP(secret, timeOffset = 0) {
const epoch = Math.floor(Date.now() / 1000);
const time = Math.floor(epoch / 30) + timeOffset;

const key = base32ToBytes(secret);

const timeBytes = new Uint8Array(8);
let t = time;
for (let i = 7; i >= 0; i--) {
  timeBytes[i] = t & 0xff;
  t = Math.floor(t / 256);
}

const cryptoKey = await crypto.subtle.importKey(
  'raw',
  key instanceof Uint8Array ? key : new Uint8Array(key),
  { name: 'HMAC', hash: 'SHA-1' },
  false,
  ['sign']
);

const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBytes);
const hmac = new Uint8Array(signature);

const offset = hmac[hmac.length - 1] & 0x0f;
const binary =
  ((hmac[offset]     & 0x7f) << 24) |
  ((hmac[offset + 1] & 0xff) << 16) |
  ((hmac[offset + 2] & 0xff) <<  8) |
    (hmac[offset + 3] & 0xff);

return (binary % 1000000).toString().padStart(6, '0');
}



async function bootstrapNewVault() {
if (vault && Object.keys(vault.members || {}).length > 0) {
  console.warn("bootstrapNewVault called with existing vault; ignoring");
  return;
}

vault = {
  members: {},
  teams: {}
};

updateAllUI();
lastVaultScreen = "adminPanel";
showScreen("adminPanel");
}



function updateAllUI() {
lucide.createIcons();
updateTeamList();
updateMembersList();
updateAssignmentsUI();
updateCredentialsList();
updateVaultExpirationDisplay();
}


function updateVaultExpirationDisplay() {
const expiry = vault?.vault_metadata?.expiry || "";

const expiryField = document.getElementById("vaultExpirationDisplay");
const vaultExpiryInput = document.getElementById("vaultExpiry");

if (expiryField) {
  expiryField.innerText = expiry;
}
if (vaultExpiryInput) {
  vaultExpiryInput.value = expiry;
}
}



function showCreateTeamModal() {
resetTimer();
document.getElementById("teamModal").classList.remove("hidden");
}

function hideCreateTeamModal() {
document.getElementById("newTeamName").value = "";
document.getElementById("teamModal").classList.add("hidden");
}



async function createMember() {
const nameInput = document.getElementById("newMemberName");
const memberName = nameInput.value.trim();

if (!memberName) {
  showModalAlert("memberNameReq", null, "warning");
  return;
}

const existingMemberByName = Object.values(vault.members || {}).find(
  member => member.encrypted_vault.name.toLowerCase() === memberName.toLowerCase()
);
if (existingMemberByName) {
  showModalAlert("memberAlreadyExists", null, "warning");
  return;
}

let memberId;
do {
  memberId = generateId();
} while (vault.members && vault.members[memberId]);

const defaultExpiry = new Date();
defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

vault.members[memberId] = {
  encrypted_vault: {
    id: memberId,
    name: memberName,
    password_derived_key: "",
    totp_secret: "",
    team_keys: {},
    data: "",
    iv: ""
  },
  vault_metadata: {
    pending: true,
    is_admin: false,
    expiry: defaultExpiry.toISOString().split('T')[0],
    salt: ""
  }
};

logAdminAction("member_created", {
  member_id: memberId,
  member_name: memberName,
  access_expiry: vault.members[memberId].vault_metadata.expiry
});

resetTimer();
hideCreateMemberModal();
updateMembersList();
showModalAlert(t("memberCreated", { memberName: memberName }), null, "success");

nameInput.value = "";
}

async function finalizeMember() {
const memberId = document.getElementById('memberFinalizeUsername').value;
const memberPassword = document.getElementById('memberFinalizeMasterPassword').value;

if (!memberPassword) {
  showModalAlert("memberPwdRequired", null, "warning");
  return;
}

if (!isPasswordStrongEnough(memberPassword)) {
  showModalAlert("lowEntropy", null, "warning");
  return;
}

if (!vault || !vault.members) {
  throw new Error('Vault or members section not initialized');
}

const member = vault.members[memberId];
if (!member) {
  throw new Error('Member not found');
}

if (!member.vault_metadata.pending) {
  throw new Error('Member is already finalized');
}

const spinner5 = document.getElementById("spinner5");
spinner5.classList.remove("invisible");

await new Promise(resolve => setTimeout(resolve, 10));

const newTOTP = generateBase32Secret(20);

const combined = memberPassword + "::" + newTOTP;

const salt = crypto.getRandomValues(new Uint8Array(16));
const derivedKey = await deriveTeamVaultKey(combined, salt, "member", true);

const emptyShell = new TextEncoder().encode(JSON.stringify({}));
const encryptedShell = await encryptWithKey(derivedKey, emptyShell);

member.encrypted_vault.data = arrayBufferToBase64(encryptedShell.ciphertext);
member.encrypted_vault.iv = arrayBufferToBase64(encryptedShell.iv);

const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
member.encrypted_vault.password_derived_key = arrayBufferToBase64(exportedKey);
member.encrypted_vault.totp_secret = newTOTP;
member.vault_metadata.salt = arrayBufferToBase64(salt);
member.vault_metadata.pending = false;

generateQRCodeForMember(member.encrypted_vault.name, memberId, newTOTP);

logAdminAction("member_finalized", {
  member_id: member.encrypted_vault.id,
  member_name: member.encrypted_vault.name
});
spinner5.classList.add("invisible");

updateMembersList();
updateAssignmentsUI();
closeMemberFinalizeModal();
}


async function createTeam() {
resetTimer();

const name = document.getElementById("newTeamName").value.trim();
if (!name) return showModalAlert("teamNameReq", null, "error");

const existingTeamByName = Object.values(vault.teams || {}).find(
  team => team.encrypted_team.name.toLowerCase() === name.toLowerCase()
);
if (existingTeamByName) {
  showModalAlert("teamAlreadyExists", null, "warning");
  return;
}

let id;
do {
  id = generateId();
} while (vault.teams && vault.teams[id]);

const teamKey = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);
const exportedKey = await crypto.subtle.exportKey('raw', teamKey);
const derivedKeyBase64 = arrayBufferToBase64(exportedKey);

vault.teams[id] = {
  encrypted_team: {
    id: id,
    name: name,
    password_derived_key: derivedKeyBase64,
    credentials: []
  },
  team_metadata: {}
};

logAdminAction("team_created", { team_id: id, team_name: name.toLowerCase() });

hideCreateTeamModal();
updateTeamList();
lucide.createIcons();
}



function updateTeamList() {
const list = document.getElementById("teamsList");
const search = document.getElementById("teamSearchInput").value.toLowerCase();
list.textContent = "";

let hasTeams = false;

const sortedTeams = Object.entries(vault.teams || {}).sort(([, a], [, b]) =>
  a.encrypted_team.name.localeCompare(b.encrypted_team.name)
);

sortedTeams.forEach(([id, team]) => {
  if (!team.encrypted_team.name.toLowerCase().includes(search)) return;

  const div = document.createElement("div");
  div.className = "team-card compact-item input-group";

  const toggles = document.createElement("div");
  toggles.className = "toggles";

  const nameEl = document.createElement("b");
  nameEl.textContent = team.encrypted_team.name;

  const deleteBtn = document.createElement("button");
  deleteBtn.id = `deleteTeamButton-${id}`;
  deleteBtn.type = "button";
  deleteBtn.className = "btn outline-secondary btn-delete-team";
  const icon = document.createElement("i");
  icon.dataset.lucide = "x";
  deleteBtn.appendChild(icon);

  toggles.appendChild(nameEl);
  toggles.appendChild(deleteBtn);
  div.appendChild(toggles);

  hasTeams = true;

  list.appendChild(div);
});
if (!hasTeams) {

list.textContent = t("noTeams");
}
resetTimer();
lucide.createIcons();
}



function deleteTeam(id) {   
const teamName = vault.teams[id].encrypted_team.name;
const message = tWithVars("teamDeleteConfirm", { teamName: teamName });
showConfirmation(message, (confirmed) => {
  if (confirmed) {
    logAdminAction("team_deleted", { team_id: id, team_name: vault.teams[id].encrypted_team.name });
    delete vault.teams[id];

    Object.values(vault.members || {}).forEach(member => {
      if (member.encrypted_vault && member.encrypted_vault.team_keys && member.encrypted_vault.team_keys[id]) {
        logAdminAction("team_deleted_from_member", { member_id: member.encrypted_vault.id, team_id: id, team_name: member.encrypted_vault.team_keys[id].label });
        delete member.encrypted_vault.team_keys[id];
      }
    });
    
    lucide.createIcons();
    updateTeamList();
    updateMembersList();
    updateAssignmentsUI();
    updateAssignmentsByTeamUI();
    updateCredentialsList();
    updateCredentialsByTeam();
    showModalAlert(`teamDeleteSuccess`, null, 'success');
  }
});
}



function showCreateMemberModal() {
const modal = document.getElementById("createMemberModal");
if (modal) modal.classList.remove("hidden");
}

function hideCreateMemberModal() {
const modal = document.getElementById("createMemberModal");
const memberName = document.getElementById("newMemberName");
memberName.value = '';
if (modal) modal.classList.add("hidden");
}




function deleteMember(id) {
const memberName = vault.members[id].encrypted_vault.name
const message = tWithVars("memberDeleteConfirm", { memberName: memberName });
showConfirmation(message, (confirmed) => {
  if (confirmed) {

    const member = vault.members?.[id];
    if (member && member.encrypted_vault?.team_keys) {
      Object.keys(member.encrypted_vault.team_keys).forEach(teamId => {
        delete member.encrypted_vault.team_keys[teamId];
      });
    }

    logAdminAction("member_deleted", { member_id: id, member_name: memberName });
    delete vault.members[id];

    updateMembersList();
    updateAssignmentsUI();
    updateAssignmentsByTeamUI();
    resetTimer();

    showModalAlert(`memberDeleted`, null, "success");
  }
});
}




function generateBase32Secret(byteLength = 20) { 
const randomBytes = window.crypto.getRandomValues(new Uint8Array(byteLength));
return bytesToBase32(randomBytes);
}

function bytesToBase32(bytes) {
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
let bits = 0, value = 0, output = '';
for (let i = 0; i < bytes.length; i++) {
  value = (value << 8) | bytes[i];
  bits += 8;
  while (bits >= 5) {
    output += alphabet[(value >>> (bits - 5)) & 31];
    bits -= 5;
  }
}
if (bits > 0) {
  output += alphabet[(value << (5 - bits)) & 31];
}
return output;
}



function showAssignMemberModal() {
const memberSelect = document.getElementById("selectMember");
const teamSelect = document.getElementById("selectTeam");

memberSelect.textContent = "";
teamSelect.textContent = "";


Object.entries(vault.members || {}).forEach(([id, member]) => {
const option = document.createElement("option");
option.value = id;
option.textContent = member.name;
memberSelect.appendChild(option);
});


Object.entries(vault.teams || {}).forEach(([id, team]) => {
const option = document.createElement("option");
option.value = id;
option.textContent = team.name;
teamSelect.appendChild(option);
});

document.getElementById("assignMemberModal").classList.remove("hidden");
resetTimer();
}

function hideAssignMemberModal() {
resetTimer();
document.getElementById("assignMemberModal").classList.add("hidden");
}



function assignMemberToTeam() {
const memberId = document.getElementById("selectMember").value;
const teamId = document.getElementById("selectTeam").value;

if (!memberId || !teamId) return showModalAlert("teamMmemberSelectReq", null, "warning");

const member = vault.members[memberId];
const team = vault.teams[teamId];

if (!member.team_keys) member.team_keys = {};

if (!member.team_keys[teamId]) {
  member.team_keys[teamId] = { data: "", pending: true };
}

if (!team.credentials) team.credentials = [];


hideAssignMemberModal();
updateAssignmentsUI();
updateMembersList();
}



function deleteAssignment(memberId, teamId) {
const member = vault.members?.[memberId];
if (!member || !member.team_keys?.[teamId]) return;


showConfirmation(`Remove ${member.name} from ${vault.teams?.[teamId]?.name || teamId}?`, (confirmed) => {
if (confirmed) {
  delete member.team_keys[teamId];
  updateAssignmentsUI();
  updateMembersList();
}
});

}


function updateAssignmentsUI() {
const list = document.getElementById("assignmentsList");
const search = assignmentFilter.toLowerCase();
list.textContent = "";

let hasAssignments = false;

Object.entries(vault.members || {}).forEach(([memberId, member]) => {
const encryptedMap = member.encrypted_vault.team_keys || {};
const assignedTeamIds = Object.keys(encryptedMap);

if (!assignedTeamIds.length) return;
if (search && !member.encrypted_vault.name.toLowerCase().includes(search)) return;

const div = document.createElement("div");
div.className = "member-card";

const nameEl = document.createElement("b");
nameEl.textContent = member.encrypted_vault.name;
div.appendChild(nameEl);
div.appendChild(document.createElement("br"));

assignedTeamIds.forEach(tid => {
  const teamName = vault.teams[tid]?.encrypted_team.name || "(Unknown)";

  const span = document.createElement("span");
  span.className = "team-chip";

  span.appendChild(document.createTextNode(teamName));

  const button = document.createElement("button");
  button.id = `removeMember-${memberId}-${tid}`;
  button.className = "icon-button";
  button.type = "button";

  const icon = document.createElement("i");
  icon.dataset.lucide = "square-arrow-out-up-right";
  icon.className = "icon-button-dark";

  button.appendChild(icon);
  span.appendChild(button);
  div.appendChild(span);
});


list.appendChild(div);
hasAssignments = true;
});

if (!hasAssignments) {
list.textContent = t("noAssignments");
}
resetTimer();
lucide.createIcons();
}


function updateAssignmentsByTeamUI() {
const list = document.getElementById("assignmentsList");
const search = assignmentFilter.toLowerCase();
list.textContent = "";

let hasAssignments = false;

Object.entries(vault.members || {}).forEach(([memberId, member]) => {
const encryptedMap = member.encrypted_vault.team_keys || {};
const assignedTeamIds = Object.keys(encryptedMap);

if (!assignedTeamIds.length) return;

const matchingTeams = assignedTeamIds.filter(tid => {
  const teamName = vault.teams[tid]?.encrypted_team.name.toLowerCase() || "";
  return teamName.includes(search);
});

if (!matchingTeams.length) return;

const div = document.createElement("div");
div.className = "member-card";

const nameEl = document.createElement("b");
nameEl.textContent = member.encrypted_vault.name;
div.appendChild(nameEl);
div.appendChild(document.createElement("br"));

matchingTeams.forEach(tid => {
  const teamName = vault.teams[tid]?.encrypted_team.name || "(Unknown)";

  const span = document.createElement("span");
  span.className = "team-chip";

  span.appendChild(document.createTextNode(teamName));

  const button = document.createElement("button");
  button.id = `removeMember-${memberId}-${tid}`;
  button.className = "icon-button";
  button.type = "button";

  const icon = document.createElement("i");
  icon.dataset.lucide = "square-arrow-out-up-right";
  icon.className = "icon-button-dark";

  button.appendChild(icon);
  span.appendChild(button);
  div.appendChild(span);
});

list.appendChild(div);
hasAssignments = true;
});

if (!hasAssignments) {
list.textContent = t("noMatchingAssignment");
}
resetTimer();
lucide.createIcons();
}


function removeMemberFromTeam(memberId, teamId) {
const member = vault.members[memberId];
if (!member) return;

const memberName = member.encrypted_vault.name;
const teamName = vault.teams[teamId].encrypted_team.name;

const message = tWithVars("removeMemberFromTeam", { member: memberName, teamName });

showConfirmation(message, (confirmed) => {
if (confirmed) {
  delete member.encrypted_vault.team_keys[teamId];
  logAdminAction("team_removed_from_member", { member_id: memberId, team_id: teamId });

  resetTimer();
  updateAssignmentsUI();
  updateAllUI();
}
});
}

function showAddCredentialModal() {
resetPasswordTextareaToggle(
  "credentialPassword",
  "credentialPasswordText",
  "createPasswordToggle"
);
syncPasswordTextareaToInput("credentialPassword", "credentialPasswordText");

const modal = document.getElementById("credentialModal");
const select = document.getElementById("credentialTeam");

select.textContent = "";

Object.values(vault.teams || {}).forEach(team => {
const option = document.createElement("option");
option.value = team.encrypted_team.id;
option.textContent = team.encrypted_team.name;
select.appendChild(option);
});

modal.classList.remove("hidden");
modal.classList.add("active");
resetTimer();
}


function hideCredentialModal() {
resetTimer();
const modal = document.getElementById("credentialModal");
modal.classList.remove("active");
modal.classList.add("hidden");

["credentialLabel", "credentialURL", "credentialUsername", "credentialPassword", "credentialNotes"]
.forEach(id => document.getElementById(id).value = '');
}



function addCredential() {
const teamId = document.getElementById("credentialTeam").value;
const label = document.getElementById("credentialLabel").value.trim();
const url = document.getElementById("credentialURL").value.trim();
const username = document.getElementById("credentialUsername").value.trim();
const password = document.getElementById("credentialPassword").value.trim();
const notes = document.getElementById("credentialNotes").value;

if (!teamId || !label) return showModalAlert("teamNameLabelReq", null, "warning");

const cred = { label, url, username, password, notes };
vault.teams[teamId].encrypted_team.credentials = vault.teams[teamId].encrypted_team.credentials || [];
vault.teams[teamId].encrypted_team.credentials.push(cred);

logAdminAction("credential_added_to_team", { team_id: teamId, credential_label: label });

resetTimer();
hideCredentialModal();
updateCredentialsList();
}


function deleteCredential(teamId, index) {
resetTimer();
const team = vault.teams[teamId];
const cred = team.encrypted_team.credentials[index].label;
if (!team || !team.encrypted_team.credentials || !team.encrypted_team.credentials[index]) return;

const message = tWithVars("credentialDeleteConfirm", { cred: cred });

showConfirmation(message, (confirmed) => {
  if (confirmed) {
    logAdminAction("credential_deleted_from_team", { team_id: teamId, credential_label: team.encrypted_team.credentials[index].label })
    team.encrypted_team.credentials.splice(index, 1);
    updateCredentialsList();
  }
});

}


function clearVaultConfirm() {
resetTimer();

const message = t("clearVaultConfirm");

showConfirmation(message, (confirmed) => {
  if (confirmed) {
    logoutAdmin();
  }
});
}


function clearVaultConfirmMember() {
resetTimer();

const message = t("clearVaultConfirmMember");

showConfirmation(message, (confirmed) => {
  if (confirmed) {
    logoutAdmin();
  }
});
}


async function checkVaultExistence() {
try {
const response = await fetch("/vault/team-vault.json", {
  method: "GET",
  credentials: "same-origin"
});

if (response.ok) {

  showScreen("adminVaultEditorPanel");
  resetTimer();
} else {
  throw new Error("Vault missing");
}
} catch (e) {
bootstrapNewVault();
}
}



function logoutAdmin() {

vault = {};
auditLogQueue.length = 0;

const fieldsToClear = [
"adminPasswordEditorInput",
"adminEditFileInputText",
"memberGappedFileInputText"
];
fieldsToClear.forEach(id => {
const el = document.getElementById(id);
if (el) el.value = '';
});

const elementsToClear = [
"teamsList",
"membersList",
"credentialsList",
"assignmentsList",
"vaultExpirationDisplay"
];
elementsToClear.forEach(id => {
const el = document.getElementById(id);
if (el) el.textContent = '';
});

const searchInputs = [
"teamSearchInput",
"memberSearchInput",
"credentialSearchInput",
"credentialSearchByTeam",
"assignmentSearchInput",
"assignmentSearchByTeam"
];
searchInputs.forEach(id => {
const el = document.getElementById(id);
if (el) el.value = '';
});

const qrOutput = document.getElementById("qrOutput");
if (qrOutput) qrOutput.textContent = "";

const expirySortBtn = document.getElementById("toggleExpirySort");
if (expirySortBtn) expirySortBtn.setAttribute("data-active", "false");

showScreen('memberUnlockPanel');
}



let teamPage = 1;
let memberPage = 1;
let assignmentPage = 1;
let credentialPage = 1;

let teamFilter = "";
let memberFilter = "";
let assignmentFilter = "";
let credentialFilter = "";



function normalizeAllExpiryDates(members) {
for (const [id, member] of Object.entries(members || {})) {
let raw = member.vault_metadata.expiry;

if (!raw) {

  member.vault_metadata.expiry = new Date().toISOString().split('T')[0];
  continue;
}

if (raw instanceof Date && !isNaN(raw.getTime())) {
  const yyyy = raw.getFullYear();
  const mm = String(raw.getMonth() + 1).padStart(2, '0');
  const dd = String(raw.getDate()).padStart(2, '0');
  member.vault_metadata.expiry = `${yyyy}-${mm}-${dd}`;
  continue;
}

const parsed = new Date(raw);
if (!isNaN(parsed.getTime())) {
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  member.vault_metadata.expiry = `${yyyy}-${mm}-${dd}`;
} else {
  member.vault_metadata.expiry = new Date().toISOString().split('T')[0];
}
}
}


function updateMembersListSortedByExpiry() {
const list = document.getElementById("membersList");
const search = memberFilter.toLowerCase();
list.textContent = "";

const now = new Date();

const sortedMembers = Object.entries(vault.members || {}).sort(([, a], [, b]) => {
return new Date(a.vault_metadata.expiry) - new Date(b.vault_metadata.expiry);
});

let hasMembers = false;

sortedMembers.forEach(([id, member]) => {
if (!member.encrypted_vault.name.toLowerCase().includes(search)) return;

const expiryDate = new Date(member.vault_metadata.expiry);
const diffDays = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

let glowClass = '';
if (diffDays < 0) glowClass = 'expiry-overdue';
else if (diffDays <= 30) glowClass = 'expiry-soon';
else glowClass = 'expiry-ok';

const div = document.createElement("div");
div.className = "member-card compact-item";

const nameEl = document.createElement("b");
nameEl.textContent = member.encrypted_vault.name;
div.appendChild(nameEl);
div.appendChild(document.createTextNode(" "));

if (member.vault_metadata.pending) {
  const pendingSpan = document.createElement("span");
  pendingSpan.className = "pending pending-label";
  pendingSpan.dataset.i18n = "pending";
  pendingSpan.textContent = "(Pending)";
  div.appendChild(pendingSpan);
}

const inputGroup = document.createElement("div");
inputGroup.className = "input-group input-group-indented";

const toggles = document.createElement("div");
toggles.className = "toggles";

const toggleContainer1 = document.createElement("div");
toggleContainer1.className = "toggle-container";

if (member.vault_metadata.pending) {
  const finaliseBtn = document.createElement("button");
  finaliseBtn.id = `finaliseMemberButton-${id}`;
  finaliseBtn.type = "button";
  finaliseBtn.className = "btn primary btn-margin-auto";
  finaliseBtn.dataset.i18n = "finalizeButton";
  const finaliseIcon = document.createElement("i");
  finaliseIcon.dataset.lucide = "shield-check";
  const finaliseSpan = document.createElement("span");
  finaliseSpan.dataset.i18n = "finalizeButton";
  finaliseSpan.textContent = " Finalize";
  finaliseBtn.appendChild(finaliseIcon);
  finaliseBtn.appendChild(finaliseSpan);
  toggleContainer1.appendChild(finaliseBtn);
}

if (!member.vault_metadata.pending) {
  const assignBtn = document.createElement("button");
  assignBtn.id = `assignmentButton-${id}`;
  assignBtn.type = "button";
  assignBtn.className = "btn outline btn-margin-auto";
  const assignIcon = document.createElement("i");
  assignIcon.dataset.lucide = "share-2";
  const assignSpan = document.createElement("span");
  assignSpan.dataset.i18n = "assignButton";
  assignSpan.textContent = " Assign";
  assignBtn.appendChild(assignIcon);
  assignBtn.appendChild(assignSpan);
  toggleContainer1.appendChild(assignBtn);
}

const toggleContainer2 = document.createElement("div");
toggleContainer2.className = "toggle-container";

const deleteBtn = document.createElement("button");
deleteBtn.id = `deleteMemberFromList-${id}`;
deleteBtn.type = "button";
deleteBtn.className = "btn outline-secondary btn-margin-auto";
const deleteIcon = document.createElement("i");
deleteIcon.dataset.lucide = "user-x";
deleteBtn.appendChild(deleteIcon);
toggleContainer2.appendChild(deleteBtn);

toggles.appendChild(toggleContainer1);
toggles.appendChild(toggleContainer2);
inputGroup.appendChild(toggles);
div.appendChild(inputGroup);

const togglesRow = document.createElement("div");
togglesRow.className = "toggles toggles-indented";

const totpContainer = document.createElement("div");
totpContainer.className = "toggle-container";
const totpLabel = document.createElement("label");
totpLabel.htmlFor = `totptoggle-${id}`;
totpLabel.dataset.i18n = "secondFactor";
totpLabel.textContent = "Admin";
const totpInput = document.createElement("input");
totpInput.id = `totptoggle-${id}`;
totpInput.type = "checkbox";
totpInput.className = "toggle";
totpInput.checked = member.vault_metadata.is_admin === true;
totpContainer.appendChild(totpLabel);
totpContainer.appendChild(totpInput);

const expiryContainer = document.createElement("div");
expiryContainer.className = "toggle-container";
const expiryLabel = document.createElement("label");
expiryLabel.htmlFor = `dateChangeInput-${id}`;
expiryLabel.className = "label-indent";
expiryLabel.dataset.i18n = "accessExpiry";
expiryLabel.textContent = "Access Expiry";
const expiryInput = document.createElement("input");
expiryInput.id = `dateChangeInput-${id}`;
expiryInput.type = "date";
expiryInput.value = member.vault_metadata.expiry;
expiryInput.className = `date-input ${glowClass}`;
expiryContainer.appendChild(expiryLabel);
expiryContainer.appendChild(expiryInput);

togglesRow.appendChild(totpContainer);
togglesRow.appendChild(expiryContainer);
div.appendChild(togglesRow);

list.appendChild(div);
hasMembers = true;
translateDynamicElement(div);
});

if (!hasMembers) {

list.textContent = t("noMembers");
}
resetTimer();
lucide.createIcons();
}


function updateMembersList() {
const list = document.getElementById("membersList");
const search = memberFilter.toLowerCase();
list.textContent = "";

let hasMembers = false;

const sortedMembers = Object.entries(vault.members || {}).sort(([, a], [, b]) =>
a.encrypted_vault.name.localeCompare(b.encrypted_vault.name)
);

sortedMembers.forEach(([id, member]) => {
if (!member.encrypted_vault.name.toLowerCase().includes(search)) return;

const totpChecked = member.vault_metadata.is_admin === true ? "checked" : "";
const expiryValue = member.vault_metadata.expiry;

const div = document.createElement("div");
div.className = "member-card compact-item";

const nameEl = document.createElement("b");
nameEl.textContent = member.encrypted_vault.name;
div.appendChild(nameEl);
div.appendChild(document.createTextNode(" "));

if (member.vault_metadata.pending) {
  const pendingSpan = document.createElement("span");
  pendingSpan.className = "pending pending-label";
  pendingSpan.dataset.i18n = "pending";
  pendingSpan.textContent = "(Pending)";
  div.appendChild(pendingSpan);
}

const inputGroup = document.createElement("div");
inputGroup.className = "input-group input-group-indented";

const toggles = document.createElement("div");
toggles.className = "toggles";

const toggleContainer1 = document.createElement("div");
toggleContainer1.className = "toggle-container";

if (member.vault_metadata.pending) {
  const finaliseBtn = document.createElement("button");
  finaliseBtn.id = `finaliseMemberButton-${id}`;
  finaliseBtn.type = "button";
  finaliseBtn.className = "btn primary btn-margin-auto";
  const finaliseIcon = document.createElement("i");
  finaliseIcon.dataset.lucide = "shield-check";
  const finaliseSpan = document.createElement("span");
  finaliseSpan.dataset.i18n = "finalizeButton";
  finaliseSpan.textContent = " Finalize";
  finaliseBtn.appendChild(finaliseIcon);
  finaliseBtn.appendChild(finaliseSpan);
  toggleContainer1.appendChild(finaliseBtn);
}

if (!member.vault_metadata.pending) {
  const assignBtn = document.createElement("button");
  assignBtn.id = `assignmentButton-${id}`;
  assignBtn.type = "button";
  assignBtn.className = "btn outline btn-margin-auto";
  const assignIcon = document.createElement("i");
  assignIcon.dataset.lucide = "share-2";
  const assignSpan = document.createElement("span");
  assignSpan.dataset.i18n = "assignButton";
  assignSpan.textContent = " Assign";
  assignBtn.appendChild(assignIcon);
  assignBtn.appendChild(assignSpan);
  toggleContainer1.appendChild(assignBtn);
}

const toggleContainer2 = document.createElement("div");
toggleContainer2.className = "toggle-container";

const deleteBtn = document.createElement("button");
deleteBtn.id = `deleteMemberFromList-${id}`;
deleteBtn.type = "button";
deleteBtn.className = "btn outline-secondary btn-margin-auto";
const deleteIcon = document.createElement("i");
deleteIcon.dataset.lucide = "user-x";
deleteBtn.appendChild(deleteIcon);
toggleContainer2.appendChild(deleteBtn);

toggles.appendChild(toggleContainer1);
toggles.appendChild(toggleContainer2);
inputGroup.appendChild(toggles);
div.appendChild(inputGroup);

const togglesRow = document.createElement("div");
togglesRow.className = "toggles toggles-indented";

const totpContainer = document.createElement("div");
totpContainer.className = "toggle-container";
const totpLabel = document.createElement("label");
totpLabel.htmlFor = `totptoggle-${id}`;
totpLabel.dataset.i18n = "secondFactor";
totpLabel.textContent = "Admin";
const totpInput = document.createElement("input");
totpInput.id = `totptoggle-${id}`;
totpInput.type = "checkbox";
totpInput.className = "toggle";
totpInput.checked = totpChecked === "checked";
totpContainer.appendChild(totpLabel);
totpContainer.appendChild(totpInput);

const expiryContainer = document.createElement("div");
expiryContainer.className = "toggle-container";
const expiryLabel = document.createElement("label");
expiryLabel.htmlFor = `dateChangeInput-${id}`;
expiryLabel.className = "label-indent";
expiryLabel.dataset.i18n = "accessExpiry";
expiryLabel.textContent = "Access Expiry";
const expiryInput = document.createElement("input");
expiryInput.id = `dateChangeInput-${id}`;
expiryInput.type = "date";
expiryInput.value = expiryValue;
expiryInput.className = "date-input";
expiryContainer.appendChild(expiryLabel);
expiryContainer.appendChild(expiryInput);

togglesRow.appendChild(totpContainer);
togglesRow.appendChild(expiryContainer);
div.appendChild(togglesRow);

list.appendChild(div);
hasMembers = true;
translateDynamicElement(div);
});

if (!hasMembers) {
list.textContent = t("noMembers");
}
resetTimer();
lucide.createIcons();
}


function toggleTOTPRequirement(memberId, isChecked) {
resetTimer();
if (vault.members[memberId]) {
  vault.members[memberId].vault_metadata.is_admin = isChecked === true;
  logAdminAction("member_status_changed", {
    member_id: vault.members[memberId].encrypted_vault.id,
    is_member_admin: vault.members[memberId].vault_metadata.is_admin
  });
}
}


function updateMemberExpiry(memberId, newDate) {
resetTimer();
if (vault.members[memberId]) {
vault.members[memberId].vault_metadata.expiry = newDate;
logAdminAction("member_access_expiry_changed", { member_id: memberId, new_expiry_date: newDate });
}
}



function onSearchMembers() {
memberFilter = document.getElementById("memberSearchInput").value.trim();
memberPage = 1; 
resetTimer();
updateMembersList();
}


function updateTeamsList() {
const list = document.getElementById("teamsList");
const search = teamFilter.toLowerCase();
list.textContent = "";

let hasTeams = false;

Object.entries(vault.teams || {}).forEach(([id, team]) => {
if (!team.name.toLowerCase().includes(search)) return;
const div = document.createElement("div");
div.className = "team-card compact-item";

const nameEl = document.createElement("b");
nameEl.textContent = team.name;

const deleteBtn = document.createElement("button");
deleteBtn.type = 'button';
const icon = document.createElement("i");
icon.dataset.lucide = "trash-2";
deleteBtn.appendChild(icon);
deleteBtn.addEventListener("click", () => deleteTeam(id));

div.appendChild(nameEl);
div.appendChild(deleteBtn);

list.appendChild(div);
hasTeams = true;
});
if (!hasTeams) {
list.textContent =t("noTeams");
}
resetTimer();
lucide.createIcons();
}


function onSearchTeams() {
teamFilter = document.getElementById("teamSearchInput").value.trim();
teamPage = 1;
resetTimer();
updateTeamList();
}


function onSearchAssignments() {
assignmentFilter = document.getElementById("assignmentSearchInput").value.trim();
assignmentPage = 1;
resetTimer();
updateAssignmentsUI();
}

function onSearchAssignmentsByTeamUI() {
assignmentFilter = document.getElementById("assignmentSearchByTeam").value.trim();
assignmentPage = 1;
resetTimer();
updateAssignmentsByTeamUI();
}

function setupPasswordTextareaToggle({
  inputId,
  textareaId,
  toggleId
}) {
  const input = document.getElementById(inputId);
  const textarea = document.getElementById(textareaId);
  const toggle = document.getElementById(toggleId);

  if (!input || !textarea || !toggle) return;

  let visible = false;

  function setToggleText(isVisible) {
    if (typeof t === "function") {
      toggle.textContent = isVisible ? t("hideButton") : t("showButton");
    } else {
      toggle.textContent = isVisible ? "Hide" : "Show";
    }
  }

  function showTextarea() {
    textarea.value = input.value;

    input.classList.add("hidden");
    textarea.classList.remove("hidden");

    visible = true;
    setToggleText(true);

    textarea.focus();
  }

  function showPasswordInput() {
    input.value = textarea.value;

    textarea.classList.add("hidden");
    input.classList.remove("hidden");

    visible = false;
    setToggleText(false);

    input.focus();
  }

  toggle.addEventListener("click", () => {
    if (visible) {
      showPasswordInput();
    } else {
      showTextarea();
    }
  });

  input.addEventListener("input", () => {
    if (!visible) {
      textarea.value = input.value;
    }
  });

  textarea.addEventListener("input", () => {
    if (visible) {
      input.value = textarea.value;
    }
  });
}


function updateCredentialsList() {
const list = document.getElementById("credentialsList");
const search = credentialFilter.toLowerCase();
list.textContent = "";

const allCredentials = [];

Object.entries(vault.teams || {}).forEach(([teamId, team]) => {
(team.encrypted_team.credentials || []).forEach((cred, index) => {
  allCredentials.push({
    id: `${teamId}:${index}`,
    teamId,
    index,
    ...cred
  });
});
});

const filtered = allCredentials.filter(c =>
(c.label || '').toLowerCase().includes(search) ||
(c.url || '').toLowerCase().includes(search)
);

filtered.forEach(cred => {
const div = document.createElement("div");
div.className = "credential-card scroll-item";

const inputGroup = document.createElement("div");
inputGroup.className = "input-group";

const toggles = document.createElement("div");
toggles.className = "toggles";

const infoDiv = document.createElement("div");

const labelEl = document.createElement("b");
labelEl.textContent = cred.label;
infoDiv.appendChild(labelEl);
infoDiv.appendChild(document.createElement("br"));

const urlEl = document.createElement("small");
urlEl.textContent = `${t("urlLabel")}: ${cred.url || t("noneValue")}`;
infoDiv.appendChild(urlEl);
infoDiv.appendChild(document.createElement("br"));

const teamEl = document.createElement("span");
const teamName = vault.teams[cred.teamId]?.encrypted_team.name || cred.teamId;
teamEl.textContent = `${t("teamLabel")}: ${teamName}`;
infoDiv.appendChild(teamEl);

const btnGroup = document.createElement("div");
btnGroup.className = "input-group btn-group-auto";

const editBtn = document.createElement("button");
editBtn.type = "button";
editBtn.className = "btn outline-gold edit-credential-btn";
editBtn.dataset.teamId = cred.teamId;
editBtn.dataset.index = cred.index;
const editIcon = document.createElement("i");
editIcon.dataset.lucide = "file-pen-line";
editBtn.appendChild(editIcon);

const deleteBtn = document.createElement("button");
deleteBtn.type = "button";
deleteBtn.className = "btn outline-secondary delete-credential-btn btn-delete-cred";
deleteBtn.dataset.teamId = cred.teamId;
deleteBtn.dataset.index = cred.index;
const deleteIcon = document.createElement("i");
deleteIcon.dataset.lucide = "x";
deleteBtn.appendChild(deleteIcon);

btnGroup.appendChild(editBtn);
btnGroup.appendChild(deleteBtn);

toggles.appendChild(infoDiv);
toggles.appendChild(btnGroup);
inputGroup.appendChild(toggles);
div.appendChild(inputGroup);

list.appendChild(div);

});
if (filtered.length === 0) {
list.textContent = t("credNotFound");
}
resetTimer();
lucide.createIcons();
}

function updateCredentialsByTeam() {
const list = document.getElementById("credentialsList");
const search = credentialFilter.toLowerCase();
list.textContent = "";

const allCredentials = [];

Object.entries(vault.teams || {}).forEach(([teamId, team]) => {
(team.encrypted_team.credentials || []).forEach((cred, index) => {
  allCredentials.push({
    id: `${teamId}:${index}`,
    teamId,
    index,
    ...cred
  });
});
});

const filtered = allCredentials.filter(c =>
(vault.teams[c.teamId]?.encrypted_team.name || '').toLowerCase().includes(search)
);

filtered.forEach(cred => {
const div = document.createElement("div");
div.className = "credential-card scroll-item";

const inputGroup = document.createElement("div");
inputGroup.className = "input-group";

const toggles = document.createElement("div");
toggles.className = "toggles";

const infoDiv = document.createElement("div");

const labelEl = document.createElement("b");
labelEl.textContent = cred.label;
infoDiv.appendChild(labelEl);
infoDiv.appendChild(document.createElement("br"));

const urlEl = document.createElement("small");
urlEl.textContent = `${t("urlLabel")}: ${cred.url || t("noneValue")}`;
infoDiv.appendChild(urlEl);
infoDiv.appendChild(document.createElement("br"));

const teamEl = document.createElement("span");
const teamName = vault.teams[cred.teamId]?.encrypted_team.name || cred.teamId;
teamEl.textContent = `${t("teamLabel")}: ${teamName}`;
infoDiv.appendChild(teamEl);

const btnGroup = document.createElement("div");
btnGroup.className = "input-group btn-group-auto";

const editBtn = document.createElement("button");
editBtn.type = "button";
editBtn.className = "btn outline-gold edit-credential-btn";
editBtn.dataset.teamId = cred.teamId;
editBtn.dataset.index = cred.index;
const editIcon = document.createElement("i");
editIcon.dataset.lucide = "file-pen-line";
editBtn.appendChild(editIcon);

const deleteBtn = document.createElement("button");
deleteBtn.type = "button";
deleteBtn.className = "btn outline-secondary delete-credential-btn btn-delete-cred";
deleteBtn.dataset.teamId = cred.teamId;
deleteBtn.dataset.index = cred.index;
const deleteIcon = document.createElement("i");
deleteIcon.dataset.lucide = "x";
deleteBtn.appendChild(deleteIcon);

btnGroup.appendChild(editBtn);
btnGroup.appendChild(deleteBtn);

toggles.appendChild(infoDiv);
toggles.appendChild(btnGroup);
inputGroup.appendChild(toggles);
div.appendChild(inputGroup);

list.appendChild(div);
});


if (filtered.length === 0) {
list.textContent = t("noCredFound");
}
resetTimer();
lucide.createIcons();
}



function onSearchCredentials() {
credentialFilter = document.getElementById("credentialSearchInput").value.trim();
credentialPage = 1;
resetTimer();
updateCredentialsList();
}

function onSearchCredentialsByTeam() {
credentialFilter = document.getElementById("credentialSearchByTeam").value.trim();
credentialPage = 1;
resetTimer();
updateCredentialsByTeam();
}



function getTeamDisplayName(teamId, team) {
  return (
    team?.encrypted_team?.team_name ||
    team?.encrypted_team?.name ||
    team?.name ||
    team?.team_name ||
    teamId
  );
}

function populateCredentialTargetTeamSelect(selectedTeamId) {
  const select = document.getElementById("editCredentialTargetTeam");
  if (!select) return;

  select.innerHTML = "";

  Object.entries(vault.teams || {}).forEach(([teamId, team]) => {
    const option = document.createElement("option");
    option.value = teamId;
    option.textContent = getTeamDisplayName(teamId, team);

    if (teamId === selectedTeamId) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}



function updateCredentialActionOptions(originalTeamId) {
  const targetTeamSelect = document.getElementById("editCredentialTargetTeam");
  const actionSelect = document.getElementById("editCredentialAction");

  if (!targetTeamSelect || !actionSelect) return;

  const targetTeamId = targetTeamSelect.value;
  const isSameTeam = targetTeamId === originalTeamId;

  actionSelect.innerHTML = "";

  if (isSameTeam) {
    const saveOption = document.createElement("option");
    saveOption.value = "edit";
    saveOption.textContent = t?.("editCredActionSave") || "Save changes";
    actionSelect.appendChild(saveOption);
  } else {
    const moveOption = document.createElement("option");
    moveOption.value = "move";
    moveOption.textContent = t?.("editCredActionMove") || "Move to selected team";
    actionSelect.appendChild(moveOption);

    const copyOption = document.createElement("option");
    copyOption.value = "copy";
    copyOption.textContent = t?.("editCredActionCopy") || "Copy to selected team";
    actionSelect.appendChild(copyOption);
  }
}



function showEditCredentialModal(teamId, index) {
  const team = vault.teams?.[teamId];

  if (!team?.encrypted_team?.credentials?.[index]) {
    return showModalAlert("credNotFound", null, "error");
  }

  populateCredentialTargetTeamSelect(teamId);
  updateCredentialActionOptions(teamId);

  const targetTeamSelect = document.getElementById("editCredentialTargetTeam");
  if (targetTeamSelect) {
    targetTeamSelect.onchange = () => {
      updateCredentialActionOptions(teamId);
    };
  }

  const cred = team.encrypted_team.credentials[index];

  document.getElementById("editCredentialLabel").value = cred.label || "";
  document.getElementById("editCredentialURL").value = cred.url || "";
  document.getElementById("editCredentialUsername").value = cred.username || "";
  document.getElementById("editCredentialPassword").value = cred.password || "";
  document.getElementById("editCredentialPasswordText").value = cred.password || "";
  document.getElementById("editCredentialNotes").value = cred.notes || "";

  const saveBtn = document.getElementById("saveEditCredential");
  const cancelBtn = document.getElementById("cancelEditCredential");

  saveBtn.onclick = () => saveCredentialChanges(teamId, index);
  cancelBtn.onclick = hideEditCredentialModal;

  document.getElementById("editCredentialModal").classList.remove("hidden");
  resetTimer();
}



function saveCredentialChanges(teamId, index) {
  syncPasswordTextareaToInput?.(
    "editCredentialPassword",
    "editCredentialPasswordText"
  );

  const label = document.getElementById("editCredentialLabel").value.trim();
  const username = document.getElementById("editCredentialUsername").value.trim();
  const password = document.getElementById("editCredentialPassword").value.trim();
  const url = document.getElementById("editCredentialURL").value.trim();
  const notes = document.getElementById("editCredentialNotes").value.trim();

  const targetTeamId =
    document.getElementById("editCredentialTargetTeam")?.value || teamId;

  const action =
    document.getElementById("editCredentialAction")?.value || "edit";

  if (!label || !username || !password) {
    showModalAlert("credFieldsReq", null, "warning");
    return;
  }

  const sourceTeam = vault.teams?.[teamId];
  const targetTeam = vault.teams?.[targetTeamId];

  if (!sourceTeam?.encrypted_team?.credentials?.[index]) {
    return showModalAlert("credNotFound", null, "error");
  }

  if (!targetTeam?.encrypted_team?.credentials) {
    return showModalAlert("teamNotFound", null, "error");
  }

  const originalCredential = sourceTeam.encrypted_team.credentials[index];

  const updatedCredential = {
    ...originalCredential,
    label,
    url,
    username,
    password,
    notes
  };

  if (action === "edit") {
    sourceTeam.encrypted_team.credentials[index] = updatedCredential;

    logAdminAction("credential_edited_in_team", {
      team_id: teamId,
      credential_label: updatedCredential.label
    });
  }

  else if (action === "move") {
    if (targetTeamId === teamId) {
      sourceTeam.encrypted_team.credentials[index] = updatedCredential;

      logAdminAction("credential_edited_in_team", {
        team_id: teamId,
        credential_label: updatedCredential.label
      });
    } else {
      sourceTeam.encrypted_team.credentials.splice(index, 1);
      targetTeam.encrypted_team.credentials.push(updatedCredential);

      logAdminAction("credential_moved_between_teams", {
        from_team_id: teamId,
        to_team_id: targetTeamId,
        credential_label: updatedCredential.label
      });
    }
  }

  else if (action === "copy") {
    const copiedCredential = {
      ...updatedCredential,
      copied_from_team_id: teamId,
      copied_at: new Date().toISOString()
    };

    targetTeam.encrypted_team.credentials.push(copiedCredential);

    logAdminAction("credential_copied_to_team", {
      from_team_id: teamId,
      to_team_id: targetTeamId,
      credential_label: copiedCredential.label
    });
  }

  if (action === "edit" && targetTeamId !== teamId) {
    return showModalAlert("invalidCredentialAction", null, "warning");
  }

  resetTimer();
  hideEditCredentialModal();
  updateCredentialsList();
}



function hideEditCredentialModal() {
document.getElementById("editCredentialModal").classList.add("hidden");
document.getElementById("editCredentialLabel").value = "";
document.getElementById("editCredentialUsername").value = "";
document.getElementById("editCredentialPassword").value = "";
document.getElementById("editCredentialURL").value = "";
document.getElementById("editCredentialNotes").value = "";
document.getElementById("editCredentialTargetTeam").textContent = "";
document.getElementById("editCredentialAction").value = "edit";
resetTimer();
}


function generateQRCodeForMember(memberName, accessSettings, totpSecret) {
const qrPlace = document.getElementById("hiddenQr");
qrPlace.classList.remove("nodisplay");

const qrOutput = document.getElementById("qrOutput");
const heading = document.createElement("h3");
heading.textContent = memberName + "'s QR Code";
qrOutput.replaceChildren(heading);
const label = encodeURIComponent(`${accessSettings}`);
const issuer = encodeURIComponent("CarryPass Team");
const otpUrl = `otpauth://totp/${issuer}:${label}?secret=${totpSecret}&issuer=${issuer}`;

const tempContainer = document.createElement("div");
tempContainer.className = "nodisplay";
document.body.appendChild(tempContainer);

const qr = new QRCode(tempContainer, {
text: otpUrl,
width: 220,
height: 220,
correctLevel: QRCode.CorrectLevel.M,
});

setTimeout(() => {
const img = tempContainer.querySelector("img");

if (!img) {
  console.error("❌ QR code image not rendered.");
  document.body.removeChild(tempContainer);
  return;
}

const qrCanvas = document.createElement("canvas");
const qrImg = new Image();
qrImg.src = img.src;

qrImg.onload = () => {
  const border = 16;
  const size = qrImg.width + border * 2;

  qrCanvas.width = size;
  qrCanvas.height = size;

  const ctx = qrCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  ctx.drawImage(qrImg, border, border);

  qrOutput.appendChild(qrCanvas);

  document.body.removeChild(tempContainer);
};
}, 200);
}



function scrollSectionIntoView(sectionId) {
const section = document.getElementById(sectionId);
if (section) {
section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
}



function securelyEraseMemory() {
appMaster = null;
sessionKey = null;
screenLockBaseKey = null;
passwordKey = null;
totpSecretKey = null;
vaultCanaryKey = null;
sessionTOTPSecret = null;
sessionMemberId = null;
vault = {};
generatedPasswords = [];
}




const TEAM_VAULT_VERSION = "carrypass-team-vault-v4";



function stableStringify(value) {
if (value === null || typeof value !== 'object') {
  return JSON.stringify(value);
}
if (Array.isArray(value)) {
  return '[' + value.map(stableStringify).join(',') + ']';
}
const keys = Object.keys(value).sort();
return '{' + keys.map(k =>
  JSON.stringify(k) + ':' + stableStringify(value[k])
).join(',') + '}';
}


async function deriveTeamVaultKey(password, salt, roleTag, extractable = false) {
const enc = new TextEncoder();
const argonSalt = new Uint8Array([
  ...enc.encode(`${TEAM_VAULT_VERSION}::${roleTag}::`),
  ...new Uint8Array(salt)
]);

const result = await argon2.hash({
  pass: password,
  salt: argonSalt,
  ...ARGON_VAULT_OPTIONS_V4,
  hashLen: 32,
  raw: true
});

return crypto.subtle.importKey(
  'raw', result.hash,
  { name: 'AES-GCM' },
  extractable,
  ['encrypt', 'decrypt']
);
}


async function importRawAesGcmKey(rawKeyBytes) {
return crypto.subtle.importKey(
  'raw', rawKeyBytes,
  { name: 'AES-GCM' },
  false,
  ['encrypt', 'decrypt']
);
}


async function encryptWithAAD(key, plaintext, nonce, metadata) {
const enc = new TextEncoder();
const ciphertext = await crypto.subtle.encrypt(
  {
    name: 'AES-GCM',
    iv: nonce,
    additionalData: enc.encode(stableStringify(metadata))
  },
  key,
  enc.encode(plaintext)
);
return arrayBufferToBase64(ciphertext);
}


async function generateFreshTeamKey() {
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);
const raw = await crypto.subtle.exportKey('raw', key);
return arrayBufferToBase64(raw);
}


function createExportId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}


async function handleCompleteVaultExport() {

const expiry = document.getElementById("vaultExpiry").value;

const spinner6 = document.getElementById("spinner6");
spinner6.classList.remove("invisible");

await new Promise(resolve => setTimeout(resolve, 10));

try {
  const finalizedAdmins = Object.entries(vault.members).filter(
    ([_, m]) => m.vault_metadata.is_admin === true && !m.vault_metadata.pending
  );

  if (finalizedAdmins.length === 0) {
    spinner6.classList.add("invisible");
    showModalAlert("exportRequiresAdmin", null, "warning");
    return;
  }
  if (finalizedAdmins.length > 1) {
    spinner6.classList.add("invisible");
    showModalAlert("exportTooManyAdmins", null, "error");
    return;
  }

  const [adminMemberId] = finalizedAdmins[0];

  const newTeamKeys = {};
  for (const teamId of Object.keys(vault.teams)) {
    newTeamKeys[teamId] = await generateFreshTeamKey();
  }

  const teams = {};
  const rotatedTeamRecords = {};

  for (const [teamId, team] of Object.entries(vault.teams)) {
    const newKeyBase64 = newTeamKeys[teamId];

    const rotatedTeam = {
      ...team,
      encrypted_team: {
        ...team.encrypted_team,
        password_derived_key: newKeyBase64
      }
    };
    rotatedTeamRecords[teamId] = rotatedTeam;

    const teamNonce = crypto.getRandomValues(new Uint8Array(12));
    const teamKey = await importRawAesGcmKey(base64ToArrayBuffer(newKeyBase64));

    const teamMetadata = {
      version: TEAM_VAULT_VERSION,
      teamId,
      nonce: arrayBufferToBase64(teamNonce)
    };

    const teamCiphertext = await encryptWithAAD(
      teamKey,
      JSON.stringify(rotatedTeam.encrypted_team),
      teamNonce,
      teamMetadata
    );

    teams[teamId] = {
      data: teamCiphertext,
      metadata: teamMetadata
    };
  }

  const members = {};
  const rotatedMemberRecords = {};

  for (const [memberId, member] of Object.entries(vault.members)) {
    const isPending = !member.encrypted_vault?.password_derived_key;

    const oldTeamKeys = member.encrypted_vault?.team_keys || {};
    const rotatedTeamKeysMap = {};

    for (const teamId of Object.keys(oldTeamKeys)) {
      if (newTeamKeys[teamId]) {
        rotatedTeamKeysMap[teamId] = newTeamKeys[teamId];
      }
    }

    const finalTeamKeysMap = isPending ? {} : rotatedTeamKeysMap;

    const rotatedMember = {
      ...member,
      encrypted_vault: {
        ...member.encrypted_vault,
        team_keys: finalTeamKeysMap
      }
    };

    rotatedMemberRecords[memberId] = rotatedMember;
  }

  for (const [memberId, rotatedMember] of Object.entries(rotatedMemberRecords)) {
    const isPending = !rotatedMember.encrypted_vault?.password_derived_key;
    const isAdmin = rotatedMember.vault_metadata.is_admin === true;

    if (isPending) continue;

    const memberPlaintext = {
      ...rotatedMember.encrypted_vault,
      admin_data: isAdmin
        ? {
            members: rotatedMemberRecords,
            teams: rotatedTeamRecords
          }
        : null
    };

    const memberNonce = crypto.getRandomValues(new Uint8Array(12));

    const memberKey = await importRawAesGcmKey(
      base64ToArrayBuffer(rotatedMember.encrypted_vault.password_derived_key)
    );

    const memberMetadata = {
      version: TEAM_VAULT_VERSION,
      memberId,
      is_admin: isAdmin,
      expiry: rotatedMember.vault_metadata?.expiry || "",
      pending: false,
      salt: rotatedMember.vault_metadata?.salt || "",
      nonce: arrayBufferToBase64(memberNonce)
    };

    const memberCiphertext = await encryptWithAAD(
      memberKey,
      JSON.stringify(memberPlaintext),
      memberNonce,
      memberMetadata
    );

    members[memberId] = {
      data: memberCiphertext,
      metadata: memberMetadata
    };
  }

  const vaultFile = {
    version: TEAM_VAULT_VERSION,
    vault_metadata: {
      version: TEAM_VAULT_VERSION,
      expiry: expiry || "",
      exported_at: new Date().toISOString(),
      exported_by: adminMemberId,
      export_id: createExportId()
    },
    members,
    teams
  };

  const blob = new Blob(
    [JSON.stringify(vaultFile, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "team-vault.json";
  link.click();
  URL.revokeObjectURL(url);

  for (const [teamId, rotatedTeam] of Object.entries(rotatedTeamRecords)) {
    vault.teams[teamId] = rotatedTeam;
  }
  for (const [memberId, rotatedMember] of Object.entries(rotatedMemberRecords)) {
    vault.members[memberId] = rotatedMember;
  }

  spinner6.classList.add("invisible");
  resetTimer();
  showModalAlert("vaultExportSuccess", null, "success");

} catch (err) {
  console.error("Vault export failed:", err);
  spinner6.classList.add("invisible");
  showModalAlert("vaultExportError", null, "error");
} finally {
  spinner6.classList.add("invisible");
}
}


async function decryptWithAAD(key, ciphertextB64, nonce, metadata) {
const enc = new TextEncoder();
const plaintext = await crypto.subtle.decrypt(
  {
    name: 'AES-GCM',
    iv: nonce,
    additionalData: enc.encode(stableStringify(metadata))
  },
  key,
  base64ToArrayBuffer(ciphertextB64)
);
return new TextDecoder().decode(plaintext);
}


async function fetchVaultFile() {
let response;
try {
  response = await fetch("/vault/team-vault.json", { method: "GET" });
  if (!response.ok) throw new Error("Fetch failed");
  const vaultJson = await response.clone().json();
  
  const source = response.headers.get("x-cache-source") === "cache" 
    ? "cache" 
    : "network";
  
  return { vaultJson, response, source };
} catch {
  const cache = await caches.open("carrypass-configs-v4");
  const cachedResponse = await cache.match("/vault/team-vault.json");
  if (!cachedResponse) {
    throw new Error("noVaultFileFound");
  }
  const vaultJson = await cachedResponse.clone().json();
  return { vaultJson, response: cachedResponse, source: "cache" };
}
}


function updateVaultSourceLabel(labelId, response, source) {
const sourceLabel = document.getElementById(labelId);
if (!sourceLabel) return;

sourceLabel.textContent = t("vaultLoadedFrom", { source });
sourceLabel.classList.remove("source-label-cache", "source-label-fresh", "source-label-file");

if (source === "cache") {
  sourceLabel.classList.add("source-label-cache");
  const cachedAt = response?.headers?.get("x-cached-at");
  if (cachedAt && cachedAt !== "unknown") {
    sourceLabel.textContent += ` (cached at: ${formatDateTime(cachedAt)})`;
  }
} else if (source === "file") {
  sourceLabel.classList.add("source-label-file");
} else {
  sourceLabel.classList.add("source-label-fresh");
}
}

async function importAdminVaultFromJson(vaultJson, source, response) {
if (isViewerRateLimited()) {
  showModalAlert("rateLimitExceeded", null, "info");
  return;
}
recordViewerAttempt();

const memberId = sessionMemberId;
const adminPassword = document.getElementById('adminPasswordEditorInput').value;
document.getElementById('adminPasswordEditorInput').value = "";

if (!adminPassword) {
  showModalAlert("adminPasswordNeeded", null, "warning");
  return;
}

if (!sessionTOTPSecret) {
  showModalAlert("noTotpSecretLoaded", null, "warning");
  return;
}

if (vaultJson.version !== TEAM_VAULT_VERSION) {
  showModalAlert("vaultVersionMismatch", null, "error");
  return;
}

const memberBlock = vaultJson.members?.[memberId];
if (!memberBlock) {
  showModalAlert("memberNotFound", null, "warning");
  return;
}

const { data, metadata } = memberBlock;
if (!metadata) {
  showModalAlert("vaultDecryptionFailed", null, "error");
  return;
}


if (metadata.is_admin !== true) {
  document.getElementById("memberPassword").value = adminPassword;
  document.getElementById('adminPasswordEditorInput').value = "";
  return await importMemberVaultFromJson(vaultJson, source, response);
}


const spinner8 = document.getElementById("spinner8");
spinner8.classList.remove("invisible");

await new Promise(resolve => setTimeout(resolve, 10));

const combined = adminPassword + "::" + sessionTOTPSecret;
const memberSalt = base64ToArrayBuffer(metadata.salt);
const memberKey = await deriveTeamVaultKey(combined, memberSalt, "member");

let decryptedJson;
try {
  decryptedJson = await decryptWithAAD(
    memberKey,
    data,
    base64ToArrayBuffer(metadata.nonce),
    metadata
  );
} catch {
  spinner8.classList.add("invisible");
  showModalAlert("vaultDecryptionFailed", null, "error");
  return;
}

if (metadata.memberId !== memberId) {
  spinner8.classList.add("invisible");
  showModalAlert("vaultDecryptionFailed", null, "error");
  return;
}

const decrypted = JSON.parse(decryptedJson);

if (!decrypted.admin_data) {
  spinner8.classList.add("invisible");
  showModalAlert("vaultDecryptionFailed", null, "error");
  return;
}

const { members, teams } = decrypted.admin_data;
if (!members || !teams) {
  spinner8.classList.add("invisible");
  showModalAlert("vaultDecryptionFailed", null, "error");
  return;
}

normalizeAllExpiryDates(members);

vault.members = members;
vault.teams = teams;
vault.adminMemberId = memberId;
vault.adminUsername = members[memberId]?.encrypted_vault?.name || "";
vault.vault_metadata = vaultJson.vault_metadata || { 
  version: TEAM_VAULT_VERSION, 
  expiry: "" 
};


if (source) {
  updateVaultSourceLabel("vaultSourceLabelAdmin", response, source);
}

spinner8.classList.add("invisible");
resetTimer();
updateAllUI();
lastVaultScreen = "adminPanel";
showScreen("adminPanel");

if (vaultExpiry && new Date() > new Date(vaultExpiry)) {
  showModalAlert("vaultGloballyExpiredReminder", null, "warning");
}
}



async function importMemberVaultFromJson(vaultJson, source, response) {
if (isViewerRateLimited()) {
  showModalAlert("rateLimitExceeded", null, "info");
  return;
}
recordViewerAttempt();

const memberId = sessionMemberId;
const memberPassword = document.getElementById("memberPassword").value;

const fieldsToClear = [
  "adminPasswordEditorInput",
  "memberPassword"
];
fieldsToClear.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.value = '';
});

if (vaultJson.version !== TEAM_VAULT_VERSION) {
  showModalAlert("vaultVersionMismatch", null, "error");
  return;
}

const memberBlock = vaultJson.members?.[memberId];
if (!memberBlock) {
  showModalAlert("memberNotFound", null, "error");
  return;
}

const { data, metadata } = memberBlock;
if (!metadata) {
  showModalAlert("vaultDecryptionFailed", null, "error");
  return;
}

if (!sessionTOTPSecret) {
  showModalAlert("noTotpSecretLoaded", null, "error");
  return;
}

if (metadata.expiry && new Date() > new Date(metadata.expiry)) {
  showModalAlert("memberVaultExpired", null, "error");
  return;
}

const spinner7 = document.getElementById("spinner7");
spinner7.classList.remove("invisible");

await new Promise(resolve => setTimeout(resolve, 10));

const combined = memberPassword + "::" + sessionTOTPSecret;

const memberSalt = base64ToArrayBuffer(metadata.salt);
const memberKey = await deriveTeamVaultKey(combined, memberSalt, "member");

let decryptedJson;
try {
  decryptedJson = await decryptWithAAD(
    memberKey,
    data,
    base64ToArrayBuffer(metadata.nonce),
    metadata
  );
} catch {
  spinner7.classList.add("invisible");
  showModalAlert("vaultDecryptionFailed", null, "error");
  return;
}

if (metadata.memberId !== memberId) {
  spinner7.classList.add("invisible");
  showModalAlert("vaultDecryptionFailed", null, "error");
  return;
}

const decryptedVault = JSON.parse(decryptedJson);
decryptedVault.team_data = {};

const teamKeys = decryptedVault.encrypted_vault?.team_keys
              || decryptedVault.team_keys
              || {};

if (Object.keys(teamKeys).length === 0) {
  showModalAlert("unlockNoTeams", null, "info");
  if (source) updateVaultSourceLabel("vaultSourceLabel", response, source);
  document.getElementById("memberPassword").value = "";
  spinner7.classList.add("invisible");
  renderMemberVault(decryptedVault);
  lastVaultScreen = "memberPanel";
  showScreen("memberPanel");
  return decryptedVault;
}

for (const [teamId, teamKeyEntry] of Object.entries(teamKeys)) {
  try {
    const teamBlock = vaultJson.teams?.[teamId];
    if (!teamBlock) continue;

    const { data: teamData, metadata: teamMetadata } = teamBlock;
    if (!teamMetadata) continue;

    if (teamMetadata.version !== TEAM_VAULT_VERSION) continue;
    if (teamMetadata.teamId !== teamId) continue;

    const keyBase64 = typeof teamKeyEntry === 'string'
      ? teamKeyEntry
      : teamKeyEntry?.data;
    if (!keyBase64) continue;

    const teamKey = await importRawAesGcmKey(base64ToArrayBuffer(keyBase64));

    const teamDecryptedJson = await decryptWithAAD(
      teamKey,
      teamData,
      base64ToArrayBuffer(teamMetadata.nonce),
      teamMetadata
    );

    decryptedVault.team_data[teamId] = JSON.parse(teamDecryptedJson);
    resetTimer();

  } catch (teamErr) {
    spinner7.classList.add("invisible");
    console.warn(`Failed to decrypt team ${teamId}:`, teamErr);
    continue;
  }
}

if (source) {
  updateVaultSourceLabel("vaultSourceLabel", response, source);
}

document.getElementById("memberPassword").value = "";
spinner7.classList.add("invisible");
renderMemberVault(decryptedVault);
lastVaultScreen = "memberPanel";
showScreen("memberPanel");
return decryptedVault;
}



async function handleCompleteAdminVaultImport() {
try {
  let vaultJson, response, source;
  try {
    ({ vaultJson, response, source } = await fetchVaultFile());
  } catch (err) {
    if (err.message === "noVaultFileFound") {
      showModalAlert("noVaultFileFound", null, "info");
      return;
    }
    throw err;
  }
  await importAdminVaultFromJson(vaultJson, source, response);
} catch (err) {
  document.getElementById('adminPasswordEditorInput').value = "";
  console.error("Unexpected error during vault import:", err);
  showModalAlert("vaultImportError", null, "error");
}
}

async function handleCompleteAdminVaultImportFromFile(vaultJson) {
try {
  await importAdminVaultFromJson(vaultJson, "file", null);
} catch (err) {
  document.getElementById('adminPasswordEditorInput').value = "";
  console.error("Unexpected error during vault import:", err);
  showModalAlert("vaultImportError", null, "error");
}
}

async function handleMemberVaultImport() {
try {
  let vaultJson, response, source;
  try {
    ({ vaultJson, response, source } = await fetchVaultFile());
  } catch (err) {
    if (err.message === "noVaultFileFound") {
      showModalAlert("noVaultFileFound", null, "info");
      return;
    }
    throw err;
  }
  return await importMemberVaultFromJson(vaultJson, source, response);
} catch (err) {
  document.getElementById("memberPassword").value = "";
  console.error("Unexpected error in member import:", err);
  showModalAlert("vaultImportError", null, "error");
}
}

async function handleMemberVaultImportFromFile(vaultJson) {
try {
  return await importMemberVaultFromJson(vaultJson, "file", null);
} catch (err) {
  document.getElementById("memberPassword").value = "";
  console.error("Unexpected error in member import:", err);
  showModalAlert("vaultImportError", null, "error");
}
}



function formatDateTime(isoString) {
const d = new Date(isoString);
return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}


document.addEventListener('DOMContentLoaded', () => {
document.getElementById("adminEditFileInputText")
.addEventListener("change", (e) => handleVaultFileUpload(e, "admin"));


document.getElementById("memberGappedFileInputText")
.addEventListener("change", (e) => handleVaultFileUpload(e, "member"));
});

document.addEventListener('DOMContentLoaded', () => {
const hasPasscode = !!localStorage.getItem('vaultCanary');
showScreen(hasPasscode ? 'loginView' : 'registrationView');

document.getElementById("submitPassCode").addEventListener("click", () => handlePasscodeSubmit("login"));
document.getElementById("submitPassCodeRegister").addEventListener("click", () => handlePasscodeSubmit("register"));
document.getElementById("submitPinUnlock").addEventListener("click", unlockWithPIN);
});



const inputField = document.getElementById('passCodeInputRegister');

inputField.addEventListener('input', (e) => {
const pass = e.target.value;
const bits = conservativeEntropyEstimate(pass);
updateEntropyUI(bits);
});

inputField.addEventListener('paste', (e) => {
setTimeout(() => {
const pass = inputField.value;
const bits = conservativeEntropyEstimate(pass);
updateEntropyUI(bits);
}, 0); 
});



function indicateSuccess() {
const btn = document.getElementById("saveLocallyBtn");
btn.classList.add("glow-success");

setTimeout(() => {
btn.classList.remove("glow-success");
}, 1500);
}


document.addEventListener('DOMContentLoaded', () => {
document.getElementById('passCodeInputRegisterShow')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('passCodeInputShow')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('masterPass')?.addEventListener('click', e => showMasterPassword(e.currentTarget));
document.getElementById('iterCount')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('sixthButton')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('mainButton')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('firstButton')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('secondButton')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('thirdButton')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('fourthButton')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('fifthButton')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('editPasswordToggle')?.addEventListener('click', e => {showManyPassword(e.currentTarget);});
document.getElementById('createPasswordToggle')?.addEventListener('click', e => {showManyPassword(e.currentTarget);});
document.getElementById('memberPasswordToggle')?.addEventListener('click', e => {showManyPassword(e.currentTarget);});
document.getElementById('memberFinalizePasswordToggle')?.addEventListener('click', e => {showManyPassword(e.currentTarget);});
document.getElementById('adminPasswordEditorInputToggle')?.addEventListener('click', e => {showManyPassword(e.currentTarget);});
document.getElementById('exportImportShow')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('pwdAnButton')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('iterCountCustomSettings')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('setPinInputBtn')?.addEventListener('click', e => showManyPassword(e.currentTarget));

document.getElementById('clearGeneratedPasswordCard')?.addEventListener('click', e => clearPasswordCard(e.currentTarget));
document.getElementById('collectInput')?.addEventListener('click', e => collectInputData(e.currentTarget));

document.getElementById('onAdminEntryCheck')?.addEventListener('click', onAdminEntry);
document.getElementById('memberUnlockScreen')?.addEventListener('click', () => showScreen('memberUnlockPanel'));

document.getElementById('logoutAdminEditDesktop')?.addEventListener('click', clearVaultConfirm);
document.getElementById('logoutAdminEditMobile')?.addEventListener('click', clearVaultConfirm); 
document.getElementById('logoutMemberFromVault')?.addEventListener('click', clearVaultConfirmMember);

document.getElementById('teamSearchInput')?.addEventListener('input', () => onSearchTeams());
document.getElementById('createTeamModal')?.addEventListener('click', showCreateTeamModal);
document.getElementById('createTeamUnit')?.addEventListener('click', createTeam);
document.getElementById('hideCreateTeamUnit')?.addEventListener('click', hideCreateTeamModal);

document.addEventListener('click', (e) => {
const btn = e.target.closest('[id^="deleteTeamButton-"]');
if (btn) {
  const id = btn.id.replace('deleteTeamButton-', '');
  deleteTeam(id);
}
});

document.addEventListener('click', (e) => {
const btn = e.target.closest('[id^="deleteMemberFromList-"]');
if (btn) {
  const id = btn.id.replace('deleteMemberFromList-', '');
  deleteMember(id);
}
});

document.addEventListener('click', (e) => {
const btn = e.target.closest('[id^="assignmentButton-"]');
if (btn) {
  const id = btn.id.replace('assignmentButton-', '');
  openAssignMemberToTeamModal(id);
}
});

document.addEventListener('click', (e) => {

const btn = e.target.closest('[id^="finaliseMemberButton-"]');
if (btn) {
  const id = btn.id.replace('finaliseMemberButton-', '');
  openMemberFinalizeModal(id);
}
});


document.addEventListener('click', (e) => {
const editBtn = e.target.closest('.edit-credential-btn');
if (editBtn) {
  const teamId = editBtn.dataset.teamId;
  const index = parseInt(editBtn.dataset.index, 10);
  showEditCredentialModal(teamId, index);
  return;
}

const deleteBtn = e.target.closest('.delete-credential-btn');
if (deleteBtn) {
  const teamId = deleteBtn.dataset.teamId;
  const index = parseInt(deleteBtn.dataset.index, 10);
  deleteCredential(teamId, index);
}
});

document.addEventListener('click', (e) => {
const button = e.target.closest('[id^="credBlockShow__"]');
if (button) {
  showManyPassword(button);
}
});


document.addEventListener('click', (e) => {

const btn = e.target.closest('.open-url-button');
if (!btn) return;

const url = btn.getAttribute('data-url');
if (url && url.startsWith('https://')) {
  window.open(url, '_blank', 'noopener,noreferrer');
} else {

  showModalAlert("notClickable", null, "info");
}
});



document.addEventListener("change", (e) => {
const toggle = e.target.closest('.toggle');
if (toggle && toggle.id.startsWith('totptoggle-')) {
  const id = toggle.id.replace('totptoggle-', '');
  toggleTOTPRequirement(id, toggle.checked);
}
});

document.addEventListener("change", (e) => {
const input = e.target.closest('[id^="dateChangeInput-"]');
if (input) {
  const id = input.id.replace('dateChangeInput-', '');
  updateMemberExpiry(id, input.value);
}
});

document.addEventListener('click', (e) => {
const btn = e.target.closest('[id^="removeMember-"]');
if (btn) {
  const [memberId, tid] = btn.id.replace("removeMember-", "").split("-");
  removeMemberFromTeam(memberId, tid);
}
});


document.getElementById('toggleExpirySort').addEventListener('click', (e) => {
const button = e.currentTarget;
const isActive = button.getAttribute('data-active') === 'true';

if (isActive) {
button.setAttribute('data-active', 'false');
button.classList.remove('active');
updateMembersList();
} else {
button.setAttribute('data-active', 'true');
button.classList.add('active');
updateMembersListSortedByExpiry();
}
});



document.addEventListener('click', (e) => {
const btn = e.target.closest('[data-password-id]');
if (btn) {
copyPasswordCheck(btn);
}
});


document.getElementById('memberVaultImportButton')?.addEventListener('click', handleMemberVaultImport);

document.getElementById('startQrScan')?.addEventListener('click', startQrScan);

document.getElementById('stopScanButton')?.addEventListener('click', stopQrScan);

document.getElementById('handleCompleteAdminVault')?.addEventListener('click', handleCompleteAdminVaultImport);
document.getElementById('adminToMemberUnlock')?.addEventListener('click', () => showScreen('memberUnlockPanel'));


document.getElementById('credentialSearchInput')?.addEventListener('input', () => onSearchCredentials());
document.getElementById('credentialSearchByTeam')?.addEventListener('input', () => onSearchCredentialsByTeam());

document.getElementById('addCredentialButton')?.addEventListener('click', showAddCredentialModal);
document.getElementById('addCredentialByModal')?.addEventListener('click', addCredential);
document.getElementById('hideCredentialAddModal')?.addEventListener('click', hideCredentialModal);

document.getElementById('memberSearchInput')?.addEventListener('input', () => onSearchMembers());
document.getElementById('createMemberShow')?.addEventListener('click', showCreateMemberModal);
document.getElementById('realCreateMember')?.addEventListener('click', createMember);
document.getElementById('realCreateMemberHide')?.addEventListener('click', hideCreateMemberModal);

document.getElementById('assignmentSearchInput')?.addEventListener('input', () => onSearchAssignments());
document.getElementById('assignmentSearchByTeam')?.addEventListener('input', () => onSearchAssignmentsByTeamUI());
document.getElementById('removeTeamMemberAssignment')?.addEventListener('click', () => removeMemberFromTeam('{{ member.id }}', '{{ this.id }}'));

document.getElementById('cancelAssignButton')?.addEventListener('click', closeAssignMemberModal);
document.getElementById('assignMemberButton')?.addEventListener('click', confirmAssignMemberToTeam);

document.getElementById('closeMemberFinalizeButton')?.addEventListener('click', closeMemberFinalizeModal);
document.getElementById('memberFinalizeButton')?.addEventListener('click', finalizeMember);

document.getElementById('adminExportsVault')?.addEventListener('click', handleCompleteVaultExport);

document.getElementById('deleteQrOutput')?.addEventListener('click', deleteQrCode);

document.getElementById('adminPasswordGenerator1')?.addEventListener('click', openAdminPasswordModal);
document.getElementById('adminPasswordGenerator2')?.addEventListener('click', openAdminPasswordModal);
document.getElementById('closeAdminPasswordGenerator')?.addEventListener('click', closeAdminPasswordModal);

document.getElementById('exportAuditLogFile')?.addEventListener('click', exportAuditLogFile);

document.getElementById('trustAnotherDeviceButton')?.addEventListener('click', closeQRModal);

document.getElementById("password").addEventListener("input", (e) => {
updateSingleFeedbackIcon(e.target.value);
});

document.getElementById("passwordAdmin").addEventListener("input", (e) => {
updateSingleFeedbackIconAdmin(e.target.value);
});


document.getElementById('password').addEventListener('keydown', function(event) {
if (event.key === 'Enter') {
  event.preventDefault(); 
  collectInputData();
}
});

document.getElementById('passwordAdmin').addEventListener('keydown', function(event) {
if (event.key === 'Enter') {
  event.preventDefault(); 
  collectInputDataAdmin();
}
});

document.getElementById('passCodeInputRegister').addEventListener('keydown', function(event) {
if (event.key === 'Enter') {
  event.preventDefault(); 
  handlePasscodeSubmit("register");
}
});

document.getElementById('passCodeInput').addEventListener('keydown', function(event) {
if (event.key === 'Enter') {
  event.preventDefault(); 
  handlePasscodeSubmit("login");
}
});

document.getElementById("reverseIconRoundRegister")?.addEventListener("click", () => {
  if (adaptiveMode !== "register") return;
  reverseCurrentAdaptiveRound();
});

document.getElementById("reverseIconRound")?.addEventListener("click", () => {
  if (adaptiveMode !== "login") return;
  reverseCurrentAdaptiveRound();
});

document.getElementById("restartIconAttemptRegister")?.addEventListener("click", async () => {
  if (adaptiveMode !== "register") return;
  await restartAdaptiveAttempt();
});

document.getElementById("restartIconAttempt")?.addEventListener("click", async () => {
  if (adaptiveMode !== "login") return;
  await restartAdaptiveAttempt();
});

document.getElementById('memberPassword').addEventListener('keydown', function(event) {
if (event.key === 'Enter') {
  event.preventDefault(); 
  handleMemberVaultImport();
}
});


document.getElementById("passwordUp").addEventListener("click", () => cyclePassword(false));
document.getElementById("passwordDown").addEventListener("click", () => cyclePassword(true));

document.getElementById("saveLocallyBtn").addEventListener("click", async () => {
const serviceName = document.getElementById("serviceLabel").textContent.trim();
const variant = parseInt(document.getElementById("counter").value, 10);
const passwordIndexText = document.getElementById("passwordIndexLabel").textContent;
const passwordIndex = parseInt(passwordIndexText.match(/\((\d+)\//)?.[1], 10) - 1;
const passwordType = document.getElementById("profileSelector").value;

const identifierInput = document.getElementById("identifierInput");
const identifier = cleanIdentifier(identifierInput?.value);

if (!serviceName || isNaN(variant) || isNaN(passwordIndex)) {
  showModalAlert("missingValues", null, "warning");
  return;
}

if (!identity) {
  showModalAlert("noIdentity", null, "error");
  return;
}

if (!isIdentityOn) {
  showModalAlert("notIdentityGenerated", null, "error");
  return;
}

updateServiceSettings(serviceName, {
  variant,
  passwordIndex,
  passwordType,
  identifier,
  updatedAt: Date.now()
});

await saveServiceSettingsBlobs();
buildSavedServicesList();
indicateSuccess();
});



document.getElementById("saveCustomProfileBtn").addEventListener("click", () => {
const label = document.getElementById("customProfileName").value.trim();
if (!label) {
  showModalAlert("noCustomName", null, "error");
  return;
}

const id = generateSafeId(label);
const settings = collectCustomProfileFromAdminUI();

if (
  !settings.uppercase &&
  !settings.lowercase &&
  !settings.numbers &&
  !settings.symbols
) {
  showModalAlert("atLeastOneCharType", null, "warning"); 
  return;
}

const profile = {
  label,
  ...settings,
  updatedAt: Date.now()
};

saveCustomProfile(id, profile);

document.getElementById("customProfileName").value = "";
document.getElementById('customPasswordSettingsModal').classList.add('hidden');
});


document.getElementById("profileSelector").addEventListener("change", () => {
const selected = profileSelector.value;
const all = JSON.parse(localStorage.getItem("carrypass_customTypes") || "{}");
const profile = all[selected];

if (profile) {
document.getElementById("length").value = profile.length;
document.getElementById("iterationCount").value = profile.iterationCount;
document.getElementById("toggle1").checked = profile.uppercase;
document.getElementById("toggle2").checked = profile.lowercase;
document.getElementById("toggle3").checked = profile.numbers;
document.getElementById("toggle4").checked = profile.symbols;
document.getElementById("toggle5").checked = profile.separator;
}

const counterEl = document.getElementById('counter');
if (selected.startsWith('diceware')) {
counterEl.value = 6;
} else {
counterEl.value = 0;
}
});


const slideMenu = document.getElementById('slideMenu');
const menuButton = document.getElementById('menuToggle');
const closeButton = document.getElementById('closeSlideMenu');

function openSlideMenu() {
  slideMenu.classList.add('open');
  menuButton.setAttribute('aria-expanded', 'true');
}

function closeSlideMenu() {
  slideMenu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}

menuButton.addEventListener('click', (e) => {
  e.stopPropagation();
  openSlideMenu();
});

closeButton.addEventListener('click', (e) => {
  e.stopPropagation();
  closeSlideMenu();
});

slideMenu.addEventListener('click', (e) => {
  e.stopPropagation();
});

document.addEventListener('click', () => {
  closeSlideMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSlideMenu();
  }
});



document.getElementById('menuCreateCustomType').addEventListener('click', () => {
resetTimer();
slideMenu.classList.remove('open'); 
openCustomPasswordModal();     
});

document.getElementById('closePasswordCustomSettings').addEventListener('click', () => {
customPasswordModal.classList.add('hidden');
});


document.getElementById("menuLockNow").addEventListener("click", async () => {
  const menu = document.getElementById("slideMenu");
  const backdrop = document.querySelector(".slide-menu-backdrop");

  async function doLock() {
    const pin = await loadDecryptedPIN();

    if (!pin) {
      switchOff();
      return;
    }

    await lockAppWithPIN(pin);
  }

  function closeMenu() {
    return new Promise((resolve) => {
      if (!menu || !menu.classList.contains("open")) {
        resolve();
        return;
      }

      let done = false;

      const finish = () => {
        if (done) return;
        done = true;

        menu.removeEventListener("transitionend", onTransitionEnd);
        resolve();
      };

      const onTransitionEnd = (e) => {
        if (e.target !== menu) return;
        if (e.propertyName !== "transform") return;
        finish();
      };

      menu.addEventListener("transitionend", onTransitionEnd);

      menu.classList.remove("open");

      if (backdrop) {
        backdrop.classList.add("hidden");
      }

      setTimeout(finish, 260);
    });
  }

  await closeMenu();
  await doLock();
});


document.getElementById("menuSetPin").addEventListener("click", () => {
slideMenu.classList.remove('open');
document.getElementById("pinSettingsModal").classList.remove("hidden");
document.getElementById("setPinInput").value = "";
document.getElementById("setPinInput").focus();
});


document.getElementById("closePinModal").addEventListener("click", () => {
document.getElementById("pinSettingsModal").classList.add("hidden");
});


document.getElementById("menuExport").addEventListener("click", async () => {
slideMenu.classList.remove('open');
resetTimer();
try {
  const encryptedServices = localStorage.getItem("serviceMapEncrypted");
  const encryptedProfiles = localStorage.getItem("carrypass_customTypesEnc");
  const encryptedTOTP = localStorage.getItem("encryptedQR");
  const encryptedLabel = localStorage.getItem("encryptedLabel");

  if (!encryptedServices && !encryptedProfiles && !encryptedTOTP && !encryptedLabel) {
    showModalAlert("noData", null, "warning");
    return;
  }

  const exportBlob = {
    type: "carrypass-export-v4",
    timestamp: Date.now(),
    services: encryptedServices ? JSON.parse(encryptedServices) : null,
    profiles: encryptedProfiles ? JSON.parse(encryptedProfiles) : null,
    totp: encryptedTOTP ? JSON.parse(encryptedTOTP) : null,
    label: encryptedLabel ? JSON.parse(encryptedLabel) : null
  };

  const blob = new Blob([JSON.stringify(exportBlob, null, 2)], {
    type: "application/json"
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `carrypass-export-${timestamp}.cpex`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} catch (err) {
  console.error("Export failed:", err);
  showModalAlert("failedExport", null, "error");
}
});

document.getElementById("menuImport").addEventListener("click", async () => {
slideMenu.classList.remove('open');
const input = document.createElement("input");
input.type = "file";
input.accept = ".cpex";

input.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const contents = await file.text();
    const parsed = JSON.parse(contents);

    if (!parsed || parsed.type !== "carrypass-export-v4") {
      return showModalAlert("corruptFile", null, "error");
    }

    async function decryptAesObject(encObj, key) {
      const iv = new Uint8Array(encObj.iv || encObj.nonce);
      const cipher = new Uint8Array(encObj.cipher || encObj.ciphertext);

      const decrypted = await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv
      }, key, cipher);

      return JSON.parse(new TextDecoder().decode(decrypted));
    }

    const importedCustomProfiles = parsed.profiles
      ? await decryptAesObject(parsed.profiles, sessionKey)
      : {};

    const importedServiceMap = parsed.services
      ? await decryptAesObject(parsed.services, sessionKey)
      : {};

    const importedServiceList = Object.keys(importedServiceMap);

    const currentProfilesRaw = localStorage.getItem("carrypass_customTypesEnc");
    let currentProfiles = {};
    if (currentProfilesRaw) {
      try {
        currentProfiles = await decryptWithSessionKey(currentProfilesRaw);
      } catch (e) {
        console.warn("Could not decrypt existing custom profiles:", e);
      }
    }

    for (const [id, newProfile] of Object.entries(importedCustomProfiles)) {
      const existing = currentProfiles[id];
      if (!existing || newProfile.updatedAt > (existing.updatedAt || 0)) {
        currentProfiles[id] = newProfile;
      }
    }

    const encryptedProfiles = await encryptWithSessionKey(currentProfiles);
    localStorage.setItem("carrypass_customTypesEnc", encryptedProfiles);
    loadCustomProfilesIntoSelector();

    for (const service of importedServiceList) {
      const existing = cachedServiceMap[service];
      const incoming = importedServiceMap[service];

      if (!existing || incoming.updatedAt > (existing.updatedAt || 0)) {
        cachedServiceMap[service] = incoming;
        if (!cachedServiceList.includes(service)) {
          cachedServiceList.push(service);
        }
      }
    }

    settingsDirty = true;
    await saveServiceSettingsBlobs();
    buildSavedServicesList();

    let trustedDeviceImported = false;

    if (parsed.totp) {
      const existingTOTP = localStorage.getItem("encryptedQR");
      if (existingTOTP && existingTOTP !== JSON.stringify(parsed.totp)) {
        const proceed = await confirmModal("overwriteTrustedDeviceState");
        if (!proceed) {
        } else {
          localStorage.setItem("encryptedQR", JSON.stringify(parsed.totp));
          await decryptStoredTOTPSecret();
          trustedDeviceImported = true;
        }
      } else {
        localStorage.setItem("encryptedQR", JSON.stringify(parsed.totp));
        await decryptStoredTOTPSecret();
        trustedDeviceImported = true;
      }
    }

    if (parsed.label) {
      localStorage.setItem("encryptedLabel", JSON.stringify(parsed.label));
      await decryptStoredLabel();
      trustedDeviceImported = true;
    }

    if (trustedDeviceImported) {
      updateTrustedDeviceIndicator();
    }

    showModalAlert("importSuccess", null, "success");
    resetTimer();
  } catch (err) {
    console.error("Import failed:", err);
    showModalAlert("failedImport", null, "error");
  }
};

input.click();
});



["click", "mousemove", "keydown", "touchstart"].forEach(event => {
window.addEventListener(event, refreshLockTimer);
});


function showPasswordPreviewModal() {
const password = document.getElementById("passwordPreview")?.value;
if (!password) {
showModalAlert("noPassword", null, "warning");
return;
}

document.getElementById("passwordModalText").value = password;
document.getElementById("passwordModal").classList.remove("hidden");

if (passwordModalTimeout) clearTimeout(passwordModalTimeout);

passwordModalTimeout = setTimeout(() => {
document.getElementById("passwordModal").classList.add("hidden");
}, 30000);
}

document.getElementById("viewFullPasswordBtn").addEventListener("click", showPasswordPreviewModal);

function hidePasswordPreviewModal() {
document.getElementById("passwordModal")?.classList.add("hidden");

if (passwordModalTimeout) {
clearTimeout(passwordModalTimeout);
passwordModalTimeout = null;
}
}


document.getElementById("closePasswordModal").addEventListener("click", hidePasswordPreviewModal);

}); 



function replaceLucideIcon(container, iconName, extraClass = "") {
  if (!container) return;

  const oldIcon = container.querySelector("svg, i[data-lucide]");
  if (oldIcon) {
    oldIcon.remove();
  }

  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", iconName);

  if (extraClass) {
    icon.className = extraClass;
  }

  container.prepend(icon);

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}


const HAZE_MODES = ["dark", "privacy", "none"];

function getHazeLabelKey(mode) {
  if (mode === "dark") return "hazeDark";
  if (mode === "privacy") return "hazePrivacy";
  return "hazeNone";
}

function getHazeIcon(mode) {
  if (mode === "dark") return "eye-off";
  if (mode === "privacy") return "scan-eye";
  lucide.createIcons();
  return "eye";
}


function applyHazeMode(overlay, button, mode) {
  if (!overlay) return;

  overlay.classList.remove(
    "haze-mode-dark",
    "haze-mode-privacy",
    "haze-mode-none"
  );

  overlay.classList.add(`haze-mode-${mode}`);

  const container = overlay.closest(".emoji-grid-container");

  if (container) {
    container.classList.remove(
      "haze-active-dark",
      "haze-active-privacy",
      "haze-active-none"
    );

    container.classList.add(`haze-active-${mode}`);
  }

  if (button) {
    const iconWrap = button.querySelector(".haze-icon-wrap");
    const textSpan = button.querySelector("[data-i18n]");

    if (iconWrap) {
      replaceLucideIcon(iconWrap, getHazeIcon(mode));
    }

    const labelKey = getHazeLabelKey(mode);

    if (textSpan) {
      textSpan.dataset.i18n = labelKey;
      textSpan.textContent = typeof t === "function" ? t(labelKey) : labelKey;
    }
  }
}



function setupHazeModeToggle({
  overlayId,
  buttonId,
  storageKey,
  defaultMode = "privacy"
}) {
  const overlay = document.getElementById(overlayId);
  const button = document.getElementById(buttonId);

  if (!overlay || !button) return;

  let currentMode = localStorage.getItem(storageKey) || defaultMode;

  if (!HAZE_MODES.includes(currentMode)) {
    currentMode = defaultMode;
  }

  applyHazeMode(overlay, button, currentMode);

  button.addEventListener("click", () => {
    const currentIndex = HAZE_MODES.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % HAZE_MODES.length;

    currentMode = HAZE_MODES[nextIndex];

    localStorage.setItem(storageKey, currentMode);
    applyHazeMode(overlay, button, currentMode);
  });
  lucide.createIcons();
}


document.addEventListener("DOMContentLoaded", () => {
  setupHazeModeToggle({
    overlayId: "gridHazeOverlay",
    buttonId: "hazeModeButton",
    storageKey: "carrypass_haze_mode_login",
    defaultMode: "privacy"
  });

  setupHazeModeToggle({
    overlayId: "gridHazeOverlayRegister",
    buttonId: "hazeModeButtonRegister",
    storageKey: "carrypass_haze_mode_register",
    defaultMode: "privacy"
  });
});


const customPasswordModal = document.getElementById('customPasswordSettingsModal');

function openCustomPasswordModal() {
customPasswordModal.classList.remove('hidden');

}



function updateAdminEditFileName() {
const fileInput = document.getElementById("adminEditFileInput");
const fileNameField = document.getElementById("adminEditFileInputText");
const fileName = fileInput.files[0] ? fileInput.files[0].name : "Choose file";
fileNameField.value = fileName;
}

const adminEditFileButton = document.getElementById("adminEditFileButton");
const adminEditFileInput = document.getElementById("adminEditFileInput");

if (adminEditFileButton && adminEditFileInput) {
adminEditFileButton.addEventListener("click", () => {
adminEditFileInput.click();
});
}

if (adminEditFileInput) {
adminEditFileInput.addEventListener("change", (event) => {
updateAdminEditFileName();

const file = event.target.files[0];
if (!file) return;

const reader = new FileReader();
reader.onload = async function (e) {
  try {
    const vaultJson = JSON.parse(e.target.result);
    await handleCompleteAdminVaultImportFromFile(vaultJson);
  } catch (err) {
    console.error("❌ Error importing admin vault:", err);
    showModalAlert("vaultImportFailed", null, "error");
  } finally {
    adminEditFileInput.value = ""; 
  }
};
reader.readAsText(file);
});

}


function updateMemberGappedFileName() {
const fileInput = document.getElementById("memberGappedFileInput");
const fileNameField = document.getElementById("memberGappedFileInputText");
const fileName = fileInput.files[0] ? fileInput.files[0].name : "Choose file";
fileNameField.value = fileName;
}

const memberGappedFileButton = document.getElementById("memberGappedFileButton");
const memberGappedFileInput = document.getElementById("memberGappedFileInput");

if (memberGappedFileButton && memberGappedFileInput) {
memberGappedFileButton.addEventListener("click", () => {
memberGappedFileInput.click();
});
}

if (memberGappedFileInput) {
memberGappedFileInput.addEventListener("change", (event) => {
updateMemberGappedFileName();

const file = event.target.files[0];
if (!file) return;

const reader = new FileReader();
reader.onload = async function (e) {
  try {
    const vaultJson = JSON.parse(e.target.result);
    await handleMemberVaultImportFromFile(vaultJson);
  } catch (err) {
    console.error("❌ Error importing member vault:", err);
    showModalAlert("vaultImportFailed", null, "error");
  } finally {
    memberGappedFileInput.value = ""; 
  }
};
reader.readAsText(file);
});
}


const ENTROPY_THRESHOLDS = {
low: 80,
good: 100
};

function calculateEntropyMaster(password) {
if (!password || typeof password !== 'string') return 0;
try {
return zxcvbn(password).guesses_log10 * Math.log2(10);
} catch (err) {
console.error("Entropy calculation error:", err);
return 0;
}
}


function updatePasswordStrengthMember(password) {
const bar = document.getElementById("passwordStrengthBarMember");
const label = document.getElementById("passwordStrengthTextMember");
const entropyLabel = document.getElementById("entropyTextMember");

if (!password) {
label.innerText = '';
label.className = '';
entropyLabel.innerText = '';
bar.className = '';
return;
}

const entropy = calculateEntropyMaster(password);
let strength = 'low';

if (entropy >= ENTROPY_THRESHOLDS.good) {
strength = 'excellent';
} else if (entropy >= ENTROPY_THRESHOLDS.low) {
strength = 'good';
}

bar.className = '';
bar.classList.add(strength);

label.innerText = strength.charAt(0).toUpperCase() + strength.slice(1);
label.className = `strength-${strength}`;
entropyLabel.innerText = `Entropy: ${entropy.toFixed(2)} (${strength})`;
}


document.getElementById("password")?.addEventListener("input", (e) => {
updatePasswordStrengthUI(
"passwordStrengthBarMaster",
"passwordStrengthTextMaster",
"entropyTextMaster",
e.target.value
);
});

document.getElementById("passwordAdmin")?.addEventListener("input", (e) => {
updatePasswordStrengthUI(
"passwordStrengthBarAdminInput",
"passwordStrengthTextAdminInput",
"entropyTextAdminInput",
e.target.value
);
});



const mainPasswordInputMember = document.getElementById("memberFinalizeMasterPassword");
if (mainPasswordInputMember) {
mainPasswordInputMember.addEventListener("input", (e) => updatePasswordStrengthMember(e.target.value));
mainPasswordInputMember.addEventListener("blur", (e) => updatePasswordStrengthMember(e.target.value));
}


function isPasswordStrongEnough(password) {
return calculateEntropyMaster(password) >= ENTROPY_THRESHOLDS.low;
}



function openAdminPasswordModal() {
document.getElementById("adminPasswordGeneratorModal").classList.remove("hidden");
document.getElementById("adminPasswordGeneratorModal").classList.add("active");
resetTimer();
}

function closeAdminPasswordModal() {
document.getElementById("adminPasswordGeneratorModal").classList.add("hidden");
document.getElementById("adminPasswordGeneratorModal").classList.remove("active");
document.getElementById("webAddressAdmin").value = '';
document.getElementById("passwordAdmin").value = '';
document.getElementById("lengthAdmin").value = 43;
document.getElementById("iterationCountAdmin").value = 50000;
document.getElementById("mainPasswordAdmin").value = '';
document.getElementById("createdforAdmin").innerText = '';
document.getElementById('toggle1Admin').checked = true;
document.getElementById('toggle2Admin').checked = true;
document.getElementById('toggle3Admin').checked = true;
document.getElementById('toggle4Admin').checked = true;
document.getElementById('toggle5Admin').checked = false;
resetTimer();
}



document.addEventListener('DOMContentLoaded', () => {
document.getElementById('masterPassAdmin')?.addEventListener('click', e => showMasterPassword(e.currentTarget));
document.getElementById('mainButtonAdmin')?.addEventListener('click', e => showManyPassword(e.currentTarget));
document.getElementById('iterCountAdmin')?.addEventListener('click', e => showManyPassword(e.currentTarget));

document.getElementById('collectInputAdmin')?.addEventListener('click', async () => {
const result = await collectInputDataAdmin();
});
});


async function collectInputDataAdmin() {
const button = document.getElementById('collectInputAdmin');
const status = document.getElementById('generationStatusAdmin');
const webAddressField = document.getElementById('webAddressAdmin');
const passwordField = document.getElementById('passwordAdmin');

if (!webAddressField.value.trim()) {
webAddressField.focus();
return null;
}

if (!passwordField.value.trim()) {
passwordField.focus();
return null;
}

if (passwordField.value.trim().length < 16) {
showModalAlert("masterPasswordLength", null, "warning");
passwordField.focus();
return null;
}

button.disabled = true;
status.classList.remove("generation-status-hidden");

const spinner4 = document.getElementById("spinner4");
spinner4.classList.remove("invisible");

const webAddressInput = webAddressField.value;
const passwordInput = passwordField.value;
const lengthInput = parseInt(document.getElementById('lengthAdmin').value, 10);
const iterationCountInput = parseInt(document.getElementById('iterationCountAdmin').value, 10);

const uppercaseChecked = document.getElementById('toggle1Admin').checked;
const lowercaseChecked = document.getElementById('toggle2Admin').checked;
const numbersChecked = document.getElementById('toggle3Admin').checked;
const symbolsChecked = document.getElementById('toggle4Admin').checked;
const separatorChecked = document.getElementById('toggle5Admin').checked;

const charTypes = { uppercase: uppercaseChecked, lowercase: lowercaseChecked, numbers: numbersChecked, symbols: symbolsChecked };

resetTimer();

await new Promise(resolve => setTimeout(resolve, 10));

const generatedPassword = await generateDeterministicPasswordsWithArgonAdmin(
webAddressInput,
passwordInput,
lengthInput,
iterationCountInput,
charTypes,
separatorChecked
);

button.disabled = false;
status.classList.add("generation-status-hidden");
spinner4.classList.add("invisible");
resetSingleFeedbackIconAdmin();

return generatedPassword;
}




async function generateDeterministicPasswordsWithArgonAdmin(
webAddress,
masterPassword,
length,
iterationCount,
charTypes,
segmented = false
) {
const normalizedService = normalizeServiceName(webAddress);


const passwords = await derivePasswords({
  mode: "regular",
  masterPassword,
  normalizedService,
  length,
  iterationCount,
  charTypes,
  count: 1,
  segmented,
});

if (passwords.length === 0) return [];
const password = passwords[0];

document.getElementById("mainPasswordAdmin").value = password;

showSmooth(document.getElementById("generatedPasswordAdmin"));

const adminLabel = document.getElementById("createdforAdmin");
const bold = document.createElement("b");
bold.textContent = webAddress;
adminLabel.replaceChildren(bold);

document.getElementById("webAddressAdmin").value = "";
document.getElementById("passwordAdmin").value = "";
updatePasswordStrengthUI(
  "passwordStrengthBarAdminInput",
  "passwordStrengthTextAdminInput",
  "entropyTextAdminInput",
  ""
);
document.getElementById("generationStatusAdmin").classList.add("generation-status-hidden");

updateCounter();
resetTimer();

return password;
}



function updateArgonTierLabel() {
const input = document.getElementById("iterationCount");
const label = document.getElementById("argonTierLabel");
const val = parseInt(input.value);

if (isNaN(val) || val <= 0) {
label.textContent = '';
return;
}

if (val > 50000) {
label.textContent = '🔺 Upper custom';
} else if (val === 50000) {
label.textContent = '🔸 Default';
} else {
label.textContent = '🔹 Lower custom';
}
}

const iterationInput = document.getElementById("iterationCount");
iterationInput.addEventListener("input", updateArgonTierLabel);
iterationInput.addEventListener("blur", updateArgonTierLabel);

document.addEventListener("DOMContentLoaded", updateArgonTierLabel);

iterationInput.addEventListener("change", updateArgonTierLabel);



function generateDefaultFilename() {
const now = new Date();
const ts = now.toISOString().replace(/[:T]/g, "-").split(".")[0];
return `carrypass-audit-log_${ts}.txt`;
}


const auditLogQueue = [];

function logAdminAction(action, details = {}, performedBy = "admin") {
auditLogQueue.push({
timestamp: new Date().toISOString(),
action,
performed_by: performedBy,
details
});
}



async function exportAuditLogFile(filename) {
if (typeof filename !== "string") {
filename = generateDefaultFilename();
}

const logText = auditLogQueue.map(entry => {
return `[${entry.timestamp}] ${entry.action.toUpperCase()} by ${entry.performed_by}\n` +
        JSON.stringify(entry.details, null, 2);
}).join("\n\n");

const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(logText));
const checksum = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

const finalText = 
`=== CarryPass Audit Log ===\n\n` +
`${logText}\n\n` +
`=== SHA-256 Checksum (corruption detection only) ===\n` +
`${checksum}\n` +
`=== Verification: SHA-256 hash of log content only, excluding this footer ===\n`;

const blob = new Blob([finalText], { type: "text/plain" });
const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}


function extractSecretAndLabelFromURI(uri) {
const secretMatch = uri.match(/secret=([A-Z2-7]+)/i);
const labelMatch = uri.match(/\/[^:]+:([^?]+)/);

return {
secret: secretMatch ? secretMatch[1].toUpperCase() : null,
label: labelMatch ? decodeURIComponent(labelMatch[1]) : null
};
}

async function handleScannedQRCode(decodedText) {
try {
if (!totpSecretKey) {
  showModalAlert("noActiveSession", null, "warning");
  return;
}

const { secret, label } = extractSecretAndLabelFromURI(decodedText);

if (!secret) {
  showModalAlert("failedExtract", null, "error");
  return;
}

const encoder = new TextEncoder();

const secretPayload = encoder.encode(secret);
const secretNonce = crypto.getRandomValues(new Uint8Array(12));

const secretCiphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv: secretNonce },
  totpSecretKey,
  secretPayload
);

const secretTag = secretCiphertext.slice(-16);
const secretCiphertextWithoutTag = secretCiphertext.slice(0, -16);

localStorage.setItem("encryptedQR", JSON.stringify({
  ciphertext: Array.from(new Uint8Array(secretCiphertextWithoutTag)),
  nonce: Array.from(secretNonce),
  tag: Array.from(new Uint8Array(secretTag))
}));

if (label) {
  const labelPayload = encoder.encode(label);
  const labelNonce = crypto.getRandomValues(new Uint8Array(12));

  const labelCiphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: labelNonce },
    totpSecretKey,
    labelPayload
  );

  const labelTag = labelCiphertext.slice(-16);
  const labelCiphertextWithoutTag = labelCiphertext.slice(0, -16);

  localStorage.setItem("encryptedLabel", JSON.stringify({
    ciphertext: Array.from(new Uint8Array(labelCiphertextWithoutTag)),
    nonce: Array.from(labelNonce),
    tag: Array.from(new Uint8Array(labelTag))
  }));
}

sessionTOTPSecret = secret;
sessionMemberId = label;

updateTrustedDeviceIndicator();
showModalAlert("qrStoredTrusted", null, "success");
} catch (err) {
console.error(err);
showModalAlert("qrProcessFailed", null, "error");
}
}


async function getDecryptedQR() {
const storedData = JSON.parse(localStorage.getItem('encryptedQR'));
if (!storedData || !totpSecretKey) return null;

const { ciphertext, nonce, tag } = storedData;

try {
const decrypted = await crypto.subtle.decrypt(
  {
    name: "AES-GCM",
    iv: new Uint8Array(nonce),
    tagLength: 128
  },
  totpSecretKey,
  new Uint8Array([...ciphertext, ...tag])
);

return new TextDecoder().decode(decrypted);
} catch (e) {
console.error("❗ Failed to decrypt QR:", e);
return null;
}
}


let qrScanner = null;
let isQrScanProcessing = false;
let isQrScannerStopping = false;
let lastScannedQr = "";
let lastScannedAt = 0;

async function startQrScan() {
  const readerEl = document.getElementById("qr-camera-reader");
  const stopButton = document.getElementById("stopScanButton");

  if (!readerEl) {
    console.error("Missing #qr-reader element.");
    return;
  }

  if (qrScanner || isQrScanProcessing) {
    return;
  }

  isQrScanProcessing = false;
  isQrScannerStopping = false;

  readerEl.innerHTML = "";

  qrScanner = new Html5Qrcode("qr-camera-reader");

  if (stopButton) {
    stopButton.classList.remove("nodisplay");
    stopButton.classList.add("inline-block");
  }

  try {
    await qrScanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },
      async (decodedText) => {
        if (isQrScanProcessing) return;

        const now = Date.now();

        if (
          decodedText === lastScannedQr &&
          now - lastScannedAt < 3000
        ) {
          return;
        }

        lastScannedQr = decodedText;
        lastScannedAt = now;

        isQrScanProcessing = true;

        hideQrStopButton();

        try {
          await stopQrScan();

          await handleScannedQRCode(decodedText);

          const confirmSave = await confirmModal("scannedQrSave");

          if (confirmSave) {
            saveQrImage(decodedText);
          }
        } catch (err) {
          console.error("QR handling failed:", err);
          showModalAlert("qrReadFailImage", null, "error");
        } finally {
          isQrScanProcessing = false;
        }
      },
      () => {
    
      }
    );
  } catch (err) {
    console.error("Camera access denied or scanner failed:", err);

    showModalAlert("cameraAccessDenied", null, "error");

    hideQrStopButton();

    try {
      await clearQrReader();
    } catch (clearErr) {
      console.warn("QR reader clear failed:", clearErr);
    }

    qrScanner = null;
    isQrScanProcessing = false;
    isQrScannerStopping = false;
  }
}


async function stopQrScan() {
  if (isQrScannerStopping) return;

  isQrScannerStopping = true;

  hideQrStopButton();

  if (!qrScanner) {
    await clearQrReader();
    isQrScannerStopping = false;
    return;
  }

  const scannerToStop = qrScanner;

  try {
    await scannerToStop.stop();
  } catch (err) {
    console.warn("QR scanner stop failed or scanner was not running:", err);
  }

  try {
    await scannerToStop.clear();
  } catch (err) {
    console.warn("QR scanner clear failed:", err);
  }

  qrScanner = null;

  await clearQrReader();

  isQrScannerStopping = false;
}


function hideQrStopButton() {
  const stopButton = document.getElementById("stopScanButton");

  if (!stopButton) return;

  stopButton.classList.add("nodisplay");
  stopButton.classList.remove("inline-block");
}

async function clearQrReader() {
  const readerEl = document.getElementById("qr-camera-reader");

  if (!readerEl) return;

  readerEl.innerHTML = "";
}


const startQrScanButton = document.getElementById("startQrScan");
const stopScanButton = document.getElementById("stopScanButton");

if (startQrScanButton) {
  startQrScanButton.addEventListener("click", startQrScan);
}

if (stopScanButton) {
  stopScanButton.addEventListener("click", async () => {
    isQrScanProcessing = false;
    await stopQrScan();
  });
}


function saveQrImage(text) {
const tempContainer = document.createElement("div");
document.body.appendChild(tempContainer);

const qr = new QRCode(tempContainer, {
text: text,
width: 256,
height: 256,
correctLevel: QRCode.CorrectLevel.M,
});


setTimeout(() => {
const img = tempContainer.querySelector("img");

if (!img) {
  console.error("❌ QR code image not rendered.");
  document.body.removeChild(tempContainer);
  return;
}

const qrCanvas = document.createElement("canvas");
const qrImg = new Image();
qrImg.src = img.src;

qrImg.onload = () => {
  const border = 16;
  const size = qrImg.width + border * 2;

  qrCanvas.width = size;
  qrCanvas.height = size;

  const ctx = qrCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  ctx.drawImage(qrImg, border, border);

  const link = document.createElement("a");
  link.href = qrCanvas.toDataURL("image/png");
  link.download = "carrypass-qr.png";
  link.click();

  document.body.removeChild(tempContainer);
};
}, 200);
}


function updateQRFileName() {
const fileInput = document.getElementById("qr-file-input");
const fileNameField = document.getElementById("qr-file-inputText");
const fileName = fileInput.files[0] ? fileInput.files[0].name : "Upload QR image";
fileNameField.value = fileName;
}

const qrFileButton = document.getElementById("qr-file-inputButton");
const qrFileInput = document.getElementById("qr-file-input");
let fileNameField = document.getElementById("qr-file-inputText");

if (qrFileButton && qrFileInput) {
  qrFileButton.addEventListener("click", () => {
    qrFileInput.click();
  });
}

if (qrFileInput) {
  qrFileInput.addEventListener("change", async (event) => {
    updateQRFileName();

    const file = event.target.files[0];
    if (!file) return;

    const fileQrScanner = new Html5Qrcode("qr-file-reader");

    try {
      const normalizedFile = await normalizeImageForScanning(file);

      const result = await fileQrScanner.scanFile(
        normalizedFile,
        false
      );

      await handleScannedQRCode(result);
      if (fileNameField) fileNameField = '';
    } catch (err) {
      console.error("QR scan failed:", err);
      showModalAlert("qrReadFailImage", null, "error");
    } finally {
      qrFileInput.value = "";
      if (fileNameField) fileNameField = '';

      try {
        await fileQrScanner.clear();
      } catch (err) {
        console.warn("QR file scanner clear failed:", err);
      }

      await clearQrReader();
    }
  });
}


async function normalizeImageForScanning(file) {
const objectUrl = URL.createObjectURL(file);
try {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Image load failed"));
    i.src = objectUrl;
  });

  const MAX_DIM = 1600;
  let { naturalWidth: w, naturalHeight: h } = img;
  if (Math.max(w, h) > MAX_DIM) {
    const scale = MAX_DIM / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  return new File([blob], file.name, { type: "image/png" });
} finally {
  URL.revokeObjectURL(objectUrl);
}
}


function updateTrustedDeviceIndicator() {
const inMemory = !!sessionTOTPSecret;
const hasStored = !!localStorage.getItem("encryptedQR");

document.querySelectorAll('[data-trusted-indicator]').forEach(container => {
const icon = container.querySelector('.trusted-icon');
const label = container.querySelector('.trusted-label');

if (!icon || !label) return;

if (inMemory) {
  icon.setAttribute("data-lucide", "monitor-dot");
  container.title = "This device is trusted. TOTP secret is active.";
  container.classList.remove("untrusted", "nodisplay");
  container.classList.add("inline-flex-display");
} else if (hasStored) {
  icon.setAttribute("data-lucide", "clock-4");
  label.textContent = "Needs Login";
  container.title = "This device is configured but not currently trusted. Please log in.";
  container.classList.add("untrusted");
  container.classList.remove("nodisplay");
  container.classList.add("inline-flex-display");
} else {
  container.classList.remove("inline-flex-display");
  container.classList.add("nodisplay");
}
});

lucide.createIcons();
}


function closeQRModal() {
modal = document.getElementById("qrExportModal")
modal.classList.add('hidden');
modal.classList.remove('active');
}


let qrTimeoutId = null;

document.addEventListener("click", async (e) => {
const btn = e.target.closest(".export-qr-button");
if (!btn) return;

if (!sessionTOTPSecret) {
showModalAlert("totpSecretUnavailable", null, "error");
return;
}

if (!sessionMemberId) {
showModalAlert("totpMemberUnavailable", null, "error");
return;
}

const confirmShare = await confirmModal("shareQrSecretWarning");
if (!confirmShare) return;

const secret = sessionTOTPSecret;
const label = sessionMemberId;

const encodedSecret = encodeURIComponent(secret);
const encodedLabel = encodeURIComponent(label);
const encodedIssuer = encodeURIComponent("CarryPass Team");

const uri = `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${encodedSecret}&issuer=${encodedIssuer}`;

const container = document.getElementById("qrExportContainer");
container.textContent = "";

new QRCode(container, {
text: uri,
width: 220,
height: 220,
correctLevel: QRCode.CorrectLevel.M
});

const modal = document.getElementById("qrExportModal");
modal.classList.remove("hidden");
modal.classList.add("active");
document.getElementById("qrTimeoutMessage").textContent = t("qrTimeoutStart");

clearTimeout(qrTimeoutId);
qrTimeoutId = setTimeout(() => {
container.textContent = "";
document.getElementById("qrTimeoutMessage").textContent = t("qrTimeoutExpired");
}, 60000);
});



async function validateTOTPCode(userInputCode) {
if (!sessionTOTPSecret) {
showModalAlert("noTotpSecretLoaded", null, "warning");
return false;
}

const secret = sessionTOTPSecret;

const codesToAccept = await Promise.all([
generateTOTP(secret, -1),
generateTOTP(secret, 0),
generateTOTP(secret, 1)
]);



return codesToAccept.includes(userInputCode.trim());
}

const ICON_NAMES = [
'lock', 'key', 'user', 'shield', 'x', 'glass-water', 'hourglass',
'alarm-clock', 'zap', 'cloud', 'code', 'cpu', 'activity', 'bug',
'file', 'archive', 'apple', 'bell', 'moon', 'sun', 'hash',
'box', 'flag', 'bookmark', 'bell', 'command', 'globe', 'link', 'puzzle'
];

const ICON_COLORS = ['#084298', '#0f5132', '#842029', '#664d03', '#5c0d80', '#2e2e2e'];


async function updateSingleFeedbackIcon(masterPassword) {
const iconEl = document.querySelector('.feedback-icon');
if (!iconEl) return;

const { name, color } = await getSingleVisualHashIcon(masterPassword);

iconEl.setAttribute('data-lucide', name);
iconEl.parentElement.style.setProperty('--icon-stroke', color);

lucide.createIcons();
}

async function updateSingleFeedbackIconAdmin(masterPassword) {
const iconEl = document.querySelector('.feedback-icon-admin');
if (!iconEl) return;

const { name, color } = await getSingleVisualHashIcon(masterPassword);

iconEl.setAttribute('data-lucide', name);
iconEl.parentElement.style.setProperty('--icon-stroke', color);

lucide.createIcons();
}


function getPasswordSettingsForIcon() {
return {
uppercase: document.getElementById("toggle1").checked,
lowercase: document.getElementById("toggle2").checked,
numbers: document.getElementById("toggle3").checked,
symbols: document.getElementById("toggle4").checked,
separator: document.getElementById("toggle5").checked,
length: document.getElementById("length").value,
iterationCount: document.getElementById("iterationCount").value
};
}

async function getSettingsIcon(settings) {
const inputString = JSON.stringify(settings);
const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(inputString));
const hashArray = Array.from(new Uint8Array(hashBuffer));

const iconIndex = hashArray[0] % ICON_NAMES.length;
const colorIndex = hashArray[1] % ICON_COLORS.length;

return {
name: ICON_NAMES[iconIndex],
color: ICON_COLORS[colorIndex]
};
}

async function updateSliderIconFromSettings() {
const settings = getPasswordSettingsForIcon();
const { name, color } = await getSettingsIcon(settings);

const iconEl = document.querySelector('#slider1 .feedback-icon-settings');
if (!iconEl) return;

iconEl.setAttribute('data-lucide', name);
iconEl.parentElement.style.setProperty('--icon-stroke', color);

lucide.createIcons();
}


async function getSingleVisualHashIcon(masterPassword) {
const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(masterPassword));
const hashArray = Array.from(new Uint8Array(hashBuffer));

const iconIndex = hashArray[0] % ICON_NAMES.length;
const colorIndex = hashArray[1] % ICON_COLORS.length;

return {
name: ICON_NAMES[iconIndex],
color: ICON_COLORS[colorIndex]
};
}

function resetSingleFeedbackIcon() {
const iconEl = document.querySelector('#masterPass .feedback-icon');
if (!iconEl) return;

iconEl.setAttribute('data-lucide', 'square-asterisk');
iconEl.style.removeProperty('--icon-stroke');

lucide.createIcons();
}

function resetSingleFeedbackIconAdmin() {
const iconEl = document.querySelector('#masterPassAdmin .feedback-icon-admin');
if (!iconEl) return;

iconEl.setAttribute('data-lucide', 'square-asterisk');
iconEl.style.removeProperty('--icon-stroke');

lucide.createIcons();
}



const inputRegister = document.getElementById("passCodeInputRegister");
const inputLogin = document.getElementById("passCodeInput");
const overlay = document.getElementById("fingerprint-overlay");
const overlayLogin = document.getElementById("fingerprint-overlay-login");
const toggleBtn = document.getElementById("toggle-button");
const toggleBtnLogin = document.getElementById("toggle-button-login");
let isVisible = false;

const pastelColors = [
  "#BFA2FF",
  "#FF9A4D",
  "#FFD45A",
  "#B8B8B8",
  "#C084FC",
  "#E0A84F",
  "#5FD0C5",
  "#D98282" 
];
const consonants = "BCDFGHJKLMNPQRSTVWXYZ".split("");
const vowels = "AEIOU".split("");

let typingTimer = null;
let distractionTimer = null;
let distractionActive = false;

async function showRealFingerprint(inputEl, overlayEl) {
const text = inputEl.value;
if (!text || text.length < 14 || isVisible) {
overlayEl.textContent = "";
return;
}

const encoder = new TextEncoder();
const data = encoder.encode("carrypass-visual-fingerprint-v4" + text);
const hashBuffer = await crypto.subtle.digest("SHA-256", data);
const hashArray = Array.from(new Uint8Array(hashBuffer));

generateFingerprint(hashArray, overlayEl, true);
}


function showFakeDistraction(inputEl, overlayEl) {
if (isVisible || inputEl.value.length < 14) return;

const fakeBytes = crypto.getRandomValues(new Uint8Array(16));
generateFingerprint(Array.from(fakeBytes), overlayEl, false);
}

function attachFingerprintEvents(inputEl, overlayEl) {
inputEl.addEventListener("input", () => {
stopDistraction();
clearTimeout(typingTimer);

if (inputEl.value.length >= 14 && !isVisible) {
  startDistractionLoop(inputEl, overlayEl);
  typingTimer = setTimeout(async () => {
    stopDistraction();
    await showRealFingerprint(inputEl, overlayEl);
  }, 800);
} else {
  overlayEl.textContent = "";
}
});

inputEl.addEventListener("paste", () => {
setTimeout(() => inputEl.dispatchEvent(new Event("input")), 50);
});

inputEl.dispatchEvent(new Event("input"));
}


function startDistractionLoop(inputEl, overlayEl) {
if (distractionActive) return;
distractionActive = true;

function loop() {
if (!distractionActive) return;
showFakeDistraction(inputEl, overlayEl);
const rand = new Uint32Array(1);
crypto.getRandomValues(rand);
distractionTimer = setTimeout(loop, 100 + (rand[0] % 300));
}

loop();
}



toggleBtn.addEventListener("click", () => {
const start = inputRegister.selectionStart;
const end = inputRegister.selectionEnd;

isVisible = !isVisible;
toggleBtn.textContent = isVisible ? t("hide") : t("show");

if (isVisible) {
inputRegister.classList.add("showing");
overlay.classList.remove("overlay-visible");
overlay.classList.add("overlay-hidden");
} else {
inputRegister.classList.remove("showing");
overlay.classList.remove("overlay-hidden");
overlay.classList.add("overlay-visible");
}

inputRegister.focus();
inputRegister.setSelectionRange(start, end);
});

toggleBtnLogin.addEventListener("click", () => {
const start = inputLogin.selectionStart;
const end = inputLogin.selectionEnd;

isVisible = !isVisible;
toggleBtnLogin.textContent = isVisible ? t("hide") : t("show");

if (isVisible) {
inputLogin.classList.add("showing");
overlayLogin.classList.remove("overlay-visible");
overlayLogin.classList.add("overlay-hidden");
} else {
inputLogin.classList.remove("showing");
overlayLogin.classList.remove("overlay-hidden");
overlayLogin.classList.add("overlay-visible");
}

inputLogin.focus();
inputLogin.setSelectionRange(start, end);
});

function generateFingerprint(hashArray, overlayEl, real = true) {
overlayEl.textContent = "";
for (let i = 0; i < 8; i++) {
const isConsonant = i % 2 === 0;
const list = isConsonant ? consonants : vowels;
const index = hashArray[i] % list.length;
const color = pastelColors[hashArray[i + 8] % pastelColors.length];
const span = document.createElement("span");
span.className = "fp-char";
span.style.setProperty('--fp-color', color);
span.textContent = list[index];
overlayEl.appendChild(span);
}
}


function stopDistraction() {
distractionActive = false;
clearTimeout(distractionTimer);
}


attachFingerprintEvents(inputRegister, overlay);
attachFingerprintEvents(inputLogin, overlayLogin);


function secureRandomInt(max) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error("Invalid max value");
  }

  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;

  let value;

  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);

  return value % max;
}

function rollDie() {
  return secureRandomInt(6) + 1;
}

function rollDiceCode(diceCount = 4) {
  let code = "";

  for (let i = 0; i < diceCount; i++) {
    code += String(rollDie());
  }

  return code;
}

function diceCodeToIndex(code) {
  if (!/^[1-6]{4}$/.test(code)) {
    throw new Error("Invalid dice code");
  }

  let index = 0;

  for (const char of code) {
    const digit = Number(char);
    index = index * 6 + (digit - 1);
  }

  return index;
}


function getDicewareWordsFrom1296List(wordList, count = 8) {
  if (!Array.isArray(wordList)) {
    throw new Error("wordList must be an array");
  }

  if (wordList.length !== 1296) {
    throw new Error("Diceware word list must contain exactly 1296 words");
  }

  const result = [];

  for (let i = 0; i < count; i++) {
    const diceCode = rollDiceCode(4);
    const index = diceCodeToIndex(diceCode);

    result.push({
      code: diceCode,
      word: wordList[index],
    });
  }

  return result;
}


function renderDicewareLine(elementId, entries, showCodes = false) {
  const target = document.getElementById(elementId);
  if (!target) return;

  if (showCodes) {
    target.textContent = entries
      .map(entry => `${entry.code}:${entry.word}`)
      .join(" ");
  } else {
    target.textContent = entries
      .map(entry => entry.word)
      .join(" ");
  }
}


function generateBothDicewareSuggestions() {
  if (typeof EFF_MEMORABLE_WORDS === "undefined" || !Array.isArray(EFF_MEMORABLE_WORDS)) {
    console.error("EFF_MEMORABLE_WORDS is not loaded.");
    return;
  }

  if (typeof HUNGARIAN_WORDS === "undefined" || !Array.isArray(HUNGARIAN_WORDS)) {
    console.error("HUNGARIAN_WORDS is not loaded.");
    return;
  }

  const englishWords = getDicewareWordsFrom1296List(EFF_MEMORABLE_WORDS, 8);
  const hungarianWords = getDicewareWordsFrom1296List(HUNGARIAN_WORDS, 8);

  renderDicewareLine("dicewareEnglishWords", englishWords, false);
  renderDicewareLine("dicewareHungarianWords", hungarianWords, false);

}

document.addEventListener("DOMContentLoaded", () => {
  generateBothDicewareSuggestions();

  document.getElementById("generateDicewareWords")?.addEventListener("click", () => {
    generateBothDicewareSuggestions();
  });
});




// DEMO
(function () {
const tabs = document.querySelectorAll('.pwa-tab');
const panels = document.querySelectorAll('.pwa-panel');

tabs.forEach(tab => {
tab.addEventListener('click', () => {
const target = tab.dataset.panel;

tabs.forEach(t => {
t.classList.remove('is-active');
t.setAttribute('aria-selected', 'false');
});
panels.forEach(p => p.classList.remove('is-active'));

tab.classList.add('is-active');
tab.setAttribute('aria-selected', 'true');

const panel = document.getElementById('pwa-panel-' + target);
if (panel) panel.classList.add('is-active');
});
});
}());

document.getElementById('openDemoModal')?.addEventListener('click', () => {
document.getElementById('demo-modal').classList.remove('hidden');
document.getElementById('demo-modal').classList.add('active');
});

document.getElementById('openDemoModalAdmin')?.addEventListener('click', () => {
document.getElementById('demo-modal').classList.remove('hidden');
document.getElementById('demo-modal').classList.add('active');
});

document.getElementById('closeDemoModal')?.addEventListener('click', () => {
document.getElementById('demo-modal').classList.remove('active');
document.getElementById('demo-modal').classList.add('hidden');
});

