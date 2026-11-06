# Quy tắc đồng bộ code và tài liệu

Áp dụng cho mọi agent/người phát triển, theo yêu cầu người dùng ngày 05/11/2026.

## Bắt buộc trong cùng lượt thay đổi

Agent tự xác định tác động và tự sửa tài liệu liên quan trước khi báo hoàn thành. Không chờ người dùng nhắc và không dùng một dòng changelog để thay mô tả cấu trúc đã lỗi thời. Khi đổi quy tắc chưa được chốt, hỏi người dùng trước phần triển khai phụ thuộc và ghi trạng thái chờ trong tài liệu.

| Thay đổi | Tài liệu phải cập nhật |
|---|---|
| Collection/model/field/type/enum/default/required/index/ref/embedded/source link | MODEL_MAP; mục tương ứng trong Data Dictionary; ERD/DB Design nếu cấu trúc/quan hệ hiển thị đổi; hướng dẫn migration; `src/models/CHANGELOG.md`; `git_doc/change_logs.md` |
| API/DTO/filter/error/permission/scope | Contract đúng module trong `docs/08_api`, ví dụ gọi/test nếu có; PROJECT_GUIDE khi ảnh hưởng quy tắc chung; context/contract FE liên quan; changelog |
| Nghiệp vụ/BF/UC/trạng thái/mốc ghi tồn | PROJECT_GUIDE; phiếu duyệt và nhật ký nếu có quyết định mới; đặc tả/ma trận quyền/quy trình đang áp dụng; sơ đồ tương ứng; changelog |
| Seed/migration/local DB/cách chạy | `docs/09_phat_trien`; ví dụ theo đúng mã phiếu và DB mới; test và báo cáo thực đã chạy; changelog |
| Quy tắc agent | Sửa AGENTS.md, CLAUDE.md, GEMINI.md giống hệt nội dung; chạy kiểm đồng bộ |

## Nội dung cho mỗi model

Ghi collection và model name, ý nghĩa một bản ghi, nơi khai báo, trường/kiểu/đơn vị/null/default, nguồn dữ liệu, quan hệ và số lượng 1/n, indexes/ràng buộc, quyền/trạng thái, mốc ảnh hưởng tồn, ví dụ, tương thích dữ liệu cũ và bằng chứng kiểm tra. Phân biệt điều schema kiểm, điều index kiểm và điều service phải kiểm.

Đổi tên/xóa/gộp/thêm bảng hoặc đổi hành vi chưa được người dùng duyệt phải nêu rõ đề xuất và ảnh hưởng trước khi thực hiện. Sửa bug để thực hiện đúng quyết định đã duyệt không cần hỏi lại toàn bộ thiết kế.

## Ghi nhật ký

Thêm một mục ngày tháng vào đầu `git_doc/change_logs.md` gồm yêu cầu/lý do, quyết định nguồn, hành vi trước/sau, file hoặc model/module bị ảnh hưởng, tài liệu cập nhật, migration/DB đích nếu có, kiểm tra thực đã chạy và điểm còn mở. Model đổi phải ghi thêm `src/models/CHANGELOG.md`.

Tài liệu hiện hành được sửa tại mục mô tả tương ứng. Các kết quả kiểm chứng cũ giữ nguyên ngày và phạm vi. Không đổi một báo cáo test cũ thành bằng chứng cho code mới, không ghi “đã chạy” cho kiểm tra chưa chạy. Phân biệt thiết kế đã duyệt, schema đã khai báo, seed kiểm đúng và API/FE đã vận hành.

## Giữ một bản chính

`git_doc` là bản chính cho hướng dẫn và thay đổi. README trong module/context trỏ tới bản chính, tránh sao chép rồi lệch. Các report nộp bài chỉ sửa trong section hiện có, giữ format và Change Log cũ, không thêm banner/revision appendix vào cuối report. Nhật ký mới ghi trong file riêng này.

ERD dùng entity chữ nhật, relationship tam giác, nét liền và nhãn 1/n ở đầu nối, hướng trái sang phải/trên xuống dưới. Backup trước chỉnh, kiểm các page/edge và xem bản render khi bố cục đổi. Ảnh preview chỉ xuất lại cho sơ đồ có thay đổi.

Không đưa `.env`, token, mật khẩu, bản dump dữ liệu thật hoặc ảnh bằng chứng thật vào tài liệu Git. Chỉ lưu URI loopback, placeholder, dữ liệu tổng hợp và báo cáo đã loại thông tin nhạy cảm.

## Trước khi bàn giao

1. Xem diff đúng phạm vi, giữ thay đổi của người khác.
2. Cập nhật các mục hiện hành theo bảng tác động và ghi nhật ký.
3. Chạy `npm run docs:check` để kiểm ba file luật, liên kết chính và đủ model trong bản đồ.
4. Chạy test phù hợp với code đã sửa, nêu rõ giới hạn kết quả.
5. Nêu file tài liệu đã cập nhật và việc còn chờ. Commit/push theo lệnh người dùng, không tự thực hiện.

`docs:check` kiểm cấu trúc và dấu vết cập nhật, không tự hiểu đúng/sai nghiệp vụ. Trách nhiệm sửa nội dung vẫn thuộc agent đang đổi code.
