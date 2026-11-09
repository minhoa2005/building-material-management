# Data Handling

**Status:** Approved project baseline — 2026-11-09.

## Classification and handling

| Class | Examples | Rules |
| --- | --- | --- |
| **Public** | Information approved for public release | May be published or used in AI prompts. Check that the specific material is approved for release. |
| **Internal** | Project source, internal design notes, non-sensitive development information | Share only with project collaborators and approved project tools. May be used in AI prompts if it contains no Sensitive or Secret information. |
| **Sensitive** | Identifiable customer, supplier, account, or warehouse data; real evidence; logs with identifiers; database backups or exports | Restrict access to people who need it. Do not put it in AI prompts, development/test fixtures, or public Git. Retain/delete according to the data owner's policy. |
| **Secret** | Passwords, tokens, signing keys, database credentials, private keys, credential hashes | Never commit, log, or include in AI prompts. Store only in an approved secret store or protected local environment; rotate/revoke promptly if exposed. |

If data fits more than one class, apply the stricter handling rule.

## Development and testing

Use synthetic data only in development and test environments. Do not copy production or other real business data into fixtures, screenshots, local databases, or test reports. Use placeholders in `.env.example`; keep actual `.env` values local or in approved deployment secrets.

## Storage, access, and retention

Keep Sensitive data and backups in access-restricted storage outside Git. Minimize copies and retain them only as allowed by the data owner's retention policy. Do not invent a project retention period when the data owner has not specified one; ask the owner before keeping a copy beyond its immediate approved purpose.

## Suspected exposure

Stop further sharing immediately. Notify the project owner through the approved private channel. Revoke or rotate exposed credentials, restrict/remove the exposed copy where possible, and record the incident without reproducing the leaked data. Preserve only sanitized details needed to assess impact and recovery.

## Repository notes

- **BE:** `.env` contains local secrets; `.env.example` must contain placeholders only. Migration/backup files may contain account records and credential hashes and must remain private.
- **FE:** `.env` is local configuration and must not contain secrets intended to be protected from browser users. Never ship private keys or server credentials in frontend bundles; browser-visible configuration is not a secret.
- **Both:** Synthetic fixtures are the default. Only Public/Internal material may enter AI prompts. See `ai-disclosure.md` and `ai-log.md`.
