# Đặc tả chức năng Kho 3D — Phiên bản 1

- Ngày lập: 12/11/2026.
- Nguồn: trao đổi trực tiếp và các lựa chọn của người dùng trong phiên làm việc ngày 12/11/2026.
- Mục đích: đặc tả công cụ thiết kế mặt bằng và bố trí pallet cho kho gạch ốp lát trong website hiện có.
- Trạng thái: có code chặng 1 nền/tường/cửa và [chặng 2 khu vực/ô, nháp/áp dụng](STAGE2_ZONES.md); xem [chặng 1](IMPLEMENTATION.md) và giới hạn kiểm chứng từng chặng. Những phần còn lại dưới đây là phạm vi mục tiêu, chưa phải toàn bộ tính năng đã vận hành.
- Công nghệ người dùng dự kiến: Node.js, React, TypeScript và thư viện ngoài. Chưa chọn thư viện cụ thể.

## 1. Mục tiêu và phạm vi

Người dùng tự vẽ kho từ trang trắng với thao tác gần SketchUp: đặt điểm, vẽ cạnh, nhập chiều dài và góc chính xác. Mặt bằng được dựng thành mô hình 3D gồm nền, tường và cửa. Người dùng chia khu vực, tạo các ô kẻ trên sàn như ô đỗ xe, bố trí pallet và kiểm tra chiều cao chồng hàng.

Kho phục vụ một chủ cửa hàng, có thể có nhiều kho. Công cụ phục vụ đồ án và sử dụng nội bộ, tích hợp vào website của dự án. Người dùng tự cung cấp kích thước từ số đo, ước lượng hoặc kế hoạch có sẵn; độ chính xác mô hình phụ thuộc đầu vào.

### Trong phiên bản 1 đã thống nhất

- Kho một tầng; đường bao có thể hình chữ nhật, chữ L hoặc có cạnh xiên.
- Tự dựng nền và tường từ đường bao kín; toàn kho có một chiều cao tường chung.
- Cửa/khoảng mở có vị trí, chiều rộng và chiều cao.
- Khu vực hình chữ nhật có thể xoay; chức năng khu vực do admin tự tạo.
- Ô đặt pallet nằm hoàn toàn trong một khu vực; kích thước ô tính theo pallet hoặc nhập trực tiếp.
- Pallet có mã riêng, chứa được nhiều mã gạch và nhiều lô nhập.
- Chồng thùng trên pallet và chồng nhiều pallet đã có hàng lên nhau.
- Bố trí pallet ở cả 2D và 3D; dữ liệu đồng bộ ngay.
- Tính chiều cao theo lớp hàng, hỗ trợ chiều cao nhập tay thay thế.
- Xem hàng hiện có và lập phương án cho hàng dự kiến nhập.
- Phân quyền theo role do admin chọn quyền.

### Chưa đưa vào phạm vi đã chốt

Kệ chia tầng, kho nhiều tầng/sàn lửng, tự động tối ưu cách xếp, mô phỏng xe nâng, mô phỏng cánh cửa đóng/mở, nhập CAD, xuất file 3D, và tính kết cấu/tải trọng. Cảnh báo trong bản này kiểm chiều cao hình học theo giới hạn nhập vào, không chứng minh khả năng chịu tải hoặc độ ổn định khi chồng pallet.

## 2. Thuật ngữ và cấu trúc không gian

| Khái niệm | Ý nghĩa |
|---|---|
| Kho | Một kho vật lý, có đường bao nền, tường, cửa và chiều cao chung |
| Khu vực | Vùng chữ nhật xoay được bên trong kho, có chức năng và giới hạn chiều cao |
| Chức năng khu vực | Danh mục do admin tạo, ví dụ lưu trữ, nhận hàng, đóng gói, lối đi |
| Ô | Vùng kẻ trên sàn, thuộc một khu vực; có thể chứa một hoặc nhiều vị trí pallet |
| Pallet | Đối tượng có mã riêng, kích thước đế, nội dung hàng và vị trí |
| Lớp hàng | Một lớp trên pallet, có danh sách mã hàng/lô/số lượng và chiều cao lớp |
| Chồng pallet | Các pallet đặt lần lượt lên nhau tại cùng vị trí nền |
| Lô hàng | Lô của sản phẩm; không đồng nghĩa với ô trên sàn |
| Phương án dự kiến | Bố trí thử hàng chưa nhập, chưa làm thay đổi tồn thực tế |

Quan hệ không gian: **Kho → Khu vực → Ô → Pallet → Lớp hàng → Dòng sản phẩm/lô**. Đây là cấu trúc khái niệm, chưa phải quyết định tạo các collection tương ứng.

## 3. Người dùng và phân quyền

**Đã chốt:** chủ cửa hàng xem được toàn bộ kho; admin tick quyền cho role để cấp khả năng sử dụng. Không chỉ kiểm tên role cố định để cho phép thao tác.

Các nhóm quyền sau là **đề xuất để thiết kế**, chưa là tên permission/API hiện có:

| Nhóm quyền đề xuất | Khả năng |
|---|---|
| Xem Kho 3D | Xem mặt bằng, pallet và thông tin được phép đọc |
| Sửa thiết kế | Vẽ kho, sửa tường/cửa, khu vực và ô; lưu nháp |
| Áp dụng thiết kế | Chuyển bản nháp hợp lệ thành thiết kế sử dụng |
| Quản lý chức năng khu vực | Tạo/sửa danh mục chức năng |
| Bố trí pallet | Tạo/sửa bố trí, nội dung pallet theo quyền nghiệp vụ |
| Lập phương án nhập | Thử phân bổ hàng dự kiến vào kho |

Hệ thống hiện có còn kiểm phạm vi kho được giao cho nhân viên. Việc role được quyền xem có đồng nghĩa được xem mọi kho hay vẫn theo `warehouseIds` là điểm cần đối chiếu khi tích hợp; không suy từ quyền của chủ cửa hàng sang mọi role. Backend phải kiểm quyền và phạm vi dữ liệu, không chỉ ẩn nút trên frontend.

## 4. Luồng sử dụng chính

1. Chọn kho và mở thiết kế hoặc bắt đầu từ trang trắng.
2. Vẽ đường bao; nhập chiều dài và góc cạnh; khép kín mặt bằng.
3. Nhập chiều cao chung; hệ thống dựng nền và tường.
4. Tạo cửa trên tường bằng vị trí, chiều rộng và chiều cao.
5. Vẽ khu vực chữ nhật, xoay và gán chức năng.
6. Tạo ô trong khu vực, nhập hoặc tính kích thước từ bố trí pallet.
7. Tạo/chọn pallet, khai báo hàng và các lớp; đặt pallet trong ô hoặc chồng lên pallet khác.
8. Quan sát, di chuyển và xoay pallet trong 2D hoặc 3D.
9. Xem lỗi hình học và cảnh báo chiều cao; sửa hoặc lưu nháp.
10. Áp dụng thiết kế khi không còn lỗi chặn. Phương án hàng dự kiến vẫn tách khỏi tồn thực tế.

## 5. Yêu cầu chức năng

### FR-01 — Vẽ mặt bằng và dựng kho

- Bắt đầu từ trang trắng; vẽ cạnh bằng thao tác con trỏ kết hợp nhập số đo.
- Nhập được chiều dài và góc cạnh xiên, hỗ trợ đường bao lõm như chữ L.
- Khi đường bao khép kín, tạo nền và tường bao; sửa 2D cập nhật 3D ngay.
- Dùng chiều cao tường chung cho toàn kho.
- Đề xuất kiểm hình học: ít nhất ba đỉnh phân biệt, diện tích dương, cạnh có độ dài dương, không tự cắt nhau.
- Đề xuất UX: lưới, bắt dính đầu mút, khóa hướng ngang/dọc, hoàn tác/làm lại. Đây là tiện ích chưa được người dùng xác nhận riêng.
- Cần chốt trước triển khai: góc cạnh đo theo trục cố định hay cạnh trước; đơn vị nhập, độ dày tường và quy ước đo phía trong tường.

### FR-02 — Cửa và khoảng mở

- Chọn một cạnh tường, xác định vị trí cửa trên cạnh đó, nhập rộng và cao.
- Cửa bắt đầu từ sàn. 2D thể hiện đoạn mở; 3D thể hiện ô cửa và phần tường phía trên nếu còn.
- Ví dụ: tường cao 4 m, cửa rộng 3 m, cao 3,5 m, mép cửa cách góc tường 2 m.
- Đề xuất kiểm: cửa nằm trong đoạn tường, kích thước dương, không cao hơn tường, các cửa không chồng lấn.
- Chưa yêu cầu mô hình cánh cửa hoặc trạng thái đóng/mở. Số lượng cửa và cách xử lý khi sửa/xóa cạnh chứa cửa cần chốt khi thiết kế chi tiết.

### FR-03 — Khu vực và chức năng

- Khu vực chỉ có dạng hình chữ nhật, được xoay; khu chữ L biểu diễn bằng nhiều khu chữ nhật.
- Admin tự tạo danh sách chức năng. Tên chức năng không tự cấp quyền hoặc thay đổi quy tắc nghiệp vụ tồn.
- Hai khu vực được chạm cạnh nhưng không được chồng lấn diện tích.
- Chặn ngay thao tác vẽ/di chuyển gây chồng lấn, giữ trạng thái hợp lệ trước thao tác.
- Khu vực có giới hạn chiều cao riêng thấp hơn giới hạn mặc định của kho; nếu không đặt riêng thì dùng mặc định kho.
- Đề xuất bổ sung: tên/mã/màu khu vực và kiểm toàn bộ vùng nằm trong kho. Cách xử lý khu vực ra ngoài kho chưa được chọn riêng, xem mục 13.

### FR-04 — Ô đặt pallet

- Ô là vùng đánh dấu trên sàn; không có kệ hoặc tầng kệ.
- Ô bắt buộc thuộc một khu vực, toàn bộ hình ô nằm trong khu vực đó.
- Một ô có thể chứa một, hai hoặc nhiều vị trí pallet theo cấu hình người dùng.
- Tạo ô bằng số hàng × số cột pallet, kích thước pallet, khoảng hở giữa pallet và khoảng cách tới mép ô.
- Cho nhập/sửa trực tiếp chiều dài và chiều rộng sau khi tính.
- Số hàng/cột là bố trí trên mặt sàn; số pallet chồng theo chiều cao không làm tăng số vị trí nền.
- Ô sử dụng giới hạn chiều cao của khu vực.
- Hình dạng ô, khả năng xoay ô, chồng lấn giữa các ô và kiểm pallet vượt mép ô là các quy tắc cần chốt thêm trước triển khai hình học.

### FR-05 — Pallet và nội dung hàng

- Mỗi pallet có mã riêng, kích thước đế và danh sách hàng riêng.
- Một pallet được chứa nhiều mã gạch và nhiều lô nhập; lưu số lượng riêng theo sản phẩm/lô.
- Hỗ trợ đặt thùng lên một pallet và chồng nhiều pallet đã có hàng lên nhau.
- Pallet hỗn hợp được khai báo từng lớp, gồm mã hàng/lô/số lượng và chiều cao lớp.
- Cần có chiều dài, chiều rộng và chiều cao đế pallet để tính ô và chiều cao chồng.
- Hàng cùng sản phẩm nhưng khác lô không tự gộp mất định danh lô.
- Quyết định một pallet nhiều mã/lô không thay quy tắc cũ: một thùng vật lý chỉ chứa một sản phẩm từ một lô.
- Chuỗi chồng không được tham chiếu vòng hoặc tự đặt pallet lên chính nó. Cách chọn pallet đỡ, xử lý khi di chuyển pallet dưới cùng và điều kiện hai mặt đỡ phù hợp là điểm thiết kế mở.

### FR-06 — Tính chiều cao và cảnh báo

- Với hàng đồng nhất: hỗ trợ tính theo cách xếp thùng, hướng đặt và số thùng mỗi lớp.
- Với hàng hỗn hợp: người dùng khai báo chiều cao từng lớp; hệ thống cộng các lớp, không suy chiều cao chỉ từ tổng thể tích.
- Hỗ trợ nhập chiều cao phần hàng dự kiến/thực tế thay thế; nếu có số đo thực tế thì ưu tiên số đó.
- Luôn tính thêm chiều cao đế pallet; khi chồng nhiều pallet, cộng chiều cao toàn bộ các đế và phần hàng.
- So sánh chiều cao từ sàn đến đỉnh chồng với giới hạn hiệu lực của khu vực.
- Khi vượt: tô đỏ vị trí/chồng hàng, hiển thị chiều cao tính được và giới hạn; vẫn cho lưu và không chặn áp dụng chỉ vì cảnh báo này.
- Cảnh báo tồn tại đến khi dữ liệu được sửa để không còn vượt. Chiều cao bằng giới hạn không phải vượt.
- Khi số lượng/lớp thay đổi sau lần đo, đề xuất đánh dấu số đo cần kiểm tra lại để tránh dùng chiều cao cũ mà không thông báo; cơ chế cụ thể chưa chốt.

### FR-07 — Tương tác 2D và 3D

- Cả hai chế độ đều cho bố trí, kéo, xoay và chồng pallet.
- Chọn hoặc sửa cùng một đối tượng phải cho kết quả thống nhất giữa hai chế độ.
- Thay đổi mặt bằng, cửa, khu vực, ô hoặc pallet được phản ánh ngay trên mô hình tương ứng.
- Đề xuất: 2D nhìn từ trên xuống; 3D xoay góc nhìn, phóng to/thu nhỏ và ẩn bớt tường khi cần quan sát.
- Cách chọn pallet nằm dưới pallet khác trong 2D và cách phân biệt thao tác xoay camera với xoay pallet phải được thiết kế rõ trước lập trình.
- Chưa chốt việc hỗ trợ đầy đủ thao tác thiết kế trên điện thoại.

### FR-08 — Tồn hiện tại và hàng dự kiến nhập

- Có chế độ xem hàng hiện đang ở kho và chế độ lập phương án cho hàng sắp nhập.
- Phương án dự kiến có thể bố trí cùng bối cảnh hàng hiện tại để kiểm tra vị trí và chiều cao.
- Lưu hoặc chỉnh phương án không làm tăng/giảm tồn, không tự xác nhận phiếu nhập và không tự giữ hàng.
- Cần phân biệt trực quan hàng hiện tại với hàng dự kiến, ví dụ nhãn trạng thái hoặc độ trong suốt; cách hiển thị cụ thể là đề xuất.
- Nguồn chứng từ lấy hàng dự kiến, thời điểm chuyển pallet dự kiến thành pallet thực và xử lý nhận thiếu/thừa cần thiết kế cùng luồng nhập hiện có.
- Kéo pallet thực sang ô khác có thể là nghiệp vụ chuyển vị trí; không được ghi đè tồn chỉ bằng cập nhật tọa độ. Cách kết nối với BF03/TO cần chốt trước triển khai.

### FR-09 — Bản nháp và áp dụng

- Cho lưu bản nháp khi sửa đường bao làm ô hoặc pallet nằm ngoài kho.
- Chặn áp dụng bản nháp cho đến khi các ô/pallet nằm trong kho hợp lệ.
- Chồng lấn khu vực bị chặn ngay, không đợi đến bước áp dụng.
- Vượt giới hạn chiều cao chỉ cảnh báo, không phải lỗi chặn áp dụng.
- Đề xuất có hai trạng thái thiết kế: nháp và đang áp dụng; mở bản đang áp dụng để sửa sẽ tạo nội dung nháp, không tự thay thiết kế đang sử dụng.
- Số bản nháp được lưu, quyền áp dụng, lịch sử phiên bản và xử lý chỉnh sửa đồng thời chưa được duyệt chi tiết.

## 6. Công thức và ví dụ

### 6.1. Kích thước ô theo lưới pallet đồng kích thước

Gọi `c` là số cột, `r` là số hàng, `W` và `L` là rộng/dài pallet theo hướng đặt; `gx`, `gy` là khoảng hở giữa các pallet. Bốn khoảng cách mép là `mLeft`, `mRight`, `mFront`, `mBack`.

```text
Rộng ô = c × W + (c − 1) × gx + mLeft + mRight
Dài ô = r × L + (r − 1) × gy + mFront + mBack
```

Ví dụ: 2 pallet nằm cạnh nhau, mỗi pallet rộng 1 m, dài 1,2 m; hở giữa 0,1 m; mỗi mép 0,05 m. Ô rộng 2,2 m và dài 1,3 m. Công thức chỉ áp dụng lưới pallet cùng kích thước/hướng; trường hợp trộn kích thước cần nhập ô trực tiếp hoặc thiết kế cách tính khác.

### 6.2. Chiều cao pallet và chồng pallet

```text
Hàng tính theo lớp = tổng chiều cao các lớp
Hàng hiệu lực = chiều cao nhập thay thế nếu có, nếu không dùng chiều cao tính theo lớp
Pallet có hàng = chiều cao đế + chiều cao hàng hiệu lực
Chồng pallet = tổng chiều cao từng pallet có hàng trong chồng
Vượt giới hạn khi: chiều cao chồng > giới hạn hiệu lực của khu vực
```

Ví dụ tổng hợp: pallet P001 có đế 0,15 m, hai lớp cao 0,30 m và 0,25 m, tổng 0,70 m. P002 có đế 0,15 m, phần hàng đo được 0,80 m, tổng 0,95 m. Chồng P002 lên P001 cao 1,65 m. Nếu khu vực giới hạn 1,60 m thì cảnh báo vượt 0,05 m, vẫn cho lưu.

Với thùng đồng nhất xếp theo lớp: `số lớp = ceil(số thùng / số thùng mỗi lớp)`; chiều cao phần hàng bằng số lớp nhân chiều cao thùng theo hướng đặt. Đây là mô hình lớp đều, không chứng minh các thùng thực sự vừa mặt pallet. Với pallet hỗn hợp, chiều cao mỗi lớp do người dùng khai báo; không cộng chiều cao từng thùng nằm cạnh nhau như chúng nằm chồng lên nhau.

Phân biệt chiều cao tường với giới hạn xếp hàng. Đề xuất giới hạn kho không cao hơn chiều cao sử dụng của kho, còn giới hạn khu vực không cao hơn giới hạn kho; cách xử lý khi giảm chiều cao tường cần chốt.

## 7. Ma trận lỗi và cảnh báo

| Tình huống | Xử lý | Trạng thái quyết định |
|---|---|---|
| Hai khu vực chồng lấn diện tích | Chặn ngay thao tác tạo/di chuyển | Đã chốt |
| Hai khu vực chạm cạnh | Cho phép | Đã chốt |
| Ô/pallet nằm ngoài kho sau sửa đường bao | Lưu nháp được, chặn áp dụng | Đã chốt |
| Ô không nằm hoàn toàn trong khu vực của nó | Không đạt điều kiện hợp lệ; thời điểm chặn cần chốt | Ràng buộc đã chốt, thời điểm kiểm mở |
| Chồng hàng vượt chiều cao | Tô đỏ, cảnh báo, vẫn cho lưu/áp dụng nếu không có lỗi khác | Đã chốt |
| Đường bao tự cắt, cạnh bằng 0 | Không tạo mặt bằng hợp lệ | Đề xuất kiểm đầu vào |
| Cửa vượt cạnh tường hoặc cao hơn tường | Chặn dữ liệu cửa không hợp lệ | Đề xuất |
| Thiếu dữ liệu chiều cao | Hiển thị chưa đủ dữ liệu; không kết luận đạt giới hạn | Đề xuất |
| Pallet giao nhau ngoài quan hệ chồng hợp lệ | Quy tắc va chạm và thời điểm chặn cần chốt | Điểm mở |

## 8. Dữ liệu khái niệm cần chuẩn bị

Đây là danh sách thông tin cần có, không phải schema hoặc migration đã được phê duyệt.

| Nhóm | Dữ liệu cần thiết |
|---|---|
| Thiết kế kho | Tham chiếu kho, đường bao, chiều cao tường, giới hạn xếp, cửa, trạng thái/phiên bản thiết kế |
| Chức năng khu vực | Mã/tên chức năng do admin tạo; quan hệ với loại vị trí nghiệp vụ cần đối chiếu |
| Khu vực | Mã/tên, vị trí, dài/rộng, góc xoay, chức năng, giới hạn cao tùy chọn |
| Ô | Mã/tham chiếu vị trí nghiệp vụ, khu vực, vị trí, dài/rộng, cấu hình tính từ pallet |
| Pallet | Mã, kích thước đế, vị trí/ô, hướng xoay, pallet đỡ nếu có, trạng thái thực/dự kiến |
| Lớp hàng | Thứ tự lớp, chiều cao, các dòng sản phẩm/lô/số lượng |
| Chiều cao nhập tay | Giá trị phần hàng, nguồn dự kiến/thực đo, thời điểm cập nhật đề xuất |
| Liên kết tồn | Định danh sản phẩm/lô, quy cách, chủ hàng/chất lượng và nguồn tồn hoặc chứng từ tương ứng |
| Phương án nhập | Kho, phiên bản mặt bằng tham chiếu, nguồn hàng dự kiến và các pallet bố trí thử |

Người dùng xác nhận dự án có kích thước sản phẩm, kích thước thùng và số sản phẩm mỗi thùng. Trước triển khai cần đối chiếu dữ liệu thực và cách lưu snapshot quy cách; không suy kích thước ngoài thùng từ kích thước từng viên. Các dữ liệu cần bổ sung chủ yếu là kích thước đế pallet, lớp hàng, tọa độ và quan hệ chồng.

## 9. Bố cục giao diện đề xuất

- Thanh trên: chọn kho, nhãn hiện tại/dự kiến, chuyển 2D/3D, lưu nháp, kiểm tra, áp dụng.
- Thanh công cụ: chọn, vẽ đường bao, tạo cửa, tạo khu vực, tạo ô và thêm pallet.
- Vùng giữa: mặt bằng 2D hoặc mô hình 3D.
- Bảng thuộc tính: thông tin và kích thước đối tượng đang chọn; nội dung pallet và lớp hàng.
- Danh sách lỗi/cảnh báo: bấm một mục để chọn và đưa góc nhìn tới đối tượng liên quan.
- Danh sách phân cấp kho/khu vực/ô/pallet để chọn đối tượng khó nhìn, đặc biệt khi chồng pallet.

Đây là đề xuất bố cục để dựng wireframe, chưa chốt thiết kế giao diện hoặc thư viện.

## 10. Đối chiếu với dự án hiện có

Nguồn đã đọc: [hướng dẫn dự án](../../PROJECT_GUIDE.md), [bản đồ model](../../MODEL_MAP.md), [kho và vị trí](../03_thiet_ke/DB_Rebuild_Review/05_Duyet_kho_vi_tri_don_vi_tinh.md), [sản phẩm/lô và sức chứa](../03_thiet_ke/DB_Rebuild_Review/39_San_pham_va_lo_dang_chot.md), [quyền](../03_thiet_ke/DB_Rebuild_Review/02_Duyet_tai_khoan_va_phan_quyen.md).

| Nội dung | Tài liệu hiện có | Yêu cầu Kho 3D mới và việc cần tích hợp |
|---|---|---|
| Hình dạng kho | Bộ chiều dài/rộng/cao | Thêm đường bao đa giác; không suy kho chữ L từ một hình chữ nhật bao ngoài |
| Chiều cao | Chiều cao dùng chung từ kho | Có giới hạn thấp hơn theo khu vực; cần phân biệt tường, giới hạn kho và giới hạn khu |
| Chồng hàng | Không quản lý chồng, có quy cách/thể tích | Quản lý pallet, các lớp và chồng pallet; cần thiết kế dữ liệu riêng trước thay schema |
| Khu và loại vị trí | areaCode và các loại nghiệp vụ có sẵn | Khu hình học và chức năng tùy tạo; chưa đồng nghĩa được thay enum hay quy tắc RECEIVING/STORAGE/... |
| Kiểm sức chứa | Có kiểm kích thước/thể tích ở nghiệp vụ | Cảnh báo chiều cao của 3D không mặc nhiên bỏ các chặn của giao dịch tồn hiện có |
| Di chuyển hàng | BF03/TO có lịch sử và ghi tồn | Kéo pallet thực phải liên kết nghiệp vụ tương ứng, không sửa balance trực tiếp |
| Quyền | Permission và phạm vi kho | Owner xem toàn bộ; phạm vi role khác cần giữ/đối chiếu hợp đồng hiện có |

Quyết định mới là căn cứ cho mục tiêu Kho 3D. Tài liệu này không khẳng định runtime đã có tính năng đó, không phê duyệt tên collection mới và không thay đổi dữ liệu tồn hiện hành. Khi triển khai cần cập nhật model map, hợp đồng API, từ điển dữ liệu và migration theo thiết kế được chốt ở bước đó.

## 11. Tiêu chí nghiệm thu dự kiến

Các tiêu chí sau là kế hoạch kiểm thử khi triển khai, chưa phải kết quả đã chạy.

| Mã | Tình huống | Kết quả mong đợi |
|---|---|---|
| AC-01 | Vẽ kho chữ L và một cạnh xiên có số đo | Khép kín được; nền/tường 3D theo đúng đường bao |
| AC-02 | Sửa chiều dài/góc cạnh trên 2D | 3D cập nhật cùng dữ liệu, không phải nhập lại |
| AC-03 | Tạo cửa cao 3,5 m trên tường 4 m | 3D còn 0,5 m tường phía trên |
| AC-04 | Xoay khu vực chữ nhật vào khu khác | Thao tác bị chặn; chạm cạnh vẫn được phép |
| AC-05 | Tạo ô với hai pallet theo ví dụ mục 6.1 | Kích thước 2,2 × 1,3 m, sửa trực tiếp được |
| AC-06 | Đặt ô vượt ranh giới khu vực | Không được coi là bố trí hợp lệ |
| AC-07 | Pallet có nhiều sản phẩm/lô trên nhiều lớp | Giữ riêng số lượng từng dòng; cộng đúng chiều cao lớp |
| AC-08 | Nhập chiều cao thực tế thay chiều cao tính | Kết quả dùng số thực tế và cộng đế đúng một lần |
| AC-09 | Chồng P002 lên P001 theo ví dụ | Tổng 1,65 m, cảnh báo vượt 0,05 m với giới hạn 1,60 m; vẫn lưu được |
| AC-10 | Đổi vị trí/xoay/chồng pallet ở 2D rồi 3D | Hai chế độ thể hiện cùng đối tượng và trạng thái |
| AC-11 | Thu nhỏ kho làm ô/pallet ra ngoài | Lưu nháp được, áp dụng bị chặn; sửa hợp lệ thì áp dụng được |
| AC-12 | Thêm hàng dự kiến vào phương án | Có mô hình/cảnh báo, số dư tồn thực tế không đổi |
| AC-13 | Role chỉ có quyền xem thử lưu thiết kế | Backend từ chối ghi; giao diện không cung cấp thao tác sửa |
| AC-14 | Đóng rồi mở lại bản đã lưu | Giữ đường bao, cửa, khu, ô, pallet, lớp và quan hệ chồng |

## 12. Các chặng triển khai đề xuất

1. Đối chiếu FE/BE hiện có, chốt các điểm mở ảnh hưởng dữ liệu và làm wireframe; chọn thư viện sau thử nghiệm tương tác nhỏ.
2. Vẽ mặt bằng, nhập thông số, dựng nền/tường/cửa và lưu/mở thiết kế.
3. Khu vực chữ nhật xoay, chức năng, ô và các kiểm tra hình học.
4. Pallet/lớp hàng, tính cao, cảnh báo và quan hệ chồng.
5. Hoàn thiện thao tác ở cả 2D và 3D, bản nháp và áp dụng.
6. Liên kết tồn hiện tại, hàng dự kiến nhập, chuyển vị trí và phân quyền; kiểm thử hồi quy các luồng liên quan.

Chia chặng để thực hiện từng phần, không loại bỏ yêu cầu thao tác cả 2D và 3D khỏi phạm vi cuối cùng. Chưa cam kết thời gian vì chưa khảo sát đầy đủ code và khối lượng dữ liệu.

## 13. Điểm mở cần giải quyết khi thiết kế chi tiết

Không cần mở thêm vòng hỏi để sử dụng bản đặc tả này. Các điểm dưới đây phải được xác định trước phần triển khai phụ thuộc; không coi là đã được người dùng duyệt:

1. Đơn vị/độ chính xác, quy ước góc, độ dày tường và cách chỉnh cạnh mà vẫn khép kín kho.
2. Quy tắc khu vực vượt đường bao; hình dạng/xoay ô, ô chồng lấn, ô vượt khu vực và pallet vượt ô.
3. Điều kiện chồng pallet, kiểm va chạm, xử lý khi di chuyển/xóa pallet dưới và cách chọn tầng trong 2D.
4. Cách tính lớp đồng nhất, kiểm chiều cao lớp hỗn hợp và đánh dấu số đo cũ sau khi sửa hàng.
5. Danh mục chức năng khu vực liên hệ thế nào với các loại vị trí nghiệp vụ hiện hành; khu lối đi có được đặt pallet không.
6. Liên kết pallet với tồn, hàng lẻ, chất lượng/chủ sở hữu; chống đếm cùng lượng hàng vào nhiều pallet hoặc nhiều lớp.
7. Nguồn hàng dự kiến và mốc ghi nhận hàng thực; xử lý tồn thay đổi sau khi lập phương án; giao dịch chuyển pallet thực giữa các ô.
8. Quyền áp dụng, phạm vi kho của role khác Owner, số bản nháp, lịch sử và kiểm sửa đồng thời.
9. Giữ định danh ô đang có tồn/chứng từ khi thay bố cục; quy tắc xóa khu/ô/pallet và tương thích dữ liệu cũ.
10. Thiết bị/trình duyệt mục tiêu, số ô/pallet tối đa cần hiển thị và tiêu chí hiệu năng đo được.
11. Xử lý giới hạn xếp hàng khi chiều cao tường giảm; phân biệt cảnh báo hình học với kiểm sức chứa giao dịch hiện hành.

## 14. Phạm vi kiểm chứng của tài liệu

Bản này tổng hợp các lựa chọn trực tiếp của người dùng và đối chiếu tài liệu dự án. Chưa khảo sát đầy đủ code FE/BE, chưa kiểm dữ liệu sản xuất, chưa thay schema/API, chưa chạy mô phỏng hay kiểm thử Kho 3D. Tiêu chí ở mục 11 dùng cho nghiệm thu tương lai; các đề xuất chưa được đánh dấu là tính năng đã có.
