import { db } from '../database.js';
import { houseproperties } from '@shared/schema';
import { type InsertHouseProperty } from '@shared/schema';
import { sql } from 'drizzle-orm';

// 生成建表SQL
export function generateCreateTableSql(): string {
  return `
    CREATE TABLE IF NOT EXISTS houseproperties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT,
      price INTEGER NOT NULL,
      original_price INTEGER,
      price_change_date TEXT,
      bedroom INTEGER,
      bathrooms REAL,
      square_feet INTEGER,
      lot_size INTEGER,
      property_type TEXT,
      building_type TEXT,
      ownership_type TEXT,
      age INTEGER,
      description TEXT,
      features TEXT,
      amenities TEXT,
      images TEXT,
      virtual_tours TEXT,
      latitude REAL,
      longitude REAL,
      neighborhood TEXT,
      school_district TEXT,
      zoning TEXT,
      taxes INTEGER,
      strata_fee INTEGER,
      maintenance_fee INTEGER,
      year_built INTEGER,
      style TEXT,
      stories INTEGER,
      title TEXT,
      parking_type TEXT,
      parking_spaces INTEGER,
      heating_type TEXT,
      cooling_type TEXT,
      fireplace INTEGER,
      basement TEXT,
      exterior TEXT,
      roof TEXT,
      view TEXT,
      water TEXT,
      sewer TEXT,
      status TEXT,
      days_on_market INTEGER,
      last_updated TEXT,
      mls_number TEXT,
      listing_date TEXT,
      open_house TEXT,
      agent_name TEXT,
      agent_phone TEXT,
      agent_company TEXT,
      created_at TEXT,
      updated_at TEXT,
      -- 新增字段
      id_address TEXT,
      seo_municipality TEXT,
      seo_address TEXT,
      ml_num TEXT,
      hash_id TEXT,
      house_type_name TEXT,
      house_type TEXT,
      address_seo TEXT,
      address_navigation TEXT,
      list_status TEXT,
      list_dates TEXT,
      id_community INTEGER,
      id_municipality INTEGER,
      community_name TEXT,
      municipality_area TEXT,
      country TEXT,
      province_name TEXT,
      cross_street TEXT,
      bedroom_plus INTEGER,
      bedroom_string INTEGER,
      parking_info TEXT,
      price_abbr TEXT,
      price_sold TEXT,
      price_sold_int INTEGER,
      price_tag TEXT,
      map_info TEXT,
      tax_int INTEGER,
      maintenance_int INTEGER,
      brokerage TEXT,
      text_info TEXT,
      house_area TEXT,
      land_info TEXT,
      tos_source TEXT,
      data_source_raw TEXT,
      data_source_text TEXT,
      copyright_text TEXT,
      agent_user TEXT,
      bind_agent_user TEXT,
      contact_message TEXT,
      postal_code_seo TEXT,
      pending_review_text TEXT,
      list_agent_name TEXT,
      brokerage_text TEXT,
      schedule_message TEXT,
      direct_contact_message TEXT,
      key_facts TEXT,
      property_detail TEXT,
      listing_history TEXT,
      rooms_info TEXT,
      community_stats TEXT,
      analytics_info TEXT
    )
  `;
}

// 生成插入SQL
export function generateInsertSql(property: InsertHouseProperty): string {
  const columns = Object.keys(property).join(', ');
  const values = Object.values(property)
    .map(v => {
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'object') return `'${JSON.stringify(v)}'`;
      if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
      return v;
    })
    .join(', ');
    
  return `INSERT INTO houseproperties (${columns}) VALUES (${values})`;
}

// 导入数据到数据库
export async function importToDatabase(property: InsertHouseProperty) {
  // 检查表是否存在，不存在则创建
  await db.run(sql`${sql.raw(generateCreateTableSql())}`);
  
  // 检查记录是否已存在
  const existing = await db.select()
    .from(houseproperties)
    .where(sql`listing_id = ${property.listingId}`)
    .get();

  console.log('准备插入的数据Data prepared:', JSON.stringify(property, null, 2));
  try {
    const result = "";
    if (existing) {
      // 更新现有记录
      const result = await db.update(houseproperties)
        .set(property)
        .where(sql`listing_id = ${property.listingId}`)
        .run();
    } else {
      // 插入新记录
      const result = await db.insert(houseproperties)
        .values(property)
        .run();
    }    
    console.log('插入结果:', result);
    return result;
  } catch (e) {
    console.error('插入失败:', e);
    throw e;
  }
}

// 转换HouseSigma数据到数据库格式
export function transformHouseSigmaData(data: any): InsertHouseProperty {
  const now = new Date().toISOString();
  
  try {
    console.log('[DEBUG] 开始转换房产数据');
    
    // 从API响应中提取关键数据
    const houseData = data.house || data;
    console.log('[DEBUG] houseData:', JSON.stringify({
      id_listing: houseData.id_listing,
      address: houseData.address,
      city: houseData.city
    }, null, 2));

    const assessmentData = data.assessment?.properties || {};
    const pictureData = data.picture || {};
    const keyFacts = data.key_facts_v2 || {};
    const propertyDetail = data.property_detail || {};
    const analytics = data.analytics || {};
    
    // console.log('[DEBUG] propertyDetail.building:', propertyDetail.building);
    // const building_kv = new Map(propertyDetail.building.value?.map((item: { name: any; value: any; }) => [item.name, item.value]) || []);

    // 验证必要字段
    if (!houseData.id_listing) {
      console.error('[ERROR] 缺少必要字段: id_listing');
      console.error('[DEBUG] houseData:', JSON.stringify(houseData, null, 2));
      throw new Error('缺少房产ID(id_listing)');
    }

    if (!houseData.address) {
      console.warn('[WARN] 缺少地址信息(address)');
    }

    const result = {
    listingId: houseData.id_listing,
    idAddress: houseData.id_address,
    seoMunicipality: houseData.seo_municipality,
    seoAddress: houseData.seo_address,
    squareFeet: houseData.house_area?.estimate || 0,
    mlNum: houseData.ml_num,
    hashId: houseData.hash_id,
    houseTypeName: houseData.house_type_name,
    houseType: houseData.house_type_name,
    address: houseData.address,
    addressSeo: houseData.address_seo,
    addressNavigation: houseData.address_navigation,
    listStatus: houseData.list_status,
    listDates: houseData.list_dates,
    idCommunity: houseData.id_community,
    idMunicipality: houseData.id_municipality,
    communityName: houseData.community_name,
    municipalityName: houseData.municipality_name,
    municipalityArea: houseData.municipality_area,
    country: houseData.country,
    province: houseData.province,
    provinceName: houseData.province_name,
    crossStreet: houseData.cross_street,
    bedroom: houseData.bedroom,
    bedroomPlus: houseData.bedroom_plus,
    bedroomString: houseData.bedroom_string,
    washroom: houseData.washroom,
    parkingInfo: houseData.parking,
    price: houseData.price_int,
    priceAbbr: houseData.price_abbr,
    priceSold: houseData.price_sold,
    priceSoldInt: houseData.price_sold_int,
    priceTag: houseData.price_tag,
    mapInfo: JSON.stringify(houseData.map || {}),
    taxInt: houseData.tax_int,
    maintenanceInt: houseData.maintenance_int,
    brokerage: houseData.brokerage,
    textInfo: houseData.text,
    houseArea: houseData.house_area,
    landInfo: houseData.land ,
    postalCode: houseData.postal_code,
    postalCodeSeo: houseData.postal_code_seo,
    tosSource: houseData.tos_source,
    dataSourceRaw: houseData.data_source_raw,
    dataSourceText: houseData.data_source_text,
    copyrightText: houseData.copyright_text,
    agentUser: houseData.agent_user,
    bindAgentUser: houseData.bind_agent_user,
    contactMessage: houseData.contact_message,
    pendingReviewText: houseData.pending_review_text,
    listAgentName: houseData.list_agent_name,
    brokerageText: houseData.brokerage_text,
    scheduleMessage: houseData.schedule_message,
    directContactMessage: houseData.direct_contact_message,
    keyFacts: JSON.stringify(keyFacts || {}),
    propertyDetail: JSON.stringify(propertyDetail || {}),
    listingHistory: JSON.stringify(data.listing_history || {}),
    roomsInfo: JSON.stringify(data.rooms || {}),
    communityStats: JSON.stringify(data.community_stats || {}),
    analyticsInfo: JSON.stringify(analytics || {}),
    city: assessmentData.city || houseData.city || houseData.municipality_name || 'Unknown',
    description: keyFacts.description1.value || '',
    features: JSON.stringify(keyFacts.summary.value || []),
    amenities: JSON.stringify(houseData.amenities || []),
    images: JSON.stringify(pictureData.photo_list || []),
    virtualTours: JSON.stringify(houseData.virtual_tours || []),
    latitude: houseData.map?.lat || 0,
    longitude: houseData.map?.lon || 0,
    neighborhood: assessmentData.neighborhood || houseData.neighborhood || houseData.community_name || 'Unknown',
    yearBuilt: keyFacts.build_year?.value || houseData.year_built,
    status: houseData.list_status?.text || '',
    daysOnMarket: houseData.days_on_market || 0,
    lastUpdated: now,
    mlsNumber: houseData.ml_num,
    listingDate: houseData.list_dates?.date_start || now,
    openHouse: JSON.stringify(houseData.open_house || []),
    agentName: houseData.agent_user?.name || '',
    agentPhone: houseData.agent_user?.phone || '',
    agentCompany: houseData.brokerage || '',
    createdAt: now,
    updatedAt: now
  };

  console.log('[DEBUG] 转换完成:', JSON.stringify({
    listingId: result.listingId,
    address: result.address,
    price: result.price
  }, null, 2));
  
  return result;
  } catch (error) {
    console.error(error); // 打印完整错误对象，包括堆栈
    //console.error('[DEBUG] 原始数据:', JSON.stringify(data, null, 2));
    throw new Error(`[ERROR] 房产数据转换失败: ${error}\n${error instanceof Error ? error.stack : ''}`);
  }
}
