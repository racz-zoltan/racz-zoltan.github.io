# 🔐 CarryPass

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Privacy First](https://img.shields.io/badge/privacy-zero--knowledge-critical)](https://carrypass.net)
[![PWA Ready](https://img.shields.io/badge/PWA-offline--first-brightgreen.svg)](https://carrypass.net)
[![Status: Stable](https://img.shields.io/badge/status-stable-success)]()
[![Maintenance](https://img.shields.io/badge/maintenance-actively--developed-blue.svg)]()
[![Built with](https://img.shields.io/badge/built%20with-Argon2id%20%7C%20HKDF%20%7C%20AES--GCM-orange)]()


# 🔐 CarryPass — Privacy-First Credential Manager

**CarryPass** is an open-source, client-side password manager and team credential-sharing tool built with strong cryptographic primitives and a zero-knowledge philosophy.

All logic runs in your browser. Nothing is sent or stored on servers — **no telemetry, no tracking, no compromise.**
 
> 🧠 Inspired by modern cryptography and the principles of privacy, anonymity, and user sovereignty.

---

## 🔍 Privacy Philosophy

CarryPass is built on a simple principle:

> **"The best way to protect user data is to never collect it."**

CarryPass is designed from the ground up to enforce:

- 💻 **Client-only execution** — No data is sent to any server
- 🧠 **Zero-knowledge architecture** — Servers can't access passwords because passwords never leave your device
- 🔐 **Deterministic password generation** — Eliminates the need to store or sync vaults in the cloud
- 🛑 **No telemetry, tracking, or analytics**
- 🌍 **Full offline support** via PWA

Privacy is not a feature — it's a foundation.

---

## ✨ Features

### Deterministic Password Generator

Generate strong, unique passwords from:
- Service name
- Master passphrase + adaptive chained icon sequence
- Template (or custom character settings)
- Variant counter (for password rotation without losing other settings)

The same inputs always produce the same password — so nothing needs to be stored or synced. Lose your device, get a new one, log back in with the same passphrase, regenerate any password you've ever made.

### Team Vaults with End-to-End Encryption

- Admin sets up an encrypted vault containing teams, members, and credentials
- Each member gets a section encrypted with a key derived from **their password + a unique TOTP secret on their trusted device**
- Members decrypt only the teams they've been assigned to
- Per-export team-key rotation provides forward-cut revocation: removed members lose access in future vault files
- Single-admin model with clean handover (no multi-admin coordination complexity)

### Trusted Device Enrollment via QR Code

- Members scan an onboarding QR code with CarryPass on their device
- The QR carries the member's TOTP secret, which becomes a cryptographic key factor — not a typed code
- Possession of the trusted device is what proves identity at decryption time
- No authenticator app needed; no 6-digit codes to type

### Phishing Resistance

- Deterministic generation means a misspelled domain (`paypa1.com` vs `paypal.com`) produces a different password — useless on the real site
- A visible match indicator (green/red) compares the typed service name against previously-saved services to catch typos and lookalikes

### Self-Recovery via Encrypted Settings Export

- Export your settings (services, profiles, trusted-device state) as an encrypted bundle
- Import on a new device after completing CarryPass login there (same passphrase + adaptive icon path → same session key)
- Full self-recovery without admin involvement

### Fully Offline PWA

- Installable as a Progressive Web App on desktop and mobile
- All required assets are served as static local files — no external CDN calls at runtime
- Works completely offline after first install
- Subresource Integrity (SRI) hashes on every script and stylesheet

---

## 🛡️ Security Overview

### 🔑 Master Secret Derivation

At login, CarryPass combines a high-entropy textual passphrase with an adaptive chained icon sequence:

```text
combinedPass = passphrase || "::" || adaptiveIconHash
```

The icon factor is not a static six-icon hash. CarryPass currently uses an **Adaptive 3×4** profile:

- 3 icon grids
- 4 ordered icon selections per grid
- 12 total icon selections
- session-randomized icon positions
- Argon2id state update after every selected icon

Each icon choice updates the internal state, and that state derives the next grid. A wrong icon changes the future path.

The final adaptive icon hash is combined with the passphrase and passed through Argon2id (`t=4, m=128 MiB`) to derive `appMaster`, a short-lived root secret used only during login/key setup. From `appMaster`, CarryPass derives non-extractable runtime keys and branch keys, including handlers for local-state encryption, TOTP-secret protection, and deterministic password generation.

`appMaster` exists only briefly in memory as a `Uint8Array` during this derivation phase. After the required non-extractable keys are created, `appMaster` is zeroed and the reference is cleared. It is never persisted. During an unlocked session, the derived keys remain available in browser memory so the app can operate; they are cleared on logout, failed authentication cleanup, or full session reset.

### 🔐 Vault Encryption

- All vault sections are encrypted with **AES-GCM** using 256-bit keys and 96-bit random nonces (12 bytes)
- Section metadata is bound as **AAD** so tampering with version, member ID, expiry, or admin flag breaks decryption
- Each member's key is derived from `Argon2id(password || "::" || totpSecret, salt)` — both halves required
- Even if the vault file is leaked, the 160-bit TOTP secret on the trusted device sets a hard floor against brute-force

### 👥 Team Vaults

- Each team has a **freshly random 256-bit AES-GCM key** generated per export
- The team key is stored inside each assigned member's encrypted section
- The admin holds operational data (every team's contents, every member's record) in their own encrypted plaintext as `admin_data`
- Admins are members with an `is_admin: true` flag — no separate admin password, no separate cryptographic role

### 🔁 Per-Export Key Rotation

Every vault export rotates every team's encryption key:

- New keys are generated via `crypto.subtle.generateKey`
- Team blocks are re-encrypted under the new keys
- Remaining members get the new keys in their sections
- Removed members' old keys decrypt only the frozen old file

This provides cryptographic forward-cut for revocation. (Note: revocation of credentials already disclosed to a removed member requires rotating the underlying service's password — CarryPass cannot un-disclose what's already in someone's head.)

### 🕓 TOTP as a Key Factor

Unlike traditional TOTP integrations, CarryPass does not use 6-digit codes for unlocking. The TOTP secret (a 160-bit random value generated at member finalization) is bound directly into the member's key derivation as cryptographic input. The trusted device stores the TOTP secret locally in encrypted form. It is protected with a dedicated `totpSecretKey` derived from `appMaster` during login setup; at vault decryption time, the encrypted value is read from `localStorage`, decrypted locally, and combined with the typed member password.

The result: an attacker with the vault file but not the trusted device cannot decrypt — the 160-bit secret is computationally unguessable.

### 🛂 Screen Lock Code

For walking-away convenience, you can set a screen lock code (minimum 6 characters) that locks the session without requiring full re-authentication. This is a UI gate, not a strong cryptographic boundary — three wrong attempts wipe the in-memory state and force full re-authentication.

The feature is deliberately not called "PIN" — that name implies hardware-enforced rate limiting that the in-browser screen lock does not provide.

---

## 🧷 Password Change Endpoint

Some browsers and password managers look for `.well-known/change-password` to help users update passwords after a breach.

CarryPass does not require or support this mechanism because:

- It does **not store passwords** at all
- Passwords are **generated deterministically** from user input
- There is **no account or backend system** to update

A `.well-known/change-password` file is included for compatibility, indicating that CarryPass has nothing to update server-side.

📄 See: [https://carrypass.net/.well-known/change-password](https://carrypass.net/.well-known/change-password)

---

## 📦 Installation

### Web Use

Visit the app at:
👉 [https://carrypass.net](https://carrypass.net)

Works offline after first load (PWA installable).

### 🛠️ Local Development

You can run CarryPass locally using any static file server.

1. Clone the repo:

   ```bash
   git clone https://github.com/racz-zoltan/racz-zoltan.github.io.git
   cd racz-zoltan.github.io
   ```

2. Serve the directory with any static server, for example:

   ```bash
   python3 -m http.server 8000
   ```

3. Open `http://localhost:8000` in a modern browser.

CarryPass requires the Web Cryptography API (`crypto.subtle`), which is available in all modern browsers over HTTPS or on `localhost`.

---

## 📚 Documentation

- **[User Manual](./carrypass-user-manual.html)** — Step-by-step guide for everyday use
- **[Technical Overview](./carrypass-technical-overview.md)** — How CarryPass protects your credentials, written for technically curious users
- **[Whitepaper](./carrypass-whitepaper.md)** — Full architectural and cryptographic design document for security review
- **[Privacy Policy](./PRIVACY.md)** — What data CarryPass does and doesn't collect
- **[Security Policy](./SECURITY.md)** — Vulnerability disclosure process and scope

---

## 📸 Screenshots

<sub>Screenshots of the password generator, admin panel, member view, QR onboarding, and trusted-device enrollment available on [carrypass.net](https://carrypass.net).</sub>

---

## ⚠️ Important Trade-offs

CarryPass is designed to be honest about its limitations. A few worth highlighting:

- **No password recovery.** If you forget your master passphrase or adaptive icon path, your data is gone. There is no backdoor and no recovery mechanism.
- **Trusted device required for team vaults.** Lose your enrolled device with no settings backup and no QR hard copy, and your admin must re-issue your QR.
- **Single-admin model.** A team vault has exactly one admin at a time. Promoting a different member is an explicit handover, not a parallel grant.
- **3–5 second login.** Argon2id at login is deliberately expensive. Designed for a single login per session, not for repeated authentication.
- **Stateless means stateless.** No server-side state of any kind. Every login re-derives all keys from scratch from your inputs.

These are deliberate consequences of the privacy-first, stateless architecture. If you need server-mediated password recovery or multi-admin team management, CarryPass is the wrong tool — and that's by design.

---

## 📄 License

CarryPass is open source under the [MIT License](./LICENSE).

Use it, modify it, fork it, deploy it, audit it. Attribution is appreciated; please see [ATTRIBUTIONS.md](./ATTRIBUTIONS.md) for third-party library credits.

---

## 🤝 Contributing

CarryPass welcomes contributions, particularly:

- Security review and vulnerability reports — see [SECURITY.md](./SECURITY.md)
- Documentation improvements
- Translations beyond English and Hungarian
- Bug reports with reproducible test cases

For larger architectural changes, please open an issue first to discuss.

---

## 📬 Contact

- Email: [carrypass-info@proton.me](mailto:carrypass-info@proton.me)
- Website: [https://carrypass.net](https://carrypass.net)
