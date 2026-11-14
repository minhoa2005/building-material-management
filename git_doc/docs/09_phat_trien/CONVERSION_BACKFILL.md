# Backfill cấu hình Conversion

Chạy từ checkout BE trên đúng MongoDB replica set. Trước khi chuyển sang BE mới, tạm dừng các tiến trình ghi sản phẩm, lô, UOM và hệ số. Đặt `MONGODB_URI` trỏ rõ tên DB rồi chạy:

```powershell
node scripts/backfill-conversions.mjs --dry-run <database>
node scripts/backfill-conversions.mjs --apply <database>
node scripts/backfill-conversions.mjs --dry-run <database>
```

Kiểm tra danh sách cần đối chiếu ở lần dry-run đầu. Lần apply tạo unique index rồi ghi dữ liệu trong transaction. Lần dry-run sau phải có `pending: 0`. Điền các hệ số được xác minh còn thiếu trước khi mở các luồng dùng đơn vị đó.

- Backfill hệ số thùng từ lô đã xác minh và nhận diện các mã thùng cũ trong UOM. Lô có mã dạng `QC-<số>V` được báo để xác minh vì luồng cũ có thể đã tạo lô giả.
- Backfill diện tích (14/11/2026): nhận diện đơn vị diện tích bằng `uoms.areaMm2`, không còn danh sách mã cứng. Riêng lần `--apply`, UOM mã `M2`/`M²` chưa có `areaMm2` được gán `1000000` (dry-run cũng tính như vậy trong bộ nhớ). Hệ số = `areaMm2 / (lengthMm × widthMm)` làm tròn 12 chữ số `ROUND_HALF_UP`, nên 600×600 ra `2.777777777778` thay vì bị bỏ qua (`AREA_FACTOR_NOT_EXACT` đã bỏ). Điều kiện sản phẩm giống `areaFactor`: đơn vị gốc không phải thùng hay đơn vị diện tích (thay danh sách `pieceCodes` cứng để cùng một quy tắc với `createProduct`). Sản phẩm thiếu kích thước báo `AREA_FACTOR_NO_SIZE`; hệ số ngoài giới hạn báo `AREA_FACTOR_NOT_VALID`.
- Cấu hình cũ đọc từ `OperationRecord` thuộc sản phẩm. Nếu cùng phạm vi có nhiều hệ số khác nhau, báo để xác minh. Nếu chỉ có một hệ số, dùng thời điểm hoàn tất thao tác vì nhật ký cũ không lưu ngày hiệu lực gốc và báo lại lựa chọn này. Bản ghi đã tồn tại được giữ nguyên.
- Chỉ ghi `conversions`, cờ `Uom.isCarton` và `Uom.areaMm2` của M2/M². Chứng từ, tồn và ledger giữ nguyên. Seed sạch sinh cùng cấu hình nền từ dữ liệu mẫu.
