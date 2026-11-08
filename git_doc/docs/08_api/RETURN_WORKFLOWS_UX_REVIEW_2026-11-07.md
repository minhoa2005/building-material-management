# Trung workflow usability review — 7 November 2026

Scope: the currently routed defect, customer-return, failed-delivery and supplier-return lists, creation/detail/command forms, lot trace and external references. The user's reported long customer dropdown initiated a review of the complete routed module. Existing typography, palette and shared controls remain the visual authority. No new business permissions, models, collection or Atlas write is introduced.

| Priority | Confirmed problem | Change |
|---|---|---|
| P1 | Growing catalogs and embedded source histories loaded into one options request | Compact bootstrap plus server search/pagination; large choices use record tables with identity and context. |
| P1 | Changing warehouse/partner/balance retained incompatible source selections | Dependent choices and quantities clear; source queries filter warehouse, customer, supplier and lot. |
| P1 | Source and balance labels lacked remaining quantity, units, ownership and bin context | Scoped lookup metadata includes batch/product/location, exact quantities and advisory remaining amounts. |
| P1 | Reporting suspect goods forced a proposal and preselected scrap | Detection/hold is distinct from an optional proposal; disposal is an explicit choice. |
| P1 | Physical quantities and acceptance outcomes were prefilled | Actual quantities, acknowledgement outcome and receiving quality require entry; quantities validate exact decimals and whole-unit products. |
| P1 | Stock-changing/decision actions submitted without a consequence review | A review shows the document, product quantities, note and effect before submission. |
| P1 | Removing a middle line could show the next quantity under the wrong product name | Titles and units resolve the stable embedded ID from the current form store. |
| P1 | Upload-driven version refresh remounted the command and discarded entered work | Stable command component identity; upload in place; preserved values and inline errors. |
| P1 | Supplier close submitted line fields forbidden by the strict close API | Closure submits only version, operation key and note. |
| P1 | External references required a new upload even where the actor could only reuse parent evidence | Paginated parent-evidence selection and explicit upload permission; no permission widening. |
| P1 | External evidence upload could make the selected source version stale | Dedicated scoped reference-context refresh after upload; source changes clear evidence and lines. |
| P1 | Lot trace fetched every history section together | Section tabs fetch bounded pages independently. |
| P1 | Detail DTO returned before applying price redaction | Detail now applies the intended redaction and adds readable lot codes. |
| P1 | Expanded sidebar squeezed forms on phone widths | Menu initially collapses on phones, overlays when opened and closes on navigation; closed navigation is inert. |
| P2 | Oversized inline filters, blank generic quantity columns, missing totals | Drawer filters/reset, contextual list columns, empty states and paginated external-reference totals. |
| P2 | Missing filenames/file-size guidance; PDFs labelled as images | Shared upload controls validate PNG/JPEG/PDF and 5 MB; detail uses filenames and media labels. |
| P2 | Raw assessment codes and unexplained handoffs | Translated assessment labels, permissions-based actions/trace links and next-step guidance. |
| P2 | Trace cache could remain stale after a workflow mutation | Trace section queries share workflow invalidation. |
| P2 | History mapping discarded already-normalized dates/details | Mapping retains the supplied event timestamp and detail text. |

## Verification and limits

- Local MongoDB integration checks exercise pagination, literal search, permissions, warehouse/partner/source scope, compact bootstrap, trace section bounds and privacy. They use only a random `returns_lookup_<ObjectId>` database on the isolated local replica set and remove only that database.
- The existing native return transaction suite remains separate; browser inspection does not replace those checks.
- Frontend behavior checks cover lookup paging/search, dependency clearing, deliberate defect reporting, consequence review, close payload, upload refresh, stable partial-row identity, exact quantity boundaries, trace tabs and responsive navigation.
- Browser checks use the running local application at desktop and emulated phone widths. Physical device behavior and real Cloudinary uploads are not claimed.
- Existing full-trace callers retain their old response. The new UI fetches bounded sections; very large source-identity graphs may still need database profiling/index review under production workloads.
- Actual command limits remain authoritative on the server. Advisory lookup quantities can change while a form is open.
- No automatic commit, push or merge is part of this review. The backend changes are isolated from the earlier presentation checkout in the `codex/trung-workflow-usability` worktree.


Recorded validation: frontend production build passed; 30 targeted frontend checks passed across five files; scoped ESLint passed. Eight local lookup/trace integration/validation checks and the existing 23 native return checks passed. Documentation checks passed with the current main registry (60 collections, 671 local links). The Impeccable deterministic scan returned no findings for the workflow module. Full frontend lint still reports five errors and one warning in untouched routes/product/purchase/receipt files. The repository's ui:check/ui:cleanup scripts and referenced ui-visual-test skill are absent; browser/manual checks were used instead. Browser checks confirmed searchable selection at 1440px and 390px, phone menu behavior, and Sales denial for the external-reference route. These are emulated viewports, not physical-device acceptance or a browser-posted stock transaction.
