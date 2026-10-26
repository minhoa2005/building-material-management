# ERD khái niệm rút gọn — các thực thể cốt lõi WMSD

14 thực thể: 7 thực thể danh mục/quản trị và 7 thực thể nghiệp vụ. Sơ đồ thể hiện góc nhìn tổng quan, với các bảng dòng và bảng trung gian được rút gọn thành nhóm thuộc tính hoặc quan hệ. Đối chiếu thiết kế chi tiết tại [SQL schema](../WMSD_SQL_schema.sql).

```mermaid
%% 14 conceptual entities for reporting.
%% attr is only a Mermaid syntax placeholder, not a physical data type.
%% Items retain source-linked lines and quantities. SO -> GI is traced THROUGH WIR/OD.
%% Each SalesOrder requires one CUSTOMER Party; each PurchaseOrder requires one SUPPLIER Party.
erDiagram
    direction LR
    Warehouse ||--o{ Location : "containing"
    User }o--o{ Warehouse : "accessing"
    Uom ||--o{ Product : "base unit"
    Product }o--o{ Uom : "converting"
    Product ||--o{ Lot : "identifying"
    Lot ||--o{ StockBalance : "distinguishing"
    Location |o--o{ StockBalance : "holding"
    StockBalance |o--o{ StockMovement : "decreasing"
    StockBalance |o--o{ StockMovement : "increasing"
    Lot ||--o{ StockMovement : "tracing"
    User ||--o{ StockMovement : "posting"
    Party ||--o{ PurchaseOrder : "supplying"
    Warehouse ||--o{ PurchaseOrder : "expecting"
    PurchaseOrder }o--o{ Product : "ordering"
    PurchaseOrder |o--o{ GoodsReceipt : "receiving"
    Warehouse ||--o{ GoodsReceipt : "receiving"
    GoodsReceipt }o--o{ Lot : "receiving"
    GoodsReceipt }o--o{ Location : "using"
    GoodsReceipt |o--o{ StockMovement : "recording"
    Party ||--o{ SalesOrder : "ordering"
    SalesOrder }o--o{ Product : "ordering"
    SalesOrder |o--o{ GoodsIssue : "fulfilling"
    Warehouse ||--o{ GoodsIssue : "issuing"
    GoodsIssue }o--o{ Lot : "issuing"
    GoodsIssue }o--o{ Location : "using"
    GoodsIssue |o--o{ StockMovement : "recording"
    Warehouse ||--o{ Stocktake : "hosting"
    Stocktake }o--o{ Location : "scoping"
    Stocktake }o--o{ Lot : "counting"
    Stocktake |o--o{ StockMovement : "resolving"
    User ||--o{ SalesOrder : "creating"
    User ||--o{ PurchaseOrder : "creating"
    User ||--o{ Stocktake : "planning"

    User {
        attr Username
        attr FullName
        attr Roles
        attr AccountStatus
    }

    Warehouse {
        attr Code
        attr Name
        attr Address
        attr Status
    }

    Location {
        attr Code
        attr LocationType
        attr Allocatable
        attr Status
    }

    Product {
        attr SKU
        attr Name
        attr NominalSize
        attr Status
    }

    Uom {
        attr Code
        attr Name
    }

    Lot {
        attr ManufacturerLotNo
        attr ToneCode
        attr CalibreCode
        attr ProductionDate
    }

    Party {
        attr Code
        attr Name
        attr PartnerType
        attr Contact
        attr Status
    }

    StockBalance {
        attr StockBucket
        attr Quality
        attr Quantity
        attr Reservations
        attr DefectHolds
        attr TransitReference
    }

    StockMovement {
        attr EventType
        attr Quantity
        attr SourceAccount
        attr DestinationAccount
        attr SourceLineReference
        attr PostedAt
    }

    PurchaseOrder {
        attr OrderNo
        attr OrderDate
        attr ExpectedDate
        attr ApprovedDemandReference
        attr Items
        attr SupplierConfirmation
        attr Status
    }

    GoodsReceipt {
        attr ReceiptNo
        attr ReceiptType
        attr ReceivedAt
        attr SourceReference
        attr Items
        attr InspectionEvidence
        attr ReturnClaims
        attr AcceptanceDecision
        attr DemandReopening
        attr Status
    }

    SalesOrder {
        attr OrderNo
        attr ExternalOrderReference
        attr Version
        attr DeliveryContact
        attr NeedDate
        attr Items
        attr NetFulfilment
        attr ReopenedDemand
        attr ODCommitmentTransfers
        attr Status
    }

    GoodsIssue {
        attr IssueNo
        attr IssueType
        attr SourceReference
        attr PlannedItems
        attr IssuedItems
        attr Handover
        attr Status
    }

    Stocktake {
        attr CountNo
        attr Scope
        attr FrozenAt
        attr SnapshotItems
        attr CountAttempts
        attr DefectHolds
        attr ResolutionPlans
        attr ExecutionEvidence
        attr ClosureBatch
        attr Status
    }
```

`attr` chỉ là token cú pháp Mermaid, không phải kiểu dữ liệu. [Bản HTML](erd.html) không hiển thị cột này.

Mỗi SalesOrder bắt buộc gắn một Party loại CUSTOMER. Quan hệ quy đổi giữa Product và Uom được thể hiện tổng quát; hệ số và lịch sử phiên bản được lưu trong `ProductUomVersion` ở thiết kế chi tiết.

Quan hệ SalesOrder–GoodsIssue là truy vết qua SO → WIR → OD → GI-S. Các thực thể điều chuyển, trả hàng, giao nhận và xác nhận thanh toán không có ô riêng trong góc nhìn này; quan hệ trên hình có thể tổng hợp qua nhiều bảng, không nhất thiết là FK trực tiếp.
Tên trong sơ đồ được đối chiếu với model MongoDB hiện tại: `Party`, `Lot`, `Uom` và `StockBalance`. `PurchaseOrder`, `GoodsReceipt`, `SalesOrder`, `GoodsIssue` và `Stocktake` là các khái niệm nghiệp vụ trong sơ đồ; backend biểu diễn chúng bằng các loại `BusinessDocument`, không phải model hay collection riêng. `StockBalance` chỉ đại diện phần số dư trong khái niệm tồn kho tổng hợp; tài khoản tồn, giữ hàng và các thành phần liên quan được lưu riêng.
