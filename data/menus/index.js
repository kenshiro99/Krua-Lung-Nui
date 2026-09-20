/**
 * ครัวลุงหนุ่ย - รวมรายการเมนูทั้งหมดจากโมดูลย่อย (Unified Menu Registry)
 * รวบรวม 43 รายการอาหารและเครื่องดื่ม
 */

// Node.js CommonJS Loader
if (typeof module !== 'undefined' && module.exports) {
  const recommend = require('./recommend');
  const alacarte = require('./alacarte');
  const isan = require('./isan');
  const soupYum = require('./soup_yum');
  const drinkPromo = require('./drink_promo');
  const alcohol = require('./alcohol');
  const mixer = require('./mixer');

  const ALL_MENUS = [
    ...recommend,
    ...alacarte,
    ...isan,
    ...soupYum,
    ...drinkPromo,
    ...alcohol,
    ...mixer
  ];
  module.exports = ALL_MENUS;
}

// Browser Global Loader
if (typeof window !== 'undefined') {
  window.DEFAULT_MENUS = [
    ...(window.RECOMMEND_MENUS || []),
    ...(window.ALACARTE_MENUS || []),
    ...(window.ISAN_MENUS || []),
    ...(window.SOUP_YUM_MENUS || []),
    ...(window.DRINK_PROMO_MENUS || []),
    ...(window.ALCOHOL_MENUS || []),
    ...(window.MIXER_MENUS || [])
  ];
}
