import { createHash } from 'node:crypto';
import mongoose from 'mongoose';

// Approved on 06/11/2026 after reviewing https://gachtot.vn/.
// Brand, dimensions and color remain independent product fields.
export const TILE_CATEGORIES = Object.freeze([
  {code:'GACH-LAT-NEN',name:'Gạch lát nền',description:'Gạch dùng lát nền, gồm các mẫu chống trượt phòng tắm.'},
  {code:'GACH-OP-TUONG',name:'Gạch ốp tường',description:'Gạch ốp tường và các bề mặt đứng.'},
  {code:'GACH-TRANG-TRI',name:'Gạch trang trí',description:'Gạch điểm, gạch bông và các mẫu tạo điểm nhấn.'},
  {code:'GACH-SAN-VUON',name:'Gạch sân vườn',description:'Gạch dùng lát sân và khu vực ngoài trời.'},
  {code:'GACH-GIA-GO',name:'Gạch giả gỗ',description:'Gạch có thiết kế mô phỏng vân gỗ.'},
]);

const fixtureCategoryBySku = Object.freeze({
  'AP:AP6601':'GACH-LAT-NEN','AP:AP6602':'GACH-LAT-NEN','AP:AP6603':'GACH-LAT-NEN',
  'AP:AP8801':'GACH-LAT-NEN','AP:AP8802':'GACH-LAT-NEN','AP:AP61201':'GACH-LAT-NEN',
  'AP:AP6604':'GACH-LAT-NEN','TV:TV3301':'GACH-LAT-NEN','TV:TV3302':'GACH-LAT-NEN',
  'TV:TV3601':'GACH-OP-TUONG','TV:TV3602':'GACH-OP-TUONG','AP:AP61202':'GACH-OP-TUONG',
  'TV:TV3603':'GACH-TRANG-TRI','MK:MK2201':'GACH-TRANG-TRI',
  'TV:TV4401':'GACH-SAN-VUON','TV:TV4402':'GACH-SAN-VUON',
  'MK:MK15901':'GACH-GIA-GO','MK:MK15902':'GACH-GIA-GO',
});

export function buildTileCategories() {
  const stamp=new Date('2026-11-06T00:00:00.000Z');
  return TILE_CATEGORIES.map(row=>({
    _id:new mongoose.Types.ObjectId(createHash('sha256').update('wmsd:tile-category:v1:'+row.code).digest('hex').slice(0,24)),
    ...row,isActive:true,createdAt:stamp,updatedAt:stamp,
  }));
}

// This is an explicit classification for the synthetic shop fixture only.
// Unknown real products require an explicit assignment, never a guessed name match.
export function addTileCategories(data) {
  if(Object.hasOwn(data,'categories'))throw new Error('Categories already present; do not overwrite');
  const categories=buildTileCategories();
  const products=data.products.map(product=>{
    if(product.categoryId)throw new Error('Product already classified; do not overwrite');
    const code=fixtureCategoryBySku[product.manufacturerCode+':'+product.sku];
    const category=categories.find(row=>row.code===code);
    if(!category)throw new Error('Explicit category assignment required for product '+product._id);
    return {...product,categoryId:category._id};
  });
  return {...data,categories,products};
}
