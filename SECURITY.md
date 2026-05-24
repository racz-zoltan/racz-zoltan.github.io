# 🔐 Security Policy

CarryPass is an open-source, client-side credential manager designed
for users who need strong privacy guarantees without depending on
cloud-stored credentials or server-side trust. This policy describes
how to report security issues, what is in and out of scope, and how
the project handles responsible disclosure.

---

## 📬 Reporting a Vulnerability

If you discover a security vulnerability or cryptographic flaw in
CarryPass, please disclose it **responsibly** and **privately**.

- 📧 Contact: [carrypass-info@proton.me](mailto:carrypass-info@proton.me)
- Include:
  - A detailed description of the issue
  - Steps to reproduce
  - The potential impact
  - (Optional) Suggested fix or improvement

We aim to respond within **5 business days** and will work with you to
validate and resolve the issue promptly. Please do **not** disclose
vulnerabilities in public GitHub issues — use email first.

---

## 🔎 Scope of Disclosure

The following components are **in scope** for responsible disclosure:

### Application surface

- [https://carrypass.net](https://carrypass.net) — the current
  Progressive Web App
- The source code in this repository
- Service worker caching strategy and offline behavior

### Cryptographic surface

- **Authentication pipeline** — the combined passphrase plus
  adaptive chained icon derivation that produces the application's
  root secret
- **Adaptive icon derivation chain** — the multi-round icon-grid
  derivation, including per-step Argon2id stretching and the
  deterministic generation of subsequent grids from previous-step
  state
- **Session key derivation** — HKDF-SHA256 sub-key separation from
  the root secret, domain-separation strings, and the `appMaster`
  memory-hygiene lifecycle
- **Per-credential password derivation** — service-bound input
  derivation, per-credential Argon2id stretching, and the backward-
  attack defense it provides
- **AES-GCM construction** — IV uniqueness, AAD encoding consistency
  across encrypt/decrypt paths (`stableStringify`), and authenticated
  metadata handling
- **Local storage encryption** — the canary, the screen lock
  verifier, encrypted service settings, and the saved identifier
  field

### Team-vault surface

- **Member key derivation** — the combined password and TOTP-secret
  input, and its symmetry between member finalization and member
  import
- **Per-export team-key rotation** — atomicity, forward-cut
  revocation semantics, and the single-admin cardinality invariant
- **Trusted-device enrollment** — QR-onboarding payload structure,
  enrollment metadata handling, and the local storage protection of
  the TOTP secret
- **Settings export/import (`.cpex`)** — the encrypted bundle format
  and the cross-device recovery path

### Screen lock

- Screen lock code derivation and verifier construction
- Failed-attempt handling and the session-wipe transition

---

### 🚫 Out of Scope

The following are **explicitly excluded** from the scope of this
policy:

- Any **legacy versions** of CarryPass (e.g., prior password
  generator tools still linked for reference) — including
  [https://carrypass.net/legacy-password-generator.html](https://carrypass.net/legacy-password-generator.html)
- Compromise of the **hosting infrastructure** (self-hosted servers for private deployments).
  CarryPass ships as static files with bundled dependencies, but the
  hosting platform itself remains trusted. This is documented as
  out-of-scope in the whitepaper.
- Compromise of the **build pipeline** producing the deployed
  artifacts
- **Browser-level vulnerabilities** affecting the Web Cryptography
  API or the JavaScript runtime
- Issues in **third-party libraries** that have not been confirmed
  to affect CarryPass's actual usage
- **Full-device compromise** scenarios (malware with full memory or
  screen access)

> Legacy tools are retained only for archival reference and do not
> reflect the current security architecture. We recommend using only
> the actively maintained CarryPass PWA for secure use.

> Vulnerabilities outside this scope (e.g., browser bugs, hosting
> platform infrastructure, GitHub itself) should be reported to the
> appropriate platforms.

---

## 🎯 Current Audit Focus

CarryPass actively welcomes scrutiny of the following areas. These
are the design choices most worth examining for a security
researcher:

### Authentication and key derivation

- The **adaptive chained icon derivation** and its design goal of
  imposing serial computation per passphrase candidate — a structure
  intended to provide concrete protection in the partial-input-
  capture threat model (for example, when a keylogger has captured
  the passphrase text but not the icon sequence). The chain ensures
  that even with a known passphrase, an attacker cannot parallelize
  the brute-force across icon-sequence candidates within that
  passphrase: each round's grid depends on the previous round's
  selection state, so candidates must be evaluated serially per
  passphrase candidate. The total input entropy combines the
  passphrase entropy and the icon-sequence entropy — both
  contribute to the cryptographic root secret as a single unified
  input to Argon2id.
- The **per-step state update construction** — whether the
  state-derivation function has any exploitable algebraic structure
  that could let an attacker shortcut the serial-evaluation
  requirement
- **Session randomization** of icon positions — whether the visual
  shuffle adequately separates positional capture from identity
  capture, given that the user authenticates by recognizing icon
  identities rather than memorizing positions
- The **per-step Argon2id parameters** and their cumulative cost
  versus the login-time budget — including whether the chosen
  parameters give meaningful per-step resistance to GPU/ASIC
  speedup
- The transition from `appMaster` to derived session sub-keys, and
  whether `appMaster` zeroing is complete and correctly timed

### Per-credential password generation

- The **site-binding stage** that produces a service-specific input
  before per-credential Argon2id, and whether different services
  produce cryptographically uncorrelated outputs
- The **rejection-sampling** logic that converts HKDF keystream
  bytes into characters meeting class requirements
- Whether **deterministic regeneration** truly recovers identical
  output across devices given identical inputs

### Team vault

- Member key derivation symmetry between `finalizeMember` and
  `importMemberVaultFromJson` (both must use combined password and
  TOTP secret)
- The **single-admin cardinality invariant** — whether any code path
  can produce a vault with zero or multiple finalized admins
- **AAD construction** consistency across all encrypt/decrypt calls
  via `stableStringify`
- Per-export team-key rotation atomicity — whether a partial export
  can leave members with mismatched keys

### Local storage and memory hygiene

- The **empty-plaintext canary** used to verify login correctness —
  whether the AES-GCM auth-tag-only verification is sound
- The **screen lock verifier** construction (which also uses
  empty-plaintext AES-GCM) and its 3-strikes session-wipe behavior
- Whether any sensitive intermediate value is logged, stored in
  closures, or retained beyond its useful lifetime

### Settings export and migration

- The encrypted `.cpex` bundle format and what it includes
- Whether the cross-device migration path preserves all necessary
  state without exposing additional attack surface

---

## 🤝 Responsible Disclosure & Legal Assurance

CarryPass respects ethical security research. If you:

- Follow responsible disclosure practices
- Do not exploit vulnerabilities for malicious purposes
- Report issues privately and respectfully

We commit to:

- Working with you in good faith
- Never initiating legal action for good-faith research
- Crediting you (with your consent) if your report leads to an
  improvement

---

## 🏅 Responsible Disclosure Acknowledgments

We gratefully acknowledge those who have contributed to the security
of CarryPass through responsible disclosures:

| Name / Alias        | Contribution                  | Date    |
|---------------------|-------------------------------|---------|
| *(Your name here?)* | *(First entry placeholder)*   | *(TBD)* |

If you submit a valid report and would like public credit, we will
gladly list you here.

---

## 🔐 Security Philosophy

CarryPass is built around a **stateless, client-side cryptographic
model**. The system avoids persistent master-secret storage, relies
on deterministic reproducibility from user inputs, and intentionally
keeps no server-side trust requirement.

What this means in practice:

- **Nothing sensitive leaves your device.** All cryptographic
  operations happen locally in the browser.
- **No password recovery exists.** A forgotten passphrase means lost
  access. This is a deliberate trade-off in favor of zero-knowledge
  guarantees.
- **The local code is the source of truth.** Anyone can audit the
  JavaScript that runs in their browser.

CarryPass does **not** claim:

- Protection against full-device compromise (malware with memory or
  screen access)
- Protection against compromised hosting infrastructure
- Hardware-backed multi-factor authentication
- Post-quantum cryptographic guarantees

For detailed technical context, see:

- **[Technical Overview](./carrypass-technical-overview.md)** —
  user-facing architecture document
- **[Whitepaper](./carrypass-whitepaper.md)** — full audit-oriented
  technical specification

> **Note:** these documents are being updated to reflect the current
> adaptive icon architecture. If you observe a discrepancy between
> any document and the deployed code, the deployed code is
> authoritative — please report the discrepancy so we can update the
> documentation.

---

## 🧠 Contact

For security concerns or suggestions:

- Email: [carrypass-info@proton.me](mailto:carrypass-info@proton.me)
- GitHub Issues: Please **do not** disclose vulnerabilities in
  public issues. Use email first.

---

## 🔁 Policy Updates

This policy was last updated on **2026-05-23**. We may update it
periodically to reflect changes in the project or legal framework.

---

> _Thank you for helping make CarryPass safer and more
> privacy-respecting for everyone._
