你最终必须输出合法 JSON，结构如下：

{
"agentTrace": {
"primaryAgent": "Academic Shadow Agent",
"scene": "academic",
"secondaryTags": ["家庭期待", "经济压力", "同辈比较"],
"coreConflict": "学历路径与自我价值之间的冲突",
"reasoningSummary": "用户的核心选择围绕复读展开，核心情绪是不甘与迷茫，因此启用学业 Agent，并加入家庭期待和现实压力作为约束。",
"constraintsUsed": [
"保持因果链",
"避免脱离现实的爽文逆袭",
"学业结果受到现实条件、心理状态和时代背景共同影响"
]
},
"profile": {
"mbti": "INFP",
"keywords": ["迷茫", "不甘", "坚定"],
"choiceNode": "高考后是否复读",
"realChoice": "没有复读，直接进入大学",
"shadowChoice": "复读一年，再次参加高考",
"coreSentence": "我经常想象另一种人生。",
"choiceYear": 2020
},
"shadow": {
"name": "Shadow",
"concept": "平行时空中替用户走上另一条路的影子。",
"visualDescription": "半透明、贴近地面的黑白灰残影，像被时间拉长的人影。"
},
"timeline": [
{
"yearIndex": 1,
"calendarYear": 2020,
"title": "重新开始的第一年",
"location": "复读学校",
"mainEvent": "Shadow 选择复读，重新面对高考压力。",
"keyChoice": "继续坚持还是中途放弃。",
"shadowAction": "他没有立刻变得坚定，而是在反复怀疑中重新建立学习节奏。",
"emotion": "不安但执着",
"emotionScore": 62,
"memory": "某个深夜，他在空教室里把错题本翻到最后一页。",
"reflection": "他开始明白，不甘不是力量本身，能把不甘变成行动才是。",
"dialogue": "那一年我没有变得更勇敢，只是比以前多坚持了一天。",
"visualTags": ["classroom", "night", "shadow"],
"isKeyNode": true
}
],
"finalSummary": {
"title": "七年后的回望",
"sevenYearResult": "七年后，Shadow 没有得到一条完美人生，但他在另一条路上重新理解了自己的不甘。",
"messageToUser": "那条路也有遗憾，但也有风景。",
"theme": "与未选择的人生和解"
}
}

注意：

* timeline 必须包含 7 个年份节点。
* calendarYear 从用户 choiceYear 开始逐年递增。
* emotionScore 使用 0 到 100 的整数。
* 每一年都要有 memory、reflection 和 dialogue。
* agentTrace 必须解释本次启用的场景 Agent 和主要约束。
* 输出中不要出现 Markdown。
* 输出中不要写“以下是 JSON”。
* 只输出 JSON 本体。
