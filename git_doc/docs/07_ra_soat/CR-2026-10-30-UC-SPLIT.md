# Áp dụng tách UC — 30/10/2026

Bản tài liệu 3.3.2, nền nghiệp vụ 3.3.0. Áp dụng P1/P2 theo đề xuất đã được người dùng chấp thuận. 147 mã = 133 ACTIVE + 14 RETIRED. Bảy trường hợp có điều kiện giữ nguyên. Không thay schema/API/runtime hay quyền nghiệp vụ.

| UC trước tách | UC sau tách | Vai trò | Mục tiêu |
|---|---|---|---|
| UC-03 | UC-03 | Warehouse Staff, Sales Staff | Create Replenishment Draft |
| UC-03 | UC-112 | Warehouse Staff, Sales Staff | Update Replenishment Draft or Returned Request |
| UC-03 | UC-113 | Warehouse Staff, Sales Staff | Submit Replenishment Request |
| UC-07 | UC-07 | Accountant | Create Purchase Order |
| UC-07 | UC-114 | Accountant | Update Unreceived PO Remainder |
| UC-07 | UC-115 | Accountant | Record Supplier Order Confirmation |
| UC-07 | UC-116 | Accountant | Cancel Unreceived PO Remainder |
| UC-07 | UC-117 | Accountant | Close Purchase Order |
| UC-13 | UC-13 | Store Owner | Create Product |
| UC-13 | UC-118 | Store Owner | Update Product Information |
| UC-13 | UC-119 | Store Owner | Change Product Status |
| UC-13 | UC-120 | Store Owner | Define Packaging Conversion Version |
| UC-13 | UC-121 | Store Owner | Configure Warehouse Stock Policy |
| UC-16 | UC-16 | Store Owner, Warehouse Staff | Create Product Lot |
| UC-16 | UC-122 | Store Owner | Update Product Lot Information |
| UC-19 | UC-19 | Accountant | Create Supplier |
| UC-19 | UC-123 | Accountant | Update Supplier Information |
| UC-19 | UC-124 | Store Owner | Change Supplier Cooperation Status |
| UC-22 | UC-22 | Sales Staff | Create Customer Delivery Reference |
| UC-22 | UC-125 | Sales Staff | Update Customer Delivery Reference |
| UC-29 | UC-29 | Store Owner | Create Storage Location |
| UC-29 | UC-126 | Store Owner | Update Storage Location Information |
| UC-29 | UC-127 | Store Owner | Change Storage Location Status |
| UC-48 | UC-48 | Sales Staff | Update Eligible Sales Order Remainder |
| UC-48 | UC-128 | Sales Staff | Cancel Eligible Sales Order Remainder |
| UC-58 | UC-58 | Warehouse Staff | Post Actual Goods Issue |
| UC-58 | UC-129 | Warehouse Staff | Prepare Goods Issue Draft |
| UC-65 | UC-65 | Warehouse Staff | Record Defect Inspection and Immediate Hold |
| UC-65 | UC-130 | Warehouse Staff | Submit Defective Goods Disposition Proposal |
| UC-71 | UC-71 | Sales Staff | Decide Ordinary Customer Return Acceptance |
| UC-71 | UC-131 | Store Owner | Review Eligible Customer Return Exception |
| UC-72 | UC-72 | Warehouse Staff | Inspect Customer Return |
| UC-72 | UC-132 | Warehouse Staff | Inspect Failed-Delivery Intake |
| UC-73 | UC-73 | Warehouse Staff | Post Customer Return Receipt |
| UC-73 | UC-133 | Warehouse Staff | Post Failed-Delivery Receipt |
| UC-87 | UC-87 | Warehouse Staff | Activate Stocktake Session |
| UC-87 | UC-134 | Warehouse Staff | Record Stocktake Count Attempt |
| UC-88 | UC-88 | Warehouse Staff | Reconcile Stocktake Results |
| UC-88 | UC-135 | Warehouse Staff | Close Stocktake Without Variance |
| UC-91 | UC-91 | Warehouse Staff | Propose Stocktake Resolution |
| UC-91 | UC-136 | Warehouse Staff | Confirm Stocktake Resolution Execution |
| UC-97 | UC-97 | Administrator | Create Staff Account |
| UC-97 | UC-137 | Administrator | Update Staff Account Information |
| UC-97 | UC-138 | Administrator | Change Staff Account Status |
| UC-103 | UC-103 | Store Owner, Warehouse Staff, Sales Staff | Compare Shortage Fulfilment Options |
| UC-103 | UC-139 | Warehouse Staff | Select Warehouse Supply Option |
| UC-103 | UC-140 | Sales Staff | Confirm Customer Fulfilment Choice |
| UC-107 | UC-107 | Accountant | Verify Supplier Return Agreement |
| UC-107 | UC-141 | Accountant | Record Supplier Receipt Acknowledgement |
| UC-107 | UC-142 | Accountant | Reconcile Supplier Return Variance |
| UC-108 | UC-108 | Accountant | Verify Historical Customer Delivery Source |
| UC-108 | UC-143 | Accountant | Record External Document Reference |
| UC-109 | UC-109 | Store Owner, Accountant, Warehouse Staff, Sales Staff | View WIR List |
| UC-109 | UC-144 | Store Owner, Accountant, Warehouse Staff, Sales Staff | View WIR Details |
| UC-109 | UC-145 | Sales Staff | Create Linked WIR |
| UC-109 | UC-146 | Sales Staff | Update Linked WIR |
| UC-109 | UC-147 | Sales Staff | Cancel Eligible WIR Remainder |

## Tác động và nghiệm thu

- SRS: cập nhật catalogue, quyền, actor, đặc tả, screen/source/BR references. Các transaction GR-FD/reopening và B1 closure không tách.
- Quy trình VI/EN, thiết kế và context: các mã cũ trong chuỗi nghiệp vụ mở rộng sang nhóm kế thừa. Nguồn quyền chi tiết là ma trận Report 3.
- Kế hoạch: 36 mục tiêu được tách thêm từ phạm vi đã có, không tự tăng effort/ngày hoặc ghi nhận nghiệm thu. Các dòng WBS cũ là nhóm công việc, dùng crosswalk này để kiểm 133 mục tiêu. Không nhân estimate của UC cha cho từng UC con.
- QA: kiểm actor độc lập từng UC, trạng thái và snapshot/version, không cấp quyền qua sibling; hồi quy A1/B1/C2/BF-08. Chỉ phân rã traceability, không tuyên bố test runtime đã pass.
- Rủi ro: tham chiếu mã cũ có nghĩa hẹp hơn. Luôn đọc crosswalk theo phiên bản, giữ nguyên mã retired và không dùng tên Maintain/Manage để cấp cả nhóm quyền.
- Bản repo tài liệu riêng SEP490/git_doc, Word/Google Docs bên ngoài và draw.io snapshot lịch sử không được phát hành lại trong lượt này.
