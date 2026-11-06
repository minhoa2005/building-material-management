# B08C · delivery_teams · Đội vận chuyển nội bộ

**Phiếu v0.3 · Chờ duyệt cấu trúc.** Người dùng xác nhận shop tự vận chuyển và “Có danh mục đội nội bộ để chọn lại”. Một bản ghi là một đội của shop có thể nhận nhiều chuyến. Khi bàn giao phải lưu các thông tin dưới đây trên chính chuyến đó. [Phiếu v0.1](history/08C_Don_vi_van_chuyen_v0.1_de_xuat.md) · [Phiếu v0.2](history/08C_Don_vi_van_chuyen_v0.2_de_xuat.md).

## Dữ liệu phải giữ trên mỗi chuyến

| Dữ liệu | Ý nghĩa tại thời điểm xác nhận bàn giao |
|---|---|
| Tên đơn vị vận chuyển lúc giao | Ghi tên shop hoặc đội nội bộ đã thực hiện chuyến. Lưu bản chụp tên trên chứng từ để xem lại sau khi đổi tên |
| Người/lái xe thực nhận | Ghi tên người nhận hàng từ kho theo đúng chuyến |
| Thời điểm bàn giao | Ghi thời điểm bàn giao thực tế cho người nhận |
| Số lượng thực bàn giao | Ghi theo từng dòng hàng cùng đơn vị tính và lô khi áp dụng. Một chuyến có thể giao nhiều sản phẩm |
| Bằng chứng | Giữ tham chiếu tới ảnh hoặc biên bản của chính lần bàn giao |

Theo UC-58, Warehouse Staff ghi nhận bàn giao tại kho mình phụ trách. Giao hàng cho lái xe là một mốc riêng với xác nhận khách đã nhận hàng. Bản ghi bàn giao nằm trong nhóm chứng từ giao/xuất. Các trường trên không đòi hỏi người lái xe phải có tài khoản đăng nhập.

## Cấu trúc bảng đội nội bộ

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID đội để các lần bàn giao tham chiếu |
| `code` | Chuỗi, bắt buộc | Mã đội duy nhất trong shop, đề xuất cố định sau khi tạo |
| `name` | Chuỗi, bắt buộc | Tên đội để nhân viên chọn khi giao |
| `isActive` | Đúng/sai, mặc định true | Đội còn được chọn cho chuyến mới |
| `version`, `createdAt`, `updatedAt` | Số nguyên và ngày giờ | Phiên bản và thời điểm thay đổi hồ sơ đội |

**Quan hệ.** Một đội nhận nhiều lần bàn giao, mỗi lần bàn giao qua một đội ghi `deliveryTeamId` cùng tên đơn vị lúc giao. Nếu nhiều đội tham gia thì ghi từng lần bàn giao thực tế với đội và lượng tương ứng. Khi đổi tên hoặc ngừng đội, chứng từ cũ vẫn đọc được tên đã ghi.

**Quyền trình duyệt.** Đề xuất Store Owner tạo, sửa, ngừng hoặc kích hoạt lại đội. Warehouse Staff chọn đội đang hoạt động và ghi thông tin chuyến trong phạm vi kho được giao. Administrator có thể cấp quyền qua vai trò theo A02/A03. Danh sách đội tách biệt với danh sách tài khoản. Tên lái xe thực nhận nằm trên từng chuyến vì một đội có thể thay lái xe.

**Ví dụ.** Chuyến sáng của shop do anh A nhận 10 thùng, chuyến chiều do anh B nhận 6 thùng. Có hai lần bàn giao riêng với hai thời điểm và hai bộ bằng chứng, ngay cả khi tên đơn vị thực hiện là một.

**Trạng thái.** Đã chốt cần danh mục đội nội bộ và dữ liệu từng chuyến. Tên bảng, trường, quan hệ và quyền mặc định đang trình duyệt theo v0.3. Các tham chiếu `carrierId` cũ sẽ được đối chiếu với từng chứng từ khi chuyển dữ liệu. [Tổng hợp nhóm B08](07_Duyet_nguong_ton_va_doi_tac.md) · [Report 3, UC-58](../../01_bao_cao/WMSD_Report3_Fix.docx.txt)
