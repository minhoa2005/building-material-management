# D01 · Tổ chức hồ sơ nghiệp vụ theo tên riêng

**Bản trình v0.1 · 02/11/2026 · Chờ duyệt D01.** Mục này chốt cách thay bảng chung `business_documents` bằng nơi lưu riêng theo loại hồ sơ đã được duyệt. D01 là quyết định tổ chức dữ liệu, không phải một bảng mới cần tạo thêm.

## Hiện tại và đề xuất

Theo [snapshot DB ngày 31/10/2026](03_Cau_truc_DB_hien_tai.md), `business_documents` chứa nhiều loại như PO, SO, phiếu nhập, phiếu xuất, kiểm kê. Bản ghi dùng `documentKind` để phân loại và `header` để chứa thông tin riêng. Cách này làm tên bảng không cho biết trực tiếp đang lưu nghiệp vụ gì; các loại còn có trạng thái, quyền và điều kiện riêng.

Đề xuất dùng các collection có tên riêng trong nhóm H đã duyệt, ví dụ `purchase_orders` lưu PO, `sales_orders` lưu SO. Mỗi hồ sơ chỉ có một nơi lưu chính. Không lưu thêm một bản đầu phiếu giống hệt trong `business_documents`, không thêm bảng `documents` chỉ để sao chép lại các đầu phiếu.

| Hồ sơ | Nơi lưu theo thiết kế | Căn cứ và giới hạn |
|---|---|---|
| Đơn mua hàng | `purchase_orders` | H02 đã duyệt; một RR, một NCC, một kho và quyền xem giá mua riêng. |
| Phiếu nhập mua | `purchase_receipts` | H05 đã duyệt; số lượng nhận sở hữu và chứng từ kiểm nhận làm nguồn. |
| Lệnh chuyển ô/lấy hàng/xếp hàng | `transfer_orders` | H06 đã duyệt dùng chung một bảng TO theo loại thao tác, không tách thành ba bảng mới. |
| Yêu cầu chuyển giữa kho | `warehouse_transfer_requests` | H07 đã duyệt; các phiếu xuất/nhận vẫn có nơi lưu riêng theo H09/H10. |
| Bàn giao khi chuyển kho | `handovers[]` trong phiếu xuất | H11 đã duyệt cách nhúng cho BF04; không tạo bảng bàn giao độc lập chỉ vì loại `HANDOVER` có trong DB cũ. |
| Đơn bán, phiếu xuất bán và hóa đơn | `sales_orders`, `sales_goods_issues`, `sales_invoices` | H12/H15/H37 đã duyệt; giữ riêng hồ sơ có kết quả nghiệp vụ khác nhau. |
| Đợt kiểm kê, phương án, phiếu điều chỉnh | `stocktakes`, `stocktake_resolution_plans`, `stock_adjustments` | H21/H25/H22 đã duyệt; kết quả đếm F02 vẫn giữ riêng lịch sử các lần. |
| Tồn đầu kỳ | `opening_stocks` | H36 đã duyệt; không ghi lặp tồn đầu kỳ khi dữ liệu kho đã khởi tạo. |

Những loại khác thực hiện đúng nơi lưu trong từng phiếu đã duyệt ở [danh mục](01_Danh_muc_duyet.md). H01 và H35 còn chờ phản hồi; đồng ý D01 không đồng nghĩa duyệt trường/quyền của hai mục này. Số mục duyệt không bằng số collection cuối cùng, vì có mục nhúng dữ liệu hoặc thay thế cấu trúc cũ.

## Cách dùng các trường đã duyệt

Không bổ sung hàng loạt các trường dưới đây vào mọi bảng. Đây là cách hiểu chung khi tổng hợp các trường đã có trong phiếu riêng; tên cụ thể và mức bắt buộc vẫn theo phiếu của từng nghiệp vụ.

| Nhóm trường | Quy tắc tổng hợp |
|---|---|
| ID và mã phiếu | Giữ `_id` để liên kết và mã dễ đọc đã chốt, như mã PO/SO. Mã không tái cấp; mã cùng loại phải duy nhất. Một tham chiếu dùng chung phải xác định cả loại và ID, không chỉ dựa vào chuỗi mã. |
| Kho, người và đối tác | Lưu các tham chiếu theo nghiệp vụ. PO có một kho nhận và NCC; TR liên kho có kho nguồn/đích; không ép mọi phiếu phải có cùng một bộ trường. |
| Trạng thái | Mỗi loại dùng vòng đời riêng đã duyệt. Trạng thái được đổi qua hành động hợp lệ, không mở thao tác sửa trạng thái chung cho tất cả chứng từ. |
| Phiên bản | Giữ cơ chế chống sửa đồng thời và bản nội dung gửi duyệt theo từng phiếu. Quyết định duyệt phải trỏ đúng nội dung; phiên bản kỹ thuật không thay thế lịch sử nghiệp vụ. |
| Người và thời gian | Giữ người tạo/thực hiện, ngày nghiệp vụ và ngày ghi nhận khi nghiệp vụ có các mốc này. Người thực hiện lấy từ phiên đăng nhập; không dùng tên nhập tay để thay tài khoản chịu trách nhiệm. |
| Thông tin tại thời điểm lập | Giữ các bản lưu tên/mã, giá, đơn vị/quy đổi, đội/lái xe hoặc địa chỉ thực tế đã duyệt để thay danh mục hôm nay không làm thay chứng từ cũ. |
| Quyết định, bằng chứng và biến động tồn | Tham chiếu đúng hồ sơ quyết định, tệp và C03/C04. D01 không tạo một lần ghi tồn mới hoặc thay đổi quyền nghiệp vụ. Cấu trúc dùng chung D05/D06 sẽ được duyệt riêng. |

Đơn vị và quy đổi vẫn nằm trên dòng theo [quyết định bỏ UOM](14_Bo_UOM_va_luu_quy_doi_tren_dong.md). Không khôi phục hai bảng đã bỏ chỉ để làm cho các đầu phiếu giống nhau. Cách lưu dòng D02 và liên kết D03/D04 sẽ được trình riêng; phần nào đã chốt nhúng trong H02, H11, H12 hoặc các phiếu khác vẫn giữ quyết định đó.

## Quan hệ, quyền và lịch sử

Quan hệ nghiệp vụ giữ nguyên: RR tối đa một PO; TR có nhiều phiếu xuất trong lượng được duyệt; phiếu xuất chuyển có thể nhận nhiều lần; hóa đơn tổng hợp các phiếu xuất của cùng SO theo lượng khách nhận. Tách nơi lưu không thay các ràng buộc này.

Chứng từ tham chiếu nguồn phải kiểm nguồn tồn tại, đúng loại, đúng phiên bản hoặc dòng khi có yêu cầu và đúng kho/người được xem. Một ID thuộc SO không được chấp nhận ở trường yêu cầu PO. Trường dùng chung có loại nguồn chỉ chấp nhận các loại được triển khai, không cho người dùng nhập tùy ý tên collection để tra dữ liệu.

Mỗi bảng giữ quyền của nghiệp vụ đã duyệt: ví dụ Warehouse Staff xem lượng nhập nhưng không nhận giá mua của PO qua bảng hoặc liên kết khác. Role do Admin tạo thực hiện theo quyền được cấp cùng kiểm tra kho, người tạo và trạng thái; tách bảng không cấp thêm quyền.

Chứng từ đã duyệt/đã ghi tồn giữ được phiên bản và lịch sử theo phiếu riêng. Không xóa hồ sơ gốc để thay bằng hồ sơ có cùng mã. Khi cần sửa sai dùng luồng đủ điều kiện; H35 vẫn đang chờ duyệt. Báo cáo tổng hợp có thể đọc nhiều collection, không cần một bản sao đầu phiếu làm nguồn nghiệp vụ thứ hai.

## Phạm vi duyệt

D01 v0.1 đề nghị duyệt cách tổ chức: **nơi lưu chính theo tên nghiệp vụ; giữ các phần nhúng đã duyệt; không duy trì bảng đầu phiếu chung trùng dữ liệu**. Khi chuyển đổi sẽ lập ánh xạ ID cũ–mới và kiểm đủ liên kết trước khi áp dụng. Việc đồng ý thiết kế không xóa hoặc chuyển dữ liệu hiện tại.

**CHỜ DUYỆT D01 v0.1.** [Danh mục và tiến độ](01_Danh_muc_duyet.md) · [Nhật ký duyệt](04_Nhat_ky_duyet.md).
