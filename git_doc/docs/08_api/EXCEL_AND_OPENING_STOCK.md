# Excel exports and opening stock

Implemented 16 November 2026 following the user's request to add list exports and Owner-accessible file import. Latest explicit user decision on 16 November 2026: only Owner may use opening-stock import and may confirm their own draft; initialization succeeds only once per warehouse. This supersedes H36's former Warehouse preparer / different Owner verifier rule for opening stock only. Stock history and all other workflow separation-of-duties rules remain in effect. The one-time initialization rule was replaced on 27/11/2026 by partial entry with a per-warehouse cut-off and close (see below). Atlas setup was explicitly requested on 17 November 2026; see the setup guide for the applied configuration and limits.

## Excel export contract

The frontend uses ExcelJS 4.4.0, loaded on demand, to generate real `.xlsx` workbooks. Existing authenticated list APIs remain authoritative for permissions, warehouse scope, filters and financial redaction. Export starts at page 1 and fetches all matching pages with the original filters and ordering. Any failed page or repeated record aborts the entire export. Results above 100,000 records are rejected with a request to narrow the filters; they are never silently truncated. Paged exports are read over multiple requests, not a database snapshot; concurrent changes can require retrying.

Workbooks contain Vietnamese headings, frozen headings, automatic filters and a metadata sheet with UTC export time and filter parameters. Document codes and formula-like strings remain literal strings. Quantities with at most 15 significant digits become numeric cells; higher-precision quantities remain text to avoid Excel rounding. Products with different units are never summed. Movement exports retain both endpoints; document items are separate rows. Only an explicit display-field allowlist is exported, not arbitrary JSON, credentials, evidence or permission data.

Coverage: products, lots, suppliers, UOMs, warehouses, locations, inventory, stock movements, replenishments, purchase orders, inspections, goods receipts, awaiting put-away queue, put-away tasks, custody receipts, transfers, relocations, sales orders, outbound deliveries, picking tasks, customer returns, supplier returns, failed deliveries, defects, external references and operational reports. Stocktake list export and detail reconciliation export are separate. Reconciliation export is unavailable in PLANNED/COUNTING and uses the frozen snapshot and selected/latest counts after reconciliation becomes visible. Missing counts remain distinct from confirmed zero.

The existing `/issue-requests` and `/adjustments` screens still use their existing local stores. Their exports use the full filtered local list, and do not establish backend integration for those legacy screens. Existing operational report CSV export remains available alongside Excel. The inventory report remains a current transaction snapshot; historical date-range stock reconstruction is outside this change. Administrative account/role exports are outside the agreed operational scope.

## Catalogue import and partial opening stock (27/11/2026)

Source: user-approved plan `PLAN_import_san_pham_va_ton_dau_ky.md` (27/11/2026), based on the lecturer's review: the opening file references existing products, lots, locations and warehouse; nothing goes to a virtual location; the preview must be editable; manual entry is allowed. It supersedes `PLAN_ton_dau_khu_tiep_nhan.md` (the `TONDAU-NHAN` receiving location) and the 16/11 rule "one initialization per warehouse". The Owner-only rule of 16/11 stays. Backend phases 1–2 are implemented. The frontend (editable preview table, catalogue import page, new opening page) is phases 3–4 and **not implemented yet**: the current FE opening screen does not match this contract until then.

### Decisions

- **Two functions.** Catalogue import creates products and lots. Opening stock only references codes that already exist.
- **Product identity** stays `manufacturerCode + sku + color` (unique index unchanged). Lot rows and opening rows may leave manufacturer/colour empty when the SKU has one product; otherwise the `sku` error lists the manufacturer/colour pairs. Lookup: [product-lookup.js](../../../src/shared/utils/product-lookup.js) (`.trim().normalize('NFC').toLowerCase()`, same as the `vi`/strength 2 collation, NFD text included).
- **D1 warehouse first.** `warehouseId` on the request is the only target. The optional `warehouseCode` column is a cross-check: blank is valid, a different code is a row error. Every location must belong to that warehouse.
- **D1b one cut-off per warehouse.** The first live draft sets `warehouses.openingCutoffAt` from `openingAt` (not in the future, with 2 minutes of clock skew allowed). Later drafts ignore `openingAt` and use the stored cut-off. Cancelling the last DRAFT/POSTED document clears it. The cut-off must be earlier than the first non-`OPENING` stock transaction touching the warehouse's balances; `occurredAt <= openingAt` is refused with that date. Quantities are the physical count at the cut-off; WMS moves after it are already counted.
- **D2 close.** `POST /opening-stocks/warehouses/:warehouseId/close` sets `openingClosedAt`/`openingClosedBy` and audits `CLOSE_OPENING_STOCK` with the reason. Refused while a DRAFT exists. A closed warehouse refuses preview, create and post; later differences go through stocktake. `confirmEmpty` was removed: an empty warehouse is simply closed.
- **D3 same lot and location is allowed.** Posting adds to any existing balance. Preview only warns (`warnings`, column `locationCode`) when the pair repeats in the file or exists in another DRAFT/POSTED document of the warehouse. Each document still posts once (idempotency key, `expectedVersion`, DRAFT only).
- **D4 location**: active `STORAGE` of the selected warehouse, not under a stocktake lock.
- **D5 unit**: only the product base unit or a carton unit (`isCarton`, `areaMm2` null), matched by code first, then by name within the allowed set. A name shared by several codes is refused. Other units, area units included, are refused before conversion. A carton quantity must give whole base units. Whole cartons are saved as one `SEALED` item (in cartons when entered in cartons), the remainder as one `LOOSE` item in the base unit, so `enteredQty × baseUnitsPerUnit = qtyBase`.
- **D6 catalogue import creates only.** A matching existing product/lot is `EXISTS`; any difference is a column error, never an overwrite. Products always compare name, category, base unit and the three sizes; material, surface, origin and description only when filled. Lots always compare tone, calibre, pieces per carton and carton sizes; `manufacturedOn` (UTC `YYYY-MM-DD`) and notes only when filled. Inactive products and lots that are not VERIFIED are errors. All-or-nothing.
- **D8 quantities only.** No cost column; unknown columns are rejected.
- **D9 out of scope.** Accounting period roll-over; non-GOOD or customer-owned stock at the cut-off (opening rows are always `GOOD` + `STORE`). Products without lots (`trackLots`) are phase 5.

### Catalogue import API

| API | Permission / behavior |
| --- | --- |
| POST `/api/products/import/preview` | `product:create`, plus `product_lot:create` when lot rows exist; no writes |
| POST `/api/products/import` | same; one transaction with bulk `insertMany` of products, lots, generated conversions, their operation records and audits |

Body `{ products: ProductRow[≤1000], lots: LotRow[≤1000] }`, at least one row. Cells are strings; `rowNo` is the Excel row shown back. ProductRow: `sku*`, `name*`, `manufacturerCode*`, `color*`, `categoryCode*`, `baseUnit*`, `lengthMm*`, `widthMm*`, `heightMm*`, `material`, `surface`, `origin`, `description`. LotRow: `sku*`, `manufacturerCode`, `color`, `manufacturerLot*`, `tone*`, `calibre*`, `piecesPerCarton*` (integer ≥ 1), `cartonLengthMm*`, `cartonWidthMm*`, `cartonHeightMm*`, `manufacturedOn` (not after today), `notes`. Codes are matched case-insensitively; `manufacturerLot` is exact after trim. Duplicate product triples or `(product, lot)` pairs in the file mark both rows. A lot whose product row failed reports "Sản phẩm ở sheet Sản phẩm đang lỗi".

Response `{ valid, summary: { newProducts, existingProducts, newLots, existingLots, errors }, products: [{ index, rowNo, status: NEW|EXISTS|ERROR, errors: [{ field, message }] }], lots: [...] }`. `index` is the position in the request. Saving with errors returns 400; a duplicate-key race returns 409. Sending the same file again creates nothing. New products get `wholeBaseUnits: true`; new lots are VERIFIED by the importer. Area conversions (active area units) and lot carton conversions follow [conversions.js](../../../src/shared/utils/conversions.js) and are audited as `CREATE_PRODUCT_CONVERSION`; products and lots as `IMPORT_PRODUCT`/`IMPORT_BATCH`. [Service](../../../src/modules/products/product-import.service.js)

### Opening-stock API

Frontend routes today: `/settings/opening-stocks` and `/settings/opening-stocks/:id` (Owner + `opening_stock:read`). All APIs also enforce the Owner role in the service.

| API | Permission / behavior |
| --- | --- |
| GET `/api/opening-stocks/options` | read; `warehouses[{ id, code, name, closed, draftCount, postedCount, cutoffAt }]` (`cutoffAt` only while a DRAFT/POSTED exists or when closed), `units[{ code, name, isCarton }]` (active, non-area), `locations[{ id, warehouseId, code, name }]` (active STORAGE) |
| GET `/api/opening-stocks` | read; documents |
| GET `/api/opening-stocks/:id` | read; display labels for items |
| POST `/api/opening-stocks/preview` | create; no writes |
| POST `/api/opening-stocks` | create; one DRAFT per call |
| POST `/api/opening-stocks/:id/post` | post; Owner may confirm their own draft |
| POST `/api/opening-stocks/:id/cancel` | create; creator cancels a DRAFT; clears the cut-off when nothing live remains |
| POST `/api/opening-stocks/warehouses/:warehouseId/close` | post; body `{ reason }` |

Preview body: `{ warehouseId, openingAt, rows[1..1000] }`. Create adds `sourceDescription` (≤ 2000), `openingImportSource` (`FILE` or `MANUAL`) and `idempotencyKey`. The server sets `cutoverKey` to `TONDAU-<warehouse code>`. Row: `rowNo`, `sku*`, `manufacturerCode`, `color`, `manufacturerLot` (required until phase 5), `locationCode*`, `warehouseCode`, `enteredQty*` (positive, ≤ 6 decimals), `enteredUnit*`. The service parses rows one by one, so type and business errors come back together per column. `previewRowErrors` was removed.

Preview response: `{ valid, cutoffAt, fileErrors, rows: [{ index, rowNo, status: OK|WARNING|ERROR, errors, warnings, product, sku, batch, tone, calibre, location, quantityBase, unit }] }`. Request-level problems (missing warehouse, no access, closed warehouse, cut-off after the first stock move) return 400. Capacity is checked per location together with the stock already there, lots outside the file included, and reported on `locationCode`. Create repeats every check except warnings and refuses any row error. The header keeps `coveredLocationIds` = locations used by the rows and `openingAt` = `occurredAt` = warehouse cut-off.

Create, post and close all take the same `guardWarehouses` lock first, so a closed warehouse never gets a new draft. Post revalidates identities with `makeItem`, checks that every covered location is still an active, unfrozen STORAGE location of the warehouse, adds to balances with `receiveStock` and runs `verifyCapacity` on the covered locations. Uploaded data and drafts never change stock.

### Body size

The four import endpoints (`POST /api/products/import/preview`, `/api/products/import`, `/api/opening-stocks/preview`, `/api/opening-stocks`) accept JSON up to 8 MB; every other route keeps 1 MiB. A 413 says "vượt quá giới hạn 8 MB, hãy tách file" on import routes and "vượt quá giới hạn 1 MiB" elsewhere ([app.js](../../../src/app.js), [errorHandler.js](../../../src/middlewares/errorHandler.js)).

### Persistence and setup

`warehouses` gains `openingCutoffAt`, `openingClosedAt` and `openingClosedBy`. `opening_stocks.header.openingImportSource` accepts `MANUAL`. The unique index `opening_stock_file_import_once` was removed from the model. On an existing database, run the [setup](../09_phat_trien/EXCEL_OPENING_SETUP.md) **before** deploying this backend: it drops that index and backfills the cut-off of warehouses that already have a POSTED opening document. `TONDAU-NHAN` locations and stock created by the previous version are kept; move that stock with [location movement](location-movements/README.md).

## History: 16/11 opening-stock contract (superseded 27/11/2026)

The 16/11 version allowed one POSTED file import per warehouse (unique partial index `opening_stock_file_import_once`), created missing products and lots from the opening file, put all stock into an auto-created `TONDAU-NHAN` RECEIVING location, accepted `confirmEmpty` for empty warehouses and reported Zod row errors through `previewRowErrors`. On 17/11 the additive setup (permissions, Owner grants, that index) was applied to the Atlas database `sep490`; no stock or business documents were seeded. Owner-only access and the posting rules (TDK identities, idempotent post, stock history) carry over unchanged.
