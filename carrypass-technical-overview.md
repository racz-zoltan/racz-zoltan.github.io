# How CarryPass Protects Your Credentials

**A technical overview**

May 2026
[https://carrypass.net](https://carrypass.net)

---

## Purpose

CarryPass is open source. The JavaScript that runs in your browser is the source of truth, and anyone can read it, fork it, or audit it. This document describes the architecture and cryptographic design for users who want to understand what the system does before trusting it with their credentials.

The document names what CarryPass defends against and what it does not. Where a defense is partial, the boundary is stated. Where a choice is a trade-off, the trade is identified.

---

## 1. System overview

CarryPass is a stateless, client-side credential manager.

**Client-side** means all cryptographic operations happen in the browser. There is no CarryPass server holding credentials.

**Stateless** means no persistent master secret exists. The cryptographic root is reconstructed in memory at each login from user-supplied inputs, then zeroed when no longer needed.

CarryPass provides two functions:

1. **A deterministic password generator.** Given a service name, the master passphrase, the adaptive icon sequence, and a set of generation parameters, CarryPass derives a password through a fixed cryptographic pipeline. The same inputs produce the same password on any device, so nothing needs to be stored.

2. **A team vault.** An encrypted JSON file that an administrator distributes to team members. Each member can decrypt only the credentials they have been assigned. The file is end-to-end encrypted between admin and members.

Both functions share the same cryptographic foundation.

---

## 2. Threat model

### In scope

- **Theft of local data.** An attacker obtains the contents of `localStorage`, a cached vault file, or any data persisted by the browser. Stolen data alone, without the user's secrets, is designed to be useless.
- **Offline brute-force.** An attacker takes stolen data and attempts to recover the secrets by trying candidate passphrases. Each attempt should be computationally expensive.
- **Network observation.** An attacker observes encrypted traffic between the user and the hosting origin. HTTPS handles transport confidentiality.
- **Partial input capture.** An attacker has one channel of capture — a keylogger, mouse-coordinate recording, or a single screenshot — but not all of them simultaneously. CarryPass is designed to remain useful against single-channel capture.
- **Old vault files held by removed members.** A team member removed from the vault retains their last copy of the vault file. They should not be able to decrypt anything new after removal.

### Out of scope

- **Full device compromise.** Malware with full memory access, screen capture, and keystroke recording can defeat any client-side application running on that device, including CarryPass.
- **Compromise of the hosting infrastructure.** CarryPass ships as static files with all dependencies bundled — there are no external CDN calls at runtime. Subresource Integrity (SRI) verifies the integrity of bundled assets. However, the hosting platform itself (the public deployment, or a self-hosted server) remains a trusted component: an attacker who controls the platform can serve modified files with matching SRI hashes, and the user has no easy way to detect this. This is a property of all web-delivered applications.
- **Browser-level vulnerabilities and malicious extensions.** The browser is the trust boundary. Anything inside the browser process — a browser bug, a hostile extension — can affect CarryPass the same way it can affect any other web application.
- **Clipboard contents.** Copied passwords become part of the device's clipboard state, which other applications can read. CarryPass provides a "Clear Clipboard" button but does not auto-clear, since auto-clearing would clobber unrelated clipboard content.

---

## 3. Authentication: passphrase and adaptive icon sequence

Authentication uses two components that combine into a single cryptographic input:

- **The master passphrase.** A textual secret chosen by the user. Registration enforces a minimum entropy threshold (currently 80 bits, evaluated via zxcvbn).
- **The adaptive icon sequence.** A memorized visual path through three icon grids, with four selections per grid (twelve ordered selections total).

The two are not separable "factors" in the traditional MFA sense. Both are required, and both contribute their entropy to the same Argon2id derivation. Knowing one without the other is not sufficient for any cryptographic operation in CarryPass.

### 3.1 Why two components

The adaptive icon sequence exists primarily to defend against partial input capture. A keylogger captures typed text but not visual selections. Mouse-coordinate recording captures clicks but not icon identities (because positions are randomized each session). A single screenshot captures one grid at one moment but not the chained progression. An attacker who has one of these channels still lacks the other.

This is not a substitute for full multi-factor authentication and it does not stop malware that observes the screen, DOM, memory, and keystrokes simultaneously. Its scope is narrower: reducing the value of single-channel capture while preserving stateless deterministic recovery.

### 3.2 How the adaptive icon sequence works

The icon pool contains 314 distinct icons. From this pool, three grids of 25 icons are derived sequentially during login. The user selects four icons per grid, in order.

The first grid is derived deterministically from the passphrase alone. Each subsequent grid depends on the icon selections made in the previous grid. The structure is:

```
initialState   = Argon2id(passphrase, "CarryPass adaptive icon base v4", t=2, m=64 MiB)
grid_1         = deterministic_shuffle(ICON_POOL, initialState, round=1)[:25]

# four selections in grid_1, each updating the state:
for n in 1..4:
  state_n = Argon2id(state_(n-1) || selectedIcon_n,
                     salt = "CarryPass adaptive icon step <N> v4",
                     t=2, m=64 MiB)

grid_2         = deterministic_shuffle(ICON_POOL, state_4, round=2)[:25]
# ... four more selections ...

grid_3         = deterministic_shuffle(ICON_POOL, state_8, round=3)[:25]
# ... four more selections ...

finalIconHash  = Argon2id(state_12,
                          "CarryPass adaptive icon final v4",
                          t=3, m=96 MiB)
```

The grid positions are visually randomized each session using browser CSPRNG. This means the user authenticates by recognizing icon identities, not by clicking remembered positions. The visual shuffle is what prevents simple coordinate-replay attacks.

A registration teaching phase guides the user through their selected icons with brief visual highlighting, building recognition memory before the unguided confirmation phase.

### 3.3 Cost and login latency

The full adaptive icon flow performs twelve step Argon2id derivations (each t=2, m=64 MiB) plus one final Argon2id derivation (t=3, m=96 MiB). Combined with the login Argon2id (Section 4), the total login time on modern desktop hardware is approximately 20-35 seconds, with mobile devices toward the upper end.

This is a deliberate trade-off. The per-step cost forces an attacker to evaluate each candidate icon sequence serially within a given passphrase candidate — the second grid's icons cannot be enumerated until the first round's state has been computed. The login latency is the cost of that property.

---

## 4. Key derivation pipeline

### 4.1 Login derivation

After the adaptive icon flow produces `finalIconHash`, the application root secret is derived:

```
salt      = SHA-256("carrypass-appMaster-v4::" || finalIconHash)
appMaster = Argon2id(pass = passphrase,
                     salt = salt,
                     t=4, m=128 MiB, p=1)
```

`appMaster` is a 32-byte value held in memory only. It is never written to storage. The version string `carrypass-appMaster-v4` is part of the salt construction for domain separation.

### 4.2 Sub-key derivation and `appMaster` zeroing

Five domain-separated sub-keys are derived from `appMaster` using HKDF-SHA256:

| Key | Purpose | HKDF info string |
|---|---|---|
| `vaultCanaryKey` | Login verification (Section 4.4) | `carrypass-canary-key-v4` |
| `sessionKey` | Encrypts local data | `carrypass-session-key-v4` |
| `totpSecretKey` | Encrypts the stored TOTP secret | `carrypass-totp-secret-key-v4` |
| `passwordKey` | Site-binding for password generation | `carrypass-password-key-v4` |
| `screenLockBaseKey` | Backs the screen lock feature | `carrypass-screenlock-base-v4` |

Immediately after all five sub-keys are derived, `appMaster` is zeroed in memory. From that point forward in the session, no single root key exists in process memory. The five sub-keys are imported as non-extractable `CryptoKey` handles where the Web Crypto API allows; their raw bytes are not present in the JavaScript heap.

HKDF is used here, rather than additional Argon2id rounds, because `appMaster` is already a uniform high-entropy secret. Argon2id's memory-hardness exists to defend weak inputs; HKDF is the correct primitive for separating one strong secret into multiple purpose-bound keys.

### 4.3 Login verification via empty-plaintext canary

CarryPass does not perform a separate "password check" step. At registration, the system encrypts an empty plaintext (zero bytes) under `vaultCanaryKey` and stores the resulting ciphertext and IV in `localStorage`. At login, the freshly-derived `vaultCanaryKey` is used to attempt decryption of the stored canary.

```
// Registration
ciphertext, iv = AES-GCM-encrypt(vaultCanaryKey, plaintext = empty)
localStorage.vaultCanary = { iv, ciphertext }

// Login
try:
  AES-GCM-decrypt(vaultCanaryKey, ciphertext, iv)  // result discarded
  // authentication succeeded
except:
  // authentication failed
```

The AES-GCM authentication tag (16 bytes) is what verifies key correctness. If the derived `vaultCanaryKey` is wrong, the tag will not validate and decryption throws. The cost of a wrong attempt equals the cost of a correct attempt: one full adaptive icon flow plus one login Argon2id.

The empty plaintext means there is no known-plaintext pair in `localStorage` for an attacker to attack offline. The stored canary consists of only IV and authentication tag; there is no encrypted content.

### 4.4 Per-credential password derivation

Password generation introduces a second Argon2id stage. This stage defends against the inverse-attack direction: an attacker who has obtained a single generated password and wants to recover `appMaster` (which would compromise all other passwords derived from the same root).

The pipeline is:

```
// Site binding via HKDF (different services produce uncorrelated inputs)
siteBytes = HKDF(passwordKey,
                 info = "carrypass-site-input-v4::password::" || normalizedService,
                 length = 32)

// Per-credential Argon2id with service-bound salt
secret = Argon2id(pass = siteBytes,
                  salt = SHA-256(service || length || charset || variant),
                  t=3, m=64 MiB, p=1)

// Expansion to six independent password variants
for variant in 1..6:
  keystream = HKDF(secret,
                   info = "carrypass-password-keystream-v4::variant-" || variant,
                   length = N bytes)
  password  = rejection_sample(keystream, allowed_charset, required_length)
```

The first HKDF stage gives each service its own uncorrelated input to Argon2id. The Argon2id stage applies memory-hard cost to any backward-attack attempt. The transient `siteBytes` are zeroed after Argon2id consumes them.

Per-credential Argon2id parameters are lower than login parameters (t=3, m=64 MiB versus t=4, m=128 MiB) because the user pays this cost every time they generate or regenerate a password, while login happens once per session. The security calculus is different: an attacker mounting a backward attack must still pay the per-credential Argon2id cost for every candidate `appMaster`, against the full 80+ bit input entropy.

### 4.5 Phishing resistance

Because the generated password depends on the typed service name, `paypa1.com` and `paypal.com` produce different passwords. A phishing site cannot harvest the user's real PayPal password — it only obtains the password CarryPass generated for the misspelled domain, which is useless on the real domain.

CarryPass also displays a match indicator when the typed service name matches a previously-saved service. A typo on a known service triggers a visual warning, prompting the user to verify the URL.

---

## 5. Team vaults

The team vault distributes credentials to a group without server-side trust. A vault file is a JSON document containing encrypted member records and encrypted team records.

### 5.1 File structure

```json
{
  "version": "carrypass-team-vault-v4",
  "vault_metadata": { "expiry": "2026-12-31" },
  "members": { "<memberId>": { "data": "...", "metadata": { ... } }, ... },
  "teams":   { "<teamId>":   { "data": "...", "metadata": { ... } }, ... }
}
```

Each member's `data` is encrypted under that member's key. Each team's `data` is encrypted under a team key that is itself stored inside the relevant members' encrypted records.

### 5.2 Member key derivation

A member's key requires two inputs:

```
combinedInput = password || "::" || totpSecret
memberKey     = Argon2id(pass = combinedInput,
                         salt = memberSalt,
                         t=3, m=96 MiB, p=1)
```

`totpSecret` is a 160-bit random value stored on the member's trusted device (encrypted at rest under `totpSecretKey`). It is bound into the key derivation rather than used as a time-based code, making it a long-term cryptographic factor rather than a transient verifier.

The same derivation is used at member finalization (when the admin first sets up the member) and at member import (when the member opens the vault). This symmetry is a property to verify in audit.

An attacker with the vault file but not the trusted device cannot derive `memberKey`: even a correctly-guessed password is missing 160 bits of TOTP secret entropy, which is computationally unguessable.

### 5.3 Single-admin model

Every vault has exactly one admin at a time. The admin is structurally a member with an `is_admin: true` flag in their AAD-protected metadata, plus an `admin_data` blob in their encrypted plaintext containing operational state (member records, team keys, credentials).

There is no separate admin password or admin section. Admin authentication uses the same member key derivation as any other member. The cryptographic protections are identical; what makes the admin role distinct is the flag and the operational data inside the protected plaintext.

The single-admin cardinality is an invariant that must be preserved by all operations on the vault.

### 5.4 Per-export key rotation

On every vault export, each team's encryption key is freshly generated via `crypto.subtle.generateKey`. The new keys are wrapped into the records of members assigned to each team. This provides **forward-cut revocation**: a member removed between exports cannot decrypt teams in future vault files.

The previous vault file remains decryptable by everyone who had it at the time — a vault file is a frozen snapshot. Real revocation of access to the underlying services (the actual passwords in those teams) requires rotating those services' credentials separately. Per-export rotation prevents future leakage but cannot undo past disclosure.

### 5.5 Expiry semantics

- **Member-level expiry** is enforced. Each member has an expiry date in their AAD; after it passes, CarryPass refuses to load the vault as that member.
- **Vault-level expiry** is informational. It lives in `vault_metadata` outside the encrypted records. It serves as a reminder for the admin to refresh the vault. Nothing enforces it cryptographically.

The asymmetry is intentional: cryptographically-enforced member expiry is meaningful access control, while a vault-level field outside the cryptographic envelope cannot bind anyone.

---

## 6. Local storage and memory hygiene

### 6.1 What is stored

The browser's `localStorage` holds:

- The encrypted canary (empty plaintext + IV + tag) for login verification
- The encrypted TOTP secret (if the user is enrolled in a team vault)
- The encrypted member identifier
- Encrypted service settings, including any usernames saved per service
- Encrypted custom password profiles
- Encrypted member label and trusted-device state
- Non-sensitive UI preferences

All sensitive items are encrypted under their respective sub-keys (`sessionKey`, `totpSecretKey`, or `vaultCanaryKey`) before being written. `localStorage` itself provides no isolation; same-origin code can read it. Encryption is what protects the data, not the storage layer.

### 6.2 `appMaster` lifecycle

`appMaster` exists only between sub-key derivation and explicit zeroing, a window of microseconds in normal operation. After zeroing, it is `null` and cannot be reconstructed without re-running the full login flow.

The five session sub-keys persist until logout, screen-lock wipe, or 30-minute inactivity. Each is held as a non-extractable `CryptoKey` where the API allows. Logout sets all five to `null`.

### 6.3 Settings export and migration

A user can export their device state as an encrypted `.cpex` bundle. The bundle includes:

- Service settings (with saved identifiers)
- Custom password profiles
- The trusted-device TOTP secret
- The member identifier

The bundle is encrypted under `sessionKey` from the source device. On a new device, the user completes a CarryPass login (producing the same `sessionKey` from the same passphrase and adaptive icon sequence), then imports the bundle. The new device now has trusted-device state and can access the team vault.

This is the self-recovery path for device migration. Recovery requires: master passphrase, adaptive icon sequence, and a settings backup.

---

## 7. Screen lock

A screen lock code (minimum 6 characters) allows the user to temporarily lock the session without performing the full login flow on resume.

### 7.1 Why "screen lock code," not "PIN"

The term "PIN" implies hardware-enforced attempt limits and rate limiting at the OS level (as on phone unlock or bank cards). CarryPass's screen lock operates at the session level inside the browser, which is a weaker boundary. The terminology reflects the actual protection rather than implying stronger guarantees.

### 7.2 Mechanism

When the user sets a screen lock code, CarryPass derives a verifier key from `screenLockBaseKey` and the code via HKDF, then encrypts an empty plaintext under that verifier (the same construction as the login canary). The resulting AES-GCM authentication tag is held in memory as a `screenLockState`.

On unlock, the same derivation is performed with the typed code. If the auth tag validates, the code was correct. `appMaster` is not encrypted under the lock and is not involved — by the time the user could lock the screen, `appMaster` has long been zeroed.

### 7.3 Structural protections

The lock's security relies on structural limits rather than the code's entropy:

- **Three-strike wipe.** After three wrong attempts, all five session sub-keys are nulled. The user must perform full login again.
- **Inactivity wipe.** After 30 minutes of inactivity, the same wipe happens automatically.
- **Memory-only state.** The `screenLockState` is held in memory only; it is never written to disk.

The 6-character minimum makes casual guessing impractical but does not defend against memory-access attacks; the structural defenses (three strikes, inactivity timeout) are what matter for that threat. The screen lock is positioned as a convenience feature against shoulder-tier threats, not as a strong cryptographic boundary.

---

## 8. Cryptographic primitives

| Primitive | Used for |
|---|---|
| Argon2id | Adaptive icon step derivation, final icon hash, login derivation, per-credential password derivation, team vault member key derivation |
| HKDF-SHA256 | Sub-key derivation from `appMaster`, site-binding input for password generation, password keystream expansion, screen lock verifier derivation |
| AES-GCM (256-bit) | All encryption: local storage, vault records, screen lock verifier, canary |
| SHA-256 | Salt construction, audit log hash chain, visual fingerprint |
| HMAC-SHA1 | TOTP code generation (RFC 6238 standard) |
| `crypto.subtle.generateKey` | Random team keys |
| `crypto.getRandomValues` | TOTP secrets, salts, nonces, session-randomized icon positions |

Argon2id is the only primitive not built into browsers; CarryPass uses `argon2-browser`, a WebAssembly compilation of the reference Argon2 implementation. All bundled dependencies are loaded with SRI hashes for integrity verification at load time.

All other primitives are W3C Web Cryptography API operations implemented natively by the browser.

### 8.1 Argon2id parameter summary

| Stage | Parameters | Purpose |
|---|---|---|
| Adaptive icon initial state | t=2, m=64 MiB, p=1 | Derive first icon grid from passphrase |
| Adaptive icon step (×12) | t=2, m=64 MiB, p=1 | State transition after each icon selection |
| Final icon hash | t=3, m=96 MiB, p=1 | Produce `finalIconHash` from `state_12` |
| Login derivation | t=4, m=128 MiB, p=1 | Produce `appMaster` |
| Per-credential password | t=3, m=64 MiB, p=1 | Backward-attack defense at password generation |
| Team vault member key | t=3, m=96 MiB, p=1 | Member authentication |

---

## 9. Verifying these claims

The implementation is in `carrypass.js`. The following functions correspond to the described pipeline:

### Authentication and login
- `deriveInitialAdaptiveState(masterPassword)` — initial state from passphrase
- `deriveAdaptiveStateNext(...)` — per-step state transition (called for each of 12 selections)
- `deriveAdaptiveGrid(state, roundNumber)` — deterministic grid derivation from state
- `deriveFinalIconHash(finalState)` — final Argon2id producing `finalIconHash`
- `deriveAppMaster(passphraseBytes, iconHashBytes)` — login Argon2id
- `deriveVaultCanaryKey`, `deriveSessionKey`, `deriveTotpSecretKey`, `derivePasswordKey`, `deriveScreenLockBaseKey` — HKDF sub-keys
- `zeroAppMaster()` — explicit zeroing
- `writeVaultCanary`, `verifyVaultCanary` — empty-plaintext canary

### Password generation
- `derivePasswords(...)` — main entry point
- `materializeSiteSpecificBytes(key, normalizedService, kind)` — HKDF site binding
- `enforceCharacterClasses(...)` — rejection sampling and class enforcement

### Team vault
- `finalizeMember(...)` — initial member-key derivation
- `importMemberVaultFromJson(...)` — member-side decryption
- `importAdminVaultFromJson(...)` — admin-side decryption and the `is_admin` check
- `handleCompleteVaultExport(...)` — per-export rotation
- `encryptWithAAD`, `decryptWithAAD` — AAD-bound vault encryption

Properties worth verifying directly against the code:

- Argon2id parameters in `ARGON_LOGIN_OPTIONS_V4`, `ARGON_PASSWORD_OPTIONS_V4`, `ARGON_VAULT_OPTIONS_V4`, and the icon-step and icon-final constants match the values stated in Section 8.1.
- After all five sub-keys are derived, `appMaster` is set to `null` via `zeroAppMaster()`.
- The HKDF info strings for the five sub-keys are pairwise distinct.
- `finalizeMember` and `importMemberVaultFromJson` derive `memberKey` from the same `password || "::" || totpSecret` input.
- AAD construction uses `stableStringify` consistently across encrypt and decrypt paths.
- The canary's stored plaintext is empty (`new Uint8Array(0)`).

---

## 10. Scope of claims

CarryPass aims for specific, bounded properties. The following are claimed:

- All sensitive cryptographic operations occur in the user's browser.
- No master secret is persisted on disk or transmitted to any server.
- The cryptographic root is reconstructible only from the user's master passphrase plus the adaptive icon sequence.
- Forgotten passphrases cannot be recovered.
- Removed team members lose forward access to vault contents in subsequent exports.
- Per-credential password generation is deterministic and phishing-resistant via service-name binding.

The following are not claimed:

- Defense against state-level adversaries targeting specific users with significant resources.
- Invalidation of credentials already disclosed to a former team member.
- Immunity from compromise of the hosting platform.
- Immunity from browser bugs, malicious browser extensions, or compromised operating systems.
- Hardware-backed authentication factors.
- Post-quantum cryptographic guarantees.

---

## 11. Design trade-offs

### Stateless over server-mediated
CarryPass has no server. This eliminates a central attack target, a privacy policy to violate, and a service that can go down. It also eliminates the possibility of password recovery — a forgotten passphrase cannot be reset.

### Single-admin over multi-admin
A vault has exactly one admin at a time. This simplifies the cryptographic invariants and the consistency model for operational data. Promoting another member to admin is a clean handover; multi-admin would require synchronization protocols across admins, which were judged not worth the complexity.

### Browser-based PWA over native applications
CarryPass runs as a Progressive Web App. It works on any platform with a modern browser, has no app store dependency, and is inspectable via View Source. It is also subject to browser security boundaries and lacks OS-level hardening that native applications can use.

### Adaptive icon sequence with 20-35 second login
The icon sequence and its memory-hard Argon2id stages impose a noticeable login latency. The trade is deliberate: per-step serial computation makes single-channel capture attacks more expensive, while the full input combining passphrase and icon entropy is what Argon2id processes. The latency budget is what the design buys.

### Per-credential Argon2id at lower cost than login
The per-credential stage uses lower Argon2id parameters (t=3, m=64 MiB) than login (t=4, m=128 MiB) because users invoke it many times per session. Both stages still impose memory-hard cost on any brute-force attacker, against passphrase entropy of at least 80 bits.

---

## 12. Document status

This document describes CarryPass as of May 2026. The version string `v4` in cryptographic constants identifies the current format version; changes to the cryptographic structure will increment the version and break compatibility with older stored data, requiring re-registration.

The code in `carrypass.js` is the authoritative reference. If a discrepancy exists between this document and the code, the code is correct and the document should be updated.

---

*[https://carrypass.net](https://carrypass.net)*
