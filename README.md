# Upgraded Journey

This repository contains a small Next.js application used to visualize Bitwarden vault data. It can parse a vault export and render items as nodes in a diagram.

## Recovery Relationship Field

Vaultdiagram uses two custom fields to keep recovery relationships intact when a
vault is exported and re‑imported:

* `vaultdiagram-id` &ndash; a pseudo human readable identifier that is unique per
  item.
* `vaultdiagram-recovery-map` &ndash; JSON describing recovery relationships using
  the above identifiers.

The JSON object may contain the optional keys:

* `recovers` – array of `vaultdiagram-id` values that this item can recover.
* `recovered_by` – array of `vaultdiagram-id` values that can recover this item.

Example for an item with the identifier `gmail-1863` that recovers two others:

```json
{"recovers": ["linkedin-7845", "netflix-30a1"]}
```

The recovered items would reference the recovering identifier:

```json
{"recovered_by": ["gmail-1863"]}
```

Keeping the value structured allows the application to automatically create edges between items when parsing the vault.

## Setup

After installing dependencies with `npm install`, start the development server with `npm run dev`.
Open the vault page and you will see a chat panel next to the diagram. Enter your OpenAI API key and select a model from the drop-down to enable chatting with ChatGPT. The key and model are saved in your browser's local storage.
