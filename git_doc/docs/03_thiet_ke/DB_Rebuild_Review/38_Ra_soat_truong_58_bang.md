# Rà soát trường của toàn bộ 58 bảng — 06/11/2026

Đã áp dụng cho reviewed model, seed v5. Status chỉ mô tả trạng thái; version bảo vệ nội dung và thao tác đồng thời. Một phiếu DRAFT sửa hai lần vẫn là DRAFT nên không dùng status thay version. Phiên bản nguồn/giá/phạm vi đã duyệt giữ nguyên để xác định đúng nội dung tại thời điểm phát sinh.

Đã bỏ: revision ở cấp đầu phiếu vì có version; version của products/warehouses/customers/suppliers; version và productId ở ngưỡng nhúng; referenceId của dòng nguồn nhúng; version và balanceId ở phần đóng gói nhúng. Không thêm status chỉ để thay bộ đếm. Vai trò/tài khoản, vị trí, tồn, lượng giữ/phân bổ, khóa đồng thời và các mốc xác minh vẫn cần bộ đếm hoặc phiên bản nguồn.

Bốn danh mục bỏ version vẫn có updatedAt. Khi port API sửa danh mục, kiểm updatedAt của bản vừa đọc và quyền/trạng thái, còn những thay đổi có ảnh hưởng kho/tồn phải kiểm điều kiện nghiệp vụ ngay trong transaction. Chưa chuyển API legacy trong lượt này.

Converter không ghi đè nguồn. Nếu revision khác version, dừng để đối chiếu thay vì tự bỏ một giá trị. Các foreign key đã bỏ chỉ trùng với bảng cha; phép chiếu phục vụ kiểm dữ liệu sẽ suy ra từ cha, không lưu hai lần.

## users

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## roles

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## permissions

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## warehouses

Bỏ 1 trường: `version`.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## warehouse_locations

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `version`, `operationVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## products

Bỏ 3 trường: `version`, `stockThresholds[].productId`, `stockThresholds[].version`.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## customers

Bỏ 1 trường: `version`.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## suppliers

Bỏ 1 trường: `version`.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stock_holding_points

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## inventory_balances

Bỏ 2 trường: `packagingPortions[].balanceId`, `packagingPortions[].version`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stock_transactions

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stock_reservations

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `demandRef.revision`, `executionRef.revision`, `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## supply_allocations

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `demandRef.revision`, `sourceRef.revision`, `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## approval_history

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `subjectRevision`, `basisRefs[].revision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## attachments

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `ownerRevision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## return_quantity_claims

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `version`, `events[].sourceRef.revision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stocktake_snapshots

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `scopeVersion`, `sourceBalanceVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stocktake_counts

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `scopeVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stocktake_location_locks

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `scopeVersion`, `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## notifications

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `sourceVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## audit_logs

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## system_events

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `sourceVersion`, `payloadVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## operation_records

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `resultRefs[].revision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## replenishment_locks

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## return_source_locks

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## external_references

Bỏ 1 trường: `items[].referenceId`.

Các trường phiên bản giữ lại: `sourceVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## product_batches

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: không có.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## replenishment_requests

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.approvedRevision`, `submissions[].documentVersion`, `submissions[].lines[].conversionVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## purchase_orders

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.approvedRequestRevision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## goods_arrivals

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## goods_inspections

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## purchase_receipts

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `items[].custodyReceiptRef.revision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## transfer_orders

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## warehouse_transfer_requests

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.approvedVersion`, `header.approvedRevision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## internal_transfer_requirements

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## transfer_dispatches

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.approvedRevision`, `handovers[].version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## transfer_receipts

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## sales_orders

Bỏ 3 trường: `revision`, `paymentConfirmations[].revision`, `deliveryConfirmations[].revision`.

Các trường phiên bản giữ lại: `version`, `items[].priceRevision`, `paymentConfirmations[].version`, `paymentConfirmations[].header.deliveredOrderVersion`, `cancellations[].sourceVersion`, `deliveryConfirmations[].version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## warehouse_issue_requests

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.salesOrderVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## delivery_orders

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## sales_goods_issues

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `items[].salePriceSnapshot.salesOrderRevision`, `handovers[].version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## defect_reports

Bỏ 2 trường: `revision`, `resolutionPlans[].revision`.

Các trường phiên bản giữ lại: `version`, `header.sourceRef.revision`, `items[].sourceRef.revision`, `holds[].events[].sourceRef.revision`, `holds[].version`, `resolutionPlans[].version`, `resolutionPlans[].reviewDecisions[].revision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stock_scrap_records

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.approvedRevision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stocktakes

Bỏ 2 trường: `revision`, `resolutionPlans[].revision`.

Các trường phiên bản giữ lại: `version`, `header.scopeVersion`, `resolutionPlans[].version`, `resolutionPlans[].header.planVersion`, `resolutionPlans[].header.scopeVersion`, `resolutionPlans[].reviewDecisions[].revision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stock_adjustments

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## failed_deliveries

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## failed_delivery_receipts

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `demandReopenings[].sourceVersion`, `commitmentTransfers[].sourceVersion`, `commitmentTransfers[].targetVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stock_quality_changes

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## customer_returns

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `decisions[].revision`, `inspections[].returnVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## customer_return_receipts

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## supplier_returns

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `agreements[].version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## supplier_return_issues

Bỏ 2 trường: `revision`, `acknowledgements[].revision`.

Các trường phiên bản giữ lại: `version`, `acknowledgements[].version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stock_discrepancies

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.sourceRef.revision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## custody_receipts

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## custody_releases

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## stock_reversals

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.sourceDocument.revision`, `header.sourceVersion`, `header.replacementDocument.revision`, `approvalDecision.revision`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## opening_stocks

Bỏ 1 trường: `revision`.

Các trường phiên bản giữ lại: `version`, `header.verifiedVersion`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

## sales_invoices

Bỏ 0 trường: không có trường chứng minh là thừa.

Các trường phiên bản giữ lại: `version`.

Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.

Tổng cộng bỏ 44 đường dẫn trường trên 58 collection (tính riêng các phần nhúng). DB mẫu: localhost:27017/wmsd_demo_tile_shop_v5. Các DB v3/v4 là mốc lịch sử.
