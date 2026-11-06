# H15, H16 và H37 · Xuất bán, khách nhận hàng và hóa đơn tổng hợp

Ngày 01/11/2026. **Đã chốt** SO lưu giá bán. Hóa đơn cuối trong WMSD tổng hợp các phiếu xuất của cùng một SO, hiển thị số lượng đã xuất và tính tiền theo lượng khách thực nhận. Người dùng trả lời **“Duyệt H37 v0.1”**. H15 và H16 v0.1 chờ duyệt riêng. [Bản trình H37 v0.1](history/19_Duyet_xuat_ban_giao_nhan_va_hoa_don_v0.1_de_xuat.md). [Đơn bán H12, WIR H13 và OD H14](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md).

| Dòng chứng từ của cùng đơn bán | Ngày xuất | Thực xuất | Khách nhận có bằng chứng | Lượng tính tiền |
|---|---|---:|---:|---:|
| PX-01 · G60 | 03/11 | 60 viên | 60 viên | 60 viên |
| PX-02 · G60 | 05/11 | 40 viên | 38 viên | 38 viên |
| Tổng riêng cho sản phẩm G60 | | **100 viên** | **98 viên** | **98 viên** |

Trong ví dụ, 2 viên của PX-02 đã được ghi nhận giao thất bại và chốt không giao bù. SO ghi 200.000 đồng/thùng 4 viên. Hóa đơn giữ cả hai ngày xuất, tính 3.000.000 đồng cho PX-01 và 1.900.000 đồng cho PX-02, tổng **4.900.000 đồng**. Nếu còn chờ giao bù, giữ hóa đơn cuối ở nháp cho đến khi các phần hàng có kết quả cuối cùng. Không cộng số lượng của sản phẩm hoặc đơn vị gốc khác nhau vào một tổng hiện vật.

## H15 · sales_goods_issues · Phiếu xuất bán hàng

Đề xuất mỗi phiếu ghi một lần bàn giao thực tế từ một kho theo một lệnh giao H14. Một SO có thể được xuất nhiều lần. Mỗi lần tra được số phiếu, ngày giờ, kho, người xác nhận và lượng theo từng dòng. Warehouse Staff của kho xuất lập và xác nhận.

| Trường | Ý nghĩa |
|---|---|
| `_id`, `issueNo`, `deliveryOrderId`, `warehouseId`, `createdBy`, `createdAt` | Phiếu có mã riêng. TO soạn hàng, lệnh giao và kho xuất phải khớp. |
| `items[]` | ID dòng cố định, ID dòng OD/WIR/SO và phiên bản giá của dòng SO, dòng soạn hàng, lô, số dư tập kết, đơn vị/hệ số trên dòng và lượng thực bàn giao theo đơn vị gốc. Truy được cùng khách và cùng đơn cho toàn phiếu. |
| `handovers[]` | **Đề xuất riêng cho bán hàng.** Lưu người giao, người nhận thực tế, thời điểm, dòng hàng, lượng và bằng chứng. Khi giao qua đội nội bộ, chọn đội B08C và lưu tên đội/lái xe tại lúc giao. Khi khách đến lấy trực tiếp, ghi người thực nhận. Tổng bàn giao theo dòng phải khớp lượng xuất. |
| `status`, `issuedAt`, `postedAt`, `postedBy`, `stockTransactionId`, `version` | DRAFT dành cho chuẩn bị. POSTED khi đã thực bàn giao và ghi giảm tồn thành công. Nếu hủy trước khi ghi tồn, lưu lý do và người hủy. Phân biệt thời điểm xuất thực với thời điểm ghi trên phần mềm. |

Kiểm đơn vị gốc, lô, lượng thực soạn chưa xuất, lượng được giao theo OD và khóa kiểm kê. Khi xác nhận, giảm tồn ở ô tập kết và tiêu dùng đúng lượng giữ C05 trong cùng giao dịch C03/C04. Gửi lại cùng lần xác nhận trả về cùng phiếu đã ghi. Khi có sai sót sau xuất, chứng từ đảo hoặc nhận hàng thực về giữ liên kết tới dòng xuất gốc. Bàn giao cho lái xe là mốc xuất của kho. Lượng khách nhận được xác định qua H16. [Giữ hàng C05](11_Duyet_giu_hang_va_nguon_cung.md) · [Đội nội bộ B08C](08C_Don_vi_van_chuyen.md).

## H16 · delivery_confirmations · Xác nhận khách nhận hàng (POD)

Mỗi lần giao thực tế theo một phiếu H15 đã xuất có một biên bản. Warehouse Staff thuộc kho phụ trách ghi tên người nhận, ngày giờ giao, ảnh và số lượng khách chấp nhận cho từng dòng. Một phiếu xuất có thể có nhiều biên bản nếu thực tế nhận nhiều lần.

| Trường | Ý nghĩa |
|---|---|
| `_id`, `confirmationNo`, `goodsIssueId`, `receivedByName`, `deliveredAt` | Mã biên bản, phiếu xuất và người nhận/thời điểm thực tế. |
| `items[]`, `evidenceRefs[]` | ID dòng POD, ID dòng xuất, lượng khách nhận theo đơn vị gốc và quy đổi trên dòng. Gắn ảnh xác nhận của lần giao. Ghi lý do, bằng chứng và tham chiếu hồ sơ nếu có phần từ chối, hỏng hoặc còn chờ giao. |
| `status`, `confirmedBy`, `confirmedAt`, `version`, `correctsConfirmationId` | Lưu nháp, xác nhận và lịch sử sửa sai có lý do. Chỉ phần xác nhận còn hiệu lực được cộng vào lượng khách nhận. |

Trên mỗi dòng xuất, tổng phần nhận hợp lệ cùng phần đã có kết quả khác loại trừ lẫn nhau không vượt lượng xuất còn hiệu lực. Hai người xác nhận đồng thời phải cùng chịu giới hạn này. Nếu khách từ chối toàn bộ, ghi kết quả thất bại cùng bằng chứng. Trường hợp khách đã nhận rồi mới trả hàng đi theo hồ sơ trả hàng riêng. Xác nhận POD cập nhật tiến độ giao khách, còn nhập hàng thực về kho cần chứng từ nhập tương ứng. [Luồng giao hàng BF06](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md).

## H37 · sales_invoices · Hóa đơn bán hàng tổng hợp

H37 là **mục mới trong thiết kế**, đặt sau H36 để giữ nguyên mã các mục đang xét. Mỗi SO có tối đa một hóa đơn cuối đang có hiệu lực. Accountant lập và phát hành. Mỗi phiên bản phát hành có số duy nhất và ngày phát hành riêng. Bản in liệt kê từng phiếu, ngày xuất thực tế, kho, sản phẩm, đơn vị, lượng xuất, lượng khách nhận, đơn giá và thành tiền. Các dòng xuất có lượng nhận bằng 0 vẫn hiển thị để giải thích chênh lệch.

| Trường | Ý nghĩa |
|---|---|
| `_id`, `salesOrderId`, `customerId`, `customerSnapshot`, `currencyCode` | Chỉ tổng hợp một SO của một khách. Giữ mã/tên khách và thông tin hiển thị tại thời điểm phát hành. |
| `items[]` | Một dòng theo dòng H15 và phiên bản dòng SO dùng khi xuất. Lưu ID/mã phiếu xuất, ngày thực xuất, kho, sản phẩm/lô, ID dòng SO, đơn vị gốc, lượng đã xuất, các ID dòng POD cùng lượng thực nhận dùng làm căn cứ. Nhiều POD cùng dòng xuất được tổng hợp một lần. |
| `items[].billedQtyBase`, `saleUnit`, `baseUnitsPerSaleUnit`, `unitSellingPrice`, `lineAmount`, `totalAmount` | Lượng tính tiền là lượng khách thực nhận còn hiệu lực. Đơn vị, hệ số và giá lấy theo phiên bản dòng SO đã gắn với hàng xuất. Thành tiền dòng = lượng tính tiền theo đơn vị gốc ÷ hệ số đơn vị bán × đơn giá. Tổng hóa đơn bằng tổng các thành tiền hiển thị. Với VND, làm tròn thành tiền từng dòng đến đồng gần nhất, từ nửa đồng làm tròn lên. |
| `invoiceNo`, `status`, `createdBy`, `createdAt`, `issuedBy`, `issuedAt`, `version` | DRAFT để Accountant đối chiếu. ISSUED khi phát hành thành công, cố định số, ngày và bản chụp từng dòng. In hoặc gửi lại dùng đúng bản đã phát hành. |

**Kiểm trước khi phát hành.** So khớp SO → WIR → OD → dòng H15 → các dòng H16 còn hiệu lực. Hiển thị từng lần xuất thực, kể cả lần giao thất bại có lần xuất giao bù. Mỗi lần chỉ tính đúng phần khách đã nhận. Các dòng bị đảo hoặc sửa có dấu vết và được đối chiếu trước phát hành. Kiểm lại phiên bản nguồn, giới hạn lượng và hóa đơn còn hiệu lực trong cùng giao dịch, chống phát hành hai lần khi bấm lại. Phát hành hóa đơn cuối khi đã đối chiếu hết đơn và có lượng thực nhận dương. Nếu phát hiện sai hoặc khách trả sau phát hành, liên kết hồ sơ xử lý với bản gốc và giữ nguyên bản đã phát hành.

**Quyền và thông báo.** Accountant phát hành. Store Owner được xem và in hóa đơn đã phát hành theo quyền. Khi gửi thông báo trạng thái qua SMTP, lưu tham chiếu hóa đơn đã phát hành để có thể gửi lại đúng bản. Chi tiết thông báo và đính chính trình ở nhóm tương ứng. Hoạt động thu tiền/công nợ thuộc ngoài phạm vi thiết kế hóa đơn này. [Thiết kế nghiệp vụ tham chiếu](../WMSD_Thiet_ke_he_thong_chi_tiet.md).

**Trạng thái duyệt.** H37 v0.1 đã duyệt cả cấu trúc, điều kiện phát hành, quyền, cách làm tròn và chống tính trùng. H15 và H16 v0.1 chờ duyệt cách ghi xuất bán và xác nhận giao khách. [Danh mục duyệt](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
