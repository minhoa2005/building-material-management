import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {buildReviewedDemo} from '../src/seeds/rebuild/data.js';
import {addTileCategories} from '../src/seeds/rebuild/categories.js';
import {registerReviewedModels} from '../src/models/index.js';
import {validateReviewedDemo} from '../src/seeds/rebuild/validate.js';
import {planCategoryUpgrade} from '../src/migrations/rebuild/product-categories.js';
const models=registerReviewedModels(mongoose.createConnection());
const data=await buildReviewedDemo();
const clone=x=>mongoose.mongo.BSON.EJSON.parse(mongoose.mongo.BSON.EJSON.stringify(x));
const {categories,...original}=clone(data);
original.products=original.products.map(({categoryId,...product})=>product);

test('five approved categories classify every fixture product once and preserve all existing data',()=>{
  const upgraded=addTileCategories(original);
  assert.equal(upgraded.categories.length,5);
  assert.ok(upgraded.products.every(p=>upgraded.categories.some(c=>String(c._id)===String(p.categoryId))));
  const {categories:_,...rest}=upgraded;
  rest.products=rest.products.map(({categoryId,...p})=>p);
  assert.deepEqual(rest,original);
  assert.ok(original.products.every(p=>!p.categoryId));
  const counts=upgraded.categories.map(c=>upgraded.products.filter(p=>String(p.categoryId)===String(c._id)).length);
  assert.deepEqual(counts,[9,3,2,2,2]);
});
test('category reference is mandatory, scalar and must resolve to an existing category',async()=>{
  const p=clone(data.products[0]);delete p.categoryId;
  await assert.rejects(new (models.get('products'))(p).validate(),/categoryId/);
  await assert.rejects(new (models.get('products'))({...p,categoryId:[data.categories[0]._id,data.categories[1]._id]}).validate());
  const bad=clone(data);bad.products[0].categoryId=new mongoose.Types.ObjectId();
  await assert.rejects(validateReviewedDemo(bad,models),/references/);
});
test('categories have required code/name and a unique immutable code without redundant version',async()=>{
  const Category=models.get('categories');
  await assert.rejects(new Category({code:'',name:'Gạch'}).validate());
  await assert.rejects(new Category({code:'C01',name:''}).validate());
  assert.equal(Category.schema.path('code').options.immutable,true);
  assert.ok(Category.schema.indexes().some(([key,opt])=>key.code===1&&opt.unique));
  assert.ok(!Category.schema.path('version'));
});
test('fixture classification rejects unknown products or existing assignments instead of guessing',()=>{
  const unknown=clone(original);unknown.products[0].sku='UNKNOWN';
  assert.throws(()=>addTileCategories(unknown),/Explicit category assignment/);
  assert.throws(()=>addTileCategories(data),/already present/);
  const assigned=clone(original);assigned.products[0].categoryId=data.categories[0]._id;
  assert.throws(()=>addTileCategories(assigned),/already classified/);
});
test('category upgrade accepts only the unchanged baseline or an identical completed upgrade',()=>{
  const upgraded=addTileCategories(original);
  assert.equal(planCategoryUpgrade(original,upgraded,original).action,'ADD_CATEGORIES');
  assert.equal(planCategoryUpgrade(original,upgraded,{...original,categories:[]}).action,'ADD_CATEGORIES');
  assert.equal(planCategoryUpgrade(original,upgraded,upgraded).action,'VERIFY_ONLY');
  const changed=clone(original);changed.products[0].name='Someone edited this';
  assert.throws(()=>planCategoryUpgrade(original,upgraded,changed),/TARGET_CHANGED/);
  assert.throws(()=>planCategoryUpgrade(original,upgraded,{...original,categories:[data.categories[0]]}),/TARGET_CHANGED/);
});
