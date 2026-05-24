# 🔐 CarryPass Vault Folder

This folder is reserved for storing encrypted vault data used by the CarryPass PWA — including admin, member, and team-level credential exports.

## 📁 Typical Files (Encrypted Artifacts)

- `team-vault.json`  
  Vaults for individual team members, encrypted with the member’s PBKDF2-derived key.


## 📦 Folder Purpose

This directory supports:
- Admin exports of encrypted vaults for secure delivery or backup
- Import into the CarryPass frontend via manual upload or service-worker delivery
- Clear separation between admin, team, and member data

## 🔒 Security Notes

- All files are encrypted **client-side** using AES-GCM with new nonces per export
- No plaintext credentials are ever written here

## 🚫 Deployment Warning

If you deploy CarryPass on **static platforms** like GitHub Pages, Netlify, or Vercel:
- This `README.md` ensures the `vault/` folder is preserved even if it’s empty
- You may still need manual upload mechanisms for working with vault files

