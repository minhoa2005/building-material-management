import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutSchema } from '../src/modules/warehouse-stock/layout.js';
const rectangle={points:[{x:0,y:0},{x:10,y:0},{x:10,y:8},{x:0,y:8}],height:4,doors:[]};
test('accepts rectangular and concave warehouse floors',()=>{
  assert.equal(layoutSchema.safeParse(rectangle).success,true);
  assert.equal(layoutSchema.safeParse({...rectangle,points:[{x:0,y:0},{x:10,y:0},{x:10,y:4},{x:4,y:4},{x:4,y:8},{x:0,y:8}]}).success,true);
});
test('rejects self crossing and zero area floors',()=>{
  assert.equal(layoutSchema.safeParse({...rectangle,points:[{x:0,y:0},{x:10,y:8},{x:10,y:0},{x:0,y:8}]}).success,false);
  assert.equal(layoutSchema.safeParse({...rectangle,points:[{x:0,y:0},{x:1,y:0},{x:2,y:0}]}).success,false);
});
test('doors must fit walls and cannot overlap',()=>{
  const door={edge:0,offset:2,width:3,height:3.5};
  assert.equal(layoutSchema.safeParse({...rectangle,doors:[door]}).success,true);
  for(const doors of [[{...door,width:9}],[{...door,height:5}],[door,{...door,offset:3}],[{...door,edge:9}]]) assert.equal(layoutSchema.safeParse({...rectangle,doors}).success,false);
});
