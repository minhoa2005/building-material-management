# Phiếu duyệt A01–A03 — Tài khoản, vai trò và quyền

Hồ sơ cập nhật **0.2**, ngày 31/10/2026. **A01 đã duyệt 0.1; A03 đã duyệt 0.1 nhưng cách giới hạn role cần làm rõ theo A02 mới; A02 đã nhận yêu cầu sửa, chưa duyệt trọn phiếu 0.2.**

Quyết định mới: dùng tên **Warehouse Staff**, không dùng Inventory Staff; Administrator được tạo thêm role và tick quyền. Quyết định này thay giới hạn chỉ có năm role ở đề xuất cũ. Danh mục permission vẫn là các chức năng có sẵn, không tự tạo mã quyền/policy.

Những trường đánh dấu “mới” chưa có trong model hiện tại. Lưu [phiếu 0.1 đã được phản hồi](history/02_Duyet_tai_khoan_va_phan_quyen_v0.1.md) để phân biệt nội dung đã duyệt với đề xuất sửa. Chưa áp dụng schema/code/DB trong lượt trao đổi này.

## A01 — users — Tài khoản nhân viên

**Một bản ghi là một tài khoản cá nhân của người thao tác trong hệ thống.** Bảng này trả lời ai tạo phiếu, ai duyệt, ai xác nhận hàng; không phải bảng thông tin khách hàng hoặc NCC. Không tạo thêm bảng nhân sự/chấm công.

Hiện tại có khoảng 6 bản ghi. Model đang có username, fullName, passwordHash, roleId, warehouseIds, phone, isActive và timestamps.

### Trường đề xuất

| Trường | Kiểu | Bắt buộc / mặc định | Mô tả và nguồn dữ liệu |
|---|---|---|---|
| `_id` | ObjectId | Có, tự tạo | ID cố định để chứng từ trỏ đến đúng người, kể cả khi đổi tên hoặc khóa tài khoản |
| `username` | String | Có, duy nhất | Tên đăng nhập do Administrator cấp. Đề xuất lưu chuẩn chữ thường, bỏ khoảng trắng hai đầu; không đổi sau tạo |
| `fullName` | String | Có | Họ tên hiển thị; Admin được cập nhật thông tin hiện tại |
| `passwordHash` | String | Có | Giá trị mật khẩu đã băm do backend tạo; không trả trong API thông thường và không lưu mật khẩu gốc |
| `roleId` | ObjectId → roles | Có, đúng một | Vai trò hiện tại; không dùng mảng roleIds và không chọn vai trò khác mỗi lần đăng nhập |
| `warehouseIds` | ObjectId[] → warehouses | Có, mặc định [] | Những kho được phân công; mảng không trùng ID. Quyền tại hồ sơ vẫn phải kiểm thêm người tạo/nguồn/trạng thái |
| `phone` | String | Không bắt buộc | Điện thoại liên hệ; không mặc định dùng đăng nhập; đề xuất không unique |
| `email` **(mới)** | String | Không bắt buộc | Địa chỉ nhận thông báo nếu bật email. Không có email thì không gửi email cho tài khoản này; vẫn có thông báo trong ứng dụng. Đề xuất không dùng để đăng nhập/khôi phục mật khẩu trong phạm vi phiếu này |
| `isActive` | Boolean | Có, mặc định true | Cho phép sử dụng tài khoản. False chặn đăng nhập và các thao tác tiếp theo; không xóa dấu vết cũ |
| `version` **(mới)** | Integer | Có, mặc định 1 | Kiểm soát hai người sửa vai trò/phạm vi kho đồng thời; lưu theo phiên bản đang xem |
| `createdAt` / `updatedAt` | Date | Có, tự ghi | Thời điểm tạo và cập nhật theo UTC. Người thay đổi và nội dung thay đổi nằm trong audit_logs sẽ duyệt riêng |

### Quan hệ và ràng buộc

- **Role 1 — n User:** mỗi user bắt buộc có đúng 1 role; một role có thể chưa có người hoặc có nhiều người.
- **User n — n Warehouse:** một người có thể được giao nhiều kho, một kho có thể có nhiều người. Đề xuất lưu `warehouseIds` có giới hạn theo danh mục kho, không thêm collection nối riêng ở giai đoạn này.
- **User 1 — n hồ sơ/thao tác:** các trường người tạo/duyệt/xác nhận phải lấy từ phiên đăng nhập thực. Khóa tài khoản không xóa ID khỏi chứng từ.
- Warehouse Staff cần ít nhất một kho được giao trước khi thực hiện nghiệp vụ; tài khoản chưa phân công có thể tồn tại nhưng không được thao tác kho. Owner vẫn chỉ làm các thao tác thuộc quyền Owner; Admin không mặc nhiên có quyền kho vì quản trị tài khoản.
- Với Sales/Accountant, `warehouseIds` chỉ là một lớp giới hạn; quyền xem SO, TR, dữ liệu nội bộ còn theo hồ sơ nguồn. Chi tiết từng loại phiếu sẽ được duyệt sau, không cấp quyền toàn kho chỉ vì có ID trong mảng.
- Đề xuất Admin quản lý tài khoản và phân công. Không xóa cứng tài khoản đã có hồ sơ; để đơn giản đề xuất chỉ khóa, không có thao tác xóa user.
- Chứng từ đã xác nhận giữ ID người thực hiện và dấu vết lịch sử. Đổi role không thay quyết định đã thực hiện và không cho phép tự duyệt hồ sơ do chính mình gửi.
- Email tùy chọn không đặt unique trong đề xuất này vì chưa dùng làm danh tính đăng nhập; nếu sau này dùng email để đăng nhập/khôi phục phải duyệt lại ràng buộc đó.

**Ví dụ minh họa:** tài khoản `kho_a`, tên “Nhân viên kho A”, một role WAREHOUSE, phụ trách Kho A và Kho B. Tài khoản chỉ xem/thao tác các hồ sơ có quyền tương ứng; không được duyệt TR như Owner.

### Các điểm đã được xác nhận A01

1. Giữ đăng nhập bằng username, không đổi username sau tạo; email/điện thoại tùy chọn như bảng trên.
2. Một user một role; nhiều kho được phân công; không thêm bảng hồ sơ nhân viên riêng.
3. Administrator tạo/cập nhật/khóa/phân công; tài khoản đã có lịch sử chỉ khóa, không xóa.
4. Người dùng duyệt toàn bộ các trường và ràng buộc của A01 phiên bản 0.1. Việc mở rộng danh mục role ở A02 không đổi quan hệ mỗi user đúng một role.

**Trạng thái:** ĐÃ DUYỆT A01 v0.1. **Phản hồi:** “Duyệt A01 theo phiếu 0.1”. **Phạm vi được duyệt:** bảng users, trường, quan hệ và các quy tắc A01 v0.1; không bao gồm ma trận quyền chi tiết của từng nghiệp vụ.

## A02 — roles — Vai trò

**Một bản ghi là một vai trò do hệ thống cung cấp ban đầu hoặc do Administrator tạo thêm.** Vai trò gom các quyền thao tác được tick trong danh mục có sẵn. Tạo role không tạo thêm chức năng hoặc quy trình nghiệp vụ mới.

Snapshot DB hiện tại có 5 bản ghi. Đây là số role đang có, không còn là giới hạn số role của thiết kế mới. Schema cũ đang có `code` enum năm giá trị, `permissionIds` và timestamps; enum này sẽ phải thay khi triển khai thiết kế được duyệt.

| Mã hiện có | Tên hiển thị đề xuất | Ý nghĩa |
|---|---|---|
| OWNER | Store Owner | Chủ cửa hàng |
| ACCOUNTANT | Accountant | Kế toán |
| WAREHOUSE | Warehouse Staff | Nhân viên kho; tên hiển thị đã được người dùng sửa và chốt |
| SALES | Sales Staff | Nhân viên bán hàng |
| ADMIN | Administrator | Quản trị tài khoản và quyền trong phạm vi được phép |

### Trường đề xuất A02 v0.2 — chờ duyệt phần bổ sung

| Trường | Kiểu | Bắt buộc / mặc định | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | Có | ID vai trò được user tham chiếu |
| `code` | String | Có, duy nhất | Mã định danh role; bỏ enum chỉ có năm mã. Đề xuất chuẩn chữ hoa và không đổi sau tạo; các mã đang có được giữ |
| `name` **(mới)** | String | Có | Tên đọc hiểu trên giao diện/tài liệu |
| `description` **(mới)** | String | Có | Chú thích trách nhiệm của vai trò; không thay thế kiểm quyền nghiệp vụ |
| `permissionIds` | ObjectId[] → permissions | Có, mặc định [] | Những quyền Admin tick; không trùng, chỉ chọn permission hiện hữu và đang active. Phạm vi quyền được chọn còn chờ Q-A02-01 bên dưới |
| `isSystemRole` **(mới, chờ duyệt)** | Boolean | Có | True cho năm role có sẵn, false cho role Admin tạo; đề xuất dùng để bảo vệ mã/không xóa role nền, không tự cấp quyền nghiệp vụ |
| `isActive` **(mới, chờ duyệt)** | Boolean | Có, mặc định true | Role mới hoạt động hay ngừng sử dụng; đề xuất chỉ ngừng khi không còn tài khoản active được gán role đó |
| `version` **(mới)** | Integer | Có, mặc định 1 | Ngăn cập nhật ma trận quyền từ phiên bản cũ |
| `createdAt` / `updatedAt` | Date | Có | Thời gian tạo/cập nhật |

### Quan hệ và ràng buộc

- **Role 1 — n User**, phía user bắt buộc một role.
- **Role n — n Permission:** một vai trò có nhiều quyền, một quyền có thể dùng cho nhiều vai trò. Đề xuất lưu `permissionIds` trên role, chưa tạo `role_permissions` riêng.
- **Đã chốt:** Administrator được tạo role mới và tick các quyền có sẵn. User vẫn có đúng một role; không thêm quyền ghi đè trực tiếp từng user.
- **Đã chốt:** tên hiển thị role WAREHOUSE là Warehouse Staff. Các role mới là role nhân viên nội bộ; tính năng portal/tài khoản khách/NCC không được tự suy ra từ việc mở tạo role.
- **Chờ chốt:** role mới có thể nhận bất kỳ permission hiện có (bao gồm quyền duyệt), hay phải thuộc một nhóm nghiệp vụ nền và chỉ chọn quyền của nhóm đó. Không âm thầm mặc định chỉ năm role cũ được dùng quyền.
- **Đề xuất vòng đời, chưa duyệt:** Admin tạo/sửa tên/mô tả/danh sách quyền của role tùy chỉnh, ngừng dùng thay vì xóa; phải chuyển các user active sang role active khác trước khi ngừng. Không đổi mã hoặc xóa/ngừng năm role nền; danh sách quyền của role nền vẫn có thể cập nhật trong phạm vi sẽ chốt.
- Đổi quyền tác động các yêu cầu tiếp theo của những user đang mang role đó, phải được ghi audit. Không sửa danh tính trong lịch sử và không khiến một quyết định cũ thành hợp lệ nếu trước đó sai quyền.
- Không dùng role ADMIN làm quyền vượt mọi nghiệp vụ. Những giới hạn như khác người tạo, kho được giao, phiên bản và trạng thái vẫn được kiểm tại từng thao tác.

**Ví dụ cần chốt:** Admin tạo role “Trưởng ca kho”. Khi tick quyền “Duyệt yêu cầu chuyển kho”, người mang role mới có được duyệt TR hay quyền đó vẫn chỉ thuộc nhóm Store Owner? Đây là quyết định về quyền nghiệp vụ; tên role mới tự nó chưa trả lời được.

### Q-A02-01 — Quyền được tick cho role mới

Hai phương án cần chọn:

1. **Theo quyền được cấp:** Admin tick bất kỳ permission hiện có cho role mới. Người thuộc role đó được thực hiện thao tác đã tick; vẫn kiểm kho, người tạo/người duyệt độc lập, trạng thái và phiên bản. Khi đó bỏ giới hạn `allowedRoleCodes` năm mã trong A03; vai trò cũ chỉ là cấu hình ban đầu. BE không được kiểm cứng OWNER/WAREHOUSE theo tên mã để chặn role mới đã có quyền. Các khác biệt về dữ liệu được xem phải được xác định bằng permission/phạm vi phù hợp, không cho role mới rơi vào nhánh xem tất cả.
2. **Theo nhóm nghiệp vụ nền:** Admin chọn role mới thuộc một trong năm nhóm rồi chỉ tick quyền của nhóm đó. Khi đó bổ sung `roles.roleGroup` và đổi `permissions.allowedRoleCodes` thành `allowedRoleGroups`; nhiều role có thể chung một nhóm. Đây là đề xuất nếu người dùng muốn giữ giới hạn theo trách nhiệm cũ, không phải ràng buộc đã chốt.

Cả hai phương án đều giữ danh mục permission hữu hạn, không có trình tự tạo policy và không miễn kiểm phạm vi/trạng thái. Chưa triển khai phương án nào.

### Q-A02-02 — Vòng đời và các trường bổ sung

Đề xuất duyệt bảng trường A02 v0.2 với `code` dạng String, thêm `isSystemRole` và `isActive`; role tùy chỉnh được sửa và ngừng dùng, giữ lịch sử thay vì xóa. Phải gán lại user active trước khi ngừng role. Năm role nền giữ mã và luôn tồn tại. Phạm vi tick quyền vẫn theo câu trả lời Q-A02-01, không được quyết định ngầm khi duyệt vòng đời.

**Trạng thái:** ĐÃ CHỐT YÊU CẦU SỬA, CHỜ Q-A02-01/02. **Phản hồi:** “ko có inventory staff, đổi sang warehouse staff”; “Admin có thể tạo thêm role và tick các phân quyền”. **Phạm vi đã chốt:** tên Warehouse Staff và khả năng tạo role/gán quyền. Chưa coi toàn bộ A02 v0.2 được duyệt.

## A03 — permissions — Danh mục quyền thao tác

**Người dùng đã duyệt A03 v0.1.** Bảng trường dưới đây giữ dấu vết nội dung đã duyệt. Riêng `allowedRoleCodes` giới hạn năm mã xung đột với yêu cầu tạo role mới ở A02; phần này được đánh dấu **CHỜ ĐIỀU CHỈNH**, không tự suy ra người dùng đã đồng ý bỏ hoặc thay nó. Các phần còn lại của A03 vẫn giữ phê duyệt.

**Một bản ghi là một thao tác có thể cấp quyền, chẳng hạn xem, tạo, sửa hoặc xác nhận chuyển vị trí.** Một UC gộp vẫn có thể cần nhiều quyền khác nhau. Đây là danh mục cố định từ chức năng đã duyệt, không phải công cụ tự tạo policy.

Hiện tại có khoảng 98 bản ghi. Schema mới chỉ có `code` và timestamps, chưa có tên/mô tả riêng để người đọc dễ hiểu. Số 98 không phải số lượng bắt buộc của DB mới; danh mục chi tiết phải đối chiếu lại UC đang hoạt động.

### Trường đề xuất

| Trường | Kiểu | Bắt buộc / mặc định | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | Có | ID quyền |
| `code` | String | Có, duy nhất | Mã kỹ thuật như `stock_relocation:confirm`; backend dùng để kiểm quyền; không cho người dùng nhập tùy ý |
| `name` **(mới)** | String | Có | Tên dễ đọc, ví dụ “Xác nhận chuyển vị trí” |
| `description` **(mới)** | String | Có | Quyền cho phép làm gì và giới hạn cơ bản; không dùng câu chung “quản lý tất cả” |
| `featureCode` **(mới)** | String enum | Có | Nhóm FE-01 đến FE-09 để trình bày ma trận; quyền dùng chung chọn nhóm quản lý chính |
| `allowedRoleCodes` **(v0.1 đã duyệt; CHỜ ĐIỀU CHỈNH)** | String[] enum theo v0.1 | Chờ Q-A02-01 để chốt thiết kế mới | v0.1 giới hạn năm mã role. Nếu chọn cấp quyền tự do thì bỏ trường; nếu chọn nhóm nghiệp vụ thì thay bằng `allowedRoleGroups`. Chưa chốt phương án thay thế |
| `isActive` **(mới)** | Boolean | Có, mặc định true | Quyền còn sử dụng; quyền ngừng dùng không cấp mới hoặc thực thi dù còn tham chiếu cũ |
| `createdAt` / `updatedAt` | Date | Có | Lịch sử thời điểm; việc sửa danh mục có audit riêng |

### Quan hệ và ràng buộc

- **Permission n — n Role**, thông qua `roles.permissionIds`. Quyền thực tế phải có trong role; giới hạn theo role/nhóm ở bản mới đang chờ Q-A02-01.
- User nhận quyền từ role hiện tại, đề xuất không thêm quyền ngoại lệ gắn riêng từng user.
- Admin chọn quyền có sẵn, không tạo mã quyền tùy ý; các thay đổi danh mục phải đi cùng chức năng được duyệt và cập nhật code kiểm quyền.
- Cần đồng thời đúng user active, role, permission, phạm vi kho/hồ sơ, người thực hiện, trạng thái và phiên bản. Có permission không tự bỏ qua các điều kiện còn lại.
- Một quyền read không quyết định mọi trường được hiển thị: Sales có thể đọc tiến độ TR liên quan nhưng không được xem ghi chú/chứng từ nội bộ; điều này cần xử lý trong nghiệp vụ/DTO.
- Không tạo permission cho UC retired chỉ vì mã cũ còn trong tài liệu. Không xóa lịch sử quyền đã từng được sử dụng.

**Ví dụ cấu hình ban đầu:** `stock_relocation:confirm` được cấp cho WAREHOUSE. Khả năng cấp quyền đó cho role mới đang chờ Q-A02-01; BF03 vẫn kiểm người tạo lệnh, kho và trạng thái trước xác nhận. Quyền không thay các điều kiện nghiệp vụ.

### Các điểm đã được xác nhận A03 v0.1 và phần mở lại

1. Giữ danh mục quyền hữu hạn; thêm tên, mô tả, nhóm FE và giới hạn role như bảng.
2. Không có quyền ghi đè riêng từng tài khoản; Admin chỉ gán/bỏ quyền có sẵn và phù hợp role.
3. Không có chức năng tạo/chỉnh mọi policy; nếu thay phân quyền một nghiệp vụ phải được duyệt theo nghiệp vụ đó.
4. Người dùng đã duyệt cấu trúc/ràng buộc phiên bản 0.1. **Việc này chưa phải duyệt toàn bộ 98 mã quyền hay ma trận của các nhóm nghiệp vụ chưa trao đổi.** Chỉ mở lại cách giới hạn role do yêu cầu mới ở A02; không hỏi duyệt lại các phần không thay đổi.

**Trạng thái:** ĐÃ DUYỆT A03 v0.1; CHỜ ĐỒNG BỘ GIỚI HẠN ROLE. **Phản hồi:** “Duyệt A03 theo phiếu 0.1”. **Phạm vi được duyệt:** danh mục quyền hữu hạn, trường mô tả/nhóm FE/trạng thái, cấp qua role và kiểm scope/trạng thái; giới hạn `allowedRoleCodes` cần quyết định tương thích A02.

## Ghi chú đối chiếu code cần xử lý sau khi duyệt

Service `src/modules/roles/role.service.js` hiện vẫn tạo bản ghi Permission nếu nhận mã chưa có. Điều này không đáp ứng đề xuất danh mục hữu hạn ở trên. Chưa sửa service trong lượt thiết kế này; sau khi phê duyệt phải thay cơ chế đó bằng kiểm danh mục/role phù hợp, đồng bộ BE/FE và có kiểm tra quyền.

Không lưu mật khẩu SMTP/JWT/Mongo vào ba bảng này. Cơ chế phiên đăng nhập, khôi phục mật khẩu hoặc đăng xuất mọi thiết bị nếu được yêu cầu sẽ có đề xuất dữ liệu riêng và được hỏi trước; không âm thầm thêm vào phạm vi phiếu A01–A03.

Hai câu hỏi đang mở là Q-A02-01 và Q-A02-02. A01 và phần A03 không thay đổi không cần duyệt lại. Câu trả lời sẽ được lưu vào nhật ký; chưa cập nhật code, schema hoặc MongoDB khi còn các quyết định phụ thuộc chưa chốt.
