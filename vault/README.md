# CarryPass Configs Folder

This folder is reserved for **admin-generated encrypted configuration files** used by the CarryPass PWA.

## Files typically stored here:

- `carrypass-pad.txt`  
  A large base32-compatible text file used for key and TOTP derivation.

- `carrypass-configs.json`  
  A manifest file listing all available team configs.

- `carrypass-[team].encrypted.json`  
  AES-encrypted service lists for each team, secured by access code and TOTP.

## Notes

- This folder should be present and writable (or updatable) on your server.
- It is **not included in the initial PWA cache** and is designed to be dynamically refreshed.
- If deploying to platforms like GitHub Pages or Netlify, this `README.md` ensures the folder is not stripped during build or deploy.

