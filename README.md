# Upgraded Journey

This repository contains a small Next.js application used to visualize Bitwarden vault data. It can parse a vault export and render items as nodes in a diagram.

## Recovery Relationship Field

Vaultdiagram now stores its metadata in a single custom field named `vaultdiagram`. The field contains a JSON object with information such as:

* `id` – a pseudo human readable identifier unique per item.
* `logoUrl` – optional logo URL for the service.
* `nestedDomain` – optional domain for nested icons.
* `recoveryNode` – boolean indicating whether the item is a recovery method.
* `recoveryMap` – object with optional `recovers` and `recovered_by` arrays of `id` values describing recovery relationships.
* `twofaMap` – object with a `providers` array referencing `id` values of 2FA providers.

Example:

```json
{
  "id": "gmail-1863",
  "logoUrl": "https://mail.google.com/favicon.ico",
  "recoveryMap": { "recovered_by": ["sms-9604"] },
  "twofaMap": { "providers": ["auth-app-1111"] }
}
```

Items flagged as recovery methods can also use these mappings. This allows a recovery method to depend on another recovery method or require additional two-factor providers.

Keeping the value structured allows the application to automatically create edges between items when parsing the vault.

## Lost Access Simulation

Right-click any node in the diagram and choose **Lost Access** to simulate losing it. The node becomes red and semi-transparent. The modal lists recovery methods and, when the lost item is a 2FA provider, all services that rely on it. Collect the recovery codes for those services and store them in a separate vault such as [2favault.reipur.dk](https://2favault.reipur.dk) before you actually lose access.

## Setup

After installing dependencies with `npm install`, start the development server with `npm run dev`.
Open the vault page and you will see a chat panel next to the diagram. Enter your OpenAI API key and select a model from the drop-down to enable chatting with ChatGPT. The key and model are saved in your browser's local storage. Available models and their labels are defined in `app-main/lib/aiModels.ts` for easy management.
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

## Invoicing & Login

Visit `/login` and enter your e-mail address to receive a Supabase magic link. After confirming the link you can access `/invoice` to create PDFs that are stored in Supabase Storage.
