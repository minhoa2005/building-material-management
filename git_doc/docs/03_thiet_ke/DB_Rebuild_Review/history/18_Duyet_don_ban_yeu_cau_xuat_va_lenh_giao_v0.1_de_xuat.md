# H12–H14 · Đơn bán, yêu cầu xuất kho và lệnh giao hàng

**Phiếu v0.1 · 01/11/2026.** H12 đang làm rõ phần giá và hóa đơn. H13 và H14 được trình duyệt độc lập. Phạm vi phiếu là từ lúc Sales nhập đơn nguồn đến khi một đợt giao được giao cho kho thực hiện. [Quy trình BF06](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) · [Chức năng Sales Order trong BE](../../../../CODE/BE/building-material-management/src/modules/sales-orders/README.md) · [Cấu trúc MongoDB đã khảo sát](03_Cau_truc_DB_hien_tai.md).

| Hồ sơ | Ví dụ khách đặt 100 viên G60 | Tác động lên tồn |
|---|---|---|
| H12 · Sales Order (SO) | Sales nhập đơn và chứng từ nguồn, ghi khách đặt 100 viên. | Ghi nhận nhu cầu gốc. |
| H13 · Warehouse Issue Request (WIR) | Khách cần 60 viên trong tuần này. Sales lập yêu cầu xuất 60 theo dòng SO, còn 40 có thể yêu cầu sau. | Giao nhu cầu cho kho xử lý. Tồn vật lý và lượng giữ chưa đổi. |
| H14 · Delivery Order (OD) | Trong 60 viên cần giao, kho A sẵn 40. Sales lập lệnh giao 40 từ A. Hai mươi viên còn lại chờ đợt kế tiếp. | Giữ 40 viên có thể xuất theo C05. Kho chỉ ghi giảm tồn tại thời điểm xuất thực tế trên H15. |

## H12 · sales_orders · Đơn bán

Mỗi hồ sơ là một đơn của một khách, được nhập thủ công trên form tạo SO. Sales ghi nguồn, khách, sản phẩm, lượng và bằng chứng ngay trên form. Bằng chứng và số chứng từ giúp đối chiếu lại đơn gốc. WMSD tự cấp mã đơn và liên kết khách theo B08A. [Hồ sơ khách hàng đã duyệt](08A_Khach_hang.md).

| Trường đề xuất | Cách sử dụng |
|---|---|
| `_id`, `orderNo`, `customerId`, `createdBy`, `createdAt` | Mã đơn duy nhất, khách và nhân viên bán hàng phụ trách tại lúc tạo. |
| `sourceRef`, `evidenceRefs[]` | Nhận diện chứng từ nguồn bằng loại, số, ngày nếu có và mã dòng nguồn. Một đơn nguồn chỉ sinh một SO. Dùng phiên bản để ghi sửa đổi của chính đơn nguồn đó. Ghi người/thời điểm xác minh theo nghiệp vụ thực tế. Phương án tổ chức hồ sơ chứng cứ dùng chung sẽ duyệt tại D06–D08. |
| `neededOn`, `recipientName`, `recipientPhone`, `deliveryAddress` | Ngày cần, người nhận và địa chỉ trên đơn. Mỗi lệnh giao giữ thông tin thực tế của đợt đó, kể cả khi giao tới công trình khác. |
| `items[]` | ID dòng cố định, dòng nguồn, sản phẩm, số lượng, đơn vị nhập, đơn vị gốc và hệ số tại lúc lập. Lưu yêu cầu về lô, tông màu, cỡ khi khách có yêu cầu. Tách riêng phần khách đồng ý thay thế để kho tra được căn cứ trước khi chọn lô khác. |
| `status`, `version`, `updatedAt` | Phân biệt đơn đang thực hiện, đã giao đủ theo bằng chứng và đơn đã hủy hợp lệ. Quy tắc chuyển sang hoàn thành cuối cùng sẽ xét cùng H16/H17. |

**Quyền và lịch sử.** Sales Staff tạo và xem đơn do mình phụ trách. Warehouse Staff chỉ xem các dòng cần thực hiện trong kho được giao. Store Owner và Accountant xem theo quyền nghiệp vụ/đối chiếu. Khi có WIR, OD hay lượng đã xuất, sửa/hủy phần còn tự do phải bảo toàn chứng từ cũ và các phần đã cam kết. Chặn hai lần tạo từ cùng đơn nguồn, kể cả khi hai người gửi đồng thời. Chỉ tạo SO chưa làm thay đổi tồn hoặc giữ hàng.

**Điểm cần chốt trước khi duyệt H12.** Nội dung trao đổi trước đây có hóa đơn cuối tổng hợp nhiều phiếu xuất. Bản nghiệp vụ ngày 21/10 và BE hiện tại dùng SO sao chép để theo dõi số lượng. Cần xác định có lưu giá bán ngay trên dòng SO và có lập hóa đơn trong WMSD hay không. Nếu giữ giá, sẽ trình trường đơn giá theo đơn vị bán, quyền xem và cách lưu giá đã chốt. H13 và H14 có thể duyệt theo số lượng trước.

## H13 · warehouse_issue_requests · Yêu cầu xuất cho đơn bán

Đề xuất **lưu WIR riêng**. Sales có thể yêu cầu kho chuẩn bị một phần đơn theo ngày cần hoặc theo thỏa thuận với khách. Mỗi WIR thuộc một SO, có nhiều dòng. Mỗi dòng WIR trỏ về đúng một dòng SO. Một dòng SO có thể cấp cho nhiều WIR.

| Trường đề xuất | Cách sử dụng |
|---|---|
| `_id`, `requestNo`, `salesOrderId`, `salesOrderVersion` | Mã WIR duy nhất và phiên bản SO làm căn cứ. Mọi dòng phải thuộc SO ở đầu phiếu. |
| `requestedWarehouseId`, `neededOn`, `requestedBy`, `requestedAt` | Kho dự kiến, ngày cần, người lập và thời điểm. Kho xuất thực tế được ghi trên từng lệnh giao H14. |
| `items[]` | ID dòng, ID dòng SO, sản phẩm, lượng yêu cầu theo đơn vị nhập và đơn vị gốc, điều kiện về lô/tông/cỡ, căn cứ nếu khách đồng ý thay thế. |
| `status`, `version`, `cancelledBy`, `cancelledAt`, `cancelReason` | Theo dõi mở, đang thực hiện, đã xuất đủ hoặc đã hủy. Hủy một phần giữ chi tiết lượng, người và lý do theo dòng. |

**Kiểm lượng.** Tổng lượng đã cấp qua các WIR (kể cả lượng đã thực hiện) trừ phần giải phóng hợp lệ phải nằm trong lượng SO còn hiệu lực. WIR đã hoàn tất vẫn tính vào hạn mức nguồn. Khi tạo hai WIR cùng lúc, cả hai cùng kiểm một hạn mức. Khi hủy phần mở của WIR, tách rõ hai trường hợp: khách vẫn cần hàng thì phần chưa thực hiện trở về SO để lên lịch lại. Khách hủy nhu cầu thì lưu thay đổi của SO theo lịch sử hủy E05. Ví dụ SO 100 đã cấp WIR 60 thì WIR mới tối đa 40, dù kho vừa xuất 40 từ WIR đầu tiên.

**Quyền.** Sales Staff lập và điều chỉnh phần chưa bị ràng buộc trên đơn mình phụ trách. Warehouse Staff xem yêu cầu thuộc kho mình để chuẩn bị. Lệnh giao đang có hiệu lực phải được xử lý trước khi giảm lượng đã giao cho kho. C05/C06 truy về cùng dòng nhu cầu SO qua WIR. [Giữ hàng và nguồn cung đã duyệt](11_Duyet_giu_hang_va_nguon_cung.md).

## H14 · delivery_orders · Lệnh giao hàng

Mỗi OD tổ chức **một đợt giao từ một kho xuất thực tế** cho một WIR. Nếu bán 60 viên và thỏa thuận xuất 40 từ kho A, 20 từ kho B, lập hai OD. Khi hai kho giao trực tiếp cho khách thì hàng xuất tại chính kho tương ứng. Chỉ áp dụng BF04 nếu có vận chuyển vật lý giữa hai kho của shop.

| Trường đề xuất | Cách sử dụng |
|---|---|
| `_id`, `deliveryOrderNo`, `issueRequestId`, `warehouseId` | Mã OD duy nhất, WIR nguồn và kho xuất của toàn bộ đợt giao. |
| `plannedDeliveryAt`, `recipientName`, `recipientPhone`, `deliveryAddress`, `deliveryInstructions` | Lịch dự kiến và thông tin nhận hàng thực tế cho đợt này. Dữ liệu trên OD giữ lại địa chỉ mà kho đã dùng khi giao. |
| `items[]` | ID dòng, ID dòng WIR, sản phẩm, lượng giao đợt này, quy đổi trên dòng và yêu cầu lô. Các lần giữ trên C05 tham chiếu đúng dòng OD và nhóm tồn thực đã chọn. |
| `createdBy`, `createdAt`, `releasedBy`, `releasedAt`, `status`, `version` | Sales Staff lập/kích hoạt lệnh giao cho kho. Ghi thời điểm lệnh có hiệu lực để giữ hàng. Các trạng thái phân biệt nháp, đã giao kho, đang thực hiện, đã xuất xong và đã hủy. |
| `replacesDeliveryOrderId`, `cancelReason` | Nếu cần lệnh thay thế, lưu lệnh cũ và căn cứ chuyển phần còn đủ điều kiện. Khi đã xuất thực tế, phần hàng giao thất bại phải được đối chiếu và mở lại nhu cầu theo chứng từ trước khi cấp lệnh thay. |

**Giữ hàng đúng một lần.** Khi OD có hiệu lực, kiểm cả hạn mức WIR và số hàng có thể giữ ở kho thực xuất. Đề xuất nếu chỉ có 40 viên phù hợp thì cho kích hoạt OD 40, còn lại trên WIR. Nếu đã có phần giữ C05 cho cùng nhu cầu, chuyển hoặc dùng lại phần đó. Lệnh nháp chưa giữ hàng. Khi soạn chỉ chuyển hàng ra tập kết. Phiếu xuất bán H15 mới ghi nhận giảm tồn ở lần bàn giao thực tế. Hủy phần chưa xuất thì xử lý tác vụ mở và trả phần giữ tương ứng. [C05–C06](11_Duyet_giu_hang_va_nguon_cung.md).

**Quyền và truy vết.** Sales Staff theo dõi các lệnh liên quan đơn mình phụ trách. Warehouse Staff của kho thực xuất xem người nhận, địa chỉ và các dòng phải chuẩn bị. Mỗi phiếu xuất thực lưu ngày, lượng và dòng OD nguồn để tra được từ SO tới các lần xuất. Warehouse Staff ghi kết quả giao thực tế ở bước sau. Cách lưu bàn giao của BF04 đã duyệt tại H11, còn cách lưu bàn giao và xác nhận khách nhận của bán hàng sẽ trình cùng H15/H16.

Mỗi bảng trên dùng quy đổi trực tiếp trên dòng và lượng gốc để so hạn mức. Cấu trúc chứng từ dùng chung, giao thất bại, hủy lượng, xác nhận khách nhận và xác nhận ngoài hệ thống tiếp tục duyệt theo từng mục. [Quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md) · [Danh mục duyệt](01_Danh_muc_duyet.md).
