# Phiếu duyệt A01–A03 — Tài khoản, vai trò và quyền

Ngày cập nhật: 31/10/2026. **ĐÃ DUYỆT: A01 v0.1, A02 v0.2, A03 v0.2 (v0.1 cộng quyết định bỏ allowedRoleCodes).**

Quyết định mới: dùng tên **Warehouse Staff**; Administrator được tạo thêm role và tick quyền. Role mới thực hiện theo các quyền được tick, không bị giới hạn bởi năm mã role cũ. Danh mục permission vẫn là các chức năng có sẵn, không tự tạo mã quyền/policy. Không thêm roleGroup hoặc allowedRoleGroups.

Những trường đánh dấu “mới” chưa có trong model hiện tại. Lưu [phiếu 0.1](history/02_Duyet_tai_khoan_va_phan_quyen_v0.1.md) và [phiếu 0.2 trước khi chốt](history/02_Duyet_tai_khoan_va_phan_quyen_v0.2_de_xuat.md) để giữ lịch sử. Chưa áp dụng schema/code/DB trong lượt trao đổi này.

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

**Ví dụ minh họa:** tài khoản `kho_a`, tên “Nhân viên kho A”, một role WAREHOUSE, phụ trách Kho A và Kho B. Với cấu hình ban đầu không tick quyền duyệt TR, tài khoản không được duyệt TR. Khi quản lý quyền, kiểm quyền được cấp thay vì suy quyền chỉ từ tên role; vẫn kiểm phạm vi kho và không tự duyệt.

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

### Trường đã duyệt A02 v0.2

| Trường | Kiểu | Bắt buộc / mặc định | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | Có | ID vai trò được user tham chiếu |
| `code` | String | Có, duy nhất | Mã định danh role; bỏ enum chỉ có năm mã. Đề xuất chuẩn chữ hoa và không đổi sau tạo; các mã đang có được giữ |
| `name` **(mới)** | String | Có | Tên đọc hiểu trên giao diện/tài liệu |
| `description` **(mới)** | String | Có | Chú thích trách nhiệm của vai trò; không thay thế kiểm quyền nghiệp vụ |
| `permissionIds` | ObjectId[] → permissions | Có, mặc định [] | Những quyền Admin tick; không trùng; chọn bất kỳ permission hiện hữu và active. Role thực hiện theo quyền được cấp, vẫn chịu điều kiện nghiệp vụ |
| `isSystemRole` **(mới)** | Boolean | Có | True cho năm role có sẵn, false cho role Admin tạo; bảo vệ mã/không xóa hoặc ngừng role nền, không tự cấp quyền nghiệp vụ |
| `isActive` **(mới)** | Boolean | Có, mặc định true | Role mới hoạt động hay ngừng sử dụng; chỉ ngừng khi không còn tài khoản active được gán role đó |
| `version` **(mới)** | Integer | Có, mặc định 1 | Ngăn cập nhật ma trận quyền từ phiên bản cũ |
| `createdAt` / `updatedAt` | Date | Có | Thời gian tạo/cập nhật |

### Quan hệ và ràng buộc

- **Role 1 — n User**, phía user bắt buộc một role.
- **Role n — n Permission:** một vai trò có nhiều quyền, một quyền có thể dùng cho nhiều vai trò. Đề xuất lưu `permissionIds` trên role, chưa tạo `role_permissions` riêng.
- **Đã chốt:** Administrator được tạo role mới và tick các quyền có sẵn. User vẫn có đúng một role; không thêm quyền ghi đè trực tiếp từng user.
- **Đã chốt:** tên hiển thị role WAREHOUSE là Warehouse Staff. Các role mới là role nhân viên nội bộ; tính năng portal/tài khoản khách/NCC không được tự suy ra từ việc mở tạo role.
- **Đã chốt quyền:** role mới có thể nhận bất kỳ permission hiện có và active, bao gồm quyền duyệt. Backend kiểm permission thay vì yêu cầu mã OWNER/WAREHOUSE cố định; vẫn kiểm user, kho, nguồn hồ sơ, trạng thái và phiên bản. Không tự bỏ điều kiện người duyệt khác người gửi hoặc người nhận khác người xuất.
- **Đã chốt vòng đời:** Admin tạo/sửa tên/mô tả/danh sách quyền của role tùy chỉnh, ngừng dùng thay vì xóa; phải chuyển các user active sang role active khác trước khi ngừng. Không đổi mã hoặc xóa/ngừng năm role nền; dấu role nền không mặc nhiên cấp quyền nghiệp vụ.
- Đổi quyền tác động các yêu cầu tiếp theo của những user đang mang role đó, phải được ghi audit. Không sửa danh tính trong lịch sử và không khiến một quyết định cũ thành hợp lệ nếu trước đó sai quyền.
- Không dùng role ADMIN làm quyền vượt mọi nghiệp vụ. Những giới hạn như khác người tạo, kho được giao, phiên bản và trạng thái vẫn được kiểm tại từng thao tác.

**Ví dụ đã chốt:** Admin tạo role “Trưởng ca kho” và tick quyền “Duyệt yêu cầu chuyển kho”. Người mang role này được duyệt yêu cầu trong phạm vi được phép, nhưng không được tự duyệt yêu cầu của mình hoặc duyệt sai trạng thái. Không cần đổi role thành OWNER để thực hiện.

### Quyết định bổ sung đã nhận

- **Q-A02-01:** “Có — role mới thực hiện theo các quyền Admin tick”. Chốt cơ chế theo permission; bỏ `permissions.allowedRoleCodes`, không bổ sung nhóm role nền. Năm role mặc định vẫn giữ để khởi tạo cấu hình.
- **Q-A02-02:** “Duyệt cấu trúc và vòng đời roles 0.2 như đề xuất”. Chốt bảng trường, role tùy chỉnh được sửa/ngừng, không xóa lịch sử và chuyển user active trước khi ngừng.
- Phạm vi dữ liệu được xem (như tiến độ hay chứng từ nội bộ) cần được đặc tả ở từng nghiệp vụ bằng quyền/phạm vi phù hợp. Không cho role mới rơi vào nhánh xem tất cả chỉ vì mã role chưa được code cũ nhận diện.

**Trạng thái:** ĐÃ DUYỆT A02 v0.2. **Phạm vi:** tên Warehouse Staff, role động, quyền theo checkbox và cấu trúc/vòng đời như trên. Ma trận quyền từng nghiệp vụ vẫn được duyệt ở nhóm chức năng tương ứng.

## A03 — permissions — Danh mục quyền thao tác

**Đã duyệt A03 v0.2:** giữ nội dung v0.1, bỏ `allowedRoleCodes` theo câu trả lời Q-A02-01 để hỗ trợ role do Admin tạo. Không thêm `allowedRoleGroups` hoặc giới hạn ẩn theo năm mã role cũ. Phiếu lịch sử giữ nguyên bản v0.1.

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
| `isActive` **(mới)** | Boolean | Có, mặc định true | Quyền còn sử dụng; quyền ngừng dùng không cấp mới hoặc thực thi dù còn tham chiếu cũ |
| `createdAt` / `updatedAt` | Date | Có | Lịch sử thời điểm; việc sửa danh mục có audit riêng |

### Quan hệ và ràng buộc

- **Permission n — n Role**, thông qua `roles.permissionIds`. Quyền thực tế phải có trong role và permission phải active; không giới hạn danh sách role bằng enum năm mã.
- User nhận quyền từ role hiện tại, đề xuất không thêm quyền ngoại lệ gắn riêng từng user.
- Admin chọn quyền có sẵn, không tạo mã quyền tùy ý; các thay đổi danh mục phải đi cùng chức năng được duyệt và cập nhật code kiểm quyền.
- Cần đồng thời đúng user active, role, permission, phạm vi kho/hồ sơ, người thực hiện, trạng thái và phiên bản. Có permission không tự bỏ qua các điều kiện còn lại.
- Một quyền read không quyết định mọi trường được hiển thị: Sales có thể đọc tiến độ TR liên quan nhưng không được xem ghi chú/chứng từ nội bộ; điều này cần xử lý trong nghiệp vụ/DTO.
- Không tạo permission cho UC retired chỉ vì mã cũ còn trong tài liệu. Không xóa lịch sử quyền đã từng được sử dụng.

**Ví dụ:** `stock_relocation:confirm` được cấp ban đầu cho WAREHOUSE, và có thể được Admin tick cho role khác. BF03 vẫn kiểm người tạo lệnh, kho và trạng thái trước xác nhận. Quyền không thay các điều kiện nghiệp vụ.

### Các điểm đã được xác nhận A03 v0.2

1. Giữ danh mục quyền hữu hạn; tên, mô tả, nhóm FE và trạng thái như bảng. Bỏ trường giới hạn role theo Q-A02-01.
2. Không có quyền ghi đè riêng từng tài khoản; Admin gán/bỏ quyền có sẵn qua role.
3. Không có chức năng tạo/chỉnh mọi policy; nếu thay phân quyền một nghiệp vụ phải được duyệt theo nghiệp vụ đó.
4. **Chưa coi toàn bộ 98 mã quyền hay ma trận của các nhóm nghiệp vụ chưa trao đổi là đã được duyệt.** Các giới hạn về người tạo, kho, người duyệt/người nhận độc lập và trạng thái không bị bỏ theo việc bỏ giới hạn mã role.

**Trạng thái:** ĐÃ DUYỆT A03 v0.2. **Căn cứ:** duyệt v0.1 và câu trả lời Q-A02-01 bỏ giới hạn role. **Phạm vi:** cấu trúc bảng và cơ chế cấp quyền; danh mục quyền nghiệp vụ chi tiết duyệt sau.

## Ghi chú đối chiếu code cần xử lý sau khi duyệt

Service `src/modules/roles/role.service.js` hiện vẫn tạo bản ghi Permission nếu nhận mã chưa có. Điều này không đáp ứng danh mục hữu hạn đã duyệt. Khi triển khai sẽ kiểm permission có sẵn/active; bỏ enum năm mã role và rà chỗ kiểm role cứng, phân quyền dữ liệu, middleware, seed và FE để hỗ trợ role mới. Không biến việc cho tạo role thành cho tạo mã quyền hoặc bỏ điều kiện nghiệp vụ. Chưa sửa service trong lượt thiết kế này.

Không lưu mật khẩu SMTP/JWT/Mongo vào ba bảng này. Cơ chế phiên đăng nhập, khôi phục mật khẩu hoặc đăng xuất mọi thiết bị nếu được yêu cầu sẽ có đề xuất dữ liệu riêng và được hỏi trước; không âm thầm thêm vào phạm vi phiếu A01–A03.

A01–A03 đã chốt, không còn câu hỏi mở riêng cho ba cấu trúc này. Việc thực thi code và các ma trận quyền của từng nhóm nghiệp vụ sẽ làm theo các bảng/luồng được duyệt tiếp theo. Chưa đổi code, schema hoặc MongoDB thực trong lượt cập nhật hồ sơ.
