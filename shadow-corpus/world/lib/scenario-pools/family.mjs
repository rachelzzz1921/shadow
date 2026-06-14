'use strict';

import { scenarioMicro } from '../helpers.mjs';

/** @param {number} year */
export function familyPool(year) {
  const y = String(year);
  return [
    scenarioMicro('family', 'family', `春节回${y}年老家，饭桌上被问「什么时候带对象回来」`, 1.1, true, 'low', ['spring']),
    scenarioMicro('family', 'family', '母亲转发「985父母培养出废柴」文章给你，附言：你看', 1.0, true, 'low', ['parent']),
    scenarioMicro('family', 'family', '父亲沉默地帮你交了一季度房租，说「别告诉你妈」', 1.2, true, 'medium', ['money']),
    scenarioMicro('family', 'family', '家族群里 cousin 晒娃，你母亲发了一个「微笑」表情', 0.9, true, 'low', ['spring']),
    scenarioMicro('family', 'family', '爷爷电话说「身体还好，就是常想你」，你握着手机很久', 1.1, true, 'medium', ['parent']),
    scenarioMicro('family', 'family', '父母来你工作的城市「顺路看看」，实际坐了12小时硬座', 1.2, true, 'medium', ['visit']),
    scenarioMicro('family', 'family', '母亲偷偷在你行李箱塞了腊味，安检时被要求开箱', 0.8, false, 'low', ['spring']),
    scenarioMicro('family', 'family', '父亲用你旧手机，不会用微信视频，只能发语音', 0.9, false, 'low', ['parent']),
    scenarioMicro('family', 'family', '家里让你「稳定一点」，你解释互联网行业他们听不懂', 1.0, true, 'low', ['career']),
    scenarioMicro('family', 'family', '弟弟妹妹问「哥/姐，我能不能也考去你那城市」', 0.8, false, 'low', ['sibling']),
    scenarioMicro('family', 'family', '母亲住院做小手术，你请假回去陪护三天', 1.3, true, 'medium', ['health']),
    scenarioMicro('family', 'family', '父亲在亲戚面前说「孩子在大城市有出息」，你听着心虚', 1.1, true, 'low', ['face']),
    scenarioMicro('family', 'family', '家族长辈撮合相亲，你婉拒后母亲整晚没说话', 1.0, true, 'low', ['marriage']),
    scenarioMicro('family', 'family', '你给父母买了新手机，教了十遍他们还是不会扫码', 0.7, false, 'low', ['parent']),
    scenarioMicro('family', 'family', '春节红包金额被比较，你笑得很僵', 0.9, false, 'low', ['spring']),
    scenarioMicro('family', 'family', '父母学会视频通话，每次先问「吃饭了吗」', 0.8, false, 'low', ['parent']),
    scenarioMicro('family', 'family', '家里老房拆迁讨论，亲戚在群里吵分配方案', 1.0, true, 'medium', ['housing']),
    scenarioMicro('family', 'family', '母亲存了一万「应急」，说「别硬撑」', 1.1, true, 'low', ['money']),
    scenarioMicro('family', 'family', '父亲酒后说「爸没本事，委屈你了」', 1.3, true, 'high', ['parent']),
    scenarioMicro('family', 'family', '你瞒着家里真实薪资，报高了三千块', 1.0, true, 'low', ['money']),
    scenarioMicro('family', 'family', '家族群转发养生谣言，你选择不回复', 0.6, false, 'low', ['parent']),
    scenarioMicro('family', 'family', '母亲帮你相亲角挂了资料，你气过后又心软', 1.1, true, 'low', ['marriage']),
    scenarioMicro('family', 'family', '父亲来城市看你，坚持睡沙发不肯住酒店', 1.0, true, 'low', ['visit']),
    scenarioMicro('family', 'family', '你第一次带礼物回家，母亲嫌贵让拿去退', 0.8, false, 'low', ['spring']),
    scenarioMicro('family', 'family', '家里供你读书的弟弟问「值得吗」，你没法回答', 1.2, true, 'medium', ['sibling']),
    scenarioMicro('family', 'family', '父母吵架，母亲打电话向你诉苦，你不知道站哪边', 1.0, true, 'medium', ['parent']),
    scenarioMicro('family', 'family', '亲戚说「女孩子读那么多书干嘛」，母亲替你回嘴', 0.9, true, 'low', ['gender']),
    scenarioMicro('family', 'family', '你给父母订了体检，他们嫌贵偷偷取消', 0.9, false, 'low', ['health']),
    scenarioMicro('family', 'family', '母亲把你们兄妹拉群，标题叫「相亲相爱一家人」', 0.5, false, 'low', ['parent']),
    scenarioMicro('family', 'family', `${y}年你没能回家过年，视频里看见门口新贴的对联`, 1.2, true, 'medium', ['spring']),
    scenarioMicro('family', 'family', '父亲学会用拼多多，给你寄了一箱不太需要的坚果', 0.7, false, 'low', ['parent']),
    scenarioMicro('family', 'family', '你告诉父母想换城市，母亲说「别跑太远」', 1.0, true, 'low', ['move']),
    scenarioMicro('family', 'family', '家里老照片翻出你小时候，母亲说「那时候多乖」', 0.8, false, 'low', ['memory']),
    scenarioMicro('family', 'family', '你承担家里第一台空调的安装费，父亲记在了本上', 0.9, false, 'low', ['money']),
    scenarioMicro('family', 'family', '父母来参加你的毕业典礼，在人群里踮脚找你', 1.1, true, 'low', ['milestone']),
    scenarioMicro('family', 'family', '母亲问你「还恨不恨当年逼你复读」，你沉默', 1.4, true, 'high', ['gaokao'])
  ];
}
