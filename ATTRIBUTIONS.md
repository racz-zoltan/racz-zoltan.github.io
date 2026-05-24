# 📜 Third-Party Library Attributions

CarryPass makes use of the following open-source libraries. Each is used in accordance with its license, and all original copyrights remain with their respective authors.

---

### 🧠 [argon2-browser](https://github.com/antelle/argon2-browser)
- **Purpose:** Argon2id implementation compiled to WebAssembly (WASM) and JavaScript. Used for all password-stretching key derivation.
- **License:** MIT

---

### 📊 [zxcvbn](https://github.com/dropbox/zxcvbn)
- **Purpose:** Password strength estimation. Used to enforce the 90-bit entropy minimum at registration and member finalization.
- **Author:** Dropbox
- **License:** MIT

---

### 🧼 [DOMPurify](https://github.com/cure53/DOMPurify)
- **Purpose:** HTML sanitization. Used to safely render user-supplied content (e.g. service names, member names) into the DOM.
- **Author:** Cure53
- **License:** Apache-2.0 / MPL-2.0 (dual)

---

### 📷 [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **Purpose:** QR code scanner using HTML5 video stream. Used for trusted-device enrollment.
- **License:** Apache-2.0

---

### 📦 [qrcode](https://github.com/soldair/node-qrcode)
- **Purpose:** QR code generation in browser-compatible format. Used to issue onboarding QR codes from the admin panel.
- **License:** MIT

---

### 🎨 [Lucide Icons](https://lucide.dev/)
- **Purpose:** Modern, open-source icon set used throughout the UI.
- **License:** ISC
- **Source:** [https://github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide)

---

---

### 📝 [EFF Diceware Wordlists](https://www.eff.org/dice)
- **Purpose:** Wordlists used for generating deterministic passphrases (Diceware-style) and for the optional master passphrase suggestion at registration.
- **License:** [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- **Author:** Electronic Frontier Foundation (EFF)
- **Source:** [https://www.eff.org/dice](https://www.eff.org/dice)
- **Note:** Used with appreciation under CC-BY 4.0. Redistribution encouraged with attribution.

---

## Native Browser APIs (No Attribution Required)

For completeness, CarryPass relies on the following standardized browser APIs that are not third-party libraries:

- **Web Cryptography API** (`crypto.subtle`) — AES-GCM encryption, HKDF-SHA256 key derivation, SHA-256 hashing, HMAC-SHA256, key generation
- **`crypto.getRandomValues`** — All cryptographic randomness (TOTP secrets, salts, nonces, ephemeral team keys)

These are part of the W3C/WHATWG specifications and implemented natively by browsers.

---

> All third-party libraries are included under permissive licenses (MIT, ISC, Apache-2.0, MPL-2.0, CC-BY 4.0, and permissive attribution-required reuse terms) and do not impose obligations beyond attribution.
> See the [LICENSE](./LICENSE) file for CarryPass's open-source terms (MIT).
