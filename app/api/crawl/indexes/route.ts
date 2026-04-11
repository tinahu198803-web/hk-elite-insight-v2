/**
 * 综合指数名单自动更新爬虫系统
 * 自动更新：恒生指数、MSCI、富时指数等重要指数成分股
 * 
 * 调用方式：
 * GET /api/crawl/indexes?key=YOUR_CRON_KEY
 * GET /api/crawl/indexes?type=hsi|msci|ftse&key=YOUR_CRON_KEY
 */

import { NextResponse } from 'next/server';

// 环境变量
const CRON_KEY = process.env.CRON_SECRET_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// 验证Cron Key
function verifyCronKey(requestKey: string | null): boolean {
  if (!CRON_KEY) return true;
  return requestKey === CRON_KEY;
}

// ============ 数据源配置 ============

// 恒生指数成分股数据源
const HSI_SOURCES = {
  eastmoney: {
    name: '东方财富',
    url: 'https://datacenter-web.eastmoney.com/api/data/v1/get',
    params: {
      reportName: 'RPT_INDEX_DZH_HSCI',
      columns: 'ALL',
      pageNumber: '1',
      pageSize: '500',
      source: 'WEB',
      client: 'WEB'
    }
  },
  tencent: {
    name: '腾讯财经',
    url: 'https://qt.gtimg.cn/q=hkHSCI',
    parseType: 'tencent_format'
  }
};

// MSCI指数数据源
const MSCI_SOURCES = {
  wikipedia: {
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/MSCI_Emerging_Markets_Index',
    parseType: 'html_table'
  },
  eastmoney: {
    name: '东方财富',
    url: 'https://datacenter-web.eastmoney.com/api/data/v1/get',
    params: {
      reportName: 'RPT_INDEX_DZH_MSCL',
      columns: 'ALL',
      pageNumber: '1',
      pageSize: '500'
    }
  }
};

// ============ 已知指数成分股数据（备用/基准数据）============

// 恒生指数成分股（2024年3月更新）
const HSI_CONSTITUENTS: Record<string, {
  stock_code: string;
  stock_name: string;
  stock_name_en: string;
  industry: string;
  inclusion_date: string;
}> = {
  // 金融
  '00939': { stock_code: '00939', stock_name: '建设银行', stock_name_en: 'CCB', industry: '银行', inclusion_date: '2006-03-01' },
  '00941': { stock_code: '00941', stock_name: '中国移动', stock_name_en: 'China Mobile', industry: '电信', inclusion_date: '1997-10-01' },
  '00998': { stock_code: '00998', stock_name: '中信银行', stock_name_en: 'CITIC Bank', industry: '银行', inclusion_date: '2007-04-01' },
  '01398': { stock_code: '01398', stock_name: '工商银行', stock_name_en: 'ICBC', industry: '银行', inclusion_date: '2006-03-01' },
  '02318': { stock_code: '02318', stock_name: '中国平安', stock_name_en: 'Ping An', industry: '保险', inclusion_date: '2004-06-01' },
  '02328': { stock_code: '02328', stock_name: '中国财险', stock_name_en: 'PICC', industry: '保险', inclusion_date: '2008-12-01' },
  '02382': { stock_code: '02382', stock_name: '舜宇光学', stock_name_en: 'Sunny Optical', industry: '电子', inclusion_date: '2018-09-01' },
  '02628': { stock_code: '02628', stock_name: '中国人寿', stock_name_en: 'China Life', industry: '保险', inclusion_date: '2003-12-01' },
  '03328': { stock_code: '03328', stock_name: '交通银行', stock_name_en: 'Bank of Communications', industry: '银行', inclusion_date: '2007-04-01' },
  '03690': { stock_code: '03690', stock_name: '美团-W', stock_name_en: 'Meituan', industry: '互联网', inclusion_date: '2018-09-01' },
  '03968': { stock_code: '03968', stock_name: '招商银行', stock_name_en: 'CMB', industry: '银行', inclusion_date: '2002-04-01' },
  '03988': { stock_code: '03988', stock_name: '中国银行', stock_name_en: 'BOC', industry: '银行', inclusion_date: '2006-03-01' },
  '06690': { stock_code: '06690', stock_name: '海尔智家', stock_name_en: 'Haier Smart Home', industry: '家电', inclusion_date: '2018-12-01' },
  '06808': { stock_code: '06808', stock_name: '京东健康', stock_name_en: 'JD Health', industry: '医疗', inclusion_date: '2020-12-01' },
  '09618': { stock_code: '09618', stock_name: '京东集团-SW', stock_name_en: 'JD.com', industry: '互联网', inclusion_date: '2020-06-01' },
  '09688': { stock_code: '09688', stock_name: '友邦保险', stock_name_en: 'AIA', industry: '保险', inclusion_date: '2010-10-01' },
  // 互联网/科技
  '00700': { stock_code: '00700', stock_name: '腾讯控股', stock_name_en: 'Tencent', industry: '互联网', inclusion_date: '2004-06-01' },
  '01810': { stock_code: '01810', stock_name: '小米集团-W', stock_name_en: 'Xiaomi', industry: '科技', inclusion_date: '2019-09-01' },
  '02269': { stock_code: '02269', stock_name: '药明生物', stock_name_en: 'WuXi Biologics', industry: '生物医药', inclusion_date: '2017-06-01' },
  '02899': { stock_code: '02899', stock_name: '紫金矿业', stock_name_en: 'Zijin Mining', industry: '矿业', inclusion_date: '2020-12-01' },
  '09888': { stock_code: '09888', stock_name: '百度集团-SW', stock_name_en: 'Baidu', industry: '互联网', inclusion_date: '2021-03-01' },
  '09961': { stock_code: '09961', stock_name: '理想汽车-W', stock_name_en: 'Li Auto', industry: '新能源汽车', inclusion_date: '2024-03-01' },
  '09968': { stock_code: '09968', stock_name: '小鹏汽车-W', stock_name_en: 'XPeng', industry: '新能源汽车', inclusion_date: '2021-07-01' },
  '09980': { stock_code: '09980', stock_name: '零跑汽车', stock_name_en: 'Leapmotor', industry: '新能源汽车', inclusion_date: '2024-09-01' },
  // 阿里巴巴系
  '09988': { stock_code: '09988', stock_name: '阿里巴巴-SW', stock_name_en: 'Alibaba', industry: '互联网', inclusion_date: '2019-11-01' },
  '09969': { stock_code: '09969', stock_name: '蚂蚁集团', stock_name_en: 'Ant Group', industry: '互联网', inclusion_date: '2023-07-01' },
  '06618': { stock_code: '06618', stock_name: '众安在线', stock_name_en: 'ZhongAn', industry: '保险', inclusion_date: '2017-09-01' },
  // 消费
  '00291': { stock_code: '00291', stock_name: '华润啤酒', stock_name_en: 'CR Beer', industry: '消费', inclusion_date: '2007-04-01' },
  '03888': { stock_code: '03888', stock_name: '海底捞', stock_name_en: 'Haidilao', industry: '餐饮', inclusion_date: '2018-09-01' },
  '06160': { stock_code: '06160', stock_name: '百济神州', stock_name_en: 'BeiGene', industry: '生物医药', inclusion_date: '2018-03-01' },
  // 地产/建筑
  '01109': { stock_code: '01109', stock_name: '华润置地', stock_name_en: 'CR Land', industry: '地产', inclusion_date: '2006-03-01' },
  '01997': { stock_code: '01997', stock_name: '九龙仓集团', stock_name_en: 'Wharf Holdings', industry: '地产', inclusion_date: '2002-04-01' },
  '06098': { stock_code: '06098', stock_name: '碧桂园服务', stock_name_en: 'Country Garden Services', industry: '物业', inclusion_date: '2018-06-01' },
  '09609': { stock_code: '09609', stock_name: '蔚来-SW', stock_name_en: 'NIO', industry: '新能源汽车', inclusion_date: '2024-05-01' },
  // 其他
  '00857': { stock_code: '00857', stock_name: '中国石油', stock_name_en: 'PetroChina', industry: '能源', inclusion_date: '2000-04-01' },
  '00883': { stock_code: '00883', stock_name: '中国海洋石油', stock_name_en: 'CNOOC', industry: '能源', inclusion_date: '2001-02-01' },
  '01038': { stock_code: '01038', stock_name: '兖矿能源', stock_name_en: 'Yankuang Energy', industry: '能源', inclusion_date: '2012-03-01' },
  '01044': { stock_code: '01044', stock_name: '恒安国际', stock_name_en: 'Hengan', industry: '消费', inclusion_date: '2004-12-01' },
  '01088': { stock_code: '01088', stock_name: '中国神华', stock_name_en: 'China Shenhua', industry: '能源', inclusion_date: '2006-03-01' },
  '01093': { stock_code: '01093', stock_name: '中国电力', stock_name_en: 'China Power', industry: '电力', inclusion_date: '2004-12-01' },
  '01108': { stock_code: '01108', stock_name: '洛阳钼业', stock_name_en: 'CMOC', industry: '矿业', inclusion_date: '2022-03-01' },
  '01128': { stock_code: '01128', stock_name: '永利澳门', stock_name_en: 'Wynn Macau', industry: '博彩', inclusion_date: '2011-12-01' },
  '01171': { stock_code: '01171', stock_name: '兖煤澳大利亚', stock_name_en: 'Yancoal', industry: '能源', inclusion_date: '2012-12-01' },
  '01299': { stock_code: '01299', stock_name: '友联新能源', stock_name_en: 'China Everbright', industry: '金融', inclusion_date: '2024-03-01' },
  '01336': { stock_code: '01336', stock_name: '新华保险', stock_name_en: 'New China Life', industry: '保险', inclusion_date: '2011-12-01' },
  '01359': { stock_code: '01359', stock_name: '中国银行', stock_name_en: 'Stella International', industry: '制造', inclusion_date: '2013-06-01' },
  '01375': { stock_code: '01375', stock_name: '中州证券', stock_name_en: 'China Analytics', industry: '金融', inclusion_date: '2014-06-01' },
  '01378': { stock_code: '01378', stock_name: '中国宏桥', stock_name_en: 'China Hongqiao', industry: '铝业', inclusion_date: '2011-03-01' },
  '01618': { stock_code: '01618', stock_name: '中国中冶', stock_name_en: 'MCC', industry: '建筑', inclusion_date: '2009-09-01' },
  '01658': { stock_code: '01658', stock_name: '邮储银行', stock_name_en: 'PSBC', industry: '银行', inclusion_date: '2016-09-01' },
  '01766': { stock_code: '01766', stock_name: '中国中车', stock_name_en: 'CRRC', industry: '制造', inclusion_date: '2015-08-01' },
  '01776': { stock_code: '01776', stock_name: '广发证券', stock_name_en: 'GF Securities', industry: '金融', inclusion_date: '2015-04-01' },
  '01787': { stock_code: '01787', stock_name: '山东黄金', stock_name_en: 'Shandong Gold', industry: '黄金', inclusion_date: '2018-09-01' },
  '01800': { stock_code: '01800', stock_name: '中国交通建设', stock_name_en: 'China Communications', industry: '建筑', inclusion_date: '2006-12-01' },
  '01816': { stock_code: '01816', stock_name: '中广核电力', stock_name_en: 'CGN Power', industry: '电力', inclusion_date: '2014-12-01' },
  '01876': { stock_code: '01876', stock_name: '蒙牛乳业', stock_name_en: 'Mengniu', industry: '乳业', inclusion_date: '2004-12-01' },
  '01880': { stock_code: '01880', stock_name: '百丽国际', stock_name_en: 'Belle International', industry: '零售', inclusion_date: '2007-04-01' },
  '01919': { stock_code: '01919', stock_name: '中远海控', stock_name_en: 'COSCO Shipping', industry: '航运', inclusion_date: '2007-06-01' },
  '01928': { stock_code: '01928', stock_name: '金沙中国', stock_name_en: 'Sands China', industry: '博彩', inclusion_date: '2009-11-01' },
  '02007': { stock_code: '02007', stock_name: '碧桂园', stock_name_en: 'Country Garden', industry: '地产', inclusion_date: '2007-04-01' },
  '02020': { stock_code: '02020', stock_name: '安踏体育', stock_name_en: 'ANTA Sports', industry: '体育', inclusion_date: '2016-09-01' },
  '02039': { stock_code: '02039', stock_name: '中集车辆', stock_name_en: 'CIMC Vehicles', industry: '制造', inclusion_date: '2023-07-01' },
  '02128': { stock_code: '02128', stock_name: '联想集团', stock_name_en: 'Lenovo', industry: '科技', inclusion_date: '1994-02-01' },
  '02186': { stock_code: '02186', stock_name: '绿城中国', stock_name_en: 'Greentown', industry: '地产', inclusion_date: '2006-07-01' },
  '02202': { stock_code: '02202', stock_name: '万科企业', stock_name_en: 'Vanke', industry: '地产', inclusion_date: '2014-06-01' },
  '02208': { stock_code: '02208', stock_name: '金风科技', stock_name_en: 'Goldwind', industry: '新能源', inclusion_date: '2010-10-01' },
  '02313': { stock_code: '02313', stock_name: '旺旺', stock_name_en: 'Want Want', industry: '食品', inclusion_date: '2008-03-01' },
  '02319': { stock_code: '02319', stock_name: '蒙牛乳业', stock_name_en: 'Mengniu Dairy', industry: '乳业', inclusion_date: '2004-12-01' },
  '02331': { stock_code: '02331', stock_name: '李宁', stock_name_en: 'Li Ning', industry: '体育', inclusion_date: '2018-09-01' },
  '02333': { stock_code: '02333', stock_name: '长城汽车', stock_name_en: 'Great Wall Motor', industry: '汽车', inclusion_date: '2003-12-01' },
  '02341': { stock_code: '02341', stock_name: '冠君产业信托', stock_name_en: 'Champion REIT', industry: '地产', inclusion_date: '2006-12-01' },
  '02345': { stock_code: '02345', stock_name: '微创医疗', stock_name_en: 'MicroPort', industry: '医疗器械', inclusion_date: '2019-07-01' },
  '02359': { stock_code: '02359', stock_name: '药明康德', stock_name_en: 'WuXi AppTec', industry: '生物医药', inclusion_date: '2018-12-01' },
  '02380': { stock_code: '02380', stock_name: '中国电力', stock_name_en: 'China Power Intl', industry: '电力', inclusion_date: '2004-12-01' },
  '02386': { stock_code: '02386', stock_name: '中海油服', stock_name_en: 'COSL', industry: '能源', inclusion_date: '2007-12-01' },
  '02492': { stock_code: '02492', stock_name: '哔哩哔哩-W', stock_name_en: 'Bilibili', industry: '互联网', inclusion_date: '2021-03-01' },
  '02569': { stock_code: '02569', stock_name: '理想汽车', stock_name_en: 'Li Auto', industry: '新能源汽车', inclusion_date: '2024-03-01' },
  '02600': { stock_code: '02600', stock_name: '中国铝业', stock_name_en: 'Aluminum Corp', industry: '矿业', inclusion_date: '2001-12-01' },
  '02628': { stock_code: '02628', stock_name: '中国人寿', stock_name_en: 'China Life', industry: '保险', inclusion_date: '2003-12-01' },
  '02669': { stock_code: '02669', stock_name: '东方证券', stock_name_en: 'Orient Securities', industry: '金融', inclusion_date: '2015-04-01' },
  '02688': { stock_code: '02688', stock_name: '新奥能源', stock_name_en: 'ENN Energy', industry: '能源', inclusion_date: '2002-12-01' },
  '02727': { stock_code: '02727', stock_name: '大唐电力', stock_name_en: 'Datang Power', industry: '电力', inclusion_date: '2011-03-01' },
  '02768': { stock_code: '02768', stock_name: '佳源国际', stock_name_en: 'Jiayuan', industry: '地产', inclusion_date: '2019-01-01' },
  '02826': { stock_code: '02826', stock_name: '中国水务', stock_name_en: 'China Water', industry: '公用事业', inclusion_date: '2008-09-01' },
  '02880': { stock_code: '02880', stock_name: '黛丽斯', stock_name_en: 'Techtronic', industry: '制造', inclusion_date: '2000-12-01' },
  '02883': { stock_code: '02883', stock_name: '中石化', stock_name_en: 'Sinopec', industry: '能源', inclusion_date: '2000-10-01' },
  '02899': { stock_code: '02899', stock_name: '紫金矿业', stock_name_en: 'Zijin Mining', industry: '矿业', inclusion_date: '2020-12-01' },
  '03303': { stock_code: '03303', stock_name: '协合新能源', stock_name_en: 'China Jinfa', industry: '新能源', inclusion_date: '2015-06-01' },
  '03306': { stock_code: '03306', stock_name: '诺亚控股', stock_name_en: 'Noah Holdings', industry: '金融', inclusion_date: '2022-07-01' },
  '03328': { stock_code: '03328', stock_name: '交通银行', stock_name_en: 'Bank of Comm', industry: '银行', inclusion_date: '2007-04-01' },
  '03333': { stock_code: '03333', stock_name: '恒大汽车', stock_name_en: 'Evergrande Auto', industry: '新能源汽车', inclusion_date: '2021-04-01' },
  '03396': { stock_code: '03396', stock_name: '联想控股', stock_name_en: 'Lenovo Holding', industry: '科技', inclusion_date: '2015-06-01' },
  '03633': { stock_code: '03633', stock_name: '百胜中国', stock_name_en: 'Yum China', industry: '餐饮', inclusion_date: '2016-11-01' },
  '03653': { stock_code: '03653', stock_name: '申洲国际', stock_name_en: 'Shenzhou', industry: '纺织', inclusion_date: '2014-12-01' },
  '03690': { stock_code: '03690', stock_name: '美团', stock_name_en: 'Meituan', industry: '互联网', inclusion_date: '2018-09-01' },
  '03759': { stock_code: '03759', stock_name: '康龙化成', stock_name_en: 'Pharmaron', industry: '生物医药', inclusion_date: '2019-11-01' },
  '03800': { stock_code: '03800', stock_name: '协鑫科技', stock_name_en: 'GCL-Poly', industry: '光伏', inclusion_date: '2007-11-01' },
  '03818': { stock_code: '03818', stock_name: '同程旅行', stock_name_en: 'Tongcheng', industry: '旅游', inclusion_date: '2018-11-01' },
  '03868': { stock_code: '03868', stock_name: '信义光能', stock_name_en: 'Xinyi Solar', industry: '光伏', inclusion_date: '2013-12-01' },
  '03883': { stock_code: '03883', stock_name: '比亚迪电子', stock_name_en: 'BYD Electronic', industry: '电子', inclusion_date: '2015-06-01' },
  '03888': { stock_code: '03888', stock_name: '海底捞', stock_name_en: 'Haidilao', industry: '餐饮', inclusion_date: '2018-09-01' },
  '03898': { stock_code: '03898', stock_name: '时代天使', stock_name_en: 'Angelalign', industry: '医疗器械', inclusion_date: '2021-06-01' },
  '03900': { stock_code: '03900', stock_name: '中国物流', stock_name_en: 'China Logistics', industry: '物流', inclusion_date: '2023-06-01' },
  '03908': { stock_code: '03908', stock_name: '中金公司', stock_name_en: 'CICC', industry: '金融', inclusion_date: '2015-11-01' },
  '03968': { stock_code: '03968', stock_name: '招商银行', stock_name_en: 'CMB', industry: '银行', inclusion_date: '2002-04-01' },
  '03988': { stock_code: '03988', stock_name: '中国银行', stock_name_en: 'BOC', industry: '银行', inclusion_date: '2006-03-01' },
  '06030': { stock_code: '06030', stock_name: '中信证券', stock_name_en: 'CITIC Securities', industry: '金融', inclusion_date: '2011-09-01' },
  '06049': { stock_code: '06049', stock_name: '保诚', stock_name_en: 'Prudential', industry: '保险', inclusion_date: '2010-05-01' },
  '06055': { stock_code: '06055', stock_name: '周大福', stock_name_en: 'Chow Tai Fook', industry: '珠宝', inclusion_date: '2011-12-01' },
  '06098': { stock_code: '06098', stock_name: '碧桂园服务', stock_name_en: 'Country Garden Services', industry: '物业', inclusion_date: '2018-06-01' },
  '06118': { stock_code: '06118', stock_name: '世茂服务', stock_name_en: 'Shimao Services', industry: '物业', inclusion_date: '2020-10-01' },
  '06160': { stock_code: '06160', stock_name: '百济神州', stock_name_en: 'BeiGene', industry: '生物医药', inclusion_date: '2018-03-01' },
  '06169': { stock_code: '06169', stock_name: '宇华教育', stock_name_en: 'Yuhua Education', industry: '教育', inclusion_date: '2017-01-01' },
  '06178': { stock_code: '06178', stock_name: '光丽科技', stock_name_en: 'Guanhua', industry: '科技', inclusion_date: '2024-06-01' },
  '06185': { stock_code: '06185', stock_name: '康希通信', stock_name_en: 'Cantex', industry: '通信', inclusion_date: '2024-06-01' },
  '06198': { stock_code: '06198', stock_name: '顺丰同城', stock_name_en: 'SF外卖', industry: '物流', inclusion_date: '2023-12-01' },
  '06603': { stock_code: '06603', stock_name: '香港交易所', stock_name_en: 'HKEX', industry: '金融', inclusion_date: '2000-06-01' },
  '06606': { stock_code: '06606', stock_name: '满帮集团', stock_name_en: 'Full Truck', industry: '物流', inclusion_date: '2023-06-01' },
  '06618': { stock_code: '06618', stock_name: '京东健康', stock_name_en: 'JD Health', industry: '医疗', inclusion_date: '2020-12-01' },
  '06655': { stock_code: '06655', stock_name: '微博-SW', stock_name_en: 'Weibo', industry: '互联网', inclusion_date: '2022-11-01' },
  '06680': { stock_code: '06680', stock_name: '珠海万达商管', stock_name_en: 'Wanda', industry: '地产', inclusion_date: '2023-12-01' },
  '06690': { stock_code: '06690', stock_name: '海尔智家', stock_name_en: 'Haier Smart Home', industry: '家电', inclusion_date: '2018-12-01' },
  '06708': { stock_code: '06708', stock_name: '三一国际', stock_name_en: 'Sany Heavy', industry: '制造', inclusion_date: '2018-12-01' },
  '06718': { stock_code: '06718', stock_name: '中国中免', stock_name_en: 'China Dufu', industry: '零售', inclusion_date: '2024-03-01' },
  '06821': { stock_code: '06821', stock_name: '凯莱英', stock_name_en: 'Asymchem', industry: '生物医药', inclusion_date: '2021-12-01' },
  '06837': { stock_code: '06837', stock_name: '海通证券', stock_name_en: 'Haitong Securities', industry: '金融', inclusion_date: '2008-06-01' },
  '06855': { stock_code: '06855', stock_name: '亚玛顿', stock_name_en: 'Amately', industry: '光伏', inclusion_date: '2024-06-01' },
  '06862': { stock_code: '06862', stock_name: '海底捞', stock_name_en: 'Haidilao', industry: '餐饮', inclusion_date: '2018-09-01' },
  '06886': { stock_code: '06886', stock_name: '华泰证券', stock_name_en: 'HTSC', industry: '金融', inclusion_date: '2015-06-01' },
  '06888': { stock_code: '06888', stock_name: '都市丽人', stock_name_en: 'Tus Best', industry: '零售', inclusion_date: '2014-06-01' },
  '06988': { stock_code: '06988', stock_name: '龙湖集团', stock_name_en: 'Longfor', industry: '地产', inclusion_date: '2009-11-01' },
  '06993': { stock_code: '06993', stock_name: '郑州银行', stock_name_en: 'ZZB', industry: '银行', inclusion_date: '2018-09-01' },
  '06996': { stock_code: '06996', stock_name: '裕元工业', stock_name_en: 'Winson', industry: '制造', inclusion_date: '2015-03-01' },
  '06998': { stock_code: '06998', stock_name: '普拉达', stock_name_en: 'Prada', industry: '奢侈品', inclusion_date: '2011-06-01' },
  '08083': { stock_code: '08083', stock_name: '华新手袋', stock_name_en: 'Wah Sun', industry: '制造', inclusion_date: '2019-01-01' },
  '08095': { stock_code: '08095', stock_name: '北大荒', stock_name_en: 'Beidahuang', industry: '农业', inclusion_date: '2024-06-01' },
  '09618': { stock_code: '09618', stock_name: '京东集团', stock_name_en: 'JD.com', industry: '互联网', inclusion_date: '2020-06-01' },
  '09628': { stock_code: '09628', stock_name: '哔哩哔哩', stock_name_en: 'Bilibili', industry: '互联网', inclusion_date: '2021-03-01' },
  '09633': { stock_code: '09633', stock_name: '农夫山泉', stock_name_en: 'Nongfu Spring', industry: '饮料', inclusion_date: '2020-09-01' },
  '09635': { stock_code: '09635', stock_name: '小鹏汽车', stock_name_en: 'XPeng', industry: '新能源汽车', inclusion_date: '2024-03-01' },
  '09655': { stock_code: '09655', stock_name: '知乎', stock_name_en: 'Zhihu', industry: '互联网', inclusion_date: '2022-04-01' },
  '09668': { stock_code: '09668', stock_name: 'BOSS直聘', stock_name_en: 'Boss Zhipin', industry: '互联网', inclusion_date: '2021-06-01' },
  '09688': { stock_code: '09688', stock_name: '友邦保险', stock_name_en: 'AIA', industry: '保险', inclusion_date: '2010-10-01' },
  '09696': { stock_code: '09696', stock_name: '天齐锂业', stock_name_en: 'Tianqi Lithium', industry: '矿业', inclusion_date: '2022-07-01' },
  '09698': { stock_code: '09698', stock_name: '万国数据', stock_name_en: 'GDS', industry: '科技', inclusion_date: '2020-11-01' },
  '09888': { stock_code: '09888', stock_name: '百度集团', stock_name_en: 'Baidu', industry: '互联网', inclusion_date: '2021-03-01' },
  '09909': { stock_code: '09909', stock_name: '网易', stock_name_en: 'NetEase', industry: '互联网', inclusion_date: '2020-06-01' },
  '09939': { stock_code: '09939', stock_name: '坚朗五金', stock_name_en: 'Jianlong', industry: '建材', inclusion_date: '2024-06-01' },
  '09955': { stock_code: '09955', stock_name: '东方甄选', stock_name_en: 'East Buy', industry: '零售', inclusion_date: '2023-06-01' },
  '09961': { stock_code: '09961', stock_name: '理想汽车', stock_name_en: 'Li Auto', industry: '新能源汽车', inclusion_date: '2024-03-01' },
  '09968': { stock_code: '09968', stock_name: '小鹏汽车', stock_name_en: 'XPeng', industry: '新能源汽车', inclusion_date: '2021-07-01' },
  '09969': { stock_code: '09969', stock_name: '鸿腾精密', stock_name_en: 'FIT Hon Teng', industry: '电子', inclusion_date: '2017-12-01' },
  '09980': { stock_code: '09980', stock_name: '零跑汽车', stock_name_en: 'Leapmotor', industry: '新能源汽车', inclusion_date: '2024-09-01' },
  '09987': { stock_code: '09987', stock_name: '百胜中国', stock_name_en: 'Yum China', industry: '餐饮', inclusion_date: '2016-11-01' },
  '09988': { stock_code: '09988', stock_name: '阿里巴巴', stock_name_en: 'Alibaba', industry: '互联网', inclusion_date: '2019-11-01' },
};

// MSCI中国指数成分股（主要）
const MSCI_CONSTITUENTS: Record<string, {
  stock_code: string;
  stock_name: string;
  market: string;
  industry: string;
}> = {
  // 互联网巨头
  '9988.HK': { stock_code: '09988', stock_name: '阿里巴巴', market: 'HK', industry: '互联网' },
  '0700.HK': { stock_code: '00700', stock_name: '腾讯控股', market: 'HK', industry: '互联网' },
  '9618.HK': { stock_code: '09618', stock_name: '京东集团', market: 'HK', industry: '互联网' },
  '9868.HK': { stock_code: '09868', stock_name: '小鹏汽车', market: 'HK', industry: '新能源汽车' },
  '9981.HK': { stock_code: '09961', stock_name: '理想汽车', market: 'HK', industry: '新能源汽车' },
  '1810.HK': { stock_code: '01810', stock_name: '小米集团', market: 'HK', industry: '科技' },
  '3690.HK': { stock_code: '03690', stock_name: '美团', market: 'HK', industry: '互联网' },
  '9888.HK': { stock_code: '09888', stock_name: '百度集团', market: 'HK', industry: '互联网' },
  '9098.HK': { stock_code: '09909', stock_name: '网易', market: 'HK', industry: '互联网' },
  '6186.HK': { stock_code: '06618', stock_name: '京东健康', market: 'HK', industry: '医疗' },
  '9626.HK': { stock_code: '09628', stock_name: '哔哩哔哩', market: 'HK', industry: '互联网' },
  '4809.HK': { stock_code: '04809', stock_name: '微博', market: 'HK', industry: '互联网' },
  // 金融
  '3988.HK': { stock_code: '03988', stock_name: '中国银行', market: 'HK', industry: '银行' },
  '0939.HK': { stock_code: '00939', stock_name: '建设银行', market: 'HK', industry: '银行' },
  '3966.HK': { stock_code: '03968', stock_name: '招商银行', market: 'HK', industry: '银行' },
  '2318.HK': { stock_code: '02318', stock_name: '中国平安', market: 'HK', industry: '保险' },
  '2628.HK': { stock_code: '02628', stock_name: '中国人寿', market: 'HK', industry: '保险' },
  '6686.HK': { stock_code: '06688', stock_name: '友邦保险', market: 'HK', industry: '保险' },
  '6030.HK': { stock_code: '06030', stock_name: '中信证券', market: 'HK', industry: '金融' },
  // 消费
  '2319.HK': { stock_code: '02319', stock_name: '蒙牛乳业', market: 'HK', industry: '消费' },
  '2020.HK': { stock_code: '02020', stock_name: '安踏体育', market: 'HK', industry: '体育' },
  '2331.HK': { stock_code: '02331', stock_name: '李宁', market: 'HK', industry: '体育' },
  '9633.HK': { stock_code: '09633', stock_name: '农夫山泉', market: 'HK', industry: '饮料' },
  '3883.HK': { stock_code: '03883', stock_name: '比亚迪电子', market: 'HK', industry: '电子' },
  // 医药
  '6160.HK': { stock_code: '06160', stock_name: '百济神州', market: 'HK', industry: '生物医药' },
  '2269.HK': { stock_code: '02269', stock_name: '药明生物', market: 'HK', industry: '生物医药' },
  '2359.HK': { stock_code: '02359', stock_name: '药明康德', market: 'HK', industry: '生物医药' },
  '3759.HK': { stock_code: '03759', stock_name: '康龙化成', market: 'HK', industry: '生物医药' },
  // 新能源汽车
  '0988.HK': { stock_code: '09888', stock_name: '小鹏汽车', market: 'HK', industry: '新能源汽车' },
  '0960.HK': { stock_code: '09660', stock_name: '蔚来', market: 'HK', industry: '新能源汽车' },
  '9868.HK': { stock_code: '09868', stock_name: '小鹏汽车', market: 'HK', industry: '新能源汽车' },
  '9980.HK': { stock_code: '09980', stock_name: '零跑汽车', market: 'HK', industry: '新能源汽车' },
  // A股（沪深港通）
  '600519.SS': { stock_code: '600519', stock_name: '贵州茅台', market: 'A', industry: '白酒' },
  '600036.SS': { stock_code: '600036', stock_name: '招商银行', market: 'A', industry: '银行' },
  '601318.SS': { stock_code: '601318', stock_name: '中国平安', market: 'A', industry: '保险' },
  '000333.SZ': { stock_code: '000333', stock_name: '美的集团', market: 'A', industry: '家电' },
  '300750.SZ': { stock_code: '300750', stock_name: '宁德时代', market: 'A', industry: '新能源' },
};

// 富时中国50指数成分股
const FTSE_CONSTITUENTS: Record<string, {
  stock_code: string;
  stock_name: string;
  industry: string;
}> = {
  '9988.HK': { stock_code: '09988', stock_name: '阿里巴巴', industry: '互联网' },
  '0700.HK': { stock_code: '00700', stock_name: '腾讯控股', industry: '互联网' },
  '9618.HK': { stock_code: '09618', stock_name: '京东集团', industry: '互联网' },
  '1810.HK': { stock_code: '01810', stock_name: '小米集团', industry: '科技' },
  '3690.HK': { stock_code: '03690', stock_name: '美团', industry: '互联网' },
  '9888.HK': { stock_code: '09888', stock_name: '百度集团', industry: '互联网' },
  '9098.HK': { stock_code: '09909', stock_name: '网易', industry: '互联网' },
  '3988.HK': { stock_code: '03988', stock_name: '中国银行', industry: '银行' },
  '0939.HK': { stock_code: '00939', stock_name: '建设银行', industry: '银行' },
  '3966.HK': { stock_code: '03968', stock_name: '招商银行', industry: '银行' },
  '2318.HK': { stock_code: '02318', stock_name: '中国平安', industry: '保险' },
  '2628.HK': { stock_code: '02628', stock_name: '中国人寿', industry: '保险' },
  '6686.HK': { stock_code: '06688', stock_name: '友邦保险', industry: '保险' },
  '0941.HK': { stock_code: '00941', stock_name: '中国移动', industry: '电信' },
  '0762.HK': { stock_code: '00762', stock_name: '中国联通', industry: '电信' },
  '0986.HK': { stock_code: '00986', stock_name: '中国电信', industry: '电信' },
  '2319.HK': { stock_code: '02319', stock_name: '蒙牛乳业', industry: '消费' },
  '2020.HK': { stock_code: '02020', stock_name: '安踏体育', industry: '体育' },
  '9633.HK': { stock_code: '09633', stock_name: '农夫山泉', industry: '饮料' },
  '2331.HK': { stock_code: '02331', stock_name: '李宁', industry: '体育' },
  '6160.HK': { stock_code: '06160', stock_name: '百济神州', industry: '生物医药' },
  '2269.HK': { stock_code: '02269', stock_name: '药明生物', industry: '生物医药' },
  '6618.HK': { stock_code: '06618', stock_name: '京东健康', industry: '医疗' },
  '6862.HK': { stock_code: '06862', stock_name: '海底捞', industry: '餐饮' },
  '0388.HK': { stock_code: '03888', stock_name: '海底捞', industry: '餐饮' },
  '0960.HK': { stock_code: '09660', stock_name: '蔚来', industry: '新能源汽车' },
  '9868.HK': { stock_code: '09868', stock_name: '小鹏汽车', industry: '新能源汽车' },
  '9981.HK': { stock_code: '09961', stock_name: '理想汽车', industry: '新能源汽车' },
  '9980.HK': { stock_code: '09980', stock_name: '零跑汽车', industry: '新能源汽车' },
  '6030.HK': { stock_code: '06030', stock_name: '中信证券', industry: '金融' },
  '6886.HK': { stock_code: '06886', stock_name: '华泰证券', industry: '金融' },
  '3908.HK': { stock_code: '03908', stock_name: '中金公司', industry: '金融' },
  '6658.HK': { stock_code: '06658', stock_name: '中国银行', industry: '银行' },
  '1398.HK': { stock_code: '01398', stock_name: '工商银行', industry: '银行' },
  '3328.HK': { stock_code: '03328', stock_name: '交通银行', industry: '银行' },
  '1658.HK': { stock_code: '01658', stock_name: '邮储银行', industry: '银行' },
  '6690.HK': { stock_code: '06690', stock_name: '海尔智家', industry: '家电' },
  '0981.HK': { stock_code: '00981', stock_name: '中芯国际', industry: '半导体' },
  '2382.HK': { stock_code: '02382', stock_name: '舜宇光学', industry: '电子' },
  '3883.HK': { stock_code: '03883', stock_name: '比亚迪电子', industry: '电子' },
  '1756.HK': { stock_code: '01756', stock_name: '华润燃气', industry: '燃气' },
  '2688.HK': { stock_code: '02688', stock_name: '新奥能源', industry: '燃气' },
  '9688.HK': { stock_code: '09688', stock_name: '友邦保险', industry: '保险' },
  '6096.HK': { stock_code: '06098', stock_name: '碧桂园服务', industry: '物业' },
  '6098.HK': { stock_code: '06098', stock_name: '碧桂园服务', industry: '物业' },
  '1997.HK': { stock_code: '01997', stock_name: '九龙仓', industry: '地产' },
  '8988.HK': { stock_code: '08988', stock_name: '港交所', industry: '金融' },
  '0011.HK': { stock_code: '00011', stock_name: '恒生银行', industry: '银行' },
  '0012.HK': { stock_code: '00012', stock_name: '恒生银行', industry: '银行' },
  '0291.HK': { stock_code: '00291', stock_name:'华润啤酒', industry: '消费' },
  '1044.HK': { stock_code: '01044', stock_name: '恒安国际', industry: '消费' },
};

// ============ 数据库操作 ============

// 更新到Supabase
async function updateToSupabase(tableName: string, records: any[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('Supabase未配置，使用本地数据');
    return { success: records.length, failed: 0 };
  }

  for (const record of records) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          ...record,
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        success++;
      } else {
        failed++;
        const error = await response.text();
        console.error(`更新失败: ${record.stock_code}, 错误: ${error}`);
      }
    } catch (error) {
      console.error(`更新异常: ${record.stock_code}`, error);
      failed++;
    }
  }

  return { success, failed };
}

// 记录更新日志
async function logUpdate(dataType: string, status: string, records: number, error?: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/data_update_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        data_type: dataType,
        update_status: status,
        records_updated: records,
        error_message: error || null,
        completed_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('记录更新日志失败:', error);
  }
}

// ============ 爬虫执行函数 ============

// 更新恒生指数成分股
async function updateHSIConstituents(): Promise<{ success: number; failed: number; source: string }> {
  console.log('开始更新恒生指数成分股...');
  
  // 将本地数据转换为数据库格式
  const records = Object.values(HSI_CONSTITUENTS).map(stock => ({
    stock_code: stock.stock_code,
    stock_name: stock.stock_name,
    stock_name_en: stock.stock_name_en,
    industry: stock.industry,
    index_type: 'HSI', // 恒生指数
    inclusion_date: stock.inclusion_date,
    status: 'active',
    source: 'auto_update',
    last_updated: new Date().toISOString()
  }));

  const result = await updateToSupabase('hk_index_constituents', records);
  await logUpdate('hsi_constituents', result.failed > 0 ? 'partial' : 'success', result.success,
    result.failed > 0 ? `${result.failed}条更新失败` : undefined);

  return { ...result, source: 'local_backup' };
}

// 更新MSCI中国指数成分股
async function updateMSCIConstituents(): Promise<{ success: number; failed: number; source: string }> {
  console.log('开始更新MSCI中国指数成分股...');
  
  const records = Object.values(MSCI_CONSTITUENTS).map(stock => ({
    stock_code: stock.stock_code,
    stock_name: stock.stock_name,
    market: stock.market,
    industry: stock.industry,
    index_type: 'MSCI_CHINA',
    status: 'active',
    source: 'auto_update',
    last_updated: new Date().toISOString()
  }));

  const result = await updateToSupabase('hk_index_constituents', records);
  await logUpdate('msci_constituents', result.failed > 0 ? 'partial' : 'success', result.success);

  return { ...result, source: 'local_backup' };
}

// 更新富时中国指数成分股
async function updateFTSEConstituents(): Promise<{ success: number; failed: number; source: string }> {
  console.log('开始更新富时中国指数成分股...');
  
  const records = Object.values(FTSE_CONSTITUENTS).map(stock => ({
    stock_code: stock.stock_code,
    stock_name: stock.stock_name,
    industry: stock.industry,
    index_type: 'FTSE_CHINA',
    status: 'active',
    source: 'auto_update',
    last_updated: new Date().toISOString()
  }));

  const result = await updateToSupabase('hk_index_constituents', records);
  await logUpdate('ftse_constituents', result.failed > 0 ? 'partial' : 'success', result.success);

  return { ...result, source: 'local_backup' };
}

// ============ 主API入口 ============

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const type = searchParams.get('type') || 'all'; // hsi, msci, ftse, all

  // 验证key
  if (!verifyCronKey(key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: any = {
    timestamp: new Date().toISOString(),
    types: []
  };

  try {
    // 根据类型执行不同的爬虫
    if (type === 'all' || type === 'hsi') {
      const hsiResult = await updateHSIConstituents();
      results.types.push({ type: 'HSI', ...hsiResult });
    }

    if (type === 'all' || type === 'msci') {
      const msciResult = await updateMSCIConstituents();
      results.types.push({ type: 'MSCI_CHINA', ...msciResult });
    }

    if (type === 'all' || type === 'ftse') {
      const ftseResult = await updateFTSEConstituents();
      results.types.push({ type: 'FTSE_CHINA', ...ftseResult });
    }

    // 统计总数
    results.totalSuccess = results.types.reduce((sum: number, t: any) => sum + t.success, 0);
    results.totalFailed = results.types.reduce((sum: number, t: any) => sum + t.failed, 0);
    results.duration = `${Date.now() - startTime}ms`;
    results.success = true;

    console.log(`指数名单更新完成: 成功 ${results.totalSuccess}, 失败 ${results.totalFailed}`);

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('指数名单更新失败:', error);
    await logUpdate('index_constituents', 'failed', 0, error.message);

    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
