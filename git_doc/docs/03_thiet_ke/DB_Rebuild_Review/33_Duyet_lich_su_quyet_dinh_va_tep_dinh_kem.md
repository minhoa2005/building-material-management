# D05–D06 · Lịch sử quyết định và tệp đính kèm

**Cập nhật 06/11/2026:** Cách tách bảng trong phiếu dưới đây là lịch sử thiết kế. Người dùng đã duyệt [gộp 10 bảng](36_Gop_10_bang.md): ngưỡng, kiểm trả, xác nhận tiền/NCC và giao bù nhúng vào phiếu cha; bỏ chồng hàng, quy cách hiện tồn vào số dư. Quy tắc nghiệp vụ vẫn giữ; D07/D08 còn chờ.


**Bản v0.1 · 02/11/2026 · D05 và D06 đã duyệt riêng.** Người dùng trả lời “Duyệt D05 v0.1” và “Duyệt D06 v0.1”. Giữ nguyên cấu trúc và quy tắc đã trình bên dưới; [bản trước duyệt](history/33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem_v0.1_de_xuat.md) dùng đối chiếu. Chưa sửa code hoặc DB. D07 còn mở vì người dùng cho biết nghiệp vụ này do người khác phụ trách.

Căn cứ: [dòng và tham chiếu D02–D04](32_Duyet_dong_hang_va_lien_ket_chung_tu.md), [quyền A02/A03](02_Duyet_tai_khoan_va_phan_quyen.md), [khách trả H27/H28](24_Duyet_khach_tra_hang_sau_khi_nhan.md), [phương án kiểm kê H25](29_Duyet_ket_qua_dem_phuong_an_va_dieu_chinh.md), [trả NCC H29](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) và [snapshot DB cũ](03_Cau_truc_DB_hien_tai.md).

## D05 · approval_history · Lịch sử quyết định

Một bản ghi lưu **một quyết định cho đúng hồ sơ, phiên bản và phạm vi dòng/lượng**. Ví dụ TR đề nghị 100 viên, Owner duyệt 80: lịch sử giữ người duyệt, thời điểm, lý do giảm lượng, ID dòng và đúng bản đã xem. Khi đổi nội dung rồi gửi lại, quyết định mới không ghi đè quyết định cũ.

| Trường đề xuất | Ý nghĩa và yêu cầu |
|---|---|
| `_id`, `decisionKey` | ID quyết định và mã lần xử lý do phần mềm cấp, ngăn ghi hai lần khi gửi lại cùng hành động. |
| `subjectType`, `subjectId`, `subjectRevision`, `decisionScope` | Loại/ID hồ sơ, bản nội dung và bước hoặc phạm vi quyết định. Không chỉ dựa vào mã phiếu dễ đọc. |
| `reviewedContent` | Bản nội dung bất biến hoặc tham chiếu tới bản bất biến đã được xem. Giữ các trường/nguồn ảnh hưởng đến quyết định; chỉ có một số phiên bản không đủ để dựng lại nội dung cũ. |
| `decision`, `reason` | Chấp thuận, từ chối hoặc trả sửa theo nghiệp vụ. Từ chối, trả sửa, duyệt giảm lượng và quyết định ngoại lệ phải có lý do. |
| `itemDecisions[]` | ID mục quyết định, ID dòng nguồn, hành động, lượng được chấp nhận/từ chối và đơn vị gốc khi nghiệp vụ có lượng. Phần chưa xét vẫn là đang chờ, không tự coi là được chấp thuận. |
| `requestedBy`, `decidedBy`, `decidedAt`, `recordedAt` | Người đề nghị, người quyết định, thời điểm quyết định và thời điểm lưu; danh tính lấy từ tài khoản đang thao tác. |
| `authoritySnapshot` | Quyền thực hiện và vai trò tại lúc quyết định, để đổi role sau này vẫn tra được căn cứ quyền cũ. Không thay việc kiểm quyền hiện tại trước thao tác. |
| `basisRefs[]`, `evidenceIds[]` | Các kết quả kiểm, lần đếm, nguồn xác minh và tệp làm căn cứ, kèm ID/phiên bản cần thiết. |
| `supersedesDecisionId` khi có | Quyết định trước được thay thế theo nghiệp vụ; chỉ thay phần còn được phép thay, giữ lịch sử phần đã thực hiện. |

**Nơi lưu chính.** D05 là lịch sử quyết định dùng chung. Các trường `latestDecision`, `decisions[]`, `reviewDecisions[]` đã mô tả trong phiếu nghiệp vụ giữ ý nghĩa hiển thị/truy vết, nhưng lấy từ ID hoặc dữ liệu đọc của D05; không để hai nơi sửa quyết định độc lập. Nội dung hành động, người, lượng và phiên bản đã duyệt ở từng nghiệp vụ được giữ đầy đủ khi tổng hợp thiết kế.

**Quyền theo từng nghiệp vụ.** TR liên kho và phương án kiểm kê do người có quyền tương ứng xét; quy tắc khác người đề nghị vẫn áp dụng ở nơi đã chốt. Ca khách trả thông thường H27 do Sales Staff quyết định, kể cả hồ sơ mình lập; ngoại lệ của H27/H28 dùng đúng quyền Store Owner và điều kiện đã duyệt. D05 không áp một lệnh cấm tự duyệt chung lên ngoại lệ này. Accountant xác minh thỏa thuận NCC theo H29; D05 không thêm một vòng Owner duyệt vào BF08. Các role mới thực hiện theo permission và phạm vi đã cấp, không bị giới hạn cứng vào tên role cũ.

**Hiệu lực.** Chỉ quyết định trên bản hiện hành và phạm vi hợp lệ mới được dùng để thực hiện. Sửa nội dung làm thay đổi căn cứ thì phải xét lại theo luồng đã duyệt. Quyết định cũ và phần đã thực hiện vẫn được giữ; không dùng quyết định mới để cho thực hiện lại cùng lượng. Hai người quyết định đồng thời phải kiểm cùng phiên bản/phạm vi, không tạo hai quyết định hiệu lực mâu thuẫn. Ghi D05 và trạng thái quyết định của phiếu cùng thành công; gửi lại trả kết quả đã có.

Quyết định duyệt không tự cộng/trừ tồn. Phiếu thực hiện mới ghi tồn theo lượng còn được phép và C03/C04. Lịch sử D05 đã ghi không bị sửa/xóa; thông tin cần đính chính được ghi bằng quyết định tiếp theo khi nghiệp vụ cho phép. H01/H35 đã duyệt riêng v0.1; quyền và luồng theo hai phiếu đó, D05 chỉ giữ lịch sử quyết định.

## D06 · attachments · Tệp đính kèm

Một bản ghi giữ thông tin **một tệp bằng chứng gắn với hồ sơ, dòng hoặc bước nghiệp vụ**. Nội dung ảnh/PDF nằm ở nơi lưu tệp; DB giữ vị trí truy cập nội bộ và thông tin để tra, kiểm quyền, nhận biết đúng bản. Ví dụ hai ảnh hàng vỡ khi nhận chuyển kho liên kết đến phiếu nhận và phần hàng lỗi tương ứng.

| Trường đề xuất | Ý nghĩa và yêu cầu |
|---|---|
| `_id`, `ownerDocumentType`, `ownerDocumentId` | ID tệp và hồ sơ chính sở hữu bằng chứng. ID hồ sơ có thể chưa có trong lúc tải tạm để tạo phiếu. |
| `ownerItemId`, `ownerRevision`, `purpose` | Dòng, bản nội dung hoặc mục đích như bàn giao, kiểm hàng, duyệt ngoại lệ. Chỉ bắt buộc theo bước sử dụng. |
| `originalName`, `mediaType`, `sizeBytes` | Tên tệp gốc, loại tệp thực được kiểm và dung lượng. |
| `storageKey`, `checksum` | Khóa truy cập tệp trong nơi lưu riêng và dấu kiểm nội dung. Không coi cùng dấu kiểm là được phép xem tệp của người khác. |
| `uploadedBy`, `uploadedAt`, `capturedAt` nếu có | Người và thời điểm tải; thời điểm chụp do nguồn cung cấp nếu có, không thay thời điểm nghiệp vụ đã xác nhận. |
| `accessCategory` | Bằng chứng nghiệp vụ được phép chia sẻ, nội bộ, giá mua hoặc giá bán. Quyền đọc là giao giữa quyền hồ sơ và quyền loại nội dung. Các loại có sẵn, không có màn hình tự tạo policy. |
| `status`, `uploadSessionId`, `expiresAt` khi tải tạm | Tải tạm/chờ gắn, đã gắn hoặc đã được thay bằng bản bổ sung. Tệp tạm gắn với người và phiên tạo phiếu để tránh lấy tệp của người khác. |
| `replacesAttachmentId`, `replacementReason` khi có | Tệp cũ và lý do bổ sung/thay bản; không ghi đè nội dung tệp đã dùng làm bằng chứng. |

**Loại tệp đề xuất.** JPG, PNG, WEBP và PDF; tối đa **10 MB mỗi tệp**. Kiểm loại thực, nội dung đọc được và kích thước trước khi cho dùng làm bằng chứng. Giới hạn này là đề xuất của D06 để bạn duyệt, không được xem là ràng buộc đã có. Việc bắt buộc ảnh/chứng từ/ghi chú vẫn theo bước đã duyệt; không bắt mọi phiếu đều tải tệp mới.

**Ghi và thay tệp.** Người có quyền thao tác hồ sơ được tải/gắn tệp đúng bước. Trước khi phiếu được gửi hoặc có quyết định/ghi tồn sử dụng tệp, người tải có thể bỏ tệp nhầm nếu còn quyền sửa. Khi tệp đã làm căn cứ, giữ bản cũ; bổ sung tệp mới và lý do, duyệt lại nếu thay đổi căn cứ của quyết định. Tệp tạm chưa gắn có thể được dọn sau thời hạn vận hành, nhưng phải kiểm chưa có tham chiếu trước khi dọn. Không dọn tệp đã gắn vì đã lâu không mở.

**Xem và chia sẻ.** Kiểm quyền mỗi lần tải xuống hoặc mở ảnh. Không lưu một đường dẫn công khai cố định cho mọi người. Nếu phiếu khác tham chiếu lại cùng tệp, quyền đọc nguồn và loại nội dung vẫn giữ nguyên; không cấp quyền chỉ vì có ID tệp. Thay tên tệp hoặc thay loại nội dung để mở rộng người xem sau khi đã dùng làm bằng chứng không được phép; muốn cung cấp bản dành cho kho thì tạo bản riêng và giữ nguồn gốc.

Ví dụ Warehouse Staff được xem ảnh giao nhận của kho mình nhưng không được tải bản hóa đơn NCC có giá mua. Sales Staff xem tiến độ TR liên quan không đồng nghĩa xem ghi chú hoặc tệp nội bộ. Tệp nhập từ hồ sơ giá mặc định giữ mức hạn chế phù hợp; người không có quyền xem giá không được tự gắn nhãn để mở rộng quyền. Administrator không mặc nhiên xem mọi bằng chứng nghiệp vụ chỉ vì quản lý tài khoản. Nội dung, tên tệp và thông tin xem trước đều phải theo cùng giới hạn.

Tệp tải thành công chưa tự xác nhận phiếu hoặc đổi tồn. Lúc dùng làm căn cứ, phải kiểm tệp còn tồn tại, đã hoàn tất tải, đúng người/hồ sơ và đúng phạm vi. Mất hoặc lỗi tệp thì báo để xử lý, không giả định đã có bằng chứng hợp lệ. D06 không thay D07: ảnh/PDF là tệp, còn số/ngày/dòng hàng và kết quả xác minh của chứng từ ngoài cần dữ liệu nghiệp vụ riêng.

## D07 · Câu hỏi chuẩn bị phiếu tiếp theo, chưa duyệt cấu trúc

H12 đã chốt Sales Staff nhập đơn nguồn và bằng chứng ngay khi tạo SO; WMSD tự quản lý mã đơn, không kết nối hay thao tác MISA. H27 đã chốt chứng từ giao lịch sử dùng làm nguồn trả cần Accountant xác minh. Điểm còn mở là **đơn nguồn mới được Sales nhập khi lập SO có cần Accountant xác minh trước khi tạo yêu cầu xuất WIR/lệnh giao OD hay Sales tự đối chiếu để tiếp tục ngay**. Hai cách đều giữ bằng chứng và người/thời điểm xác minh; lựa chọn này chỉ áp dụng cho đơn nguồn mới, không đổi quyền xác minh nguồn giao lịch sử của H27.

**Phản hồi nhận ngày 02/11/2026:** “chuưa ro do phần này người khác làm nghiệp vụ”. D07 vẫn chưa duyệt; cần người phụ trách xác nhận người và thời điểm xác minh đơn nguồn mới. Chưa chọn Sales hay Accountant và chưa thêm bước chặn WIR/OD. D08 cũng chưa chốt cấu trúc nguồn/dòng phụ thuộc lựa chọn này. Tiếp tục các nhóm dữ liệu độc lập; không coi câu trả lời chưa rõ là duyệt hoặc loại bỏ D07/D08. [H12 đã duyệt](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md).

**ĐÃ DUYỆT D05 và D06 v0.1; D07/D08 còn mở, cần người phụ trách nghiệp vụ làm rõ trước khi chốt.** [Danh mục và tiến độ](01_Danh_muc_duyet.md) · [Nhật ký duyệt](04_Nhat_ky_duyet.md).
