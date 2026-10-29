# Return workflows — Trungph, iterations 1–3

Mounted under `/api`; all routes require active authentication and operation permissions. Quantities are decimal strings in base units. Mutations require `expectedVersion` and a stable `idempotencyKey`, except initial creation and the pre-existing versioned CR/defect decisions. Forms retain entered contents after errors. A changed payload must use a new key; retry the identical request with the same key.

| UC | Routes / service |
|---|---|
| 63–67 | Existing `/defects` module, now connected to API screens; search/scope filters, defect hold, Owner decision, Warehouse execution |
| 68–71 | Existing `/customer-returns` module, now connected to API screens; delivered/historical source claims, versioned assessment and correct decision kind |
| 72–73 | POST `/customer-returns/:id/receipt`, `/reassess`, `/handback`; GET/POST `/failed-deliveries`; GET `/:id`; POST `/:id/inspect`, `/:id/receipt` |
| 79–83, 107 | GET/POST `/supplier-returns`; GET `/:id`; POST `/:id/agreement`, `/dispatch`, `/acknowledgement`, `/close` |
| 102 | GET `/lots/:id/trace`; GET `/lots/:id/trace/evidence/:evidenceId` |
| 108 | GET/POST `/external-references` |
| Shared | GET `/return-workflows/options`; POST `/return-workflows/:id/evidence`; GET `/return-workflows/:id/evidence/:evidenceId` |

Validation is in `workflow.validation.js`; existing CR/defect validation remains in the original modules. API envelopes use `data`; paginated lists return array `data` and `meta`. ObjectIds, Decimal128 quantities and timestamps serialize as strings. The frontend lives at `NameUi/src/features/return-workflows` with the existing sidebar URLs; it does not read the legacy localStorage domain stores.

Physical commands coordinate location planning guards, stocktake locks, optimistic balance versions, exact decimals, source claims, posting batches, ledger movements, document links, operations and audit events inside MongoDB transactions. Supplier agreements precede dispatch; ACK/closure never post stock. Reassessment never reposts custody. CR receipt changes ownership from customer custody; GR-FD receives owned stock and reopens the original demand atomically. Installed/customer-damaged/verified-overdue CR goods remain excluded.

Supplier proposals use `SUPPLIER_RETURN` line details with phase `PROPOSED`; phase `VERIFIED` (also the default for existing records) retains mandatory agreement evidence/actor/time. External reference additions are optional on existing records. Historical delivery sources require verified evidence, matching customer/product/lot/conversion, remaining source quantity, and no competing WMS issue chain. `ReturnSourceClaim.consumedQty` records actual accepted consumption when it differs from the original request; older consumed claims continue to use qtyBase.

Evidence uploads use authenticated Cloudinary assets and verify image signatures. Retrieval checks current parent or lot scope before issuing a signed URL. Existing seeded placeholder keys are not real uploaded images. No new dependency was introduced.

Run `npm test` for local regression/contracts. The opt-in transaction/HTTP integration test uses `MONGODB_TEST_URI`, a random `ret_test_<ObjectId>` database, and cleanup restricted to that database. It covers supplier lifecycle, defect destruction/release, CR custody/acceptance/receipt, reassessment/handback, FD reopening, retries, freeze rollback, role/scope denials, external references and verified history. The normal suite skips database tests without that variable.

Deployments must retain the model's unique indexes, particularly `BusinessOperation.idempotencyKey`, `PostingBatch.idempotencyKey`, `ReturnSourceGuard.salesIssueLineId`, the active `DefectHold.balanceId` index and external-reference identities. No existing project records are reseeded or rewritten by this feature. Other modules' writers must continue using the same location/source guards.
