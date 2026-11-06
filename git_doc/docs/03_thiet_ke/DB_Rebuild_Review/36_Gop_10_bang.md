# Quyết định gộp 10 bảng — 06/11/2026

**Hiện hành:** [Gộp tiếp 5 bảng ngày 06/11/2026](37_Gop_them_5_bang.md), còn 58 collection. Cách tách các bảng được thay thế là lịch sử; quyền và kết quả nghiệp vụ vẫn giữ.


Người dùng duyệt thực hiện toàn bộ nhóm 1. Bộ model reviewed còn 63 collection. Quyết định này thay thế cách lưu vật lý ở các phiếu cũ; các dữ kiện nghiệp vụ, ID và lịch sử vẫn giữ.

| Bảng cũ | Nơi lưu hiện hành |
|---|---|
| storage_stacks | Bỏ đối tượng chồng. Chiều dài/rộng tại warehouse_locations; clearHeightMm dùng chung từ warehouses. |
| storage_stack_items | inventory_balances.packagingPortions[]; không còn stackId. |
| stock_thresholds | products.stockThresholds[] |
| external_reference_lines | external_references.items[] |
| return_inspections | customer_returns.inspections[] |
| external_payment_confirmations | sales_orders.paymentConfirmations[] |
| supplier_acknowledgements | supplier_return_issues.acknowledgements[] |
| sales_order_cancellations | sales_orders.cancellations[] |
| delivery_demand_reopenings | failed_delivery_receipts.demandReopenings[] |
| delivery_commitment_transfers | failed_delivery_receipts.commitmentTransfers[] |

## Trường và liên kết

Các phần nhúng giữ nguyên _id, người/thời gian, bằng chứng, số lượng, phiên bản và ID dòng nguồn. Các tên loại hồ sơ cũ vẫn có thể xuất hiện trong sourceType/documentType để nhận diện lịch sử; chúng không còn là collection. Khi truy cập loại nhúng, tra bảng cha và phần tử _id tương ứng, không gọi Mongoose populate vào model đã bỏ. Ref trực tiếp tới record nhúng được đánh dấu embeddedTarget trong schema. Sửa số lượng/hủy/đổi lệnh phải cập nhật dữ liệu liên quan trong cùng transaction và kiểm phiên bản.

Một PO hoặc SO vẫn có items[] như trước. Ngưỡng một sản phẩm không trùng warehouseId; dòng nguồn không trùng lineKey trong cùng hồ sơ. Các phần nhúng không được trùng _id trong cùng bảng cha. Bộ API chuyển đổi cần giữ lịch sử bất biến và kiểm toàn bộ đường ghi, kể cả cập nhật mảng bằng query.

## Sức chứa

inventory_balances.packagingPortions[] lưu quy cách thùng, số thùng nguyên hoặc lượng hàng mở/lẻ hiện tại; mỗi phần chỉ thuộc đúng số dư đó. Tổng lượng các phần phải bằng số dư tại ô. Hàng trên đường không tính sức chứa ô. Thể tích thùng nguyên = dài × rộng × cao × số thùng. Hàng mở/lẻ dùng measuredVolumeMm3 thực đo. extraOccupiedVolumeMm3 giữ phần chiếm chỗ phụ từ dữ liệu cũ nếu có.

Chiều cao chung lấy warehouses.clearHeightMm; warehouse_locations bỏ usableHeightMm. BE kiểm tổng thể tích của mọi lô/chủ/chất lượng trong ô với dài ô × rộng ô × cao kho. Thiếu kích thước/quy cách thì cần bổ sung trước khi xác nhận. Đây là kiểm soát thể tích, không phải mô phỏng xếp hình 3D hoặc kiểm sức chịu tải.

Hàm checkBinCapacity kiểm dữ liệu sau thay đổi. Khi port API, phải gọi trong giao dịch ghi tồn, đồng thời cập nhật có điều kiện operationVersion của ô; chỉ gọi hàm trước khi ghi sẽ không bảo vệ hai nhân viên cùng thao tác.

## Chuyển dữ liệu

consolidateData chuyển snapshot 73 bảng sang 63, giữ các ID và lịch sử nhúng; expandEmbedded chỉ là phép chiếu phục vụ kiểm tra, không ghi lại 8 collection cũ. Nếu không tìm được bảng cha hoặc một xác nhận NCC chứa dòng của nhiều phiếu xuất, quá trình dừng để phân bổ rõ nguồn thay vì bỏ dữ liệu. Chồng đo thực tế chứa nhiều phần hàng cần phân bổ thể tích trước khi chuyển. Không tự suy ra kích thước thiếu.

Registry migration cũ và transformSnapshot vẫn phục vụ đọc/chuyển cấu trúc lịch sử; không phải bộ model ứng dụng hiện hành. Seed v3 dựng kịch bản lịch sử rồi chuyển về 63 collection để kiểm bảo toàn. Không đổi DB thật của nhóm. Bản mẫu 63 bảng được tạo riêng tại localhost:27017/wmsd_demo_tile_shop_v3; DB mẫu cũ được giữ lại.

## Trạng thái triển khai

Đã cập nhật schema reviewed, seed, phép chuyển dữ liệu, kiểm liên kết, hàm kiểm sức chứa, từ điển trường và sơ đồ. Các API vẫn dùng legacy phải chuyển riêng trước khi trỏ ứng dụng vào DB mới. D07/D08 về ai xác minh nguồn ngoài còn chờ; gộp items không quyết định thay quy trình đó.

Kiểm chứng: test:db-rebuild và docs:check; seed đã ghi và đọc lại trên localhost thành công, 63 collection / 734 bản ghi cấp bảng, 82 hồ sơ nghiệp vụ kể cả phần nhúng. Báo cáo: [kết quả local](../../../outputs/consolidated_63_local_2026-11-06.json). Dữ liệu cũ không bị xóa/ghi đè. Các kiểm tra xác nhận bảo toàn lịch sử, nguồn hàng, tồn, sức chứa và hóa đơn; chưa chứng minh API legacy chạy trên cấu trúc mới.
