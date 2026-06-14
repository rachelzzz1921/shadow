-- =====================================================================
-- Shadow Intake 词库 Seed Data
-- 六个标签库 · 每库 15-20 个 tag · 含 synonyms[] 与 weight_hint(jsonb)
-- 直接 psql / Supabase SQL Editor 导入即可
-- =====================================================================

-- ---------- 0. 表结构（若已建可跳过） ----------
create table if not exists intake_tag_categories (
  id            text primary key,
  label_zh      text not null,
  description   text,
  max_select    int  not null default 5,
  min_select    int  not null default 0,
  display_order int  not null,
  maps_to_agent text[]
);

create table if not exists intake_tags (
  id            uuid primary key default gen_random_uuid(),
  category_id   text not null references intake_tag_categories(id),
  label         text not null,
  synonyms      text[] default '{}',
  weight_hint   jsonb,
  moderation_status text not null default 'approved',
  is_custom     boolean default false,
  usage_count   int default 0,
  created_at    timestamptz default now()
);

-- ---------- 1. 分类 ----------
insert into intake_tag_categories (id, label_zh, description, max_select, min_select, display_order, maps_to_agent) values
('trait',             '性格特质',   '岔路口前后你大致是个怎样的人', 5, 1, 1, array['persona.core_traits']),
('mood_at_fork',      '岔路口时心情', '做决定那段时间，心里的底色',   3, 1, 2, array['year.initial_mood','year.initial_esteem']),
('fear',              '深层恐惧',   '夜里睡不着时，真正怕的东西',   4, 0, 3, array['persona.soft_spots']),
('value',             '价值排序',   '取舍时，你下意识护住的东西',   4, 1, 4, array['persona.decision_tendency']),
('relation_pressure', '关系压力源', '谁的存在，让这个决定变重了',   3, 0, 5, array['fate.scenario_weights']),
('scenario_hint',     '人生域',     '这件事主要发生在你人生的哪一块', 2, 1, 6, array['fate.scenario_weights'])
on conflict (id) do nothing;

-- ---------- 2. trait 性格特质 (18) ----------
insert into intake_tags (category_id, label, synonyms, weight_hint) values
('trait','要强',     array['好胜','不服输','争强','不甘人后','逞强'],            '{"persona.core_traits":0.8,"persona.decision_tendency":0.5}'),
('trait','完美主义', array['吹毛求疵','不容差错','洁癖','标准高','做不到就难受'],  '{"persona.core_traits":0.7,"persona.soft_spots":0.4}'),
('trait','讨好型',   array['取悦','迎合','怕得罪人','老好人','不会拒绝'],          '{"persona.core_traits":0.7,"persona.soft_spots":0.5}'),
('trait','慢热',     array['内向','需要时间','认生','熟了才放开'],                '{"persona.core_traits":0.5}'),
('trait','外冷内热', array['面冷心软','嘴硬','刀子嘴豆腐心','装酷'],              '{"persona.core_traits":0.6}'),
('trait','敏感',     array['玻璃心','想太多','在意细节','容易受伤'],              '{"persona.core_traits":0.6,"persona.soft_spots":0.4}'),
('trait','独立',     array['自己扛','不爱麻烦人','一个人也行','自主'],            '{"persona.core_traits":0.6,"fate.scenario_weights.self_growth":0.2}'),
('trait','钝感',     array['没心没肺','不往心里去','大条','迟钝'],                '{"persona.core_traits":0.5}'),
('trait','理性',     array['冷静','讲逻辑','凡事先分析','克制'],                  '{"persona.core_traits":0.5,"persona.decision_tendency":0.3}'),
('trait','感性',     array['情绪化','凭感觉','心软','共情强'],                    '{"persona.core_traits":0.5}'),
('trait','拖延',     array['能拖就拖','临时抱佛脚','不到最后不动','逃避'],        '{"persona.core_traits":0.5,"persona.defense_mechanism":0.3}'),
('trait','执拗',     array['认死理','一根筋','撞南墙不回头','轴'],                '{"persona.core_traits":0.6,"persona.decision_tendency":0.4}'),
('trait','随和',     array['好说话','无所谓','不计较','佛系'],                    '{"persona.core_traits":0.5}'),
('trait','好强又自卑',array['又骄傲又心虚','强撑','色厉内荏','怕被看穿底子'],     '{"persona.core_traits":0.7,"persona.soft_spots":0.6}'),
('trait','控制欲强', array['什么都要管','怕失控','安排一切','不放心交出去'],      '{"persona.core_traits":0.6,"persona.defense_mechanism":0.4}'),
('trait','讨厌冲突', array['怕吵架','息事宁人','回避对立','和稀泥'],              '{"persona.core_traits":0.5,"persona.decision_tendency":0.4}'),
('trait','上进',     array['有野心','想往上走','不安于现状','拼'],                '{"persona.core_traits":0.6,"fate.scenario_weights.career":0.2}'),
('trait','钻牛角尖', array['反复纠结','想不开','放不下','内耗'],                  '{"persona.core_traits":0.6,"persona.soft_spots":0.4}');

-- ---------- 3. mood_at_fork 岔路口时心情 (16) ----------
insert into intake_tags (category_id, label, synonyms, weight_hint) values
('mood_at_fork','不甘',       array['咽不下这口气','憋屈','心有不甘','凭什么'],     '{"year.initial_mood":-0.5,"year.initial_esteem":-0.3}'),
('mood_at_fork','迷茫',       array['没方向','不知道要什么','空','懵'],            '{"year.initial_mood":-0.4,"year.initial_esteem":-0.4}'),
('mood_at_fork','赌气',       array['就要证明给你看','较劲','憋着一股劲'],         '{"year.initial_mood":-0.3,"persona.decision_tendency":0.4}'),
('mood_at_fork','松一口气',   array['终于解脱','卸下负担','放下了','轻松'],         '{"year.initial_mood":0.5,"year.initial_esteem":0.2}'),
('mood_at_fork','假装无所谓', array['强装镇定','嘴上说不在乎','麻木','逞强'],       '{"year.initial_mood":-0.3,"persona.defense_mechanism":0.5}'),
('mood_at_fork','焦虑',       array['坐立不安','心慌','怕来不及','睡不着'],         '{"year.initial_mood":-0.4,"year.initial_esteem":-0.2}'),
('mood_at_fork','期待',       array['跃跃欲试','满怀希望','想试试','憧憬'],         '{"year.initial_mood":0.5,"year.initial_esteem":0.3}'),
('mood_at_fork','疲惫',       array['累了','撑不动','心力交瘁','想躺平'],          '{"year.initial_mood":-0.4,"year.initial_esteem":-0.2}'),
('mood_at_fork','害怕',       array['怕选错','发憷','没底','心虚'],                '{"year.initial_mood":-0.4,"persona.soft_spots":0.4}'),
('mood_at_fork','释然',       array['想开了','认了','坦然','放下执念'],            '{"year.initial_mood":0.4,"persona.growth_seed":0.3}'),
('mood_at_fork','委屈',       array['没人懂','觉得不公平','想哭','憋屈'],          '{"year.initial_mood":-0.5,"persona.soft_spots":0.4}'),
('mood_at_fork','兴奋',       array['激动','热血','按捺不住','冲'],                '{"year.initial_mood":0.6}'),
('mood_at_fork','空落落',     array['失落','像丢了什么','怅然','提不起劲'],        '{"year.initial_mood":-0.4,"year.initial_esteem":-0.3}'),
('mood_at_fork','倔强',       array['偏不','非要这样','犟','认定了'],              '{"persona.decision_tendency":0.5,"year.initial_mood":-0.2}'),
('mood_at_fork','麻木',       array['没感觉','行尸走肉','无所谓','放空'],          '{"year.initial_mood":-0.5,"persona.defense_mechanism":0.5}'),
('mood_at_fork','侥幸',       array['赌一把','也许能行','碰碰运气','试试又不亏'],   '{"persona.decision_tendency":0.3,"year.initial_mood":0.2}');

-- ---------- 4. fear 深层恐惧 (18) ----------
insert into intake_tags (category_id, label, synonyms, weight_hint) values
('fear','怕被看穿',     array['怕露馅','怕被识破','装不下去','怕底子被发现'],       '{"persona.soft_spots":0.8,"persona.core_traits":0.4}'),
('fear','怕让父母失望', array['怕辜负','不能让爸妈难过','怕对不起家里','背负期待'], '{"persona.soft_spots":0.8,"fate.scenario_weights.family":0.4}'),
('fear','怕选错',       array['怕走错路','怕后悔','怕一步错步步错','决策瘫痪'],     '{"persona.soft_spots":0.7,"persona.decision_tendency":0.4}'),
('fear','怕平庸',       array['怕泯然众人','不甘平凡','怕一辈子普通','怕没出息'],   '{"persona.soft_spots":0.7,"persona.core_traits":0.4}'),
('fear','怕被抛下',     array['怕落后','怕跟不上','怕被同龄人甩开','同辈焦虑'],     '{"persona.soft_spots":0.7,"fate.scenario_weights.friendship":0.3}'),
('fear','怕孤独',       array['怕没人陪','怕独自承担','怕被孤立','怕落单'],         '{"persona.soft_spots":0.6,"fate.scenario_weights.love":0.3}'),
('fear','怕不被爱',     array['怕不被需要','怕被嫌弃','怕没人要','值得被爱吗'],     '{"persona.soft_spots":0.8,"fate.scenario_weights.love":0.4}'),
('fear','怕失控',       array['怕意外','怕计划崩盘','怕不在掌握中','怕乱'],         '{"persona.soft_spots":0.6,"persona.defense_mechanism":0.4}'),
('fear','怕被否定',     array['怕被批评','怕做得不够好','怕被指责','差评恐惧'],     '{"persona.soft_spots":0.7,"persona.core_traits":0.4}'),
('fear','怕浪费时间',   array['怕来不及','怕蹉跎','怕白费','时间焦虑'],             '{"persona.soft_spots":0.6,"persona.decision_tendency":0.3}'),
('fear','怕真实的自己不够好', array['怕暴露脆弱','怕本来面目让人失望','自我怀疑'], '{"persona.soft_spots":0.9}'),
('fear','怕失去自由',   array['怕被困住','怕一眼望到头','怕被束缚','怕没退路'],     '{"persona.soft_spots":0.6,"fate.scenario_weights.self_growth":0.3}'),
('fear','怕辜负自己',   array['怕对不起努力','怕浪费天赋','怕没尽全力'],           '{"persona.soft_spots":0.6,"persona.growth_seed":0.4}'),
('fear','怕被比较',     array['怕比不过','怕被拿来对比','别人家的孩子','排名焦虑'], '{"persona.soft_spots":0.7,"fate.scenario_weights.family":0.2}'),
('fear','怕承认失败',   array['不肯认输','怕被说不行','拉不下脸','死撑'],           '{"persona.soft_spots":0.7,"persona.decision_tendency":0.5}'),
('fear','怕没有意义',   array['怕白活','虚无','这一切值得吗','意义缺失'],           '{"persona.soft_spots":0.6,"persona.growth_seed":0.3}'),
('fear','怕被看轻',     array['怕被瞧不起','怕没面子','怕被低估','尊严焦虑'],       '{"persona.soft_spots":0.7,"persona.core_traits":0.4}'),
('fear','怕亲密',       array['怕靠太近','怕受伤','不敢交付','回避依恋'],           '{"persona.soft_spots":0.6,"fate.scenario_weights.love":0.3}');

-- ---------- 5. value 价值排序 (16) ----------
insert into intake_tags (category_id, label, synonyms, weight_hint) values
('value','面子',     array['体面','尊严','别丢人','形象'],               '{"persona.decision_tendency":0.6,"persona.soft_spots":0.3}'),
('value','自由',     array['不受束缚','想干嘛干嘛','独立自主','无拘无束'], '{"persona.decision_tendency":0.6,"fate.scenario_weights.self_growth":0.3}'),
('value','稳定',     array['安稳','保险','别折腾','踏实'],               '{"persona.decision_tendency":0.6,"fate.scenario_weights.career":0.2}'),
('value','被认可',   array['被看见','得到肯定','被尊重','被赏识'],         '{"persona.decision_tendency":0.5,"persona.soft_spots":0.4}'),
('value','关系优先', array['家人重要','感情第一','人比事重要','陪伴'],     '{"persona.decision_tendency":0.5,"fate.scenario_weights.family":0.3}'),
('value','成就',     array['做成事','成功','证明实力','拿结果'],           '{"persona.decision_tendency":0.6,"fate.scenario_weights.career":0.3}'),
('value','真实',     array['做自己','不装','忠于内心','诚实面对'],         '{"persona.decision_tendency":0.6,"persona.growth_seed":0.4}'),
('value','掌控',     array['一切在握','自己说了算','主动权','安全感'],     '{"persona.decision_tendency":0.5,"persona.defense_mechanism":0.3}'),
('value','成长',     array['变更好','不断进步','学到东西','突破自己'],     '{"persona.decision_tendency":0.5,"fate.scenario_weights.self_growth":0.3}'),
('value','归属',     array['有个地方属于我','被接纳','圈子','根'],         '{"persona.decision_tendency":0.4,"fate.scenario_weights.family":0.2}'),
('value','公平',     array['讲道理','不能吃亏','对等','正义'],             '{"persona.decision_tendency":0.4}'),
('value','安全感',   array['有底','不慌','有退路','保障'],                 '{"persona.decision_tendency":0.5,"persona.soft_spots":0.3}'),
('value','卓越',     array['做到最好','出类拔萃','登顶','极致'],           '{"persona.decision_tendency":0.6,"persona.core_traits":0.4}'),
('value','轻松',     array['别太累','舒服就好','张弛有度','不内卷'],       '{"persona.decision_tendency":0.4}'),
('value','忠诚',     array['讲义气','靠得住','不背叛','长久'],             '{"persona.decision_tendency":0.4,"fate.scenario_weights.friendship":0.2}'),
('value','意义感',   array['值得','有价值','不白活','使命'],               '{"persona.decision_tendency":0.4,"persona.growth_seed":0.3}');

-- ---------- 6. relation_pressure 关系压力源 (15) ----------
insert into intake_tags (category_id, label, synonyms, weight_hint) values
('relation_pressure','父母期待',   array['爸妈的要求','家里的安排','光宗耀祖','望子成龙'], '{"fate.scenario_weights.family":0.5,"persona.soft_spots":0.3}'),
('relation_pressure','伴侣异地',   array['两地分居','感情拉扯','要不要为对方留下','异地恋'], '{"fate.scenario_weights.love":0.5}'),
('relation_pressure','朋友分流',   array['各奔东西','圈子散了','大家走远了','友情淡了'],   '{"fate.scenario_weights.friendship":0.5}'),
('relation_pressure','独自承担',   array['没人帮','一个人扛','孤立无援','靠自己'],         '{"fate.scenario_weights.self_growth":0.4,"persona.soft_spots":0.3}'),
('relation_pressure','同辈比较',   array['别人都比我好','被拿来对比','同学混得好','内卷'], '{"fate.scenario_weights.friendship":0.4,"persona.soft_spots":0.3}'),
('relation_pressure','家庭经济',   array['没钱','要养家','学费压力','经济负担'],           '{"fate.scenario_weights.family":0.4,"fate.scenario_weights.career":0.2}'),
('relation_pressure','长辈催促',   array['催婚','催生','催就业','别人都成家了'],           '{"fate.scenario_weights.family":0.4,"fate.scenario_weights.love":0.2}'),
('relation_pressure','师长期望',   array['老师看好我','导师施压','别辜负培养','重点栽培'], '{"fate.scenario_weights.study":0.4}'),
('relation_pressure','照顾家人',   array['父母生病','要回家','放不下家里','尽孝'],         '{"fate.scenario_weights.family":0.5}'),
('relation_pressure','感情新生',   array['遇到喜欢的人','刚在一起','为爱停留','心动'],     '{"fate.scenario_weights.love":0.4}'),
('relation_pressure','被寄予厚望', array['全家的希望','背负全村','唯一的指望','压力山大'], '{"fate.scenario_weights.family":0.5,"persona.soft_spots":0.4}'),
('relation_pressure','关系破裂',   array['分手','闹翻','决裂','感情结束'],                 '{"fate.scenario_weights.love":0.4,"year.initial_mood":-0.3}'),
('relation_pressure','无人理解',   array['没人懂我','孤独感','说不出口','憋着'],           '{"persona.soft_spots":0.4,"fate.scenario_weights.self_growth":0.3}'),
('relation_pressure','社交回避',   array['不想见人','社恐','逃避聚会','自我封闭'],         '{"fate.scenario_weights.friendship":0.3,"persona.defense_mechanism":0.3}'),
('relation_pressure','为他人牺牲', array['成全别人','委屈自己','顾全大局','放弃所求'],     '{"persona.soft_spots":0.4,"persona.decision_tendency":0.4}');

-- ---------- 7. scenario_hint 人生域 (6) ----------
insert into intake_tags (category_id, label, synonyms, weight_hint) values
('scenario_hint','学业',     array['读书','考试','升学','复读','考研','考公','学校'],     '{"fate.scenario_weights.study":1.0}'),
('scenario_hint','事业',     array['工作','职场','创业','跳槽','升职','赚钱','行业'],     '{"fate.scenario_weights.career":1.0}'),
('scenario_hint','爱情',     array['恋爱','感情','结婚','分手','喜欢的人','伴侣'],       '{"fate.scenario_weights.love":1.0}'),
('scenario_hint','亲情',     array['家庭','父母','家人','回家','尽孝','亲子'],           '{"fate.scenario_weights.family":1.0}'),
('scenario_hint','友情',     array['朋友','同学','圈子','兄弟','闺蜜','同伴'],           '{"fate.scenario_weights.friendship":1.0}'),
('scenario_hint','自我成长', array['活成自己','认识自己','内在','成长','疗愈','独立'],   '{"fate.scenario_weights.self_growth":1.0}');

-- 完成：trait18 + mood16 + fear18 + value16 + relation15 + scenario6 = 89 个 tag
