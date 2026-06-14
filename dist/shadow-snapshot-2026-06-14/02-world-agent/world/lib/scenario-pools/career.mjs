'use strict';

import { scenarioMicro } from '../helpers.mjs';

export function careerPool(year) {
  const y = String(year);
  return [
    scenarioMicro('career', 'work', '部门群里@全体成员，你假装没看见直到被点名', 0.9, false, 'low', ['office']),
    scenarioMicro('career', 'work', '996讨论上热搜，你公司发邮件强调「奋斗者文化」', 1.2, true, 'medium', ['996']),
    scenarioMicro('career', 'work', '裁员名单流传，工位空了一半', 1.3, true, 'medium', ['layoff']),
    scenarioMicro('career', 'work', '领导说「年轻人要多承担」，你接下不属于你的项目', 1.0, true, 'low', ['overwork']),
    scenarioMicro('career', 'work', '面试被问「能接受出差吗」，你知道这意味着全年飞', 0.9, true, 'low', ['job']),
    scenarioMicro('career', 'work', '同事离职请客，饭桌上说「行业不行了」', 1.0, true, 'low', ['industry']),
    scenarioMicro('career', 'work', '客户改需求第五版，你微笑说「好的收到」', 1.0, true, 'low', ['client']),
    scenarioMicro('career', 'work', '电梯里听见HR聊「优化」，你楼层到了', 1.2, true, 'medium', ['layoff']),
    scenarioMicro('career', 'work', '工牌刷不进新门禁，保安说系统升级', 0.5, false, 'low', ['office']),
    scenarioMicro('career', 'work', '年会抽奖没中，安慰奖是一盒月饼', 0.4, false, 'low', ['office']),
    scenarioMicro('career', 'work', '远程办公第一天，你穿着睡衣开摄像头', 0.8, false, 'low', ['wfh']),
    scenarioMicro('career', 'work', '居家办公考勤App要拍照，你在被窝打卡', 1.0, true, 'low', ['wfh']),
    scenarioMicro('career', 'work', '团建强制爬山，你膝盖疼但不敢请假', 0.8, false, 'low', ['office']),
    scenarioMicro('career', 'work', 'ChatGPT帮你写周报，你改了三版才敢交', 1.0, false, 'low', ['ai']),
    scenarioMicro('career', 'work', '打印机卡纸，全办公室等你修', 0.5, false, 'low', ['office']),
    scenarioMicro('career', 'work', '面试被问「35岁怎么办」，你愣了一秒', 1.1, true, 'medium', ['job']),
    scenarioMicro('career', 'work', '互联网寒冬，内推码突然没人要了', 1.2, true, 'medium', ['layoff']),
    scenarioMicro('career', 'work', '实习转正答辩，PPT最后一页写「谢谢」', 0.9, true, 'low', ['intern']),
    scenarioMicro('career', 'work', '你收到offer，薪资比预期低两千', 1.0, true, 'low', ['job']),
    scenarioMicro('career', 'work', '入职第一天，没人带你吃饭', 0.9, true, 'low', ['onboard']),
    scenarioMicro('career', 'work', '你提离职，领导说「再想想，给你加薪」', 1.1, true, 'medium', ['quit']),
    scenarioMicro('career', 'work', '考公进面，你请假封闭培训一周', 1.0, true, 'low', ['civil_service']),
    scenarioMicro('career', 'work', '事业单位笔试，考场外全是刷题的', 0.9, false, 'low', ['civil_service']),
    scenarioMicro('career', 'work', '你想转行，简历被HR已读不回', 1.1, true, 'low', ['pivot']),
    scenarioMicro('career', 'work', '创业想法写在备忘录，第三版仍没发', 0.9, true, 'low', ['startup']),
    scenarioMicro('career', 'work', '你跨城offer，纠结户口与房租', 1.1, true, 'low', ['move']),
    scenarioMicro('career', 'money', '工资到账短信和房贷扣款短信几乎同时到达', 1.2, true, 'low', ['mortgage']),
    scenarioMicro('career', 'money', '花呗账单日，你先把最低还款还上', 0.9, false, 'low', ['debt']),
    scenarioMicro('career', 'money', '基金绿了一周，你发誓再也不看账户', 0.8, false, 'low', ['invest']),
    scenarioMicro('career', 'money', 'P2P暴雷新闻出来，你查自己的理财App', 1.1, true, 'medium', ['finance']),
    scenarioMicro('career', 'policy_touch', '落户政策微调，你查攻略到凌晨', 0.9, true, 'low', ['hukou']),
    scenarioMicro('career', 'policy_touch', '居住证续签窗口排队三小时', 0.7, false, 'low', ['bureaucracy']),
    scenarioMicro('career', 'policy_touch', '个税App提醒专项附加扣除', 0.4, false, 'low', ['tax']),
    scenarioMicro('career', 'work', '你加班到末班地铁，车厢里全是同样的人', 1.0, false, 'low', ['996']),
    scenarioMicro('career', 'work', '猎头电话说「有个机会」，你正在开会', 0.8, false, 'low', ['job']),
    scenarioMicro('career', 'work', '绩效面谈，你提前写了小作文', 1.0, true, 'low', ['review']),
    scenarioMicro('career', 'work', '你被派去驻场，客户比老板难伺候', 1.0, true, 'low', ['client']),
    scenarioMicro('career', 'work', `${y}年行业报告说「回暖」，你工资没涨`, 1.0, true, 'low', ['industry']),
    scenarioMicro('career', 'work', '你存够六个月生活费，才敢提离职', 1.1, true, 'medium', ['quit']),
    scenarioMicro('career', 'work', '同事被裁，你帮忙搬纸箱，心里发凉', 1.2, true, 'medium', ['layoff'])
  ];
}
