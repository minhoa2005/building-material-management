-- WMSD relational analysis/reference DDL, 2026-10-25. NOT a production schema.
-- Runtime persistence remains MongoDB (NoSQL), per Report 3 and the system design.
-- SQL Server (T-SQL) syntax is used only to make the proposed relational model executable for review.
-- Schema only: posting/approval services and authorization are NOT implemented here.
-- Read the VI/EN proposal for cross-row rules and transaction boundaries.
-- Self-contained SQL Server reference DDL for design review only; never run as the MongoDB runtime schema.
-- Survey alignment 2026-10-20: D1-D5 retain PGI, departmental entry, five roles,
-- independent transfers and FROZEN stocktake. D6 adds versioned return assessment.
-- D7 does not seed invented warehouse names, conversion factors or return periods.
-- Revision 3.1.0, 2026-10-25: A1 failed-delivery receipt/net reopening; B1
-- stocktake hold/resolution/RECLASS; C2 ordinary Sales acceptance; no BF-08 Owner.
-- Revision 3.0.0, 2026-10-22: eight processes; BF-03 relocation, BF-04 transfer.
-- Data revision 2.0.0, 2026-10-21: SO -> linked WIR -> PGI -> photo POD -> external receipt.
-- This replaces the earlier direct external-order-line -> WIR source contract.
BEGIN TRANSACTION;
GO
CREATE SCHEMA wmsd;
GO

CREATE TABLE wmsd.app_user (
 user_id bigint IDENTITY(1,1) PRIMARY KEY,
 username varchar(100) NOT NULL UNIQUE,
 display_name varchar(160) NOT NULL,
 credential_hash varchar(255) NOT NULL,
 active bit NOT NULL DEFAULT 1
);
CREATE TABLE wmsd.app_role (
 role_code varchar(30) PRIMARY KEY,
 CONSTRAINT ck_app_role_fixed CHECK(role_code IN ('OWNER','SALES','WAREHOUSE','ACCOUNTANT','ADMIN'))
);
INSERT INTO wmsd.app_role VALUES ('OWNER'),('SALES'),('WAREHOUSE'),('ACCOUNTANT'),('ADMIN');
CREATE TABLE wmsd.user_role (
 user_id bigint NOT NULL REFERENCES wmsd.app_user, role_code varchar(30) NOT NULL REFERENCES wmsd.app_role,
 PRIMARY KEY(user_id, role_code)
);
CREATE TABLE wmsd.permission (permission_code varchar(80) PRIMARY KEY);
CREATE TABLE wmsd.role_permission (
 role_code varchar(30) NOT NULL REFERENCES wmsd.app_role, permission_code varchar(80) NOT NULL REFERENCES wmsd.permission,
 PRIMARY KEY(role_code, permission_code)
);
CREATE TABLE wmsd.warehouse (
 warehouse_id bigint IDENTITY(1,1) PRIMARY KEY,
 code varchar(30) NOT NULL UNIQUE, name varchar(160) NOT NULL,
 address varchar(500), active bit NOT NULL DEFAULT 1
);
CREATE TABLE wmsd.user_warehouse (
 user_id bigint NOT NULL REFERENCES wmsd.app_user, warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 PRIMARY KEY(user_id, warehouse_id)
);
CREATE TABLE wmsd.location (
 location_id bigint IDENTITY(1,1) PRIMARY KEY,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 code varchar(50) NOT NULL,
 location_kind varchar(20) NOT NULL CHECK(location_kind IN ('RECEIVING','STORAGE','STAGING','QUARANTINE','CUSTODY')),
 allocatable bit NOT NULL DEFAULT 0,
 active bit NOT NULL DEFAULT 1,
 UNIQUE(warehouse_id, code), UNIQUE(location_id, warehouse_id),
 CHECK(allocatable = 0 OR location_kind = 'STORAGE')
);
CREATE TABLE wmsd.party (
 party_id bigint IDENTITY(1,1) PRIMARY KEY,
 code varchar(40) NOT NULL UNIQUE, name varchar(200) NOT NULL,
 party_kind varchar(12) NOT NULL CHECK(party_kind IN ('STORE','SUPPLIER','CUSTOMER','CARRIER')),
 contact_reference varchar(500), active bit NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX one_store_party ON wmsd.party(party_kind) WHERE party_kind = 'STORE';
CREATE TABLE wmsd.uom (uom_code varchar(12) PRIMARY KEY, name varchar(60) NOT NULL);
INSERT INTO wmsd.uom VALUES ('PIECE','Piece'),('BOX','Box'),('M2','Square metre');
CREATE TABLE wmsd.product (
 product_id bigint IDENTITY(1,1) PRIMARY KEY,
 sku varchar(60) NOT NULL UNIQUE, name varchar(200) NOT NULL,
 base_uom varchar(12) NOT NULL REFERENCES wmsd.uom,
 whole_base_units bit NOT NULL DEFAULT 1,
 nominal_size varchar(60), active bit NOT NULL DEFAULT 1
);
CREATE TABLE wmsd.product_uom_version (
 conversion_id bigint IDENTITY(1,1) PRIMARY KEY,
 product_id bigint NOT NULL REFERENCES wmsd.product,
 uom_code varchar(12) NOT NULL REFERENCES wmsd.uom,
 version integer NOT NULL CHECK(version > 0),
 base_per_unit numeric(24,12) NOT NULL CHECK(base_per_unit > 0),
 valid_from datetimeoffset NOT NULL,
 UNIQUE(product_id, uom_code, version), UNIQUE(conversion_id, product_id)
);
CREATE TABLE wmsd.product_warehouse_policy (
 product_id bigint NOT NULL REFERENCES wmsd.product, warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 minimum_qty numeric(20,6) NOT NULL CHECK(minimum_qty >= 0),
 PRIMARY KEY(product_id, warehouse_id)
);
CREATE TABLE wmsd.lot (
 lot_id bigint IDENTITY(1,1) PRIMARY KEY,
 product_id bigint NOT NULL REFERENCES wmsd.product,
 manufacturer_lot varchar(100) NOT NULL,
 tone varchar(60) NOT NULL, calibre varchar(60) NOT NULL,
 identification_status varchar(12) NOT NULL CHECK(identification_status IN ('VERIFIED','UNKNOWN')),
 manufactured_on date,
 UNIQUE(product_id, manufacturer_lot, tone, calibre), UNIQUE(lot_id, product_id)
);
CREATE TABLE wmsd.quality_status (quality_code varchar(16) PRIMARY KEY, name varchar(100) NOT NULL);
INSERT INTO wmsd.quality_status VALUES ('PENDING','Awaiting inspection'),('GOOD','Accepted quality'),('DAMAGED','Damaged'),('BLOCKED','Blocked');

-- Relational document supertype: every business document has a real FK target.
CREATE TABLE wmsd.document (
 document_id bigint IDENTITY(1,1) PRIMARY KEY,
 document_no varchar(50) NOT NULL UNIQUE,
 document_kind varchar(30) NOT NULL CHECK(document_kind IN (
 'REPLENISHMENT','PO','ARRIVAL','INSPECTION','GR_PURCHASE','TO','TRANSFER_REQUEST',
 'TRANSFER_DISPATCH','MWTR','HANDOVER','SALES_ORDER','ISSUE_REQUEST','OUTBOUND_DELIVERY','GI_SALE',
 'DELIVERY_CONFIRMATION','PAYMENT_CONFIRMATION',
 'DEFECT_CASE','DISPOSITION','SCRAP','STOCKTAKE','ADJUSTMENT',
 'FAILED_DELIVERY','GR_FAILED_DELIVERY','ST_RESOLUTION','RECLASS',
 'CUSTOMER_RETURN','GR_CUSTOMER_RETURN','SUPPLIER_RETURN','GI_SUPPLIER_RETURN',
 'SUPPLIER_ACK','DISCREPANCY','CUSTODY_RECEIPT','CUSTODY_RELEASE','REVERSAL','OPENING')),
 workflow_status varchar(30) NOT NULL DEFAULT 'DRAFT',
 version integer NOT NULL DEFAULT 1 CHECK(version > 0),
 created_by bigint NOT NULL REFERENCES wmsd.app_user,
 created_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 occurred_at datetimeoffset,
 note varchar(2000),
 CONSTRAINT ck_sales_order_status CHECK(document_kind <> 'SALES_ORDER' OR workflow_status IN
   ('DRAFT','OPEN','IN_PROGRESS','PARTIALLY_DELIVERED','DELIVERED','COMPLETED','CANCELLED')),
 CONSTRAINT ck_customer_confirmation_status CHECK(document_kind NOT IN
   ('DELIVERY_CONFIRMATION','PAYMENT_CONFIRMATION') OR workflow_status IN ('DRAFT','CONFIRMED','VOIDED'))
);
CREATE TABLE wmsd.document_line (
 line_id bigint IDENTITY(1,1) PRIMARY KEY,
 document_id bigint NOT NULL REFERENCES wmsd.document,
 line_no integer NOT NULL CHECK(line_no > 0),
 product_id bigint NOT NULL REFERENCES wmsd.product,
 lot_id bigint,
 conversion_id bigint NOT NULL,
 entered_qty numeric(20,6) NOT NULL CHECK(entered_qty > 0),
 conversion_snapshot numeric(24,12) NOT NULL CHECK(conversion_snapshot > 0),
 qty_base numeric(20,6) NOT NULL CHECK(qty_base > 0),
 product_name_snapshot varchar(200) NOT NULL,
 UNIQUE(document_id, line_no), UNIQUE(line_id, document_id),
 UNIQUE(line_id, product_id),
 FOREIGN KEY(lot_id, product_id) REFERENCES wmsd.lot(lot_id, product_id),
 FOREIGN KEY(conversion_id, product_id) REFERENCES wmsd.product_uom_version(conversion_id, product_id),
 CHECK(qty_base = round(entered_qty * conversion_snapshot, 6))
);
CREATE TABLE wmsd.document_link (
 parent_document_id bigint NOT NULL REFERENCES wmsd.document,
 child_document_id bigint NOT NULL REFERENCES wmsd.document,
 relation_code varchar(30) NOT NULL,
 PRIMARY KEY(parent_document_id, child_document_id, relation_code),
 CHECK(parent_document_id <> child_document_id)
);
CREATE TABLE wmsd.line_link (
 source_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 target_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 relation_code varchar(30) NOT NULL,
 linked_qty numeric(20,6) NOT NULL CHECK(linked_qty > 0),
 PRIMARY KEY(source_line_id, target_line_id, relation_code),
 CHECK(source_line_id <> target_line_id)
);
CREATE TABLE wmsd.approval (
 approval_id bigint IDENTITY(1,1) PRIMARY KEY,
 document_id bigint NOT NULL REFERENCES wmsd.document,
 document_version integer NOT NULL CHECK(document_version > 0),
 decision_kind varchar(30) NOT NULL,
 decision varchar(12) NOT NULL CHECK(decision IN ('APPROVE','REJECT','REVISE')),
 requested_by bigint NOT NULL REFERENCES wmsd.app_user,
 decided_by bigint NOT NULL REFERENCES wmsd.app_user,
 decided_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 reason varchar(2000) NOT NULL,
 UNIQUE(document_id, document_version, decision_kind),
 -- STANDARD_ACCEPTANCE is the explicit C2 exception: Sales may decide own
 -- ordinary CR after Warehouse inspection. Service enforces CR kind, role,
 -- verified GOOD/UNUSED terms and latest assessment. All other approvals differ.
 CHECK(requested_by <> decided_by OR decision_kind = 'STANDARD_ACCEPTANCE')
);
CREATE TABLE wmsd.approval_line (
 approval_id bigint NOT NULL REFERENCES wmsd.approval, line_id bigint NOT NULL REFERENCES wmsd.document_line,
 approved_qty numeric(20,6) NOT NULL CHECK(approved_qty >= 0),
 outcome varchar(30) NOT NULL,
 PRIMARY KEY(approval_id, line_id)
);
CREATE TABLE wmsd.evidence (
 evidence_id bigint IDENTITY(1,1) PRIMARY KEY,
 document_id bigint NOT NULL REFERENCES wmsd.document,
 object_key varchar(600) NOT NULL, sha256 char(64) NOT NULL,
 media_type varchar(100) NOT NULL,
 uploaded_by bigint NOT NULL REFERENCES wmsd.app_user,
 uploaded_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 UNIQUE(evidence_id, document_id)
);
CREATE TABLE wmsd.external_reference (
 reference_id bigint IDENTITY(1,1) PRIMARY KEY,
 source_system varchar(50) NOT NULL,
 reference_kind varchar(40) NOT NULL,
 reference_no varchar(100) NOT NULL,
 reference_date date,
 source_version nvarchar(100),
 correlation_id varchar(100) NOT NULL UNIQUE
   CONSTRAINT ck_external_correlation CHECK(LEN(LTRIM(RTRIM(correlation_id))) > 0),
 verified_by bigint REFERENCES wmsd.app_user,
 verified_at datetimeoffset,
 UNIQUE(source_system, reference_kind, reference_no)
);
-- source_version is the external revision when supplied; never invent a provider
-- version. document.version tracks the internal verification/workflow version.
-- correlation_id is a stable WMS trace identity, not a fresh retry key.
CREATE TABLE wmsd.document_external_reference (
 document_id bigint NOT NULL REFERENCES wmsd.document, reference_id bigint NOT NULL REFERENCES wmsd.external_reference,
 PRIMARY KEY(document_id, reference_id)
);
CREATE TABLE wmsd.external_reference_line (
 external_line_id bigint IDENTITY(1,1) PRIMARY KEY,
 reference_id bigint NOT NULL REFERENCES wmsd.external_reference,
 line_key varchar(100) NOT NULL,
 product_id bigint NOT NULL REFERENCES wmsd.product,
 eligible_qty numeric(20,6) NOT NULL CHECK(eligible_qty >= 0),
 UNIQUE(reference_id, line_key), UNIQUE(external_line_id, reference_id)
);

-- Idempotent operations that do NOT post stock: SO/WIR entry, cancellations,
-- delivery confirmation and external receipt confirmation. Never create stock
-- movements solely to record one of these operations.
CREATE TABLE wmsd.business_operation (
 operation_id bigint IDENTITY(1,1) PRIMARY KEY,
 document_id bigint NOT NULL REFERENCES wmsd.document,
 operation varchar(40) NOT NULL CHECK(LEN(LTRIM(RTRIM(operation))) > 0),
 operation_key varchar(100) NOT NULL CHECK(LEN(LTRIM(RTRIM(operation_key))) > 0),
 idempotency_key varchar(120) NOT NULL UNIQUE CHECK(LEN(LTRIM(RTRIM(idempotency_key))) > 0),
 payload_hash char(64) NOT NULL,
 document_version integer NOT NULL CHECK(document_version > 0),
 performed_by bigint NOT NULL REFERENCES wmsd.app_user,
 performed_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 reason nvarchar(2000),
 UNIQUE(document_id, operation, operation_key), UNIQUE(operation_id, document_id)
);

-- Typed headers extend document; typed lines extend document_line.
CREATE TABLE wmsd.replenishment_request (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 needed_on date NOT NULL, trigger_reason varchar(200) NOT NULL
);
CREATE TABLE wmsd.purchase_order (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 supplier_id bigint NOT NULL REFERENCES wmsd.party,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 expected_on date, supplier_confirmation varchar(1000)
);
CREATE TABLE wmsd.arrival (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 supplier_id bigint REFERENCES wmsd.party,
 arrived_at datetimeoffset NOT NULL,
 delivery_reference varchar(100)
);
CREATE TABLE wmsd.inspection_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 inspected_source_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 quality_code varchar(16) NOT NULL REFERENCES wmsd.quality_status,
 ownership_decision varchar(12) NOT NULL CHECK(ownership_decision IN ('ACCEPT','CUSTODY','REJECT')),
 inspected_by bigint NOT NULL REFERENCES wmsd.app_user,
 inspected_at datetimeoffset NOT NULL,
 packaging_condition varchar(12) NOT NULL DEFAULT 'UNKNOWN'
   CONSTRAINT ck_inspection_packaging CHECK(packaging_condition IN ('SEALED','OPENED','TORN','UNKNOWN'))
);
-- Packaging observation is independent of quality and ownership. Actual accepted/
-- counted quantities use document_line and its conversion snapshot, not carton count.
CREATE TABLE wmsd.goods_receipt (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 receipt_kind varchar(20) NOT NULL CHECK(receipt_kind IN ('PURCHASE','CUSTOMER_RETURN','FAILED_DELIVERY'))
);
CREATE TABLE wmsd.transfer_request (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 source_warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 destination_warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 needed_on date,
 CHECK(source_warehouse_id <> destination_warehouse_id)
);
CREATE TABLE wmsd.transfer_dispatch (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 request_id bigint NOT NULL REFERENCES wmsd.transfer_request,
 dispatched_by bigint NOT NULL REFERENCES wmsd.app_user,
 dispatched_at datetimeoffset NOT NULL
);
CREATE TABLE wmsd.transfer_receipt (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 dispatch_id bigint NOT NULL REFERENCES wmsd.transfer_dispatch,
 received_by bigint NOT NULL REFERENCES wmsd.app_user,
 received_at datetimeoffset NOT NULL
);
CREATE TABLE wmsd.transfer_receipt_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 dispatch_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 quality_code varchar(16) NOT NULL REFERENCES wmsd.quality_status
);
CREATE TABLE wmsd.handover (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 related_document_id bigint NOT NULL REFERENCES wmsd.document,
 recipient_name varchar(160) NOT NULL,
 carrier_id bigint REFERENCES wmsd.party,
 handed_over_at datetimeoffset NOT NULL,
 confirmed_by bigint NOT NULL REFERENCES wmsd.app_user
);
CREATE TABLE wmsd.sales_order (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 external_reference_id bigint NOT NULL UNIQUE REFERENCES wmsd.external_reference,
 customer_id bigint NOT NULL REFERENCES wmsd.party,
 needed_on date NOT NULL,
 delivery_address_snapshot nvarchar(500) NOT NULL,
 UNIQUE(document_id, external_reference_id)
);
CREATE TABLE wmsd.sales_order_line (
 line_id bigint PRIMARY KEY,
 sales_order_id bigint NOT NULL,
 external_reference_id bigint NOT NULL,
 external_line_id bigint NOT NULL UNIQUE,
 required_tone varchar(60), required_calibre varchar(60),
 FOREIGN KEY(line_id, sales_order_id) REFERENCES wmsd.document_line(line_id, document_id),
 FOREIGN KEY(sales_order_id, external_reference_id)
   REFERENCES wmsd.sales_order(document_id, external_reference_id),
 FOREIGN KEY(external_line_id, external_reference_id)
   REFERENCES wmsd.external_reference_line(external_line_id, reference_id),
 UNIQUE(line_id, sales_order_id)
);
-- Append-only cancellation facts: unexecuted or GR-FD-received-back, not-redelivered quantity.
-- The service caps cumulative cancellations and releases/reduces unissued WIR/OD
-- commitments and reservations in the same transaction, without changing stock.
CREATE TABLE wmsd.sales_order_cancellation (
 cancellation_id bigint IDENTITY(1,1) PRIMARY KEY,
 sales_order_id bigint NOT NULL,
 sales_order_line_id bigint NOT NULL,
 cancelled_qty_base numeric(20,6) NOT NULL CHECK(cancelled_qty_base > 0),
 cancelled_by bigint NOT NULL REFERENCES wmsd.app_user,
 cancelled_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 reason nvarchar(2000) NOT NULL CHECK(LEN(LTRIM(RTRIM(reason))) > 0),
 operation_id bigint NOT NULL UNIQUE,
 FOREIGN KEY(sales_order_line_id, sales_order_id)
   REFERENCES wmsd.sales_order_line(line_id, sales_order_id),
 FOREIGN KEY(operation_id, sales_order_id)
   REFERENCES wmsd.business_operation(operation_id, document_id)
);
CREATE TABLE wmsd.issue_request (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 sales_order_id bigint NOT NULL REFERENCES wmsd.sales_order(document_id),
 requested_warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 needed_on date NOT NULL,
 delivery_address_snapshot nvarchar(500) NOT NULL,
 UNIQUE(document_id, sales_order_id)
);
CREATE TABLE wmsd.issue_request_line (
 line_id bigint PRIMARY KEY,
 issue_request_id bigint NOT NULL,
 sales_order_id bigint NOT NULL,
 sales_order_line_id bigint NOT NULL,
 release_key varchar(60) NOT NULL,
 required_tone varchar(60), required_calibre varchar(60),
 substitution_approval_reference varchar(300),
 FOREIGN KEY(line_id, issue_request_id) REFERENCES wmsd.document_line(line_id, document_id),
 FOREIGN KEY(issue_request_id, sales_order_id) REFERENCES wmsd.issue_request(document_id, sales_order_id),
 FOREIGN KEY(sales_order_line_id, sales_order_id) REFERENCES wmsd.sales_order_line(line_id, sales_order_id),
 UNIQUE(sales_order_line_id, release_key), UNIQUE(line_id, issue_request_id)
);
CREATE TABLE wmsd.outbound_delivery (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 issue_request_id bigint NOT NULL REFERENCES wmsd.issue_request,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 planned_on date NOT NULL,
 UNIQUE(document_id, issue_request_id)
);
CREATE TABLE wmsd.outbound_delivery_line (
 line_id bigint PRIMARY KEY,
 outbound_delivery_id bigint NOT NULL,
 issue_request_id bigint NOT NULL,
 issue_request_line_id bigint NOT NULL,
 FOREIGN KEY(line_id, outbound_delivery_id) REFERENCES wmsd.document_line(line_id, document_id),
 FOREIGN KEY(outbound_delivery_id, issue_request_id)
   REFERENCES wmsd.outbound_delivery(document_id, issue_request_id),
 FOREIGN KEY(issue_request_line_id, issue_request_id)
   REFERENCES wmsd.issue_request_line(line_id, issue_request_id)
);
CREATE TABLE wmsd.goods_issue (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 issue_kind varchar(20) NOT NULL CHECK(issue_kind IN ('SALE','SUPPLIER_RETURN'))
);
-- SALE-only subtype. Supplier-return GI lines retain their existing source model.
CREATE TABLE wmsd.sales_goods_issue_line (
 line_id bigint PRIMARY KEY,
 goods_issue_id bigint NOT NULL REFERENCES wmsd.goods_issue(document_id),
 outbound_delivery_line_id bigint NOT NULL REFERENCES wmsd.outbound_delivery_line(line_id),
 FOREIGN KEY(line_id, goods_issue_id) REFERENCES wmsd.document_line(line_id, document_id)
);
CREATE TABLE wmsd.customer_delivery (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 sales_order_id bigint NOT NULL REFERENCES wmsd.sales_order(document_id),
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 recipient_name nvarchar(160) NOT NULL CHECK(LEN(LTRIM(RTRIM(recipient_name))) > 0),
 delivered_at datetimeoffset NOT NULL,
 confirmed_by bigint NOT NULL REFERENCES wmsd.app_user,
 confirmed_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 operation_id bigint NOT NULL UNIQUE,
 FOREIGN KEY(operation_id, document_id) REFERENCES wmsd.business_operation(operation_id, document_id)
);
CREATE TABLE wmsd.customer_delivery_line (
 line_id bigint PRIMARY KEY,
 delivery_id bigint NOT NULL REFERENCES wmsd.customer_delivery(document_id),
 sales_issue_line_id bigint NOT NULL REFERENCES wmsd.sales_goods_issue_line(line_id),
 photo_evidence_id bigint NOT NULL,
 FOREIGN KEY(line_id, delivery_id) REFERENCES wmsd.document_line(line_id, document_id),
 FOREIGN KEY(photo_evidence_id, delivery_id) REFERENCES wmsd.evidence(evidence_id, document_id),
 UNIQUE(delivery_id, sales_issue_line_id)
);
CREATE TABLE wmsd.external_payment_confirmation (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 sales_order_id bigint NOT NULL REFERENCES wmsd.sales_order(document_id),
 delivered_order_version integer NOT NULL CHECK(delivered_order_version > 0),
 full_payment_received bit NOT NULL CHECK(full_payment_received = 1),
 external_receipt_reference nvarchar(300),
 receipt_evidence_id bigint,
 confirmation_note nvarchar(2000),
 confirmed_by bigint NOT NULL REFERENCES wmsd.app_user,
 confirmed_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 operation_id bigint NOT NULL UNIQUE,
 UNIQUE(sales_order_id, delivered_order_version),
 FOREIGN KEY(operation_id, document_id) REFERENCES wmsd.business_operation(operation_id, document_id),
 FOREIGN KEY(receipt_evidence_id, document_id) REFERENCES wmsd.evidence(evidence_id, document_id),
 CHECK(LEN(LTRIM(RTRIM(COALESCE(external_receipt_reference,N'')))) > 0
    OR receipt_evidence_id IS NOT NULL
    OR LEN(LTRIM(RTRIM(COALESCE(confirmation_note,N'')))) > 0)
);
CREATE TABLE wmsd.warehouse_task (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 task_kind varchar(20) NOT NULL CHECK(task_kind IN ('PUTAWAY','PICK','RELOCATE','QUARANTINE','UNPICK')),
 assigned_to bigint NOT NULL REFERENCES wmsd.app_user
);
CREATE TABLE wmsd.warehouse_task_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 from_location_id bigint NOT NULL REFERENCES wmsd.location,
 to_location_id bigint NOT NULL REFERENCES wmsd.location,
 quality_code varchar(16) NOT NULL REFERENCES wmsd.quality_status,
 CHECK(from_location_id <> to_location_id)
);
CREATE TABLE wmsd.defect_case (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 discovered_at datetimeoffset NOT NULL,
 reason varchar(1000) NOT NULL
);
CREATE TABLE wmsd.disposition_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 defect_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 outcome varchar(20) NOT NULL CHECK(outcome IN ('RELEASE','REGRADE','SCRAP','RETURN_SUPPLIER')),
 approval_id bigint REFERENCES wmsd.approval
);
CREATE TABLE wmsd.customer_return (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 customer_id bigint NOT NULL REFERENCES wmsd.party,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 financial_followup_status varchar(20) NOT NULL DEFAULT 'NOT_RECORDED'
);
CREATE TABLE wmsd.customer_return_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 original_issue_line_id bigint REFERENCES wmsd.document_line,
 historical_external_line_id bigint REFERENCES wmsd.external_reference_line,
 reason varchar(1000) NOT NULL,
 CHECK((original_issue_line_id IS NOT NULL AND historical_external_line_id IS NULL)
    OR (original_issue_line_id IS NULL AND historical_external_line_id IS NOT NULL))
);
-- D6: one return line represents a quantity with homogeneous eligibility conditions.
-- Split mixed quantities into separate lines. Assessment is evidence, NOT acceptance
-- or a stock posting. Sales STANDARD_ACCEPTANCE or Owner EXCEPTION_APPROVAL
-- follows Warehouse inspection (UC-71/72); D6 never applies to FD intake.
-- Unknown is explicit; no default number of return days is introduced.
CREATE TABLE wmsd.customer_return_assessment (
 assessment_id bigint IDENTITY(1,1) PRIMARY KEY,
 return_line_id bigint NOT NULL REFERENCES wmsd.customer_return_line(line_id),
 assessment_no integer NOT NULL CHECK(assessment_no > 0),
 document_version integer NOT NULL CHECK(document_version > 0),
 packaging_condition varchar(12) NOT NULL
   CHECK(packaging_condition IN ('SEALED','OPENED','TORN','UNKNOWN')),
 installation_status varchar(12) NOT NULL
   CHECK(installation_status IN ('UNUSED','INSTALLED','UNKNOWN')),
 damage_cause varchar(12) NOT NULL
   CHECK(damage_cause IN ('NONE','CUSTOMER','SUPPLIER','OTHER','UNKNOWN')),
 deadline_status varchar(16) NOT NULL
   CHECK(deadline_status IN ('WITHIN','EXCEEDED','NOT_APPLICABLE','UNKNOWN')),
 deadline_reference nvarchar(1000),
 eligibility_status varchar(16) NOT NULL
   CHECK(eligibility_status IN ('PENDING','CASE_REVIEW','INELIGIBLE')),
 assessment_reason nvarchar(2000) NOT NULL
   CONSTRAINT ck_return_assessment_reason CHECK(LEN(LTRIM(RTRIM(assessment_reason))) > 0),
 assessed_by bigint NOT NULL REFERENCES wmsd.app_user,
 assessed_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 approval_id bigint REFERENCES wmsd.approval,
 UNIQUE(return_line_id, assessment_no),
 CONSTRAINT ck_return_deadline_evidence CHECK(
   deadline_status = 'UNKNOWN'
   OR (deadline_reference IS NOT NULL AND LEN(LTRIM(RTRIM(deadline_reference))) > 0)),
 CONSTRAINT ck_return_eligibility CHECK(
   (eligibility_status = 'INELIGIBLE'
     AND (installation_status = 'INSTALLED' OR damage_cause = 'CUSTOMER'
          OR deadline_status = 'EXCEEDED'))
   OR (eligibility_status = 'CASE_REVIEW'
     AND packaging_condition <> 'UNKNOWN' AND installation_status = 'UNUSED'
     AND damage_cause IN ('NONE','SUPPLIER','OTHER')
     AND deadline_status IN ('WITHIN','NOT_APPLICABLE'))
   OR (eligibility_status = 'PENDING'
     AND installation_status <> 'INSTALLED' AND damage_cause <> 'CUSTOMER'
     AND deadline_status <> 'EXCEEDED'
     AND (packaging_condition = 'UNKNOWN' OR installation_status = 'UNKNOWN'
          OR damage_cause = 'UNKNOWN' OR deadline_status = 'UNKNOWN')))
);
-- SEALED/OPENED/TORN are packaging observations, not quality grades or automatic
-- acceptance. Supplier-defective goods may be accepted into quarantine after review.
CREATE TABLE wmsd.supplier_return (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 supplier_id bigint NOT NULL REFERENCES wmsd.party,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 agreement_reference varchar(300), agreed_at datetimeoffset,
 financial_followup_status varchar(20) NOT NULL DEFAULT 'NOT_RECORDED'
);
CREATE TABLE wmsd.supplier_return_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 origin_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 owner_party_id bigint NOT NULL REFERENCES wmsd.party,
 agreed_qty numeric(20,6) NOT NULL CHECK(agreed_qty >= 0),
 agreement_version integer NOT NULL CHECK(agreement_version > 0),
 agreement_verified_by bigint NOT NULL REFERENCES wmsd.app_user,
 agreement_verified_at datetimeoffset NOT NULL,
 agreement_evidence_id bigint NOT NULL REFERENCES wmsd.evidence
);
CREATE TABLE wmsd.supplier_ack_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 dispatch_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 outcome varchar(16) NOT NULL CHECK(outcome IN ('ACCEPTED','REJECTED','DAMAGED')),
 acknowledged_at datetimeoffset NOT NULL
);
CREATE TABLE wmsd.discrepancy_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 source_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 discrepancy_kind varchar(20) NOT NULL CHECK(discrepancy_kind IN ('SHORT','OVER','DAMAGED','WRONG_LOT','WRONG_PRODUCT')),
 resolution_status varchar(20) NOT NULL DEFAULT 'OPEN',
 resolution_document_id bigint REFERENCES wmsd.document
);

-- A position is a physical bin OR an in-transit account dedicated to a dispatch line.
CREATE TABLE wmsd.stock_account (
 account_id bigint IDENTITY(1,1) PRIMARY KEY,
 location_id bigint REFERENCES wmsd.location,
 transit_dispatch_line_id bigint REFERENCES wmsd.document_line,
 CHECK((location_id IS NOT NULL AND transit_dispatch_line_id IS NULL)
    OR (location_id IS NULL AND transit_dispatch_line_id IS NOT NULL))
);
CREATE UNIQUE INDEX ux_stock_account_location ON wmsd.stock_account(location_id) WHERE location_id IS NOT NULL;
CREATE UNIQUE INDEX ux_stock_account_transit_dispatch_line ON wmsd.stock_account(transit_dispatch_line_id) WHERE transit_dispatch_line_id IS NOT NULL;
CREATE TABLE wmsd.stock_balance (
 balance_id bigint IDENTITY(1,1) PRIMARY KEY,
 account_id bigint NOT NULL REFERENCES wmsd.stock_account,
 lot_id bigint NOT NULL REFERENCES wmsd.lot,
 quality_code varchar(16) NOT NULL REFERENCES wmsd.quality_status,
 owner_party_id bigint NOT NULL REFERENCES wmsd.party,
 qty_base numeric(20,6) NOT NULL DEFAULT 0 CHECK(qty_base >= 0),
 version bigint NOT NULL DEFAULT 0,
 UNIQUE(account_id, lot_id, quality_code, owner_party_id)
);
CREATE TABLE wmsd.posting_batch (
 batch_id bigint IDENTITY(1,1) PRIMARY KEY,
 document_id bigint NOT NULL REFERENCES wmsd.document,
 operation varchar(40) NOT NULL,
 operation_key varchar(100) NOT NULL,
 idempotency_key varchar(120) NOT NULL UNIQUE,
 payload_hash char(64) NOT NULL,
 posted_by bigint NOT NULL REFERENCES wmsd.app_user,
 posted_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 reversal_of bigint REFERENCES wmsd.posting_batch,
 UNIQUE(document_id, operation, operation_key)
);
CREATE UNIQUE INDEX ux_posting_batch_reversal_of ON wmsd.posting_batch(reversal_of) WHERE reversal_of IS NOT NULL;
CREATE TABLE wmsd.stock_movement (
 movement_id bigint IDENTITY(1,1) PRIMARY KEY,
 batch_id bigint NOT NULL REFERENCES wmsd.posting_batch,
 document_id bigint NOT NULL,
 line_id bigint NOT NULL,
 from_balance_id bigint REFERENCES wmsd.stock_balance,
 to_balance_id bigint REFERENCES wmsd.stock_balance,
 qty_base numeric(20,6) NOT NULL CHECK(qty_base > 0),
 from_before numeric(20,6), from_after numeric(20,6),
 to_before numeric(20,6), to_after numeric(20,6),
 FOREIGN KEY(line_id, document_id) REFERENCES wmsd.document_line(line_id, document_id),
 CHECK(from_balance_id IS NOT NULL OR to_balance_id IS NOT NULL),
 CHECK(from_balance_id IS NULL OR to_balance_id IS NULL OR from_balance_id <> to_balance_id),
 CHECK((from_balance_id IS NULL AND from_before IS NULL AND from_after IS NULL)
   OR (from_balance_id IS NOT NULL AND from_before IS NOT NULL AND from_after IS NOT NULL
       AND from_after = from_before - qty_base AND from_after >= 0)),
 CHECK((to_balance_id IS NULL AND to_before IS NULL AND to_after IS NULL)
   OR (to_balance_id IS NOT NULL AND to_before IS NOT NULL AND to_after IS NOT NULL
       AND to_after = to_before + qty_base AND to_before >= 0))
);
CREATE TABLE wmsd.reservation (
 reservation_id bigint IDENTITY(1,1) PRIMARY KEY,
 demand_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 execution_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 balance_id bigint NOT NULL REFERENCES wmsd.stock_balance,
 qty_base numeric(20,6) NOT NULL CHECK(qty_base > 0),
 status varchar(12) NOT NULL CHECK(status IN ('ACTIVE','CONSUMED','RELEASED')),
 created_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
CREATE TABLE wmsd.demand_supply_allocation (
 demand_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 supply_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 qty_base numeric(20,6) NOT NULL CHECK(qty_base > 0),
 status varchar(12) NOT NULL CHECK(status IN ('PLANNED','FULFILLED','CANCELLED')),
 PRIMARY KEY(demand_line_id, supply_line_id)
);
CREATE TABLE wmsd.stocktake (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 cutoff_at datetimeoffset,
 completed_at datetimeoffset,
 mode varchar(12) NOT NULL DEFAULT 'FROZEN' CHECK(mode = 'FROZEN')
);
CREATE TABLE wmsd.stocktake_scope (
 stocktake_id bigint NOT NULL REFERENCES wmsd.stocktake(document_id),
 location_id bigint NOT NULL REFERENCES wmsd.location,
 PRIMARY KEY(stocktake_id, location_id)
);
CREATE TABLE wmsd.location_lock (
 location_id bigint PRIMARY KEY REFERENCES wmsd.location,
 stocktake_id bigint NOT NULL REFERENCES wmsd.stocktake(document_id),
 locked_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 FOREIGN KEY(stocktake_id, location_id) REFERENCES wmsd.stocktake_scope(stocktake_id, location_id)
);
CREATE TABLE wmsd.stocktake_snapshot (
 snapshot_id bigint IDENTITY(1,1) PRIMARY KEY,
 stocktake_id bigint NOT NULL REFERENCES wmsd.stocktake(document_id),
 balance_id bigint NOT NULL REFERENCES wmsd.stock_balance,
 book_qty numeric(20,6) NOT NULL CHECK(book_qty >= 0),
 found_after_cutoff bit NOT NULL DEFAULT 0,
 UNIQUE(stocktake_id, balance_id)
);
CREATE TABLE wmsd.count_attempt (
 count_id bigint IDENTITY(1,1) PRIMARY KEY,
 snapshot_id bigint NOT NULL REFERENCES wmsd.stocktake_snapshot,
 attempt_no integer NOT NULL CHECK(attempt_no > 0),
 counted_qty numeric(20,6) NOT NULL CHECK(counted_qty >= 0),
 counted_by bigint NOT NULL REFERENCES wmsd.app_user,
 counted_at datetimeoffset NOT NULL,
 UNIQUE(snapshot_id, attempt_no)
);
CREATE TABLE wmsd.adjustment_line (
 line_id bigint PRIMARY KEY REFERENCES wmsd.document_line,
 count_id bigint NOT NULL REFERENCES wmsd.count_attempt,
 approval_id bigint REFERENCES wmsd.approval,
 delta_qty numeric(20,6) NOT NULL CHECK(delta_qty <> 0)
);
-- 3.1.0 A1: source GI is mandatory for failed delivery; no fictitious POD,
-- D6 acceptance decision or customer custody. Quantities live on document_line.
CREATE TABLE wmsd.failed_delivery (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 warehouse_id bigint NOT NULL REFERENCES wmsd.warehouse,
 failure_evidence_id bigint NOT NULL REFERENCES wmsd.evidence,
 reason nvarchar(2000) NOT NULL CHECK(LEN(LTRIM(RTRIM(reason))) > 0)
);
CREATE TABLE wmsd.failed_delivery_line (
 line_id bigint PRIMARY KEY,
 failed_delivery_id bigint NOT NULL REFERENCES wmsd.failed_delivery(document_id),
 sales_issue_line_id bigint NOT NULL REFERENCES wmsd.sales_goods_issue_line(line_id),
 FOREIGN KEY(line_id, failed_delivery_id) REFERENCES wmsd.document_line(line_id, document_id),
 UNIQUE(line_id, sales_issue_line_id)
);
-- Shared CR/FD claims reserve source allowance, not stock. CONSUMED claims are
-- replaced by posted receipt quantities when capping; never count both.
CREATE TABLE wmsd.return_source_claim (
 claim_id bigint IDENTITY(1,1) PRIMARY KEY,
 request_line_id bigint NOT NULL REFERENCES wmsd.document_line,
 sales_issue_line_id bigint REFERENCES wmsd.sales_goods_issue_line(line_id),
 historical_external_line_id bigint REFERENCES wmsd.external_reference_line,
 claim_kind varchar(2) NOT NULL CHECK(claim_kind IN ('CR','FD')),
 qty_base numeric(20,6) NOT NULL CHECK(qty_base > 0),
 status varchar(12) NOT NULL CHECK(status IN ('OPEN','CONSUMED','RELEASED')),
 operation_id bigint NOT NULL REFERENCES wmsd.business_operation,
 CHECK((sales_issue_line_id IS NOT NULL AND historical_external_line_id IS NULL)
    OR (sales_issue_line_id IS NULL AND historical_external_line_id IS NOT NULL)),
 CHECK(claim_kind <> 'FD' OR sales_issue_line_id IS NOT NULL),
 UNIQUE(request_line_id, operation_id), UNIQUE(claim_id, request_line_id)
);
CREATE TABLE wmsd.failed_delivery_receipt_line (
 line_id bigint PRIMARY KEY,
 goods_receipt_id bigint NOT NULL REFERENCES wmsd.goods_receipt(document_id),
 failed_delivery_line_id bigint NOT NULL,
 sales_issue_line_id bigint NOT NULL,
 inspection_line_id bigint NOT NULL REFERENCES wmsd.inspection_line(line_id),
 claim_id bigint,
 FOREIGN KEY(line_id, goods_receipt_id) REFERENCES wmsd.document_line(line_id, document_id),
 FOREIGN KEY(failed_delivery_line_id, sales_issue_line_id)
   REFERENCES wmsd.failed_delivery_line(line_id, sales_issue_line_id),
 FOREIGN KEY(claim_id, failed_delivery_line_id)
   REFERENCES wmsd.return_source_claim(claim_id, request_line_id)
);
-- An immutable reopening fact is committed with each GR-FD receipt line/batch.
-- Reversal dependencies and actual net quantity are application checks.
CREATE TABLE wmsd.demand_reopening (
 receipt_line_id bigint PRIMARY KEY REFERENCES wmsd.failed_delivery_receipt_line(line_id),
 sales_order_line_id bigint NOT NULL REFERENCES wmsd.sales_order_line(line_id),
 issue_request_line_id bigint NOT NULL REFERENCES wmsd.issue_request_line(line_id),
 outbound_delivery_line_id bigint NOT NULL REFERENCES wmsd.outbound_delivery_line(line_id),
 reopened_qty numeric(20,6) NOT NULL CHECK(reopened_qty > 0),
 source_version integer NOT NULL CHECK(source_version > 0),
 posting_batch_id bigint NOT NULL REFERENCES wmsd.posting_batch
);
CREATE TABLE wmsd.od_commitment_transfer (
 transfer_id bigint IDENTITY(1,1) PRIMARY KEY,
 reopening_receipt_line_id bigint NOT NULL REFERENCES wmsd.demand_reopening(receipt_line_id),
 from_od_line_id bigint NOT NULL REFERENCES wmsd.outbound_delivery_line(line_id),
 to_od_line_id bigint NOT NULL REFERENCES wmsd.outbound_delivery_line(line_id),
 qty_base numeric(20,6) NOT NULL CHECK(qty_base > 0),
 source_version integer NOT NULL CHECK(source_version > 0),
 target_version integer NOT NULL CHECK(target_version > 0),
 operation_id bigint NOT NULL REFERENCES wmsd.business_operation,
 CHECK(from_od_line_id <> to_od_line_id),
 UNIQUE(operation_id, from_od_line_id, to_od_line_id)
);
-- B1: hold blocks allocation immediately WITHOUT changing balance dimensions.
-- Only the approved UC-93 closure batch posts delta/RECLASS/location under freeze.
CREATE TABLE wmsd.defect_hold (
 hold_id bigint IDENTITY(1,1) PRIMARY KEY,
 defect_document_id bigint NOT NULL REFERENCES wmsd.defect_case(document_id),
 balance_id bigint NOT NULL REFERENCES wmsd.stock_balance,
 stocktake_id bigint REFERENCES wmsd.stocktake(document_id),
 qty_base numeric(20,6) NOT NULL CHECK(qty_base > 0),
 evidence_id bigint NOT NULL REFERENCES wmsd.evidence,
 recorded_by bigint NOT NULL REFERENCES wmsd.app_user,
 recorded_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 status varchar(12) NOT NULL CHECK(status IN ('ACTIVE','RESOLVED'))
);
CREATE TABLE wmsd.stocktake_resolution (
 document_id bigint PRIMARY KEY REFERENCES wmsd.document,
 stocktake_id bigint NOT NULL REFERENCES wmsd.stocktake(document_id),
 plan_version integer NOT NULL CHECK(plan_version > 0),
 approval_id bigint REFERENCES wmsd.approval,
 closure_batch_id bigint REFERENCES wmsd.posting_batch,
 UNIQUE(document_id, plan_version)
);
CREATE TABLE wmsd.stocktake_resolution_line (
 line_id bigint PRIMARY KEY,
 resolution_id bigint NOT NULL REFERENCES wmsd.stocktake_resolution(document_id),
 count_id bigint NOT NULL REFERENCES wmsd.count_attempt,
 hold_id bigint REFERENCES wmsd.defect_hold,
 action_kind varchar(12) NOT NULL CHECK(action_kind IN ('DELTA','RECLASS','RELOCATE')),
 from_balance_id bigint REFERENCES wmsd.stock_balance,
 to_balance_id bigint REFERENCES wmsd.stock_balance,
 delta_qty numeric(20,6),
 executed_by bigint REFERENCES wmsd.app_user,
 executed_at datetimeoffset,
 execution_evidence_id bigint REFERENCES wmsd.evidence,
 FOREIGN KEY(line_id, resolution_id) REFERENCES wmsd.document_line(line_id, document_id),
 CHECK((action_kind = 'DELTA' AND delta_qty IS NOT NULL AND delta_qty <> 0
        AND ((delta_qty > 0 AND from_balance_id IS NULL AND to_balance_id IS NOT NULL)
          OR (delta_qty < 0 AND from_balance_id IS NOT NULL AND to_balance_id IS NULL)))
    OR (action_kind IN ('RECLASS','RELOCATE') AND delta_qty IS NULL
        AND from_balance_id IS NOT NULL AND to_balance_id IS NOT NULL
        AND from_balance_id <> to_balance_id)),
 CHECK((executed_by IS NULL AND executed_at IS NULL AND execution_evidence_id IS NULL)
    OR (executed_by IS NOT NULL AND executed_at IS NOT NULL AND execution_evidence_id IS NOT NULL))
);

CREATE TABLE wmsd.audit_event (
 event_id bigint IDENTITY(1,1) PRIMARY KEY,
 document_id bigint REFERENCES wmsd.document,
 actor_id bigint NOT NULL REFERENCES wmsd.app_user,
 action varchar(80) NOT NULL,
 event_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 details varchar(4000) NOT NULL
);
CREATE TABLE wmsd.outbox_event (
 event_id bigint IDENTITY(1,1) PRIMARY KEY,
 document_id bigint NOT NULL REFERENCES wmsd.document,
 event_type varchar(60) NOT NULL,
 event_key varchar(120) NOT NULL UNIQUE,
 created_at datetimeoffset NOT NULL DEFAULT SYSDATETIMEOFFSET(),
 delivered_at datetimeoffset,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0)
);

CREATE INDEX ix_return_claim_source ON wmsd.return_source_claim(sales_issue_line_id, claim_kind, status);
CREATE INDEX ix_return_claim_history ON wmsd.return_source_claim(historical_external_line_id, status);
CREATE INDEX ix_fd_receipt_source ON wmsd.failed_delivery_receipt_line(sales_issue_line_id);
CREATE INDEX ix_active_defect_hold ON wmsd.defect_hold(balance_id) WHERE status = 'ACTIVE';
CREATE INDEX ix_document_kind_status ON wmsd.document(document_kind, workflow_status, created_at);
CREATE INDEX ix_line_lot ON wmsd.document_line(lot_id);
CREATE INDEX ix_line_link_target ON wmsd.line_link(target_line_id);
CREATE INDEX ix_receipt_dispatch ON wmsd.transfer_receipt(dispatch_id);
CREATE INDEX ix_receipt_line_dispatch ON wmsd.transfer_receipt_line(dispatch_line_id);
CREATE INDEX ix_movement_from ON wmsd.stock_movement(from_balance_id, batch_id);
CREATE INDEX ix_movement_to ON wmsd.stock_movement(to_balance_id, batch_id);
CREATE INDEX ix_batch_posted ON wmsd.posting_batch(posted_at);
CREATE INDEX ix_reservation_active ON wmsd.reservation(balance_id) WHERE status = 'ACTIVE';
CREATE INDEX ix_reservation_demand ON wmsd.reservation(demand_line_id, status);
CREATE INDEX ix_balance_lot ON wmsd.stock_balance(lot_id, quality_code);
CREATE INDEX ix_pending_outbox ON wmsd.outbox_event(event_id) WHERE delivered_at IS NULL;
CREATE INDEX ix_return_assessment_latest ON wmsd.customer_return_assessment(return_line_id, document_version, assessment_no DESC);
CREATE INDEX ix_return_assessment_status ON wmsd.customer_return_assessment(eligibility_status, return_line_id);
CREATE INDEX ix_wir_sales_order ON wmsd.issue_request(sales_order_id);
CREATE INDEX ix_wir_line_sales_order_line ON wmsd.issue_request_line(sales_order_line_id);
CREATE INDEX ix_od_line_wir_line ON wmsd.outbound_delivery_line(issue_request_line_id);
CREATE INDEX ix_sale_gi_od_line ON wmsd.sales_goods_issue_line(outbound_delivery_line_id);
CREATE INDEX ix_pod_so ON wmsd.customer_delivery(sales_order_id, delivered_at);
CREATE INDEX ix_pod_line_gi ON wmsd.customer_delivery_line(sales_issue_line_id);
CREATE INDEX ix_payment_so ON wmsd.external_payment_confirmation(sales_order_id, delivered_order_version);
CREATE INDEX ix_cancellation_so_line ON wmsd.sales_order_cancellation(sales_order_line_id);
GO

CREATE VIEW wmsd.inventory_ledger AS
 SELECT movement_id, batch_id, from_balance_id AS balance_id, -qty_base AS delta_qty
 FROM wmsd.stock_movement WHERE from_balance_id IS NOT NULL
 UNION ALL
 SELECT movement_id, batch_id, to_balance_id AS balance_id, qty_base AS delta_qty
 FROM wmsd.stock_movement WHERE to_balance_id IS NOT NULL;
GO

-- Free stock for NEW demand. Reserved staged/transit stock stays assigned to its demand.
CREATE VIEW wmsd.available_stock AS
 SELECT b.balance_id, l.warehouse_id, l.location_id, b.lot_id,
        b.qty_base - COALESCE(r.reserved_qty,0) AS available_qty
 FROM wmsd.stock_balance b
 JOIN wmsd.stock_account a ON a.account_id=b.account_id
 JOIN wmsd.location l ON l.location_id=a.location_id
 JOIN wmsd.warehouse w ON w.warehouse_id=l.warehouse_id
 JOIN wmsd.party p ON p.party_id=b.owner_party_id
 JOIN wmsd.lot lot_ref ON lot_ref.lot_id=b.lot_id
 JOIN wmsd.product pr ON pr.product_id=lot_ref.product_id
 LEFT JOIN (SELECT balance_id, SUM(qty_base) AS reserved_qty FROM wmsd.reservation
            WHERE status='ACTIVE' GROUP BY balance_id) r ON r.balance_id=b.balance_id
 WHERE p.party_kind='STORE' AND b.quality_code='GOOD'
   AND lot_ref.identification_status='VERIFIED' AND pr.active = 1
   AND l.active = 1 AND w.active = 1 AND l.allocatable = 1
   AND NOT EXISTS (SELECT 1 FROM wmsd.location_lock k WHERE k.location_id=l.location_id)
   AND NOT EXISTS (SELECT 1 FROM wmsd.defect_hold h WHERE h.balance_id=b.balance_id AND h.status='ACTIVE');
GO

COMMIT TRANSACTION;
-- REQUIRED APPLICATION/STORED-PROCEDURE CONTROLS (not supplied by DDL):
-- 1. Typed-header/line kind consistency, source/product/lot/warehouse matching.
-- 2. Append-only posted records; disallow arbitrary DML by application identities.
-- 3. Lock affected stock_balance rows in ascending ID; verify cumulative source limits.
-- 4. Atomically write movement, balances, reservations, status, audit and outbox.
-- 5. Recheck active location_lock under a shared location-row locking protocol.
-- 6. Approved document version, actual requester identity and per-line approval ceiling.
-- 7. Independent transfer receiver, role + warehouse + operation authorization.
-- 8. Sum ACTIVE reservations <= balance; do not reserve inbound plans as on-hand stock.
-- 9. Whole-unit quantities, immutable conversions, verified-lot requirements.
-- 10. Batch.document_id = movement.document_id; cumulative posting <= source allowance.
-- 11. Return posting requires the latest assessment for the same return line and
--     document version, CASE_REVIEW eligibility, completed inspection and a matching
--     APPROVE decision/approval_line quantity. Link approval_id to that decision.
--     INELIGIBLE/PENDING assessments cannot authorize GR_CUSTOMER_RETURN; goods
--     physically held remain custody until handback. CASE_REVIEW is not approval.
--     Any condition change creates a new assessment and document version and
--     requires new proper-role review; historical assessments/approvals remain immutable.
--     C2 decision kinds and the distinct FD path are specified in controls 27-29.
-- 12. Departmental users record their own operations; no proxy-entry/delegation
--     workflow or purchasing/delivery application role is introduced. Co-inspection
--     and external supplier contacts are recorded in document notes/evidence/audit;
--     those participants do not inherit stock-posting rights.
-- 13. Issue requests reserve availability only; actual handover authorizes PGI.
--     Reconcile MISA order-time records separately from WMS physical dispatches.
--     Monthly stocktake is a planning cadence, not concurrent-movement mode.
-- 14. Preserve actual remaining PIECE quantities for opened/torn boxes. Packaging
--     damage alone must not set DAMAGED quality. Nominal size is not verified calibre.

-- 2026-10-25 revision 3.1.0: process section 4 defines alternate/exception
-- branches and EX-01..05; database proposal section 6 maps acceptance cases.
-- 15. Exactly five roles; do not seed permissions for retired UC-23..25, UC-42,
--     UC-59..62, UC-74..78 or UC-106. UC-107/108 record external evidence, not inventory.
-- 16. Enforce frozen-scope checks on receipt, dispatch, relocation, picking,
--     custody/ownership and quality changes, including corrections/backdating.
--     B1 holds/evidence are balance-neutral; only approved UC-93 closure posts
--     real delta plus RECLASS/location with Warehouse execution before unlock.
-- 17. Unknown source/lot identity cannot create available stock. Nominal dimensions
--     must not substitute for unverified calibre. No invented warehouse seeds.
-- 18. Failed handover before PGI retains staged stock or uses documented unpick.
--     Cancellation after PGI does not restore stock without receipt/correction.
-- 19. Supplier agreement and later receipt ACK are separate events; ACK/closure
--     never deducts again. Custody-only returns do not reduce store-owned stock.
-- 20. UC-45..48/109: SALES creates SO copies from verified MISA/paper sources.
--     Require source evidence and matching source product/quantity. Reuse the same
--     SO when correcting/reopening it; source/header and source-line UNIQUEs prevent
--     another copy. Source verification is by Sales, with Accountant support for
--     historical accounting evidence (UC-108), not a new Owner approval.
-- 21. Lock each SO source line: sum(non-cancelled WIR commitments, INCLUDING issued
--     portions) <= ordered qty - authorized cancellations. Per WIR line, sum OD
--     commitments <= authorized WIR qty after cancellations; per OD line,
--     valid PGI minus valid posted GR-FD <= released qty. WIR/OD are one demand; transfer
--     replacement OD commitment traceably without counting both as new demand.
--     Check source kinds/products/units and GI SALE/warehouse along the typed chain.
-- 22. UC-110: only assigned WAREHOUSE confirms POD. Each POD line needs a valid
--     POSTED GI_SALE line, matching SO/product/lot/warehouse, positive actual qty
--     and a successfully stored, accessible image belonging to that POD document.
--     A photo FK alone does not prove image MIME/content or successful upload.
--     Lock GI/SO lines and cap sum(CONFIRMED, non-voided POD qty) at valid posted
--     PGI less posted GR-FD and OPEN FD claims. Carrier HO is not POD.
-- 23. SO is DELIVERED only if ordered-minus-cancelled qty > 0 and every remaining
--     line is fully photo-confirmed. All cancelled with zero delivery => CANCELLED.
--     Partial delivery => PARTIALLY_DELIVERED; dispatch/PGI alone => IN_PROGRESS.
--     WIR warehouse completion is independent of SO delivery/payment completion.
-- 24. UC-111: only SALES confirms full money receipt OUTSIDE WMSD, after rechecking
--     current SO=DELIVERED, version and complete valid POD coverage. Record user,
--     time and receipt reference/evidence/note; set SO=COMPLETED atomically. Partial,
--     uncertain or early payment does not complete an undelivered SO. No amounts,
--     gateway, debt, invoice or refund engine is introduced by PAY-CFM.
-- 25. Commit POD/PAY-CFM/cancellation + business_operation + SO progress + audit +
--     outbox together, WITHOUT posting_batch/stock_movement/balance writes. Stable
--     operation keys and payload hashes make retries idempotent; mismatched reuse
--     conflicts. Validate operation actor/document/version against confirmation.
-- 26. Keep confirmations/cancellations immutable. A mistaken confirmation is
--     traceably VOIDED with reason and a new business_operation; retain its data,
--     increment the SO version, recalculate progress and invalidate stale completion
--     authority. Re-confirm after valid delivery using the current SO version.
--     Normal BF-07 returns retain original historical delivery/payment evidence
--     and follow their own return/financial workflow; never restore stock by status.
-- These are required application controls, NOT implemented procedures/triggers.

-- 27. C2: STANDARD_ACCEPTANCE only for Sales ordinary CR after Warehouse inspection:
--     verified received source/qty, GOOD/UNUSED, proven deadline/terms, no dispute.
--     Same Sales creator may accept. EXCEPTION_APPROVAL is Owner-only with distinct
--     requester. Neither decision can override D6 INELIGIBLE/PENDING exclusions.
--     Changed decision_kind/conditions/version requires the appropriate new decision.
-- 28. Share a conditional source-line write guard across POD, CR/FD claims/receipts:
--     valid POD + posted GR-FD + OPEN FD claims <= valid PGI on each GI line;
--     posted GR-CR + OPEN CR claims <= eligible received POD (or verified history).
--     Consume the claim and post receipt atomically; never count a consumed claim
--     in addition to its receipt. A CR source must be customer-received, not PGI alone.
-- 29. GR-FD actual receipt by WAREHOUSE commits stock, claim consumption, reopening
--     facts, original SO/WIR/OD net progress/version, audit/outbox in ONE transaction.
--     Claim or failure evidence alone cannot reopen demand. Ordinary GR-CR never
--     reopens it. New OD reuses/transfers commitment, not another demand allocation.
--     Reversal rechecks POD/claims/reopening/redelivery and rejects unresolved dependencies.
-- 30. BF-08 has NO Owner dispatch/variance/closure approval or UC-106 route.
--     ACCOUNTANT verifies agreement/source/qty, reconciles ACK and closes UC-83;
--     WAREHOUSE posts actual owned GI-SR or custody release. No second deduction.
--     Invoice/Credit Note source/date/qty/evidence is an external_reference link;
--     financial follow-up is independent. On-site scrap/regrade/release remains BF-02/B1.
-- 31. B1: retain immutable snapshot and active hold/freeze. Count50=48GOOD+2broken
--     means RECLASS2, total50, no ADJ0. Count48=46GOOD+2broken means delta-2 plus
--     RECLASS2, never shortage-4. Latest plan/version/count, Owner UC-92 decision,
--     Warehouse execution/evidence and all linked tasks must match UC-93 closure.
--     Delta magnitude = line qty; transfers preserve product/lot/owner/total.
--     Post batch/movements/balances/holds/plan/progress/audit/outbox atomically.
--     Failed/unknown commit retains freeze until resolved; same-key retry only.
--     Sufficiently substantiated variance may proceed directly; recount is optional.
-- 32. Draft TD/GI-S exists before picking, changes no stock; TO confirmation is
--     execution, not approval. Actual TD/PGI posts only on evidenced handover.
--     TR closes only after all request remainder/transit/variance/TO is resolved.
-- All 3.1.0 cross-row, immutable-history, role and transaction controls remain
-- APPLICATION REQUIREMENTS, not implemented services or SQL Server test results.
