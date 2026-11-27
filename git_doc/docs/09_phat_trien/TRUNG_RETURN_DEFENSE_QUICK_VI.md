# Ôn nhanh bảo vệ WHMS: khách trả hàng và trả nhà cung cấp

**Học bảng này trước.** Khi trình bày, nói theo thứ tự **chọn chứng từ nào → ai xử lý → tồn nào thay đổi**. NCC là nhà cung cấp.

| Luồng | Chọn chứng từ | Ai làm gì | Khi nào tồn thay đổi |
|---|---|---|---|
| Khách trả hàng | Chọn **Yêu cầu mua hàng của khách (trong hệ thống)** → dòng phiếu xuất bán thuộc yêu cầu → lô hàng | Kinh doanh đề nghị → Kho vận kiểm → Kinh doanh quyết định → Kho vận nhập hoặc giao lại phần bị từ chối | Kho vận bấm **Ghi tồn** thì phần thực nhập tăng tồn cửa hàng. |
| Trả NCC từ tồn cửa hàng | Dòng phiếu nhập mua đã ghi sổ và số dư thuộc cửa hàng (`STORE`) đúng lô, đúng kho | Kho vận đề nghị → Kế toán ghi thỏa thuận → Kho vận bàn giao → Kế toán ghi phản hồi và đóng phiếu | Bàn giao tạo phiếu xuất trả NCC và giảm tồn cửa hàng. |
| Trả NCC từ hàng tạm giữ | Dòng **Phiếu tạm giữ** đã ghi sổ và số dư hàng vẫn thuộc NCC | Kho vận đề nghị từ dòng tạm giữ → Kế toán ghi thỏa thuận → Kho vận bàn giao → Kế toán ghi phản hồi và đóng phiếu | Bàn giao tạo phiếu giải phóng hàng tạm giữ (`CustodyRelease`) và giảm số dư giữ hộ NCC. |

## Ba ví dụ để tập nói

- **Khách trả 1 thùng, 4 viên.** Kinh doanh chọn yêu cầu mua hàng trước, rồi chọn dòng phiếu xuất và lô. Kho vận kiểm đủ 4 viên, ghi tình trạng, căn cứ thời hạn và đính kèm minh chứng. Kinh doanh duyệt 4. Kho vận chọn **Lập phiếu nhập**, nhập phẩm cấp và vị trí thực tế, rồi bấm **Ghi tồn**. Tồn cửa hàng tăng 4 viên.
- **Trả NCC 4 viên đang thuộc cửa hàng.** Kho vận chọn dòng phiếu nhập mua và số dư đúng lô. Kế toán ghi thỏa thuận 4 viên kèm minh chứng. Kho vận bàn giao 4 viên, ghi người thực nhận và minh chứng. Kế toán ghi NCC chấp nhận đủ 4 viên rồi đối chiếu, đóng phiếu.
- **NCC giao 12 viên, nhập mua 6 và tạm giữ 6.** Sau kiểm nhận, phiếu nhập mua ghi 6 viên thuộc cửa hàng. **Phiếu tạm giữ** ghi 6 viên thuộc NCC. Sau khi phiếu tạm giữ đã ghi sổ, Kho vận có thể đề nghị trả từ dòng giữ hộ. Nếu bàn giao 3 viên từ dòng này, số dư giữ hộ giảm 3 viên.

## Ca xử lý từng phần

| Tình huống | Trả lời khi bảo vệ |
|---|---|
| Đề nghị 10, khách chỉ mang 6 | Kho vận kiểm 6 thực đến. Khi duyệt 6, hệ thống trả lại hạn mức cho 4 viên chưa đến trên chứng từ nguồn. |
| Khách mang 10, chỉ được duyệt 6 | Kho vận nhập 6 đã duyệt. Khi khách đến nhận, Kho vận ghi bàn giao lại 4 viên bị từ chối, kèm người nhận và minh chứng. |
| Duyệt 10, mới ghi tồn 6 | Tồn cửa hàng tăng 6. Kho vận ghi tồn thêm 4 trên cùng hồ sơ, bằng phiếu nhập tiếp theo. |
| Thỏa thuận trả NCC 4, mới bàn giao 3 | Số dư nguồn giảm 3. Kho vận bàn giao 1 viên còn lại trên cùng đề nghị. Hệ thống chặn nếu nhập bàn giao thêm 2. |
| Đã bàn giao 4, NCC xác nhận chấp nhận 3 | Kế toán ghi nhận 3 trên dòng thực giao và ghi thêm 1 khi có phản hồi. Phiếu đủ điều kiện đóng khi đã giao hết lượng thỏa thuận, NCC chấp nhận toàn bộ lượng đã giao và hết tranh chấp. |

Các ca trên giả sử số lượng có thể tách theo quy cách thực tế. Ví dụ, hàng kiểm là thùng nguyên niêm phong thì lượng kiểm, duyệt và nhập phải theo số thùng nguyên.

Khi diễn tập trả NCC nhiều đợt, hãy bàn giao đủ lượng thỏa thuận rồi mới ghi phản hồi. Trong mã backend của checkout đang rà soát, ghi phản hồi chuyển phiếu sang `ACKNOWLEDGED`, còn thao tác bàn giao yêu cầu `READY` hoặc `PARTIAL`. Ca ghi phản hồi xen giữa các đợt chưa được kiểm tra trên bản hosted. [Mã xử lý bàn giao và phản hồi](../../../src/modules/return-workflows/native.service.js).

## Luồng thay thế và ngoại lệ

| Nếu được hỏi | Câu trả lời ngắn |
|---|---|
| Một yêu cầu mua hàng có nhiều phiếu xuất? | Trong luồng hosted, có thể chọn nhiều dòng phiếu xuất thuộc cùng yêu cầu, cùng kho và cùng cách tiếp nhận. Hệ thống theo dõi hạn mức theo dòng nguồn và lô. |
| Giao dịch bán không gắn yêu cầu mua hàng? | Kinh doanh chọn phiếu xuất bán độc lập đã ghi sổ và đủ điều kiện. Hạn mức dựa trên lượng đã xuất, sau khi trừ phần chưa giao đã xử lý hoặc đang được giữ chỗ và các đề nghị trả hiện có. |
| Hàng giao trước đây ngoài WHMS? | Kế toán ghi và xác minh chứng từ giao ngoài kèm minh chứng. Kinh doanh chọn dòng đã xác minh, đúng khách, kho, sản phẩm và lô. |
| Hàng đã lắp, hỏng do khách, quá hạn hoặc thiếu căn cứ? | Kho vận ghi đúng tình trạng. Hàng đã lắp, hỏng do khách hoặc xác minh đã quá hạn bị chặn chấp nhận. Nếu còn thiếu căn cứ, bổ sung và đánh giá lại khi hồ sơ còn cho phép. Ban điều hành (Owner) chỉ quyết định các ca đủ điều kiện ngoại lệ, ví dụ hư hỏng do NCC với đủ căn cứ. |
| Hàng bị từ chối được xử lý ra sao? | Kho vận ghi bàn giao khi khách thực nhận lại. Lượng có thể giao lại bằng **đã kiểm − đã duyệt − đã giao lại**. Với tiếp nhận trực tiếp, thao tác ghi nhận bàn giao. Hồ sơ cũ dùng giữ hộ thì thao tác giảm số dư giữ hộ khách. |
| NCC từ chối trước khi kho bàn giao? | Kế toán ghi số lượng thỏa thuận bằng 0 cho dòng bị từ chối, kèm căn cứ. Kho chỉ bàn giao phần có thỏa thuận dương. Phần giữ chỗ chưa dùng được giải phóng khi đóng phiếu. |
| NCC báo từ chối hoặc hàng hỏng sau bàn giao? | Kế toán ghi đúng phản hồi kèm minh chứng. Tranh chấp chặn đóng phiếu. Nếu nhập sai phản hồi, dùng thao tác hiệu chỉnh đúng dòng và số lượng đã xác nhận, kèm minh chứng. Việc nhận hàng trở lại và giải quyết tranh chấp nằm ngoài luồng này. |
| Hàng tạm giữ đã chuyển vị trí hoặc đã nhập thành hàng cửa hàng? | Kho vận dùng màn đề nghị trả NCC thông thường. Chọn số dư hiện tại đủ điều kiện và đối chiếu chủ hàng, lô và chứng từ nguồn. |

## Câu hỏi kỹ thuật dễ gặp

| Câu hỏi | Câu trả lời ngắn |
|---|---|
| Kiểm hàng, duyệt hoặc ghi thỏa thuận có đổi tồn không? | Tiếp nhận khách trả trực tiếp chỉ ghi kết quả kiểm. Duyệt khách trả và thỏa thuận NCC xác định lượng được xử lý. Đề nghị trả NCC có thể giữ chỗ nên tồn khả dụng giảm, còn tồn vật lý chỉ giảm khi bàn giao. Với hồ sơ khách trả cũ dùng giữ hộ, bước kiểm ghi số dư giữ hộ khách. |
| Một dòng phiếu xuất có thể trả nhiều lần không? | Có, trong hạn mức còn lại của dòng và lô. Với phiếu gắn yêu cầu mua hàng, hệ thống lấy lượng đã ghi nhận giao cho khách rồi trừ phần đã được tính cho các lần trả. Sai kho, sai lô, vượt hạn mức hoặc vị trí bị khóa có thể chặn thao tác. |
| Vì sao một thùng có lúc nhập 1, có lúc nhập 4? | Ô **thùng** nhận 1. Ô theo đơn vị gốc (`qtyBase`) nhận 4 **viên** theo quy cách mẫu. Bao bì vẫn được ghi riêng để biết hàng nguyên thùng, đã mở hay hàng lẻ. |
| Mất phản hồi hoặc hai người cùng thao tác thì sao? | Khi mất phản hồi, yêu cầu gửi lại dùng cùng dữ liệu, `expectedVersion` và `idempotencyKey` để lấy kết quả cũ. Thao tác mới dùng phiên bản hiện tại và khóa mới. Máy chủ kiểm tra quyền, phạm vi kho và số lượng còn lại khi ghi. |
| Khách trả khác gì hàng giao thất bại? | Khách trả xử lý hàng đã giao và cần quyết định chấp nhận trả. Giao thất bại xử lý hàng chưa giao được. Khi ghi nhập hàng giao thất bại có yêu cầu giao liên kết, hệ thống mở lại nhu cầu giao tương ứng. |
| Đóng phiếu hay đính kèm chứng từ có hoàn tiền không? | Luồng theo dõi hàng và chứng từ. Hoàn tiền, thanh toán và xử lý tranh chấp thương mại nằm ngoài các thao tác này. |

Để tự kiểm tra, che cột trả lời và nói mỗi ca trong một hoặc hai câu. Tra mã phiếu hosted và ca diễn tập trong [hướng dẫn bảo vệ](TRUNG_RETURN_DEFENSE_GUIDE.md). Tra điều kiện theo dòng và quy tắc ghi tồn trong [hợp đồng nghiệp vụ](../08_api/RETURN_WORKFLOWS_NATIVE.md).
