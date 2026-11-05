# B07–B08 · Ngưỡng tồn và đối tác

**31/10/2026 · B07 v0.1, B08A v0.3 và B08B v0.1 đã duyệt.** B08C v0.4 ghi lựa chọn bổ sung quyền tạo/sửa đội cho Warehouse Staff. [Phiếu B07–B08 ban đầu](history/07_Duyet_nguong_ton_va_doi_tac_v0.1_de_xuat.md) lưu lịch sử đề xuất.

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

**Quyết định B07.** Người dùng trả lời “Duyệt B07 theo phiếu v0.1”. Đã duyệt thiết kế ngưỡng, quyền và hành vi trên.

## B08 · Khách hàng, nhà cung cấp và bàn giao vận chuyển

Người dùng chọn “Tách bảng khách hàng và nhà cung cấp”, “Thêm mã khách do WMSD tự sinh” và “Có danh mục đội nội bộ để chọn lại”. Một công ty vừa mua vừa bán có hai hồ sơ riêng. Shop tự giao hàng và chọn đội nội bộ khi ghi nhận chuyến. Các phiếu chi tiết ghi kết quả duyệt cấu trúc và quyền của từng bảng.

| Bảng | Một bản ghi là gì? | Quan hệ với nghiệp vụ | Trạng thái |
|---|---|---|---|
| [B08A · customers](08A_Khach_hang.md) | Một khách có mã WMSD tự sinh, tên và điện thoại | Đơn bán, lần giao, khách trả và hàng giữ hộ | ĐÃ DUYỆT v0.3 |
| [B08B · suppliers](08B_Nha_cung_cap.md) | Một nhà cung cấp | Mua hàng, nhập theo PO, trả nhà cung cấp và nguồn hàng giữ hộ | ĐÃ DUYỆT v0.1 |
| [B08C · delivery_teams](08C_Don_vi_van_chuyen.md) | Một đội vận chuyển nội bộ của shop | Chuyến tham chiếu đội và giữ tên đơn vị lúc giao, người nhận, thời điểm, lượng và bằng chứng | ĐÃ CHỐT v0.4 với quyền bổ sung |

**Tham chiếu chủ sở hữu sau khi tách.** Hiện số dư chứa `ownerPartyId` tham chiếu `parties`. C02 v0.2 đã duyệt dùng `ownerType` và `ownerId`. Khi loại là STORE, ID ngoài để trống vì dự án quản lý một cửa hàng; khi là CUSTOMER hoặc SUPPLIER thì ID bắt buộc trỏ đúng bảng tương ứng. Khóa số dư phải phân biệt cả loại và ID, kể cả khi hai bảng có ID bằng nhau. Đơn vị vận chuyển trên phiếu là bên nhận bàn giao, không mặc nhiên là chủ hàng. [Kết quả duyệt C02](09_Duyet_diem_ton_va_so_du.md).

**Chứng từ và đối chiếu dữ liệu cũ.** PO và phiếu trả NCC trỏ `supplierId` về suppliers. Đơn bán và phiếu khách trả trỏ `customerId` về customers. Khi lập kế hoạch chuyển đổi, giữ tham chiếu CARRIER lịch sử trên các chuyến cũ và giữ tên đơn vị thực tế lúc bàn giao. Chuyến tự vận chuyển mới tham chiếu đội nội bộ B08C và giữ tên cùng người nhận thực tế lúc bàn giao. Đối chiếu tham chiếu thiếu hoặc sai loại với chứng từ nguồn, tránh ghép bằng tên. Hãng phát hành SKU ở B04 tiếp tục tách biệt với nhà cung cấp giao hàng.
