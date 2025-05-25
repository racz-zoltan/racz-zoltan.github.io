# 🔐 CarryPass

[![License: MIT/Commercial](https://img.shields.io/badge/license-MIT%20%7C%20Commercial-blue.svg)](./LICENSE)
[![Privacy First](https://img.shields.io/badge/privacy-zero--knowledge-critical)](https://carrypass.net)
[![PWA Ready](https://img.shields.io/badge/PWA-offline--first-brightgreen.svg)](https://carrypass.net)
[![Status: Stable](https://img.shields.io/badge/status-stable-success)]()
[![Maintenance](https://img.shields.io/badge/maintenance-actively--developed-blue.svg)]()
[![Made with 💻 & 🔐](https://img.shields.io/badge/built%20with-CryptoJS%2C%20Argon2%2C%20AES-orange)]()


# 🔐 CarryPass – Privacy-First Password Generator & Secure Vault

**CarryPass** is an open-source, client-side password manager and credential sharing tool built with strong cryptographic primitives and a zero-knowledge philosophy.

All logic runs in your browser. Nothing is sent or stored on servers — **no telemetry, no tracking, no compromise.**

> 🧠 Inspired by modern cryptography and the principles of privacy, anonymity, and user sovereignty.

---

## 🔍 Privacy Philosophy

CarryPass is built on a simple principle:

> **“The best way to protect user data is to never collect it.”**

We designed CarryPass from the ground up to enforce:
- 💻 **Client-only execution** – No data is sent to any server
- 🧠 **Zero-knowledge architecture** – We can’t access your passwords, because we never see them
- 🔐 **Deterministic password generation** – Eliminates the need to store or sync vaults in the cloud
- 🛑 **No telemetry, tracking, or analytics**
- 🌍 **Full offline support** via PWA

We believe that **privacy is not a feature — it’s a foundation.**

---

## 🧷 Password Change Endpoint (Optional)

Some browsers and password managers look for `.well-known/change-password` to help users update their passwords in case of a breach.

**CarryPass does not require or support this mechanism** because:

- It does **not store passwords** at all
- Passwords are **generated deterministically** from user input
- There is **no account or backend system** to update

However, for full compatibility, we include a `.well-known/change-password` file to indicate this clearly.

📄 See: [https://carrypass.net/.well-known/change-password](https://carrypass.net/.well-known/change-password)


## ✨ Features

- ✅ **Deterministic password generation**  
  Generate secure, unique passwords from:
  - Service name
  - Master password
  - User-defined strength and charset
  - Salted and stretched with Argon2 + PBKDF2

- 🔐 **Encrypted vaults**
  - AES-GCM encryption with a new random nonce per edit
  - Per-member, per-team, and admin-level vault separation
  - Vaults exportable and re-importable with full integrity

- 👥 **Team support with TOTP**
  - Admin assigns members to teams
  - Team credentials encrypted with deterministic CarryPass-generated passwords
  - TOTP-based unlock and onboarding via QR code

- 📷 **QR onboarding and vault delivery**
  - Secure QR codes for device setup
  - Encrypted secrets and keys included

- 💡 **Fully offline PWA**
  - Installable and functional even with no internet connection

---

## 🛡️ Security Overview

### 🔑 Password Generation Flow
- **Inputs:** Service name, master password, strength parameters (length, charset, iteration strength)
- **Process:**
  - `Argon2` derives an enhanced salt using memory- and time-hard computation
  - `PBKDF2` derives a key using the Argon2 output + input string
  - `AES-CTR` generates a deterministic byte stream from this key
- **Output:** The byte stream is sliced and mapped to user-defined character sets to generate a deterministic password

---

### 🔐 Vault Encryption

- **Admin, Member, and Team Vaults:**
  - Encrypted with **AES-GCM** for confidentiality and integrity
  - Each vault uses a **new random nonce** on every edit or export
  - Vaults are encrypted using keys derived from secure user input or generated passwords

- **Per-Member Vault Protection:**
  - Members finalize their access with a **personal password** (≥128-bit entropy)
  - This password is hashed via **PBKDF2**
  - The resulting hash encrypts the member's vault
  - Admin stores **PBKDF2 hashes** of member passwords to re-encrypt their vaults upon updates

---

### 🧩 Team Vaults and Access Codes

- Each **Team Vault** is encrypted with a password **generated deterministically** using CarryPass:
  - Service: team name
  - Password input: a string like `GTHKSM` selected from a character set like `CCXCGTHKSM45103`
  - Strength: 45-character password, ≥100,000 + 103 PBKDF2 iterations
- This **team password** is then hashed and used to **encrypt the team vault**
- The resulting **team vault key** is stored in each **assigned member's record**
- Only assigned members can decrypt the team vault using their local access

---

### 🕓 TOTP-Based Validation

- Each member has a **unique TOTP secret** generated at setup
- Onboarding devices scan the QR to persist the TOTP secret (encrypted in local storage)
- The app uses the **current TOTP token** to validate access to the encrypted team credentials

---

### 🔁 Key Rotation and Integrity

- On every admin vault export:
  - All vaults (admin, member, team) are re-encrypted using **new random nonces**
  - Keys are derived and stored deterministically to allow secure re-import
- Admin can revoke or rotate team access by modifying code maps and assigned member vaults

---

## 📸 Screenshots

<sub>Include screenshots of the generator, vault viewer, QR onboarding screen, etc.</sub>

---

## 💼 Commercial Use & Rebranding

CarryPass is free to use under the MIT License for personal and non-commercial purposes.

If you wish to:
- Rebrand or white-label CarryPass
- Integrate it into a proprietary service
- Offer it as part of a commercial product
- Get dedicated support, SLA, or custom features

➡️ Please [contact us](mailto:info.carrypass@proton.me) for a commercial license.



## 📦 Installation

### Web Use
Visit the app at:  
👉 [https://carrypass.net](https://carrypass.net)

> Works offline after first load (PWA installable).


### 🛠️ Local Use (Developer Mode)

You can run CarryPass locally using any static file server.

1. Clone the repo:

   ```bash
   git clone https://github.com/racz-zoltan/racz-zoltan.github.io.git
   cd racz-zoltan.github.io



## 📄 Legal & Privacy

- [MIT License](./LICENSE.md)
- [Commercial License Terms](./LICENSE-commercial.md)
- [Third-Party Library Attributions](./ATTRIBUTIONS.md)
- [Privacy Policy](./PRIVACY.md)
