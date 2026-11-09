# Threat Model

**Status:** Approved project baseline — 2026-11-09.

## Method and review triggers

Use STRIDE to identify threats at each trust boundary. Revisit this model when authentication/authorization, data flows, uploads, integrations, CI permissions, or deployment boundaries change materially. Routine changes that do not affect a trust boundary or risk flow do not require a full threat-model revision.

For each threat, record the asset, boundary/entry point, STRIDE category, scenario, Impact, Likelihood, score, mitigation, owner, and verification evidence. Do not include secrets or private evidence in this document.

## Risk rating

Rate Impact and Likelihood as Low=1, Medium=2, or High=3. Multiply the values:

| Score | Rating | Treatment |
| --- | --- | --- |
| 1–2 | Low | Record and monitor as appropriate. |
| 3–4 | Medium | Record mitigation or rationale for deferral. |
| 6–9 | High | Mitigate before release or obtain project-owner acceptance with rationale and follow-up recorded. |

Required CI and branch-protection checks cannot be waived through risk acceptance.

## Initial assets and trust boundaries

- **Assets:** credentials/tokens, role and warehouse assignments, inventory and transaction history, customer/supplier data, uploaded evidence, environment secrets, and database backups.
- **Boundaries:** browser ↔ API, API ↔ MongoDB, API ↔ upload/storage provider, developer environment ↔ GitHub/CI, and deployment environment ↔ database.
- **Threat candidates:** spoofing or privilege escalation, unauthorized record/warehouse access, transaction tampering or replay, repudiation/audit gaps, information disclosure through API/upload/log/backup, denial of service, and CI/dependency compromise.

## STRIDE tracking table

| ID | Asset and boundary | STRIDE scenario | Impact | Likelihood | Score/rating | Mitigation | Verification evidence | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | Assess against current architecture | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## Repository notes

- **BE:** Treat server-side authentication, permission, warehouse/record scope, validation, upload handling, database transactions, and audit history as security controls to verify.
- **FE:** Treat browser state, user input, API responses, and rendered evidence as untrusted; UI permission hiding is not an authorization boundary. Never put a server secret in a frontend bundle.
