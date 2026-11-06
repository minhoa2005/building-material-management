# C01 – Điểm theo dõi tồn và C02 – Số dư

**C01 v0.1 chờ duyệt. C02 v0.1 là bản nháp cho lượt duyệt kế tiếp.** Cơ sở là model StockAccount/StockBalance, [dữ liệu MongoDB đã khảo sát](03_Cau_truc_DB_hien_tai.md) và luồng chuyển kho, hàng giữ hộ trong [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt).

## C01 · stock_holding_points · Điểm theo dõi tồn

Một điểm trả lời câu hỏi “hàng đang ở đâu?”. Đề xuất có hai loại. Một loại chỉ đến **ô thật** đã khai báo ở B02. Loại còn lại chỉ đến **dòng xuất điều chuyển có hàng đang đi giữa hai kho**. C01 giữ định danh của điểm. Số lượng theo lô và chủ sở hữu nằm ở C02.

| Trường | Kiểu | Ý nghĩa một bản ghi |
|---|---|---|
| `_id` | ObjectId | ID dùng cho số dư và lịch sử giao dịch |
| `type` | LOCATION hoặc IN_TRANSIT | Ô thực hoặc điểm theo dõi trên đường |
| `locationId` | Tham chiếu B02 | Bắt buộc riêng cho LOCATION, duy nhất theo ô |
| `dispatchLineId` | Tham chiếu dòng xuất liên kho | Bắt buộc riêng cho IN_TRANSIT, duy nhất theo dòng xuất thực tế. Kho nguồn và kho đích tra từ chứng từ |
| `createdAt` | Ngày giờ | Thời điểm tạo để truy vết |

**Quan hệ và quy tắc đề xuất.** Hai loại chỉ dùng đúng một tham chiếu. Một ô có tối đa một điểm LOCATION kể cả khi ô chứa nhiều sản phẩm. Một dòng xuất có tối đa một điểm IN_TRANSIT. Hai lần xử lý lại cùng dòng phải dùng lại điểm đã có. Phần mềm lấy hoặc tạo điểm khi có nghiệp vụ hợp lệ. Người dùng thực hiện nghiệp vụ kho theo quyền, không chỉnh loại/tham chiếu của điểm để di chuyển hàng. Điểm hết số dư vẫn còn để tra lịch sử.

**BF03 trong cùng kho.** Chuyển 8 viên từ ô A sang ô B, hai điểm đều là LOCATION. Xác nhận TO thì cập nhật số lượng tương ứng tại hai ô. Tổng lượng vật lý trong kho không đổi.

**BF04 giữa hai kho.** Nếu xuất đi 8 viên, điểm IN_TRANSIT của dòng xuất giúp tìm chính xác 8 viên đang ở trên đường. Lượng này chưa khả dụng tại kho đích. Kho đích tiếp nhận vào ô nhận theo nghiệp vụ và chuyển tới ô lưu bằng thao tác putaway. Không dùng điểm IN_TRANSIT như một ô thật trong kho.

## C02 · inventory_balances · Số dư (bản nháp)

Một bản ghi là số lượng của một lô ở một điểm C01, trong một trạng thái chất lượng và thuộc một chủ sở hữu. Một điểm có thể có nhiều bản ghi số dư. Mỗi lần nhập, xuất hoặc điều chuyển phải bám đúng dòng chứng từ, thay đổi tồn một lần và truy được lịch sử.

| Trường đề xuất | Kiểu và yêu cầu | Chú thích |
|---|---|---|
| `_id` | ObjectId | ID của nhóm tồn để giữ hàng và giao dịch tham chiếu |
| `holdingPointId` | ObjectId, bắt buộc, tham chiếu C01 | Hàng tại ô hoặc đang chuyển theo dòng xuất |
| `batchId` | ObjectId, bắt buộc, tham chiếu B05 | Xác định lô, sản phẩm và đơn vị gốc. Sản phẩm được phân biệt theo hãng và SKU đã duyệt |
| `qualityStatus` | Mã trong danh mục trạng thái | Model hiện có PENDING, GOOD, DAMAGED, BLOCKED. Cần duyệt danh mục dưới đây |
| `ownerType` | STORE, CUSTOMER hoặc SUPPLIER | Xác định chủ sở hữu của lượng hàng |
| `ownerId` | ObjectId hoặc null | STORE dùng null. CUSTOMER phải trỏ tới customers; SUPPLIER phải trỏ tới suppliers |
| `quantityBase` | Decimal128 ≥ 0 | Lượng theo đơn vị gốc B04. Nếu yêu cầu nguyên đơn vị thì phải là số nguyên |
| `version` | Số nguyên ≥ 0, tăng khi thay đổi | Phát hiện hai thao tác cùng sửa số dư cũ |
| `createdAt`, `updatedAt` | Ngày giờ | Thời điểm tạo và cập nhật |

**Ý nghĩa trạng thái dự kiến.** PENDING là chờ kiểm nhận chất lượng. GOOD là đã đạt chất lượng. DAMAGED là hàng đã ghi nhận lỗi. BLOCKED là lượng đang tạm chặn sử dụng theo hồ sơ nghiệp vụ. Với BLOCKED, cần giữ lý do và trạng thái trước đó trên lịch sử để xử lý đúng khi bỏ chặn. Việc đang khóa kiểm kê hoặc đã giữ cho đơn là ràng buộc riêng trong nghiệp vụ, không tự sửa toàn bộ nhóm tồn thành BLOCKED.

**Khóa và quan hệ dự kiến.** Kiểm duy nhất bộ điểm + lô + chất lượng + loại chủ sở hữu + ID chủ sở hữu. Ví dụ có 10 viên của shop và 3 viên của khách giữ hộ trong cùng ô, cùng lô: hai số dư riêng, tổng vật lý 13. Ba viên giữ hộ không dùng để đáp ứng nhu cầu bán của shop. Cả hai nhóm vẫn chiếm chỗ trong ô theo B02.

**Khả dụng.** Lượng vật lý và lượng có thể xuất có thể khác nhau. Phải xét vị trí cho phép lấy hàng, hàng của shop, chất lượng đủ điều kiện, lô đã rõ, phạm vi đang bị khóa kiểm kê, lượng đã giữ và điều kiện của nhu cầu. Đề xuất tính từ số dư và bản ghi giữ hàng liên quan. Chốt khóa, quy tắc ghi tồn, loại chủ và chất lượng ở lượt duyệt C02.

**Quyền và ghi nhận biến động đề xuất.** Người có quyền xem tồn được xem trong phạm vi kho. Người thực hiện nhập, xuất, xác nhận TO, xử lý hàng lỗi hoặc kiểm kê tác động đến số dư thông qua chứng từ hợp lệ. Từng nghiệp vụ phải kiểm quyền riêng. Sửa số lượng bằng cách gõ đè vào bảng số dư không phải thao tác nghiệp vụ. Khi một xác nhận có cả giảm nguồn và tăng đích, phải ghi đủ các thay đổi cùng lịch sử hoặc giữ nguyên toàn bộ nếu thất bại. Gửi lại cùng xác nhận sẽ trả kết quả đã ghi, tránh cộng hoặc trừ lần thứ hai. Cơ chế chi tiết được duyệt ở C03–C04.

**Chuyển chủ hoặc chất lượng.** Khi nhận lại 3 viên của khách và cửa hàng chấp nhận sở hữu, nghiệp vụ giảm đúng nhóm CUSTOMER và tăng nhóm STORE theo kết quả kiểm nhận. Tổng vật lý tại ô vẫn 3 viên nếu chưa di chuyển. Hàng của khách hoặc NCC vẫn nằm trong phạm vi kiểm sức chứa. Đội vận chuyển được ghi trên chuyến, chủ sở hữu tiếp tục theo hồ sơ hàng hóa.

**Dữ liệu cần đi kèm để kiểm sức chứa B02.** Tổng số viên trong C02 chưa xác định được hàng đang ở bao nhiêu thùng nguyên, bao nhiêu hàng lẻ và xếp thành bao nhiêu chồng. Các lần nhập/xếp phải giữ quy cách thực dùng B06 và diện tích đáy, chiều cao đã xác nhận khi cần. Cách lưu tình trạng đóng gói và chồng hàng sẽ được trình riêng trước khi triển khai kiểm sức chứa. Không dùng hệ số mới nhất để suy lại cách xếp của hàng đã nhập.

**Chưa duyệt C02.** Lượt duyệt C02 sẽ chốt các chiều số dư, danh mục trạng thái, quyền xem và nguyên tắc cập nhật ở trên. Mọi ví dụ chỉ dùng để giải thích thiết kế.
