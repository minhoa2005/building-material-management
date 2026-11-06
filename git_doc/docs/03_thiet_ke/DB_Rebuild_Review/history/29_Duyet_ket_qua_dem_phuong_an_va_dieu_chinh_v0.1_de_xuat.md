# F02, H25 và H22 · Đếm, xử lý chênh lệch và chốt kiểm kê

**Bản trình v0.1 · 01/11/2026 · Chờ duyệt riêng từng bảng.** H21, F01 và F03 đã duyệt cách bắt đầu, ghi mốc tồn và khóa ô. Ba mục này đề xuất cách giữ kết quả đếm, xét phương án xử lý và ghi số lượng cuối cùng. Chưa áp dụng vào DB hoặc code.

Căn cứ: [BF-05 và UC-87/88/91/92/93 trong bản BE](../../../../CODE/BE/building-material-management/context.md), [H21/F01/F03 đã duyệt](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md), [C03/C04 về giao dịch và lịch sử tồn](10_Duyet_giao_dich_va_lich_su_ton.md). Các role dưới đây là quyền mặc định; role do Admin tạo vẫn theo quyền được cấp và phạm vi kho như A02/A03 đã chốt.

| Mục | Lưu thông tin gì? | Người thực hiện mặc định |
|---|---|---|
| F02 · Kết quả đếm | Mỗi lần đếm/đếm lại, số lượng thực tế, người đếm và bằng chứng | Warehouse Staff được phân công |
| H25 · Phương án xử lý | Chọn kết quả làm căn cứ, giải thích lệch, đề xuất hành động, quyết định và việc thực hiện | Warehouse Staff đề xuất/thực hiện; Store Owner duyệt/chốt |
| H22 · Phiếu điều chỉnh lượng | Lượng tăng hoặc giảm đã được duyệt và thực ghi vào sổ tồn | Sinh khi Store Owner xác nhận chốt hợp lệ |

## F02 · stocktake_counts · Các lần đếm kiểm kê

Mỗi bản ghi giữ một lần đếm một dòng mốc F01. Lần đếm lại có số thứ tự mới, không sửa đè lần trước. Nếu ô không có dòng hàng nào trong phạm vi kiểm, nhân viên vẫn ghi xác nhận đã kiểm phần phạm vi đó và không tìm thấy hàng; để trống chưa được coi là đếm được 0.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `stocktakeId`, `scopeVersion`, `locationId` | Đợt, phiên bản phạm vi và ô đã kiểm. |
| `targetType`, `snapshotId` | Đếm dòng tồn hoặc xác nhận phạm vi trống tại ô. Đếm dòng phải có F01; xác nhận trống không tạo một lô giả. |
| `attemptNo`, `previousCountId`, `recountReason` | Thứ tự đếm cho cùng đối tượng, lần trước và lý do đếm lại. |
| `quantityEntries[]`, `countedQtyBase`, `baseUnitSnapshot` | Các lượng nguyên kiện/hàng lẻ, đơn vị nhập và hệ số ngay trên dòng; tổng theo đơn vị gốc. Ví dụ 2 thùng × 4 viên + 1 viên = 9 viên. |
| `conditionNote`, `evidenceIds`, `countedBy`, `countedAt`, `recordedAt` | Tình trạng quan sát, bằng chứng, người/thời điểm đếm và lúc lưu. |

Chỉ lưu kết quả hợp lệ khi nhân viên đã nhập lượng, kể cả 0; số lượng không âm. Mỗi phần hàng chỉ được đếm một lần trong tập kết quả được chọn. Nếu sổ ghi 50 viên đạt nhưng thực tế có 48 đạt và 2 vỡ, ghi 48 trên dòng đạt và 2 trên dòng chất lượng lỗi có số sổ 0 bổ sung theo F01. Cả hai vẫn là cùng sản phẩm/lô/chủ; đối chiếu phải nhận ra tổng vẫn đủ 50.

Warehouse Staff đối chiếu và chọn lần đếm có căn cứ, ghi lý do nếu thay kết quả đã chọn. Phương án H25 lưu chính xác các ID kết quả được dùng. Khi không có chênh lệch, căn cứ chốt H21 cũng giữ các ID này. Nếu phát sinh lần đếm mới sau khi trình/duyệt, phải đối chiếu lại và xác nhận tập kết quả hiệu lực; căn cứ thay đổi thì cần duyệt lại phương án. Không cộng các lần đếm với nhau. Chỉ đếm lại khi cần xác minh hoặc nhân viên chọn thực hiện, không bắt buộc mọi chênh lệch đều phải đếm hai lần.

Ghi F02 chưa đổi số dư C02 và chưa mở khóa F03. Nếu chỉ kiểm một lô trong ô, xác nhận trống chỉ nói về phạm vi đã chọn, không khẳng định cả ô trống.

## H25 · stocktake_resolution_plans · Phương án xử lý kiểm kê

Warehouse Staff lập phương án từ mốc F01, kết quả F02 đã đối chiếu và bằng chứng. Đề xuất lưu mỗi phiên bản thành một bản ghi để giữ cả nội dung từng lần trình. Store Owner khác người đề xuất duyệt đúng phiên bản. Duyệt xong chưa ghi tồn; kho ghi kết quả thực hiện rồi Store Owner chốt.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `planNo`, `stocktakeId`, `revision`, `previousPlanId`, `status` | Mã phương án, đợt kiểm, phiên bản, bản trước và trạng thái. |
| `selectedCounts[]`, `scopeVersion`, `reason`, `evidenceIds`, `proposedBy`, `proposedAt` | Dòng mốc/lần đếm đã chọn, căn cứ giải thích và người trình. |
| `items[]` | Mỗi dòng có ID, loại xử lý, nhóm tồn nguồn/đích, lượng, mốc/lần đếm liên quan, hồ sơ chặn hàng và bằng chứng. |
| `reviewDecisions[]` | Người/thời điểm duyệt, trả sửa hoặc từ chối, lý do và phiên bản/dòng/lượng được duyệt. Giữ lịch sử quyết định. |
| `executionRecords[]` | Dòng đã thực hiện, lượng, người/thời điểm và bằng chứng của Warehouse Staff; căn cứ hoàn tất việc kiểm tra hoặc di chuyển thực tế. |
| `postedTransactionId`, `closedBy`, `closedAt` | Giao dịch tồn C03 và người/thời điểm chốt thành công. |

Ba loại dòng xử lý được tách rõ: **điều chỉnh lượng** khi thực thiếu/thừa; **đổi chất lượng** khi tổng lượng không đổi; **chuyển vị trí** khi đổi ô và tổng lượng không đổi. Không tự đổi lô hoặc chủ hàng để làm số liệu khớp. Có thể giải quyết chặn hàng theo kết quả kiểm, nhưng chỉ giải phóng đúng phần đủ căn cứ.

Khi phương án bị trả sửa, kho lập bản mới và gửi duyệt lại. Nếu đổi hành động, lượng hoặc kết quả đếm làm căn cứ sau duyệt, quyết định cũ không còn dùng để chốt bản mới. Mỗi phần hàng chỉ được thực hiện và ghi tồn một lần. Phiếu đổi chất lượng/di chuyển liên quan phải cùng căn cứ chốt, không được ghi tồn riêng rồi ghi thêm ở kiểm kê.

Lúc chốt phải kiểm đủ kết quả trong phạm vi, đúng phê duyệt và bằng chứng thực hiện, số dư không âm, lượng giữ C05 hợp lệ, chồng hàng C07/C08 khớp và đáp ứng điều kiện vị trí. Nếu có vướng mắc thì giữ khóa để xử lý. Số dư, lịch sử, kết quả xử lý, đóng đợt và mở khóa phải cùng thành công; gửi lại cùng thao tác không tạo giao dịch thứ hai. Chặn nghi lỗi chỉ được giải phóng hoặc chuyển sang quản lý hàng lỗi theo đúng kết quả, không tự bỏ tất cả chặn khi đóng đợt.

Nếu lượng, chất lượng và vị trí đều khớp, mọi phạm vi đã kiểm và không còn việc/chặn chưa xử lý, Store Owner chốt theo các kết quả đếm. Nhánh này không cần tạo phương án giả hoặc phiếu điều chỉnh 0.

## H22 · stock_adjustments · Phiếu điều chỉnh số lượng

Đề xuất tự tạo phiếu từ các dòng điều chỉnh lượng khác 0 của H25 khi Store Owner chốt. Một lần chốt có tối đa một phiếu H22, gồm các dòng tăng/giảm thực tế. Warehouse Staff không sửa trực tiếp tồn; người duyệt cũng không nhập một con số tùy ý thay cho phương án đã duyệt.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `adjustmentNo`, `stocktakeId`, `resolutionPlanId`, `warehouseId` | Mã phiếu, đợt, phiên bản phương án và kho. |
| `items[].id`, `items[].planItemId`, `items[].snapshotIds`, `items[].countIds` | Dòng điều chỉnh và mốc/lần đếm dùng giải thích phần chênh lệch. |
| `items[].stockBalanceId`, `items[].locationId`, `items[].batchId`, `items[].qualityStatus`, `items[].ownerType`, `items[].ownerId` | Nhóm tồn cụ thể chịu điều chỉnh, gồm cả chủ hàng. |
| `items[].quantityDeltaBase`, `items[].baseUnitSnapshot`, `items[].beforeQty`, `items[].afterQty`, `items[].reason` | Lượng có dấu tăng/giảm, đơn vị gốc, số trước/sau tại lần ghi và lý do. Mỗi dòng có lượng khác 0. |
| `transactionId`, `postedBy`, `postedAt`, `status` | Giao dịch C03/C04, người chốt, thời gian và trạng thái đã ghi. |

H22 là chứng từ làm căn cứ cho C03/C04 cập nhật C02, không phải một lần cộng/trừ bổ sung. Các dòng đổi chất lượng/chuyển vị trí cùng phương án được ghi trong cùng lần chốt nhưng không biến thành điều chỉnh thiếu/thừa. Phiếu đã ghi giữ nguyên; sửa sai sau chốt cần nghiệp vụ có chứng từ riêng, phần đảo giao dịch H35 sẽ được duyệt sau.

| Sổ trước kiểm | Thực đếm cùng lô và chủ hàng | Phương án và tác động |
|---|---|---|
| 50 viên đạt | 48 đạt + 2 vỡ | Đổi chất lượng 2; tổng 50; không tạo H22. |
| 50 viên đạt | 46 đạt + 2 vỡ | H22 giảm 2 do thiếu thực và đổi chất lượng 2; tổng cuối 48. |
| A-01 có 50; A-02 có 0 | A-01 có 48; A-02 có 2, cả hai thuộc phạm vi | Chuyển vị trí 2 khi đã xác minh nguồn; tổng 50; không tạo hai dòng thiếu/thừa giả. |
| 50 viên đạt | 52 viên đạt, đã xác minh lô và chủ | H22 tăng 2 theo phương án được duyệt; tổng cuối 52. |

Ba mục F02, H25, H22 đang **CHỜ DUYỆT**. Sau khi duyệt mới dùng để tổng hợp cấu trúc DB. [Danh mục và tiến độ](01_Danh_muc_duyet.md) · [Nhật ký duyệt](04_Nhat_ky_duyet.md).
