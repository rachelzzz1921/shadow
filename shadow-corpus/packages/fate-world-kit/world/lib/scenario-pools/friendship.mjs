'use strict';

import { scenarioMicro } from '../helpers.mjs';

export function friendshipPool(year) {
  return [
    scenarioMicro('friendship', 'digital', '群聊里同学晒offer，你默默设成免打扰', 1.0, true, 'low', ['peer']),
    scenarioMicro('friendship', 'school', '室友通宵打游戏，你戴耳塞刷题到两点', 0.9, false, 'low', ['dorm']),
    scenarioMicro('friendship', 'school', '社团招新，你犹豫要不要竞选部长', 0.8, false, 'low', ['club']),
    scenarioMicro('friendship', 'school', '同学出国读书，散伙饭上大家都喝多', 1.0, true, 'low', ['farewell']),
    scenarioMicro('friendship', 'school', '选修课签到二维码，室友让你代扫', 0.7, false, 'low', ['dorm']),
    scenarioMicro('friendship', 'neighborhood', '地铁新线开通，你和室友约定「以后一起坐这条线」', 0.6, false, 'low', ['transit']),
    scenarioMicro('friendship', 'digital', '朋友圈有人晒证，你点赞后立刻划走', 0.8, false, 'low', ['peer']),
    scenarioMicro('friendship', 'digital', '博客园/知乎长文收藏了从未读完', 0.5, false, 'low', ['peer']),
    scenarioMicro('friendship', 'school', '实验室师兄留校读博，你问「值得吗」', 0.9, true, 'low', ['peer']),
    scenarioMicro('friendship', 'school', '占座神器「占座猴」在二手群转让', 0.6, false, 'low', ['dorm']),
    scenarioMicro('friendship', 'school', '图书馆占座大战，你六点去排队', 0.7, false, 'low', ['study']),
    scenarioMicro('friendship', 'school', '小组作业只有你在写，其他人在群里发表情', 1.1, true, 'low', ['teamwork']),
    scenarioMicro('friendship', 'digital', '你退了一个500人的年级群，没人发现', 0.7, false, 'low', ['drift']),
    scenarioMicro('friendship', 'school', '昔日死党换了专业，见面话题只剩「忙吗」', 1.0, true, 'low', ['drift']),
    scenarioMicro('friendship', 'school', '你借同学笔记，发现最后一页写着「别卷了」', 0.8, false, 'low', ['peer']),
    scenarioMicro('friendship', 'neighborhood', '合租室友搬走，你们没互删微信却不再说话', 1.0, true, 'low', ['drift']),
    scenarioMicro('friendship', 'digital', '你在游戏公会认识的朋友，线下见面发现完全两样', 0.8, false, 'low', ['online']),
    scenarioMicro('friendship', 'school', '毕业照站位，你站在最边缘', 0.9, true, 'low', ['farewell']),
    scenarioMicro('friendship', 'school', '同学结婚请你当伴郎/伴娘，你担心随份子', 0.8, false, 'low', ['wedding']),
    scenarioMicro('friendship', 'digital', '你发起聚会，最后只有两个人到场', 1.0, true, 'low', ['lonely']),
    scenarioMicro('friendship', 'school', '室友恋爱后常不在宿舍，你突然不习惯独处', 0.8, false, 'low', ['dorm']),
    scenarioMicro('friendship', 'school', '你帮同学改简历，TA拿到offer后很少联系你', 0.9, true, 'low', ['peer']),
    scenarioMicro('friendship', 'digital', '老同学在LinkedIn加你，你们寒暄三句结束', 0.7, false, 'low', ['drift']),
    scenarioMicro('friendship', 'school', '你加入兴趣小组，发现只是换了个地方玩手机', 0.6, false, 'low', ['club']),
    scenarioMicro('friendship', 'neighborhood', '小区球局缺人，邻居喊你，你去了并踢进一个乌龙', 0.7, false, 'low', ['sport']),
    scenarioMicro('friendship', 'digital', '你在B站弹幕认出一个ID，私信后对方说「谁啊」', 0.8, false, 'low', ['online']),
    scenarioMicro('friendship', 'school', '你向朋友倾诉，TA回「我也一样啊」', 0.9, true, 'low', ['support']),
    scenarioMicro('friendship', 'school', '昔日小团体散了，朋友圈点赞只剩互赞', 1.0, true, 'low', ['drift']),
    scenarioMicro('friendship', 'school', '你记得朋友生日，对方忘记你的', 0.9, true, 'low', ['hurt']),
    scenarioMicro('friendship', 'digital', '群文件「就业形势分析.pdf」下载了没打开', 0.6, false, 'low', ['peer']),
    scenarioMicro('friendship', 'school', '你拒绝帮同学代课，后来关系淡了一截', 0.8, true, 'low', ['boundary']),
    scenarioMicro('friendship', 'school', '实习公司遇见校友，你们假装很熟', 0.7, false, 'low', ['network']),
    scenarioMicro('friendship', 'digital', '你在微博小号吐槽，被共同好友截图', 1.1, true, 'medium', ['trust']),
    scenarioMicro('friendship', 'school', '毕业五年聚会，你发现说话最多的人变了', 1.0, true, 'low', ['reunion']),
    scenarioMicro('friendship', 'school', '你送朋友离开月台，回来发了一条仅自己可见的朋友圈', 1.0, true, 'low', ['farewell']),
    scenarioMicro('friendship', 'digital', `${year}年你删了聊天记录，却留着那个人的备注`, 0.9, true, 'low', ['memory'])
  ];
}
