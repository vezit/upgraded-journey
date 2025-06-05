# Upgraded Journey

This repository contains a small Next.js application used to visualize Bitwarden vault data. It can parse a vault export and render items as nodes in a diagram.

## Recovery Relationship Field

Vaultdiagram recognizes a custom Bitwarden field named `vaultdiagram-recovery-map` to describe account recovery relationships. The field value must be valid JSON with optional keys:

- `recovers`: array of item names the current item can recover.
- `recovered_by`: array of item names that can recover the current item.

Example for an item that recovers two others:

```json
{"recovers": ["LinkedIn", "Netflix"]}
```

The recovered items would include the opposite link:

```json
{"recovered_by": ["Gmail"]}
```

Keeping the value structured allows the application to automatically create edges between items when parsing the vault.
