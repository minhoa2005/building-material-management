# HieuDT — ba iteration trên runtime native (10/11/2026)

Phạm vi do người dùng chốt: chỉ 18 UC được giao HieuDT trong kế hoạch ngày 28/10; giữ và gộp code đang sửa, tích hợp main rồi làm trên HieuDT ở cả BE/FE. Mã UC dưới đây là **mã trong kế hoạch HieuDT**, không phải số thứ tự của bảng UC mới trên main. Đối chiếu theo tên nghiệp vụ khi bảng mới đánh số lại.

## Ma trận phạm vi và màn hình

Tất cả URL API dưới đây có tiền tố `/api`. FE lấy DTO thực, không dùng kho dữ liệu mẫu cho các màn hình này.

| Iter | UC gốc | Nghiệp vụ | API chính | Màn hình FE |
|---|---|---|---|---|
| 1 | 47 | Tạo SO sao chép nguồn | POST /sales-orders; POST /sales-orders/source-evidence | /orders/create |
| 1 | 46 | Xem SO | GET /sales-orders; GET /sales-orders/:id; GET /sales-orders/:id/evidence/:evidenceId | /orders; /orders/:id |
| 1 | 36 | Tạo chuyển vị trí | POST /location-movements | /location-moves |
| 1 | 35 | Xem chuyển vị trí | GET /location-movements; GET /location-movements/:id | /location-moves |
| 1 | 38 | Danh sách điều chuyển kho | GET /warehouse-transfers | /transfers |
| 1 | 39 | Chi tiết điều chuyển kho | GET /warehouse-transfers/:id | /transfers/:id |
| 1 | 49 | Danh sách lệnh giao bán | GET /outbound-deliveries | /outbound-deliveries |
| 1 | 50 | Chi tiết lệnh giao bán | GET /outbound-deliveries/:id | /outbound-deliveries/:id |
| 2 | 51 | Tạo lệnh giao | POST /outbound-deliveries | Từ yêu cầu xuất trong /orders/:id |
| 2 | 48 | Sửa/hủy phần SO còn tự do | POST /sales-orders/:id/update-remainder; POST /sales-orders/:id/cancel-remainder | /orders/:id |
| 2 | 54 | Tạo nhiệm vụ soạn | POST /outbound-deliveries/:id/picking-tasks | /outbound-deliveries/:id |
| 2 | 52 | Danh sách nhiệm vụ soạn | GET /picking-tasks | /picking-tasks |
| 2 | 53 | Chi tiết nhiệm vụ soạn | GET /picking-tasks/:id | /picking-tasks/:id |
| 2 | 37 | Xác nhận chuyển vị trí | POST /location-movements/:id/confirm | Chi tiết chuyển vị trí |
| 3 | 55 | Xác nhận thực soạn | POST /picking-tasks/:id/confirm | /picking-tasks/:id |
| 3 | 104 | Nhận điều chuyển | POST /warehouse-transfers/dispatches/:id/receipts | /transfers/:id |
| 3 | 93 | Chốt chênh lệch kiểm kê | GET /stocktakes; GET /stocktakes/:id; POST /stocktakes/:id/close | /stocktakes; /stocktakes/:id |
| 3 | 99 | Báo cáo vận hành | GET /reports/options; GET /reports | Các màn /reports/* |

Hợp đồng chi tiết BF03/BF04: [chuyển vị trí](location-movements/README.md), [điều chuyển kho](transfers/BF04_API.md). Luồng nhận điều chuyển giữ tách người gửi/người nhận, chặn nhận quá nguồn, hỗ trợ nhận toàn hàng hỏng và xếp vào cách ly. Không thay nó bằng luồng xuất bán.

## DTO và bảo vệ chung

Registry hiện hành có 58 collections (gồm Conversion được main bổ sung ngày 09/11); không thêm collection hoặc phục hồi model legacy. `id`/`_id` và số thập phân là chuỗi; trạng thái là `workflowStatus`. Dòng dùng `_id`, `productId`, `lotId`, `enteredUnit`, `enteredQty`, `baseUnitsPerUnit`, `qtyBase`, `baseUnitSnapshot`; không dùng conversionId. Danh sách trả `{items,total,page,limit}` trong envelope `{success,message,data}`.

Lệnh bổ sung dùng `idempotencyKey` và `expectedVersion` nguyên dương; tạo SO chưa có expectedVersion. Mỗi lần thử lại không rõ kết quả phải giữ nguyên key, actor và toàn bộ payload. Sai quyền, kho, người thực hiện, nguồn, trạng thái hoặc phiên bản không được ghi một phần. Transaction ghi chứng từ, stock/reservations nếu có, OperationRecord, AuditLog và BusinessEvent cùng lúc. FE giữ key/payload khi lỗi mạng hoặc 5xx; lỗi nghiệp vụ 4xx cho phép sửa rồi gửi lệnh mới.

Quyền FE lấy từ permission thực của session; BE tải lại quyền hiện hành và kiểm kho/nguồn/người. Không suy quyền từ nhãn vai trò trên giao diện. Phạm vi role tùy chỉnh theo hợp đồng native; ảnh nguồn và giá không được mở rộng chỉ vì có quyền đọc tác nghiệp kho.

## Bán và soạn hàng

`GET /sales-orders/options` trả units/conversions hiện hành cùng customers, products, batches, warehouses, locations, holdingPoints, balances và availableQtyBase theo quyền/phạm vi. Tồn chỉ được chọn khi đủ điều kiện; server kiểm lại trong transaction.

| Lệnh | Quyền thao tác | Nội dung ngoài key/version |
|---|---|---|
| update-remainder | sales_order:update | reason; lines[{lineId,quantity,unitSellingPrice?}] |
| cancel-remainder | sales_order:update | reason; lines[{lineId,qtyBase,reopeningReceiptLineId?}] |
| /sales-orders/:id/issue-requests | issue_request:create | warehouseId,neededOn ISO,lines[{lineId,qtyBase}] |
| POST /outbound-deliveries | outbound_delivery:create + outbound_delivery:read | issueRequestId,warehouseId,plannedOn ISO,recipientName,recipientPhone,deliveryAddress,lines[{lineId,sourceBalanceId,sourceBalanceVersion,qtyBase,reopeningReceiptLineId?}] |
| /outbound-deliveries/:id/picking-tasks | picking_task:create + outbound_delivery:read | lines[{reservationId,qtyBase,toLocationId}] |
| /picking-tasks/:id/confirm | picking_task:confirm | lines[{lineId,qtyBase}] |

Các mảng lệnh có 1–200 dòng, trường lạ bị từ chối. quantity của sửa SO là tổng lượng mới theo đơn vị bán, qtyBase là lượng gốc. Đơn vị nguyên không nhận số lẻ. Sửa/hủy và lập yêu cầu xuất/lệnh giao phải do người lập SO trong phạm vi được phép. Giá đã chuyển xuống yêu cầu xuất không được sửa; lượng không được giảm dưới cam kết và phần hủy đã ghi.

Yêu cầu xuất là bước nguồn cần thiết cho UC51, tạo từ SO tại `/sales-orders/:id/issue-requests`; không ghi tồn. OD ghi trạng thái RELEASED và reservation trong một transaction, kiểm phiên bản số dư, hàng GOOD/STORE, lô VERIFIED, vị trí STORAGE pickable, kho, khóa kiểm kê và khả dụng. Khóa nguồn SO/WIR ngăn hai lệnh đồng thời vượt lượng.

Tạo picking sinh SalesGoodsIssue DRAFT và TransferOrder PICK OPEN, chuyển quyền giữ hàng từ OD sang nhiệm vụ. Chưa trừ tồn. Xác nhận từng phần chỉ do người được giao, chuyển lượng thực từ storage sang STAGING, chuyển reservations và ghi StockTransaction SALES_PICK. Tổng tồn không đổi; PARTIAL rồi CONFIRMED khi đủ. GI trở thành PICKED, **chưa phải POSTED/xuất bán**. Việc đăng xuất GI, POD, thanh toán thuộc UC khác.

Khả dụng trừ reservations và phần nhiệm vụ chưa có reservation; không trừ một nhiệm vụ hai lần. Số lượng thập phân dùng exact decimal, không cộng khác đơn vị thành tổng chứng từ.

Hủy/giao bù từ hàng giao thất bại phải trỏ reopeningReceiptLineId của GR-FD POSTED có stock transaction thực chưa đảo. Hạn mức tái mở dùng chung giữa cancellations và commitmentTransfers, gắn đúng dòng SO/WIR/OD. GET SO trả reopenedSources với lượng còn lại; nhiều đợt giao bù không làm tăng nhu cầu gốc.

Ảnh nguồn dùng upload riêng và link ký hạn 60 giây; FE yêu cầu link lúc người dùng mở. D07/D08 về người xác minh/chặn nguồn ngoài của SO mới vẫn chưa được duyệt, nên ghi nguồn không tự gán VERIFIED hoặc tự tạo bước xác minh. Không áp quyết định xác minh nguồn khách trả lịch sử sang SO mới.

## Chốt kiểm kê UC93

GET dùng `stocktake:read`, POST close dùng `stock_adjustment:post`, cộng phạm vi kho. Body:

```json
{
  "idempotencyKey": "unique-operation-key",
  "expectedVersion": 1,
  "planId": "<ObjectId>",
  "expectedPlanVersion": 1,
  "reason": "Chốt theo phương án đã thực hiện"
}
```

Không lệch: bỏ planId/expectedPlanVersion, gửi `selectedCounts:[{snapshotId,countId}]` đủ từng snapshot. Ô trống phải có EMPTY_LOCATION count bằng 0. Có lệch: chọn embedded resolutionPlan APPROVED/EXECUTED của đúng stocktake/scope và bản mới nhất. Count đã chọn phải là lần mới nhất. Số dư, chủ, chất lượng, lô, vị trí, lượng và phiên bản phải còn khớp snapshot.

ApprovalHistory phải thuộc subjectType `stocktake_resolution_plans`, decisionScope `STOCKTAKE`, subjectId/subjectRevision đúng plan, APPROVE độc lập người lập. reviewedContent là kết quả hàm `approvalContent(plan)` được export tại service: serialize `{planId,planVersion:plan.version,scopeVersion:plan.header.scopeVersion,items,selectedCounts}`. Thay nội dung/lần đếm cần duyệt lại, không sửa dấu duyệt cũ.

Mỗi dòng phải có executionRecords đủ lượng, performedAt sau quyết định duyệt, người thực hiện hiện còn quyền `stock_adjustment:update` tại kho và khác người chốt. Bằng chứng ATTACHED phải thuộc đợt/phương án và đúng người tải. Còn defect hold chưa xử lý thì giữ khóa, không tự giải phóng.

DELTA tạo StockAdjustment cho chênh lệch khác 0; RECLASS chuyển chất lượng tại cùng vị trí; RELOCATE chỉ chuyển vị trí và giữ chủ/lô/chất lượng cùng cam kết. Không dùng hai DELTA trái dấu để che đổi chất lượng/vị trí. Tổng dự kiến phải khớp mọi count. RECLASS còn reservation bị từ chối. Sau thực hiện kiểm sức chứa và reservation không vượt tồn, ghi ledger và mở khóa cùng transaction. Nhánh không lệch không tạo ADJ hay ledger lượng 0; audit ghi count đã dùng.

DELTA dương hàng mở/lẻ nhận `packaging:[{lineId,portions:[{packagingState,quantityBase,measuredVolumeMm3,...}]}]`. FE cho nhập thể tích thực đo phần tăng (mm³), ghi LOOSE đủ lượng; bỏ trống chỉ khi toàn bộ là thùng nguyên theo quy cách lô. API cũng nhận nhiều portions. Không tự bịa thể tích hàng mở/lẻ.

Các UC tạo đợt/snapshot, nhập đếm, lập/duyệt phương án và ghi executionRecords là dữ liệu đầu vào của UC93, không nằm trong 18 UC này. Dòng phát hiện mới phải được đối chiếu sourceBalance trước chốt; dữ liệu thiếu bị từ chối thay vì ghi hoàn tất giả.

## Báo cáo UC99

`report:read` và kho được giao; Owner có phạm vi toàn bộ. Query strict: group,warehouseId?,from?,to?. Group gồm inventory,purchases,receipts,issues,sales,transfers,defects,returns,supplierReturns,stocktakes,adjustments. Mọi báo cáo lấy transaction snapshot và trả capturedAt.

Inventory là tồn hiện tại: physicalQtyBase, transitQtyBase, ownedQtyBase, custodyQtyBase, reservedQtyBase, heldQtyBase, availableQtyBase, frozen, đơn vị từng sản phẩm. Không giả lập tồn lịch sử từ from/to. Các nhóm chứng từ lọc ngày lập; chi tiết sản phẩm xuất dưới items. Báo cáo đơn mua có đã nhận/còn chờ; lệnh giao có thực xuất/hàng thất bại đã về/còn chờ; bán có khách thực nhận theo từng dòng và kho. Không trả giá, doanh thu hay lợi nhuận chưa thuộc quyền/phạm vi xác nhận. CSV tải từ dữ liệu thực đã xem, gồm từng dòng hàng và chống công thức khi mở bảng tính.

## Kiểm chứng và giới hạn

Hướng dẫn chạy local: [kiểm thử HieuDT](../09_phat_trien/HIEUDT_LOCAL_TESTS.md). Test tích hợp dùng DB ngẫu nhiên trên replica set riêng localhost:27018, không ghi DB của nhóm. Bằng chứng service/HTTP, component tests và build không thay thế browser E2E hay nghiệm thu dữ liệu thật. Cloudinary upload/download thực cần cấu hình môi trường và chưa chạy trong lượt này. Các test tích hợp khác có cờ riêng không tự được tính là đạt khi bị skip.

Kết quả ngày 10/11/2026: HieuDT integration 10/10; native integration 11/11; FE 11/11; typecheck và production build đạt; BE mặc định 83 đạt/71 skip/0 lỗi; docs:check đạt. Không tính các test skip là đã kiểm runtime.

Cập nhật 11/11: gộp main BE 495b946 và FE c91ef76; SO/lệnh giao hiển thị lịch sử GI, POD, nhập lại giao thất bại, xác nhận tiền bên ngoài theo phạm vi đọc. Danh mục đơn vị lấy Uom thực; makeItem dùng Conversion theo sản phẩm/lô từ main, không hardcode hệ số BOX. Việc ghi nguồn không tự duyệt D07/D08.
