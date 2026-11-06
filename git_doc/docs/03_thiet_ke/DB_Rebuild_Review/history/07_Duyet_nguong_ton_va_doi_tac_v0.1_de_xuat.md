# B07–B08 · Ngưỡng tồn và đối tác

**Phiếu v0.1 · 31/10/2026.** B07 trình duyệt cả bảng. B08 trình lựa chọn cách tổ chức dữ liệu trước khi duyệt cấu trúc. Các ví dụ dưới đây dùng số liệu minh họa.

Nguồn đối chiếu gồm [Report 3, BF-01 và UC-13, UC-17–22, UC-58](../../01_bao_cao/WMSD_Report3_Fix.docx.txt), [quy trình nghiệp vụ](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và [bản khảo sát MongoDB hiện có](03_Cau_truc_DB_hien_tai.md). Bản khảo sát ghi khoảng 6 bản ghi ngưỡng và 4 bản ghi đối tác. Đây là số quan sát tại thời điểm khảo sát.

## B07 · stock_thresholds · Ngưỡng tồn theo sản phẩm và kho

Một bản ghi quy định mức tồn tối thiểu và mức muốn bổ sung tới cho **một sản phẩm tại một kho**. Ví dụ cửa hàng có thể đặt ngưỡng gạch G60 của hãng A ở kho gạch chính cao hơn ở kho phụ. Sản phẩm tham chiếu theo B04, kho theo B01.

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID của thiết lập để yêu cầu bổ sung tham chiếu cùng phiên bản đã dùng |
| `warehouseId`, `productId` | Tham chiếu B01 và B04 | Mỗi cặp có tối đa một thiết lập, gồm cả khi đã ngừng áp dụng |
| `minimumQty` | Decimal128 ≥ 0 | Ngưỡng dưới tính theo đơn vị gốc của sản phẩm. Dùng số nguyên nếu B04 yêu cầu nguyên đơn vị |
| `targetQty` | Decimal128 ≥ minimumQty | Mức tồn muốn đạt. Mặc định bằng mức tối thiểu nếu cửa hàng chỉ dùng một ngưỡng |
| `isActive` | Đúng/sai | Cho phép tắt cảnh báo của cặp này và giữ lịch sử thiết lập |
| `version`, `updatedBy` | Số nguyên, tham chiếu A01 | Phiên bản cấu hình và người thay đổi gần nhất |
| `createdAt`, `updatedAt` | Ngày giờ | Thời điểm tạo và cập nhật |

**Khi nào cảnh báo.** Chỉ xét cặp đang bật. So sánh lượng **khả dụng** với mức tối thiểu bằng đơn vị gốc. Ví dụ tối thiểu 20 viên, mục tiêu 30. Nếu kho còn 20 viên khả dụng thì chưa cảnh báo. Nếu còn 19 viên thì cảnh báo. Khi chưa có nguồn nào khác bù vào, lượng tham khảo để đạt mục tiêu là 11 viên. Khi lập đề nghị phải đối chiếu hàng nơi khác có thể điều chuyển, hàng sắp về và yêu cầu đang mở để tránh đề xuất trùng. Hàng giữ hộ, cách ly hoặc đang vận chuyển chưa phải lượng khả dụng ở ô đích.

**Quan hệ, quyền và lịch sử.** Store Owner mặc định được đặt, sửa hoặc tắt ngưỡng theo UC-13 và nguyên tắc cấp quyền A02/A03. Thiết lập có hiệu lực khi lưu thành công. Nếu chưa thiết lập cho một cặp thì không phát cảnh báo theo ngưỡng của cặp đó. Dòng đề nghị đã lập giữ giá trị và phiên bản tại thời điểm đánh giá. Sửa ngưỡng không làm đổi số dư, tạo yêu cầu bổ sung hay tự đặt PO. Nhân viên vẫn có thể tạo yêu cầu bổ sung theo các căn cứ nghiệp vụ khác.

**Đối chiếu với DB cũ.** Model ProductWarehousePolicy hiện lưu cặp sản phẩm/kho duy nhất, `minimumQty`, `targetQty`, phiên bản và người cập nhật. Bản khảo sát có bản ghi mẫu thiếu `targetQty`. Đề xuất khi chuyển dữ liệu dùng mức tối thiểu làm mục tiêu nếu trường còn thiếu. Bước này thuộc kế hoạch chuyển đổi sau duyệt.

## B08 · Đối tác, nguồn nhập và chủ sở hữu hàng

Hiện MongoDB dùng bảng `parties` và một trường `kind` cho STORE, SUPPLIER, CUSTOMER hoặc CARRIER. Số dư tồn tham chiếu `ownerPartyId` để nhận ra hàng thuộc cửa hàng, thuộc khách hoặc thuộc nhà cung cấp. Report 3 quản lý dữ liệu nhà cung cấp và dữ liệu giao hàng của khách bằng các quyền khác nhau.

**Phương án A · Một bảng `business_partners` dùng chung (đề xuất).** Một bản ghi có ID và mã nội bộ ổn định. Có thể gắn thông tin khách hàng, nhà cung cấp hoặc cả hai cho cùng một tổ chức đã xác minh. Mỗi hồ sơ giữ tên, mã ngoài, liên hệ, địa chỉ và trạng thái theo phạm vi nghiệp vụ. Một mã khách MISA không tự trở thành mã nhà cung cấp. Chỉ liên kết hai hồ sơ khi đã xác minh cùng đối tác, không gộp theo tên hoặc số điện thoại trùng. Khi cần thêm hồ sơ thứ hai vào một ID hiện có phải kiểm quyền tương ứng và lưu lịch sử.

| Dữ liệu dự kiến nếu chọn phương án A | Mục đích |
|---|---|
| `_id`, `code` | ID tham chiếu và mã nội bộ duy nhất của đối tác |
| `supplierProfile` (nếu là nhà cung cấp) | Tên nhà cung cấp, mã nguồn nếu có, thông tin liên hệ và trạng thái có thể đặt PO |
| `customerProfile` (nếu là khách) | Tên khách, mã khách ngoài hệ thống nếu có, liên hệ và địa chỉ giao mặc định. Chứng từ giao lưu địa chỉ thực của lần giao |
| Định danh chủ hàng STORE | Duy trì duy nhất một bản ghi cửa hàng làm chủ sở hữu hàng nội bộ. Chỉ chọn khách/NCC làm chủ sở hữu khi đúng nghiệp vụ giữ hộ |
| `version`, `createdAt`, `updatedAt` | Kiểm soát cập nhật đồng thời và truy vết thay đổi. Chứng từ đã lập vẫn tra được đối tác lịch sử |

**Phương án B · Tách `customers` và `suppliers`.** Một công ty vừa mua vừa bán có hồ sơ riêng trong mỗi bảng. Dữ liệu chủ hàng của số dư cần liên kết rõ với cửa hàng, khách hoặc nhà cung cấp. Khi chọn phương án này, sẽ trình riêng từng bảng và cách tham chiếu chủ hàng để duyệt.

**Quyền mặc định cho cả hai phương án.** Theo UC-19, Accountant tạo/sửa thông tin nhà cung cấp, Store Owner kích hoạt hoặc ngừng sử dụng. Theo UC-22, Sales Staff quản lý thông tin liên hệ và giao hàng của khách. Accountant chỉ xem thông tin khách trong phạm vi tham chiếu và Warehouse Staff chỉ xem phần cần cho giao hàng. Khi một đối tác có hai tư cách, quyền sửa liên hệ khách không được thay đổi hồ sơ nhà cung cấp hoặc xem dữ liệu bên ngoài phạm vi. Việc ngừng một tư cách vẫn giữ lịch sử các phiếu đã phát sinh và không tự ngừng tư cách còn lại.

**Áp dụng với B04–B05.** Nếu nhà cung cấp X và Y cùng giao G60 của hãng A, PO và từng phiếu nhập vẫn chỉ rõ X hoặc Y. Nếu sản phẩm, mã lô, tông màu và cỡ khớp thì hàng dùng chung lô B05. Hãng trên sản phẩm, bên bán trên phiếu mua và chủ sở hữu của tồn kho là ba thông tin độc lập.

**Bên vận chuyển.** Model hiện tại cho phép CARRIER. UC-58 yêu cầu ghi người/đơn vị nhận bàn giao, thời điểm và bằng chứng trên chứng từ. Đề xuất giữ các tham chiếu cũ, ghi người/đơn vị thực tế trên lần bàn giao. Cần xác nhận cửa hàng có muốn quản lý danh mục hãng vận chuyển để chọn lại hay chỉ lưu thông tin trên phiếu. Cả hai cách đều phải giữ thông tin của lần bàn giao.

**Trạng thái.** B07 và B08 chưa được duyệt. Chọn phương án B08 chỉ xác định cách tổ chức dữ liệu. Danh sách trường, khóa, trạng thái và quyền từng hồ sơ sẽ được trình duyệt sau.
