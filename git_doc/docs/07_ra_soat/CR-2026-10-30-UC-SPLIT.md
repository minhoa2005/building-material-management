# Phân rã và chuẩn hóa mã UC — 30/10/2026

Catalogue hiện hành có **130 UC ACTIVE, mã liên tục UC-01–UC-130**. Đã bỏ 14 UC ngoài phạm vi khỏi catalogue, quyền và đặc tả; tách 20 UC gộp thành 54 mục tiêu. Cột đầu dưới đây là mã cũ trước tách, chỉ dùng đối chiếu; cột mã hiện hành là mã dùng cho đặc tả và triển khai. Không diễn giải mã cũ theo nghĩa mã mới. Bảng đổi mã đầy đủ tại [UC_RENUMBER_2026-10-30](UC_RENUMBER_2026-10-30.md). Không thay quyền, schema, API, runtime hoặc dữ liệu giao dịch.

| UC gốc trước tách (mã cũ) | Mã UC hiện hành | Vai trò | Mục tiêu |
|---|---|---|---|
| UC-03 | UC-03 | Warehouse Staff, Sales Staff | Create Replenishment Draft |
| UC-03 | UC-04 | Warehouse Staff, Sales Staff | Update Replenishment Draft or Returned Request |
| UC-03 | UC-05 | Warehouse Staff, Sales Staff | Submit Replenishment Request |
| UC-07 | UC-09 | Accountant | Create Purchase Order |
| UC-07 | UC-10 | Accountant | Update Unreceived PO Remainder |
| UC-07 | UC-11 | Accountant | Record Supplier Order Confirmation |
| UC-07 | UC-12 | Accountant | Cancel Unreceived PO Remainder |
| UC-07 | UC-13 | Accountant | Close Purchase Order |
| UC-13 | UC-19 | Store Owner | Create Product |
| UC-13 | UC-20 | Store Owner | Update Product Information |
| UC-13 | UC-21 | Store Owner | Change Product Status |
| UC-13 | UC-22 | Store Owner | Define Packaging Conversion Version |
| UC-13 | UC-23 | Store Owner | Configure Warehouse Stock Policy |
| UC-16 | UC-26 | Store Owner, Warehouse Staff | Create Product Lot |
| UC-16 | UC-27 | Store Owner | Update Product Lot Information |
| UC-19 | UC-30 | Accountant | Create Supplier |
| UC-19 | UC-31 | Accountant | Update Supplier Information |
| UC-19 | UC-32 | Store Owner | Change Supplier Cooperation Status |
| UC-22 | UC-35 | Sales Staff | Create Customer Delivery Reference |
| UC-22 | UC-36 | Sales Staff | Update Customer Delivery Reference |
| UC-29 | UC-40 | Store Owner | Create Storage Location |
| UC-29 | UC-41 | Store Owner | Update Storage Location Information |
| UC-29 | UC-42 | Store Owner | Change Storage Location Status |
| UC-48 | UC-60 | Sales Staff | Update Eligible Sales Order Remainder |
| UC-48 | UC-61 | Sales Staff | Cancel Eligible Sales Order Remainder |
| UC-58 | UC-71 | Warehouse Staff | Post Actual Goods Issue |
| UC-58 | UC-72 | Warehouse Staff | Prepare Goods Issue Draft |
| UC-65 | UC-75 | Warehouse Staff | Record Defect Inspection and Immediate Hold |
| UC-65 | UC-76 | Warehouse Staff | Submit Defective Goods Disposition Proposal |
| UC-71 | UC-82 | Sales Staff | Decide Ordinary Customer Return Acceptance |
| UC-71 | UC-83 | Store Owner | Review Eligible Customer Return Exception |
| UC-72 | UC-84 | Warehouse Staff | Inspect Customer Return |
| UC-72 | UC-85 | Warehouse Staff | Inspect Failed-Delivery Intake |
| UC-73 | UC-86 | Warehouse Staff | Post Customer Return Receipt |
| UC-73 | UC-87 | Warehouse Staff | Post Failed-Delivery Receipt |
| UC-87 | UC-96 | Warehouse Staff | Activate Stocktake Session |
| UC-87 | UC-97 | Warehouse Staff | Record Stocktake Count Attempt |
| UC-88 | UC-98 | Warehouse Staff | Reconcile Stocktake Results |
| UC-88 | UC-99 | Warehouse Staff | Close Stocktake Without Variance |
| UC-91 | UC-102 | Warehouse Staff | Propose Stocktake Resolution |
| UC-91 | UC-103 | Warehouse Staff | Confirm Stocktake Resolution Execution |
| UC-97 | UC-109 | Administrator | Create Staff Account |
| UC-97 | UC-110 | Administrator | Update Staff Account Information |
| UC-97 | UC-111 | Administrator | Change Staff Account Status |
| UC-103 | UC-117 | Store Owner, Warehouse Staff, Sales Staff | Compare Shortage Fulfilment Options |
| UC-103 | UC-118 | Warehouse Staff | Select Warehouse Supply Option |
| UC-103 | UC-119 | Sales Staff | Confirm Customer Fulfilment Choice |
| UC-108 | UC-122 | Accountant | Verify Historical Customer Delivery Source |
| UC-108 | UC-123 | Accountant | Record External Document Reference |
| UC-109 | UC-124 | Store Owner, Accountant, Warehouse Staff, Sales Staff | View WIR List |
| UC-109 | UC-125 | Store Owner, Accountant, Warehouse Staff, Sales Staff | View WIR Details |
| UC-109 | UC-126 | Sales Staff | Create Linked WIR |
| UC-109 | UC-127 | Sales Staff | Update Linked WIR |
| UC-109 | UC-128 | Sales Staff | Cancel Eligible WIR Remainder |

## Tác động và nghiệm thu

- Catalogue, actor/quyền, đặc tả, màn hình, BR/BF, thiết kế VI/EN và context dùng cùng mã mới. Các tham chiếu lịch sử giữ mã tại thời điểm ghi nhận và phải đọc qua bảng đổi mã.
- Không tách các transaction GR-FD/tái mở nhu cầu và B1 closure. Không thêm quyền từ UC cùng nhóm.
- WBS cần áp dụng một lượt: bỏ dòng ngoài phạm vi theo mã cũ, tách theo bảng, đổi toàn bộ mã theo mapping. Không xóa bằng danh sách mã cũ sau khi đổi mã.
- 34 dòng tăng thêm là phân rã phạm vi đã có, không tự tăng effort/ngày, nhận tiến độ hoặc tuyên bố test runtime đã pass.
- Không phát hành lại Word/Google Docs/Sheets hoặc draw.io lịch sử trong lượt sửa tài liệu local.
