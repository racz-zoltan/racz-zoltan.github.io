# License — Hungarian Diceware Wordlist

## Scope of this license

This license applies **only** to the Hungarian Diceware wordlist
(`diceware_hungarian.js` / `diceware_hungarian.txt`) and to this
license document.

The rest of the CarryPass project — including all source code — is
licensed separately under the **MIT License**. See the root `LICENSE`
file for those terms.

## Copyright

```
Hungarian Diceware Wordlist — 1296 words
Version: 1.0.0
Copyright (c) 2026 Zoltán Rácz
Licensed under CC BY 4.0
https://creativecommons.org/licenses/by/4.0/
```

The wordlist was originally created for the CarryPass project
(<https://carrypass.net>), an open-source privacy-first credential
manager. The list is published independently under CC BY 4.0 so that
others may use, adapt, and redistribute it outside the CarryPass
context.

## Method

The list contains exactly **1296 words** (6⁴), the standard size for a
four-dice Diceware list. Each word corresponds to a unique four-digit
dice roll from `1111` to `6666`, providing approximately
**10.34 bits of entropy per word** (log₂ 1296).

For reference, the entropy of a randomly-generated passphrase from
this list scales as:

| Words | Entropy (bits) |
|------:|---------------:|
|     5 |          ~51.7 |
|     6 |          ~62.0 |
|     7 |          ~72.4 |
|     8 |          ~82.7 |
|    10 |         ~103.4 |

The goal of the list is to provide a Hungarian-language Diceware
wordlist optimized for **memorability and cross-device typability**.
Every word is:

- **Hungarian** — drawn from common Hungarian vocabulary (with a small
  number of established loanwords)
- **Concrete and image-rich** — preferring tangible nouns, vivid
  adjectives, and onomatopoeic verbs over abstract terms
- **ASCII-only** — no diacritics (no á, é, í, ó, ö, ő, ú, ü, ű), so
  the words can be typed reliably on any keyboard layout without
  requiring Hungarian input method support
- **Distinct in spelling** — words that share a stem-family with
  another word on the list have been minimized
- **Sorted by Hungarian alphabetical convention** — including correct
  handling of digraphs (cs, gy, ly, ny, sz, ty, zs) and the trigraph
  dzs as separate letters

The list is structurally validated (no duplicates, all 1296 entries
unique, all entries ASCII, alphabetical ordering verified) and
spell-checked against the Hungarian Hunspell dictionary.

## License terms

The Hungarian Diceware wordlist is licensed under a
**Creative Commons Attribution 4.0 International License**
(CC BY 4.0).

You are free to:

- **Share** — copy and redistribute the material in any medium or
  format
- **Adapt** — remix, transform, and build upon the material for any
  purpose, even commercially

Under the following terms:

- **Attribution** — You must give appropriate credit, provide a link
  to the license, and indicate if changes were made. You may do so in
  any reasonable manner, but not in any way that suggests the licensor
  endorses you or your use.

- **No additional restrictions** — You may not apply legal terms or
  technological measures that legally restrict others from doing
  anything the license permits.

Full license text: <https://creativecommons.org/licenses/by/4.0/legalcode>
Human-readable summary: <https://creativecommons.org/licenses/by/4.0/>

## Required attribution

When you reuse or adapt this wordlist, please attribute it as follows.
Adjust the wording to fit your medium, but include the required
elements: title, author, source, license name with link, and a note if
you modified the work.

**Prose attribution:**

> Hungarian Diceware Wordlist by Zoltán Rácz, originally created for
> CarryPass (<https://carrypass.net>), licensed under CC BY 4.0
> (<https://creativecommons.org/licenses/by/4.0/>).
> [If modified, add: "Modified from the original."]

**Source code attribution (header comment):**

```javascript
// Hungarian Diceware Wordlist — 1296 words
// Version: 1.0.0
// Copyright (c) 2026 Zoltán Rácz
// Originally created for CarryPass — https://carrypass.net
// Licensed under CC BY 4.0
// https://creativecommons.org/licenses/by/4.0/
// [Modified: <describe modifications, if any>]
```

## What "modified" means in practice

If you change individual words, the size of the list, the order, or
the spelling conventions, you should note this in your attribution.
A note like "Modified from the original: replaced N words to match
[reason]" is sufficient.

You do **not** need to mark the work as modified if you merely embed
or display the unaltered list as part of a larger project, or
translate this license document into another language.

## What CC BY 4.0 does not cover

CC BY 4.0 governs the wordlist as a creative work. It does not:

- Grant any trademark rights related to "CarryPass" or related names
- Provide any warranty about fitness for cryptographic use (the
  wordlist's use within a passphrase-generation context is the
  reuser's responsibility)
- Override the underlying MIT license on the rest of the CarryPass
  project

---

*Document version: 1.0 — May 2026*
