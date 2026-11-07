# G04–G06 · Chống lặp thao tác và dùng trùng số lượng

**Bản v0.1 · 02/11/2026 · G04, G05 và G06 đã duyệt riêng.** Người dùng trả lời “Duyệt G04 v0.1”, “Duyệt G05 v0.1” và “Duyệt G06 v0.1”. Giữ nguyên cấu trúc và quy tắc đã trình bên dưới; [bản trước duyệt](history/35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi_v0.1_de_xuat.md) dùng đối chiếu. Các bản ghi do phần mềm tự quản lý trong thao tác nghiệp vụ. Không có màn hình để nhân viên nhập hoặc chỉnh các khóa này; quyền lập/duyệt/nhận hàng vẫn theo phiếu nghiệp vụ đã chốt. Đây là kết quả duyệt thiết kế, chưa áp vào code/DB.

Căn cứ: [C03/C04 ghi tồn đúng một lần](10_Duyet_giao_dich_va_lich_su_ton.md), [C05/C06 giữ hàng và nguồn cung](11_Duyet_giu_hang_va_nguon_cung.md), [E02 hạn mức trả](25_Duyet_han_muc_tra_va_hang_giu_ho.md), [G02/G03 nhật ký và sự kiện](34_Duyet_thong_bao_nhat_ky_va_su_kien.md), [snapshot DB ngày 31/10/2026](03_Cau_truc_DB_hien_tai.md). H01 v0.1 đã duyệt riêng; D07/D08 còn chờ. Các bảng hỗ trợ không thay quyền đã chốt của H01 hoặc tự quyết định điều kiện nguồn D07/D08.

| Mục | Tình huống cần xử lý | Kết quả cần giữ |
|---|---|---|
| G04 · operation_records | Người dùng bấm tạo phiếu rồi mất mạng, bấm lại cùng thao tác | Trả đúng phiếu đã tạo, không tạo thêm một phiếu mới. |
| G05 · replenishment_locks | Hai người cùng thấy một nhu cầu thiếu 10 viên và cùng đề nghị bổ sung | Người sau tính lại phần thiếu sau kết quả người trước; không đề nghị trùng 10 viên. |
| G06 · return_source_locks | Khách có 20 viên còn được đề nghị trả; hai người đồng thời lập mỗi người 15 | Chỉ một yêu cầu 15 được ghi trước; yêu cầu sau thấy còn tối đa 5 và phải sửa. |

## Tích hợp runtime theo yêu cầu 07/11/2026

[Hợp đồng triển khai](../../08_api/REPLENISHMENT_COVERAGE.md) mô tả đánh giá nguồn, cảnh báo RR thủ công kèm xác nhận nhu cầu độc lập/giải trình, token stale, vòng đời coverage và thứ tự khóa. RR nháp đã lưu chiếm lượng, form chưa lưu không chiếm lượng. Nguồn ngưỡng dùng Product.stockThresholds, không khôi phục bảng policy. Kết quả kiểm thử được ghi riêng trong changelog ngày triển khai; các phiếu duyệt bên dưới giữ nguyên lịch sử.

## G04 · operation_records · Kết quả thao tác đã thực hiện

Đề xuất một bản ghi lưu **kết quả thành công của một lần thao tác**, kể cả thao tác chưa thay đổi tồn như tạo phiếu, gửi duyệt hoặc phát hành hóa đơn. Lỗi nghiệp vụ có thể được ghi ở G02; G04 không đánh dấu thành công khi toàn bộ lần lưu đã thất bại.

| Trường đề xuất | Kiểu và ý nghĩa |
|---|---|
| `_id` | ID tự sinh. |
| `actorType`, `actorId`, `operationCode` | Người dùng/tác vụ thực hiện, định danh và mã hành động đã triển khai; bắt buộc theo loại người thực hiện. |
| `requestKey`, `requestHash` | Chuỗi mã của lần gửi và dấu kiểm nội dung chuẩn hóa; nhận diện cùng yêu cầu. Không đưa mật khẩu hoặc mã đăng nhập vào dữ liệu lưu. |
| `operationKey` | Khóa nghiệp vụ do phần mềm xác định khi có một lần chuyển trạng thái/xác nhận duy nhất, ngăn dùng mã gửi mới để làm lại cùng việc đã xong. |
| `subjectType`, `subjectId`, `versionBefore`, `versionAfter` | Hồ sơ và phiên bản liên quan. Khi tạo mới, ID kết quả được ghi cùng phiếu đã tạo. |
| `resultRefs[]`, `resultCode`, `completedAt` | Loại/ID các kết quả và mã kết quả, thời điểm hoàn thành. Không giữ một bản phản hồi đầy giá/tệp rồi trả lại mà bỏ kiểm quyền. |
| `stockTransactionId`, `decisionId`, `correlationId` khi có | Liên kết C03, D05 và lần xử lý liên quan để đối chiếu. |

**Cùng thao tác là gì?** Phần mềm dùng lại `requestKey` khi người dùng thử lại lần gửi chưa rõ kết quả. Cùng người/hành động/mã gửi và cùng nội dung đã thành công thì trả kết quả đã có. Nếu mã đã dùng nhưng nội dung khác thì báo xung đột. Muốn lập một phiếu mới thật sự phải là thao tác mới và vẫn qua kiểm trùng/hạn mức nghiệp vụ; không chỉ thay mã gửi để vượt điều kiện.

G04 được lưu cùng phiếu, quyết định, biến động tồn và sự kiện liên quan trong một lần thành công. Hai yêu cầu đồng thời cùng khóa chỉ được một kết quả thành công. Nếu mất kết nối và chưa biết đã ghi hay chưa, kiểm G04 và chứng từ/C03 theo khóa trước khi thử lại; không coi không nhận được phản hồi là chắc chắn chưa ghi.

**Phân biệt với C03.** C03/C04 vẫn là nguồn số liệu biến động tồn. G04 giữ kết quả thao tác và tham chiếu C03 nếu có, không lưu thêm một bộ số dư hoặc cộng/trừ lần nữa. Khóa duy nhất của nghiệp vụ và kiểm phiên bản vẫn áp dụng dù hai người dùng mã gửi khác nhau. Những nghiệp vụ nhiều lần hợp lệ như nhận hàng phải có định danh từng lần riêng, không chặn cả các lần nhận tiếp theo.

**Quyền và lưu trữ.** Trước khi trả kết quả cũ phải xác thực người dùng và quyền xem hồ sơ hiện tại; mất quyền thì không phát lại dữ liệu cũ. Người dùng thường không sửa/xóa G04. Giữ dấu vết tối thiểu và khóa nhận diện lâu dài theo lịch sử nghiệp vụ; chưa đặt lịch tự xóa. Việc dọn dữ liệu sau này không được mở lại khả năng tạo/ghi trùng các việc đã hoàn tất.

## G05 · replenishment_locks · Kiểm soát lập bổ sung đồng thời

Đề xuất **một bản ghi cho một cặp kho/sản phẩm**, tự tạo khi có thao tác cần tính và sử dụng phần thiếu. Đây là điểm phối hợp ngắn trong lúc lưu để hai người không cùng sử dụng một phép tính cũ. Nó không khóa ô, không giữ hàng và không ngăn kho hoạt động trong suốt thời gian một RR chờ duyệt.

| Trường đề xuất | Kiểu và ý nghĩa |
|---|---|
| `_id`, `warehouseId`, `productId` | ID và tham chiếu kho/sản phẩm; cặp kho/sản phẩm duy nhất. |
| `version` | Số nguyên tăng khi một thay đổi liên quan được lưu thành công; là mốc kiểm đồng thời, không phải số lượng hàng. |
| `lastOperationId` khi có | Tham chiếu lần thao tác để tra nguyên nhân cập nhật; lịch sử chi tiết ở G02. |
| `createdAt`, `updatedAt` | Thời điểm tạo và cập nhật tự ghi. |

Khi gửi/lập bổ sung hợp lệ, lấy quyền cập nhật cùng bản ghi G05 rồi đọc lại tồn khả dụng, nguồn bù đúng điều kiện, nhu cầu và các yêu cầu đang mở. Lưu kết quả cùng cập nhật phiên bản; nếu người khác đã thay đổi dữ liệu liên quan thì tính lại, không lấy số thiếu cũ trên màn hình để ghi tiếp.

Các thao tác làm thay phần thiếu — thay tồn khả dụng, giữ/giải phóng hàng, nguồn cung dự kiến, ngưỡng hoặc nội dung/hiệu lực yêu cầu — phải phối hợp trên cùng cặp khi liên quan. Phiếu nhiều mặt hàng/kho dùng thứ tự xử lý nhất quán. Nếu cùng nguồn nhu cầu được xử lý ở nhiều kho, vẫn phải kiểm phiên bản và hạn mức của **chính nguồn nhu cầu** theo C05/C06; chỉ khóa cặp kho/sản phẩm chưa đủ để chống phân bổ trùng giữa hai kho.

G05 không lưu thêm con số thiếu như một số dư độc lập. Thiếu được tính từ các nguồn nghiệp vụ còn hiệu lực. Kho/sản phẩm chưa có ngưỡng B07 vẫn có thể phát sinh nhu cầu có căn cứ; vì vậy không dùng bản ghi ngưỡng làm điều kiện tồn tại duy nhất của cơ chế này.

**Ví dụ.** Cùng nhu cầu thiếu 10 viên, A gửi đề nghị 10 thành công trước. B bấm gửi 10 từ màn hình cũ thì phần mềm tính lại, thấy nhu cầu đã có đề nghị đủ và báo cập nhật; không tạo thêm một RR 10. Nếu có một nhu cầu mới khác đủ căn cứ thì vẫn xét riêng. Phần chống trùng không tự xác định ai được duyệt RR hay thay quy tắc H01 v0.1 đã duyệt riêng.

Không có thao tác “mở khóa thủ công” cho nhân viên. Nếu lần lưu thất bại thì không giữ một khóa nghiệp vụ dài hạn; lần sau đọc lại dữ liệu. Cùng cặp đã ngừng sử dụng vẫn giữ bản ghi để phục vụ truy vết, không tự xóa để làm mất mốc kiểm đồng thời.

## G06 · return_source_locks · Kiểm soát dùng chung nguồn giao/nhận

**Căn cứ thiết kế mới.** Snapshot ngày 31/10 ghi `return_source_guards` rỗng, chỉ có index ID và chưa tìm thấy model trong danh sách export tại lần rà đó. Chưa xác định nguồn tạo collection cũ, không khẳng định nó đang có chức năng chạy. Đề xuất G06 dưới đây xuất phát từ yêu cầu chống dùng trùng lượng E02 đã duyệt, không dựa vào việc bảng cũ có tên tương tự. Không xóa DB hiện tại qua phiếu này.

Đề xuất một bản ghi cho **một nguồn giao hàng gốc được nhận diện thống nhất**, dùng chung khi xác nhận khách nhận, báo giao thất bại, đề nghị trả hoặc nhập lại làm thay hạn mức của nguồn đó.

| Trường đề xuất | Kiểu và ý nghĩa |
|---|---|
| `_id`, `sourceKey` | ID và mã nguồn chuẩn hóa do phần mềm xác định; mã nguồn duy nhất. |
| `sourceKind`, `sourceDocumentId`, `sourceItemId` | Loại/ID phiếu và dòng gốc. Với chuỗi WMSD dùng dòng xuất bán H15 làm gốc chung; từng nghiệp vụ vẫn giữ nguồn trực tiếp H16/H23/E02 của mình. |
| `version` | Số nguyên tăng khi hạn mức liên quan của nguồn thay đổi thành công. |
| `lastOperationId` khi có | Lần xử lý gần nhất để truy nhật ký. |
| `createdAt`, `updatedAt` | Thời điểm tự ghi. |

**Nối về một nguồn chung.** Nhiều lần khách nhận H16 từ cùng dòng xuất H15 đều truy về cùng gốc để phối hợp. Điều này không gộp hạn mức của các dòng POD: trả sau khi nhận vẫn kiểm đúng lượng khách nhận ở nguồn của yêu cầu; giao thất bại vẫn theo lượng xuất chưa được khách nhận. Nếu nguồn lịch sử và nguồn WMSD mô tả cùng một lần giao, phải ánh xạ về cùng nguồn chuẩn trước khi cho dùng; không cấp hai hạn mức độc lập bằng hai mã khác nhau. Cách xác minh/ánh xạ nguồn ngoài còn phụ thuộc D07/D08, chưa được tự chốt qua G06.

Khi mở E02, dùng/giải phóng phần đã đề nghị, xác nhận H16, nhận lại H24/H28 hoặc sửa sai đủ quyền làm thay lượng nguồn, phải cập nhật cùng điểm kiểm G06 và đọc lại các lượng còn hiệu lực trong lần lưu. Nếu hai người cùng làm, kết quả lưu trước được tính vào lần kiểm tiếp theo. Những thao tác thay hạn mức đều phải tham gia, không chỉ thao tác tạo hồ sơ trả.

**Ví dụ trả sau khi nhận.** Khách có 20 viên đã nhận và chưa trả. A và B đồng thời đề nghị 15 viên trên cùng nguồn: A ghi trước 15, B chỉ còn được đề nghị tối đa 5. B cần sửa yêu cầu, phần mềm không tự giảm 15 thành 5 rồi gửi thay.

**Ví dụ giao thất bại.** Xuất 40 viên, khách đã nhận 38. Báo giao thất bại tối đa 2. Nếu một người đang ghi thêm kết quả khách nhận còn người khác báo giao thất bại, cả hai phải kiểm cùng nguồn dòng xuất; tổng kết quả hợp lệ không được vượt 40.

G06 không lưu số lượng đang giữ/đã trả lần thứ hai. E02 giữ lượng đề nghị và các lần dùng/giải phóng; H16/H24/H28 cùng C03/C04 xác định kết quả thực tế. G06 chỉ phối hợp cập nhật để các bảng đó nhất quán. Không khóa ô, không dừng nhập/xuất toàn kho và không cấp thêm quyền quyết định hoàn trả. Nhân viên không sửa hoặc tự mở khóa bản ghi này.

## Phạm vi chốt của lượt này

G04 trả lời **một thao tác đã làm chưa**; G05/G06 phối hợp **nhiều thao tác khác nhau cùng dùng một nguồn lượng**. G02 giữ lịch sử, G03 xử lý công việc sau khi lưu; không dùng G03 để dời kiểm hạn mức sang sau khi đã báo thành công.

Ba mục G04, G05 và G06 **ĐÃ DUYỆT v0.1**. D07/D08 vẫn còn mở; H01/H35 đã duyệt riêng v0.1. Ba cấu trúc này là căn cứ đã chốt để tổng hợp từ điển dữ liệu và đối chiếu ràng buộc cùng toàn bộ các phiếu; chưa sửa schema, tạo/xóa collection hoặc chuyển dữ liệu ở lượt này. [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
