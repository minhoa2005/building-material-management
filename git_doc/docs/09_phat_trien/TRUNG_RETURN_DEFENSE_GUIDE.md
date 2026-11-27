# Customer and supplier return defense guide

Use the [hosted WHMS app](https://wmsd.tanthuong.workers.dev/) for the Atlas demo and the local app for the prepared rehearsal cases. Sign in manually with the team's demo credentials. Each submitted action changes stock or document state. Check current quantities before using a shared record.

## Hosted demo sources

All three routes use **K-GACH-01**. The hosted API returned these sources on 27 November 2026. The quantities can change with team activity.

| Route | Enter or select | What to show |
|---|---|---|
| [Hàng khách trả](https://wmsd.tanthuong.workers.dev/returns) | As Sales, choose **Yêu cầu mua hàng của khách (trong hệ thống)** → **ĐBH-KD-261126-000001**. Select **PXB-K-GACH-01-261126-000001**, lot **AP6601-261001-A**, and enter **4 viên** or **1 thùng**. The line offered **20 viên**. | The second shipment, **PXB-K-GACH-01-261126-000002**, offered **2 viên**. Add it as a separate line to demonstrate that one return can cover shipments from the same request and warehouse. |
| [Trả nhà cung cấp](https://wmsd.tanthuong.workers.dev/supplier-returns) | As Warehouse Staff, choose the supplier on **PN-202610-001**, its line for **AP6601-261001-A**, and the **STORE** balance at **STORAGE-02**. Enter **4 viên**. The line offered **115 viên** and the balance offered **42 viên**. | The goods belong to the store. The dispatch creates a supplier return issue and reduces store stock. |
| [Phiếu tạm giữ](https://wmsd.tanthuong.workers.dev/custody-receipts/PNGH-K-GACH-01-261113-000001) | Open **PNGH-K-GACH-01-261113-000001** as Warehouse Staff. The posted receipt offered **3 viên** to return to **Công ty gạch Thành Việt**. Start from the return action on the custody line. | Open the linked [inspection PKN-K-GACH-01-261113-000001](https://wmsd.tanthuong.workers.dev/inspections/PKN-K-GACH-01-261113-000001). It records **6 viên accepted** and **6 viên held**. The dispatch creates a custody release and lowers the supplier-owned balance. |

For a standalone customer source, leave the internal purchase request blank and select **PXB-K-GACH-01-261116-000001**. It offered **1 viên**. For a staged fallback, **ĐTK-K-GACH-01-261126-000001** was **OPEN** with **1 viên** requested.

## Start the local demo

The [local rehearsal app](http://127.0.0.1:3335/) uses API port 3333 and replica-set database `wmsd_demo_trung_20261112`. The purchase-request picker is available there. Use the [local rehearsal reference](TRUNG_DEMO_LOCAL.md) for the prepared cases and the results of the local run.

Use these synthetic local accounts.

| Role | Username | Use |
|---|---|---|
| Sales | sales@ceratile.vn | Create the customer return and make the Sales decision |
| Warehouse Staff | warehouse@ceratile.vn | Inspect, receive, dispatch, and hand back |
| Accountant | accountant@ceratile.vn | Agree, acknowledge, and close supplier returns |
| Owner | owner@ceratile.vn | Make eligible customer return exception decisions |

Use warehouse `K-GACH-01`. Prepared examples use product `Gạch lát nền vân đá trắng 60×60`, lot `AP6601-261001-A`, `4` base pieces per sealed carton, `TRUNG-STOCK`, `TRUNG-CUSTODY`, `TRUNG-RECEIVE`, and `TRUNG-QUARANTINE`. Search `DEMO Trung` to find rehearsal records. Each action consumes quantity and advances state, so a used case may need another prepared case.

## Customer Return

### Normal path

1. **Sales creates the request.** Select the warehouse and the posted sale source. On the hosted app, choose a purchase request first to filter shipments, or go directly to the source picker. An order-linked return can group lines from the same request, warehouse, and intake mode. Standalone and verified historical returns each use one source document. Confirm the customer name and optional phone. The optional manual reference is for cross-reference. Enter 4 pieces or one 4-piece carton and a line reason such as **Khách trả hàng dư, thùng còn nguyên**.
2. **Warehouse Staff inspects the goods.** For the four-tile example, enter actual quantity **4**, **Nguyên niêm phong**, **Chưa sử dụng**, and **Không hỏng**. Choose **Còn hạn đã xác minh** when supported and enter the date or agreement in **Căn cứ thời hạn / lý do chưa rõ**. Enter **Kiểm đủ 4 viên, bao bì nguyên** as the line conclusion. Upload and select the inspection evidence, enter a note, and confirm. Direct intake records facts without a stock posting. Legacy cases record customer custody in the chosen holding location.
3. **Sales decides.** Choose **Chấp nhận** or **Từ chối** and give the reason. Enter **4** for the accepted line in this example. When deciding by line, include every line and use zero for a refused line. The decision authorizes receipt of the approved quantity. The Owner exception action applies when the assessment makes it available.
4. **Warehouse Staff receives accepted goods.** Select **Lập phiếu nhập**. Enter actual quantity **4**, the actual quality, and an eligible destination. For usable goods, use **GOOD** and a receiving location such as **RECEIVING-01** on the hosted app or **TRUNG-RECEIVE** in local rehearsal. Select the evidence and confirm **Ghi tồn** to post store stock. A partial receipt leaves the balance on the same return.
5. **Warehouse Staff records handback when the customer collects refused goods.** Enter actual quantity, recipient, evidence, and note. Direct intake records handback without a stock movement. Legacy intake releases customer-owned custody. The cap is inspected quantity minus approved quantity and previous handbacks.

### Customer-return alternatives and defenses

- **Standalone SALE issue.** No Sales Order is required. Eligibility is the posted issue quantity less undelivered returns and existing claims.
- **Purchase-request linked issue.** The cap uses the quantity recorded as delivered less existing return claims. Warehouse completion can record the open quantity as delivered. The entry establishes what the operator recorded.
- **Short arrival.** If 10 were requested and 6 arrive, inspection records 6. Acceptance of 6 releases the source claim on the other 4. If 10 arrive and 6 are accepted, record handback of the refused 4 when collected. If 10 are accepted and 6 received into stock, post the remaining 4 on a second receipt under the same return.
- **Historical delivery.** Accountant records and verifies the external delivery with customer name, warehouse, product, lot, quantity, reference number, date, correlation ID, and evidence. Sales then uses that verified line as the source.
- **Customer refuses or goods are installed/damaged.** Record the physical facts and reject the line. If the exception rules allow review, Owner makes the exception decision. If it is rejected, use handback. Do not receive it as STORE stock.
- **Lost response or double-click.** Resubmit the same payload, `expectedVersion`, and `idempotencyKey`. The server replays the original result without a second stock movement. Changing any value requires a new key.
- **Quantity mismatch.** Explain that all quantities are base-unit decimal strings. `1` means one base unit. For this demo, one sealed carton is `4`, not `1`.

Prepared customer cases include `ĐTK ... 000001` through `000006`. The most useful sequence is `000001` for inspection, `000002` for Sales decision, `000004` for receipt, and `000005` for handback.

## Supplier Return

### Start from store-owned stock

1. **Warehouse Staff starts Supplier Return.** Use the hosted stock row above or the local **TRUNG-STOCK** balance. Select the supplier, the matching line on **PN-202610-001**, and the lot and location. Enter **4 viên** and a note such as **Trả một thùng theo thỏa thuận NCC**.
2. **Accountant records the agreement.** Enter **4 viên** per line for this example, the **Số / nội dung thỏa thuận NCC**, a note, and the attached agreement. Agreement authorizes dispatch without moving stock. Enter zero for a refused line.
3. **Warehouse Staff dispatches.** Enter the actual **4 viên**, **Người thực nhận bàn giao**, a note, and evidence. Dispatch posts a supplier return issue and reduces the store-owned balance. Continue a partial dispatch on the same request.
4. **Accountant records supplier acknowledgement.** Select the dispatched line, enter **4 viên**, choose **Chấp nhận**, and attach the supplier response. If the supplier reports rejection or damage, record it with evidence. Closure waits for acceptance of the full dispatched quantity. The correction action can fix a mistaken acknowledgement. Physical re-receipt and dispute settlement have no action in this workflow.
5. **Accountant closes.** Reconcile the dispatched and acknowledged quantities, add the closing note, and close only when the return is fully resolved.

### Start from supplier custody after purchase inspection

This path starts after Purchase Order receiving and inspection when the warehouse does not accept all delivered goods as STORE stock.

1. During purchase inspection, enter the actual product, lot, condition and quantity for each part. Mark the held part **Tạm giữ** and choose **Chốt kiểm**. Post the accepted purchase receipt to record store ownership. Post the linked **Phiếu tạm giữ** with the holding location to record supplier ownership. Use the linked hosted inspection above to show the recorded 6/6 split.
2. Post the Custody Receipt before starting the supplier return. The custody item exposes its `custodyBalanceId` and `returnAvailableQty`. Use that exact balance and enter the quantity to return. The system does not create a Defect Report and does not create a Supplier Return Issue for supplier-owned custody.
3. Warehouse Staff starts the proposal from the custody line. Enter the quantity and reason. The existing record supplies the warehouse, supplier, lot and balance. The case starts at `AGREEMENT_PENDING`.
4. Accountant agrees, Warehouse dispatches a `CustodyRelease`, and Accountant acknowledges and closes. The release reduces supplier custody. It does not reduce STORE stock.
5. If the goods move or change ownership, select the current eligible balance and verify its ownership and receipt lineage in the ordinary proposal form.

Prepared supplier cases use suffixes `000001` through `000005`. Use `000001` for agreement, `000002` for dispatch, `000003` for acknowledgement, and `000004` for closure.

## Questions a reviewer may ask

- **When does stock move?** Direct customer inspection records the facts. Posting the Customer Return receipt adds accepted stock. Supplier dispatch removes the quantity handed over from its store-owned or supplier-owned balance.
- **Why two quantities?** `qtyBase` is the base-unit quantity. Packaging fields describe the physical presentation and preserve carton or loose-piece evidence.
- **Why is supplier custody separate?** Ownership remains with the supplier until a later accepted receipt or a custody release. Store stock must not increase from supplier-owned custody.
- **Why require a version and idempotency key?** `expectedVersion` prevents stale edits. `idempotencyKey` makes retries safe after a timeout.
- **What happens after a partial action?** The record remains in a partial state and the detail shows the positive remaining quantity. Continue with a new command using the new version and a new key.
- **Can the same source be used twice?** Only up to the server-calculated remaining allowance. Existing claims, dispatches, receipts, handbacks, custody releases, locks, permissions, and warehouse scope are checked in the transaction.

## Atlas readiness

The published frontend is `https://wmsd.tanthuong.workers.dev`. Its compiled API target is `https://wmsd-be.tanthuong.workers.dev/api`. On 27 November 2026, the hosted API returned HTTP 200 for health and Sales login, and Sales, Warehouse, Accountant, and Owner could read their scoped return endpoints. The API returned the CORS origin for the published frontend.

The configured Atlas database `wmsd_database` returned a successful read-only ping and 62 collections. It contained 11 customer returns, 11 supplier returns, 14 custody receipts, and 9 custody releases at the check. The hosted API returned matching records from this dataset.

The checks for the local November 12 return cases, `TRUNG-HISTORY-001`, and locations beginning with `TRUNG-` returned zero matches in Atlas. Use the hosted example records for the Atlas walkthrough.

The running local checkouts were 42 commits behind their published branches. The published backend passed 29 focused checks on disposable local databases, including returns across two shipments, supplier custody dispatch and closure, and partial quantities. The published frontend passed six return demo tests. Hosted verification covered role sign-in, source lookups, and custody receipt reads. An end-to-end hosted write rehearsal remains unverified.

[Published return workflow contract](https://github.com/minhoa2005/building-material-management/blob/f0e04ff/git_doc/docs/08_api/RETURN_WORKFLOWS_NATIVE.md) · [Worker deployment configuration](CLOUDFLARE_WORKERS.md)
