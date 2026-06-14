'use strict';

/**
 * 各故事线七年画面锚点 + 主角透明小人 + 背景资产 id
 * ext_bg → demo-scene-textures.js EXT_BG（CC0 本地图 fallback）
 */
(function exportStoryVisuals(global) {
  const PROTAGONIST = {
    fuxduxian: { asset_id: 'PX-SHC-001', file: 'shc-01.png', label_zh: '阿岚' },
    linwan: { asset_id: 'PX-SHC-012', file: 'shc-12.png', label_zh: '林晚' },
    heartbeat_line: { asset_id: 'PX-SHC-009', file: 'shc-09.png', label_zh: '许星遥' },
    zhoudran: { asset_id: 'PX-SHC-014', file: 'shc-14.png', label_zh: '周染' }
  };

  /** 已落地配图的故事线（demo 配图 v1） */
  const RICH_STORIES = new Set(['fuxduxian', 'heartbeat_line']);

  const YEARS = {
    fuxduxian: {
      1: {
        visual_anchor: '雨天，最后一排靠窗，书包在空桌',
        key_props: ['书包', '窗雨'],
        mood_visual: '灰 · 冷 · 雨',
        daily_micro: '翻书、望窗',
        ext_bg: 'PX-EXT-008',
        fx: 'rain'
      },
      2: {
        visual_anchor: '查分夜，桌上有撕碎准考证',
        key_props: ['准考证碎片', '台灯'],
        mood_visual: '灰 · 冷 · 夜',
        daily_micro: '撕纸、静止',
        ext_bg: 'PX-EXT-015',
        fx: 'night'
      },
      3: {
        visual_anchor: '食堂最里角，双份餐盘只有一个有人',
        key_props: ['餐盘', '空椅'],
        mood_visual: '灰 · 钝',
        daily_micro: '慢吃 loop',
        ext_bg: 'PX-EXT-012',
        fx: 'flat'
      },
      4: {
        visual_anchor: '舞台侧幕，领带打反，稿纸五叠',
        key_props: ['领带', '稿纸', '麦'],
        mood_visual: '略暖 · 舞台光',
        daily_micro: '改稿',
        ext_bg: 'PX-EXT-002',
        fx: 'warm'
      },
      5: {
        visual_anchor: '凌晨 4 点，手机 4:03，窗帘缝光',
        key_props: ['手机', '床', '窗帘'],
        mood_visual: '低饱和 · 夜',
        daily_micro: '睁眼 loop',
        ext_bg: 'PX-EXT-014',
        fx: 'night'
      },
      6: {
        visual_anchor: '出站雨棚，行李箱，对面校服小孩睡',
        key_props: ['行李箱', '雨', '小孩'],
        mood_visual: '低饱和 · 雨',
        daily_micro: '抱箱蹲坐',
        ext_bg: 'PX-EXT-020',
        fx: 'rain'
      },
      7: {
        visual_anchor: '邮局小窗，信封与笔，老太太半脸',
        key_props: ['信封', '笔', '窗口'],
        mood_visual: '留白 · 小窗高光',
        daily_micro: '写字 loop',
        ext_bg: 'PX-EXT-010',
        fx: 'warm'
      }
    },
    heartbeat_line: {
      1: {
        visual_anchor: '夏夜老街 · 便利店门口 · 没松开的手',
        key_props: ['可乐', '电动车'],
        mood_visual: '暖夜 · 燥',
        daily_micro: '并肩坐',
        ext_bg: 'PX-EXT-004',
        fx: 'warm'
      },
      2: {
        visual_anchor: '十八平出租屋 · 十一度 · 手机灯吃面',
        key_props: ['泡面', '薄被'],
        mood_visual: '冬 · 窄 · 冷',
        daily_micro: '呵气',
        ext_bg: 'PX-EXT-025',
        fx: 'cold'
      },
      3: {
        visual_anchor: '账单五百 · 分房睡 · 裙子吊牌',
        key_props: ['账单', '裙子'],
        mood_visual: '冷 · 裂',
        daily_micro: '背对背',
        ext_bg: 'PX-EXT-012',
        fx: 'flat'
      },
      4: {
        visual_anchor: '婚礼酒店外 · 婚纱人群 · 自卑侧脸',
        key_props: ['婚车', '礼花'],
        mood_visual: '亮 · 远',
        daily_micro: '驻足',
        ext_bg: 'PX-EXT-018',
        fx: 'lantern'
      },
      5: {
        visual_anchor: '生日蜡烛 · 空戒指盒 · 平淡晚餐',
        key_props: ['蛋糕', '蜡烛'],
        mood_visual: '暖灰 · 空',
        daily_micro: '吹蜡',
        ext_bg: 'PX-EXT-002',
        fx: 'warm'
      },
      6: {
        visual_anchor: '深夜手机光 · 如果问题 · 安稳朋友圈',
        key_props: ['手机', '夜'],
        mood_visual: '蓝 · 内耗',
        daily_micro: '刷屏',
        ext_bg: 'PX-EXT-008',
        fx: 'night'
      },
      7: {
        visual_anchor: '雨暮窗口 · 旧电动车 · 和解侧影',
        key_props: ['雨', '窗'],
        mood_visual: '雨 · 柔',
        daily_micro: '并肩',
        ext_bg: 'PX-EXT-004',
        fx: 'rain'
      }
    },
    linwan: {
      1: { visual_anchor: '伦敦宿舍 · 暖气坏了 · 外套压在被上', key_props: ['外套', '橘黄街灯'], mood_visual: '冷蓝 · 异国夜', daily_micro: '蜷睡、记笔记', ext_bg: 'PX-EXT-008' },
      2: { visual_anchor: '宿舍床边 · 手机贴耳 · 父亲挂断', key_props: ['手机', '泡面'], mood_visual: '夜 · 橘路灯', daily_micro: '台阶吃面', ext_bg: 'PX-EXT-008' },
      3: { visual_anchor: '小公寓桌 · 转账记录 · 两万块', key_props: ['账单', '警局回执'], mood_visual: '灰 · 压', daily_micro: '查账户', ext_bg: 'PX-EXT-012' },
      4: { visual_anchor: '玻璃办公室 · Offer 邮件 · 签字笔', key_props: ['合同', '工牌'], mood_visual: '冷白 · 都市', daily_micro: '签字', ext_bg: 'PX-EXT-015' },
      5: { visual_anchor: '续签窗口 · 空白紧急联系人', key_props: ['护照', '表格'], mood_visual: '政务蓝 · 空', daily_micro: '填表', ext_bg: 'PX-EXT-015' },
      6: { visual_anchor: '小厨房 · 红烧肉 · 同事围坐', key_props: ['锅', '碗筷'], mood_visual: '暖 · 家味', daily_micro: '颠勺', ext_bg: 'PX-EXT-002' },
      7: { visual_anchor: '沙发 · 未读消息 · 父母头像灰', key_props: ['手机', '消息框'], mood_visual: '夜 · 留白', daily_micro: '写删改', ext_bg: 'PX-EXT-002' }
    },
    zhoudran: {
      1: { visual_anchor: '小工作室 · 两百块到账截图 · 数位板', key_props: ['数位板', '转账'], mood_visual: '暖黄 · 试探', daily_micro: '改稿五版', ext_bg: 'PX-EXT-056' },
      2: { visual_anchor: '出租屋地板 · 烟花窗外 · 电话未接', key_props: ['手机', '泡面'], mood_visual: '夜 · 孤', daily_micro: '降价接单', ext_bg: 'PX-EXT-025' },
      3: { visual_anchor: '屏幕二十三单 · 疫情居家 · 台灯', key_props: ['订单列表', '咖啡'], mood_visual: '略暖 · 忙', daily_micro: '赶稿', ext_bg: 'PX-EXT-056' },
      4: { visual_anchor: '改稿第二十版 · 甲方批注满屏', key_props: ['图层', '批注'], mood_visual: '灰 · 压', daily_micro: '删源文件', ext_bg: 'PX-EXT-056' },
      5: { visual_anchor: '新颜料管 · 空甲方文件夹 · 贵颜料', key_props: ['颜料', '辞职信'], mood_visual: '彩 · 释', daily_micro: '挤颜料', ext_bg: 'PX-EXT-056' },
      6: { visual_anchor: '全屏水印 · AI 新闻弹窗 · 旧稿', key_props: ['水印', '新闻'], mood_visual: '冷 · 疑', daily_micro: '继续画', ext_bg: 'PX-EXT-002' },
      7: { visual_anchor: '凌晨两点 · 无甲方画 · 父母回复好看', key_props: ['完成稿', '手机'], mood_visual: '夜暖 · 够了', daily_micro: '发送', ext_bg: 'PX-EXT-056' }
    }
  };

  function getProtagonist(storyId) {
    return PROTAGONIST[storyId] || PROTAGONIST.fuxduxian;
  }

  function getForYear(storyId, yearNum) {
    const map = YEARS[storyId];
    if (!map) return null;
    return map[yearNum] || null;
  }

  function resolveHeroUrl(story) {
    const storyId = story?.id || story?._activeStoryId;
    const preset = getProtagonist(storyId);
    const stored = (() => {
      try {
        return JSON.parse(sessionStorage.getItem('shadow_visual_character') || 'null');
      } catch {
        return null;
      }
    })();
    if (stored?.image_url) return stored.image_url;
    if (stored?.file && RICH_STORIES.has(storyId)) {
      return `/visual-characters/${stored.file}`;
    }
    return `/visual-characters/${preset.file}`;
  }

  global.ShadowStoryVisuals = {
    PROTAGONIST,
    RICH_STORIES,
    getProtagonist,
    getForYear,
    resolveHeroUrl,
    hasVisualPack(storyId) {
      return RICH_STORIES.has(storyId);
    },
    isRichStory(storyId) {
      return RICH_STORIES.has(storyId);
    }
  };
})(window);
