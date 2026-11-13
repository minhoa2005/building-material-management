> 12/11/2026: [Phạm vi HieuDT 20 UC mới](git_doc/docs/08_api/HIEUDT_WAREHOUSE_SCOPE.md) theo bảng người dùng: kho/vị trí, tồn, BF03, BF04, đối soát và nhật ký. Đây là nguồn đối chiếu phạm vi hiện tại; các khả năng 18 UC trước vẫn được giữ. Native warehouse-stock thay route demo, không fallback dữ liệu mẫu.

> 10/11/2026: [18 UC HieuDT, ba iteration](git_doc/docs/08_api/HIEUDT_ITERATIONS_NATIVE.md) đã nối API native cho bán/soạn, BF03/BF04, chốt kiểm kê và báo cáo. Mã UC trong tài liệu theo kế hoạch HieuDT gốc. Trạng thái kiểm chứng và điều kiện đầu vào xem hợp đồng; không suy mọi prototype đã hoàn tất.

> Quyết định 09/11/2026 bổ sung [Conversion theo sản phẩm và lô](git_doc/docs/08_api/CONVERSIONS.md). [Iteration 1 native](git_doc/docs/08_api/ITERATION1_NATIVE_2026-11-06.md) tiếp tục áp dụng cho NCC, giữ hộ và đảo nhập.

# Backend context

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 58 collection schemas directly under `src/models`. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

Start with [PROJECT_GUIDE](git_doc/PROJECT_GUIDE.md), [MODEL_MAP](git_doc/MODEL_MAP.md), [native runtime contract](git_doc/docs/08_api/NATIVE_MODEL_RUNTIME.md) and [documentation rules](git_doc/DOCUMENTATION_RULES.md). The paired frontend is `../fe`.

No automatic commit/push. No remote writes as part of the model synchronization. Preserve dated deployment evidence. D07/D08 remains unresolved.

## Historical return-source decision — 7 November 2026

The user confirmed Accountant verification with uploaded evidence for historical customer-delivery sources. This scope is implemented in [the native return contract](git_doc/docs/08_api/RETURN_WORKFLOWS_NATIVE.md). It does not settle broader new-SO external-source gates. Trungph return workflows now use the native registry; local automated verification and rollout limits are recorded in that contract and the PR evidence. No Atlas data or connection change.

12/11/2026: code Kho 3D chặng 1: warehouses.layout3d, API lưu theo updatedAt và scope; xem git_doc/docs/10_Kho3D/IMPLEMENTATION.md. Chưa có khu vực/ô/pallet và chưa rollout DB.

12/11/2026: Kho 3D chặng 2 mở rộng layout3d cho functions/zones/slots, maxStackHeight và snapshot layout3dApplied/layout3dAppliedAt. PUT layout thêm apply, kiểm containment khi apply và warehouse_layout_function:update khi đổi danh mục chức năng. Danh sách catalogue không trả payload thiết kế. Hợp đồng git_doc/docs/10_Kho3D/STAGE2_ZONES.md.

Kho 3D: functionId rỗng hợp lệ ở nháp, không hợp lệ khi apply; functionId có giá trị phải tồn tại trong functions. Danh mục vẫn kiểm quyền quản trị, không khóa vẽ nháp khi danh mục trống.
