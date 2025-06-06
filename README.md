# Upgraded Journey

This repository contains a small Next.js application used to visualize Bitwarden vault data. It can parse a vault export and render items as nodes in a diagram.

## Recovery Relationship Field

Vaultdiagram uses two custom fields to keep recovery relationships intact when a
vault is exported and re‑imported:

* `vaultdiagram-id` &ndash; a pseudo human readable identifier that is unique per
  item.
* `vaultdiagram-recovery-map` &ndash; JSON describing recovery relationships using
  the above identifiers.

In addition services can reference their two-factor authentication methods with
the optional `vaultdiagram-2fa-map` field. The value is JSON structured much
like the recovery map and defaults to an empty object (`{}`) when omitted.

```json
{"providers": ["gmail-1863", "sms-9604"]}
```

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

Items flagged as recovery methods can also use these mappings. This allows a recovery
method to depend on another recovery method or require additional two-factor
providers.


Keeping the value structured allows the application to automatically create edges between items when parsing the vault.

## Lost Access Simulation

Right-click any node in the diagram and choose **Lost Access** to simulate losing it. The node becomes red and semi-transparent. The modal lists recovery methods and, when the lost item is a 2FA provider, all services that rely on it. Collect the recovery codes for those services and store them in a separate vault such as [2favault.reipur.dk](https://2favault.reipur.dk) before you actually lose access.

## Setup

After installing dependencies with `npm install`, start the development server with `npm run dev`.
Open the vault page and you will see a chat panel next to the diagram. Enter your OpenAI API key and select a model from the drop-down to enable chatting with ChatGPT. The key and model are saved in your browser's local storage.
The assistant now starts by asking whether you use Bitwarden or Vaultwarden and will automatically create items when you provide service details.

Use the list panel's **New** button to create additional items with the same UI used for editing.


To enable Google Analytics, copy `app-main/.env.local.example` to `app-main/.env.local` and set `NEXT_PUBLIC_GA_ID` to your measurement ID.

The app is currently in an alpha stage. A small red **ALPHA** banner appears in the top-right corner of every page as a reminder.

## Family Organization Items

When you import or export a vault as *Personal*, items shared through a Bitwarden **family organization** are also included. Any organization with `Family` in its name is treated as part of the personal vault so the items appear alongside your own.

## Version History

Every time the vault is saved a snapshot is appended to a local history stored in your browser. Click **Version History** next to the export button to restore earlier snapshots.

## Web Version

Run `npm run dev` to start the application in development mode. When you are ready to deploy, create an optimized build with `next build` and start it using `next start`.

## Desktop App

The project can also be compiled as a desktop application via [Tauri](https://tauri.app/). After installing the Tauri CLI run `npm run tauri dev` to launch the desktop app during development. Use `npm run tauri build` to produce distributable binaries.

## Offline Mode

Set `NEXT_PUBLIC_OFFLINE=true` in your `.env.local` file to disable external network requests. Logos are loaded from `app-main/public/img` and you can drop additional icons into that folder for offline use.

## Third-Party Services

Bitwarden, Clearbit, Supabase and OpenAI integrations are optional conveniences and are not affiliated with this project.

