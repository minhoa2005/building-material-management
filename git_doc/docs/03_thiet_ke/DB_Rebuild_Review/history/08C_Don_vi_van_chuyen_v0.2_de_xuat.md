# B08C · Shop tự vận chuyển và bàn giao theo chuyến

**Phiếu v0.2 · Shop tự vận chuyển.** Đã xác nhận giữ thông tin bàn giao thực tế từng chuyến. Lần trước cửa hàng yêu cầu có danh mục để chọn lại. Điểm còn mở là cần chọn giữa nhiều đội/đơn vị **nội bộ** hay shop luôn giao dưới cùng một tên. [Phiếu v0.1 đã trình trước khi làm rõ](history/08C_Don_vi_van_chuyen_v0.1_de_xuat.md).

## Dữ liệu phải giữ trên mỗi chuyến

| Dữ liệu | Ý nghĩa tại thời điểm xác nhận bàn giao |
|---|---|
| Tên đơn vị vận chuyển lúc giao | Ghi tên shop hoặc đội nội bộ đã thực hiện chuyến. Lưu bản chụp tên trên chứng từ để xem lại sau khi đổi tên |
| Người/lái xe thực nhận | Ghi tên người nhận hàng từ kho theo đúng chuyến |
| Thời điểm bàn giao | Ghi thời điểm bàn giao thực tế cho người nhận |
| Số lượng thực bàn giao | Ghi theo từng dòng hàng cùng đơn vị tính và lô khi áp dụng. Một chuyến có thể giao nhiều sản phẩm |
| Bằng chứng | Giữ tham chiếu tới ảnh hoặc biên bản của chính lần bàn giao |

Theo UC-58, Warehouse Staff ghi nhận bàn giao tại kho mình phụ trách. Giao hàng cho lái xe là một mốc riêng với xác nhận khách đã nhận hàng. Bản ghi bàn giao nằm trong nhóm chứng từ giao/xuất. Các trường trên không đòi hỏi người lái xe phải có tài khoản đăng nhập.

## Hai cách lưu đơn vị của shop

- **Có nhiều tên đội hoặc đơn vị nội bộ để chọn lại.** Đề xuất danh mục `delivery_teams` có ID, mã cố định duy nhất, tên, trạng thái, phiên bản và thời gian tạo/sửa. Trên chuyến lưu cả ID đội và tên đội tại lúc giao. Đề xuất Store Owner quản lý danh mục và Warehouse Staff chọn đội khi giao. Trường và quyền của bảng này sẽ được duyệt riêng nếu cần.
- **Cả shop dùng một tên.** Đề xuất lấy tên của shop để điền vào từng chứng từ rồi lưu nguyên tên tại lúc bàn giao. Khi đó có thể đáp ứng việc tự vận chuyển bằng thông tin chuyến mà không cần bảng đội vận chuyển riêng. Một shop vẫn có thể có nhiều lái xe.

**Ví dụ.** Chuyến sáng của shop do anh A nhận 10 thùng, chuyến chiều do anh B nhận 6 thùng. Có hai lần bàn giao riêng với hai thời điểm và hai bộ bằng chứng, ngay cả khi tên đơn vị thực hiện là một.

**Trạng thái.** Đã chốt dữ liệu thực tế từng chuyến. Bảng danh mục và quyền quản lý vẫn đang chờ chọn phương án. Việc chuyển các tham chiếu `carrierId` cũ sẽ được đối chiếu với từng chứng từ để giữ lịch sử. [Tổng hợp nhóm B08](07_Duyet_nguong_ton_va_doi_tac.md) · [Report 3, UC-58](../../01_bao_cao/WMSD_Report3_Fix.docx.txt)
