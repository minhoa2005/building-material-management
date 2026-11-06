# Phiếu duyệt A01–A03 — Tài khoản, vai trò và quyền

Phiên bản **0.1**, ngày 31/10/2026. **ĐỀ XUẤT — CHƯA DUYỆT.**

Đề xuất này dựa trên UC-94–98, model hiện tại và năm vai trò đã xác định. Những trường đánh dấu “mới” chưa có trong model hiện tại. Mọi mục cần người dùng xác nhận trước khi chuyển sang schema mới.

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

### Các điểm cần xác nhận A01

1. Giữ đăng nhập bằng username, không đổi username sau tạo; email/điện thoại tùy chọn như bảng trên.
2. Một user một role; nhiều kho được phân công; không thêm bảng hồ sơ nhân viên riêng.
3. Administrator tạo/cập nhật/khóa/phân công; tài khoản đã có lịch sử chỉ khóa, không xóa.
4. Duyệt các trường và ràng buộc phiên bản 0.1, hoặc chỉ rõ trường cần thêm/bỏ/thay đổi.

**Trạng thái:** CHỜ Ý KIẾN. **Phản hồi:** chưa nhận. **Phạm vi được duyệt:** chưa có.

## A02 — roles — Vai trò

**Một bản ghi là một vai trò cố định trong dự án.** Vai trò gom các thao tác phù hợp với trách nhiệm công việc; không biến thành chức năng tự thiết kế luồng/policy.

Hiện tại có 5 bản ghi. Schema đang có `code`, `permissionIds` và timestamps. Đề xuất giữ mã đang dùng để dễ đối chiếu; thêm tên và mô tả rõ hơn.

| Mã hiện có | Tên hiển thị đề xuất | Ý nghĩa |
|---|---|---|
| OWNER | Store Owner | Chủ cửa hàng |
| ACCOUNTANT | Accountant | Kế toán |
| WAREHOUSE | Inventory Staff | Nhân viên kho; “Warehouse Staff” trong swimlane là cùng vai trò, không thêm vai trò thứ sáu |
| SALES | Sales Staff | Nhân viên bán hàng |
| ADMIN | Administrator | Quản trị tài khoản và quyền trong phạm vi được phép |

### Trường đề xuất

| Trường | Kiểu | Bắt buộc / mặc định | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | Có | ID vai trò được user tham chiếu |
| `code` | String enum | Có, duy nhất | Một trong năm mã trên; không đổi tự do |
| `name` **(mới)** | String | Có | Tên đọc hiểu trên giao diện/tài liệu |
| `description` **(mới)** | String | Có | Chú thích trách nhiệm của vai trò; không thay thế kiểm quyền nghiệp vụ |
| `permissionIds` | ObjectId[] → permissions | Có, mặc định [] | Các quyền đang được cấp; không trùng; phải nằm trong giới hạn cho vai trò đó |
| `version` **(mới)** | Integer | Có, mặc định 1 | Ngăn cập nhật ma trận quyền từ phiên bản cũ |
| `createdAt` / `updatedAt` | Date | Có | Thời gian tạo/cập nhật |

### Quan hệ và ràng buộc

- **Role 1 — n User**, phía user bắt buộc một role.
- **Role n — n Permission:** một vai trò có nhiều quyền, một quyền có thể dùng cho nhiều vai trò. Đề xuất lưu `permissionIds` trên role, chưa tạo `role_permissions` riêng.
- Chỉ giữ năm role, không có chức năng thêm/xóa role hoặc cấp role cho Customer/Supplier/Driver.
- Administrator có thể bật/tắt quyền trong danh mục được duyệt cho từng vai trò; không cấp `approve_transfer` cho WAREHOUSE nếu nghiệp vụ chỉ cho OWNER. Tên mã thực sẽ theo danh mục permissions được duyệt.
- Đổi quyền tác động các yêu cầu tiếp theo của những user đang mang role đó, phải được ghi audit. Không sửa danh tính trong lịch sử và không khiến một quyết định cũ thành hợp lệ nếu trước đó sai quyền.
- Không dùng role ADMIN làm quyền vượt mọi nghiệp vụ. Những giới hạn như khác người tạo, kho được giao, phiên bản và trạng thái vẫn được kiểm tại từng thao tác.

**Ví dụ:** OWNER có quyền đọc TR và duyệt TR; WAREHOUSE có quyền tạo TR/xuất/nhận theo phạm vi. Hai vai trò có thể cùng đọc TR nhưng khác quyền thay đổi.

### Các điểm cần xác nhận A02

1. Giữ đúng năm role và cách hiển thị trên; Inventory Staff/Warehouse Staff chỉ là một vai trò.
2. Giữ `permissionIds` trong role, không thêm bảng nối chỉ vì mô hình quan hệ n–n.
3. Admin được cấu hình quyền trong giới hạn chức năng đã duyệt; không thêm role hoặc tạo quy trình/policy mới.
4. Duyệt các trường và quy tắc phiên bản 0.1 hoặc ghi thay đổi.

**Trạng thái:** CHỜ Ý KIẾN. **Phản hồi:** chưa nhận. **Phạm vi được duyệt:** chưa có.

## A03 — permissions — Danh mục quyền thao tác

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
| `allowedRoleCodes` **(mới)** | String[] enum | Có | Những role được phép nhận quyền theo nghiệp vụ; chỉ gồm năm mã role. Đây là giới hạn tối đa, không tự cấp quyền |
| `isActive` **(mới)** | Boolean | Có, mặc định true | Quyền còn sử dụng; quyền ngừng dùng không cấp mới hoặc thực thi dù còn tham chiếu cũ |
| `createdAt` / `updatedAt` | Date | Có | Lịch sử thời điểm; việc sửa danh mục có audit riêng |

### Quan hệ và ràng buộc

- **Permission n — n Role**, thông qua `roles.permissionIds`. `allowedRoleCodes` chỉ giới hạn ai có thể được cấp; quyền thực tế vẫn phải có trong role.
- User nhận quyền từ role hiện tại, đề xuất không thêm quyền ngoại lệ gắn riêng từng user.
- Admin chọn quyền có sẵn, không tạo mã quyền tùy ý; các thay đổi danh mục phải đi cùng chức năng được duyệt và cập nhật code kiểm quyền.
- Cần đồng thời đúng user active, role, permission, phạm vi kho/hồ sơ, người thực hiện, trạng thái và phiên bản. Có permission không tự bỏ qua các điều kiện còn lại.
- Một quyền read không quyết định mọi trường được hiển thị: Sales có thể đọc tiến độ TR liên quan nhưng không được xem ghi chú/chứng từ nội bộ; điều này cần xử lý trong nghiệp vụ/DTO.
- Không tạo permission cho UC retired chỉ vì mã cũ còn trong tài liệu. Không xóa lịch sử quyền đã từng được sử dụng.

**Ví dụ:** `stock_relocation:confirm` chỉ cho WAREHOUSE theo phạm vi đã duyệt; ngoài quyền đó, BF03 vẫn kiểm người tạo lệnh, kho và trạng thái trước xác nhận. Quyền không thay các điều kiện nghiệp vụ.

### Các điểm cần xác nhận A03

1. Giữ danh mục quyền hữu hạn; thêm tên, mô tả, nhóm FE và giới hạn role như bảng.
2. Không có quyền ghi đè riêng từng tài khoản; Admin chỉ gán/bỏ quyền có sẵn và phù hợp role.
3. Không có chức năng tạo/chỉnh mọi policy; nếu thay phân quyền một nghiệp vụ phải được duyệt theo nghiệp vụ đó.
4. Duyệt cấu trúc/ràng buộc phiên bản 0.1. **Việc này chưa phải duyệt toàn bộ 98 mã quyền hay ma trận của các nhóm nghiệp vụ chưa trao đổi.**

**Trạng thái:** CHỜ Ý KIẾN. **Phản hồi:** chưa nhận. **Phạm vi được duyệt:** chưa có.

## Ghi chú đối chiếu code cần xử lý sau khi duyệt

Service `src/modules/roles/role.service.js` hiện vẫn tạo bản ghi Permission nếu nhận mã chưa có. Điều này không đáp ứng đề xuất danh mục hữu hạn ở trên. Chưa sửa service trong lượt thiết kế này; sau khi phê duyệt phải thay cơ chế đó bằng kiểm danh mục/role phù hợp, đồng bộ BE/FE và có kiểm tra quyền.

Không lưu mật khẩu SMTP/JWT/Mongo vào ba bảng này. Cơ chế phiên đăng nhập, khôi phục mật khẩu hoặc đăng xuất mọi thiết bị nếu được yêu cầu sẽ có đề xuất dữ liệu riêng và được hỏi trước; không âm thầm thêm vào phạm vi phiếu A01–A03.

Bạn có thể trả lời từng mã A01, A02, A03: đồng ý toàn bộ phiếu 0.1, hoặc liệt kê trường/quy tắc cần đổi. Mình sẽ cập nhật chú thích và nhật ký đúng phạm vi bạn chốt, rồi mới chuyển sang nhóm bảng tiếp theo.
