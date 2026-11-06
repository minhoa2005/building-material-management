# H21, F01 và F03 · Bắt đầu một đợt kiểm kê

**Bản trình v0.1 · 01/11/2026 · Chờ duyệt riêng từng bảng.** Đề xuất bám luồng BF-05 và UC-86/87 hiện có. Store Owner lập kế hoạch, Warehouse Staff kiểm tra điều kiện và bắt đầu đếm. Lúc bắt đầu, phần mềm cùng lúc ghi mốc tồn và khóa các ô liên quan. Các bước ghi lần đếm, xử lý chênh lệch và chốt tồn sẽ được trình ở lượt tiếp theo. [BF-05 trong nghiệp vụ BE](../../../../CODE/BE/building-material-management/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) · [Report 3 bản BE](../../../../CODE/BE/building-material-management/git_doc/docs/01_bao_cao/WMSD_Report3_Fix.docx.txt).

**Ví dụ.** Store Owner lên lịch kiểm ô A-01 và A-02 của kho K1 vào sáng mai. Hôm nay kho vẫn hoạt động. Khi Warehouse Staff bấm bắt đầu kiểm, A-01 có 100 viên lô L1 của cửa hàng, A-02 đang trống. Phần mềm ghi mốc 100 viên tại A-01, ghi A-02 thuộc phạm vi và khóa cả hai ô. A-03 vẫn được nhập, xuất nếu đáp ứng điều kiện nghiệp vụ.

| Bảng | Câu hỏi bảng đó trả lời |
|---|---|
| H21 · Đợt kiểm kê | Kiểm kho nào, các ô nào, dự kiến lúc nào, ai được phân công và đang đến bước nào? |
| F01 · Tồn tại lúc bắt đầu | Theo sổ, tại mốc bắt đầu mỗi lô/chủ/trạng thái ở từng ô có bao nhiêu? |
| F03 · Khóa ô kiểm kê | Ô nào đang bị khóa bởi đợt nào, từ khi nào và đã đủ căn cứ mở lại chưa? |

## H21 · stocktakes · Đợt kiểm kê

Đề xuất mỗi đợt thuộc một kho. Store Owner chọn toàn kho, một khu hoặc các ô cụ thể, thời gian dự kiến và Warehouse Staff được phân công. Phạm vi khu/kho được lưu thành danh sách ô cụ thể khi kích hoạt. Nếu chỉ kiểm một số sản phẩm/lô/trạng thái trong ô, ghi rõ bộ lọc và vẫn khóa giao dịch tại cả ô đó trong thời gian kiểm.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `stocktakeNo`, `warehouseId`, `reason`, `plannedAt`, `createdBy`, `createdAt` | Mã đợt, kho, lý do định kỳ hoặc kiểm đột xuất, lịch dự kiến và người lập. |
| `scope` | Cách chọn phạm vi, khu/ô được chọn, bộ lọc sản phẩm/lô/trạng thái nếu áp dụng, danh sách ô đã chốt và phiên bản phạm vi. Ô trống vẫn được giữ trong danh sách. |
| `assignedCounterIds`, `status`, `version` | Nhân viên được phân công trong kho, trạng thái kế hoạch/đang kiểm/đối chiếu/đã chốt và phiên bản. |
| `activatedBy`, `activatedAt`, `cutoffAt`, `closedBy`, `closedAt`, `closureReferenceId` | Người bắt đầu, thời điểm bắt đầu và mốc dữ liệu. Sau khi hoàn tất, lưu người chốt và căn cứ kết thúc. |

Khi còn ở bước lập kế hoạch, thay lịch hoặc phân công theo quyền Store Owner. Trước kích hoạt, Warehouse Staff xử lý xong nhiệm vụ nhập/xuất/chuyển dở dang ảnh hưởng phạm vi, kiểm quyền tại kho và các đợt đang khóa cùng ô. Chỉ chuyển sang đang kiểm khi toàn bộ khóa F03 và mốc F01 được ghi thành công. Khi đã bắt đầu, dùng phạm vi đã chốt để bảo toàn căn cứ so sánh. Nhu cầu mở rộng sang ô khác cần một phạm vi kiểm riêng được lập hợp lệ.

H21 theo dõi tiến độ, các lần đếm và phương án liên quan. Chỉ đóng đợt sau khi mọi phần trong phạm vi có kết quả, chênh lệch và phần hàng bị chặn đã được xử lý theo luồng kiểm kê. Quyền Store Owner duyệt/chốt và cách ghi biến động sẽ được trình ở H25/H22.

## F01 · stocktake_snapshots · Mốc tồn đầu đợt kiểm kê

Đề xuất mỗi bản ghi là một nhóm tồn tại một ô, theo lô, chất lượng và chủ sở hữu của C02. Phần mềm tự tạo khi Warehouse Staff kích hoạt H21. Các số này dùng đối chiếu với số thực đếm.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `stocktakeId`, `scopeVersion`, `cutoffAt`, `capturedAt` | Đợt, phiên bản phạm vi, thời điểm làm mốc và thời điểm ghi. |
| `sourceBalanceId`, `locationId`, `batchId`, `ownerType`, `ownerId`, `qualityStatus` | Nhóm tồn C02 và các thuộc tính được giữ lại tại lúc chụp. Một nhóm tồn chỉ có một dòng gốc trong một đợt. |
| `bookQtyBase`, `baseUnitSnapshot`, `sourceBalanceVersion` | Lượng sổ theo đơn vị gốc, tên đơn vị và phiên bản số dư nguồn. |
| `origin`, `discoveredAt`, `discoveredBy`, `evidenceIds` | Phân biệt dòng chụp lúc bắt đầu và dòng bổ sung khi tìm thấy hàng trong phạm vi mà sổ chưa ghi. Dòng bổ sung giữ người phát hiện, thời gian và bằng chứng. |

Hàng của cửa hàng, của khách và của NCC được ghi thành nhóm riêng. Hàng đang chuyển giữa kho được đối chiếu theo chứng từ chuyển, chỉ hàng thực tại các ô thuộc phạm vi mới nằm trong danh sách đếm vật lý. Các ô nhận hàng, tập kết hoặc cách ly chỉ được kiểm khi đã có trong phạm vi.

Nếu lúc đếm phát hiện một lô ở A-02 nhưng chưa có dòng tồn trong mốc, thêm dòng phát hiện với lượng sổ 0, giữ thời điểm phát hiện riêng. Các dòng chụp ban đầu được giữ nguyên. Nếu chỉ thấy đúng lô đã có nhưng nhiều hơn thì ghi lượng thực đếm trên dòng hiện có, tránh tạo thêm dòng trùng. Số thực đếm và các lần đếm lại nằm ở F02. Một ô trống trong sổ vẫn cần nhân viên xác nhận đã kiểm. Chưa nhập kết quả đếm chưa thể coi là đã đếm được 0. [Số dư C02 đã duyệt](09_Duyet_diem_ton_va_so_du.md).

## F03 · stocktake_location_locks · Khóa giao dịch tại ô đang kiểm

Đề xuất mỗi bản ghi là một lần khóa một ô cho một đợt kiểm kê. Cả ô được khóa để bảo đảm hàng không đổi vị trí, chất lượng, số lượng hoặc chủ trong khi đếm. Các ô ngoài phạm vi tiếp tục hoạt động.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `stocktakeId`, `locationId`, `scopeVersion`, `lockedAt`, `lockedBy` | Ô bị khóa, đợt sở hữu khóa, phiên bản phạm vi và người/thời điểm kích hoạt. |
| `status`, `version` | Đang khóa hoặc đã mở. Một ô chỉ có một khóa kiểm kê đang hiệu lực. Lưu các lần khóa cũ để truy vết. |
| `releasedAt`, `releasedBy`, `closureReferenceId` | Thời điểm, người chốt và căn cứ kiểm kê cho phép mở lại ô. |

Khóa được kiểm cùng các thao tác xác nhận nhập, xuất, chuyển, đổi chất lượng/chủ và sửa sai chạm tới ô. Nếu nhập hàng và kích hoạt kiểm kê cùng lúc, phải có thứ tự xác định. Giao dịch nhập đã thành công trước mốc thì xuất hiện trong F01; khóa đã có trước thì thao tác nhập phải chờ xử lý hợp lệ. Khóa, mốc tồn và trạng thái đang kiểm phải cùng được lưu thành công, tránh một phần ô đã khóa nhưng danh sách mốc chưa đủ.

Trong lúc khóa vẫn được ghi kết quả đếm và hồ sơ nghi lỗi E06 để chặn sử dụng. Chỉ luồng chốt kiểm kê đúng quyền và căn cứ mới được ghi các điều chỉnh trong phạm vi. Mở lại ô cùng lúc hoàn tất chốt hợp lệ. Nếu chốt thất bại, giữ khóa để tiếp tục xử lý; khi gửi lại thao tác, kiểm kết quả đã lưu trước. [E06 và H26 đã duyệt](27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech.md).

Ba bảng này chỉ chốt cách lập và kích hoạt phạm vi. F02 sẽ giữ lịch sử từng lần đếm, H25 giữ phương án và quyết định, H22 giữ điều chỉnh số lượng. [Khảo sát DB hiện tại](03_Cau_truc_DB_hien_tai.md) · [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).

