# Kiểm tra tự động trên GitHub Actions

FE và BE là hai repo độc lập. Mỗi repo đọc workflow `.github/workflows/ci.yml` ở thư mục gốc của mình. Workflow chạy trên Ubuntu với Node.js 26 khi mở hoặc cập nhật pull request vào `main` và khi push vào `main`. Có thể chạy thủ công từ tab Actions sau khi workflow có mặt trên nhánh mặc định.

Job BE tạm dùng runner `ubuntu-22.04` vì MongoDB 8.0 từ chối khởi động trên kernel của runner `ubuntu-24.04` trong lần chạy đã ghi nhận. Khi bước khởi tạo lỗi, workflow in trạng thái container và log MongoDB. Xem [log lần chạy lỗi](https://github.com/minhoa2005/building-material-management/actions/runs/42635769959/job/129223389790) và [hướng dẫn tạm thời của GitHub Actions](https://github.com/actions/runner-images/issues/15005).

| Repo | Cài thư viện                                                           | Kiểm tra                                                                                                      |
| ---- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| BE   | `npm ci --no-audit` theo `package-lock.json`                           | `npm run docs:check`, `npm run test:coverage`, và `diff-cover` với ngưỡng 80% trên các dòng `src/**` thay đổi |
| FE   | pnpm 12.15.0 và `pnpm install --frozen-lockfile` theo `pnpm-lock.yaml` | `pnpm build` (gồm kiểm tra TypeScript), `pnpm test --maxWorkers=2 --testTimeout=60000`, `pnpm lint`           |

Chạy các lệnh trong thư mục gốc của repo tương ứng để tái hiện một lỗi CI. Job BE khởi tạo MongoDB 8.0 dạng replica set một node tên `rs0`, rồi bật `RUN_NATIVE_API_TESTS=1` và `RUN_GOODS_RECEIPT_TESTS=1` khi chạy `npm run test:coverage`. Hai nhóm integration test tạo database riêng có tiền tố `wmsd_*_test_*` và tự xóa database sau khi chạy; chúng không kết nối database ứng dụng. Khi chạy local, cần có MongoDB loopback đã khởi tạo replica set `rs0` và đặt hai biến môi trường trên. Các test cần cấu hình database cục bộ riêng hoặc dịch vụ lưu bằng chứng vẫn được bật riêng theo hướng dẫn tương ứng. Workflow không cần secret hoặc kết nối database ứng dụng.

Lint FE hiện có lỗi tồn đọng. Bước lint vẫn ghi kết quả vào log Actions và chạy ở chế độ tham khảo. Build và test FE quyết định trạng thái CI.
