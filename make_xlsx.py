from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.drawing.image import Image as XLImage
import os

FONT = "Arial"
HEAD_FILL = PatternFill("solid", fgColor="2F5496")
HEAD_FONT = Font(name=FONT, bold=True, color="FFFFFF", size=11)
TITLE_FONT = Font(name=FONT, bold=True, size=16, color="1F3864")
SUB_FONT = Font(name=FONT, italic=True, size=10, color="595959")
CELL_FONT = Font(name=FONT, size=10)
BOLD = Font(name=FONT, size=10, bold=True)
ALT_FILL = PatternFill("solid", fgColor="EAF1FB")
TOTAL_FILL = PatternFill("solid", fgColor="FCE4D6")
thin = Side(style="thin", color="BFBFBF")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(horizontal="left", vertical="top", wrap_text=True)
CTR = Alignment(horizontal="center", vertical="center", wrap_text=True)

wb = Workbook()

# ---------------- Sheet 1: 总览 ----------------
ws = wb.active
ws.title = "素材包总览"

ws["A1"] = "像素游戏素材包 — 深度解析总览"
ws["A1"].font = TITLE_FONT
ws.merge_cells("A1:N1")
ws["A2"] = "共 8 个压缩包  |  解析日期 2026-06-11  |  全部已解压并按目录统计"
ws["A2"].font = SUB_FONT
ws.merge_cells("A2:N2")

headers = ["序号","示例图","原始文件名","素材主题 / 出品方","素材类型","文件总数","其中图片数",
           "解压大小","主要格式","像素规格","适用引擎 / 用途","授权许可","内容概要","备注"]
hrow = 4
ws.append([])  # row3 spacer
ws.append(headers)
for c in range(1, len(headers)+1):
    cell = ws.cell(row=hrow, column=c)
    cell.font = HEAD_FONT; cell.fill = HEAD_FILL; cell.alignment = CTR; cell.border = BORDER

rows = [
 [1,"Modern_Interiors_Free_v2.2.zip","Modern Interiors 现代室内（LimeZu 免费版）","室内地图图块 + 角色",66,64,"1.3 MB","PNG",
  "16/32/48 px 三套","通用 / RPG Maker MV","免费版：仅限非商用，禁止商用与转售",
  "现代室内 Tileset 与 Room Builder（16/32/48 三种分辨率）；4 个角色 Adam/Alex/Bob/Amelia，含 idle/run/sit/phone 动作帧；含 overview 预览图","完整版需付费，本包约为完整版的 1%"],
 [2,"室内像素风格地图场景图块元素游戏素材.zip","Pixel Interiors 室内图块","室内地图图块",1,1,"56 KB","PNG",
  "约 675×672 整图","通用 Tileset","未附带许可说明","单张室内场景图块集（家具/墙地/装饰元素拼合表）","仅一张拼合图，需自行切片"],
 [3,"小型室内场景16×16 Tileset像素游戏贴图素材.zip","小型室内 16×16 Tileset","室内地图图块",1,1,"12 KB","PNG",
  "320×320（16px 网格）","通用 Tileset","未附带许可说明","小型室内场景 16×16 图块集，单张拼合表","体量极小，适合做小 demo"],
 [4,"场景+道具+技能+头像+装备+像素小人-999张.zip","i43 像素画大全集（多来源合集）","综合素材合集",999,991,"326 MB","PNG + GIF(89)",
  "尺寸不一（含超大人设图）","通用 / 临摹参考","来源混杂，多为网络搜集，商用需谨慎核实",
  "场景部件 389 / 角色动作 286 / 人设大图 140 / 头像 73 / 像素小人 45 / megapont 俄国画家 33 / 道具技能 21 / 武器装备 12；含多张动图 GIF","素材来源杂、版权不清，建议仅作学习参考"],
 [5,"农场生活.zip","SUNNYSIDE World 农场生活（Daniel Diggle）","农场模拟 全套",553,528,"16 MB","PNG + GIF + Aseprite + PSD",
  "Tileset 1024×1024 等","通用（农场/牧场模拟）","随包格式，商用前请核对官方授权",
  "8 个子包：地图 Tileset、建筑、角色及部件（按 26 种动作拆分）、农作物、哥布林、烟囱炊烟、UI（9-slice）；含 aseprite/psd 源文件","唯一含可编辑源文件的包，质量高、可二次创作"],
 [6,"GuttyKreum_CleanCityv3.zip","Clean City v3 现代城市（GuttyKreum）","城市地图图块",908,907,"4.5 MB","PNG + GIF",
  "16×16 切片","通用 / RPG Maker MV / VX Ace","作者免费/商用资源（以作者页面为准）",
  "Tiles 单块切片 600；动画块 240（旗帜/喷泉/树）；RPG Maker MV 31、VX Ace 31；整图 Tilemap 2；含示例图与预览 GIF","与第 7 包内容重复（同一作者）"],
 [7,"RPG像素现代城市地图游戏场景素材.zip","Clean City + Halloween2019（GuttyKreum）","城市图块 + 节日道具",953,952,"1.4 MB(压缩)","PNG + Aseprite",
  "16×16 切片","通用 / RPG Maker","作者免费/商用资源（以作者页面为准）",
  "内含两个子 zip：① Clean City v3（同第 6 包）；② Halloween2019 万圣节 45 个：蜡烛、南瓜灯×2、女巫（含/不含帽）动画帧 + aseprite 源文件","Clean City 部分与第 6 包重复，额外多出万圣节包"],
 [8,"人物行走图素材(XP)(2937个).rar","RPG Maker XP 行走图大全（萌芽游戏社整理）","角色行走图 Sprite",3080,3038,"47 MB","PNG + BMP + GIF",
  "128×192（RMXP 4 向×3 帧）","RPG Maker XP","网络整理合集，版权来源不一",
  "约 2937 张行走图，含 30+ 主题子目录：月姬 203、幻想水浒传2 441、KM 科技风 152、梦幻迷宫 147、动物怪物 117、3DRM 98 等；涵盖古代/现代/科幻/交通工具/稀有 NPC/死人图/宝箱/骑马骑飞龙","号称现时最全行走图库；含 GBK 编码素材说明.txt"],
]
for r in rows:
    r2 = [r[0], None] + r[1:]   # insert placeholder for 示例图 column
    ws.append(r2)

first_data = hrow+1
last_data = first_data + len(rows) - 1
for i, r in enumerate(range(first_data, last_data+1)):
    for c in range(1, len(headers)+1):
        cell = ws.cell(row=r, column=c)
        cell.font = CELL_FONT; cell.border = BORDER
        cell.alignment = CTR if c in (1,2,6,7,8,9,10) else WRAP
    if i % 2 == 1:
        for c in range(1, len(headers)+1):
            ws.cell(row=r, column=c).fill = ALT_FILL
    ws.row_dimensions[r].height = 124   # tall rows to fit example images

# embed example thumbnails into column B (示例图)
thumb_dir = os.path.join(os.path.dirname(__file__), "thumbs")
for idx in range(len(rows)):
    p = os.path.join(thumb_dir, f"thumb{idx+1}.png")
    if os.path.exists(p):
        img = XLImage(p)
        ws.add_image(img, f"B{first_data+idx}")

# total row
trow = last_data + 1
ws.cell(row=trow, column=1, value="合计")
ws.merge_cells(start_row=trow, start_column=1, end_row=trow, end_column=5)
ws.cell(row=trow, column=6, value=f"=SUM(F{first_data}:F{last_data})")
ws.cell(row=trow, column=7, value=f"=SUM(G{first_data}:G{last_data})")
ws.cell(row=trow, column=14, value="约 5500+ 个图片文件（含跨包重复）")
ws.merge_cells(start_row=trow, start_column=8, end_row=trow, end_column=13)
for c in range(1, len(headers)+1):
    cell = ws.cell(row=trow, column=c)
    cell.font = BOLD; cell.fill = TOTAL_FILL; cell.border = BORDER
    cell.alignment = CTR if c in (1,6,7) else WRAP

widths = [5,24,40,30,16,9,9,11,16,16,20,26,52,30]
for i,w in enumerate(widths, start=1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = "A5"
ws.row_dimensions[1].height = 24

# ---------------- Sheet 2: 分类明细 ----------------
ws2 = wb.create_sheet("分类明细")
ws2["A1"] = "各素材包目录级分类明细"
ws2["A1"].font = TITLE_FONT
ws2.merge_cells("A1:F1")
h2 = ["所属素材包","分类目录 / 子包","内容描述","文件数","主要格式","规格 / 备注"]
ws2.append([])
ws2.append(h2)
for c in range(1, len(h2)+1):
    cell = ws2.cell(row=3, column=c)
    cell.font = HEAD_FONT; cell.fill = HEAD_FILL; cell.alignment = CTR; cell.border = BORDER

detail = [
 ["① Modern Interiors","Interiors_free (16/32/48)","现代室内地图 Tileset + Room Builder 拼接表","12","PNG","各 16/32/48 px 三套"],
 ["① Modern Interiors","Characters_free","Adam/Alex/Bob/Amelia 4 角色，含 idle/run/sit/phone 动作","32","PNG","16×16，行走图布局"],
 ["① Modern Interiors","Old / RPGMAKERMV","旧版 Tileset 与 RPG Maker MV 角色表","20","PNG","16/32/48 px"],
 ["② Pixel Interiors","Interior.png","单张室内图块拼合表","1","PNG","≈675×672"],
 ["③ 小型室内 16×16","16X16.png","小型室内 16×16 图块表","1","PNG","320×320"],
 ["④ i43 大全集","场景","场景部件（含 40 个 GIF 动图）","389","PNG/GIF","尺寸不一"],
 ["④ i43 大全集","角色动作","角色动作序列（含 31 个 GIF）","286","PNG/GIF","尺寸不一"],
 ["④ i43 大全集","人设","角色设定大图（部分超大，如 1470×8200）","140","PNG/GIF","超大拼合图"],
 ["④ i43 大全集","头像","角色头像","73","PNG","约 968×1076 等"],
 ["④ i43 大全集","像素小人","小尺寸像素角色","45","PNG","约 128×192"],
 ["④ i43 大全集","megapont 俄国像素画家","名家像素作品集","33","PNG/GIF","尺寸不一"],
 ["④ i43 大全集","道具、技能","道具与技能图标 / 特效","21","PNG","约 192×864 等"],
 ["④ i43 大全集","武器装备","武器装备图","12","PNG/GIF","约 384×596"],
 ["⑤ SUNNYSIDE 农场","ASSETS_V0.2","地图 Tileset / 场景 / 角色总表","4","PNG","Tileset 1024×1024"],
 ["⑤ SUNNYSIDE 农场","BUILDINGS_V0.01","建筑物","3","PNG","约 640×640"],
 ["⑤ SUNNYSIDE 农场","CHARACTERS_V0.3.1","角色动画（base/skeleton/dust_fx，含 GIF 与源文件）","144","PNG/GIF/aseprite","含 _SOURCE 源文件"],
 ["⑤ SUNNYSIDE 农场","CHARACTERS_PARTS_V0.3.1","角色部件，按 26 种动作拆分（IDLE/ATTACK/MINING/SWIMMING 等）","162","PNG/PSD","可分层换装"],
 ["⑤ SUNNYSIDE 农场","CROPS_V0.01","农作物","79","PNG","生长阶段帧"],
 ["⑤ SUNNYSIDE 农场","GOBLIN_V0.1","哥布林敌人（PNG + GIF 两套）","41","PNG/GIF","动画"],
 ["⑤ SUNNYSIDE 农场","UI_V1.0","界面 UI（含 9-slice 弹窗）","103","PNG","UI 套件"],
 ["⑤ SUNNYSIDE 农场","CHIMNEYSMOKE_v1.0","烟囱炊烟动画","12","PNG/GIF","动画帧"],
 ["⑥ Clean City v3","Tiles","16×16 单块地图切片","600","PNG","16×16"],
 ["⑥ Clean City v3","AnimatedTiles","动画块：旗帜 / 喷泉(四向) / 树","240","PNG","逐帧动画"],
 ["⑥ Clean City v3","RPGMakerMV","RPG Maker MV 格式图块","31","PNG","MV 规格"],
 ["⑥ Clean City v3","RPGMakerVXAce","RPG Maker VX Ace 格式图块","31","PNG","VX Ace 规格"],
 ["⑥ Clean City v3","Tilemap / Example","整图与示例图、预览 GIF","6","PNG/GIF","640×416 等"],
 ["⑦ RPG 现代城市","CleanCityv3（子 zip）","同第 ⑥ 包全部内容","908","PNG/GIF","16×16（重复）"],
 ["⑦ RPG 现代城市","Halloween2019（子 zip）","万圣节：蜡烛/南瓜灯×2/女巫，含 aseprite 源文件","45","PNG/aseprite","逐帧动画 + 源文件"],
 ["⑧ XP 行走图","幻想水浒传2","主题行走图","441","PNG","128×192"],
 ["⑧ XP 行走图","月姬","主题行走图","203","PNG","128×192"],
 ["⑧ XP 行走图","KM 科技风格","科幻风行走图","152","PNG","128×192"],
 ["⑧ XP 行走图","梦幻迷宫","主题行走图","147","PNG","128×192"],
 ["⑧ XP 行走图","动物怪物","动物与怪物","117","PNG","128×192"],
 ["⑧ XP 行走图","3DRM","3D 风格行走图","98","PNG","128×192"],
 ["⑧ XP 行走图","物品 / 门 / 大地图","物品、门、大地图事件","69","PNG","杂项"],
 ["⑧ XP 行走图","DM / 远征奥德赛2 / 骑马相关","主题行走图（含骑马骑龙乘车）","163","PNG","128×192"],
 ["⑧ XP 行走图","其他主题（QQ堂/魔法师/学生/圣斗士/死人/贵族…）","30+ 主题，含稀有 NPC、死人图等","约 460","PNG/BMP","古/今/科幻全覆盖"],
 ["⑧ XP 行走图","Characters 根目录散图","RTP 风格行走图等大量散图","1258","PNG","128×192"],
]
for r in detail:
    ws2.append(r)

fd2 = 4
ld2 = fd2 + len(detail) - 1
for i, r in enumerate(range(fd2, ld2+1)):
    for c in range(1, len(h2)+1):
        cell = ws2.cell(row=r, column=c)
        cell.font = CELL_FONT; cell.border = BORDER
        cell.alignment = CTR if c in (4,) else WRAP
    if i % 2 == 1:
        for c in range(1, len(h2)+1):
            ws2.cell(row=r, column=c).fill = ALT_FILL

w2 = [20,34,46,9,18,22]
for i,w in enumerate(w2, start=1):
    ws2.column_dimensions[get_column_letter(i)].width = w
ws2.freeze_panes = "A4"
ws2.row_dimensions[1].height = 24

wb.save("/Users/chenzhiwei/Documents/shadow/像素素材包解析.xlsx")
print("saved")
