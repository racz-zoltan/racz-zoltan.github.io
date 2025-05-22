# 📁 .well-known/

This folder contains standard public metadata files used by security researchers, browsers, and automated tools to interact with **CarryPass** in a structured, privacy-aware way.

These files follow [IETF standards](https://datatracker.ietf.org/doc/html/rfc8615) and are **publicly accessible** at:

- 🔗 [https://carrypass.net/.well-known/security.txt](https://carrypass.net/.well-known/security.txt)

> Note: If hosted via GitHub Pages, a `.nojekyll` file must exist in the project root to ensure `.well-known/` is correctly published.

---

## 📄 Included Files

| File                  | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `security.txt`        | Contact and disclosure policy for ethical hackers (per [RFC 9116](https://datatracker.ietf.org/doc/html/rfc9116)) |
| `README.md`           | This document explaining the purpose of the `.well-known/` folder           |
| *(optional)* `change-password` | Used by some browsers for password change automation *(not yet implemented)*  |

---

## 🛠️ Implementation Notes

- `.well-known/` is intended for **automated tools**. Humans typically don’t visit it, but when they do via GitHub, this `README.md` helps clarify intent.
- Files placed here should be **plaintext and standardized** — not JavaScript or app logic.
- You should avoid placing private files here.

---

If you have any questions about this folder or would like to suggest improvements to CarryPass's security policy, please see [SECURITY.md](../SECURITY.md).
