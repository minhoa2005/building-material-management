import { exact } from '../../models/model-utils.js';
import { dataContext, demoDate, fixtureId, decimalValue, hash } from './data.js';
import { createDocument, addItem } from './workflow-data.js';

// All brands, people, prices and measurements below are fictional shop fixtures.
// Packaging specs belong to this seed, not a new product/UOM database field.
export const SHOP_PRODUCTS = [
  ['AP','AP6601','Gạch lát nền vân đá trắng 60×60','Porcelain',600,600,4,620,620,50,35000,50000],
  ['TV','TV3601','Gạch ốp tường trắng mờ 30×60','Ceramic',300,600,8,620,320,100,18000,28000],
  ['AP','AP6602','Gạch lát nền xám xi măng 60×60','Porcelain',600,600,4,620,620,50,38000,55000],
  ['AP','AP6603','Gạch lát nền kem bóng 60×60','Porcelain',600,600,4,620,620,50,42000,60000],
  ['AP','AP8801','Gạch lát nền vân mây 80×80','Porcelain',800,800,3,820,820,45,82000,110000],
  ['AP','AP8802','Gạch lát nền xám nhạt 80×80','Porcelain',800,800,3,820,820,45,85000,115000],
  ['AP','AP61201','Gạch khổ lớn vân đá 60×120','Porcelain',600,1200,2,1220,620,35,105000,145000],
  ['TV','TV3602','Gạch ốp tường vân đá 30×60','Ceramic',300,600,8,620,320,100,20000,30000],
  ['TV','TV3603','Gạch ốp điểm trang trí 30×60','Ceramic',300,600,8,620,320,100,25000,38000],
  ['TV','TV4401','Gạch lát sân đỏ 40×40','Ceramic',400,400,6,420,420,80,16000,25000],
  ['TV','TV4402','Gạch lát sân giả đá 40×40','Ceramic',400,400,6,420,420,80,19000,29000],
  ['TV','TV3301','Gạch chống trượt phòng tắm 30×30','Ceramic',300,300,11,320,320,120,10500,16000],
  ['TV','TV3302','Gạch chống trượt ghi đậm 30×30','Ceramic',300,300,11,320,320,120,11000,17000],
  ['MK','MK15901','Gạch giả gỗ nâu sáng 15×90','Porcelain',150,900,8,920,170,100,26000,38000],
  ['MK','MK15902','Gạch giả gỗ nâu đậm 15×90','Porcelain',150,900,8,920,170,100,28000,40000],
  ['MK','MK2201','Gạch bông trang trí 20×20','Ceramic',200,200,25,220,220,240,8000,12500],
  ['AP','AP6604','Gạch lát nền đen vân trắng 60×60','Porcelain',600,600,4,620,620,50,45000,65000],
  ['AP','AP61202','Gạch ốp vân đá xám 60×120','Porcelain',600,1200,2,1220,620,35,110000,150000],
  ['SV','SV-LB01','Chậu lavabo treo tường trắng','Sứ vệ sinh',500,400,1,550,450,250,550000,790000],
  ['SV','SV-BC01','Bồn cầu hai khối trắng','Sứ vệ sinh',700,380,1,760,430,780,1800000,2450000],
].map(([manufacturerCode,sku,name,material,length,width,perBox,outerLengthMm,outerWidthMm,outerHeightMm,buy,sell])=>({
  manufacturerCode,sku,name,material,nominalSize:`${length}x${width}`,baseUnit:material==='Sứ vệ sinh'?'Chiếc':'Viên',
  perBox,buy,sell,packaging:{packageUnit:'Thùng',baseUnitsPerPackage:String(perBox),outerLengthMm,outerWidthMm,outerHeightMm},
}));
const same=(a,b)=>String(a)===String(b);
const id=key=>fixtureId('tile-shop:'+key);

export function buildTileShopScenario(data) {
  const stamp={createdAt:demoDate(1),updatedAt:demoDate(1),version:1};
  const labels=new Map();
  const rename=(row,field,value)=>{if(row[field]&&row[field]!==value) labels.set(row[field],value);row[field]=value;};
  const roleUser=code=>data.users.find(u=>same(u.roleId,data.roles.find(r=>r.code===code)._id));
  const owner=roleUser('OWNER');
  const staff=data.users.filter(u=>same(u.roleId,data.roles.find(r=>r.code==='WAREHOUSE')._id));
  data.warehouses.forEach((w,i)=>{
    rename(w,'name',['Kho gạch trung tâm','Kho gạch số 2','Kho thiết bị vệ sinh'][i]);
    Object.assign(w,{code:['K-GACH-01','K-GACH-02','K-TBVS-01'][i],
      address:['Khu kho cạnh cửa hàng','Khu kho vệ tinh','Khu kho thiết bị cạnh cửa hàng'][i],
      lengthMm:[60000,40000,30000][i],widthMm:[50000,25000,30000][i],clearHeightMm:6000,
      description:'Bố trí mô phỏng theo ba kho khảo sát. Các chiều đo chi tiết là dữ liệu kiểm thử.'});
  });
  const names=['Nguyễn Đức Minh','Trần Văn Thành','Nguyễn Thu Hà','Phạm Văn Hùng','Lê Văn Dũng','Đỗ Thị Lan'];
  data.users.forEach((u,i)=>{
    rename(u,'fullName',names[i]);
    rename(u,'username',['admin','chucuahang','banhang01','thukho01','thukho02','ketoan01'][i]);
    u.email=`${u.username}@tile-shop.example`;u.phone=`000000${String(i+1).padStart(4,'0')}`;
  });
  const addUser=(template,username,fullName,warehouses)=>{
    const u={...template,_id:id(username),username,fullName,email:`${username}@tile-shop.example`,
      phone:`000000${String(data.users.length+1).padStart(4,'0')}`,warehouseIds:warehouses,...stamp};
    data.users.push(u);return u;
  };
  staff.push(addUser(staff[0],'thukho03','Vũ Văn Nam',[data.warehouses[2]._id]));
  staff.forEach((u,i)=>{if(!u.warehouseIds.some(w=>same(w,data.warehouses[i]._id)))u.warehouseIds.push(data.warehouses[i]._id);});
  ['Trần Thị Mai','Lê Hoàng Anh','Phạm Thị Hương','Vũ Đức Long','Đặng Thu Trang','Bùi Văn Sơn'].forEach((name,i)=>
    addUser(roleUser('SALES'),`banhang0${i+2}`,name,data.warehouses.map(w=>w._id)));
  ['Nguyễn Ngọc Linh','Trần Minh Châu'].forEach((name,i)=>
    addUser(roleUser('ACCOUNTANT'),`ketoan0${i+2}`,name,data.warehouses.map(w=>w._id)));
  data.roles.forEach(r=>{if(r.code==='WAREHOUSE')r.name='Warehouse Staff';if(r.code==='WAREHOUSE_LEAD')r.name='Trưởng ca kho';});

  rename(data.customers[0],'name','Nguyễn Văn An');data.customers[0].code='KH-0001';data.customers[0].phone='0000010001';
  const customerNames=['Trần Thị Hoa','Lê Minh Đức','Phạm Văn Bình','Vũ Thu Hằng','Đặng Quang Hải','Bùi Ngọc Mai',
    'Hoàng Văn Tùng','Đỗ Thị Hạnh','Nguyễn Minh Khang','Trần Tuấn Anh','Lê Thị Phương','Phạm Đức Duy','Vũ Ngọc Yến',
    'Đặng Văn Lâm','Bùi Thị Thảo','Hoàng Minh Tâm','Đỗ Văn Quân','Nguyễn Thu Uyên','Trần Gia Bảo'];
  customerNames.forEach((name,i)=>data.customers.push({_id:id('customer:'+i),code:`KH-${String(i+2).padStart(4,'0')}`,name,
    phone:`000001${String(i+2).padStart(4,'0')}`,...stamp}));
  const supplierNames=['Công ty gạch An Phú','Công ty gạch Thành Việt','Nhà phân phối Minh Khôi','Thiết bị vệ sinh Sơn Việt'];
  supplierNames.forEach((name,i)=>{
    const row=i===0?data.suppliers[0]:{_id:id('supplier:'+i),...stamp};
    rename(row,'name',name);Object.assign(row,{code:`NCC-00${i+1}`,contactName:['Trần Anh Tuấn','Nguyễn Mỹ Linh','Phạm Quang Vinh','Lê Ngọc Hân'][i],
      phone:`000002000${i+1}`,email:`ncc${i+1}@tile-shop.example`,address:`Khu phân phối ${i+1} — địa chỉ mô phỏng`,status:'ACTIVE'});
    if(i)data.suppliers.push(row);
  });
  rename(data.delivery_teams[0],'name','Đội xe cửa hàng số 1');data.delivery_teams[0].code='XE-01';
  data.delivery_teams.push({_id:id('team:2'),code:'XE-02',name:'Đội xe cửa hàng số 2',isActive:true,...stamp});

  const specs=new Map();
  SHOP_PRODUCTS.forEach((spec,i)=>{
    const row=i<2?data.products[i]:{_id:id('product:'+spec.sku),...stamp};
    rename(row,'name',spec.name);
    Object.assign(row,{sku:spec.sku,manufacturerCode:spec.manufacturerCode,material:spec.material,nominalSize:spec.nominalSize,
      baseUnit:spec.baseUnit,wholeBaseUnits:true,isActive:true});
    if(i>=2)data.products.push(row);
    specs.set(String(row._id),spec);
  });
  for(const batch of data.product_batches) if(batch.identificationStatus==='VERIFIED') {
    const spec=specs.get(String(batch.productId));
    rename(batch,'manufacturerLot',`${spec.sku}-261001-A`);
    rename(batch,'calibre',spec.nominalSize==='600x600'?'598x598':'298x598');
  }
  const locationNames={RECEIVING:'Khu nhận hàng',STORAGE:'Khu lưu trữ',STAGING:'Khu tập kết xuất',QUARANTINE:'Khu hàng lỗi',CUSTODY:'Khu giữ hộ'};
  data.warehouse_locations.forEach((loc,i)=>{
    loc.name=locationNames[loc.locationType];loc.areaCode=loc.locationType;
    loc.code=`${loc.locationType}-${String(i+1).padStart(2,'0')}`;
  });
  // Bulk opening stock uses separate verified lots. Existing workflow ledgers retain their quantities.
  const openings=new Map();
  for(let i=0;i<data.products.length;i++) {
    const product=data.products[i],spec=specs.get(String(product._id));
    for(let lotNo=1;lotNo<=2;lotNo++) {
      const w=i>=18?2:(i+lotNo)%2,warehouse=data.warehouses[w],worker=staff[w];
      const batch={_id:id(`lot:${i}:${lotNo}`),productId:product._id,manufacturerLot:`${spec.sku}-2609${lotNo===1?'15':'28'}-${lotNo===1?'A':'B'}`,
        tone:lotNo===1?'A01':'A02',calibre:spec.nominalSize,identificationStatus:'VERIFIED',manufacturedOn:demoDate(0),...stamp};
      delete batch.version;data.product_batches.push(batch);
      const loc={_id:id(`bin:${i}:${lotNo}`),warehouseId:warehouse._id,code:`${i>=18?'TB':'G'}-${String(i+1).padStart(2,'0')}-${lotNo}`,
        name:`Ô ${spec.sku} · ${batch.tone}`,areaCode:i>=18?'TBVS':spec.nominalSize.startsWith('300x600')?'OP-TUONG':'LAT-NEN',
        locationType:'STORAGE',isPickable:true,isActive:true,usableLengthMm:2500,usableWidthMm:2500,usableHeightMm:2400,operationVersion:0,...stamp};
      data.warehouse_locations.push(loc);
      const point={_id:id('point:'+loc.code+':'+w),type:'LOCATION',locationId:loc._id,...stamp};
      // Stock holding points have no business version field.
      delete point.version;data.stock_holding_points.push(point);
      const boxes=i>=18?4+lotNo:24+(i%5)*8+lotNo*4,qty=decimalValue(boxes*spec.perBox);
      const balance={_id:id(`balance:${i}:${lotNo}`),holdingPointId:point._id,batchId:batch._id,qualityStatus:'GOOD',
        ownerType:'STORE',ownerId:null,quantityBase:qty,...stamp};
      data.inventory_balances.push(balance);
      let opening=openings.get(w);
      if(!opening) {
        opening=createDocument(data,'OPENING-SHOP-'+w,'OPENING',worker._id,{warehouseId:warehouse._id,
          cutoverKey:`shop-opening:${warehouse.code}`,openingAt:demoDate(2),coveredLocationIds:[],
          sourceDescription:'Biên bản đối chiếu hàng tồn tại các ô trước khi bắt đầu kỳ tháng 10',
          preparedBy:worker._id,preparedAt:demoDate(1),verifiedBy:owner._id,verifiedAt:demoDate(2),verifiedVersion:1},'POSTED',2);
        const tx={_id:id('opening-tx:'+w),sourceType:'opening_stocks',sourceId:opening._id,operation:'OPENING',
          eventKey:'opening',requestKey:`shop-opening:${w}`,requestHash:hash(`shop-opening:${w}`),performedBy:owner._id,
          occurredAt:demoDate(2),recordedAt:demoDate(2),createdAt:demoDate(2),updatedAt:demoDate(2)};
        data.stock_transactions.push(tx);Object.assign(opening,{stockTransactionId:tx._id,postedBy:owner._id,postedAt:demoDate(2)});
        openings.set(w,opening);
      }
      opening.header.coveredLocationIds.push(loc._id);
      const item=addItem(opening,`shop-opening:${i}:${lotNo}`,product,batch,String(qty));
      Object.assign(item,{enteredUnit:'Thùng',enteredQty:decimalValue(boxes),baseUnitsPerUnit:decimalValue(spec.perBox),
        packagingSnapshot:{...spec.packaging},locationId:loc._id,ownerType:'STORE',qualityStatus:'GOOD'});
      data.stock_movements.push({_id:id(`opening-move:${i}:${lotNo}`),transactionId:opening.stockTransactionId,lineNo:opening.items.length,
        sourceLineId:item._id,toBalanceId:balance._id,quantityBase:qty,toBefore:decimalValue(0),toAfter:qty,createdAt:demoDate(2),updatedAt:demoDate(2)});
    }
  }
  const ctx=dataContext(data);
  for(const {document:doc} of ctx.documents.values()) {
    for(const item of doc.items??[]) {
      const spec=specs.get(String(item.productId));if(!spec)continue;
      item.productNameSnapshot=spec.name;item.baseUnitSnapshot=spec.baseUnit;
      item.packagingSnapshot={...spec.packaging};
      const q=exact(item.qtyBase),wholeBoxes=q.mod(spec.perBox).isZero();
      // Physically full cartons are entered as cartons. Inspection splits may be loose pieces.
      if(['ARRIVAL','INSPECTION','GR_PURCHASE','PO'].includes(doc.documentKind)&&wholeBoxes) {
        item.enteredUnit='Thùng';item.baseUnitsPerUnit=decimalValue(spec.perBox);item.enteredQty=decimalValue(q.div(spec.perBox));
      } else if(String(item.baseUnitsPerUnit)==='1') item.enteredUnit=spec.baseUnit;
      if(doc.documentKind==='PO') {
        item.unitPurchasePrice=decimalValue(exact(item.baseUnitsPerUnit).mul(spec.buy));
        item.lineAmount=decimalValue(exact(item.enteredQty).mul(String(item.unitPurchasePrice)));
      }
    }
    if(doc.documentKind==='PO')doc.totalAmount=decimalValue(doc.items.reduce((s,x)=>s.plus(String(x.lineAmount)),exact(0)));
  }
  // Human-readable document numbers. Rewrite saved labels as well as document headers.
  const prefixes={REPLENISHMENT:'RR',PO:'PO',ARRIVAL:'HD',INSPECTION:'KN',GR_PURCHASE:'PN',TO:'TO',
    TRANSFER_REQUEST:'TR',INTERNAL_TRANSFER_REQUIREMENT:'ITR',TRANSFER_DISPATCH:'PXC',MWTR:'PNC',
    SALES_ORDER:'SO',ISSUE_REQUEST:'WIR',OUTBOUND_DELIVERY:'LG',GI_SALE:'PX',DELIVERY_CONFIRMATION:'BG',
    PAYMENT_CONFIRMATION:'XNT',OPENING:'TDK',HANDOVER:'BGVC'};
  const counters=new Map();
  for(const {document:doc} of ctx.documents.values()) {
    const n=(counters.get(doc.documentKind)??0)+1;counters.set(doc.documentKind,n);
    rename(doc,'documentNo',`${prefixes[doc.documentKind]??doc.documentKind}-202610-${String(n).padStart(3,'0')}`);
  }
  data.sales_invoices.forEach((inv,i)=>{inv.invoiceNo=`HD-202610-${String(i+1).padStart(3,'0')}`;});
  const replacements=[...labels].sort((a,b)=>b[0].length-a[0].length);
  function updateText(value) {
    if(typeof value==='string'){for(const [before,after] of replacements)value=value.replaceAll(before,after);return value;}
    if(!value||typeof value!=='object'||value._bsontype||value instanceof Date||Buffer.isBuffer(value))return value;
    for(const key of Object.keys(value))value[key]=updateText(value[key]);return value;
  }
  updateText(data);
  for(const po of data.purchase_orders) {
    const supplier=ctx.byId('suppliers',po.header.supplierId);po.header.supplierSnapshot={code:supplier.code,name:supplier.name};
  }
  for(const invoice of data.sales_invoices) {
    const customer=ctx.byId('customers',invoice.customerId);invoice.customerSnapshot={name:customer.name,phone:customer.phone};
    for(const item of invoice.items)item.saleUnit=specs.get(String(item.productId)).baseUnit;
  }
  for(const issue of data.sales_goods_issues)for(const item of issue.items) {
    if(item.salePriceSnapshot)item.salePriceSnapshot.saleUnit=specs.get(String(item.productId)).baseUnit;
  }
  for(const {document:doc} of ctx.documents.values()) {
    if(doc.header?.recipientName==='Khách hàng mẫu')doc.header.recipientName=data.customers[0].name;
    for(const handover of doc.handovers??[])handover.header.recipientName='Nguyễn Văn Tài';
  }
  // Rebuild the physical packing representation from the exact final balances.
  data.storage_stacks=[];data.storage_stack_items=[];
  for(const balance of data.inventory_balances) {
    if(exact(balance.quantityBase).isZero())continue;
    const point=ctx.byId('stock_holding_points',balance.holdingPointId);if(point.type!=='LOCATION')continue;
    const location=ctx.byId('warehouse_locations',point.locationId),batch=ctx.byId('product_batches',balance.batchId);
    const spec=specs.get(String(batch.productId)),w=data.warehouses.findIndex(row=>same(row._id,location.warehouseId));
    const q=exact(balance.quantityBase),packs=q.div(spec.perBox).floor().toNumber(),loose=q.mod(spec.perBox);
    const sealed=balance.qualityStatus==='GOOD'&&balance.ownerType==='STORE';
    const addStack=(suffix,amount,packCount)=>{
      const p=spec.packaging,full=packCount!=null;
      const stack={_id:id(`stack:${balance._id}:${suffix}`),locationId:location._id,code:`CH-${String(data.storage_stacks.length+1).padStart(4,'0')}`,
        occupiedLengthMm:full?Math.max(2*p.outerLengthMm,1200):p.outerLengthMm,
        occupiedWidthMm:full?Math.max(2*p.outerWidthMm,1000):p.outerWidthMm,
        occupiedHeightMm:full?Math.ceil(packCount/4)*p.outerHeightMm:p.outerHeightMm,
        volumeMethod:full?'PACKAGES':'MEASURED',isCleared:false,createdBy:staff[w]._id,...stamp};
      if(full)stack.supportVolumeMm3=decimalValue(0);
      else stack.measurementNote='Kích thước bao ngoài của phần hàng lẻ hoặc chờ xử lý, mô phỏng';
      data.storage_stacks.push(stack);
      data.storage_stack_items.push({_id:id(`stack-item:${balance._id}:${suffix}`),stackId:stack._id,balanceId:balance._id,
        packagingState:full?'SEALED':'LOOSE',packagingSnapshot:{...p},packagingKey:full?`${spec.sku}:${batch.manufacturerLot}`:'LOOSE',
        ...(full?{sealedPackCount:packCount}:{}),quantityBase:decimalValue(amount),createdBy:staff[w]._id,...stamp});
    };
    if(sealed&&packs)addStack('sealed',packs*spec.perBox,packs);
    if(sealed&&!loose.isZero())addStack('loose',loose);
    if(!sealed)addStack('loose',q);
  }
}
