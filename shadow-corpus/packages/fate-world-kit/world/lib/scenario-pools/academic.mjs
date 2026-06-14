'use strict';

import { scenarioMicro } from '../helpers.mjs';

export function academicPool(year) {
  const y = String(year);
  return [
    scenarioMicro('academic', 'school', `${y}年高考成绩公布，你刷榜刷到手机发烫`, 1.2, true, 'low', ['gaokao']),
    scenarioMicro('academic', 'school', '复读班开学，座位在最后一排靠窗', 1.3, true, 'high', ['gaokao']),
    scenarioMicro('academic', 'school', '四级成绩公布，你差一分没过', 1.0, true, 'low', ['exam']),
    scenarioMicro('academic', 'school', '毕业论文选题被导师打回三次', 1.1, true, 'low', ['thesis']),
    scenarioMicro('academic', 'school', '考研报名系统卡顿，你刷新了一小时', 0.9, false, 'low', ['postgrad']),
    scenarioMicro('academic', 'school', '教资/公考培训班传单塞满宿舍门缝', 0.7, false, 'low', ['exam']),
    scenarioMicro('academic', 'school', '实验数据跑飞了，你在实验室通宵重跑', 1.0, true, 'low', ['lab']),
    scenarioMicro('academic', 'school', '选课系统崩溃，你捡漏一门冷门课', 0.6, false, 'low', ['course']),
    scenarioMicro('academic', 'school', '期末周占座贴条「考研勿扰」', 0.8, false, 'low', ['exam']),
    scenarioMicro('academic', 'school', '你撕了模拟考准考证，室友看见没说话', 1.2, true, 'medium', ['gaokao']),
    scenarioMicro('academic', 'school', '转专业窗口期，你填了表又撤回', 1.1, true, 'low', ['major']),
    scenarioMicro('academic', 'school', '保研名单公示，你的名字在边缘', 1.2, true, 'medium', ['postgrad']),
    scenarioMicro('academic', 'school', '留学中介电话轰炸，你说「再考虑」', 0.8, false, 'low', ['abroad']),
    scenarioMicro('academic', 'school', '你在图书馆闭馆音乐里收拾书包，天还没亮', 0.9, false, 'low', ['study']),
    scenarioMicro('academic', 'school', '挂科重修，你走进教室发现是学弟学妹', 1.0, true, 'low', ['fail']),
    scenarioMicro('academic', 'school', '导师说「这篇能发」，你高兴了一周', 0.9, false, 'low', ['thesis']),
    scenarioMicro('academic', 'school', '你第一次挂科，不敢告诉家里', 1.1, true, 'medium', ['fail']),
    scenarioMicro('academic', 'school', '竞赛获奖，名字却排在第二位', 0.8, false, 'low', ['competition']),
    scenarioMicro('academic', 'school', '你在复读机构月考排名上升，却更焦虑', 1.2, true, 'medium', ['gaokao']),
    scenarioMicro('academic', 'school', '高考志愿填了「服从调剂」', 1.0, true, 'low', ['gaokao']),
    scenarioMicro('academic', 'school', '你偷听到同学被保送，假装在听歌', 1.0, true, 'low', ['peer']),
    scenarioMicro('academic', 'school', '网课时代你开着摄像头走神，被点名', 0.8, false, 'low', ['online']),
    scenarioMicro('academic', 'school', '你申请交换项目，材料被退回缺一个章', 0.9, true, 'low', ['abroad']),
    scenarioMicro('academic', 'school', '答辩当天PPT页码错了，你硬讲完了', 0.9, true, 'low', ['thesis']),
    scenarioMicro('academic', 'school', '你买了五三，只写了前两章', 0.7, false, 'low', ['gaokao']),
    scenarioMicro('academic', 'school', '班主任说「再坚持一下」，你想哭', 1.1, true, 'medium', ['gaokao']),
    scenarioMicro('academic', 'school', '你查分前洗手焚香，其实不信', 0.8, false, 'low', ['gaokao']),
    scenarioMicro('academic', 'school', '调剂系统开放，你每隔十分钟刷新', 1.1, true, 'low', ['gaokao']),
    scenarioMicro('academic', 'school', '你决定二战，父母说「家里供得起」', 1.2, true, 'medium', ['postgrad']),
    scenarioMicro('academic', 'school', '专业课老师记住你的名字，你受宠若惊', 0.8, false, 'low', ['mentor']),
    scenarioMicro('academic', 'school', '你在自习室看见昔日竞争对手，互相点头', 1.0, true, 'low', ['gaokao']),
    scenarioMicro('academic', 'school', '教材改版，你的笔记一半作废', 0.6, false, 'low', ['course']),
    scenarioMicro('academic', 'school', '你帮室友押题，结果全没中', 0.5, false, 'low', ['exam']),
    scenarioMicro('academic', 'school', '奖学金公示，你差0.5分', 1.0, true, 'low', ['award']),
    scenarioMicro('academic', 'school', '你写下「若考不上就……」，没写完', 1.2, true, 'medium', ['gaokao']),
    scenarioMicro('academic', 'school', `${y}年考研国家线公布，你盯着屏幕发呆`, 1.3, true, 'high', ['postgrad']),
    scenarioMicro('academic', 'school', 'AI查重系统升级，你参考文献格式改一夜', 1.0, true, 'low', ['ai'])
  ];
}
