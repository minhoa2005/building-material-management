# ERD khái niệm rút gọn — các thực thể cốt lõi WMSD

14 thực thể: 7 thực thể danh mục/quản trị và 7 thực thể nghiệp vụ. Sơ đồ thể hiện góc nhìn tổng quan, với các bảng dòng và bảng trung gian được rút gọn thành nhóm thuộc tính hoặc quan hệ. Đối chiếu thiết kế chi tiết tại [SQL schema](../WMSD_SQL_schema.sql).

```mermaid
%% 14 conceptual entities: original ERD after README merges + identified master data.
%% attr is only a Mermaid syntax placeholder, not a physical data type.
%% Items retain source-linked lines and quantities. SO -> GI is traced THROUGH WIR/OD.
%% Each SalesOrder requires one CUSTOMER Partner; each PurchaseOrder requires one SUPPLIER Partner.
erDiagram
    direction LR
    Warehouse ||--o{ Location : "containing"
    User }o--o{ Warehouse : "accessing"
    Product ||--|{ ProductConversion : "using"
    Product ||--o{ ProductLot : "identifying"
    ProductLot ||--o{ Inventory : "distinguishing"
    Location |o--o{ Inventory : "holding"
    Inventory |o--o{ StockMovement : "decreasing"
    Inventory |o--o{ StockMovement : "increasing"
    ProductLot ||--o{ StockMovement : "tracing"
    User ||--o{ StockMovement : "posting"
    Partner ||--o{ PurchaseOrder : "supplying"
    Warehouse ||--o{ PurchaseOrder : "expecting"
    PurchaseOrder }o--o{ Product : "ordering"
    PurchaseOrder |o--o{ GoodsReceipt : "receiving"
    Warehouse ||--o{ GoodsReceipt : "receiving"
    GoodsReceipt }o--o{ ProductLot : "receiving"
    GoodsReceipt }o--o{ Location : "using"
    GoodsReceipt |o--o{ StockMovement : "recording"
    Partner ||--o{ SalesOrder : "ordering"
    SalesOrder }o--o{ Product : "ordering"
    SalesOrder |o--o{ GoodsIssue : "fulfilling"
    Warehouse ||--o{ GoodsIssue : "issuing"
    GoodsIssue }o--o{ ProductLot : "issuing"
    GoodsIssue }o--o{ Location : "using"
    GoodsIssue |o--o{ StockMovement : "recording"
    Warehouse ||--o{ StockCount : "hosting"
    StockCount }o--o{ Location : "scoping"
    StockCount }o--o{ ProductLot : "counting"
    StockCount |o--o{ StockMovement : "resolving"
    User ||--o{ SalesOrder : "creating"
    User ||--o{ PurchaseOrder : "creating"
    User ||--o{ StockCount : "planning"

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

    ProductConversion {
        attr Unit
        attr BasePerUnit
        attr Version
        attr EffectiveFrom
    }

    ProductLot {
        attr ManufacturerLotNo
        attr ToneCode
        attr CalibreCode
        attr ProductionDate
    }

    Partner {
        attr Code
        attr Name
        attr PartnerType
        attr Contact
        attr Status
    }

    Inventory {
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

    StockCount {
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

`Unit`, `BasePerUnit`, `Version`, `EffectiveFrom` tương ứng với `uom_code`, `base_per_unit`, `version`, `valid_from` trong `product_uom_version`. Mỗi SalesOrder bắt buộc gắn một Partner loại CUSTOMER.

Quan hệ SalesOrder–GoodsIssue là truy vết qua SO → WIR → OD → GI-S. Các thực thể điều chuyển, trả hàng, giao nhận và xác nhận thanh toán không có ô riêng trong góc nhìn này; quan hệ trên hình có thể tổng hợp qua nhiều bảng, không nhất thiết là FK trực tiếp.
