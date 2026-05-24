# 📁 `.well-known/`

This folder contains standard public metadata files used by security researchers, browsers, and automated tools to interact with **CarryPass** in a structured, privacy-aware way.

These files follow the general `.well-known` convention defined by RFC 8615 and are intentionally public.

Public endpoint:

- `https://carrypass.net/.well-known/security.txt`

> **GitHub Pages note:** if this project is hosted through GitHub Pages, a `.nojekyll` file should exist in the project root. This helps ensure that the `.well-known/` directory is published correctly.

---

## 📄 Included Files

| File | Purpose |
|---|---|
| `security.txt` | Security contact and responsible disclosure metadata for researchers and automated tools. |
| `README.md` | This explanatory document for humans browsing the repository. |
| `change-password` | Placeholder note only. CarryPass does not use account-based passwords or server-side password reset flows. |

---

## 🛠️ Implementation Notes

- `.well-known/` is intended for **automated tools**. Humans typically do not visit it, but when they do via GitHub, this `README.md` helps clarify the purpose of the folder.
- The `change-password` file is included only to explain that CarryPass has no central account password to change. If a real account-based password change flow is ever introduced, this file should be replaced with a proper redirect or endpoint.

---

## 🔐 CarryPass Context

CarryPass is a client-side, privacy-first credential sharing and password generation system. It does not provide user accounts, server-side password storage, or central password recovery.

For this reason, `.well-known/security.txt` is used only to publish a security contact and disclosure policy. It does not imply that CarryPass stores user credentials or manages user accounts on a server.

For vulnerability reporting and disclosure guidance, see:

- [`SECURITY.md`](../SECURITY.md)
