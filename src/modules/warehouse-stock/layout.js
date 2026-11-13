import { z } from 'zod';
import { Warehouse } from '../../models/runtime.js';
import { requirePermission, requireWarehouseAccess } from '../../shared/utils/access.js';
import { validationError } from '../../shared/utils/ApiError.js';
import { transaction } from '../../shared/utils/persistence.js';
import { appendAudit } from '../../shared/utils/audit.js';
import { rectanglesOverlap, applicationIssues } from './layout-geometry.js';

const point = z.object({ x: z.number().finite().min(0).max(1000), y: z.number().finite().min(0).max(1000) }).strict();
const id=z.string().trim().min(1).max(80),name=z.string().trim().min(1).max(120),size=z.number().finite().min(0.01).max(1000);
const palletPlan=z.object({rows:z.number().int().min(1).max(100),columns:z.number().int().min(1).max(100),palletWidth:size,palletLength:size,gap:z.number().min(0).max(100),margin:z.number().min(0).max(100)}).strict();
const palletSchema=z.object({id:id,code:name,x:z.number().finite().min(0).max(1000),y:z.number().finite().min(0).max(1000),width:size,length:size,baseHeight:size,stackHeight:z.number().min(0).max(100),actualHeight:z.number().min(0).max(100).optional(),planned:z.boolean().optional()}).strict();
const slotSchema=z.object({id,name,x:z.number().finite().min(0).max(1000),y:z.number().finite().min(0).max(1000),width:size,length:size,palletPlan:palletPlan.optional(),pallets:z.array(palletSchema).max(100).optional()}).strict();
const zoneSchema=z.object({id,name,x:z.number().finite().min(-1000).max(1000),y:z.number().finite().min(-1000).max(1000),width:size,length:size,rotation:z.number().finite().min(-360).max(360),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),functionId:z.union([id,z.literal('')]),maxHeight:z.number().positive().max(100).optional(),slots:z.array(slotSchema).max(500)}).strict();
export const layoutSchema = z.object({
  points: z.array(point).min(3).max(100),
  height: z.number().positive().max(100),
  doors: z.array(z.object({ edge: z.number().int().min(0), offset: z.number().min(0), width: z.number().positive(), height: z.number().positive() }).strict()).max(100),
  maxStackHeight:z.number().positive().max(100).optional(),
  functions:z.array(z.object({id,name}).strict()).max(100).optional(),
  zones:z.array(zoneSchema).max(100).optional(),
}).strict().superRefine((layout, context) => {
  const points = layout.points;
  const cross = (a,b,c) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const inside = (a,b,c) => c.x >= Math.min(a.x,b.x)-1e-8 && c.x <= Math.max(a.x,b.x)+1e-8 && c.y >= Math.min(a.y,b.y)-1e-8 && c.y <= Math.max(a.y,b.y)+1e-8;
  const intersect = (a,b,c,d) => {
    const abC=cross(a,b,c), abD=cross(a,b,d), cdA=cross(c,d,a), cdB=cross(c,d,b);
    return abC*abD<0&&cdA*cdB<0 || Math.abs(abC)<1e-8&&inside(a,b,c) || Math.abs(abD)<1e-8&&inside(a,b,d) || Math.abs(cdA)<1e-8&&inside(c,d,a) || Math.abs(cdB)<1e-8&&inside(c,d,b);
  };
  const fail = message => context.addIssue({ code: 'custom', message });
  const functions=layout.functions||[],zones=layout.zones||[],limit=layout.maxStackHeight??layout.height;
  if(limit>layout.height)fail('Giới hạn xếp hàng không được cao hơn tường kho');
  if(new Set(functions.map(f=>f.id)).size!==functions.length||new Set(functions.map(f=>f.name.toLocaleLowerCase('vi'))).size!==functions.length)fail('Chức năng bị trùng mã hoặc tên');
  if(new Set(zones.map(zone=>zone.id)).size!==zones.length)fail('Mã khu vực bị trùng');
  const allSlots=zones.flatMap(zone=>zone.slots);
  const allPallets=allSlots.flatMap(slot=>slot.pallets||[]);
  if(new Set(allPallets.map(pallet=>pallet.id)).size!==allPallets.length||new Set(allPallets.map(pallet=>pallet.code.toLocaleLowerCase('vi'))).size!==allPallets.length)fail('Mã pallet bị trùng');
  allSlots.forEach(slot=>{(slot.pallets||[]).forEach(pallet=>{if(pallet.x<0||pallet.y<0||pallet.x+pallet.width>slot.width+1e-7||pallet.y+pallet.length>slot.length+1e-7)fail(`Pallet ${pallet.code} nằm ngoài ô ${slot.name}`);if((pallet.actualHeight??pallet.baseHeight+pallet.stackHeight)>100)fail(`Chiều cao pallet ${pallet.code} không hợp lệ`);});});
  if(allSlots.length>2000||new Set(allSlots.map(slot=>slot.id)).size!==allSlots.length)fail('Ô bị trùng mã hoặc vượt giới hạn 2000 ô');
  zones.forEach((zone,index)=>{
    if(zone.functionId&&!functions.some(f=>f.id===zone.functionId))fail(`Chức năng của khu vực ${zone.name} không tồn tại`);
    if(zone.maxHeight!==undefined&&zone.maxHeight>limit)fail(`Giới hạn chiều cao khu vực ${zone.name} vượt giới hạn kho`);
    if(zones.some((other,j)=>j<index&&rectanglesOverlap(zone,other)))fail('Các khu vực không được chồng lấn');
    if(new Set(zone.slots.map(slot=>slot.name.toLocaleLowerCase('vi'))).size!==zone.slots.length)fail('Tên ô bị trùng trong khu vực');
    zone.slots.forEach((slot,i)=>{if(zone.slots.some((other,j)=>j<i&&rectanglesOverlap(slot,other)))fail('Các ô trong cùng khu vực không được chồng lấn');});
  });
  let area=0;
  points.forEach((a,i) => {
    const b=points[(i+1)%points.length]; area+=a.x*b.y-b.x*a.y;
    if(Math.hypot(a.x-b.x,a.y-b.y)<0.01) fail('Cạnh phải dài ít nhất 1 cm');
    for(let j=i+1;j<points.length;j++) if(j!==i+1 && !(i===0&&j===points.length-1) && intersect(a,b,points[j],points[(j+1)%points.length])) fail('Đường bao không được tự cắt');
  });
  if(Math.abs(area)<0.02) fail('Mặt bằng phải có diện tích dương');
  layout.doors.forEach((door,index) => {
    const a=points[door.edge], b=points[(door.edge+1)%points.length];
    if(!a||!b||door.offset+door.width>Math.hypot(a.x-b.x,a.y-b.y)+1e-8||door.height>layout.height) fail('Cửa phải nằm trong tường');
    if(layout.doors.some((other,j)=>j<index&&other.edge===door.edge&&door.offset<other.offset+other.width&&other.offset<door.offset+door.width)) fail('Các cửa không được chồng nhau');
  });
});
export const saveLayoutSchema=z.object({layout:layoutSchema,expectedUpdatedAt:z.string().datetime(),apply:z.boolean().optional()}).strict();
export async function saveLayout(user,id,input) {
  requirePermission(user,'warehouse_location:update'); requireWarehouseAccess(user,id);
  return transaction(async session => {
    const previous=await Warehouse.findOne({_id:id,updatedAt:new Date(input.expectedUpdatedAt)}).session(session);
    if(!previous)throw validationError('Kho đã thay đổi hoặc không tồn tại. Hãy tải lại trước khi lưu.');
    if(JSON.stringify(previous.layout3d?.functions||[])!==JSON.stringify(input.layout.functions||[]))requirePermission(user,'warehouse_layout_function:update');
    const issues=applicationIssues(input.layout);
    if(input.apply&&issues.length)throw validationError(issues.join(' '));
    const timestamp=new Date(Math.max(Date.now(),Date.parse(input.expectedUpdatedAt)+1));
    const changes={layout3d:input.layout,updatedAt:timestamp,...(input.apply&&{layout3dApplied:input.layout,layout3dAppliedAt:timestamp})};
    const result=await Warehouse.findOneAndUpdate({_id:id,updatedAt:new Date(input.expectedUpdatedAt)},{$set:changes},{new:true,runValidators:true,session,timestamps:false});
    if(!result) throw validationError('Kho đã thay đổi hoặc không tồn tại. Hãy tải lại trước khi lưu.');
    await appendAudit({actorId:user._id,action:input.apply?'APPLY_WAREHOUSE_LAYOUT':'SAVE_WAREHOUSE_LAYOUT',entityType:'warehouses',entityId:id,warehouseIds:[id],session});
    return { layout: result.layout3d, updatedAt: result.updatedAt,appliedAt:result.layout3dAppliedAt,issues };
  });
}
