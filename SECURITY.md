# 🔐 Security Policy

## 📬 Reporting a Vulnerability

If you discover a security vulnerability or cryptographic flaw in CarryPass, we encourage you to disclose it **responsibly** and **privately**.

- 📧 Contact: [info.carrypass@proton.me]
- Include:
  - A detailed description of the issue
  - Steps to reproduce
  - The potential impact
  - (Optional) Suggested fix or improvement

We aim to respond within **5 business days** and will work with you to validate and resolve the issue promptly.

---

## 🔎 Scope of Disclosure

The following **components are in scope** for responsible disclosure:

- [https://carrypass.net](https://carrypass.net) (current PWA)
- The source code in this repository
- Cryptographic logic (Argon2, PBKDF2, AES-GCM/CTR)
- Password generation using deterministic inputs
- Vault encryption/decryption logic
- TOTP-based onboarding and team access flows

---

### 🚫 Out of Scope

The following are **explicitly excluded from the scope of this policy**:

- Any **legacy versions** of CarryPass (e.g., prior password generator tools still linked for reference)
- [https://carrypass.net/legacy-password-generator.html](https://carrypass.net/legacy-password-generator.html) 

> These tools are retained only for backward compatibility or archival purposes and do not reflect the current security architecture. We recommend using only the actively maintained CarryPass PWA for secure use.

---

> Vulnerabilities outside this scope (e.g., browser bugs, GitHub infrastructure) should be reported to the appropriate platforms.

---

## 🤝 Responsible Disclosure & Legal Assurance

CarryPass respects ethical security research. If you:
- Follow responsible disclosure practices
- Do not exploit vulnerabilities for malicious purposes
- Report issues privately and respectfully

We commit to:
- Working with you in good faith
- Never initiating legal action for good-faith research
- Crediting you (with your consent) if your report leads to an improvement

---

## 🏅 Responsible Disclosure Acknowledgments

We gratefully acknowledge those who have contributed to the security of CarryPass through responsible disclosures:

| Name / Alias     | Contribution                                   | Date        |
|------------------|------------------------------------------------|-------------|
| *(Your name here?)* | *(First entry placeholder)*                    | *(TBD)*     |

If you submit a valid report and would like public credit, we will gladly list you here.

---

## 🔐 Philosophy of Security

CarryPass is built with a **zero-knowledge architecture** and a commitment to client-side, offline-first security. We welcome audits and feedback on:

- Cryptographic assumptions and implementations
- Password derivation functions and entropy
- Key handling, nonce usage, and encryption strategies
- TOTP onboarding flows and QR handling

---

## 🧠 Contact

If you have security concerns or suggestions:
- Email: [info.carrypass@proton.me]
- GitHub Issues: Please **do not** disclose vulnerabilities in public issues. Use email first.

---

## 🔁 Updates to This Policy

This policy was last updated on **2025-05-22**. We may update it periodically to reflect changes in the project or legal framework.

---

> _Thank you for helping us make CarryPass safer and more privacy-respecting for everyone._
