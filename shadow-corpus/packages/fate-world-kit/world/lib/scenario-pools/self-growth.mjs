'use strict';

import { scenarioMicro } from '../helpers.mjs';

export function selfGrowthPool(year) {
  return [
    scenarioMicro('self_growth', 'health', '体检报告「轻度脂肪肝」，你买了健身卡却只去了一次', 0.9, false, 'low', ['health']),
    scenarioMicro('self_growth', 'health', '连续熬夜后心悸，你去搜「是不是要猝死了」', 1.0, true, 'medium', ['burnout']),
    scenarioMicro('self_growth', 'health', '心理咨询预约排到两周后', 1.1, true, 'medium', ['mental']),
    scenarioMicro('self_growth', 'health', '牙疼拖了三周，终于预约到周末号源', 0.6, false, 'low', ['dental']),
    scenarioMicro('self_growth', 'health', '体检排队空腹到中午，低血糖手抖', 0.8, false, 'low', ['health']),
    scenarioMicro('self_growth', 'health', '瑜伽课团购券过期前最后一天去', 0.5, false, 'low', ['health']),
    scenarioMicro('self_growth', 'digital', '短视频刷到「同龄人已经年入百万」', 1.1, true, 'low', ['anxiety']),
    scenarioMicro('self_growth', 'digital', '你在日记App写了三千字，设为私密', 0.8, false, 'low', ['journal']),
    scenarioMicro('self_growth', 'health', '你第一次对朋友说「我可能需要帮助」', 1.2, true, 'medium', ['mental']),
    scenarioMicro('self_growth', 'digital', '你删了社交App三天，又装了回来', 0.9, true, 'low', ['detox']),
    scenarioMicro('self_growth', 'health', '你尝试冥想，第十分钟想到待办清单', 0.6, false, 'low', ['mental']),
    scenarioMicro('self_growth', 'school', '你问自己「到底想要什么」，没有答案', 1.2, true, 'medium', ['identity']),
    scenarioMicro('self_growth', 'health', '你梦见还在高考考场，醒来一身汗', 1.0, true, 'medium', ['gaokao']),
    scenarioMicro('self_growth', 'digital', '你发仅自己可见：「今天又假装很好」', 1.1, true, 'medium', ['anxiety']),
    scenarioMicro('self_growth', 'health', '你报了一个线下工作坊，差点临阵脱逃', 0.9, true, 'low', ['growth']),
    scenarioMicro('self_growth', 'school', '你翻出旧日记，发现担心的事一半没发生', 0.8, false, 'low', ['memory']),
    scenarioMicro('self_growth', 'health', '你学会说「不」，代价是被人说变了', 1.0, true, 'low', ['boundary']),
    scenarioMicro('self_growth', 'digital', '你取关一半博主，信息流安静了', 0.7, false, 'low', ['detox']),
    scenarioMicro('self_growth', 'health', '你第一次独自旅行，在青旅和陌生人聊到两点', 1.0, true, 'low', ['solo']),
    scenarioMicro('self_growth', 'school', '你意识到「要强」有时是怕被人看穿', 1.3, true, 'high', ['identity']),
    scenarioMicro('self_growth', 'health', '你写下十年后的信，封存在邮箱草稿', 0.9, false, 'low', ['future']),
    scenarioMicro('self_growth', 'digital', '你看了心理医生推荐的书，划线划到第三页', 0.7, false, 'low', ['mental']),
    scenarioMicro('self_growth', 'health', '你尝试早起，坚持了四天', 0.6, false, 'low', ['habit']),
    scenarioMicro('self_growth', 'school', '你承认某个梦想已经放下，心里空了一下', 1.2, true, 'medium', ['regret']),
    scenarioMicro('self_growth', 'health', '你在镜子前练习「我已经够好了」', 0.9, true, 'low', ['self_worth']),
    scenarioMicro('self_growth', 'digital', '你关闭「同龄人对比」推送，世界没塌', 0.8, false, 'low', ['anxiety']),
    scenarioMicro('self_growth', 'health', '你因为「不甘」多撑了一年，不确定值不值', 1.2, true, 'medium', ['identity']),
    scenarioMicro('self_growth', 'school', '你列出「如果不怕失败会做什么」清单', 1.0, true, 'low', ['growth']),
    scenarioMicro('self_growth', 'health', '你第一次没哭着挂电话，而是去洗了脸', 1.0, true, 'low', ['resilience']),
    scenarioMicro('self_growth', 'digital', '你把「别人眼里的我」和「真实的我」写两栏', 1.1, true, 'medium', ['identity']),
    scenarioMicro('self_growth', 'health', '你报名志愿者，只是想走出房间', 0.8, false, 'low', ['growth']),
    scenarioMicro('self_growth', 'school', '你对自己说：遗憾可以存在，不必马上和解', 1.2, true, 'medium', ['regret']),
    scenarioMicro('self_growth', 'health', '你删了「待办100条」，只留下三件', 0.8, false, 'low', ['minimal']),
    scenarioMicro('self_growth', 'digital', `${year}年深夜，你搜索「人生意义」，关掉手机没点进去`, 1.0, true, 'low', ['meaning']),
    scenarioMicro('self_growth', 'health', '你终于允许自己「不想要也可以」', 1.4, true, 'high', ['acceptance'])
  ];
}
