# Wireframe — PO, đợt nhận và GR

> Wireframe v1 giữ làm tham chiếu bố cục. [Plan v2](design-plan-v2.md) bổ sung tab Hàng chờ & sai lệch, drawer resolution, nhiều GR từ các quyết định khác nhau và task put-away partial; các màn mới cần triển khai theo contract v2 đã review.

Ngày: 03/11/2026 · Bố cục đề xuất, chưa phải UI đã triển khai.

[Kế hoạch](design-plan.md) · [Luồng](user-flow.md). Số/mã/vị trí dưới đây chỉ minh họa. Dùng design tokens và controls hiện có của FE; wireframe không đề xuất đổi design system.

## 1. PO detail — tab Đợt nhận

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Đơn mua hàng / PO-001                                       [Tiếp nhận đợt mới]       │
│ NCC: Nhà cung cấp A     Kho: Kho được giao     PO: Nhận một phần                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [Tổng quan]   [Đợt nhận • đang chọn]   [Hồ sơ]                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Tiến độ theo dòng: Gạch A · đặt100 thùng · đã nhập70 · còn phải nhận30                 │
│ Không dùng một stepper ở cấp PO; mỗi đợt có tiến độ độc lập.                          │
├───────────┬─────────────────┬─────────────────┬───────────────────┬─────────────────┤
│ Hồ sơ kiểm│ Thời điểm đến   │ Kiểm hàng       │ Phiếu nhập        │ Thao tác        │
├───────────┼─────────────────┼─────────────────┼───────────────────┼─────────────────┤
│ KIEM-002  │ 03/11 10:30     │ Nháp            │ Chưa tạo          │ [Tiếp tục kiểm] │
│ KIEM-001  │ 03/11 08:15     │ Đã chốt         │ GR-001 · Đã nhập  │ [Xem đợt nhận]  │
└───────────┴─────────────────┴─────────────────┴───────────────────┴─────────────────┘
```

MVP list lấy header đã có; tổng lượng từng đợt và tiến độ task chỉ thêm khi có dữ liệu. Nếu PO nhiều dòng, tổng quan là bảng theo SKU/UOM. Owner/Accountant không thấy nút tiếp nhận.

## 2. Đợt nhận — Bước 1

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PO-001 / Đợt nhận mới                                [Về PO] [Xem nguồn]             │
│ NCC: Nhà cung cấp A  ·  Kho: Kho được giao  ·  Chưa lưu                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [1 Tiếp nhận] ───── 2 Kiểm hàng & lô ───── 3 Ghi nhận GR ───── 4 Xếp kho             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Thời điểm hàng đến *   [03/11/2026 08:15              ]  Giờ Việt Nam                 │
│ Số phiếu giao          [                             ]  Tùy chọn                    │
│ Người giao             [                             ]  Tùy chọn                    │
│ Thông tin liên hệ      [                             ]  Tùy chọn                    │
│                                                                                     │
│ PO, NCC và kho lấy từ đơn mua, không sửa tại đợt nhận.                                │
│ Lưu nháp chưa ghi nhận hàng vào tồn.                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Chưa lưu                                       [Lưu nháp] [Tiếp tục kiểm hàng →]     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Đợt nhận — Bước 2

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PO-001 / KIEM-001                    NCC: Nhà cung cấp A  ·  Kho được giao            │
│ Đang kiểm hàng                                         [Xem nguồn] [Hồ sơ]          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ 1 Tiếp nhận ───── [2 Kiểm hàng & lô] ───── 3 Ghi nhận GR ───── 4 Xếp kho             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [Kiểm hàng] [Chờ xử lý / Không nhận • 2 phần]                                         │
│ [Tìm SKU / tên trong PO....................]                  [Chọn dòng PO]         │
├─────────────┬──────┬───────┬──────────┬─────────┬──────────┬─────┬──────────┬────────┤
│ Mặt hàng    │ ĐVT  │ Đặt   │ Đã nhập  │ Còn nhận│ Giao đợt │ Nhận│ Chờ      │Không   │
│             │      │       │          │         │ này      │     │          │nhận    │
├─────────────┼──────┼───────┼──────────┼─────────┼──────────┼─────┼──────────┼────────┤
│ v Gạch A    │Thùng │ 100   │ 0        │ 100     │ 80       │ 70  │ 5        │ 5      │
├─────────────┴──────┴───────┴──────────┴─────────┴──────────┴─────┴──────────┴────────┤
│ Các phần lượng thực giao của Gạch A                              [+ Thêm phần]      │
│                                                                                     │
│ Phần1  Lô [LOT-A ▼]  Tone T1 · Calibre C1 · Đã xác minh                             │
│        SL [70] thùng    Chất lượng [Tốt ▼]     Bao bì [Nguyên niêm ▼]                │
│        Hướng nhận [Nhận vào sở hữu ▼]         Giữ tại kho: Có                       │
│        Đang giữ [CUSTODY-01 ▼]                Sau GR [RECEIVING-01 ▼]               │
│                                                                                     │
│ Phần2  Lô [LOT-A ▼]     SL [5] thùng           Chất lượng [Hư hỏng ▼]                │
│        Hướng nhận [Chờ xử lý ▼]               Giữ tại kho: Có                       │
│        Đang giữ [CUSTODY-01 ▼]                Ghi chú* [Chờ thống nhất với NCC]      │
│                                                                                     │
│ Phần3  Lô [LOT-A ▼]     SL [5] thùng           Chất lượng [Tốt ▼]                    │
│        Hướng nhận [Không nhận ▼]              [Đã giao trả ngay ▼]                  │
│        Ghi chú* [Giao không đúng nội dung đã thống nhất.........................]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Thực giao80 = Nhận70 + Chờ5 + Không nhận5, cùng SKU/UOM.                              │
│ Chốt kiểm: giữ hộ NCC75; tạo GR nháp70; tồn sở hữu chưa tăng.                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Đã lưu nội dung kiểm · Đích GR cần xác nhận         [Lưu nháp] [Chốt kiểm hàng]       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Bảng nhóm không lặp số lượng PO trên mọi dòng split để tránh cộng nhầm. Lượng nhập là chuỗi decimal; thông tin quy đổi từ snapshot PO mở ở chi tiết. Không dùng barcode input trong MVP khi chưa xác minh mapping.

Sau save, đọc line IDs mới và cập nhật map đích GR; đích này chưa được API draft persist. Trước confirm phải rà lại đúng tất cả phần ACCEPT đã lưu. “Đã lưu” chỉ áp cho dữ liệu server xác nhận.

Modal chốt kiểm:

```text
┌───────────────────────────────────────────────────────────┐
│ Chốt kết quả kiểm hàng?                                   │
│ Gạch A: nhận70 · chờ5 · không nhận5 thùng.                  │
│ Giữ tại kho75 thuộc NCC; GR nháp70 được tạo.               │
│ Chưa tăng tồn cửa hàng. Lô/lượng/kết quả bị khóa sau chốt. │
│                              [Xem lại] [Chốt kiểm hàng]    │
└───────────────────────────────────────────────────────────┘
```

## 4. Bước 3 — Review GR

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PO-001 / KIEM-001 / GR-001                      GR: Nháp  ·  Kiểm: Đã chốt           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ 1 Tiếp nhận ───── 2 Kiểm hàng & lô ───── [3 Ghi nhận GR] ───── 4 Xếp kho             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Chỉ phần chấp nhận được ghi nhận sở hữu. Kết quả kiểm và dòng GR chỉ đọc.             │
├───────────────┬──────────────────┬───────────────┬──────────┬────────────────────────┤
│ Mặt hàng      │ Lô / Tone / Cal. │ Lượng nhận    │ Chất lượng│ Vị trí sau GR         │
├───────────────┼──────────────────┼───────────────┼──────────┼────────────────────────┤
│ Gạch A        │ LOT-A / T1 / C1  │ 70 thùng      │ Tốt      │ RECEIVING-01           │
├───────────────┴──────────────────┴───────────────┴──────────┴────────────────────────┤
│ Hàng vẫn thuộc NCC sau GR: 5 thùng đang chờ tại CUSTODY-01.                           │
│ 5 thùng không nhận đã giao trả ngay; không ghi tăng rồi giảm tồn giả.                 │
│                                                                                     │
│ Sau ghi nhận: cửa hàng sở hữu70; hàng ở Receiving chờ xếp kho.                        │
│ Nhập kho chưa đồng nghĩa sẵn sàng bán.                                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [Về PO]                                                     [Ghi nhận nhập kho]     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Sau post thành công đổi CTA thành “Xem tiến độ xếp kho” khi có contract/dữ liệu. Trong MVP không có nút tạo task giả. Nếu ACCEPT0, bước3 hiện “Không áp dụng — không có lượng nhận sở hữu”, không render GR trống.

## 5. Bước 4 — thiết kế sau khi có API put-away

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ GR-001 · Đã nhập              [4 Xếp kho]                [Xem phiếu nhập]            │
│ Phần GOOD chờ cất vào Storage; hàng cách ly có khối theo dõi riêng.                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Gạch A · LOT-A · T1 · C1 · GOOD · Chủ sở hữu: Cửa hàng                                │
│ Nguồn RECEIVING-01 · Cần cất70 · Đã cất40 · Chưa cất30 thùng                          │
├──────────────┬────────────┬──────────────┬───────────────┬────────────────────────────┤
│ Nhiệm vụ     │ Vị trí đích│ Kế hoạch    │ Thực cất      │ Còn lại                    │
├──────────────┼────────────┼──────────────┼───────────────┼────────────────────────────┤
│ TO-001       │ A-01       │ 40 thùng    │ 40 thùng      │ 0                          │
│ TO-002       │ A-02       │ 30 thùng    │ [    ] thùng  │ 30                         │
├──────────────┴────────────┴──────────────┴───────────────┴────────────────────────────┤
│ [Tạo nhiệm vụ cho lượng chưa có kế hoạch]       [Xác nhận lượng thực xếp đã nhập]      │
│ Ghi nhận vị trí thực tế; tổng tồn cửa hàng vẫn70, không nhập tăng lần nữa.             │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Giai đoạn hiện tại chưa có số liệu task thì dùng thông báo “Đã nhập kho; chưa có dữ liệu tiến độ xếp kho”. Không tự hiển thị các số ở wireframe này từ local store.

## 6. Màn hình hẹp và tương tác

- Desktop: bảng nhóm chiếm toàn chiều ngang; chi tiết phần lượng mở trong dòng. Header giữ PO/kho, footer giữ CTA; không mở toàn bộ chi tiết của100 dòng cùng lúc.
- Tablet/mobile: dùng card theo SKU, từng phần lượng là card con; header gọn và stepper hiển thị “Bước2/4 · Kiểm hàng & lô”. Tránh ép bảng9 cột vào màn hình hẹp.
- Tab/Enter theo thứ tự field; thêm phần mới giữ focus ở lượng/lô; không ép focus ô tìm khi người dùng đang chỉnh field khác. Lỗi có label và link về dòng, không chỉ đổi màu.
- Chọn “Không nhận” mới hiện lựa chọn giữ kho/trả ngay; quality khác GOOD ở ACCEPT chỉ hiện đích QUARANTINE hợp lệ.
- Chỉ một CTA chính ở footer cho một trạng thái. Sau chốt không có “Lưu nháp” hoặc “Hủy” giả; handling note là thao tác riêng đúng quyền.
- Màu theo tokens sẵn có: xanh trạng thái hoàn tất đúng mốc, vàng chờ/chênh lệch, đỏ cho lỗi/chặn; luôn có nhãn chữ và icon bổ trợ.
