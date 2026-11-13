import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutSchema} from '../src/modules/warehouse-stock/layout.js';
import {applicationIssues} from '../src/modules/warehouse-stock/layout-geometry.js';
const base={points:[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}],height:4,doors:[],functions:[{id:'f',name:'Lưu trữ'}],zones:[{id:'z',name:'Khu A',x:1,y:1,width:5,length:5,rotation:0,color:'#60a5fa',functionId:'f',slots:[{id:'s',name:'Ô A',x:0,y:0,width:2,length:2,pallets:[]}]}]};
test('accepts pallet dimensions and warns when height exceeds zone limit',()=>{
 const pallet={id:'p',code:'P-01',x:0,y:0,width:1,length:1,baseHeight:0.15,stackHeight:2.1,planned:true};
 const layout={...base,zones:[{...base.zones[0],maxHeight:2,slots:[{...base.zones[0].slots[0],pallets:[pallet]}]}]};
 assert.equal(layoutSchema.safeParse(layout).success,true); assert.match(applicationIssues(layout)[0],/Pallet P-01/);
});
test('rejects pallet outside its slot',()=>{
 const pallet={id:'p',code:'P-01',x:1.5,y:0,width:1,length:1,baseHeight:0.15,stackHeight:1};
 const layout={...base,zones:[{...base.zones[0],slots:[{...base.zones[0].slots[0],pallets:[pallet]}]}]};
 assert.equal(layoutSchema.safeParse(layout).success,false);
});
