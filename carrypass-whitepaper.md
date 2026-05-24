# CarryPass — Security & Technical Whitepaper

**Privacy-First Credential Management**
Architecture · Cryptographic Design · Threat Model

May 2026
[https://carrypass.net](https://carrypass.net)

*© 2026 CarryPass*

---

## Audit Notice

This document describes the architecture and cryptographic design of CarryPass. The primitives used — Argon2id, AES-GCM, HKDF-SHA256, SHA-256, HMAC-SHA1 (RFC 6238 TOTP) — are well-established and independently vetted by the broader cryptographic community.

What has not been independently verified is the correctness of their implementation in this specific codebase: whether primitives are composed correctly, whether key material is handled safely in memory, whether AAD encoding is byte-identical between encrypt and decrypt paths, and whether edge cases in the derivation pipeline behave as intended. That is the scope of a future independent security audit.

This document is structured to support such an audit. Where claims rest on assumptions about the runtime environment or user behavior, those assumptions are stated explicitly. Where defense is partial or scoped, the boundary is named.

The source code in `carrypass.js` is the authoritative reference. If a discrepancy exists between this document and the code, the code is correct and the document must be corrected.

---

## 1. Scope and Purpose

CarryPass is a stateless, client-side credential management system. All sensitive operations — credential generation, vault encryption, access control — are performed locally in the user's browser. No master secrets, plaintext credentials, or reusable root keys are stored persistently on any server. The system derives all cryptographic material from user-controlled input.

This document covers:

- Master secret derivation, the adaptive icon authentication chain, and sub-key hierarchy
- Deterministic credential generation (identity and regular modes)
- Team-based credential sharing, access control, and per-export key rotation
- Trusted-device authentication and the TOTP secret as a cryptographic factor
- Encrypted vault structure, distribution, and integrity model
- Local storage usage and protection of client-side metadata
- Data lifecycle: creation, usage, rotation, expiry, revocation
- Cryptographic design and separation of domains
- Threat model boundaries and security assumptions
- Deployment-layer protections

---

## 2. Master Secret Derivation Pipeline

### 2.1 Design rationale

CarryPass is stateless. It cannot rely on a server-side verifier, a server-side key-stretching pepper, or a remotely stored vault key to strengthen authentication. The full strength of authentication and deterministic generation must come from secrets the user can reproduce locally and from a derivation pipeline that makes offline guessing materially more expensive than direct hash comparison.

The pipeline achieves four goals:

- Avoid persistent storage of any reusable master secret
- Make offline guessing memory-hard rather than CPU-cheap
- Bind authentication to multiple components beyond a single typed string
- Distribute cryptographic cost across stages in proportion to the threats each defends against

### 2.2 Authentication input components

Authentication uses two user-reproduced components that combine into a single cryptographic input:

- **The textual passphrase.** Minimum 16 characters; registration enforces a zxcvbn-derived entropy threshold of 80 bits.
- **The adaptive icon sequence.** Twelve ordered icon selections across three sequential grids of 25 icons each, drawn deterministically from a 314-icon pool.

Both components are required for any cryptographic operation. The two are not separable "factors" in the traditional MFA sense — they jointly feed a single Argon2id derivation that produces the application's root secret. Knowledge of one without the other is not sufficient.

### 2.3 Adaptive chained icon derivation

CarryPass uses an adaptive visual secret path rather than a single static graphical password grid. The structure is a chained derivation: each icon selection updates an internal cryptographic state, and the next grid is derived deterministically from that state.

**Profile** (current):

```
identifier:           CarryPass Adaptive 3×4 v4
rounds:               3
selections per round: 4
total selections:     12
grid size:            25 icons per round
icon pool:            314 distinct icons (bundled)
```

**Per-step parameters:**

| Stage | Argon2id parameters |
|---|---|
| Initial state derivation | t=2, m=64 MiB, p=1 |
| Per-step state transition (×12) | t=2, m=64 MiB, p=1 |
| Final icon hash | t=3, m=96 MiB, p=1 |

**Derivation sequence:**

```
initialState = Argon2id(
    pass = "CarryPass/adaptive-icon-base/v4" || passphrase,
    salt = "CarryPass adaptive icon base v4",
    t=2, m=64 MiB, p=1
)

grid_1 = deterministic_shuffle(ICON_POOL_314, initialState, "round-1")[:25]

# Round 1: four selections, each updating the state
for n in 1..4:
    state_n = Argon2id(
        pass = "CarryPass/adaptive-icon-step/v4" || state_(n-1) || selectedIcon_n,
        salt = "CarryPass adaptive icon step <absoluteStep> v4",
        t=2, m=64 MiB, p=1
    )

grid_2 = deterministic_shuffle(ICON_POOL_314, state_4, "round-2")[:25]
# Round 2: four more selections, states state_5..state_8

grid_3 = deterministic_shuffle(ICON_POOL_314, state_8, "round-3")[:25]
# Round 3: four more selections, states state_9..state_12

finalIconHash = Argon2id(
    pass = "CarryPass/adaptive-icon-final/v4" || state_12,
    salt = "CarryPass adaptive icon final v4",
    t=3, m=96 MiB, p=1
)
```

`deterministic_shuffle` is a Fisher-Yates shuffle seeded by a SHA-256 of the round-start state and a context string, producing a deterministic permutation of the icon pool. The first 25 elements are taken as that round's grid.

Visible icon positions within each grid are randomized per session using `crypto.getRandomValues`, decoupling the persistent cryptographic identity of an icon from its on-screen location.

### 2.4 Security properties of the chained derivation

**Each round's grid depends on the previous round's selections.** An attacker cannot enumerate later rounds without first evaluating earlier ones for a given passphrase candidate. This imposes a serial computation requirement per candidate, limiting parallelization within a single passphrase candidate.

**The icon sequence is bound into key derivation, not checked separately.** A wrong icon selection does not "fail validation" — it produces a different deterministic state and therefore a different `finalIconHash`, leading to a different `appMaster`, leading to a canary that fails to decrypt. The icon path is part of the cryptographic root, not a UI gate.

**Visible coordinates are uninformative.** Raw click coordinates leak no stable information about icon identities, because grid positions are randomized each session. The user authenticates by recognizing icon identities; the coordinate transcript across multiple sessions is uncorrelated.

**Combined input entropy.** The passphrase contributes its zxcvbn-evaluated entropy (≥80 bits enforced). The icon sequence contributes additional entropy from the user's choice of 12 ordered selections; with grid size 25 and order-sensitivity, the upper bound for icon-sequence entropy per round is `log₂(25 × 24 × 23 × 22) ≈ 18.2` bits per round, with the chain structure determining how this composes across rounds. Both entropies feed the same final Argon2id derivation as `passphrase || finalIconHash`.

**Scope clarification.** The adaptive icon chain raises the cost of single-channel input capture: keystroke-only logging misses the icon sequence; coordinate-only logging misses the icon identities; a single-frame screenshot misses the chained progression. It does not defeat full UI capture (malware observing screen, DOM, memory, and keystrokes simultaneously). The correct claim is improved resistance to partial input capture, not defeat of all keylogging.

### 2.5 Registration teaching phase

Registration uses a three-pass teaching flow:

1. **Initial selection.** The user chooses 12 icons across the three deterministic grids.
2. **Guided practice.** The correct icons are briefly highlighted to reinforce recognition memory.
3. **Unguided confirmation.** The user repeats the path without assistance.

The teaching phase builds recognition memory for icon identities rather than positional memory, which is essential given per-session position randomization.

### 2.6 Visual passphrase fingerprint

As the user types their passphrase during login, CarryPass displays a small visual fingerprint (colored characters) derived deterministically from the input via SHA-256, truncated to a short user-recognizable projection.

The fingerprint helps users recognize typing mistakes without revealing the passphrase on screen. It is one-way and informational — it is not an authentication factor and does not appear in any cryptographic derivation.

### 2.7 Login derivation and sub-key hierarchy

After the adaptive icon flow produces `finalIconHash`, the application root secret is derived:

```
salt      = SHA-256("carrypass-appMaster-v4::" || finalIconHash)
appMaster = Argon2id(
    pass = passphrase,
    salt = salt,
    t=4, m=128 MiB, p=1,
    hashLen = 32
)
```

`appMaster` is a 32-byte `Uint8Array` held in memory only. It is never persisted.

Immediately after derivation, five domain-separated sub-keys are derived from `appMaster` via HKDF-SHA256, and `appMaster` is then zeroed.

| Sub-key | HKDF info string | Purpose |
|---|---|---|
| `vaultCanaryKey` | `carrypass-canary-key-v4` | AES-GCM key for login verification |
| `sessionKey` | `carrypass-session-key-v4` | AES-GCM key for local-data encryption |
| `totpSecretKey` | `carrypass-totp-secret-key-v4` | AES-GCM key for the stored TOTP secret |
| `passwordKey` | `carrypass-password-key-v4` | HKDF input key for per-credential password generation |
| `screenLockBaseKey` | `carrypass-screenlock-base-v4` | HKDF input key for the screen lock verifier |

Each sub-key is imported as a non-extractable `CryptoKey` where the Web Crypto API allows. The raw bytes are not held in the JavaScript heap; only opaque key handles are.

After all five sub-keys are derived, `zeroAppMaster()` is called: the `appMaster` `Uint8Array` is overwritten with zeros via `.fill(0)` and the reference is set to `null`. From this point in the session forward, no single root key exists in process memory. The five sub-keys persist until logout, screen-lock failure, or 30-minute inactivity wipe.

### 2.8 Login verification via empty-plaintext canary

CarryPass does not perform a separate password-check step. At registration, the system encrypts an empty plaintext under `vaultCanaryKey`:

```
ciphertext, iv = AES-GCM-encrypt(vaultCanaryKey, plaintext = new Uint8Array(0))
localStorage.vaultCanary = JSON.stringify({ iv, ciphertext })
```

At login, the freshly-derived `vaultCanaryKey` is used to attempt decryption:

```
try:
    AES-GCM-decrypt(vaultCanaryKey, ciphertext, iv)  // result discarded
    // verification: ok
except:
    // verification: fail
```

The stored canary consists of only the IV and the 16-byte AES-GCM authentication tag. The AES-GCM tag is what verifies key correctness; if the derived `vaultCanaryKey` is wrong, the tag does not validate and decryption throws.

**Properties:**

- **No known-plaintext exposure.** The plaintext is empty. An attacker with stolen `localStorage` has IV and auth tag only — no encrypted content to attack offline.
- **No asymmetric verification oracle.** A wrong attempt costs the same as a correct attempt: one full adaptive icon flow plus one login Argon2id. There is no cheaper fast-path that an attacker could exploit.

### 2.9 Screen lock

CarryPass supports a temporary screen lock that allows the user to walk away without re-performing the full passphrase + adaptive icon flow on resume. The lock derives a verifier key from `screenLockBaseKey` and the typed code:

```
verifyKey = HKDF-Expand(
    screenLockBaseKey,
    salt = randomSalt,
    info = "carrypass-screenlock-v4::" || code
)

// Lock activation
ciphertext, iv = AES-GCM-encrypt(verifyKey, plaintext = empty)
screenLockState = { ciphertext, iv, salt }   // in memory only

// Unlock attempt
verifyKey' = HKDF-Expand(screenLockBaseKey, salt, info = "carrypass-screenlock-v4::" || typedCode)
try:
    AES-GCM-decrypt(verifyKey', ciphertext, iv)
    // unlock: ok
except:
    // unlock: fail (increment retry counter)
```

**`appMaster` is not involved in the screen lock.** By the time the user can activate a lock, `appMaster` has long been zeroed (Section 2.7). The lock operates on the five session sub-keys: a successful unlock resumes the session with sub-keys still in memory; a failed unlock (after the retry limit) wipes them.

**Naming.** The feature is deliberately called "screen lock code" rather than "PIN." The PIN terminology, common in banking and device-unlock contexts, suggests hardware-enforced rate limiting that this feature does not provide. CarryPass's screen lock operates at the session level inside a browser tab.

**Structural protections:**

- `screenLockState` lives only in memory; never persisted to `localStorage`, `IndexedDB`, or any durable storage.
- After three wrong attempts (`MAX_RETRIES = 3`), all five session sub-keys are nulled; the user must perform full login again.
- A 30-minute inactivity timer triggers the same wipe automatically.

**Code strength.** The 6-character minimum on the screen lock code defends against casual passerby guessing within the 3-attempt limit. A 6-character alphanumeric code presents on the order of 10^9 to 10^11 possibilities, sufficient that three random guesses succeed with negligible probability. The code is not designed to defend against a memory-access attacker; the structural defenses are what bound that threat.

### 2.10 In-memory handling

`appMaster` exists as a `Uint8Array` between sub-key derivation and `zeroAppMaster()`, a window of microseconds in normal operation. After zeroing, it cannot be reconstructed without re-running the full login flow.

The five session sub-keys persist until logout, three-strike screen-lock failure, or 30-minute inactivity. Each is held as a non-extractable `CryptoKey` where the Web Crypto API allows. Logout sets all five to `null`.

Browser JavaScript engines may produce internal copies of `Uint8Array` contents during use. The `.fill(0)` operation is best-effort scrubbing and cannot guarantee that no residual copies exist in engine-managed memory. This is a known limitation of the runtime environment.

---

## 3. Threat Model

### 3.1 Assumed attacker capabilities (in scope)

- **Theft of local data.** Offline access to `localStorage`, exported vault blobs, and cached PWA assets.
- **Offline brute-force.** Repeated key-derivation attempts against captured ciphertext.
- **Partial input capture.** Keystroke logging *or* mouse logging *or* a single-frame screenshot — but not all of them combined with full UI context.
- **Network observation.** Of in-transit data (mitigated by HTTPS but not assumed away).
- **Possession of a leaked team-vault file.** By any means.
- **A removed member retaining a previously-distributed vault file.**

### 3.2 Out-of-scope attacker capabilities

- **Full device compromise.** Malware with memory, DOM, and execution access defeats any client-side application running on that device.
- **Full UI capture.** An attacker observing screen, keyboard, mouse, and DOM simultaneously can replay the entire authentication flow.
- **Browser-level compromise.** A browser bug or malicious extension intercepting Web Crypto API calls or modifying JavaScript execution.
- **Compromise of the hosting infrastructure.** CarryPass ships as static files with all dependencies bundled at build time; there are no external CDN calls at runtime. The hosting platform itself (Vercel for the public deployment, or self-hosted servers) remains trusted. A compromised platform can serve modified files with matching SRI hashes, undetectable by SRI verification.
- **Compromise of the build pipeline** producing the deployed artifacts.
- **Supply-chain attacks** on bundled third-party dependencies (`argon2-browser` WASM, zxcvbn, qrcode, html5-qrcode, DOMPurify).
- **Compromised PWA service worker** (which would have full fetch interception and code execution).
- **Brute-force of the screen lock code against captured `screenLockState`** given memory access. The defense here is structural (Section 2.9), not Argon2-cost.

### 3.3 Security goals within scope

| Goal | Mechanism |
|---|---|
| Resistance to offline guessing of the master input | Adaptive chained icon Argon2id + login Argon2id (t=4, m=128 MiB) |
| No persistent master secret exposure | Passphrase, icon sequence, `appMaster` never stored |
| Two-component secret reconstruction | Both passphrase and icon sequence required |
| Reduced effectiveness of single-channel logging | Icon sequence not captured by keyboard loggers; positions randomized per session |
| Domain separation across cryptographic uses | Distinct version-tagged context strings per derivation |
| Forward attack resistance (vault → master) | Argon2id at login + per-step Argon2id in the icon chain |
| Backward attack resistance (leaked service password → `appMaster`) | Per-credential Argon2id stage with service-bound input (Section 5.3) |
| Forward-cut for revoked members | Per-export team-key rotation (Section 4.7) |
| Vault tamper-evidence | AES-GCM auth tag + AAD over metadata |
| Strong file-leak floor | 160-bit TOTP secret bound into member key derivation (Section 4.3) |
| Tamper-evident sub-key separation | Domain-separated HKDF info strings; compromise of one sub-key does not yield others |

### 3.4 Threat mitigation summary

| Threat | Mitigation | Residual Risk |
|---|---|---|
| Offline brute-force of master passphrase | Login Argon2id (t=4, m=128 MiB); adaptive icon chain imposes serial computation per candidate; 80-bit passphrase entropy minimum | Depends on user choosing a passphrase meeting the threshold |
| Offline brute-force of generated service passwords | Per-credential Argon2id (t=3, m=64 MiB) with service-bound input | Depends on `appMaster` entropy, which derives from passphrase + icon chain |
| Backward attack: leaked service password → `appMaster` | Site-binding HKDF stage produces uncorrelated per-service inputs; per-credential Argon2id forces memory-hard work per recovery attempt | Bounded by combined passphrase + icon entropy and Argon2id cost |
| Keystroke logging | Icon sequence not captured by keyboard loggers; chained into KDF input | Full UI capture defeats this |
| Stolen vault file | All sections AES-GCM encrypted; member keys derived from password + 160-bit TOTP secret | File-leak floor bounded by 160-bit TOTP secret entropy |
| Vault metadata tampering | AAD on AES-GCM covers all metadata (version, expiry, IDs, flags including `is_admin`) | Tampering causes decryption to fail; cannot be bypassed via app UI |
| Removed member retains forward access via cached vault | Per-export team-key rotation: removed member's old keys decrypt only the frozen old file | Old credential disclosures cannot be undone (Section 3.5) |
| Cross-member data leakage | Per-member encryption; member vault contains only assigned `team_keys`; only the admin-flagged member's plaintext contains operational data | Admin error in assignment |
| Replay of trusted-device state | Device-local TOTP secret stored in `localStorage` encrypted under `totpSecretKey` | Full device compromise extracts secret |
| Tampered script delivery (in-transit) | SRI SHA-384 hashes on all `<script>` tags | Effective only if the hosting infrastructure is honest |
| Compromised hosting infrastructure or build pipeline | Out of scope | Acknowledged limitation; users with this threat model should not rely on web-delivered applications |
| Phishing via lookalike domains | Deterministic generation produces different passwords for different inputs; saved-service comparison indicator (Section 5.6) | Indicator only protects services already saved on this device |

### 3.5 Specific clarifications

**TOTP scope.** TOTP serves a dual role in CarryPass:

- **As a cryptographic key factor.** The TOTP secret (a 20-byte / 160-bit random value generated at member finalization, stored encrypted on the trusted device under `totpSecretKey`) is bound into the member's key derivation: `Argon2id(password || "::" || totpSecret, salt)`. An attacker without the TOTP secret cannot derive the member key regardless of password knowledge. This raises the file-leak floor from "weakest password" to "weakest TOTP secret" — uniformly random 160-bit values, effectively unguessable.

- **Not as a typed code at unlock.** Unlike traditional TOTP integrations, CarryPass does not require the user to type a 6-digit code at vault import. The TOTP secret in the trusted device's `localStorage` is used directly as cryptographic material. This avoids the UX friction of typed codes and aligns the cryptographic and UX models — possession of the trusted device is what matters, not real-time code generation.

The TOTP secret is also held in the admin's vault (inside the admin's encrypted `admin_data`) so that if a member loses their device, the admin can re-issue the QR code. The admin's copy serves as a backup for re-issue, not as an additional decryption path.

**Weakest-secret-sets-the-floor (revised).** With TOTP secrets bound into key derivation, a leaked vault file's effective security against any specific team's contents is bounded by the weakest *combined* secret (password + TOTP secret) of any member assigned to that team. Since all TOTP secrets are uniformly random 160-bit values, the floor is approximately 160 bits — substantially stronger than the password-only floor.

**Revocation has two components, only one of which CarryPass provides.** Removing a member from CarryPass and exporting a new vault produces a forward-cut: the removed member cannot decrypt content in the *new* vault file (Section 4.7). This is a real cryptographic property of the design.

What CarryPass does *not* provide:

- Invalidation of vault files the removed member already possesses. Those files still decrypt under the keys they were exported with. The removed member's view is frozen at their last export, but they still see it.
- Invalidation of credentials the removed member has already seen. CarryPass cannot un-disclose a password shown to a member. Real revocation of access to the *underlying services* requires rotating those services' credentials.

The combination of per-export team-key rotation (CarryPass) and credential rotation on the underlying services (admin discipline) provides full revocation. Either alone is partial.

---

## 4. Team Vault Architecture

### 4.1 Vault structure

The exported vault is a JSON file with this top-level shape:

```json
{
  "version": "carrypass-team-vault-v4",
  "vault_metadata": {
    "version": "carrypass-team-vault-v4",
    "expiry": "2026-12-31"
  },
  "members": {
    "<memberId>": {
      "data": "<base64 ciphertext>",
      "metadata": {
        "version": "carrypass-team-vault-v4",
        "memberId": "<memberId>",
        "is_admin": true,
        "expiry": "2026-12-31",
        "pending": false,
        "salt": "<base64 16 bytes>",
        "nonce": "<base64 12 bytes>"
      }
    }
  },
  "teams": {
    "<teamId>": {
      "data": "<base64 ciphertext>",
      "metadata": {
        "version": "carrypass-team-vault-v4",
        "teamId": "<teamId>",
        "nonce": "<base64 12 bytes>"
      }
    }
  }
}
```

Two cryptographically distinct layers (members, teams) carry independent ciphertexts encrypted under different keys. There is no separate admin section in the file format — admin operational data lives inside the encrypted plaintext of the admin-flagged member.

The `vault_metadata` block at the top level holds the global vault expiry. This is informational metadata only; it lives outside any AEAD and is not enforced cryptographically.

### 4.2 Authenticated metadata (AAD)

Every encrypted section uses AES-GCM with the section's metadata serialized as Additional Authenticated Data. The serialization uses a recursive sorted-keys `stableStringify` function to ensure byte-identical output across encrypt and decrypt paths.

**Properties:**

- Tampering with any metadata field (`version`, `memberId`, `teamId`, `is_admin`, `expiry`, `pending`, `salt`, `nonce`) causes AES-GCM decryption to throw on auth tag mismatch.
- The auth tag covers ciphertext and metadata simultaneously; no separate HMAC is needed or used.
- The `is_admin` flag in particular is AAD-bound: an attacker cannot promote a non-admin member to admin by flipping the metadata flag, because the auth tag would fail.
- Pre-decryption checks of unauthenticated metadata are used only for UI hints and routing. Flipping any AAD-bound value causes verification to fail, so the only effect of tampering is denial of service — never privilege escalation.

### 4.3 Member key derivation

Each member's `password_derived_key` is derived at finalization time:

```
combinedInput = passwordBytes || "::" || totpSecretBytes
memberKey     = Argon2id(
    pass = combinedInput,
    salt = "team-vault-v4::member::" || memberSalt,
    t=3, m=96 MiB, p=1,
    hashLen = 32
)
```

`totpSecret` is a freshly generated 20-byte random value (160 bits of entropy from `crypto.getRandomValues`).

At decryption time, the member's device reads `totpSecret` from `localStorage` (decrypted under `totpSecretKey`), the user types their password, and the same `combinedInput` is reconstructed. The same `memberKey` is derived; decryption succeeds.

**Cryptographic implication.** The member's input entropy is `password_entropy + 160 bits`. An attacker with the vault file but without the TOTP secret cannot derive the member key regardless of password knowledge — the 160-bit uniformly random secret dominates the search space.

### 4.4 Member sections

Every member's plaintext payload has the same structural shape:

```json
{
  "id": "<memberId>",
  "name": "Display Name",
  "team_keys": {
    "<teamId>": "<base64 32-byte AES key>",
    ...
  },
  "admin_data": null
}
```

For non-admin members, `admin_data` is `null`. For the admin-flagged member, `admin_data` is populated:

```json
{
  "id": "<memberId>",
  "name": "Display Name",
  "team_keys": { ... },
  "admin_data": {
    "members": {
      "<memberId>": {
        "id": "...",
        "name": "...",
        "password_derived_key": "<base64>",
        "totp_secret": "<base32>",
        "team_keys": { ... },
        "salt": "<base64>",
        "expiry": "...",
        "is_admin": true,
        "pending": false
      },
      ...
    },
    "teams": {
      "<teamId>": {
        "id": "...",
        "name": "...",
        "team_key": "<base64>",
        "credentials": [ ... ]
      },
      ...
    }
  }
}
```

The admin's `admin_data` contains the full operational view: every member's record (including derived keys, TOTP secrets for re-issue, and salts) and every team's record (including team keys and credentials). This is what makes the admin's section larger than a regular member's section.

A member decrypting their section obtains team keys for *only their assigned teams* and (for the admin) the operational data needed to manage the vault. The file format does not leak admin identity or admin section size through external observation — every member's section is opaque ciphertext.

The member section's metadata includes `memberId` and `is_admin` AAD-bound. This prevents two attacks:

- **Ciphertext-swap.** An attacker cannot move member A's ciphertext into member B's slot, because the AAD-bound `memberId` would not match.
- **Privilege escalation via metadata flip.** An attacker cannot promote a member to admin by changing the `is_admin` flag in metadata, because AAD verification would fail.

### 4.5 Team sections

Each team section is encrypted under a freshly random 256-bit AES-GCM key (generated via `crypto.subtle.generateKey`; no password derivation). The plaintext contains:

- Team identifier and name
- Credentials list (service identifier, optional identifier/username, password, optional notes per credential)

Team metadata includes `teamId` AAD-bound for the same reason as members. The team's key is held by every member assigned to that team (in their `team_keys` map) and by the admin (in `admin_data.teams[teamId].team_key`).

### 4.6 Member finalization flow

Member creation is a two-step process:

1. **`createMember`**: the admin enters a name and optionally marks the new member as admin (the `is_admin` flag in metadata). A placeholder member record is created with empty `data`, empty `iv`, empty `password_derived_key`, empty `totp`, and `pending: true`. The record is structurally valid but contains no cryptographic content yet.

2. **`finalizeMember`**: the member types their password on the admin's device. The 80-bit entropy minimum is enforced. A fresh random TOTP secret is generated (`crypto.getRandomValues`, 20 bytes). A fresh random salt is generated. The combined input (`password || "::" || totp`) is run through Argon2id to produce `password_derived_key`. An empty shell is encrypted directly under the new derived key. The pending flag is cleared. A QR code is generated containing the `memberId` and TOTP secret; the member scans it with CarryPass on their device, which writes both into `localStorage` encrypted under `sessionKey` and `totpSecretKey` respectively.

The 80-bit entropy minimum is enforced at finalization time. Because finalization happens on the admin's device, this enforcement is client-side — a malicious admin could disable it. The trust model treats the admin as authoritative.

**Bootstrap.** When CarryPass is opened with no existing vault, the admin entry initializes an empty in-memory vault and presents the admin panel directly. The user creates themselves as the first member; the system enforces that the first finalized member receives `is_admin: true`. Subsequent members are created normally with `is_admin: false`. The cardinality invariant (exactly one finalized admin) is enforced at every export.

### 4.7 Per-export team-key rotation

**Every team key is rotated on every vault export.** When the admin exports the vault, fresh random AES-GCM keys are generated for every team via `crypto.subtle.generateKey`. The team blocks in the new file are encrypted under the new keys. Members who remain assigned to a team have the new key inserted into their member section's `team_keys` map. The new keys are committed back to the admin's in-memory `vault.teams` state, so the next export rotates from the current keys.

**Atomic commit pattern.** The export builds rotated team keys, encrypted team sections, and encrypted member sections (with the admin's `admin_data` reflecting the rotated state) in temporary structures. Only after the file is successfully written is the rotated state committed to in-memory `vault.teams` and `vault.members`. A failure at any step before file write leaves the in-memory vault unchanged for retry.

**Forward-cut property.** A member who is removed (entirely, or from a specific team) between vault exports loses access to that team's contents in *future* vault files. Their old vault file's old team key decrypts only the old vault file's old team block — frozen content.

**What this provides:**

- Cryptographic invalidation of forward access for revoked members without requiring a server-side revocation mechanism
- Independent snapshots: each vault file is a self-contained encrypted unit. Substituting an older vault file for a newer one does not grant the substituting party access to anything not already disclosed in the older file's frozen contents.
- Implicit version separation: team keys themselves serve as the cryptographic version, eliminating the need for separate sequence-number tracking.

**What this does not provide:**

- Invalidation of vault files already in possession of removed members
- Invalidation of credentials already disclosed to those members
- Real revocation of underlying-service access (which requires credential rotation on the services)

### 4.8 Admin entry, member entry, and admin handover

CarryPass presents two entry points to a team vault:

- **Member entry:** the user types their password; the trusted device's TOTP secret is read from `localStorage`; the member section is decrypted; the member panel is shown. Even if the user's section has `is_admin: true`, the member panel does not reveal admin tools — when entering as a member, they act as a member.

- **Admin entry:** same cryptographic flow. After successful decryption, the metadata `is_admin === true` check determines whether the admin panel is shown. A non-admin member entering through the admin entry is not refused — they are silently redirected to the member panel using the credentials already provided. There is no double authentication.

**Admin handover.** Promoting a different member to admin is performed by the current admin, without requiring the new admin's presence:

1. Current admin opens their vault.
2. They flip flags: their own `is_admin: false`, target member's `is_admin: true`.
3. They click Export. The export reconstructs the new admin's section with `admin_data` populated (using the new admin's `password_derived_key`, which the current admin holds in their operational data) and the old admin's section with `admin_data: null`.
4. The exported file is distributed. The new admin can now enter through the admin entry on their next session.

**Cardinality invariant.** Export refuses to proceed unless exactly one finalized member has `is_admin: true`. This catches both "no admin" (an inconsistent state) and "multiple admins" (which would create divergent operational data). Pending members with the admin flag set are excluded from the count, since they do not yet have keys.

### 4.9 Expiry

Two distinct expiry concepts exist:

**Member-level expiry** is each member's individual access expiry, AAD-bound in their section's metadata. At import time, non-admin members whose expiry has passed are blocked — their CarryPass UI refuses to load them. The admin is exempt: an admin whose own expiry has lapsed can still enter and edit, including extending their own expiry, to avoid a single-admin-locked-out failure mode.

**Vault-level expiry** is the global `vault_metadata.expiry` field. It lives outside any AEAD. It is purely informational — a reminder to the admin that the vault should be refreshed. Honest CarryPass clients display the date; nothing enforces it. An attacker decrypting the file outside CarryPass's UI ignores it entirely.

This split reflects what each expiry actually is: member expiry is a UI-level access control the admin sets to manage member lifecycles; vault expiry is operational metadata. Neither is a cryptographic invalidation mechanism. Real revocation of disclosed credentials requires service-side rotation.

---

## 5. Credential Generation

### 5.1 Pipeline

Password generation in identity mode introduces a second Argon2id stage with a service-binding HKDF preamble:

```
// Stage 1: HKDF site-binding (uncorrelated input per service)
siteBytes = HKDF-Expand(
    passwordKey,
    info = "carrypass-site-input-v4::password::" || normalizedService,
    length = 32
)

// Stage 2: Per-credential Argon2id
secret = Argon2id(
    pass = siteBytes,
    salt = SHA-256(mode || service || length || iterationCount || charsetSignature || variant),
    t=3, m=64 MiB, p=1,
    hashLen = 32
)

// Stage 3: HKDF expansion for variant generation
for variantIndex in 0..5:
    keystream = HKDF-Expand(
        secret,
        info = "carrypass-password-keystream-v4::variant-" || variantIndex,
        length = N bytes (over-provisioned for rejection sampling)
    )
    password = rejection_sample(keystream, allowed_charset, required_length)
    password = enforceCharacterClasses(password, requiredClasses, keystream_remainder)
```

**Stage 1 — Site binding.** The HKDF stage produces 32 bytes of input that are cryptographically uncorrelated across different services. Two services' Argon2id inputs share no material at the input stage; they share only `passwordKey`, which is non-extractable. This is the structural basis for the backward-attack defense.

**Stage 2 — Per-credential Argon2id.** Applies memory-hard cost. The salt construction (`buildArgonSaltInput`) includes mode, service name, password length, iteration count, character-set signature, and (in identity mode) a variant counter. Changing any of these parameters produces an independent password.

**Stage 3 — Variant expansion.** Six password variants per service are produced from a single Argon2id output by varying the HKDF `info` index from 0–5. This makes variant generation cheap after the expensive Argon2id step.

**Rejection sampling.** Keystream bytes are mapped to characters using `byte < floor(256 / charsetLen) * charsetLen` rejection to eliminate modulo bias.

**Character-class enforcement.** `enforceCharacterClasses` ensures that if the user requested uppercase + lowercase + numbers + symbols, the output password contains at least one character from each requested class. If any class is missing after rejection sampling, additional keystream bytes are consumed to select a replacement character of the required class and an insert position. The keystream is over-provisioned to make exhaustion statistically unreachable.

The transient `siteBytes` are zeroed after Argon2id consumes them.

### 5.2 Two modes

CarryPass distinguishes two derivation modes that share the same pipeline but differ in what gets bound into the salt and what serves as the master input:

**Identity mode** is used by a logged-in user generating passwords for their own services. The master input flows from `passwordKey` (the HKDF-derived sub-key from `appMaster`) through the site-binding stage. The salt includes a per-user `variant` parameter, allowing the user to rotate passwords without changing other parameters.

**Regular mode** is used for the teams-vault member-handoff workflow. The master input is a typed-in member password (used directly, without the site-binding HKDF). The salt does *not* include `variant` — both the admin generating the credential on their device and the member reproducing it on theirs must produce identical output from identical typed inputs. Cross-device reproducibility is the design constraint.

The mode is bound into the salt via an explicit `mode=regular` or `mode=identity` segment, providing domain separation between the two pipelines.

### 5.3 Backward-direction defense

The combination of HKDF site-binding plus per-credential Argon2id defends against backward attacks: an attacker who recovers a leaked service password and attempts to reverse-engineer `appMaster` must do so through service-bound, memory-hard work per recovery attempt.

The site-binding HKDF stage ensures that leaked passwords for different services cannot be cross-correlated to amortize the search across multiple targets — each service's Argon2id input is independent.

Per-credential Argon2id parameters (t=3, m=64 MiB) are lower than login parameters (t=4, m=128 MiB) because the user pays this cost every time they generate a password, while login happens once per session. The security calculus is different: an attacker mounting a backward attack must pay the per-credential Argon2id cost for every `appMaster` candidate, against the full 80+ bit passphrase entropy plus the icon-sequence entropy.

The cost is real: identity-mode service password generation takes a few seconds per call. This is acceptable for a deterministic password manager that generates passwords on demand rather than in bulk.

### 5.4 Saved identifier field

CarryPass does not generate usernames algorithmically. Instead, users may type a username or email address into a field on the result card; this identifier is saved with the service settings (encrypted under `sessionKey`) and displayed alongside the regenerated password the next time the saved service is loaded.

The identifier is treated as user data, not authentication material — it is convenience storage, not cryptographic input. It is encrypted at rest along with other service settings but plays no role in any key derivation.

### 5.5 Diceware passphrases

CarryPass also supports deterministic generation of EFF-Diceware-style passphrases (`generateDicewarePassphrase`). The pipeline derives an Argon2id secret from `(masterInput, service, iterationCount, variant, wordListType)`, then maps the keystream to indices in the chosen wordlist (standard 7776-word, short 1296-word, or memorable 1296-word) using rejection sampling for unbiased word selection. Word selection is uniform over the wordlist; no biased indexing is used.

### 5.6 Service identifier normalization and phishing resistance

The service identifier provided by the user is normalized only by trimming surrounding whitespace and lowercasing. Protocol scheme, subdomain, and path are preserved as part of the user's chosen identifier, so distinct identifiers (e.g. `https://example.com` vs `http://example.com`, or `example.com` vs `www.example.com`) produce distinct passwords.

Because credentials are deterministically derived from the service identifier, a phishing site with a similar but distinct domain (`paypa1.com` vs `paypal.com`) produces a different password — useless on the legitimate site but functional on the phishing site. Without intervention, the user would generate a password, fail to log in to the real site, and likely not recognize the phishing.

CarryPass mitigates this with a visible match indicator. When the user types a service identifier, the application checks whether the exact string matches a previously-saved service. A green indicator confirms a match; a red indicator signals divergence. Even single-character differences (including changes in protocol scheme, subdomain, or path) produce a divergence signal.

The indicator is informational, not blocking — but the visual cue prompts the user to verify the URL before generating credentials. This converts the underlying cryptographic property (any input change produces a different password) into a usable phishing defense at the UX layer.

**Limitations:** the indicator only protects against phishing of services the user has previously saved on this device. First-time service use produces no comparison reference. Saved services are stored locally (encrypted under `sessionKey` in `localStorage`) and do not transfer between devices unless the user re-saves them or imports an encrypted settings backup.

### 5.7 In-memory handling

Decrypted credentials are held in JavaScript variables for the duration of the unlocked session and displayed in the UI only on explicit user action (reveal/copy).

**Clipboard handling.** When sensitive data is copied, CarryPass displays a visible "Clear Clipboard" button as a reminder. The user clears manually after pasting. CarryPass does not auto-clear the clipboard, because doing so would clobber any other content the user has copied since — the clipboard is shared user state. The "Clear Clipboard" button auto-hides after 90 seconds; clipboard contents persist until the user explicitly clears them or copies something else. Users in environments with clipboard-monitoring software (clipboard managers, screen sharing) should clear the clipboard manually after pasting.

In-memory exposure cannot be fully eliminated in a browser environment. The model reduces exposure surface and depends on endpoint integrity for the residual.

---

## 6. Cryptographic Design Summary

### 6.1 Primitives and parameters

| Domain | Algorithm | Parameters | Purpose |
|---|---|---|---|
| Adaptive icon initial state | Argon2id | t=2, m=64 MiB, p=1 | First icon grid derivation from passphrase |
| Adaptive icon per-step (×12) | Argon2id | t=2, m=64 MiB, p=1 | State transition after each icon selection |
| Adaptive icon final hash | Argon2id | t=3, m=96 MiB, p=1 | Produce `finalIconHash` from `state_12` |
| Login derivation | Argon2id | t=4, m=128 MiB, p=1, hashLen=32 | `appMaster` derivation |
| Sub-key derivation | HKDF-SHA256 (Expand) | empty salt, version-tagged `info` | Five domain-separated session sub-keys |
| Local-state encryption | AES-GCM | 256-bit key, 96-bit IV | `localStorage` encryption |
| Site-binding (password gen) | HKDF-SHA256 (Expand) | `passwordKey` as IKM | Per-service uncorrelated Argon2id input |
| Per-credential Argon2id | Argon2id | t=3, m=64 MiB, p=1, hashLen=32 | Backward-attack defense |
| Password keystream expansion | HKDF-SHA256 (Expand) | variant-indexed `info` | Six variants from one Argon2id output |
| Diceware passphrase generation | Argon2id + HKDF | same params as service password | Deterministic word-based passphrases |
| Member key derivation | Argon2id | t=3, m=96 MiB, p=1, hashLen=32 | Combined input: password + 160-bit TOTP secret |
| Vault encryption | AES-GCM | 256-bit key, 96-bit random IV | Member and team sections |
| Vault integrity | AES-GCM auth tag + AAD | 128-bit tag | Ciphertext + metadata tamper-evidence |
| Team key generation | `crypto.subtle.generateKey` | AES-GCM 256, fresh per export | Random per-team keys, rotated each export |
| Screen lock verifier | HKDF-SHA256 + AES-GCM | random salt, code in `info`; empty plaintext | Auth-tag-only verification |
| Canary | AES-GCM | empty plaintext | Login verification (Section 2.8) |
| TOTP secret generation | `crypto.getRandomValues` | 20 bytes (160 bits) per member | Cryptographic factor in member key derivation |
| TOTP code generation | HMAC-SHA1 | RFC 6238 standard | 6-digit codes (used for backup/recovery flows only) |

### 6.2 Domain separation

Every cryptographic derivation includes a version-tagged context string. Same input under different contexts produces independent outputs.

Context strings (non-exhaustive):

- `carrypass-appMaster-v4`
- `carrypass-canary-key-v4`
- `carrypass-session-key-v4`
- `carrypass-totp-secret-key-v4`
- `carrypass-password-key-v4`
- `carrypass-screenlock-base-v4`
- `carrypass-screenlock-v4::<code>`
- `carrypass-site-input-v4::password::<service>`
- `carrypass-site-input-v4::diceware::<service>`
- `carrypass-password-keystream-v4::variant-<index>`
- `CarryPass/adaptive-icon-base/v4`, `.../adaptive-icon-step/v4`, `.../adaptive-icon-final/v4`, `.../adaptive-icon-grid/v4/round-<N>`
- `team-vault-v4::member::` (member key derivation salt prefix)
- `carrypass-vault-v4` (vault format version)

### 6.3 Web Crypto API usage

All non-Argon2 cryptographic operations use the W3C Web Cryptography API (`crypto.subtle`):

- AES-GCM: `crypto.subtle.encrypt` / `decrypt`
- HKDF: `crypto.subtle.deriveBits` / `deriveKey`
- SHA-256: `crypto.subtle.digest`
- HMAC-SHA1: `crypto.subtle.sign` (TOTP code generation only)
- Random key generation: `crypto.subtle.generateKey`
- Random byte generation: `crypto.getRandomValues`

Keys are imported as non-extractable `CryptoKey` objects where the application does not need to read the raw bytes.

**Argon2id is not part of Web Crypto.** It is provided by `argon2-browser`, a WebAssembly compilation of the Argon2 reference implementation. This is a third-party dependency bundled at build time and loaded with SRI SHA-384 integrity hashes. A compromise of `argon2-browser` is in scope for a supply-chain audit.

### 6.4 Script integrity and dependency bundling

All JavaScript and CSS assets are bundled into the deployment at build time, including third-party libraries (`argon2-browser`, zxcvbn, lucide, qrcode, html5-qrcode, DOMPurify, EFF wordlists) and the language translation files (`lang/en.js`, `lang/hu.js`). There are no external CDN calls at runtime; the only HTTP requests CarryPass makes are to the origin serving its own static files.

All scripts and stylesheets load with Subresource Integrity (SRI) SHA-384 hashes. A strict Content-Security-Policy restricts script sources to `self` and permits WebAssembly execution via `wasm-unsafe-eval` (required by argon2-browser).

**SRI scope clarification:** SRI defends against in-transit tampering between the hosting origin and the browser. Because all dependencies are bundled, this provides the same protection as if all assets were first-party. SRI does not defend against compromise of the hosting infrastructure itself — if the deployment is modified, the SRI hashes are modified along with the files they cover. Section 3.2 places hosting-platform compromise out of scope.

---

## 7. Local Storage and Client-Side Persistence

`localStorage` is used to persist:

- The `vaultCanary` (encrypted under `vaultCanaryKey`; empty plaintext)
- The encrypted TOTP secret (encrypted under `totpSecretKey`)
- The encrypted member identity / `memberId` (encrypted under `sessionKey`)
- The encrypted member label (encrypted under `sessionKey`)
- Encrypted service settings, including saved identifiers (encrypted under `sessionKey`)
- Encrypted custom password profiles (encrypted under `sessionKey`)
- Last-access timestamp (plaintext, non-sensitive)
- UI preferences (plaintext, non-sensitive)

No plaintext credentials, master secrets, or `appMaster` are stored. All sensitive values are encrypted with AES-GCM before being written. Decryption requires successful sub-key derivation, which requires both passphrase and adaptive icon factors.

**Settings export and device migration.** Users can export their `localStorage` contents (services, profiles, TOTP secret, member label, identifiers) as a portable encrypted bundle (`.cpex`). The exported data is encrypted under `sessionKey` from the source device; importing on a destination device requires the user to first complete CarryPass login on that device (producing the same `sessionKey` from the same passphrase + adaptive icon sequence). After import, the destination device has the trusted-device state needed to access the team vault as the same member. This provides a self-recovery path for device loss without requiring admin intervention.

**Security boundary:** `localStorage` is treated as a convenience layer, not a secure storage mechanism. It remains accessible to scripts running in the same origin. Overall protection relies on CSP, SRI, and the trusted-device model.

---

## 8. Data Lifecycle

| Phase | Behavior |
|---|---|
| **Creation** | Secrets originate from user input and deterministic derivation. No server-side generation. TOTP secrets are generated at member finalization using `crypto.getRandomValues`. |
| **Encryption** | All vault data is encrypted before persistence or distribution. AES-GCM provides authenticated encryption. Member sections use Argon2id-derived keys (input: password + TOTP secret). |
| **Distribution** | Vaults distributed as encrypted JSON files (download, email) or via service-worker cached delivery. Offline-first. |
| **Access** | Decryption is local. Requires correct passphrase + adaptive icon sequence (for app login), plus member password and trusted-device TOTP secret (for team vaults). |
| **Rotation** | Deterministic credentials rotate by changing the variant index. Team keys rotate automatically on every vault export (Section 4.7). Shared credentials rotate by re-export with new contents. |
| **Expiry** | Member-level expiry is enforced for non-admin members (AAD-bound). Vault-level expiry is informational only (Section 4.9). |
| **Revocation** | Forward-cut via per-export team-key rotation: removed members lose access to future vault files. Real revocation of underlying-service access requires credential rotation on the services themselves. |
| **Recovery** | Self-recovery via encrypted settings export (Section 7). Admin-mediated recovery via TOTP re-issue (admin holds backup copies of all member TOTP secrets). |
| **Persistence** | Only encrypted data and non-sensitive metadata are persisted. Plaintext credentials and root secrets are never written to storage. |

---

## 9. Audit Trail

CarryPass maintains an in-memory queue of admin actions (`auditLogQueue`) accumulated during an unlocked admin session. The queue is exportable as a plain-text file via `exportAuditLogFile`. The exported file includes a SHA-256 hash of the log content as a footer, **for corruption detection only**.

The hash is not keyed and is not a cryptographic integrity check against tampering — anyone editing the log can recompute the hash. This is intentional and the file footer states it explicitly: the hash exists so a recipient can detect bit-rot, truncation, or accidental modification during transfer, not to defend against malicious editing.

The audit log is cumulative within a session and is cleared on lock or logout. It does not survive page reloads. The log is not persisted inside the encrypted vault — only the admin generates entries, and only the admin could decrypt them, so encrypting them inside the vault would add no auditability over the existing per-session export.

---

## 10. Security Properties Summary

### 10.1 Properties the design provides

- No persistent storage of master secrets
- Deterministic credential generation without a credential database
- Scoped access control (members decrypt only assigned teams; only the admin-flagged member's plaintext contains operational data)
- Trusted-device requirement for team vault access (TOTP secret as cryptographic factor)
- Strong file-leak floor via 160-bit TOTP secret bound into member key derivation
- Encrypted data at rest and in distribution
- Domain separation via version-tagged context strings
- AAD-protected metadata, including `is_admin` flag (tamper-evident)
- Symmetric cost on login (no asymmetric verification oracle)
- Forward-cut access for revoked members via per-export team-key rotation
- Backward-attack defense via site-binding HKDF plus per-credential Argon2id
- Resistance to single-channel input capture via the adaptive chained icon factor
- Phishing resistance via deterministic generation + saved-service comparison indicator
- Self-recovery path for device loss via encrypted settings export

### 10.2 Properties the design does not provide

- Cryptographic invalidation of vault files already in possession of revoked members
- Defense against full device compromise
- Defense against full UI capture
- Defense against compromised hosting infrastructure or build pipeline
- Strong protection of session sub-keys against memory dump (mitigated structurally — sub-keys are non-extractable handles, retry limits, inactivity wipe)
- Multi-admin support (single-admin model by design; admin handover transfers the role)

### 10.3 Assumptions the design relies on

- The user provides a passphrase meeting the 80-bit entropy threshold (zxcvbn)
- Member passwords meet the same threshold (enforced client-side at finalization)
- The device executing CarryPass is not fully compromised
- The hosting infrastructure serving CarryPass is honest (SRI defends in-transit; deployment trust is required)
- The user keeps their trusted device under their control, or has exported encrypted settings for recovery
- The admin rotates underlying-service credentials when revoking members (CarryPass forward-cut alone does not invalidate already-disclosed credentials)

### 10.4 Architectural trade-offs

The design intentionally accepts:

- Reliance on user-controlled secret strength (with TOTP secret providing a hard floor for team vaults)
- Non-instant revocation in offline scenarios
- Single-admin model
- Argon2id wall-clock cost: full login (passphrase + 12 icon selections + final hash + login derivation) takes approximately 20-35 seconds on modern desktop hardware, longer on mobile. Per-credential password generation takes a few seconds.

These trade-offs are deliberate consequences of choosing stateless, offline-first operation over server-mediated control.

---

## 11. Deployment Security

CarryPass is delivered as a static Progressive Web App with all dependencies bundled at build time. There are no external CDN calls at runtime. Delivery-layer protections:

- **Subresource Integrity (SRI):** All `<script>` and `<link>` tags load with SHA-384 integrity hashes, including third-party libraries, language translation files, and the main application script. Hashes are recomputed and committed by CI/CD after each deployment. SRI defends against in-transit tampering between the hosting origin and the browser; it does not defend against tampering at the origin itself.
- **Content-Security-Policy:** Strict CSP enforced via HTTP header. `default-src 'self'`, `script-src 'self' 'wasm-unsafe-eval'` (for argon2-browser), `worker-src 'self'`, `frame-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`. Equivalent CSP also delivered via HTML `<meta>` tag for portability. No inline scripts. No external script sources.
- **Security headers:** (not in GitHub Pages demo) `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy` restricting camera (self-only), microphone, geolocation, payment, USB, Bluetooth, and motion sensors.
- **HTTPS enforcement:** Service worker enforces HTTPS at the application layer; non-secure requests are blocked.
- **Offline-first PWA:** Assets cached via service worker for verified offline operation. Cached responses are tagged with `x-cache-source` headers so the application can distinguish network-fresh from cache-served data in the UI.

**Out-of-scope at the deployment layer:**

- Compromise of the hosting infrastructure — would allow simultaneous rewrite of files and SRI hashes
- Compromise of the build pipeline producing the deployed artifacts
- Browser-level compromise affecting Web Crypto API
- Compromised third-party dependencies introduced at build time

Users whose threat model includes hostile hosting infrastructure should not rely on web-delivered applications for credential management; physical-only solutions (paper, hardware tokens, memorized credentials) are appropriate for that threat tier.

---

## 12. Items Recommended for Audit Focus

For an independent review, the following areas merit particular attention.

### 12.1 Adaptive icon chain

**1. Per-step state transition construction.** Verify that the per-step derivation
```
state_n = Argon2id("CarryPass/adaptive-icon-step/v4" || state_(n-1) || selectedIcon_n, salt, t=2, m=64 MiB)
```
has no exploitable algebraic structure that could let an attacker shortcut the serial-evaluation requirement for a given passphrase candidate. The intent is that grid-N cannot be enumerated without first evaluating the Argon2id chain through grid-(N-1).

**2. Deterministic grid shuffle.** `deriveAdaptiveGrid` uses `deterministic_shuffle(ICON_POOL_314, state, context)` to produce the 25 icons of a round. Verify that this shuffle is collision-resistant in its output (different states produce uncorrelated grids), unbiased (no icons systematically over- or under-represented across rounds), and that taking the first 25 elements does not introduce bias.

**3. Visual position randomization.** Verify that `secureShuffle` (the per-session position randomization) uses `crypto.getRandomValues` correctly with unbiased Fisher-Yates and that no positional information leaks across sessions.

**4. Combined input construction at login.** Verify that the salt construction `SHA-256("carrypass-appMaster-v4::" || finalIconHash)` followed by `Argon2id(pass = passphrase, salt = ...)` correctly binds both the passphrase and the icon-derived material into `appMaster`. Confirm that no path produces `appMaster` with only one of the two components.

### 12.2 Sub-key derivation and memory hygiene

**5. `appMaster` zeroing.** `appMaster` is held as a `Uint8Array` and zeroed on logout, lock, or screen-lock failure via `.fill(0)`. The JavaScript engine may produce internal copies during use. Verify that every code path leading to lock or logout calls `zeroAppMaster()`: inactivity timeout, explicit lock button, tab close, errors during sub-key derivation. Verify that `appMaster` is zeroed immediately after the five sub-keys are derived (not retained for the session).

**6. Sub-key domain separation.** The five HKDF info strings (`carrypass-canary-key-v4`, `carrypass-session-key-v4`, `carrypass-totp-secret-key-v4`, `carrypass-password-key-v4`, `carrypass-screenlock-base-v4`) must be pairwise distinct. Verify that compromise of one sub-key does not enable recovery of others (HKDF one-way property in practice).

**7. Non-extractable key handles.** Verify that `sessionKey`, `vaultCanaryKey`, `totpSecretKey`, and AES-GCM derivatives are imported as non-extractable `CryptoKey` objects where the API allows.

### 12.3 Canary and screen-lock verifiers

**8. Empty-plaintext canary.** Verify that `writeVaultCanary` encrypts `new Uint8Array(0)` (not a string constant), that `verifyVaultCanary` returns `"ok"` only when AES-GCM decryption succeeds without throwing, and that there is no path where the discarded plaintext is observed.

**9. Screen lock construction.** Verify that the screen lock uses the same empty-plaintext + auth-tag-only construction (not `appMaster` encryption). Verify that `screenLockState` is never written to `localStorage` or IndexedDB. Verify that retry-counter exhaustion (`MAX_RETRIES = 3`) wipes all five session sub-keys and forces full re-authentication. Verify that the 30-minute inactivity timer also triggers this wipe.

### 12.4 Per-credential password derivation

**10. Site-binding HKDF.** Verify that `materializeSiteSpecificBytes(passwordKey, normalizedService, kind)` uses HKDF with `info = "carrypass-site-input-v4::" || kind || "::" || normalizedService` and produces 32 bytes that are deterministic per (passwordKey, service) pair but cryptographically uncorrelated across different services. Verify that the transient `siteBytes` are zeroed after Argon2id consumes them.

**11. Per-credential Argon2id parameters.** `ARGON_PASSWORD_OPTIONS_V4` should be `{ time: 3, mem: 65536 (= 64 MiB), parallelism: 1, type: Argon2id }`. Verify these match deployment.

**12. Salt construction edge cases.** The salt is built from mode, service name, length, iteration count, character-set signature, and (identity mode) variant. Verify that no unintended collisions exist (e.g., between a service name containing the literal salt separator and another distinct service), and that the salt is parameter-distinguishable across all reasonable inputs.

**13. Character-class enforcement.** Verify that `enforceCharacterClasses` consumes additional keystream bytes (not random ones) when classes are missing, that keystream over-provisioning makes exhaustion statistically unreachable, and that the post-enforcement password retains the requested character-set property and length.

**14. Cross-device determinism for regular mode.** The teams-vault member handoff requires that `derivePasswords` with `mode="regular"` produces identical output across devices for identical typed inputs. Verify there are no platform-dependent behaviors (locale-sensitive string operations, integer overflow on different JS engines, encoding differences in `TextEncoder` output for non-ASCII passwords).

### 12.5 Team vault

**15. AAD encoding consistency.** The `stableStringify` function must produce byte-identical output on both encrypt and decrypt paths for AAD verification to work. The implementation uses recursive sorted-keys serialization. Verify behavior across nested objects, arrays, edge cases (empty objects, `null`, `undefined` handling — particularly for the `admin_data: null` field in non-admin members), and confirm that export and import functions agree on the serialization for all metadata shapes.

**16. TOTP-bound key derivation symmetry.** Member key derivation uses `Argon2id(password || "::" || totpSecret, salt, t=3, m=96 MiB)`. Verify that finalization (write side, `finalizeMember`) and import (read side, `importMemberVaultFromJson`) construct this combined input identically — same separator, same encoding, same byte order — across all paths.

**17. AAD on member metadata, including `is_admin`.** `memberId` and `is_admin` are included in the member section's AAD. Verify the import code re-checks `metadata.memberId === sessionMemberId` after AAD-protected decryption succeeds. Verify that the post-decryption check requiring `decrypted.admin_data !== null` for admin entry agrees with the metadata `is_admin === true` flag — these two checks must be consistent in any valid export.

**18. Pre-decryption metadata reads.** The import code reads `expiry`, `is_admin`, and `memberId` from unauthenticated metadata before AAD verification, for routing decisions. Verify that any decisions made on these unauthenticated values cannot bypass cryptographic checks — flipping any AAD-bound value must cause verification to fail, denying access rather than granting it.

**19. Per-export team-key rotation atomicity.** Team-key rotation generates new keys, encrypts team blocks under them, propagates new keys into member sections (and the admin's `admin_data`), and commits the rotated state to in-memory `vault.teams` and `vault.members` only after the file is successfully written. Verify that a partial failure during export cannot leave the in-memory vault in a half-rotated state.

**20. Cardinality invariant enforcement.** The export refuses to proceed unless exactly one finalized member has `is_admin: true`. Verify this check correctly excludes pending members and handles edge cases (zero finalized admins, two finalized admins after a partially-completed handover).

### 12.6 Supply chain

**21. `argon2-browser` provenance.** The Argon2id implementation is provided by a third-party library bundled at build time. Verify the library's provenance, build reproducibility, and the SRI hash computation in CI/CD.

### 12.7 Settings export and migration

**22. Settings export decryption.** The encrypted settings export (`.cpex`) contains data encrypted under `sessionKey` from the source device. On import, the destination device must produce the same `sessionKey` (same passphrase + adaptive icon sequence) for decryption to succeed. Verify that no data in the export bundle is reusable on a device where the user cannot reproduce the source `sessionKey`.

**23. Identifier field handling.** Saved per-service identifiers are stored encrypted under `sessionKey` and have no cryptographic role beyond at-rest encryption. Verify that the identifier field cannot be exploited as an injection vector into the password-generation pipeline (it is purely display data, encrypted at rest along with service settings).

---

*This document reflects the current architecture of CarryPass as of May 2026. For the latest version, source code, and community discussion, visit [carrypass.net](https://carrypass.net).*
