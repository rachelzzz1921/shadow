import React, { useState, useEffect, useRef, useMemo } from "react";

/* =========================================================================
   Shadow — 平行人生叙事引擎 · 用户信息采集界面
   "after midnight" 视觉方向：深墨蓝夜色 + 一束未选之路的暖光
   三层：A 自由文本 / B 标签库 / C 十道精准小问
   ========================================================================= */

/* ---------- 设计 tokens ---------- */
const T = {
  ink: "#0B1020",        // 夜色底
  ink2: "#11182B",       // 卡片
  ink3: "#1A2238",       // 浮层
  line: "#2A3350",       // 分隔线
  fog: "#8A93AD",        // 次要文字（雾）
  mist: "#C7CDDD",       // 主文字
  glow: "#E8B25C",       // 暖光 = 未选之路
  glowSoft: "rgba(232,178,92,0.14)",
  glowLine: "rgba(232,178,92,0.55)",
  cool: "#6E8BD6",       // 冷调强调（系统语音）
  serif: "'Songti SC','Noto Serif SC','Georgia',serif",
  mono: "'SF Mono','JetBrains Mono','Menlo',monospace",
};

/* ---------- 标签库 seed（与 seed_tags.json 一致的精简内嵌版）---------- */
const CATEGORIES = [
  { id:"trait", label:"性格特质", desc:"岔路口前后，你大致是个怎样的人", max:5, min:1 },
  { id:"mood_at_fork", label:"岔路口时心情", desc:"做决定那段时间，心里的底色", max:3, min:1 },
  { id:"fear", label:"深层恐惧", desc:"夜里睡不着时，真正怕的东西", max:4, min:0 },
  { id:"value", label:"价值排序", desc:"取舍时，你下意识护住的东西", max:4, min:1 },
  { id:"relation_pressure", label:"关系压力源", desc:"谁的存在，让这个决定变重了", max:3, min:0 },
];
const TAGS = {
  trait: ["要强","完美主义","讨好型","慢热","外冷内热","敏感","独立","钝感","理性","感性","拖延","执拗","随和","好强又自卑","控制欲强","讨厌冲突","上进","钻牛角尖"],
  mood_at_fork: ["不甘","迷茫","赌气","松一口气","假装无所谓","焦虑","期待","疲惫","害怕","释然","委屈","兴奋","空落落","倔强","麻木","侥幸"],
  fear: ["怕被看穿","怕让父母失望","怕选错","怕平庸","怕被抛下","怕孤独","怕不被爱","怕失控","怕被否定","怕浪费时间","怕真实的自己不够好","怕失去自由","怕辜负自己","怕被比较","怕承认失败","怕没有意义","怕被看轻","怕亲密"],
  value: ["面子","自由","稳定","被认可","关系优先","成就","真实","掌控","成长","归属","公平","安全感","卓越","轻松","忠诚","意义感"],
  relation_pressure: ["父母期待","伴侣异地","朋友分流","独自承担","同辈比较","家庭经济","长辈催促","师长期望","照顾家人","感情新生","被寄予厚望","关系破裂","无人理解","社交回避","为他人牺牲"],
};
// tag -> 主场景域映射（用于 Layer A 关键词命中 + 标签摘要）
const TAG_DOMAIN = {
  "父母期待":"family","照顾家人":"family","被寄予厚望":"family","长辈催促":"family","家庭经济":"family",
  "伴侣异地":"love","感情新生":"love","关系破裂":"love","怕不被爱":"love","怕亲密":"love",
  "朋友分流":"friendship","同辈比较":"friendship","社交回避":"friendship","怕被抛下":"friendship",
  "上进":"career","成就":"career","卓越":"career",
};

/* ---------- 场景域 ---------- */
const DOMAINS = {
  study:{ zh:"学业", kw:["复读","考研","考公","高考","上学","读书","学校","专业","学位","毕业","考试","升学","退学","保研","考博"] },
  career:{ zh:"事业", kw:["工作","职场","创业","跳槽","升职","公司","行业","赚钱","offer","辞职","上班","项目","生意","裁员","转行"] },
  love:{ zh:"爱情", kw:["恋爱","结婚","分手","异地","对象","男友","女友","喜欢的人","表白","在一起","感情","离婚","暗恋","相亲"] },
  family:{ zh:"亲情", kw:["父母","爸妈","家里","老家","回家","尽孝","家人","母亲","父亲","奶奶","爷爷","照顾","家庭"] },
  friendship:{ zh:"友情", kw:["朋友","同学","闺蜜","兄弟","圈子","室友","同伴","发小"] },
  self_growth:{ zh:"自我成长", kw:["自己","活成","成长","内心","独立","疗愈","认识自己","改变","重新开始","放过自己"] },
};
function detectDomain(text, tags){
  const score = Object.fromEntries(Object.keys(DOMAINS).map(k=>[k,0]));
  const t = (text||"").toLowerCase();
  for(const [k,v] of Object.entries(DOMAINS)) for(const w of v.kw) if(t.includes(w.toLowerCase())) score[k]+=1;
  for(const tag of (tags||[])) if(TAG_DOMAIN[tag]) score[TAG_DOMAIN[tag]]+=0.6;
  const entries = Object.entries(score).sort((a,b)=>b[1]-a[1]);
  const total = entries.reduce((s,[,v])=>s+v,0);
  const top = entries[0];
  const conf = total>0 ? Math.min(0.95, 0.35 + top[1]/Math.max(total,1)*0.6) : 0;
  return { top:top[0], conf, dist:score, total };
}

/* ---------- 十道题 ---------- */
const QUESTIONS = [
  { id:"SH-Q01", section:"岔路口", kind:"binary",
    text:"和人起冲突时，你的身体先做哪件事？", subtitle:"不是你想做什么，是你实际会做什么",
    note:"这题帮系统理解你在压力下的默认反应——decision_tendency 的根。",
    options:[
      {key:"A", text:"先退一步，把场面圆回来", sub:"冲突回避型，倾向妥协维持关系"},
      {key:"B", text:"先顶住，绝不先低头", sub:"对抗坚持型，倾向硬撑维护立场"},
    ]},
  { id:"SH-Q02", section:"性格", kind:"slider",
    text:"别人怎么看你，对你有多重要？", subtitle:"诚实一点，没人在记分",
    note:"外在评价敏感度 → soft_spots 与 initial_esteem 脆弱度。",
    min:0, max:100, left:"我活我的", right:"几乎是我的标尺",
    tiers:[[0,20,"我活我的"],[21,45,"听听就算"],[46,70,"会在意"],[71,90,"很在意"],[91,100,"几乎是我的标尺"]],
    feedback:[[0,30,"你似乎有一套自己的秤。"],[31,70,"你在自己和别人之间来回。"],[71,100,"别人的眼光，可能比你以为的更重。"]] },
  { id:"SH-Q03", section:"性格", kind:"scenario", scene:"失败的第二天清晨",
    text:"一件事彻底搞砸了。第二天醒来，你做的第一件事是——",
    note:"失败后第一反应，暴露防御机制类型。",
    options:[
      {key:"A", text:"立刻列计划，想怎么补救", sub:"行动型防御：用忙碌掩盖失控"},
      {key:"B", text:"反复回想哪里错了，怪自己", sub:"内归因：高自我苛责，esteem 易塌"},
      {key:"C", text:"假装没事，照常过日子", sub:"压抑型：回避情绪，怕被看穿"},
      {key:"D", text:"找人吐槽，或干脆出去玩", sub:"外部调节：依赖关系或刺激转移"},
    ]},
  { id:"SH-Q04", section:"关系", kind:"choice",
    text:"做大决定时，谁的脸会先浮现在你脑子里？", subtitle:"不是你想听谁的，是谁先出现",
    note:"关系压力源 → 六域 family/love/friendship 权重。",
    options:[
      {key:"A", text:"父母", sub:"家庭期待主导"},
      {key:"B", text:"伴侣 / 喜欢的人", sub:"亲密关系主导"},
      {key:"C", text:"朋友 / 同辈", sub:"同辈比较主导"},
      {key:"D", text:"几乎只有我自己", sub:"高自主，可能无支持"},
    ]},
  { id:"SH-Q05", section:"岔路口", kind:"mood",
    text:"岔路口那天晚上，主导你的是哪种情绪？", subtitle:"点最接近的那一格",
    note:"岔路口当晚主导情绪 → 初始 mood 基线。",
    cells:[
      {key:"A", label:"不甘 / 赌气", q:"向外 · 激烈", mood:4},
      {key:"D", label:"麻木 / 装无所谓", q:"向内 · 激烈", mood:4},
      {key:"C", label:"松一口气", q:"向外 · 低沉", mood:6},
      {key:"B", label:"迷茫 / 空", q:"向内 · 低沉", mood:3},
    ]},
  { id:"SH-Q06", section:"价值", kind:"slider",
    text:"「算了」和「再试一次」之间，你的指针停在哪？", subtitle:"这一题，影子会记很久",
    note:"decision_tendency 核心——决定影子在 pivotal 年往哪走。",
    min:0, max:100, left:"算了，就这样", right:"再试一次",
    tiers:[[0,25,"学会放手"],[26,50,"会权衡"],[51,75,"倾向再拼一次"],[76,100,"几乎永远不甘心"]],
    feedback:[[0,25,"你懂得什么时候停下。"],[26,50,"你会算成本。"],[51,75,"你倾向再给自己一次机会。"],[76,100,"『再撑一下』，可能是本能，也可能是陷阱。"]] },
  { id:"SH-Q07", section:"价值", kind:"binary",
    text:"如果只能保住一个——", subtitle:"面子，还是真实的自己？",
    note:"面子 vs 真实，核心价值冲突。",
    options:[
      {key:"A", text:"体面地撑住", sub:"面子优先，esteem 依赖外部"},
      {key:"B", text:"难看也要做真的自己", sub:"真实优先，自我一致高于认可"},
    ]},
  { id:"SH-Q08", section:"价值", kind:"rank",
    text:"往后七年，你最怕失去哪一样？", subtitle:"按怕的程度，从上往下排",
    note:"恐惧排序 → soft_spots 主轴 + 六域微调。",
    items:[
      {key:"A", text:"重要的关系", sub:"丧失焦虑 → 亲密/家庭"},
      {key:"B", text:"做成事的成就", sub:"丧失焦虑 → 事业/学业"},
      {key:"C", text:"自己的自由", sub:"丧失焦虑 → 自主"},
      {key:"D", text:"被人真正理解", sub:"丧失焦虑 → 被看见"},
    ]},
  { id:"SH-Q09", section:"岔路口", kind:"scenario", scene:"决定的前夜",
    text:"岔路口的前一夜，你大概率在干嘛？", subtitle:"凭直觉选",
    note:"前夜行为模式，暴露应对焦虑的真实方式。",
    options:[
      {key:"A", text:"反复查资料、列利弊，睡不着", sub:"焦虑性过度准备，控制感缺失"},
      {key:"B", text:"和某个人聊到很晚", sub:"依赖外部确认来下决心"},
      {key:"C", text:"假装这事不存在，刷手机睡了", sub:"回避型，推迟面对"},
      {key:"D", text:"其实早就决定了，很平静", sub:"决心已定，或事后合理化"},
    ]},
  { id:"SH-Q10", section:"性格", kind:"choice",
    text:"用一句话形容那时候的自己，哪句最像？", subtitle:"选最扎心的那个",
    note:"core_traits archetype 锚定 + Persona voice 校准。",
    options:[
      {key:"A", text:"「再撑一下，撑过去就好了」", sub:"archetype 硬撑者 · 要强+怕认输"},
      {key:"B", text:"「我是不是根本不该来」", sub:"archetype 怀疑者 · 自我否定+迷茫"},
      {key:"C", text:"「只要别人觉得我可以就行」", sub:"archetype 取悦者 · 外部驱动"},
      {key:"D", text:"「随便吧，反正也没差」", sub:"archetype 抽离者 · 假装无所谓"},
    ]},
];
const SECTIONS = ["岔路口","性格","关系","价值"];

/* ---------- 示例卡 ---------- */
const EXAMPLES = [
  { tag:"复读", choice:"如果当年我去复读了，而不是直接上了那所大专", desc:"我那时候就是不甘心，觉得一次没考好不代表我不行。可真要再来一年，我又怕万一还是考不好，那才是彻底证明了我就这水平。" },
  { tag:"考公", choice:"如果当年我留在老家考公，而不是一个人去了深圳", desc:"我妈一直说稳定最重要，我嘴上不服，可每次深夜加班我都在想，是不是她才是对的。我不确定我想要的，到底是闯出来，还是只是不想认输。" },
  { tag:"异地", choice:"如果当年我为他留在了那座城市，而不是去读那个研究生", desc:"我们都说会等，可我心里清楚异地撑不久。我选了自己，然后用了很多年说服自己这是对的——其实我到现在都不知道。" },
];

/* =========================================================================
   小组件
   ========================================================================= */

function Glow({ size=1 }){
  return <div style={{position:"absolute",inset:0,pointerEvents:"none",
    background:`radial-gradient(${600*size}px ${400*size}px at 78% -5%, ${T.glowSoft}, transparent 60%)`}}/>;
}

/* 进度：四段 section chip */
function SectionProgress({ current }){
  const idx = SECTIONS.indexOf(current);
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
      {SECTIONS.map((s,i)=>(
        <div key={s} style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:T.mono,fontSize:11,letterSpacing:.5,
            color: i<idx ? T.glow : i===idx ? T.mist : T.fog,
            opacity: i<=idx?1:.5,
            borderBottom: i===idx?`1px solid ${T.glowLine}`:"1px solid transparent",
            paddingBottom:2, transition:"all .4s"}}>
            {i<idx?"· ":""}{s}
          </span>
          {i<SECTIONS.length-1 && <span style={{color:T.line,fontSize:10}}>—</span>}
        </div>
      ))}
    </div>
  );
}

/* 影子轮廓：随完成度逐渐清晰（signature element）*/
function ShadowFigure({ clarity }){ // 0..1
  const op = 0.12 + clarity*0.7;
  const blur = (1-clarity)*5;
  return (
    <svg viewBox="0 0 80 110" width="64" height="88" style={{display:"block"}}>
      <defs>
        <radialGradient id="sg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={T.glow} stopOpacity={clarity*0.5}/>
          <stop offset="100%" stopColor={T.cool} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <g style={{filter:`blur(${blur}px)`, transition:"all .6s"}}>
        <ellipse cx="40" cy="22" rx="13" ry="14" fill={T.cool} opacity={op}/>
        <path d="M22 95 Q22 52 40 50 Q58 52 58 95 Z" fill={T.cool} opacity={op}/>
        <ellipse cx="40" cy="40" rx="30" ry="34" fill="url(#sg)"/>
      </g>
    </svg>
  );
}

/* =========================================================================
   Layer A — 自由文本
   ========================================================================= */
function LayerA({ data, set, onDomain }){
  const [hint09, setHint09] = useState(false);
  const idleRef = useRef();

  const det = useMemo(()=>detectDomain((data.choice||"")+" "+(data.self_description||""), []), [data.choice, data.self_description]);
  useEffect(()=>{ onDomain(det); },[det, onDomain]);

  // self_description 停顿追问
  function onDescChange(v){
    set({self_description:v});
    clearTimeout(idleRef.current);
    setHint09(false);
    idleRef.current = setTimeout(()=>{ if(v.length>0 && v.length<40) setHint09(true); }, 4000);
  }

  const choiceLen = (data.choice||"").length;
  const descLen = (data.self_description||"").length;
  const ringColor = choiceLen<20 ? T.fog : choiceLen>120 ? T.glow : T.cool;

  const yearOpts = [];
  for(let y=2010;y>=1970;y--) yearOpts.push(y);
  const forkOpts = [];
  for(let y=2026;y>=(data.birth_year? data.birth_year+10:1980);y--) forkOpts.push(y);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:34}}>
      {/* 示例卡 */}
      <div>
        <div style={lblStyle}>不知道从哪说起？借一个开头</div>
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
          {EXAMPLES.map(e=>(
            <button key={e.tag} onClick={()=>set({choice:e.choice, self_description:e.desc})}
              style={{flex:"0 0 auto",textAlign:"left",width:200,padding:"12px 14px",
                background:T.ink2,border:`1px solid ${T.line}`,borderRadius:12,cursor:"pointer",
                transition:"all .25s"}}
              onMouseEnter={ev=>ev.currentTarget.style.borderColor=T.glowLine}
              onMouseLeave={ev=>ev.currentTarget.style.borderColor=T.line}>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.glow,letterSpacing:1,marginBottom:6}}>{e.tag}线</div>
              <div style={{fontFamily:T.serif,fontSize:14,color:T.mist,lineHeight:1.5}}>{e.choice}</div>
              <div style={{fontSize:11,color:T.fog,marginTop:8}}>点这里 → 用这个开始</div>
            </button>
          ))}
        </div>
      </div>

      {/* 字段1 岔路口 */}
      <Field label="那个岔路口" required hint="试试『如果当年我______，而不是______』">
        <div style={{position:"relative"}}>
          <textarea value={data.choice||""} onChange={e=>set({choice:e.target.value})}
            placeholder="如果当年我没有出国，而是留在成都做住院医师"
            rows={2} style={taStyle}/>
          <div style={{position:"absolute",right:12,bottom:10,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:ringColor}}>{choiceLen}/120</span>
            <Ring v={Math.min(choiceLen/120,1)} color={ringColor}/>
          </div>
        </div>
        {choiceLen>0 && choiceLen<20 &&
          <div style={subHint}>再多说一点——影子需要一个具体的岔路口。</div>}
        {/* 实时场景域 */}
        {choiceLen>=6 &&
          <DomainPill det={det} />}
      </Field>

      {/* 字段2 自我描述 */}
      <Field label="那时候的你" hint="岔路口前后，你在怕什么、又在拼命想要什么？">
        <textarea value={data.self_description||""} onChange={e=>onDescChange(e.target.value)}
          placeholder="我习惯用成绩证明自己，但每次靠近目标又会怀疑自己是不是真的想要它"
          rows={3} style={taStyle}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
          <span style={{fontSize:11,color: hint09?T.glow:"transparent",transition:"color .4s"}}>
            那时候，最让你睡不着的是什么？
          </span>
          <span style={{fontFamily:T.mono,fontSize:11,color: descLen>=40&&descLen<=200?T.cool:T.fog}}>{descLen}/200</span>
        </div>
      </Field>

      {/* 字段3 一句话 */}
      <Field label="最像你的一句话" hint="常说的、别人对你说的、或心里反复出现的">
        <input value={data.one_liner||""} onChange={e=>set({one_liner:e.target.value})}
          placeholder="再撑一下，撑过去就好了" style={inStyle}/>
      </Field>

      {/* 字段4 锚点 */}
      <div>
        <div style={{...lblStyle, borderTop:`1px solid ${T.line}`, paddingTop:20}}>锚定时间</div>
        <div style={{fontSize:12,color:T.fog,marginBottom:14}}>影子要活在真实的年代里。</div>
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          <Anchor label="你的出生年">
            <select value={data.birth_year||""} onChange={e=>{
              const by=+e.target.value; set({birth_year:by, age: data.fork_year? data.fork_year-by : data.age});
            }} style={selStyle}>
              <option value="">—</option>
              {yearOpts.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </Anchor>
          <Anchor label="岔路口那年">
            <select value={data.fork_year||""} onChange={e=>{
              const fy=+e.target.value; set({fork_year:fy, age: data.birth_year? fy-data.birth_year : data.age});
            }} style={selStyle}>
              <option value="">—</option>
              {forkOpts.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </Anchor>
          <Anchor label="那年你几岁">
            <input type="number" value={data.age??""} onChange={e=>set({age:+e.target.value})}
              style={{...selStyle,width:72}}/>
          </Anchor>
        </div>
        {data.birth_year&&data.fork_year&&Math.abs((data.fork_year-data.birth_year)-(data.age||0))>1 &&
          <div style={subHint}>和你填的年份差得有点多，确认一下？</div>}
      </div>
    </div>
  );
}

function DomainPill({ det }){
  const [open,setOpen]=useState(false);
  if(det.total<=0) return (
    <div style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:8,
      padding:"6px 12px",borderRadius:20,background:T.ink3,border:`1px solid ${T.line}`}}>
      <Dot color={T.fog} pulse/><span style={{fontFamily:T.mono,fontSize:11,color:T.fog}}>还在理解…</span>
    </div>
  );
  const zh = DOMAINS[det.top].zh;
  return (
    <div style={{marginTop:12}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:"inline-flex",alignItems:"center",gap:8,
        padding:"6px 12px",borderRadius:20,background:T.glowSoft,border:`1px solid ${T.glowLine}`,
        cursor:"pointer"}}>
        <span>📍</span>
        <span style={{fontFamily:T.mono,fontSize:11,color:T.glow,letterSpacing:.5}}>
          {zh} · {Math.round(det.conf*100)}%
        </span>
        <span style={{fontSize:10,color:T.fog}}>{open?"收起":"系统听懂了吗？"}</span>
      </button>
      {open &&
        <div style={{marginTop:10,padding:"12px 14px",background:T.ink2,borderRadius:12,border:`1px solid ${T.line}`}}>
          <div style={{fontSize:11,color:T.fog,marginBottom:10}}>六域分布（可点击纠正主域）：</div>
          {Object.entries(det.dist).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{
            const w = det.total>0? v/det.total*100:0;
            return (
              <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{width:64,fontSize:12,color: k===det.top?T.mist:T.fog}}>{DOMAINS[k].zh}</span>
                <div style={{flex:1,height:5,background:T.ink3,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${w}%`,height:"100%",background:k===det.top?T.glow:T.cool,
                    opacity:k===det.top?1:.5,transition:"width .5s"}}/>
                </div>
                <span style={{fontFamily:T.mono,fontSize:10,color:T.fog,width:30,textAlign:"right"}}>{Math.round(w)}%</span>
              </div>
            );
          })}
        </div>}
    </div>
  );
}

/* =========================================================================
   Layer B — 标签库
   ========================================================================= */
function LayerB({ picked, toggle, search, setSearch }){
  const [open,setOpen]=useState("trait");
  return (
    <div style={{display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap"}}>
      {/* 左：标签库 */}
      <div style={{flex:"1 1 380px",minWidth:300}}>
        <div style={{position:"relative",marginBottom:18}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="搜词，比如「不甘」「父母」「自由」" style={{...inStyle,paddingLeft:36}}/>
          <span style={{position:"absolute",left:12,top:13,color:T.fog,fontSize:14}}>⌕</span>
        </div>
        {CATEGORIES.map(cat=>{
          const n = (picked[cat.id]||[]).length;
          const isOpen = open===cat.id || search.length>0;
          const list = TAGS[cat.id].filter(t=> !search || t.includes(search));
          if(search && list.length===0) return null;
          return (
            <div key={cat.id} style={{marginBottom:12,background:T.ink2,borderRadius:14,
              border:`1px solid ${n>0?T.glowLine:T.line}`,overflow:"hidden",transition:"border-color .3s"}}>
              <button onClick={()=>setOpen(isOpen&&!search?"":cat.id)}
                style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <div>
                  <span style={{fontFamily:T.serif,fontSize:16,color:T.mist}}>{cat.label}</span>
                  <span style={{fontSize:12,color:T.fog,marginLeft:10}}>{cat.desc}</span>
                </div>
                <span style={{fontFamily:T.mono,fontSize:11,color:n>0?T.glow:T.fog}}>
                  {n}/{cat.max}
                </span>
              </button>
              {isOpen &&
                <div style={{padding:"0 16px 16px",display:"flex",flexWrap:"wrap",gap:8}}>
                  {list.map(tag=>{
                    const on = (picked[cat.id]||[]).includes(tag);
                    const full = n>=cat.max && !on;
                    return (
                      <button key={tag} disabled={full}
                        onClick={()=>toggle(cat.id, tag, cat.max)}
                        style={{padding:"7px 13px",borderRadius:18,fontSize:13,cursor:full?"not-allowed":"pointer",
                          fontFamily:T.serif, transition:"all .2s",
                          transform: on?"scale(1.04)":"scale(1)",
                          background: on?T.glow:"transparent",
                          color: on?T.ink:full?T.line:T.mist,
                          border:`1px solid ${on?T.glow:full?T.line:T.fog}`,
                          opacity: full?.4:1}}>
                        {tag}
                      </button>
                    );
                  })}
                  <button onClick={()=>{
                      const c=prompt(`给「${cat.label}」加一个自己的词：`); if(c) toggle(cat.id,c,cat.max,true);
                    }}
                    style={{padding:"7px 13px",borderRadius:18,fontSize:13,cursor:"pointer",
                      background:"none",color:T.cool,border:`1px dashed ${T.cool}`,fontFamily:T.mono}}>
                    + 自己的词
                  </button>
                </div>}
              {n>=cat.max &&
                <div style={{padding:"0 16px 12px",fontSize:11,color:T.fog}}>
                  最多 {cat.max} 个——影子需要重点，不需要全部。
                </div>}
            </div>
          );
        })}
      </div>

      {/* 右：影子初读 */}
      <div style={{flex:"1 1 280px",minWidth:260,position:"sticky",top:20}}>
        <div style={{background:T.ink2,borderRadius:16,border:`1px solid ${T.line}`,
          padding:"20px 20px 22px",position:"relative",overflow:"hidden"}}>
          <Glow size={.6}/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.glow,letterSpacing:1.5}}>影子初读</span>
            <div style={{flex:1,height:1,background:T.line}}/>
          </div>
          <ShadowRead picked={picked}/>
          <div style={{marginTop:16,fontSize:11,color:T.fog,fontStyle:"italic",lineHeight:1.6}}>
            这只是初步印象，真正的影子会在七年里慢慢看清你。
          </div>
        </div>
      </div>
    </div>
  );
}

function ShadowRead({ picked }){
  const traits = picked.trait||[], fears = picked.fear||[], vals = picked.value||[],
        moods = picked.mood_at_fork||[], rels = picked.relation_pressure||[];
  const any = traits.length||fears.length||vals.length||moods.length||rels.length;
  if(!any) return (
    <div style={{fontFamily:T.serif,fontSize:15,color:T.fog,lineHeight:1.9}}>
      先选几个标签——这里会实时显示，影子第一眼会怎么读你。
    </div>
  );
  const frag = [];
  if(traits.length) frag.push(`你像是${traits.slice(0,2).join("、")}的人`);
  if(fears.length) frag.push(`怕${fears[0].replace(/^怕/,"")}，所以有些事你说不出口`);
  if(vals.length) frag.push(`取舍时，你下意识护住的是「${vals[0]}」`);
  if(rels.length) frag.push(`而${rels[0]}，让那个决定变得更重`);
  const tail = (moods.length? `那段日子的底色，是${moods[0]}。` : "");
  return (
    <div style={{fontFamily:T.serif,fontSize:15.5,color:T.mist,lineHeight:1.95}}>
      {frag.join("；")}。{tail}
      {(traits.includes("好强又自卑")||fears.includes("怕被看穿")||vals.includes("面子")) &&
        <span style={{color:T.glow}}> 我们还不确定——你扛着的，到底是你想要的，还是你以为该想要的。</span>}
    </div>
  );
}

/* =========================================================================
   Layer C — 十道题
   ========================================================================= */
function LayerC({ answers, answer, onComplete }){
  const [i,setI]=useState(0);
  const startRef = useRef(Date.now());
  const q = QUESTIONS[i];

  useEffect(()=>{ startRef.current=Date.now(); },[i]);

  function commit(value){
    const dur = Date.now()-startRef.current;
    answer(q.id, value, dur);
    if(i<QUESTIONS.length-1) setTimeout(()=>setI(i+1), 400);
    else setTimeout(onComplete, 450);
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <SectionProgress current={q.section}/>
        <span style={{fontFamily:T.mono,fontSize:11,color:T.fog}}>{i+1} / {QUESTIONS.length}</span>
      </div>
      {/* 进度条 */}
      <div style={{height:2,background:T.line,borderRadius:2,marginBottom:30,overflow:"hidden"}}>
        <div style={{width:`${(i)/QUESTIONS.length*100}%`,height:"100%",background:T.glow,transition:"width .4s"}}/>
      </div>

      <div style={{minHeight:340}}>
        <div style={{marginBottom:6,fontFamily:T.mono,fontSize:11,color:T.glow,letterSpacing:1}}>{q.id}</div>
        {q.scene &&
          <div style={{display:"inline-block",marginBottom:14,padding:"4px 12px",borderRadius:16,
            background:T.ink3,border:`1px solid ${T.line}`,fontFamily:T.mono,fontSize:11,color:T.cool}}>
            场景 · {q.scene}
          </div>}
        <h2 style={{fontFamily:T.serif,fontSize:26,lineHeight:1.45,color:T.mist,margin:"0 0 8px",fontWeight:500}}>{q.text}</h2>
        {q.subtitle && <div style={{fontSize:14,color:T.fog,marginBottom:26}}>{q.subtitle}</div>}

        {q.kind==="binary" && <Binary q={q} cur={answers[q.id]?.value} onPick={commit}/>}
        {(q.kind==="choice"||q.kind==="scenario") && <Choices q={q} cur={answers[q.id]?.value} onPick={commit}/>}
        {q.kind==="slider" && <Slider q={q} cur={answers[q.id]?.value} onCommit={commit}/>}
        {q.kind==="mood" && <MoodGrid q={q} cur={answers[q.id]?.value} onPick={commit}/>}
        {q.kind==="rank" && <Rank q={q} onCommit={commit}/>}
      </div>

      <div style={{marginTop:20,display:"flex",justifyContent:"space-between",alignItems:"center",
        borderTop:`1px solid ${T.line}`,paddingTop:16}}>
        <button onClick={()=>i>0&&setI(i-1)} disabled={i===0}
          style={{background:"none",border:"none",color:i===0?T.line:T.fog,cursor:i===0?"default":"pointer",
            fontFamily:T.mono,fontSize:12}}>← 上一题</button>
        <span style={{fontSize:11,color:T.fog,fontStyle:"italic"}}>{q.note}</span>
      </div>
    </div>
  );
}

function Binary({ q, cur, onPick }){
  return (
    <div style={{display:"flex",gap:14}}>
      {q.options.map(o=>{
        const on=cur===o.key;
        return (
          <button key={o.key} onClick={()=>onPick(o.key)}
            style={{flex:1,padding:"28px 22px",borderRadius:16,cursor:"pointer",textAlign:"left",
              background: on?T.glowSoft:T.ink2, border:`1px solid ${on?T.glowLine:T.line}`,
              transition:"all .25s"}}
            onMouseEnter={e=>{if(!on)e.currentTarget.style.borderColor=T.fog;}}
            onMouseLeave={e=>{if(!on)e.currentTarget.style.borderColor=T.line;}}>
            <div style={{fontFamily:T.serif,fontSize:19,color:T.mist,lineHeight:1.5,marginBottom:10}}>{o.text}</div>
            <div style={{fontSize:11.5,color:T.fog,fontFamily:T.mono}}>{o.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

function Choices({ q, cur, onPick }){
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      {q.options.map(o=>{
        const on=cur===o.key;
        return (
          <button key={o.key} onClick={()=>onPick(o.key)}
            style={{padding:"18px 18px",borderRadius:14,cursor:"pointer",textAlign:"left",
              background: on?T.glowSoft:T.ink2, border:`1px solid ${on?T.glowLine:T.line}`,
              transition:"all .25s",display:"flex",gap:12,alignItems:"flex-start"}}
            onMouseEnter={e=>{if(!on)e.currentTarget.style.borderColor=T.fog;}}
            onMouseLeave={e=>{if(!on)e.currentTarget.style.borderColor=T.line;}}>
            <span style={{fontFamily:T.mono,fontSize:12,color:on?T.glow:T.fog,marginTop:3}}>{o.key}</span>
            <div>
              <div style={{fontFamily:T.serif,fontSize:16.5,color:T.mist,lineHeight:1.5,marginBottom:6}}>{o.text}</div>
              <div style={{fontSize:11,color:T.fog,fontFamily:T.mono,lineHeight:1.5}}>{o.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Slider({ q, cur, onCommit }){
  const [v,setV]=useState(cur ?? Math.round((q.min+q.max)/2));
  const tier = q.tiers.find(([a,b])=>v>=a&&v<=b)?.[2] || "";
  const fb = q.feedback.find(([a,b])=>v>=a&&v<=b)?.[2] || "";
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
        <span style={{fontSize:12,color:T.fog,fontFamily:T.mono}}>{q.left}</span>
        <span style={{fontSize:12,color:T.fog,fontFamily:T.mono}}>{q.right}</span>
      </div>
      <div style={{textAlign:"center",marginBottom:8}}>
        <span style={{fontFamily:T.serif,fontSize:44,color:T.glow,fontWeight:500}}>{v}</span>
      </div>
      <div style={{textAlign:"center",marginBottom:26}}>
        <span style={{fontFamily:T.serif,fontSize:18,color:T.mist}}>{tier}</span>
      </div>
      <input type="range" min={q.min} max={q.max} value={v}
        onChange={e=>setV(+e.target.value)}
        onPointerUp={()=>onCommit(v)} onTouchEnd={()=>onCommit(v)}
        style={{width:"100%",accentColor:T.glow,height:4,cursor:"pointer"}}/>
      <div style={{textAlign:"center",marginTop:22,minHeight:24}}>
        <span style={{fontSize:14,color:T.cool,fontStyle:"italic"}}>{fb}</span>
      </div>
      <div style={{textAlign:"center",marginTop:14}}>
        <span style={{fontSize:11,color:T.fog,fontFamily:T.mono}}>松手即记录 · 自动进入下一题</span>
      </div>
    </div>
  );
}

function MoodGrid({ q, cur, onPick }){
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,position:"relative"}}>
        {q.cells.map(c=>{
          const on=cur===c.key;
          return (
            <button key={c.key} onClick={()=>onPick(c.key)}
              style={{padding:"32px 18px",borderRadius:14,cursor:"pointer",
                minHeight:120,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",
                background:on?T.glowSoft:T.ink2,border:`1px solid ${on?T.glowLine:T.line}`,transition:"all .25s"}}
              onMouseEnter={e=>{if(!on)e.currentTarget.style.borderColor=T.fog;}}
              onMouseLeave={e=>{if(!on)e.currentTarget.style.borderColor=T.line;}}>
              <div style={{fontFamily:T.serif,fontSize:19,color:T.mist,marginBottom:8}}>{c.label}</div>
              <div style={{fontFamily:T.mono,fontSize:10.5,color:T.fog,letterSpacing:1}}>{c.q}</div>
            </button>
          );
        })}
      </div>
      <div style={{textAlign:"center",marginTop:16,fontFamily:T.mono,fontSize:11,color:T.fog}}>
        横轴：向外 ←→ 向内　·　纵轴：激烈 ↑↓ 低沉
      </div>
    </div>
  );
}

function Rank({ q, onCommit }){
  const [order,setOrder]=useState(q.items.map(x=>x.key));
  const move=(k,dir)=>{
    const idx=order.indexOf(k), to=idx+dir;
    if(to<0||to>=order.length) return;
    const next=[...order]; [next[idx],next[to]]=[next[to],next[idx]]; setOrder(next);
  };
  const byKey=Object.fromEntries(q.items.map(x=>[x.key,x]));
  return (
    <div>
      {order.map((k,idx)=>{
        const it=byKey[k];
        return (
          <div key={k} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",marginBottom:10,
            background:T.ink2,borderRadius:12,border:`1px solid ${idx===0?T.glowLine:T.line}`}}>
            <span style={{fontFamily:T.serif,fontSize:22,color:idx===0?T.glow:T.fog,width:28,textAlign:"center"}}>{idx+1}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:T.serif,fontSize:16.5,color:T.mist,marginBottom:4}}>{it.text}</div>
              <div style={{fontSize:11,color:T.fog,fontFamily:T.mono}}>{it.sub}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <button onClick={()=>move(k,-1)} disabled={idx===0} style={arrowBtn(idx===0)}>▲</button>
              <button onClick={()=>move(k,1)} disabled={idx===order.length-1} style={arrowBtn(idx===order.length-1)}>▼</button>
            </div>
          </div>
        );
      })}
      <button onClick={()=>onCommit(order)} style={{marginTop:8,width:"100%",padding:"14px",
        background:T.glow,color:T.ink,border:"none",borderRadius:12,cursor:"pointer",
        fontFamily:T.serif,fontSize:16,fontWeight:600}}>
        就按这个顺序 →
      </button>
    </div>
  );
}

/* =========================================================================
   汇总页 full_profile
   ========================================================================= */
function Summary({ profile }){
  return (
    <div>
      <h2 style={{fontFamily:T.serif,fontSize:28,color:T.mist,fontWeight:500,marginBottom:6}}>影子已经成形</h2>
      <div style={{fontSize:14,color:T.fog,marginBottom:28}}>下面是交给 Persona agent 的 full_profile —— 也是影子认识你的全部起点。</div>

      {profile.tension_flags?.length>0 &&
        <div style={{padding:"18px 20px",background:T.glowSoft,border:`1px solid ${T.glowLine}`,
          borderRadius:14,marginBottom:24}}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.glow,letterSpacing:1,marginBottom:10}}>⚑ 张力点（影子最在意的裂缝）</div>
          {profile.tension_flags.map((t,i)=>(
            <div key={i} style={{fontFamily:T.serif,fontSize:15,color:T.mist,lineHeight:1.7,marginBottom:6}}>
              {t.detail}
              <div style={{fontSize:12,color:T.fog,fontStyle:"italic",marginTop:2}}>{t.note}</div>
            </div>
          ))}
        </div>}

      <pre style={{background:T.ink2,border:`1px solid ${T.line}`,borderRadius:14,padding:"18px 20px",
        fontFamily:T.mono,fontSize:12,color:T.mist,lineHeight:1.7,overflow:"auto",maxHeight:480}}>
        {JSON.stringify(profile,null,2)}
      </pre>
    </div>
  );
}

/* =========================================================================
   小样式件
   ========================================================================= */
const lblStyle={fontFamily:T.serif,fontSize:15,color:T.mist,marginBottom:10};
const subHint={marginTop:8,fontSize:12,color:T.glow,fontStyle:"italic"};
const taStyle={width:"100%",padding:"14px 16px",background:T.ink2,border:`1px solid ${T.line}`,
  borderRadius:12,color:T.mist,fontFamily:T.serif,fontSize:16,lineHeight:1.7,resize:"vertical",
  outline:"none",boxSizing:"border-box"};
const inStyle={width:"100%",padding:"13px 16px",background:T.ink2,border:`1px solid ${T.line}`,
  borderRadius:12,color:T.mist,fontFamily:T.serif,fontSize:16,outline:"none",boxSizing:"border-box"};
const selStyle={padding:"11px 14px",background:T.ink2,border:`1px solid ${T.line}`,borderRadius:10,
  color:T.mist,fontFamily:T.mono,fontSize:14,outline:"none",cursor:"pointer"};
function arrowBtn(dis){return {width:26,height:22,background:T.ink3,border:`1px solid ${T.line}`,
  borderRadius:6,color:dis?T.line:T.fog,cursor:dis?"default":"pointer",fontSize:9};}

function Field({label,required,hint,children}){
  return (
    <div>
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
        <span style={lblStyle}>{label}</span>
        {required && <span style={{fontSize:11,color:T.glow,fontFamily:T.mono}}>必填</span>}
      </div>
      {hint && <div style={{fontSize:12,color:T.fog,marginBottom:12}}>{hint}</div>}
      {children}
    </div>
  );
}
function Anchor({label,children}){
  return (
    <div>
      <div style={{fontSize:11,color:T.fog,fontFamily:T.mono,marginBottom:6}}>{label}</div>
      {children}
    </div>
  );
}
function Ring({v,color}){
  const r=8,c=2*Math.PI*r;
  return (
    <svg width="20" height="20">
      <circle cx="10" cy="10" r={r} fill="none" stroke={T.line} strokeWidth="2"/>
      <circle cx="10" cy="10" r={r} fill="none" stroke={color} strokeWidth="2"
        strokeDasharray={c} strokeDashoffset={c*(1-v)} strokeLinecap="round"
        transform="rotate(-90 10 10)" style={{transition:"stroke-dashoffset .3s, stroke .3s"}}/>
    </svg>
  );
}
function Dot({color,pulse}){
  return <span style={{width:6,height:6,borderRadius:6,background:color,display:"inline-block",
    animation: pulse?"sdPulse 1.4s infinite":"none"}}/>;
}

/* =========================================================================
   主组件
   ========================================================================= */
export default function ShadowIntake(){
  const [layer,setLayer]=useState("A"); // A | B | C | done
  const [a,setA]=useState({});
  const [picked,setPicked]=useState({});
  const [search,setSearch]=useState("");
  const [answers,setAnswers]=useState({});
  const [det,setDet]=useState({top:"study",conf:0,dist:{},total:0});

  const setAField=(patch)=>setA(p=>({...p,...patch}));
  const toggleTag=(cat,tag,max,custom)=>{
    setPicked(p=>{
      const cur=p[cat]||[];
      if(cur.includes(tag)) return {...p,[cat]:cur.filter(x=>x!==tag)};
      if(cur.length>=max) return p;
      return {...p,[cat]:[...cur,tag]};
    });
  };
  const recordAnswer=(qid,value,dur)=>setAnswers(p=>({...p,[qid]:{value,durationMs:dur}}));

  // 完成度 → 影子清晰度
  const clarity = useMemo(()=>{
    let c=0;
    if(a.choice) c+=0.12; if(a.self_description) c+=0.10; if(a.birth_year&&a.fork_year) c+=0.05;
    c += Math.min(Object.values(picked).flat().length,12)/12*0.23;
    c += Object.keys(answers).length/10*0.50;
    return Math.min(c,1);
  },[a,picked,answers]);

  // 构建 full_profile
  const profile = useMemo(()=>buildProfile(a,picked,answers,det),[a,picked,answers,det]);

  // 各层能否继续
  const canA = (a.choice||"").length>=20 && a.birth_year && a.fork_year && a.age!=null;
  const canB = (picked.trait||[]).length>=1 && (picked.mood_at_fork||[]).length>=1 && (picked.value||[]).length>=1;

  return (
    <div style={{background:T.ink,minHeight:"100vh",color:T.mist,
      fontFamily:T.serif, position:"relative", overflow:"hidden"}}>
      <style>{`
        @keyframes sdPulse{0%,100%{opacity:.3}50%{opacity:1}}
        *::selection{background:${T.glowSoft};}
        input::placeholder,textarea::placeholder{color:${T.fog};opacity:.6;}
        @media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important;}}
        select option{background:${T.ink2};}
        ::-webkit-scrollbar{height:6px;width:6px;}
        ::-webkit-scrollbar-thumb{background:${T.line};border-radius:3px;}
      `}</style>
      <Glow/>
      {/* 中线「路」 */}
      <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,
        background:`linear-gradient(${T.glowLine},transparent 30%)`,opacity:.25,pointerEvents:"none"}}/>

      <div style={{maxWidth:880,margin:"0 auto",padding:"40px 24px 80px",position:"relative"}}>
        {/* 顶部 */}
        <header style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:38}}>
          <div>
            <div style={{fontFamily:T.mono,fontSize:11,color:T.glow,letterSpacing:3,marginBottom:8}}>SHADOW</div>
            <h1 style={{fontFamily:T.serif,fontSize:32,fontWeight:500,margin:0,lineHeight:1.3}}>
              告诉影子，你是谁
            </h1>
            <div style={{fontSize:14,color:T.fog,marginTop:8,maxWidth:440,lineHeight:1.7}}>
              它会替你活完那条没走的路——所以它需要先认识，站在岔路口的你。
            </div>
          </div>
          <div style={{textAlign:"center",flexShrink:0}}>
            <ShadowFigure clarity={clarity}/>
            <div style={{fontFamily:T.mono,fontSize:10,color:T.fog,marginTop:4}}>清晰度 {Math.round(clarity*100)}%</div>
          </div>
        </header>

        {/* 三层导航 */}
        <nav style={{display:"flex",gap:0,marginBottom:36,borderBottom:`1px solid ${T.line}`}}>
          {[["A","自由说"],["B","选标签"],["C","十道问"]].map(([k,l],idx)=>{
            const active=layer===k;
            const done = (k==="A"&&layer!=="A"&&canA) || (k==="B"&&(layer==="C"||layer==="done")) ;
            return (
              <button key={k} onClick={()=>{ if(k!=="C"||canA) setLayer(k); }}
                style={{padding:"10px 20px",background:"none",border:"none",cursor:"pointer",
                  borderBottom:`2px solid ${active?T.glow:"transparent"}`,marginBottom:-1,
                  display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:T.mono,fontSize:11,color:active?T.glow:done?T.cool:T.fog}}>
                  {done?"✓":`0${idx+1}`}
                </span>
                <span style={{fontFamily:T.serif,fontSize:16,color:active?T.mist:T.fog}}>{l}</span>
              </button>
            );
          })}
        </nav>

        {/* 内容 */}
        <main>
          {layer==="A" && <>
            <LayerA data={a} set={setAField} onDomain={setDet}/>
            <NextBar canNext={canA}
              hint={canA?"":"填好岔路口（≥20字）和出生/岔路口年份就能继续"}
              onNext={()=>setLayer("B")}/>
          </>}
          {layer==="B" && <>
            <LayerB picked={picked} toggle={toggleTag} search={search} setSearch={setSearch}/>
            <NextBar canNext={canB}
              hint={canB?"":"性格 / 心情 / 价值 各至少选 1 个"}
              onNext={()=>setLayer("C")} back={()=>setLayer("A")}/>
          </>}
          {layer==="C" &&
            <LayerC answers={answers} answer={recordAnswer} onComplete={()=>setLayer("done")}/>}
          {layer==="done" && <Summary profile={profile}/>}
        </main>
      </div>
    </div>
  );
}

function NextBar({canNext,hint,onNext,back}){
  return (
    <div style={{marginTop:40,display:"flex",justifyContent:"space-between",alignItems:"center",
      borderTop:`1px solid ${T.line}`,paddingTop:22}}>
      {back? <button onClick={back} style={{background:"none",border:"none",color:T.fog,cursor:"pointer",
        fontFamily:T.mono,fontSize:12}}>← 返回</button> : <span/>}
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        {hint && <span style={{fontSize:12,color:T.fog}}>{hint}</span>}
        <button onClick={onNext} disabled={!canNext}
          style={{padding:"12px 28px",borderRadius:24,border:"none",cursor:canNext?"pointer":"not-allowed",
            background:canNext?T.glow:T.ink3, color:canNext?T.ink:T.fog,
            fontFamily:T.serif,fontSize:16,fontWeight:600,transition:"all .25s"}}>
          继续 →
        </button>
      </div>
    </div>
  );
}

/* ---------- full_profile 构建逻辑 ---------- */
function buildProfile(a,picked,answers,det){
  const tags = Object.entries(picked).flatMap(([cat,arr])=>arr.map(label=>({cat,label})));
  // 六域权重（标签 + Q04/Q08 加成 + det）
  const w = {family:0,love:0,friendship:0,study:0,career:0,self_growth:0};
  for(const {label} of tags){ const d=TAG_DOMAIN[label]; if(d&&w[d]!=null) w[d]+=0.15; }
  if(det.top&&w[det.top]!=null) w[det.top]+=0.3;
  const q4={A:"family",B:"love",C:"friendship",D:"self_growth"}[answers["SH-Q04"]?.value];
  if(q4) w[q4]+=0.3;
  // 归一
  const sum=Object.values(w).reduce((s,v)=>s+v,0)||1;
  const scenario_weights=Object.fromEntries(Object.entries(w).map(([k,v])=>[k,+(v/sum).toFixed(2)]));

  // mood / esteem 基线
  const moodCell=QUESTIONS.find(q=>q.id==="SH-Q05").cells.find(c=>c.key===answers["SH-Q05"]?.value);
  const initial_mood = moodCell?.mood ?? 5;
  const extSens = answers["SH-Q02"]?.value ?? 50;
  const initial_esteem = Math.max(1,Math.min(10, Math.round(7 - (extSens-50)/20)));

  // decision_tendency
  const persist = answers["SH-Q06"]?.value ?? 50;
  const conflict = answers["SH-Q01"]?.value;
  const dt = `在『再努力一次』和『承认就这样』之间，${persist>=55?"结构性地选前者":persist<=45?"更可能选后者":"反复权衡"}` +
    (conflict==="B"?"；冲突中倾向硬撑不低头":conflict==="A"?"；冲突中倾向先妥协":"");

  // archetype
  const arche={A:"the_endurer",B:"the_doubter",C:"the_pleaser",D:"the_detached"}[answers["SH-Q10"]?.value];

  // soft_spots
  const soft=[...(picked.fear||[])];
  if((picked.value||[]).includes("面子")) soft.push("把体面看得比真实重");
  if(extSens>70) soft.push("过度在意外部评价");

  // 张力点：自述 vs 行为
  const flags=[];
  const selfIndep = /独立|一个人|自己扛|不麻烦/.test(a.self_description||"") || (picked.trait||[]).includes("独立");
  const behDepend = q4==="family"||q4==="love"||answers["SH-Q09"]?.value==="B";
  if(selfIndep && behDepend)
    flags.push({type:"self_report_vs_behavior",
      detail:"你强调独立，但真正做决定时，仍在等某个人的脸色或确认。",
      note:"『我应该独立』与真实的关系需要之间有裂缝——Persona 应将此作为核心冲突。"});
  if((picked.value||[]).includes("面子") && answers["SH-Q07"]?.value==="B")
    flags.push({type:"value_conflict",
      detail:"你说更想做真实的自己，可下意识护住的却是面子。",
      note:"影子可在 pivotal 年用一次『丢脸但真实』的选择，试探这道裂缝。"});

  const durs=Object.entries(answers).map(([id,v])=>[id,v.durationMs]).sort((a,b)=>b[1]-a[1]);

  return {
    session_id:"preview-"+Date.now().toString(36),
    raw:{
      choice_text:a.choice||null,
      self_description:a.self_description||null,
      one_liner:a.one_liner||null,
      selected_tags:tags.map(t=>t.label),
    },
    temporal:{birth_year:a.birth_year||null, fork_year:a.fork_year||null, age_at_fork:a.age??null},
    scenario_weights,
    persona_signals:{
      core_traits:(picked.trait||[]).slice(0,4),
      archetype:arche||null,
      decision_tendency:dt,
      soft_spots:soft,
      growth_seed: persist>70 ? "学会区分『我想要』和『我以为我应该想要』"
                 : "学会在该停下时停下，而不总是再试一次",
      defense_mechanism:{A:"overwork",B:"self_blame",C:"suppression",D:"external_regulation"}[answers["SH-Q03"]?.value]||null,
    },
    baseline:{initial_mood, initial_esteem},
    tension_flags:flags,
    meta:{
      longest_dwell_question:durs[0]?.[0]||null,
      scenario_detected:det.top,
      scenario_confidence:+det.conf.toFixed(2),
      answered:Object.keys(answers).length,
    },
  };
}
