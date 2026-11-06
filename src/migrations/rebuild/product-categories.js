import { seedFingerprint } from '../../seeds/rebuild/database.js';

// The fixture upgrade is additive: five categories and only categoryId on products.
// Refuse any remote state other than the exact original or exact upgraded copy.
export function planCategoryUpgrade(original, upgraded, current) {
  const expectedHash=seedFingerprint(upgraded);
  if(seedFingerprint(current)===expectedHash)return {action:'VERIFY_ONLY',expectedHash};
  const {categories,...baseline}=current;
  if(categories?.length||current.products.some(product=>product.categoryId))throw new Error('CATEGORY_UPGRADE_TARGET_CHANGED');
  if(seedFingerprint(baseline)!==seedFingerprint(original))throw new Error('CATEGORY_UPGRADE_TARGET_CHANGED');
  return {action:'ADD_CATEGORIES',expectedHash};
}
