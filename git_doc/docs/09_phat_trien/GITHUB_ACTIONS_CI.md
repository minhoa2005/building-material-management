# Kiểm tra tự động trên GitHub Actions

FE và BE là hai repo độc lập. Mỗi repo đọc workflow `.github/workflows/ci.yml` ở thư mục gốc của mình. Workflow chạy trên Ubuntu với Node.js 26 khi mở hoặc cập nhật pull request vào `main` và khi push vào `main`. Có thể chạy thủ công từ tab Actions sau khi workflow có mặt trên nhánh mặc định.

| Repo | Cài thư viện | Kiểm tra |
| --- | --- | --- |
| BE | `npm ci --no-audit` theo `package-lock.json` | `npm run docs:check`, `node --test --test-concurrency=2 test/*.test.js` (cùng bộ test với `npm test`) |
| FE | pnpm 12.15.0 và `pnpm install --frozen-lockfile` theo `pnpm-lock.yaml` | `pnpm build` (gồm kiểm tra TypeScript), `pnpm test --maxWorkers=2 --testTimeout=60000`, `pnpm lint` |

Chạy các lệnh trong thư mục gốc của repo tương ứng để tái hiện một lỗi CI. Các bộ test BE yêu cầu MongoDB hoặc dịch vụ lưu bằng chứng chạy theo hướng dẫn riêng và được bỏ qua theo mặc định. Workflow CI không cần secret hay kết nối cơ sở dữ liệu ứng dụng.

Lint FE hiện có lỗi tồn đọng. Bước lint vẫn ghi kết quả vào log Actions và chạy ở chế độ tham khảo. Build và test FE quyết định trạng thái CI.
