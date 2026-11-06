import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { registerReviewedModels, newCollections } from '../src/models/index.js';
import { removedCollections, embeddedTables } from '../src/models/consolidation.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'git_doc/docs/03_thiet_ke/WMSD_SQL_Style_DB_Diagram_2026-11-05.drawio');

const groups = [
  ['A · Access', '#DDEBFF', ['users', 'roles', 'permissions']],
  ['B · Warehouse & catalogue', '#E0F6ED', ['warehouses', 'warehouse_locations', 'customers', 'categories', 'products', 'product_batches', 'stock_thresholds', 'suppliers', 'storage_stacks', 'storage_stack_items']],
  ['C · Inventory & controls', '#FFF2CC', ['stock_holding_points', 'inventory_balances', 'stock_transactions', 'stock_movements', 'stock_reservations', 'supply_allocations', 'stock_holds', 'replenishment_locks', 'return_source_locks']],
  ['D · Purchasing & receiving', '#FCE4D6', ['replenishment_requests', 'purchase_orders', 'goods_arrivals', 'goods_inspections', 'purchase_receipts']],
  ['E · Inter-warehouse transfer', '#EADCF8', ['warehouse_transfer_requests', 'transfer_dispatches', 'transfer_receipts', 'internal_transfer_requirements', 'transfer_orders']],
  ['F · Sales, delivery & invoice', '#DDEBF7', ['sales_orders', 'warehouse_issue_requests', 'delivery_orders', 'sales_goods_issues', 'delivery_confirmations', 'sales_invoices', 'external_payment_confirmations']],
  ['G · Customer return & custody', '#F4E1F1', ['failed_deliveries', 'failed_delivery_receipts', 'delivery_demand_reopenings', 'delivery_commitment_transfers', 'sales_order_cancellations', 'customer_returns', 'return_inspections', 'customer_return_receipts', 'return_quantity_claims', 'custody_receipts', 'custody_releases']],
  ['H · Defect & supplier return', '#FDE9D9', ['defect_reports', 'defect_resolution_plans', 'stock_scrap_records', 'stock_quality_changes', 'stock_discrepancies', 'supplier_returns', 'supplier_return_issues', 'supplier_acknowledgements']],
  ['I · Stocktake, opening & reversal', '#E2F0D9', ['stocktakes', 'stocktake_snapshots', 'stocktake_counts', 'stocktake_location_locks', 'stocktake_resolution_plans', 'stock_adjustments', 'opening_stocks', 'stock_reversals']],
  ['J · Evidence, audit & events', '#E7E6E6', ['approval_history', 'attachments', 'notifications', 'audit_logs', 'system_events', 'operation_records', 'external_references', 'external_reference_lines']],
];

const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
for (const group of groups) group[2] = group[2].filter(name => !removedCollections.includes(name));
const html = value => xml(value).replaceAll('\n', '&lt;br/&gt;');
const safeId = value => value.replaceAll(/[^A-Za-z0-9_]/g, '_');
const connection = mongoose.createConnection();
const registered = registerReviewedModels(connection);
const models = new Map(registered);
const modelToCollection = new Map([...models].map(([collection, Model]) => [Model.modelName, collection]));

const listed = groups.flatMap(([, , collections]) => collections);
if (listed.length !== newCollections.length || newCollections.some(name => !listed.includes(name))) {
  throw new Error('Diagram grouping does not cover every reviewed collection exactly once.');
}

function refOf(path) {
  return path?.options?.ref ?? path?.$embeddedSchemaType?.options?.ref ?? null;
}
function typeOf(path) {
  if (path?.instance === 'Array') return '[]';
  if (path?.instance === 'ObjectId') return 'ObjectId';
  if (path?.instance === 'Decimal128') return 'Decimal';
  if (path?.instance === 'Date') return 'Date';
  if (path?.instance === 'Boolean') return 'Boolean';
  return path?.instance ?? 'Mixed';
}
function schemaFields(schema, prefix = '', fields = [], relations = []) {
  for (const [name, path] of Object.entries(schema.paths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(name)) continue;
    const full = prefix ? `${prefix}.${name}` : name;
    const targetModel = refOf(path);
    const embeddedTarget = path.options?.embeddedTarget || path.$embeddedSchemaType?.options?.embeddedTarget;
    const target = targetModel ? modelToCollection.get(targetModel) : embeddedTables[embeddedTarget]?.[0];
    const many = path?.instance === 'Array' || Boolean(path?.$embeddedSchemaType);
    fields.push({ name: full, type: typeOf(path), required: Boolean(path?.options?.required), target, many });
    if (target) relations.push({ field: full, target, many });
    if (path?.schema && !path.$embeddedSchemaType) schemaFields(path.schema, full, fields, relations);
    if (path?.$embeddedSchemaType?.schema) schemaFields(path.$embeddedSchemaType.schema, `${full}[]`, fields, relations);
  }
  return { fields, relations };
}
const metadata = new Map([...models].map(([collection, Model]) => [collection, { Model, ...schemaFields(Model.schema) }]));

function displayFields(collection, detail = false) {
  const { fields } = metadata.get(collection);
  const limit = detail ? 26 : 11;
  const lines = ['<b>PK</b>  _id : ObjectId'];
  for (const field of fields.slice(0, limit)) {
    const mark = field.target ? (field.many ? 'FK[]' : 'FK') : field.required ? '•' : '○';
    const target = field.target ? ` → ${field.target}` : '';
    lines.push(`${mark}  ${field.name} : ${field.type}${target}`);
  }
  if (fields.length > limit) lines.push(`<i>… ${fields.length - limit} field(s) more</i>`);
  lines.push('○ createdAt : Date');
  lines.push('○ updatedAt : Date');
  return lines.join('<br/>');
}
function cell(id, value, style, x, y, width, height, parent = '1') {
  return `<mxCell id="${id}" value="${value}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/></mxCell>`;
}
function table(id, collection, color, x, y, detail) {
  const fields = displayFields(collection, detail);
  // Long nested FK paths wrap inside the 310px table. Reserve their extra lines
  // instead of clipping the last attributes in exported diagrams.
  const renderedLines = fields.split('<br/>').reduce((n, line) => n + Math.max(1, Math.ceil(line.replace(/<[^>]*>/g, '').length / 31)), 0);
  const height = Math.max(150, 70 + renderedLines * 22);
  const value = `<div style="font-size:15px;line-height:20px"><div style="text-align:center;font-size:18px"><b>${collection}</b></div><hr/><div>${fields}</div></div>`;
  const style = `rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#1F2937;strokeWidth=2;fontColor=#111827;align=left;verticalAlign=top;spacing=10;fontFamily=Arial;overflow=hidden;`; 
  return { id, xml: cell(id, html(value), style, x, y, 310, height), x, y, width:310, height };
}
function edge(id, source, target, label, many = false, dashed = false) {
  const ends = many ? 'startArrow=ERmany;endArrow=ERmany;' : 'startArrow=ERone;endArrow=ERmany;';
  const style = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#475569;strokeWidth=1.5;${ends}${dashed ? 'dashed=1;' : ''}fontFamily=Arial;fontSize=10;labelBackgroundColor=#FFFFFF;`;
  return `<mxCell id="${id}" value="${html(label)}" style="${style}" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}
function diagram(id, name, collections, detail, color = '#DDEBFF') {
  const columns = detail ? 3 : 5;
  const gapX = detail ? 380 : 350;
  const nodes = new Map();
  const parts = [
    '<mxGraphModel dx="2400" dy="1400" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="18000" pageHeight="15000" math="0" shadow="0" background="#FFFFFF"><root><mxCell id="0"/><mxCell id="1" parent="0"/>',
    cell('title', html(`<b>${name}</b><br/><font style="font-size:14px">PK = document _id · FK = ObjectId ref · [] = array / embedded item · Crow’s foot shows logical cardinality</font>`), 'rounded=0;whiteSpace=wrap;html=1;fillColor=#17324D;strokeColor=none;fontColor=#FFFFFF;align=left;verticalAlign=middle;spacing=16;fontFamily=Arial;fontSize=26;', 30, 20, Math.max(310, Math.min(collections.length, columns) * gapX - 40), 80),
  ];
  let rowY = 145;
  for (let start = 0; start < collections.length; start += columns) {
    let rowHeight = 0;
    for (const [column, collection] of collections.slice(start, start + columns).entries()) {
      const node = table(`t_${safeId(collection)}`, collection, color, 40 + column * gapX, rowY, detail);
      nodes.set(collection, node); parts.push(node.xml);
      rowHeight = Math.max(rowHeight, node.height);
    }
    rowY += rowHeight + 100;
  }
  const emitted = new Set();
  for (const collection of collections) {
    for (const relation of metadata.get(collection).relations) {
      if (!nodes.has(relation.target)) continue;
      const key = `${collection}|${relation.target}|${relation.field}`;
      if (emitted.has(key)) continue;
      emitted.add(key);
      parts.push(edge(`e_${safeId(key)}`, `t_${safeId(relation.target)}`, `t_${safeId(collection)}`, relation.field, relation.many));
    }
  }
  parts.push('</root></mxGraphModel>');
  return `<diagram id="${id}" name="${xml(name)}">${parts.join('')}</diagram>`;
}

const allCollections = groups.flatMap(([, , rows]) => rows);
const pages = [diagram('overall_sql', '00 — Full SQL-style Database Diagram', allCollections, false)];
for (const [name, color, collections] of groups) pages.push(diagram(safeId(name), name, collections, true, color));

const file = `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="2026-11-06T09:00:00.000Z" agent="WMSD reviewed model generator" version="26.0.0" type="device">\n${pages.join('\n')}\n</mxfile>\n`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, file, 'utf8');
await connection.close();
console.log(JSON.stringify({ output, pages: pages.length, collections: allCollections.length }, null, 2));
