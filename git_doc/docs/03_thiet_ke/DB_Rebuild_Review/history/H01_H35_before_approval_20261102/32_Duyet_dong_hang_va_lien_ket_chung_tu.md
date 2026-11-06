# D02–D04 · Dòng hàng và liên kết chứng từ

**Bản v0.1 · 02/11/2026 · D02, D03 và D04 đã duyệt riêng.** Người dùng trả lời “Duyệt D02 v0.1”, “Duyệt D03 v0.1” và “Duyệt D04 v0.1”. Nội dung đã trình được giữ nguyên bên dưới; [bản trước duyệt](history/32_Duyet_dong_hang_va_lien_ket_chung_tu_v0.1_de_xuat.md) dùng đối chiếu. Các mục này chốt cách lưu dòng và liên kết tiếp theo D01; không tạo thêm ba bảng mới. Chưa áp dụng vào DB hoặc code.

Căn cứ: [D01 đã duyệt](31_Duyet_cach_to_chuc_ho_so_nghiep_vu.md), [snapshot cấu trúc cũ](03_Cau_truc_DB_hien_tai.md), [dòng TO/TR và yêu cầu nội kho](16_Duyet_lenh_va_yeu_cau_chuyen_kho.md), [xuất/nhận chuyển kho](17_Duyet_phieu_xuat_nhan_va_ban_giao_chuyen_kho.md), [xuất bán/POD/hóa đơn](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md). Tên trường riêng đã duyệt được giữ; các cấu trúc minh họa dưới đây là quy tắc liên kết, không bắt mỗi phiếu lưu thêm một bản sao của cùng thông tin.

| Mục | Câu hỏi cần trả lời | Nơi lưu đề xuất |
|---|---|---|
| D02 | Phiếu này có các mặt hàng/lô nào, lượng và quy đổi bao nhiêu? | Dòng `items[]` trong chính phiếu; mỗi dòng có ID riêng. |
| D03 | Phiếu này được tạo hoặc xử lý từ phiếu nào? | Tham chiếu nguồn trên phiếu nhận/xử lý tiếp, hoặc suy ra từ nguồn dòng. |
| D04 | Dòng này thực hiện bao nhiêu từ dòng nguồn nào? | ID dòng nguồn và lượng liên quan ngay trên dòng xử lý; nhiều nguồn có danh sách chi tiết khi nghiệp vụ cho phép. |

## D02 · Dòng hàng nằm trong phiếu

Đề xuất không duy trì bảng chung `document_lines` trong DB mới. Những dòng thuộc một phiếu lưu trong `items[]` của phiếu đó theo cấu trúc đã duyệt. Một dòng hàng không phải một sản phẩm trong danh mục: cùng sản phẩm có thể có nhiều dòng do khác lô, vị trí, nguồn hoặc phiên bản giá.

| Trường hoặc nhóm trường | Quy tắc |
|---|---|
| `_id`, `lineNo` | ID dòng cố định do phần mềm tạo; số thứ tự chỉ để hiển thị. Đổi thứ tự không đổi ID, không dùng vị trí trong danh sách để làm liên kết. |
| `productId`, `batchId` khi nghiệp vụ yêu cầu | Sản phẩm, lô thực hoặc lô yêu cầu theo từng phiếu. Yêu cầu mua chưa chọn lô vẫn hợp lệ nếu luồng cho phép. |
| Lượng và quy đổi | Giữ lượng nhập, đơn vị, hệ số và lượng gốc theo từng dòng. Dùng tên trường trong phiếu riêng; không phục hồi bảng UOM/UOM Version đã bỏ. |
| Quy cách, giá, thông tin lúc lập | Chỉ lưu những trường nghiệp vụ đã duyệt. Giữ phiên bản giá, hệ số và thông tin hiển thị để thay danh mục sau này không đổi phiếu cũ. |
| Nguồn, chất lượng, vị trí, chủ hàng | Có theo loại phiếu. Dòng nhận có thể tách đạt/lỗi, cùng trỏ dòng xuất; không gộp mất chất lượng hoặc chủ sở hữu. |

**Ví dụ.** PO-01 có dòng G60 và G80. Hai dòng được lưu cùng PO-01 nhưng có ID độc lập. Một phiếu nhập tham chiếu dòng G60 vẫn đúng dù người dùng đổi thứ tự G60/G80 trên bản nháp. Lượng nhận, trả hay tính tiền truy theo ID dòng, không chỉ theo SKU.

Người dùng thao tác dòng qua quyền và trạng thái của phiếu. Chỉ cho xóa dòng chưa có quyết định hoặc chứng từ sau phụ thuộc trong giai đoạn còn được sửa. Không tái dùng ID dòng bị bỏ cho mặt hàng mới. Khi sửa được phép sau trình duyệt, giữ bản nội dung cũ; khi có phần đã thực hiện, bảo toàn nội dung/giá/hệ số mà phần đó tham chiếu theo quy tắc của phiếu. Dòng đã ghi tồn không sửa/xóa trực tiếp.

Nhúng dòng hàng không đồng nghĩa nhúng mọi lịch sử vào một phiếu. Các lần đếm F02, số dư C02, giao dịch C03/C04, giữ hàng C05 và các bảng có vòng đời riêng vẫn giữ riêng như đã duyệt. Không gom toàn bộ phiếu xuất/nhận của một SO/TR thành danh sách dòng mới trong đầu SO/TR. Với phiếu dự kiến có lượng dòng rất lớn, phải xác định giới hạn vận hành hoặc trình cách tách riêng trước khi triển khai; không tự chia thành nhiều chứng từ làm đổi nghiệp vụ đã chốt.

## D03 · Liên kết giữa các phiếu

Đề xuất thay `document_links` bằng các tham chiếu có ý nghĩa trên hồ sơ nghiệp vụ. Không tạo bảng `document_relations` để chép lại toàn bộ quan hệ mà phiếu/dòng đã có. Một quan hệ chỉ có một nguồn dữ liệu chính; danh sách phiếu con trên màn hình được tra từ nguồn đó.

| Trường hợp | Cách lưu chính |
|---|---|
| Một phiếu có một nguồn trực tiếp | Giữ trường riêng như `purchaseOrderId`, `dispatchId`, `salesOrderId`, `requirementId` theo thiết kế từng phiếu. |
| Một phiếu nhận nhiều loại nguồn tùy nghiệp vụ | Cặp loại nguồn và ID như `sourceType` + `sourceId`. Loại nguồn thuộc danh sách nghiệp vụ được triển khai, không cho nhập tên bảng tùy ý. |
| Các nguồn đã có trên từng dòng | Suy ra danh sách phiếu nguồn từ tham chiếu dòng D04. Không cần thêm một danh sách nguồn có quyền sửa độc lập trên đầu phiếu. |
| Quan hệ bổ sung chỉ ở cấp phiếu, chưa có trường tương đương | Khi nghiệp vụ đã cho phép, lưu danh sách `relatedDocuments[]` gồm ID mục, loại quan hệ, loại/ID hồ sơ liên quan, phiên bản nguồn khi cần và người/thời điểm ghi. Không thêm vào mọi loại phiếu. |

**Ví dụ.** Hai phiếu nhận cùng tham chiếu PX-01 qua `dispatchId`. Mở PX-01 sẽ tra ra cả hai lần nhận, không cần lưu thêm hai liên kết y hệt trong bảng chung. Hóa đơn giữ một `salesOrderId`; các phiếu xuất góp vào hóa đơn được truy từ dòng hóa đơn đã duyệt ở H37. Nếu một quan hệ đã có ở bảng có nghiệp vụ riêng như nguồn cung C06 hoặc chuyển quyền giao bù E04, bảng đó tiếp tục là nơi lưu chính.

Phải kiểm hồ sơ nguồn tồn tại, đúng loại, cùng chuỗi nghiệp vụ và quyền người dùng. Quan hệ một RR tối đa một PO vẫn được ràng buộc trên PO; không chỉ dựa vào việc màn hình chưa hiện PO. Chứng từ con và tham chiếu được ghi cùng nhau. Hủy phiếu vẫn giữ liên kết lịch sử; chỉ không tính phần hết hiệu lực vào tiến độ tương ứng. Mã phiếu là thông tin dễ đọc, ID mới là căn cứ nối dữ liệu.

Quan hệ tổng hợp nhiều nguồn chỉ dùng ở nơi nghiệp vụ cho phép. D03 không cho gộp nhiều RR vào PO hay gộp nhiều phiếu xuất chuyển vào một phiếu nhận trái với H02/H10. Quyền xem phiếu không tự cho quyền xem toàn bộ tài liệu liên quan hoặc giá/ghi chú nội bộ.

## D04 · Liên kết số lượng giữa các dòng

Đề xuất không giữ bảng `line_links` hoặc tạo bảng `document_item_relations` chỉ để lặp thông tin nguồn đã nằm trên dòng. Dòng xử lý giữ tham chiếu đầy đủ đến phiếu nguồn và ID dòng nguồn, cùng lượng và ý nghĩa của phần lượng đó. Dòng một nguồn dùng trường trực tiếp; khi được phép lấy nhiều nguồn, dùng danh sách phần nguồn trên dòng đích.

| Nội dung liên kết | Ý nghĩa |
|---|---|
| Loại/ID phiếu nguồn, ID dòng nguồn | Xác định đúng dòng thuộc đúng phiếu. Nếu đầu phiếu đã giữ ID nguồn thì dòng chỉ cần ID dòng, không lưu thêm ID phiếu trùng nhau. |
| Phiên bản nguồn khi cần | Giữ đúng bản được duyệt hoặc phiên bản giá/hệ số mà lượng này sử dụng. Không chỉ trỏ sang bản hiện tại có thể đã đổi. |
| Loại quan hệ | Phân biệt nhận theo xuất, xuất theo lệnh, trả theo lượng đã nhận, căn cứ tính tiền... Lấy theo nghiệp vụ, không cho người dùng tự đặt để vượt hạn mức. |
| `quantityBase`, `baseUnitSnapshot` hoặc trường lượng đã có | Lượng gốc của phần liên quan và đơn vị. Khi toàn bộ dòng thuộc một nguồn và cùng ý nghĩa, dùng lượng trên dòng, không thêm một con số có thể bị sửa lệch. |
| ID từng phần nguồn khi có danh sách | Giữ ID ổn định cho từng phần; mỗi phần biết nguồn và lượng của mình. Tên danh sách dùng theo phiếu đã duyệt, không bắt thêm `sourceAllocations[]` nếu đã có cấu trúc tương đương. |

**Ví dụ chuyển kho.** PX-01 xuất 60 viên ở một dòng. PN-01 nhận 38 đạt và 2 vỡ: hai dòng đều trỏ đúng dòng PX-01, tổng nhận lần này 40. PN-02 nhận nốt 20, tổng đã nhận là 60. Phần đạt/lỗi và từng ngày nhận vẫn tra riêng; không tăng tồn thêm một lần vì lưu liên kết D04.

**Ví dụ hóa đơn.** Dòng xuất 40, khách nhận 38: liên kết POD ghi 38 nhận thực; dòng hóa đơn vẫn hiển thị 40 đã xuất và tính tiền 38 theo H37. Tham chiếu thêm dòng SO để lấy giá không có nghĩa đã xuất thêm 38 lần nữa. Chỉ cộng lượng có cùng ý nghĩa nghiệp vụ, nguồn và đơn vị khi tính tiến độ.

Các phần nguồn dùng để chia lượng phải cộng đúng lượng đích tương ứng, nhưng không cộng những tham chiếu chỉ dùng tra cứu/giá như một phần hàng bổ sung. Nhiều lần nhận từ cùng dòng xuất phải kiểm tổng không vượt phần còn được nhận; phiếu xuất đang chuẩn bị giữ hạn mức TR theo H07/H09. Kiểm phiên bản, lượng còn lại và lưu kết quả cùng một lần xử lý để hai người không cùng lấy phần cuối còn lại.

Hủy phần chưa thực hiện giải phóng đúng hạn mức theo nghiệp vụ và giữ lịch sử. Phần đã ghi tồn chỉ đổi hiệu lực qua chứng từ đủ điều kiện; không xóa liên kết để giả tăng lượng còn lại. Các bảng giữ hàng, nguồn dự kiến, hạn mức trả và giao bù C05/C06/E02–E05 vẫn chịu trách nhiệm phần đã duyệt, D04 không tính thêm một lần nữa. C03/C04 tiếp tục ghi biến động tồn thực.

## Kết quả nếu được duyệt

| Cấu trúc cũ | Cách thay thế đang đề xuất |
|---|---|
| `document_lines` | Dòng có ID trong từng phiếu theo D02. |
| `document_links` | Tham chiếu phiếu trực tiếp, nguồn từ dòng hoặc quan hệ bổ sung có nghĩa rõ theo D03. |
| `line_links` | Tham chiếu dòng và lượng trong dòng xử lý hoặc bảng nghiệp vụ đã duyệt theo D04. |

Trước khi chuyển dữ liệu phải ánh xạ từng ID dòng/liên kết cũ đến nơi mới, so khớp số lượng và khả năng tra nguồn. Không bỏ liên kết cũ chỉ vì tên bảng không còn trong thiết kế. D02/D03/D04 vẫn được tính là ba **mục thiết kế cần duyệt**, không phải ba collection mới. H01/H35 và các mục khác còn chờ vẫn giữ trạng thái riêng.

**ĐÃ DUYỆT D02, D03 và D04 v0.1.** [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký duyệt](04_Nhat_ky_duyet.md).
