# Current WMSD models

59 collections, one schema per `.model.js` file directly in this folder. For example: [product](product.model.js), [product batch](product-batch.model.js), [goods arrival](goods-arrival.model.js), [purchase order](purchase-order.model.js), [transfer order](transfer-order.model.js).

- `index.js`: public entry point; call `registerReviewedModels(connection)` on a fresh connection, then select the model by collection name.
- `reviewed-registry.js`: explicit imports of the 59 current schema factories.
- `embedded/`: 96 individually named nested schemas, such as header, item, packaging and histories. They stay inside their parent document and do not add collections.
- `legacy/`: old API models retained until services are ported. Do not mix profiles on one connection.
- `rebuild/`: registration, collection/reference maps, historical migration builders and conversion/capacity helpers. Current schema definitions live in the files above.
- `model-utils.js`, `schema-helpers.js`, `document-helpers.js`: shared field/rule/index helpers.

## Vì sao giữ ba thư mục?

| Thư mục | Ví dụ sử dụng | Có thể xóa không? |
|---|---|---|
| `embedded` | Các dòng hàng trong `purchase_orders.items`, quy cách thùng, header và lịch sử biến động | Còn được model cha nhập trực tiếp; không phải bảng riêng |
| `legacy` | Model chứng từ chung mà API bán hàng/chuyển kho hiện tại vẫn dùng | Giữ đến khi đã port và kiểm thử các API phụ thuộc |
| `rebuild` | Đăng ký model, tên/ref, kiểm sức chứa, dựng seed và chuyển dữ liệu cũ | Giữ phần đang dùng; đã xóa ba builder reviewed cũ không còn được gọi |

Đợt kiểm tra ngày 06/11/2026 rà các import trong `src`, `scripts`, `test`: tất cả file schema trong `embedded` có nơi gọi. Ba file đã bỏ trong `rebuild` là `reviewed-events.js`, `reviewed-support.js`, `reviewed-workflows.js`. [Báo cáo kiểm tra](../../git_doc/outputs/model_folder_usage_2026-11-06.json).

The earlier file split preserved fields/indexes/refs. Category v8 now adds categories and required products.categoryId. The local tile-only dataset is `wmsd_demo_tile_shop_v8`; its Atlas copy is `wmsd_database`. App connection and legacy APIs have not been switched.

Read [MODEL_MAP](../../git_doc/MODEL_MAP.md), [Data Dictionary](../../git_doc/docs/03_thiet_ke/DB_Current_2026-11-06_59_v8/WMSD_Data_Dictionary.md) and [deployment guide](../../git_doc/docs/09_phat_trien/ATLAS_DEPLOYMENT.md). Update canonical docs whenever changing a schema.
