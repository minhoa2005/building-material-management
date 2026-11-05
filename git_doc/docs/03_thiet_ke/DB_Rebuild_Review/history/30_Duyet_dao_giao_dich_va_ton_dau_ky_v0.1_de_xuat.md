# H35 và H36 · Sửa lần ghi tồn sai và thiết lập tồn ban đầu

**Bản trình v0.1 · 01/11/2026 · Chờ duyệt riêng H35 và H36.** Hai mục này có trong danh mục từ đầu nhưng chưa chốt trường và quyền. Đây là đề xuất thiết kế; việc chuyển dữ liệu hoặc khởi tạo DB thực sẽ được quyết định riêng.

Căn cứ: [C03/C04 đã duyệt](10_Duyet_giao_dich_va_lich_su_ton.md) yêu cầu giữ giao dịch cũ và dùng chứng từ sửa sai; [số dư C02](09_Duyet_diem_ton_va_so_du.md) chỉ thay đổi qua nghiệp vụ; [F03](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md) khóa giao dịch tại ô đang kiểm. Bản hiện trạng có loại `REVERSAL` và `OPENING`, nhưng chưa có trường chi tiết riêng cho hai loại trong [snapshot cấu trúc cũ](03_Cau_truc_DB_hien_tai.md). Vì vậy quyền và giới hạn dưới đây là **đề xuất cần duyệt**, không suy ra rằng chức năng đã được triển khai.

| Mục | Câu hỏi bảng trả lời | Ví dụ |
|---|---|---|
| H35 · Phiếu đảo giao dịch | Lần ghi tồn nào bị sai, ai cho sửa và đã ghi bù ngược bằng giao dịch nào? | Nhận thực tế 18 viên nhưng nhập nhầm phiếu 20; giữ phiếu cũ, đảo lần ghi 20 rồi lập phiếu đúng 18. |
| H36 · Phiếu tồn đầu kỳ | Khi bắt đầu dùng dữ liệu mới, mỗi ô/lô/chủ/trạng thái có bao nhiêu, ai xác minh? | Lúc bắt đầu, A-01 có 100 viên của shop và 3 viên giữ hộ khách; ghi thành hai nhóm riêng. |

## H35 · stock_reversals · Phiếu đảo giao dịch tồn

Đề xuất mỗi phiếu đảo **toàn bộ một giao dịch C03 đã ghi sai**, gồm tất cả các dòng C04 của lần đó. Đảo là ghi một giao dịch mới có tác động ngược, giữ nguyên lần gốc và lý do sửa. Không dùng H35 để ghi việc khách trả hàng, trả NCC hay hủy hàng thực tế; các việc đó đã có chứng từ nghiệp vụ riêng.

| Trường đề xuất | Ý nghĩa và yêu cầu |
|---|---|
| `_id`, `reversalNo`, `status`, `version` | ID, mã phiếu tự sinh không tái cấp; nháp/chờ duyệt/đã duyệt/từ chối/đã ghi/hủy trước ghi; phiên bản chống sửa đồng thời. |
| `originalTransactionId` | Một C03 gốc, bắt buộc. Không được có hai lần đảo đã ghi cho cùng một giao dịch. |
| `sourceDocument`, `sourceVersion`, `warehouseIds` | Loại/ID chứng từ gốc, phiên bản và các kho bị ảnh hưởng, lấy từ giao dịch để kiểm quyền. |
| `items[]` | ID dòng đảo, ID dòng C04 gốc, nhóm tồn nguồn/đích, lượng gốc và đơn vị. Phần mềm lấy đúng các dòng gốc, không cho nhập lượng đảo tùy ý. |
| `reason`, `evidenceIds`, `requestedBy`, `requestedAt` | Lý do ghi nhầm, căn cứ và người đề nghị. |
| `approvalDecision` | Người, thời điểm, kết quả, lý do và đúng phiên bản được xét; liên kết lịch sử D05 khi thiết kế D05 được chốt. |
| `reversalTransactionId`, `postedBy`, `postedAt` | C03 mới, người và thời điểm thực ghi đảo. C03 mới cũng trỏ về C03 gốc. |
| `replacementDocument` | Liên kết chứng từ sửa đúng nếu đã lập; không bắt buộc phải có ngay khi đề nghị đảo. |

**Quyền đề xuất.** Người có quyền thực hiện nghiệp vụ gốc và quyền đề nghị sửa sai tại các kho liên quan được lập yêu cầu. Store Owner khác người đề nghị duyệt và xác nhận ghi đảo. Administrator chỉ cấp quyền, không mặc nhiên được sửa tồn. Các role mới vẫn theo quyền được cấp và điều kiện tách người đề nghị/người duyệt.

**Điều kiện trước khi ghi.** Giao dịch gốc đã ghi thành công, chưa bị đảo; chứng từ và các nhóm tồn chưa phát sinh việc phụ thuộc khiến đảo không còn đúng. Phải kiểm lại số dư, lô, chủ, chất lượng, vị trí, giữ hàng, chồng hàng và sức chứa theo thực tế. Không được làm âm tồn hoặc đi qua ô đang khóa kiểm kê. Việc kiểm căn cứ và ghi đảo dùng cùng lần xử lý để không có phiếu mới chen vào sau kiểm tra.

Nếu hàng đã được xuất/nhận tiếp, giao cho khách, tính hóa đơn hoặc đã nằm trong một lần chốt kiểm kê sau đó, chặn đảo trực tiếp và chỉ rõ chứng từ phụ thuộc. Không tự đảo cả chuỗi để vượt điều kiện. Bản v0.1 không đề xuất đảo một phần giao dịch hoặc đảo tiếp một giao dịch đảo; nếu cần sửa kết quả tiếp thì phải có chứng từ sửa đúng được kiểm theo nghiệp vụ.

Khi đủ điều kiện, H35 cùng C03/C04 ghi tác động ngược và cập nhật trạng thái/tiến độ nguồn, lượng giữ hoặc hạn mức liên quan trong cùng một lần thành công. Dòng C04 mới giữ số dư trước/sau thực tế. Lần gốc vẫn nguyên vẹn; trạng thái hiệu lực được xác định qua liên kết đảo. Gửi lại cùng yêu cầu trả kết quả đã có, không đảo hai lần. Đề nghị hoặc duyệt chưa làm đổi tồn.

**Ví dụ.** Phiếu nhập ghi nhầm 20 trong khi thực nhận 18, chưa có nghiệp vụ sau sử dụng lượng này. Sau khi xác minh, giao dịch đảo giảm phần đã ghi 20; phiếu sửa đúng ghi lại 18 theo kết quả kiểm nhận và hạn mức PO. Sổ giữ đầy đủ `+20`, `−20`, `+18`, tổng đúng 18. Phương án này sửa thông tin ghi nhận; không có việc giả định hàng thực tế đã được chở ra rồi chở vào kho. Nếu 5 viên đã được xuất bán từ nguồn đó thì không áp dụng đảo trực tiếp ví dụ này.

## H36 · opening_stocks · Phiếu tồn đầu kỳ

Đề xuất mỗi kho có một phiếu tồn đầu kỳ được ghi thành công cho lần khởi tạo dữ liệu, theo một mốc thời gian đã thống nhất. Warehouse Staff lập danh sách từ kiểm đếm/bàn giao đã đối chiếu; Store Owner khác người lập xác minh và xác nhận ghi. Cả các ô trống cũng nằm trong danh sách đã kiểm, nhưng không tạo dòng hàng số lượng 0 chỉ để đánh dấu ô.

| Trường đề xuất | Ý nghĩa và yêu cầu |
|---|---|
| `_id`, `openingNo`, `warehouseId`, `status`, `version` | Mã phiếu, kho, trạng thái chuẩn bị/chờ duyệt/đã ghi/trả sửa/hủy trước ghi và phiên bản. |
| `cutoverKey`, `openingAt`, `coveredLocationIds` | Mã đợt khởi tạo dữ liệu dùng thống nhất, mốc tồn ban đầu và các ô đã đối chiếu. Không dùng đổi mã đợt để cộng tồn đầu kỳ lần nữa trên dữ liệu kho đã khởi tạo. |
| `sourceDescription`, `evidenceIds`, `preparedBy`, `preparedAt` | Nguồn số liệu đã đối chiếu, biên bản/danh sách đính kèm và người/thời điểm lập. |
| `items[].id`, `items[].locationId`, `items[].productId`, `items[].batchId` | Dòng hàng, ô, sản phẩm theo SKU/hãng và lô. Danh mục phải tồn tại và thuộc đúng kho. |
| `items[].ownerType`, `items[].ownerId`, `items[].qualityStatus` | Hàng của shop/khách/NCC và đạt/chờ kiểm/lỗi/tạm chặn. Hàng giữ hộ không trở thành hàng của shop. |
| `items[].quantityEntries`, `items[].quantityBase`, `items[].baseUnitSnapshot` | Lượng theo đơn vị nhập và hệ số trực tiếp trên dòng, tổng quy về đơn vị gốc; lượng của dòng lớn hơn 0. |
| `items[].placementDetails`, `items[].custodySourceRef` | Kích thước/chồng/kiện cần để tạo C07/C08; căn cứ giữ hộ khi chủ là khách hoặc NCC. |
| `verifiedBy`, `verifiedAt`, `verifiedVersion`, `verificationNote` | Người, thời điểm, phiên bản đã xác minh và ghi chú. Người xác minh khác người lập. |
| `transactionId`, `postedBy`, `postedAt` | Lần C03 ghi tồn đầu kỳ và người/thời điểm xác nhận. |

**Ghi tồn lần đầu.** Phần mềm tạo C02 theo từng ô/lô/chủ/chất lượng, tạo C03/C04 loại tồn đầu kỳ và dữ liệu chồng hàng tương ứng trong cùng lần ghi. Hàng giữ hộ chiếm chỗ nhưng không được xuất bán; căn cứ giữ hộ và lượng còn phải trả cần đối chiếu với H33/H34. Không đồng thời xác nhận nhập giữ hộ H33 cho cùng lượng đã được H36 ghi. Kế hoạch chuyển đổi phải chọn một nguồn ghi số dư ban đầu và giữ liên kết nghĩa vụ, tránh cộng tồn hai lần. Hàng chưa xác minh đủ lô/chủ/quy cách không được tự coi là hàng đạt của shop để hoàn tất phiếu.

Chỉ cho ghi khi kho chưa có dữ liệu tồn/nghiệp vụ đã ghi xung đột với việc khởi tạo và không có phạm vi kiểm kê đang khóa. Cùng kho/đợt chỉ ghi một lần; yêu cầu gửi lại không cộng thêm. Kiểm sức chứa và các liên kết danh mục trước khi ghi. Kho trống hoàn toàn có xác nhận khởi tạo không có hàng; không tạo C03/C04 số lượng 0, và cũng không mở lại quyền ghi thêm một phiếu tồn đầu kỳ sau đó.

**Ranh giới chuyển dữ liệu.** H36 lưu hàng đang thực nằm tại các ô ở mốc bắt đầu. Hàng đang chuyển, đơn còn thực hiện, lượng đã giữ và nghĩa vụ giữ hộ phải được đối chiếu cùng các hồ sơ nguồn trong kế hoạch chuyển đổi riêng. Không bỏ chúng chỉ vì không có trên phiếu này. Nếu mang toàn bộ lịch sử giao dịch sang DB mới thì không cộng thêm tồn đầu kỳ cho chính lượng mà lịch sử đã tạo; chọn cách khởi tạo rõ ràng trước khi chuyển dữ liệu.

Sau khi đã có nghiệp vụ tiếp theo, không sửa phiếu H36 hoặc lập thêm phiếu đầu kỳ để bù thiếu/thừa. Chênh lệch thực tế đi theo kiểm kê; ghi nhầm đi theo chứng từ sửa sai đủ điều kiện. Việc duyệt cấu trúc H36 chưa chọn ngày vận hành, chưa quyết định dùng dữ liệu thật hay thử nghiệm và không cho phép xóa DB hiện tại.

## Mục còn mở được nhắc lại cùng lượt

**H01 · Yêu cầu bổ sung** vẫn chờ duyệt sau khi người dùng yêu cầu giải thích. [Phiếu H01 v0.1 đã có trường và ví dụ](13_Duyet_yeu_cau_bo_sung_va_don_mua.md) giữ thiết kế một kho, các dòng sản phẩm và lượng đề nghị/được duyệt; Sales Staff hoặc Warehouse Staff lập, Store Owner khác người lập duyệt, Accountant tạo tối đa một PO. Ví dụ đề nghị 20 thùng, được duyệt 15 thì PO chỉ được đặt trong 15; lúc duyệt chưa tăng tồn. Lượt này hỏi lại phần chưa chốt, không coi H02 đã duyệt là đồng ý H01.

H35 và H36 đang **CHỜ DUYỆT v0.1**; H01 vẫn **CHỜ DUYỆT v0.1 sau giải thích**. [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký duyệt](04_Nhat_ky_duyet.md).
