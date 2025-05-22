# 🔐 CarryPass Vault Folder

This folder is reserved for storing encrypted vault data used by the CarryPass PWA — including admin, member, and team-level credential exports.

## 📁 Typical Files (Encrypted Artifacts)

- `carrypass-admin.encrypted.json`  
  Fully encrypted vault containing all admin-managed credentials, metadata, and user vaults.

- `carrypass-[member].vault.json`  
  Vaults for individual team members, encrypted with the member’s PBKDF2-derived key.

- `carrypass-[team].vault.json`  
  Team-specific encrypted credential sets, locked with deterministic CarryPass-generated passwords and TOTP-secured access.

- `carrypass-pad.txt`  
  Base32-compatible entropy pad used as part of the key and TOTP derivation process. Distributed alongside team onboarding.

## 📦 Folder Purpose

This directory supports:
- Admin exports of encrypted vaults for secure delivery or backup
- Import into the CarryPass frontend via manual upload or QR delivery
- Clear separation between admin, team, and member data

## 🔒 Security Notes

- All files are encrypted **client-side** using AES-GCM with new nonces per export
- No plaintext credentials are ever written here
- Files are not included in the default PWA cache to prevent accidental exposure

## 🚫 Deployment Warning

If you deploy CarryPass on **static platforms** like GitHub Pages or Netlify:
- This `README.md` ensures the `vault/` folder is preserved even if it’s empty
- You may still need manual upload mechanisms for working with vault files

---

> This folder is a staging location only. For actual deployment, vaults are typically downloaded or delivered via secure channels — not served from the web root.


