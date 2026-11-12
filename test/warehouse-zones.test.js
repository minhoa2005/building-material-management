import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutSchema} from '../src/modules/warehouse-stock/layout.js';
import {containsPolygon,corners,rectanglesOverlap,containmentIssues,applicationIssues,arrangementSize,slotCorners} from '../src/modules/warehouse-stock/layout-geometry.js';
const floor={points:[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}],height:4,doors:[],functions:[{id:'storage',name:'Lưu trữ'}]};
const zone={id:'z',name:'Khu A',x:1,y:1,width:4,length:3,rotation:0,color:'#60a5fa',functionId:'storage',slots:[]};
test('accepts touching regions and rejects positive overlap even when rotated',()=>{
 assert.equal(rectanglesOverlap(zone,{...zone,x:5}),false);
 assert.equal(rectanglesOverlap(zone,{...zone,x:4.9}),true);
 assert.equal(rectanglesOverlap({...zone,rotation:45},{...zone,x:1.1,rotation:45}),true);
 assert.equal(layoutSchema.safeParse({...floor,zones:[zone,{...zone,id:'z2',x:5}]}).success,true);
 assert.equal(layoutSchema.safeParse({...floor,zones:[zone,{...zone,id:'z2',x:4.9}]}).success,false);
});
test('detects regions crossing a concave gap despite all corners lying inside',()=>{
 const u=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:7,y:10},{x:7,y:3},{x:3,y:3},{x:3,y:10},{x:0,y:10}];
 assert.equal(containsPolygon(u,corners({x:1,y:1,width:8,length:8})),false);
 assert.equal(containsPolygon(u,corners({x:0,y:0,width:3,length:10})),true);
});
test('keeps out-of-bounds designs structurally valid as drafts and reports apply blockers',()=>{
 const draft={...floor,zones:[{...zone,x:9,slots:[{id:'s',name:'Ô A',x:3,y:0,width:2,length:1}]}]};
 assert.equal(layoutSchema.safeParse(draft).success,true);
 assert.equal(containmentIssues(draft).length,2);
});
test('rejects unknown functions, excessive heights and overlapping slots',()=>{
 assert.equal(layoutSchema.safeParse({...floor,zones:[{...zone,functionId:'missing'}]}).success,false);
 assert.equal(layoutSchema.safeParse({...floor,maxStackHeight:3,zones:[{...zone,maxHeight:3.5}]}).success,false);
 const slot={id:'s',name:'Ô A',x:0,y:0,width:1,length:1};
 assert.equal(layoutSchema.safeParse({...floor,zones:[{...zone,slots:[slot,{...slot,id:'s2',name:'Ô B',x:0.5}]}]}).success,false);
});
test('calculates pallet grid sizes and rotates local slot coordinates with parent region',()=>{
 const result=arrangementSize({rows:1,columns:2,palletWidth:1,palletLength:1.2,gap:0.1,margin:0.05});
 assert.ok(Math.abs(result.width-2.2)<1e-9);assert.ok(Math.abs(result.length-1.3)<1e-9);
 const points=slotCorners({...zone,rotation:90},{x:1,y:0,width:1,length:1});
 assert.ok(Math.abs(points[0].x-1)<1e-9);assert.ok(Math.abs(points[0].y-2)<1e-9);
});
test('permits unassigned regions in drafts but requires functions when applying',()=>{
 const draft={...floor,functions:[],zones:[{...zone,functionId:''}]};
 assert.equal(layoutSchema.safeParse(draft).success,true);
 assert.equal(containmentIssues(draft).length,0);
 assert.match(applicationIssues(draft)[0],/chưa được gán chức năng/);
});
