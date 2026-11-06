# G01–G03 · Thông báo, nhật ký và công việc xử lý sau khi lưu

**Bản v0.1 · 02/11/2026 · G01, G02 và G03 đã duyệt riêng.** Người dùng trả lời “Duyệt G01 v0.1”, “Duyệt G02 v0.1” và “Duyệt G03 v0.1”. Giữ nguyên cấu trúc và quy tắc đã trình bên dưới; [bản trước duyệt](history/34_Duyet_thong_bao_nhat_ky_va_su_kien_v0.1_de_xuat.md) dùng đối chiếu. Đây là kết quả duyệt thiết kế, chưa áp vào code/DB và chưa gửi email.

Căn cứ: [A01 về email tùy chọn](02_Duyet_tai_khoan_va_phan_quyen.md), [B07 về cảnh báo tồn](07_Duyet_nguong_ton_va_doi_tac.md), [C03/C04 về giao dịch tồn](10_Duyet_giao_dich_va_lich_su_ton.md), [H37 về thông báo trạng thái hóa đơn](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md), [D05/D06 về quyết định và bằng chứng](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md), [snapshot cấu trúc cũ](03_Cau_truc_DB_hien_tai.md). Người dùng đã xác nhận vẫn có SMTP gửi email trạng thái đơn/hóa đơn; phiếu này đề xuất cách lưu kết quả và thử lại.

| Bảng | Lưu để làm gì? | Ví dụ |
|---|---|---|
| G01 · notifications | Cho từng người biết có việc hoặc trạng thái mới, đã đọc chưa và email gửi đến đâu | Người tạo TR thấy yêu cầu đã được duyệt. |
| G02 · audit_logs | Tra ai đã làm gì với hồ sơ nào, trước/sau ra sao | Tra ai duyệt TR, ai xác nhận xuất và lúc nào. |
| G03 · system_events | Giữ công việc phải xử lý sau khi nghiệp vụ lưu thành công | Gửi thông báo lại khi SMTP lỗi mà không xuất kho thêm lần nữa. |

## G01 · notifications · Thông báo cho từng người

Một bản ghi là thông báo cho **một tài khoản WMSD**, theo một sự kiện hoặc một đợt cảnh báo. Một sự kiện có nhiều người nhận thì tạo bản ghi riêng cho từng người, để mỗi người có trạng thái đọc và gửi email riêng.

| Trường đề xuất | Ý nghĩa và yêu cầu |
|---|---|
| `_id`, `recipientId` | ID thông báo; tài khoản người nhận, bắt buộc. |
| `type`, `eventKey`, `dedupKey` | Loại đã được triển khai, nguồn sự kiện và khóa chống tạo trùng cho cùng người/việc. |
| `sourceType`, `sourceId`, `sourceVersion`, `warehouseIds` | Phiếu/danh mục nguồn, phiên bản tại sự kiện và kho liên quan; chỉ có kho khi nghiệp vụ thuộc kho. |
| `title`, `message`, `occurredAt`, `createdAt` | Nội dung phù hợp quyền, thời điểm việc xảy ra và lúc tạo thông báo. |
| `readAt`, `archivedAt` | Lần người nhận đánh dấu đã đọc hoặc ẩn khỏi danh sách thường dùng. Không đổi trạng thái phiếu. |
| `conditionKey`, `conditionState`, `evaluatedAt` khi là cảnh báo | Đối tượng/đợt cảnh báo, còn áp dụng hay đã hết, và thời điểm đánh giá gần nhất. |
| `emailDelivery` khi gửi email | Địa chỉ đã dùng, trạng thái, số lần thử, lần gửi gần nhất, mã thư và thông tin lỗi được rút gọn. Không có email hoặc không thuộc loại gửi thì ghi bỏ qua. |

**Loại và người nhận đề xuất.** Thông báo yêu cầu chờ xử lý/được duyệt/bị từ chối gửi người tạo hoặc người được giao xử lý đúng quyền. Trạng thái xuất/nhận/giao gửi nhân viên liên quan hồ sơ và kho. Trạng thái hóa đơn gửi người có quyền xem hóa đơn. Cảnh báo tồn thấp gửi Warehouse Staff được giao kho và Store Owner có quyền xem. Role mới nhận theo quyền/phân công, không gửi hàng loạt cho toàn bộ người có cùng tên role. Chi tiết nguồn ngoài D07 chưa chốt không được dùng để tự thêm một bước duyệt hoặc người nhận mới.

**Kênh gửi.** Tạo thông báo trong ứng dụng. Email SMTP cho các thay đổi trạng thái đơn/hóa đơn gửi tới tài khoản có email phù hợp theo A01. Các cảnh báo tồn mặc định trong ứng dụng; không tự gửi email lặp mỗi lần số dư đổi. G01 này không bổ sung email vào bảng khách hàng vốn chỉ có tên/số điện thoại và không tự thêm gửi email cho khách. Nếu có yêu cầu gửi khách sẽ chốt người nhận và dữ liệu riêng.

Chỉ gửi sau khi nghiệp vụ đã lưu thành công. Nội dung email đề xuất ngắn gồm mã, trạng thái và thời điểm; mở chi tiết phải đăng nhập và kiểm quyền hiện tại. Không chép giá mua, ghi chú/tệp nội bộ vào thông báo cho Warehouse hoặc Sales không có quyền. Tài khoản bị khóa hoặc mất quyền trước lúc gửi thì bỏ qua gửi; khi mở danh sách/chi tiết cũng kiểm lại quyền nguồn.

**Chống thông báo lặp.** Cùng sự kiện/người nhận chỉ có một bản ghi. Cảnh báo tồn giữ một đợt đang mở cho cùng người/kho/sản phẩm/thiết lập; tồn vẫn dưới ngưỡng thì cập nhật đánh giá, không tạo thêm một thông báo mỗi lần thay đổi. Khi đủ ngưỡng hoặc thiết lập ngừng, đánh dấu hết cảnh báo; nếu thiếu trở lại thì mở đợt mới. Khi mở cảnh báo hoặc lập đề nghị, tính lại tồn khả dụng và nguồn bù hiện tại theo B07/C05/C06; số liệu cũ không tự trở thành một yêu cầu mua.

`readAt` chỉ nghĩa là đã đọc, không nghĩa đã mua hàng hoặc giải quyết xong. SMTP chấp nhận thư cũng không chứng minh người nhận đã đọc; trạng thái lưu đúng mức biết được. Đề xuất giữ lịch sử thông báo, cho người nhận ẩn/đọc; chưa tự xóa theo ngày khi thời hạn lưu chưa được chốt.

## G02 · audit_logs · Nhật ký thao tác

Một bản ghi là **một hành động có kết quả xác định** đối với tài khoản, danh mục hoặc hồ sơ. G02 trả lời ai thay đổi gì; C04 trả lời số lượng tồn tăng/giảm bao nhiêu; D05 giữ căn cứ quyết định. Không thay ba vai trò này bằng cùng một chuỗi ghi chú.

| Trường đề xuất | Ý nghĩa và yêu cầu |
|---|---|
| `_id`, `eventKey`, `correlationId` | ID và khóa duy nhất của hành động được ghi; mã liên hệ các bản ghi cùng lần xử lý. |
| `actorType`, `actorId`, `actorSnapshot` | Người dùng hoặc tác vụ tự động; ID bắt buộc khi do người dùng. Giữ tên/vai trò tại lúc thao tác để tra lịch sử. |
| `action`, `result`, `reason` | Hành động, thành công/bị từ chối/thất bại và lý do khi cần. Mã loại lấy từ chức năng triển khai, không có thao tác nhập nhật ký tùy ý. |
| `subjectType`, `subjectId`, `warehouseIds` | Đối tượng tác động và kho liên quan nếu có. Thất bại trước khi tìm được đối tượng không tạo ID giả. |
| `versionBefore`, `versionAfter`, `changes[]` | Phiên bản và các trường thay đổi trước/sau thuộc danh sách cho phép. Chỉ giữ dữ liệu cần để giải thích, không sao chép toàn bộ yêu cầu gửi lên. |
| `decisionId`, `transactionId`, `operationId` khi có | Liên kết D05, C03 hoặc G04 tương ứng, không tạo thêm biến động tồn. |
| `occurredAt`, `recordedAt` | Thời điểm hành động và thời điểm lưu, do phần mềm ghi. |

**Phạm vi đề xuất.** Ghi tạo/sửa/hủy, gửi duyệt/quyết định, xác nhận nhập/xuất/chuyển, đổi quyền và khóa tài khoản. Đăng nhập bị từ chối hoặc nghiệp vụ bị chặn có thể ghi kết quả thất bại, không biến thành nhật ký thành công. Nhật ký của thay đổi thành công phải được lưu cùng thay đổi; nếu toàn bộ thay đổi bị hủy thì không giữ một bản ghi giả thành công. Thông tin lỗi gửi email nằm ở G01/G03, không ghi thành lỗi xuất kho.

Không lưu mật khẩu, mã phiên đăng nhập, khóa SMTP, chuỗi kết nối hoặc toàn bộ tệp bằng chứng trong nhật ký. Giá hoặc thông tin liên hệ cần truy vết được bảo vệ như dữ liệu nguồn, không trả qua màn hình lịch sử cho người thiếu quyền. Bản ghi của tác vụ tự động giữ nguồn kích hoạt để truy ra người nghiệp vụ khi có.

**Quyền và vòng đời.** Store Owner xem nhật ký nghiệp vụ trong phạm vi quyền. Người có quyền xem lịch sử phiếu chỉ xem các thao tác và trường được phép trên phiếu đó. Administrator xem nhật ký quản trị/tài khoản theo quyền, không mặc nhiên được đọc giá mua hoặc hồ sơ bán hàng. Không ai sửa/xóa bản ghi đã lưu qua chức năng thông thường; nếu cần đính chính thì ghi sự kiện mới liên kết bản cũ. Đề xuất giữ lịch sử xuyên suốt dự án; thời hạn lưu trữ dài hạn sẽ chốt riêng, không tự đặt lịch xóa.

## G03 · system_events · Công việc sau khi lưu thành công

Đề xuất mỗi bản ghi là **một sự kiện cần được một tác vụ xử lý**, chẳng hạn tạo thông báo từ kết quả duyệt hoặc gửi email cho một thông báo. Cùng sự kiện có nhiều tác vụ thì lưu riêng theo mã tác vụ, để một việc lỗi không chạy lại việc đã xong. Các tác vụ là chức năng có sẵn trong phần mềm, không cho nhập mã chạy, địa chỉ gọi hoặc tạo policy tùy ý.

| Trường đề xuất | Ý nghĩa và yêu cầu |
|---|---|
| `_id`, `eventKey`, `handlerCode`, `eventType` | ID công việc, mã sự kiện và tác vụ; cặp sự kiện/tác vụ duy nhất. |
| `sourceType`, `sourceId`, `sourceVersion`, `correlationId` | Nguồn, phiên bản và mã liên hệ. Có thể trỏ phiếu, danh mục hoặc thông báo G01. |
| `payload`, `payloadVersion` | Dữ liệu tối thiểu cần xử lý, ưu tiên ID và thông tin sự kiện; không chứa mật khẩu, tệp hoặc dữ liệu giá không cần thiết. |
| `status`, `attempts`, `nextAttemptAt` | Chờ/đang xử lý/chờ thử lại/xong/bỏ qua/cần kiểm tra; số lần và lịch thử tiếp. |
| `leaseOwner`, `leaseToken`, `leaseUntil` | Nhận diện tác vụ đang giữ quyền xử lý tạm thời. Hết hạn có thể nhận lại, tác vụ cũ không được ghi đè kết quả của lượt mới. |
| `lastErrorCode`, `lastErrorSummary`, `completedAt` | Kết quả lỗi rút gọn và thời điểm hoàn tất; thông tin lỗi không chứa dữ liệu bí mật. |
| `occurredAt`, `createdAt`, `updatedAt` | Mốc sự kiện và mốc lưu/cập nhật công việc. |

G03 được ghi **cùng lần lưu nghiệp vụ nguồn**. Nguồn không lưu thành công thì không có công việc gửi trạng thái thành công. Chỉ bắt đầu xử lý sau khi nguồn đã lưu xong. Các ràng buộc như trừ tồn, hạn mức, giữ hàng, phê duyệt và mở khóa kiểm kê vẫn nằm trong nghiệp vụ chính; không đẩy chúng sang hàng đợi rồi báo hoàn tất sớm.

**Ví dụ.** Confirm xuất chuyển kho đã trừ nguồn và ghi đang chuyển thành công. Phần mềm lưu công việc tạo thông báo. SMTP lỗi thì giữ công việc gửi email để thử lại; không chạy lại Confirm TO, không trừ tồn lần nữa. Tác vụ tạo G01 chống trùng theo người/sự kiện. Công việc gửi email trỏ đúng G01, kết quả gửi từng người lưu ở `emailDelivery`; G03 điều phối việc xử lý, không tự tạo một bộ kết quả thư mâu thuẫn.

Khi xử lý lại, đọc nguồn còn tồn tại, kiểm quyền người nhận và dùng đúng phiên bản sự kiện. Thông báo trạng thái cũ phải ghi rõ thời điểm; không diễn đạt trạng thái cũ thành trạng thái hiện tại. Cảnh báo tồn tính lại điều kiện hiện tại trước khi phát, tránh sự kiện đến trễ tạo cảnh báo đã hết.

Lỗi tạm thời được thử lại có giới hạn; hết số lần cấu hình thì chuyển cần kiểm tra, không thử vô hạn. Người có quyền vận hành có thể yêu cầu thử lại chính công việc đó, không sửa nội dung nguồn hoặc đổi người nhận để vượt quyền. Đề xuất cơ chế giữ quyền xử lý và kiểm khóa giúp tránh hai tác vụ cùng hoàn tất một việc; thao tác nghiệp vụ đích vẫn phải chống ghi trùng.

Với email, có thể gặp trường hợp SMTP đã nhận nhưng kết nối mất trước khi phần mềm biết kết quả. Khi đó ghi **chưa xác định**, kiểm lại kết quả nếu dịch vụ có hỗ trợ; không khẳng định thư chưa gửi hoặc tự bảo đảm không bao giờ gửi trùng. G03 không phải cơ chế bảo đảm người nhận đọc email. Mọi thử lại vẫn không được lặp biến động tồn.

**Quyền và lưu trữ.** G03 do phần mềm ghi. Người vận hành được cấp quyền xem trạng thái/lỗi đã lọc và thử lại; không mặc nhiên xem toàn bộ hồ sơ nguồn. Giữ dấu vết hoàn tất và khóa chống trùng; nếu sau này dọn dữ liệu phải bảo toàn khả năng nhận ra sự kiện đã xử lý, chốt chính sách riêng trước khi áp dụng.

Ba mục G01, G02, G03 **ĐÃ DUYỆT v0.1**. D07/D08 vẫn để mở cho người phụ trách nghiệp vụ; H01/H35 đã được duyệt qua phản hồi riêng ngày 02/11/2026. [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
