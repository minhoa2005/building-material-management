/**
 * Dữ liệu mẫu: kho và tài khoản đăng nhập cho 5 vai trò.
 *
 * Quy trình đề xuất 2 (§1.2): 1 cửa hàng, tối thiểu 3 kho, có điều chuyển liên kho.
 * Có 2 tài khoản Warehouse với phạm vi kho khác nhau để kiểm thử quy tắc
 * "người nhận điều chuyển phải khác người xuất" (BR-12, UC-43/UC-104).
 *
 * CHỈ dùng cho môi trường dev/test. Đổi mật khẩu ngay khi triển khai thật.
 */

export const SEED_WAREHOUSES = [
  { code: 'WH01', name: 'Kho chính', address: 'Kho trung tâm - cửa hàng CeraTile' },
  { code: 'WH02', name: 'Kho số 2', address: 'Kho vệ tinh số 2' },
  { code: 'WH03', name: 'Kho số 3', address: 'Kho vệ tinh số 3' },
];

const ALL_WAREHOUSES = SEED_WAREHOUSES.map((w) => w.code);

export const SEED_ACCOUNTS = [
  {
    roleCode: 'ADMIN',
    username: 'admin@ceratile.vn',
    fullName: 'Quản trị viên',
    password: 'Admin@123',
    phone: '0901234567',
    // Admin chỉ quản trị tài khoản/quyền, không có phạm vi kho nghiệp vụ.
    warehouseCodes: [],
  },
  {
    roleCode: 'OWNER',
    username: 'owner@ceratile.vn',
    fullName: 'Chủ cửa hàng',
    password: 'Owner@123',
    phone: '0901234568',
    warehouseCodes: ALL_WAREHOUSES,
  },
  {
    roleCode: 'SALES',
    username: 'sales@ceratile.vn',
    fullName: 'Nhân viên Bán hàng',
    password: 'Sales@123',
    phone: '0901234569',
    warehouseCodes: ALL_WAREHOUSES,
  },
  {
    roleCode: 'WAREHOUSE',
    username: 'warehouse@ceratile.vn',
    fullName: 'Thủ kho & Điều phối',
    password: 'Kho@12345678',
    phone: '0901234570',
    warehouseCodes: ['WH01', 'WH02'],
  },
  {
    roleCode: 'WAREHOUSE',
    username: 'warehouse2@ceratile.vn',
    fullName: 'Thủ kho số 2',
    password: 'Kho2@12345678',
    phone: '0901234572',
    warehouseCodes: ['WH02', 'WH03'],
  },
  {
    roleCode: 'ACCOUNTANT',
    username: 'accountant@ceratile.vn',
    fullName: 'Kế toán công nợ',
    password: 'KeToan@123',
    phone: '0901234571',
    warehouseCodes: ALL_WAREHOUSES,
  },
];
