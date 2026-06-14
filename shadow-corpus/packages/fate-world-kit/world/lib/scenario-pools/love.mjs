'use strict';

import { scenarioMicro } from '../helpers.mjs';

export function lovePool(year) {
  return [
    scenarioMicro('love', 'romance', '前任发来「最近好吗」，你打了删删了打', 1.1, true, 'low', ['breakup']),
    scenarioMicro('love', 'romance', '暧昧对象已读不回48小时，你刷TA朋友圈到三个月前', 1.0, true, 'low', ['ghosting']),
    scenarioMicro('love', 'romance', '相亲对象问「你有房吗」，你笑了一下没回答', 1.0, true, 'low', ['dating']),
    scenarioMicro('love', 'romance', '异地恋视频时对方说「我们冷静一下」', 1.2, true, 'medium', ['distance']),
    scenarioMicro('love', 'romance', 'Crush给你点了外卖，备注写「加油」', 0.9, false, 'low', ['crush']),
    scenarioMicro('love', 'romance', '分手后的歌单随机播到那一首，你立刻切歌', 1.0, true, 'low', ['breakup']),
    scenarioMicro('love', 'romance', '情人节外卖鲜花迟到，你仍说没关系', 0.8, false, 'low', ['dating']),
    scenarioMicro('love', 'romance', '约会对象说「感觉你不够松弛」', 1.0, true, 'low', ['dating']),
    scenarioMicro('love', 'romance', '你在社交软件匹配到同校学妹，犹豫要不要划走', 0.9, false, 'low', ['dating']),
    scenarioMicro('love', 'romance', '恋人想公开关系，你担心同事议论', 1.0, true, 'low', ['public']),
    scenarioMicro('love', 'romance', '对方父母视频「顺便看看你」，你穿了最正式的一件衬衫', 1.1, true, 'medium', ['family']),
    scenarioMicro('love', 'romance', '吵架后你道歉，其实不确定错在哪', 1.0, true, 'low', ['conflict']),
    scenarioMicro('love', 'romance', '前任婚礼请柬送到，你随了份子没去', 1.2, true, 'medium', ['breakup']),
    scenarioMicro('love', 'romance', '暧昧止于「我们还是做朋友吧」', 1.0, true, 'low', ['friendzone']),
    scenarioMicro('love', 'romance', '你保存了聊天记录截图，却不敢回看', 0.9, true, 'low', ['memory']),
    scenarioMicro('love', 'romance', '恋人提分手时说「你很好，是我配不上」', 1.1, true, 'medium', ['breakup']),
    scenarioMicro('love', 'romance', '你在地铁看见相似背影，追了两站不是TA', 0.8, false, 'low', ['memory']),
    scenarioMicro('love', 'romance', '恋爱三周年，你忘了，对方说「没事」', 1.0, true, 'low', ['anniversary']),
    scenarioMicro('love', 'romance', '对方想同居，你担心房租和边界', 1.0, true, 'low', ['cohabit']),
    scenarioMicro('love', 'romance', 'Introvert的你被拉去恋人朋友局，整晚微笑', 0.7, false, 'low', ['social']),
    scenarioMicro('love', 'romance', '你第一次说「我爱你」，对方回答「嗯」', 1.1, true, 'medium', ['confession']),
    scenarioMicro('love', 'romance', '恋人出差一个月，你们靠 nightly call 维持', 0.9, false, 'low', ['distance']),
    scenarioMicro('love', 'romance', '你发现对方仍关注前任微博，一夜没睡', 1.2, true, 'medium', ['trust']),
    scenarioMicro('love', 'romance', '父母反对这段关系，你第一次顶嘴', 1.3, true, 'medium', ['family']),
    scenarioMicro('love', 'romance', '分手后共同好友结婚，你们被安排同桌', 1.0, true, 'low', ['awkward']),
    scenarioMicro('love', 'romance', '你在恋人面前哭，事后觉得丢脸', 1.0, true, 'low', ['vulnerable']),
    scenarioMicro('love', 'romance', '对方送你的礼物，你收在抽屉最里层', 0.8, false, 'low', ['memory']),
    scenarioMicro('love', 'romance', '恋爱中你仍在 dating app 上滑，然后注销', 1.1, true, 'medium', ['guilt']),
    scenarioMicro('love', 'romance', '你们讨论「将来」，一个说城市一个说自由', 1.2, true, 'medium', ['future']),
    scenarioMicro('love', 'romance', '复合后旧问题在第三周重新出现', 1.1, true, 'low', ['reconcile']),
    scenarioMicro('love', 'romance', '你写长信解释，对方回「收到了」', 1.0, true, 'low', ['conflict']),
    scenarioMicro('love', 'romance', '单身久了，朋友介绍你时你说「随缘吧」', 0.8, false, 'low', ['dating']),
    scenarioMicro('love', 'romance', '你在雨里等TA两小时，收到「下次吧」', 1.2, true, 'medium', ['standup']),
    scenarioMicro('love', 'romance', '恋人说「我需要空间」，你回「好」然后失眠', 1.1, true, 'medium', ['distance']),
    scenarioMicro('love', 'romance', `${year}年跨年夜，你一个人刷到满屏情侣合照`, 0.9, true, 'low', ['lonely']),
    scenarioMicro('love', 'romance', '你终于承认：有些关系不是努力就能修好', 1.2, true, 'medium', ['acceptance'])
  ];
}
