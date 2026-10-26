/**
 * Danh mục quyền nghiệp vụ (operation permission) và ma trận gán quyền mặc định cho 5 vai trò.
 *
 * Nguồn:
 *  - WMSD_Report3_Fix §4.4 Permission Matrix (UC-01 … UC-111, bản 3.1.0).
 *  - WMSD_Thiet_ke_he_thong_chi_tiet §2 + Phụ lục A (truy vết 111 UC).
 *  - de_xuat_quy_trinh_2_EN §3 (Actors and authorization) và §6 (business permission matrix).
 *
 * Quy ước mã quyền: `<resource>:<action>`.
 * Quyền ở đây chỉ là lớp "role + operation". Các ràng buộc còn lại (kho được giao, trạng thái/version
 * chứng từ, người lập ≠ người duyệt, người nhận điều chuyển ≠ người xuất…) phải được kiểm tra ở service.
 *
 * UC đã RETIRED (UC-23–25, 42, 59–62, 74–78, 106) KHÔNG có quyền tương ứng.
 */

export const ROLE = Object.freeze({
  OWNER: 'OWNER',
  SALES: 'SALES',
  WAREHOUSE: 'WAREHOUSE',
  ACCOUNTANT: 'ACCOUNTANT',
  ADMIN: 'ADMIN',
});

const { OWNER, SALES, WAREHOUSE, ACCOUNTANT, ADMIN } = ROLE;
const BUSINESS_ROLES = [OWNER, ACCOUNTANT, WAREHOUSE, SALES];

/**
 * Mỗi phần tử: { code, description, uc, roles }
 *  - uc: các use case được truy vết.
 *  - roles: vai trò được cấp mặc định.
 */
export const PERMISSION_CATALOGUE = [
  // ---------- FE-01: Bổ sung hàng, mua hàng, nhập kho (BF-01) ----------
  { code: 'replenishment_request:read', description: 'Xem danh sách/chi tiết yêu cầu bổ sung hàng (RR)', uc: ['UC-01', 'UC-02'], roles: BUSINESS_ROLES },
  { code: 'replenishment_request:create', description: 'Tạo yêu cầu bổ sung hàng', uc: ['UC-03'], roles: [WAREHOUSE, SALES] },
  { code: 'replenishment_request:update', description: 'Sửa/gửi lại RR nháp của mình', uc: ['UC-03'], roles: [WAREHOUSE, SALES] },
  { code: 'replenishment_request:approve', description: 'Duyệt/từ chối/trả lại RR (không phải người lập)', uc: ['UC-04'], roles: [OWNER] },

  { code: 'purchase_order:read', description: 'Xem PO (Warehouse chỉ trong phạm vi nhận hàng)', uc: ['UC-05', 'UC-06'], roles: [OWNER, ACCOUNTANT, WAREHOUSE] },
  { code: 'purchase_order:create', description: 'Lập PO từ RR đã duyệt', uc: ['UC-07'], roles: [ACCOUNTANT] },
  { code: 'purchase_order:update', description: 'Cập nhật PO và xác nhận của nhà cung cấp', uc: ['UC-07'], roles: [ACCOUNTANT] },

  { code: 'goods_receipt_inspection:read', description: 'Xem phiếu nhập/kiểm nhận', uc: ['UC-08', 'UC-09'], roles: [OWNER, ACCOUNTANT, WAREHOUSE] },
  { code: 'goods_receipt_inspection:create', description: 'Tạo phiếu nhập từ PO tại kho được giao', uc: ['UC-10'], roles: [WAREHOUSE] },
  { code: 'goods_receipt_inspection:update', description: 'Ghi kết quả kiểm nhận', uc: ['UC-26'], roles: [WAREHOUSE] },
  { code: 'goods_receipt_inspection:post', description: 'Post nhập kho (GR) sau kiểm nhận', uc: ['UC-26'], roles: [WAREHOUSE] },

  { code: 'putaway_task:read', description: 'Xem nhiệm vụ cất hàng', uc: ['UC-32', 'UC-33'], roles: [OWNER, WAREHOUSE] },
  { code: 'putaway_task:create', description: 'Tạo nhiệm vụ cất hàng', uc: ['UC-32'], roles: [WAREHOUSE] },
  { code: 'putaway_task:confirm', description: 'Xác nhận cất hàng thực tế', uc: ['UC-33'], roles: [WAREHOUSE] },

  // ---------- FE-02: Dữ liệu chủ ----------
  { code: 'product:read', description: 'Xem sản phẩm', uc: ['UC-11', 'UC-12'], roles: BUSINESS_ROLES },
  { code: 'product:create', description: 'Tạo sản phẩm/quy cách', uc: ['UC-13'], roles: [OWNER] },
  { code: 'product:update', description: 'Cập nhật sản phẩm/quy cách/ngưỡng', uc: ['UC-13'], roles: [OWNER] },

  { code: 'product_lot:read', description: 'Xem lô hàng', uc: ['UC-14', 'UC-15'], roles: [OWNER, WAREHOUSE] },
  { code: 'product_lot:create', description: 'Tạo lô hàng', uc: ['UC-16'], roles: [OWNER, WAREHOUSE] },
  { code: 'product_lot:update', description: 'Cập nhật lô hàng (Warehouse chỉ được tạo)', uc: ['UC-16'], roles: [OWNER] },

  { code: 'supplier:read', description: 'Xem nhà cung cấp', uc: ['UC-17', 'UC-18'], roles: [OWNER, ACCOUNTANT] },
  { code: 'supplier:create', description: 'Tạo nhà cung cấp', uc: ['UC-19'], roles: [ACCOUNTANT] },
  { code: 'supplier:update', description: 'Cập nhật thông tin nhà cung cấp', uc: ['UC-19'], roles: [ACCOUNTANT] },
  { code: 'supplier:activate', description: 'Kích hoạt/ngừng nhà cung cấp', uc: ['UC-19'], roles: [OWNER] },

  { code: 'customer:read', description: 'Xem khách hàng (theo phạm vi)', uc: ['UC-20', 'UC-21'], roles: BUSINESS_ROLES },
  { code: 'customer:create', description: 'Tạo khách hàng (liên hệ/địa chỉ giao)', uc: ['UC-22'], roles: [SALES] },
  { code: 'customer:update', description: 'Cập nhật liên hệ/địa chỉ giao', uc: ['UC-22'], roles: [SALES] },

  // ---------- FE-04: Kho, vị trí, tồn kho, chuyển vị trí (BF-03) ----------
  { code: 'warehouse_location:read', description: 'Xem kho và vị trí', uc: ['UC-27', 'UC-28'], roles: [OWNER, WAREHOUSE] },
  { code: 'warehouse_location:create', description: 'Tạo vị trí lưu trữ', uc: ['UC-29'], roles: [OWNER] },
  { code: 'warehouse_location:update', description: 'Cập nhật vị trí lưu trữ', uc: ['UC-29'], roles: [OWNER] },

  { code: 'inventory:read', description: 'Xem tồn theo lô/vị trí/chất lượng (theo phạm vi)', uc: ['UC-30', 'UC-31'], roles: BUSINESS_ROLES },

  { code: 'stock_relocation:read', description: 'Xem lệnh chuyển vị trí cùng kho', uc: ['UC-34', 'UC-35'], roles: [OWNER, WAREHOUSE] },
  { code: 'stock_relocation:create', description: 'Tạo lệnh chuyển vị trí', uc: ['UC-36'], roles: [WAREHOUSE] },
  { code: 'stock_relocation:confirm', description: 'Xác nhận chuyển vị trí thực tế', uc: ['UC-37'], roles: [WAREHOUSE] },

  // ---------- FE-05: Điều chuyển liên kho (BF-04) ----------
  { code: 'stock_transfer:read', description: 'Xem điều chuyển liên kho (theo phạm vi)', uc: ['UC-38', 'UC-39'], roles: BUSINESS_ROLES },
  { code: 'stock_transfer:create', description: 'Tạo yêu cầu điều chuyển (TR)', uc: ['UC-40'], roles: [WAREHOUSE] },
  { code: 'stock_transfer:update', description: 'Sửa TR nháp / đề xuất xử lý chênh lệch', uc: ['UC-40', 'UC-44'], roles: [WAREHOUSE] },
  { code: 'stock_transfer:approve', description: 'Duyệt/từ chối/trả lại TR (không phải người lập)', uc: ['UC-41'], roles: [OWNER] },
  { code: 'stock_transfer:dispatch', description: 'Ghi xuất điều chuyển tại kho nguồn', uc: ['UC-43'], roles: [WAREHOUSE] },
  { code: 'stock_transfer:receive', description: 'Kiểm nhận và post nhập tại kho đích (khác người xuất)', uc: ['UC-104'], roles: [WAREHOUSE] },
  { code: 'stock_transfer:approve_variance', description: 'Duyệt phương án xử lý chênh lệch điều chuyển', uc: ['UC-44'], roles: [OWNER] },

  // ---------- FE-06: Bán hàng, xuất kho, giao hàng (BF-06) ----------
  { code: 'sales_order:read', description: 'Xem SO sao chép (theo phạm vi)', uc: ['UC-45', 'UC-46'], roles: BUSINESS_ROLES },
  { code: 'sales_order:create', description: 'Tạo SO sao chép từ nguồn ngoài đã xác minh', uc: ['UC-47'], roles: [SALES] },
  { code: 'sales_order:update', description: 'Sửa/hủy phần SO chưa xuất', uc: ['UC-48'], roles: [SALES] },

  { code: 'issue_request:read', description: 'Xem yêu cầu xuất kho liên kết (WIR)', uc: ['UC-109'], roles: BUSINESS_ROLES },
  { code: 'issue_request:create', description: 'Tạo WIR / nhu cầu ròng tái mở', uc: ['UC-109'], roles: [SALES] },
  { code: 'issue_request:update', description: 'Sửa/hủy phần WIR đủ điều kiện', uc: ['UC-109'], roles: [SALES] },

  { code: 'outbound_delivery:read', description: 'Xem lệnh giao hàng (OD)', uc: ['UC-49', 'UC-50'], roles: BUSINESS_ROLES },
  { code: 'outbound_delivery:create', description: 'Lập OD', uc: ['UC-51'], roles: [SALES] },
  { code: 'outbound_delivery:update', description: 'Cập nhật/tái sử dụng cam kết OD', uc: ['UC-51'], roles: [SALES] },

  { code: 'picking_task:read', description: 'Xem nhiệm vụ soạn hàng', uc: ['UC-52', 'UC-53'], roles: BUSINESS_ROLES },
  { code: 'picking_task:create', description: 'Tạo nhiệm vụ soạn hàng', uc: ['UC-54'], roles: [WAREHOUSE] },
  { code: 'picking_task:confirm', description: 'Xác nhận soạn hàng', uc: ['UC-55'], roles: [WAREHOUSE] },

  { code: 'goods_issue:read', description: 'Xem phiếu xuất bán (GI-S)', uc: ['UC-56', 'UC-57'], roles: BUSINESS_ROLES },
  { code: 'goods_issue:create', description: 'Lập GI-S nháp trước khi soạn', uc: ['UC-58'], roles: [WAREHOUSE] },
  { code: 'goods_issue:post', description: 'Post xuất kho (PGI) khi bàn giao thực tế', uc: ['UC-58'], roles: [WAREHOUSE] },

  { code: 'fulfilment_option:read', description: 'Xem phương án đáp ứng thiếu hàng', uc: ['UC-103'], roles: [OWNER, WAREHOUSE, SALES] },
  { code: 'fulfilment_option:select', description: 'Chọn phương án tồn / xác nhận với khách', uc: ['UC-103'], roles: [WAREHOUSE, SALES] },

  { code: 'delivery_confirmation:read', description: 'Xem xác nhận giao hàng (POD)', uc: ['UC-110'], roles: BUSINESS_ROLES },
  { code: 'delivery_confirmation:confirm', description: 'Xác nhận/sửa POD kèm ảnh tại kho được giao', uc: ['UC-110'], roles: [WAREHOUSE] },

  { code: 'payment_confirmation:read', description: 'Xem xác nhận thu tiền (PAY-CFM)', uc: ['UC-111'], roles: BUSINESS_ROLES },
  { code: 'payment_confirmation:confirm', description: 'Xác nhận đã thu đủ tiền ngoài sau DELIVERED', uc: ['UC-111'], roles: [SALES] },

  // ---------- FE-07: Hàng lỗi, trả hàng (BF-02, BF-07, BF-08) ----------
  { code: 'defect:read', description: 'Xem hàng lỗi', uc: ['UC-63', 'UC-64'], roles: [OWNER, WAREHOUSE] },
  { code: 'defect:create', description: 'Kiểm tra, cách ly và đề xuất xử lý hàng lỗi', uc: ['UC-65'], roles: [WAREHOUSE] },
  { code: 'defect:approve', description: 'Duyệt hủy/đổi phẩm cấp/giải phóng ngoài kiểm kê', uc: ['UC-66'], roles: [OWNER] },
  { code: 'defect:execute', description: 'Thực hiện xử lý hàng lỗi đã duyệt', uc: ['UC-67'], roles: [WAREHOUSE] },

  { code: 'customer_return:read', description: 'Xem trả hàng/giao thất bại (theo phạm vi)', uc: ['UC-68', 'UC-69'], roles: BUSINESS_ROLES },
  { code: 'customer_return:create', description: 'Tạo yêu cầu khách trả hàng (CR)', uc: ['UC-70'], roles: [SALES] },
  { code: 'customer_return:accept', description: 'Chấp nhận/từ chối CR thông thường sau kiểm (được là người lập)', uc: ['UC-71'], roles: [SALES] },
  { code: 'customer_return:approve_exception', description: 'Duyệt CR ngoại lệ (không phải người lập)', uc: ['UC-71'], roles: [OWNER] },
  { code: 'customer_return:inspect', description: 'Kiểm tra hàng trả / giao thất bại', uc: ['UC-72'], roles: [WAREHOUSE] },
  { code: 'customer_return:post', description: 'Post GR-CR / GR-FD', uc: ['UC-73'], roles: [WAREHOUSE] },

  { code: 'supplier_return:read', description: 'Xem yêu cầu trả nhà cung cấp (SR)', uc: ['UC-79', 'UC-80'], roles: [OWNER, ACCOUNTANT, WAREHOUSE] },
  { code: 'supplier_return:create', description: 'Đề xuất trả NCC / cách ly', uc: ['UC-81'], roles: [WAREHOUSE] },
  { code: 'supplier_return:update', description: 'Sửa SR nháp', uc: ['UC-81'], roles: [WAREHOUSE] },
  { code: 'supplier_return:dispatch', description: 'Post xuất trả NCC (GI-SR) theo thỏa thuận', uc: ['UC-82'], roles: [WAREHOUSE] },
  { code: 'supplier_return:record_agreement', description: 'Ghi thỏa thuận NCC / biên nhận (ACK)', uc: ['UC-107'], roles: [ACCOUNTANT] },
  { code: 'supplier_return:close', description: 'Đối chiếu và đóng phần kho SR (không cần Owner)', uc: ['UC-83'], roles: [ACCOUNTANT] },

  // ---------- FE-08: Kiểm kê, điều chỉnh (BF-05) ----------
  { code: 'stocktake:read', description: 'Xem phiên kiểm kê', uc: ['UC-84', 'UC-85'], roles: [OWNER, WAREHOUSE] },
  { code: 'stocktake:create', description: 'Lập kế hoạch phiên kiểm kê', uc: ['UC-86'], roles: [OWNER] },
  { code: 'stocktake:update', description: 'Đếm/đếm lại và ghi kết quả trong phạm vi khóa', uc: ['UC-87'], roles: [WAREHOUSE] },
  { code: 'stocktake:reconcile', description: 'Đối chiếu kết quả kiểm kê', uc: ['UC-88'], roles: [WAREHOUSE] },
  { code: 'stocktake:export', description: 'Xuất/in phiếu đếm', uc: ['UC-105'], roles: [OWNER, WAREHOUSE] },

  { code: 'stock_adjustment:read', description: 'Xem đề xuất điều chỉnh tồn', uc: ['UC-89', 'UC-90'], roles: [OWNER, WAREHOUSE] },
  { code: 'stock_adjustment:create', description: 'Đề xuất điều chỉnh B1 (delta/RECLASS/vị trí)', uc: ['UC-91'], roles: [WAREHOUSE] },
  { code: 'stock_adjustment:update', description: 'Sửa đề xuất / xác nhận đã thực hiện', uc: ['UC-91'], roles: [WAREHOUSE] },
  { code: 'stock_adjustment:approve', description: 'Duyệt/trả lại phương án B1 (không phải người lập)', uc: ['UC-92'], roles: [OWNER] },
  { code: 'stock_adjustment:post', description: 'Post batch B1 đã duyệt và mở khóa phạm vi', uc: ['UC-93'], roles: [OWNER] },

  // ---------- FE-09: Báo cáo, truy vết, tham chiếu ngoài, quản trị ----------
  { code: 'report:read', description: 'Xem báo cáo vận hành (theo nhóm báo cáo)', uc: ['UC-99'], roles: [OWNER, ACCOUNTANT, WAREHOUSE] },
  { code: 'stock_movement:read', description: 'Xem nhật ký biến động tồn và truy vết lô', uc: ['UC-100', 'UC-101', 'UC-102'], roles: [OWNER, ACCOUNTANT, WAREHOUSE] },
  { code: 'external_reference:read', description: 'Xem tham chiếu chứng từ ngoài (Invoice/Credit Note)', uc: ['UC-108'], roles: [ACCOUNTANT] },
  { code: 'external_reference:create', description: 'Ghi tham chiếu chứng từ ngoài', uc: ['UC-108'], roles: [ACCOUNTANT] },

  { code: 'user:read', description: 'Xem tài khoản', uc: ['UC-95', 'UC-96'], roles: [ADMIN] },
  { code: 'user:create', description: 'Tạo tài khoản nhân viên', uc: ['UC-97'], roles: [ADMIN] },
  { code: 'user:update', description: 'Cập nhật/khóa tài khoản nhân viên', uc: ['UC-97'], roles: [ADMIN] },
  { code: 'access_control:read', description: 'Xem vai trò và quyền', uc: ['UC-98'], roles: [ADMIN] },
  { code: 'access_control:create', description: 'Gán vai trò/kho cho tài khoản', uc: ['UC-98'], roles: [ADMIN] },
  { code: 'access_control:update', description: 'Cập nhật quyền của vai trò', uc: ['UC-98'], roles: [ADMIN] },
];

export const PERMISSION_CODES = PERMISSION_CATALOGUE.map((p) => p.code);

/** Ma trận mặc định: { ROLE_CODE: [permissionCode, ...] } */
export const ROLE_PERMISSIONS = Object.freeze(
  Object.values(ROLE).reduce((acc, role) => {
    acc[role] = PERMISSION_CATALOGUE.filter((p) => p.roles.includes(role)).map((p) => p.code);
    return acc;
  }, {}),
);
