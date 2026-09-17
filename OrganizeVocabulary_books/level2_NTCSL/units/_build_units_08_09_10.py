#!/usr/bin/env python3
"""Build curated lexicon JSON for NTCSL Level 2 Units 8, 9, and 10."""

from __future__ import annotations

import json
from collections import Counter, OrderedDict
from pathlib import Path

OUT = Path(__file__).resolve().parent
PRI = {"core": 0, "brainstorm": 1, "extended": 2}


def add(
    store: OrderedDict,
    hanzi: str,
    pinyin: str,
    pos: str,
    gloss: str,
    priority: str,
    sources: list[str],
    notes: str | None = None,
):
    if hanzi in store:
        e = store[hanzi]
        old_pri = e["priority"]
        if PRI[priority] < PRI[old_pri]:
            e["priority"] = priority
        if pinyin and (not e["pinyin"] or PRI[priority] <= PRI[old_pri]):
            e["pinyin"] = pinyin
            if pos:
                e["pos"] = pos
            if gloss:
                e["glossEn"] = gloss
        e["sources"] = list(dict.fromkeys(e["sources"] + sources))
        if notes and "notes" not in e:
            e["notes"] = notes
    else:
        e = {
            "hanzi": hanzi,
            "pinyin": pinyin,
            "pos": pos,
            "glossEn": gloss,
            "priority": priority,
            "sources": list(dict.fromkeys(sources)),
        }
        if notes:
            e["notes"] = notes
        store[hanzi] = e


def touch(store: OrderedDict, hanzi: str, sources: list[str], priority: str | None = None):
    if hanzi not in store:
        raise KeyError(f"missing entry for touch: {hanzi}")
    e = store[hanzi]
    e["sources"] = list(dict.fromkeys(e["sources"] + sources))
    if priority and PRI[priority] < PRI[e["priority"]]:
        e["priority"] = priority


def finalize(
    store: OrderedDict, self_eval: list[str], vocab_list: list[str], proper: list[str]
) -> tuple[list, dict]:
    entries = list(store.values())
    for e in entries:
        if not e["pinyin"] or not e["pos"] or not e["glossEn"]:
            raise ValueError(f"incomplete entry: {e}")
    by = Counter(e["priority"] for e in entries)
    stats = {
        "entryCount": len(entries),
        "byPriority": {
            "core": by.get("core", 0),
            "brainstorm": by.get("brainstorm", 0),
            "extended": by.get("extended", 0),
        },
        "selfEvalCount": len(self_eval),
        "vocabListCount": len(vocab_list),
        "properNounCount": len(proper),
    }
    hans = [e["hanzi"] for e in entries]
    if len(hans) != len(set(hans)):
        raise ValueError("duplicate hanzi")
    if not (100 <= len(entries) <= 150):
        raise ValueError(f"entry count out of range: {len(entries)}")
    return entries, stats


def build_unit8() -> dict:
    S: OrderedDict = OrderedDict()
    self_eval = [
        "入住",
        "预订",
        "电视",
        "手续",
        "办理",
        "护照",
        "填",
        "空调",
        "层",
        "退房",
        "把",
        "查",
        "换",
        "拖鞋",
        "网线",
        "单人间",
        "双人间",
        "可以",
        "餐厅",
        "愉快",
        "房卡",
    ]
    vocab_list = [
        "房卡",
        "双人间",
        "单人间",
        "前台",
        "餐厅",
        "网线",
        "空调",
        "电视",
        "被子",
        "吹风机",
        "拖鞋",
        "办理",
        "入住",
        "预订",
        "成",
        "填",
        "查",
        "祝",
        "手续",
        "愉快",
        "层",
        "把",
        "登记卡",
        "可以",
        "放",
        "退房",
        "红",
        "黄",
        "蓝",
        "黑",
        "白",
        "绿",
    ]
    proper = ["美善", "查理"]

    for h, py, pos, gloss, notes in [
        ("房卡", "fángkǎ", "名", "room card", None),
        ("双人间", "shuāngrénjiān", "名", "double room", None),
        ("单人间", "dānrénjiān", "名", "single room", None),
        ("前台", "qiántái", "名", "(hotel) receptionist; front desk", None),
        ("餐厅", "cāntīng", "名", "restaurant", None),
        ("网线", "wǎngxiàn", "名", "network cable", None),
        ("空调", "kōngtiáo", "名", "air conditioner", None),
        ("电视", "diànshì", "名", "television", None),
        ("被子", "bèizi", "名", "quilt", None),
        ("吹风机", "chuīfēngjī", "名", "hair dryer", "Book gloss: hair drier."),
        ("拖鞋", "tuōxié", "名", "slippers", None),
        ("办理", "bànlǐ", "动", "to handle; to process", None),
        ("入住", "rùzhù", "动", "to check in", None),
        ("预订", "yùdìng", "动", "to reserve; to book in advance", "Cover OCR yiding → yùdìng."),
        ("成", "chéng", "动", "to become; to turn into", None),
        ("填", "tián", "动", "to fill in", "OCR/list gloss 'to fill'."),
        ("查", "chá", "动", "to check", None),
        ("祝", "zhù", "动", "to wish; to express good wishes", None),
        ("手续", "shǒuxù", "名", "procedure", None),
        ("愉快", "yúkuài", "形", "happy; pleasant", None),
        ("层", "céng", "量", "floor (of a building)", None),
        ("把", "bǎ", "介", "preposition marking the disposed object (把-sentence)", None),
        ("登记卡", "dēngjì kǎ", "名", "registration card", None),
        ("可以", "kěyǐ", "能动", "can; may", None),
        ("放", "fàng", "动", "to put", None),
        ("退房", "tuìfáng", "动", "to check out", None),
        ("红", "hóng", "形", "red", None),
        ("黄", "huáng", "形", "yellow", None),
        ("蓝", "lán", "形", "blue", None),
        ("黑", "hēi", "形", "black", None),
        ("白", "bái", "形", "white", None),
        ("绿", "lǜ", "形", "green", None),
    ]:
        src = ["vocabList"]
        if h in {"办理", "入住", "预订", "单人间", "双人间", "房卡", "把"}:
            src.append("keyWords")
        if h in self_eval:
            src.append("selfEval")
        add(S, h, py, pos, gloss, "core", src, notes)

    for h, py, gloss in [
        ("美善", "Měishàn", "Meishan (character name)"),
        ("查理", "Chálǐ", "Charlie (character name)"),
    ]:
        add(S, h, py, "专有", gloss, "core", ["properNouns", "taskDemo"])

    # self-eval extras not in vocab list
    add(
        S,
        "护照",
        "hùzhào",
        "名",
        "passport",
        "core",
        ["selfEval", "wordPower", "taskDemo"],
        "On self-eval + word power + task demo; not in 生词大盘点.",
    )
    add(
        S,
        "换",
        "huàn",
        "动",
        "to change; to exchange",
        "core",
        ["selfEval", "taskDemo", "keySentences"],
        "Self-eval checklist (Vision OCR); used in 换到同一层.",
    )

    # brainstorm (hotel mind map) — unique items
    for h, py, pos, gloss, notes in [
        ("酒店", "jiǔdiàn", "名", "hotel", None),
        ("房间", "fángjiān", "名", "room", None),
        ("现金", "xiànjīn", "名", "cash", None),
        ("信用卡", "xìnyòngkǎ", "名", "credit card", None),
        ("枕头", "zhěntou", "名", "pillow", None),
        ("卫生纸", "wèishēngzhǐ", "名", "toilet paper", None),
        ("牙具", "yájù", "名", "tooth cleaners; toiletries for teeth", None),
        ("洗发水", "xǐfǎshuǐ", "名", "shampoo", None),
        ("浴液", "yùyè", "名", "shower gel", None),
        ("早餐券", "zǎocānquàn", "名", "breakfast coupon", None),
        ("柜子", "guìzi", "名", "cabinet; wardrobe", None),
        ("客房服务", "kèfáng fúwù", "名", "room service", None),
        ("送餐", "sòngcān", "动", "to deliver food", None),
        ("叫早", "jiàozǎo", "动/名", "morning call; wake-up call", None),
        ("洗衣服", "xǐ yīfu", "动", "to do laundry", None),
        ("打扫房间", "dǎsǎo fángjiān", "动", "to clean the room", None),
        ("请勿打扰", "qǐng wù dǎrǎo", "短", "Do not disturb", None),
    ]:
        add(S, h, py, pos, gloss, "brainstorm", ["brainstorm"], notes)

    for h in [
        "预订",
        "退房",
        "入住",
        "前台",
        "单人间",
        "双人间",
        "房间",
        "电视",
        "空调",
        "被子",
        "拖鞋",
        "吹风机",
        "餐厅",
        "房卡",
        "网线",
        "层",
    ]:
        touch(S, h, ["brainstorm"])

    # word power / warm-up / task demo / grammar / tasks / cultural
    for h, py, pos, gloss, src, notes in [
        ("宾馆", "bīnguǎn", "名", "hotel; guesthouse", ["tasks", "selfEval"], "Favorite-hotel survey activity."),
        ("大堂", "dàtáng", "名", "lobby", ["taskDemo"], None),
        ("服务员", "fúwùyuán", "名", "attendant; waiter/waitress", ["taskDemo"], None),
        ("名字", "míngzi", "名", "name", ["taskDemo"], None),
        ("先生", "xiānsheng", "名", "Mr.; sir", ["taskDemo"], None),
        ("电脑", "diànnǎo", "名", "computer", ["taskDemo"], None),
        ("说成", "shuōchéng", "动", "to say … as …; to mispronounce as", ["taskDemo", "keySentences", "grammar"], None),
        ("同一", "tóngyī", "形", "same", ["taskDemo", "keySentences"], None),
        ("上网", "shàngwǎng", "动", "to go online", ["taskDemo"], None),
        ("对了", "duìle", "叹", "by the way; oh yes", ["taskDemo"], None),
        ("窗帘", "chuānglián", "名", "curtain", ["grammar", "tasks"], None),
        ("粉色", "fěnsè", "名", "pink", ["grammar", "tasks"], None),
        ("床", "chuáng", "名", "bed", ["grammar", "tasks"], None),
        ("左边", "zuǒbian", "名", "left side", ["grammar"], None),
        ("换成", "huànchéng", "动", "to change into", ["grammar", "tasks"], None),
        ("放到", "fàngdào", "动", "to put onto/into", ["grammar"], None),
        ("给", "gěi", "动/介", "to give; to/for", ["grammar", "taskDemo", "tasks"], None),
        ("到", "dào", "动/介", "to arrive; to (a place)", ["grammar", "keySentences"], None),
        ("药", "yào", "名", "medicine", ["tasks"], "把药给谁 task."),
        ("大龙", "Dàlóng", "专有", "Dalong (character name)", ["tasks"], None),
        ("艾娜", "Àinà", "专有", "Aina (character name)", ["tasks"], None),
        ("张丽", "Zhāng Lì", "专有", "Zhang Li (character name)", ["tasks"], None),
        ("大卫", "Dàwèi", "专有", "David (character name)", ["tasks"], None),
        ("农家乐", "nóngjiālè", "名", "agritainment; farm stay", ["cultural"], "Cultural tip topic."),
        ("农民", "nóngmín", "名", "farmer", ["cultural"], None),
        ("放松", "fàngsōng", "动", "to relax", ["cultural"], None),
        ("自然", "zìrán", "名/形", "nature; natural", ["cultural"], None),
        ("田园", "tiányuán", "名", "countryside; pastoral", ["cultural"], None),
        ("风光", "fēngguāng", "名", "scenery", ["cultural"], None),
        ("住", "zhù", "动", "to stay; to live", ["warmUp", "brainstorm"], None),
        ("觉得", "juéde", "动", "to feel; to think", ["warmUp"], None),
        ("怎么样", "zěnmeyàng", "代", "how; how about", ["warmUp"], None),
        ("对不起", "duìbuqǐ", "动", "sorry; excuse me", ["taskDemo"], None),
        ("谢谢", "xièxie", "动", "thanks", ["taskDemo"], None),
        ("请问", "qǐngwèn", "动", "excuse me; may I ask", ["taskDemo"], None),
        ("号码", "hàomǎ", "名", "number", ["taskDemo"], "Room numbers 1015/1506/1028."),
        ("颜色", "yánsè", "名", "color", ["tasks", "grammar"], "Color words practice with 把."),
        ("处置", "chǔzhì", "动", "to dispose; to handle", ["grammar"], None),
        ("结果", "jiéguǒ", "名", "result", ["grammar"], None),
        ("强调", "qiángdiào", "动", "to emphasize", ["grammar"], None),
        ("喜欢", "xǐhuan", "动", "to like", ["tasks"], None),
        ("原因", "yuányīn", "名", "reason", ["tasks"], None),
        ("努力", "nǔlì", "形/动", "hardworking; to work hard", ["selfEval"], "Score rubric wording."),
        ("复习", "fùxí", "动", "to review", ["selfEval"], None),
        ("加油", "jiāyóu", "动", "Come on!; to make an effort", ["selfEval"], None),
        ("说", "shuō", "动", "to say; to speak", ["taskDemo", "keySentences"], None),
        ("一下儿", "yíxiàr", "数量", "a moment; briefly", ["taskDemo", "keySentences"], None),
        ("房间号", "fángjiān hào", "名", "room number", ["taskDemo"], None),
        ("中国", "Zhōngguó", "专有", "China", ["warmUp", "cultural"], None),
        ("城市", "chéngshì", "名", "city", ["cultural"], None),
        ("年轻人", "niánqīngrén", "名", "young people", ["cultural"], None),
        ("欢迎", "huānyíng", "动", "to welcome", ["cultural"], None),
        ("物品", "wùpǐn", "名", "article; item", ["tasks"], None),
    ]:
        add(S, h, py, pos, gloss, "extended", src, notes)

    # ensure key overlaps
    for h in ["护照", "房卡", "单人间", "双人间", "前台", "餐厅", "网线", "办理", "入住", "预订"]:
        touch(S, h, ["wordPower"])
    for h in ["被子", "空调", "电视", "拖鞋", "吹风机", "网线"]:
        touch(S, h, ["wordPower"])

    entries, stats = finalize(S, self_eval, vocab_list, proper)
    return {
        "meta": {
            "bookId": "ntcsl-l2",
            "bookTitleZh": "新目标汉语口语课本 2",
            "bookTitleEn": "New Target Chinese Spoken Language [2]",
            "sourcePdf": "level2_NTCSL.pdf",
            "unit": 8,
            "titleZh": "酒店入住",
            "titleEn": "Checking in a Hotel",
            "pdfPages": {"from": 161, "to": 178},
            "printPages": {"from": 143, "to": 160},
            "curatedAt": "2026-08-08",
            "notes": (
                "Lexicon harvested from unit gold blocks + brainstorm + smart extras from dialogue/tasks/cultural. "
                "OCR re-checked against page images (Vision OCR on rotated pages for self-eval/vocab). "
                "priority=core is 生词大盘点 (32) + 专有名词 (美善/查理) + 重点词语 + self-eval checklist. "
                "Corrections: 预订 yùdìng (OCR yiding); 吹风机 chuīfēngjī; 绿 (OCR grecn); "
                "self-eval includes 护照/填/换/查/层 not all on garbled OCR. "
                "Full unit range PDF 161-178 (print 143-160); cultural on p176 (农家乐)."
            ),
        },
        "objectives": {
            "topicZh": "酒店入住",
            "topicEn": "Checking in a hotel",
            "instructionalZh": "会预订房间、办理酒店入住及退房手续",
            "instructionalEn": "Students can reserve a room, check in and check out of a hotel.",
            "keyWords": ["办理", "入住", "预订", "单人间", "双人间", "房卡", "把"],
            "keySentences": [
                {"hanzi": "我们办理入住。", "pinyin": "Wǒmen bànlǐ rùzhù."},
                {
                    "hanzi": "我把“查”说成“chai”了。",
                    "pinyin": "Wǒ bǎ “chá” shuōchéng “chái” le.",
                },
                {
                    "hanzi": "您预订了两个单人间。",
                    "pinyin": "Nín yùdìngle liǎng ge dānrénjiān.",
                },
                {"hanzi": "把你的护照给我。", "pinyin": "Bǎ nǐ de hùzhào gěi wǒ."},
                {
                    "hanzi": "请您填一下儿登记卡。",
                    "pinyin": "Qǐng nín tián yíxiàr dēngjì kǎ.",
                },
                {
                    "hanzi": "能不能把我们的房间换到同一层？",
                    "pinyin": "Néng bu néng bǎ wǒmen de fángjiān huàndào tóng yì céng?",
                },
            ],
            "grammarPoints": [{"zh": "“把”字句", "en": 'The “把” sentence'}],
        },
        "taskDemo": {
            "pdfPage": 165,
            "sceneZh": "美善和查理在酒店大堂办理入住手续。",
            "sceneEn": "Meishan and Charlie are checking in at the lobby of a hotel.",
            "lines": [
                {"speaker": "美善", "hanzi": "您好，我们办理入住。"},
                {"speaker": "服务员", "hanzi": "请问您预订房间了吗？"},
                {"speaker": "查理", "hanzi": "预订了。"},
                {"speaker": "服务员", "hanzi": "请说一下儿您的名字。"},
                {"speaker": "查理", "hanzi": "Chai理。"},
                {"speaker": "服务员", "hanzi": "对不起，电脑里没有Chai理这个名字。"},
                {
                    "speaker": "查理",
                    "hanzi": "啊，对不起，是查理。我把“查”说成“chai”了。",
                },
                {"speaker": "服务员", "hanzi": "查理先生，您预订了两个单人间。"},
                {"speaker": "查理", "hanzi": "对，这是我的护照。美善，把你的护照给我。"},
                {"speaker": "服务员", "hanzi": "谢谢。请您填一下儿登记卡。"},
                {"speaker": "服务员", "hanzi": "这是您的房卡。1015和1506号房间。"},
                {"speaker": "美善", "hanzi": "能不能把我们的房间换到同一层？"},
                {"speaker": "服务员", "hanzi": "我查一下儿，1028房间可以吗？"},
                {"speaker": "美善", "hanzi": "可以，谢谢。"},
                {"speaker": "查理", "hanzi": "对了，房间里有网线吧？"},
                {"speaker": "服务员", "hanzi": "房间里有网线，可以上网。"},
                {"speaker": "查理", "hanzi": "谢谢。"},
                {"speaker": "服务员", "hanzi": "祝您愉快。"},
            ],
        },
        "grammar": [
            {
                "id": "ba-sentence",
                "titleZh": "“把”字句",
                "titleEn": 'The “把” sentence',
                "patternZh": "主语＋把＋宾语＋动词＋其他成分",
                "patternEn": "Subject + 把 + Object + Verb + other element",
                "examples": [
                    {
                        "hanzi": "我想把窗帘换成粉色。",
                        "pinyin": "Wǒ xiǎng bǎ chuānglián huànchéng fěnsè.",
                    },
                    {
                        "hanzi": "我想把床放到柜子的左边。",
                        "pinyin": "Wǒ xiǎng bǎ chuáng fàngdào guìzi de zuǒbian.",
                    },
                    {"hanzi": "把你的护照给我。", "note": "把…给…"},
                    {"hanzi": "我把“查”说成“chai”了。", "note": "把…成…"},
                    {
                        "hanzi": "能不能把我们的房间换到同一层？",
                        "note": "把…到…",
                    },
                ],
                "notes": [
                    "Emphasizes how an action disposes of something and the result.",
                    "When the main verb takes result complements 到 / 给 / 成, a 把-sentence is typically required.",
                ],
            }
        ],
        "selfEvalChecklist": self_eval,
        "entries": entries,
        "stats": stats,
    }


def build_unit9() -> dict:
    S: OrderedDict = OrderedDict()
    self_eval = [
        "炒",
        "酱油",
        "醋",
        "盐",
        "糖",
        "碗",
        "鸡蛋",
        "准备",
        "倒",
        "拿",
        "加热",
        "上来",
    ]
    vocab_list = [
        "炒",
        "煎",
        "煮",
        "蒸",
        "鸡蛋",
        "酱油",
        "醋",
        "盐",
        "糖",
        "咖喱",
        "奶酪",
        "沙拉酱",
        "锅",
        "碗",
        "盘子",
        "刀",
        "铲子",
        "微波炉",
        "帮",
        "切",
        "问题",
        "准备",
        "行",
        "步",
        "倒",
        "油",
        "加热",
        "拿",
        "端",
        "举",
        "盛",
        "上来",
        "上去",
        "下来",
        "下去",
        "出来",
        "出去",
        "进来",
        "进去",
        "回来",
        "回去",
        "过来",
        "过去",
        "起来",
    ]
    proper = ["小丽", "大龙"]

    for h, py, pos, gloss, notes in [
        ("炒", "chǎo", "动", "to stir-fry", None),
        ("煎", "jiān", "动", "to fry; to pan-fry", "OCR 'to try' → to fry."),
        ("煮", "zhǔ", "动", "to boil", None),
        ("蒸", "zhēng", "动", "to steam", None),
        ("鸡蛋", "jīdàn", "名", "egg", None),
        ("酱油", "jiàngyóu", "名", "soy sauce", None),
        ("醋", "cù", "名", "vinegar", None),
        ("盐", "yán", "名", "salt", None),
        ("糖", "táng", "名", "sugar", None),
        ("咖喱", "gālí", "名", "curry", None),
        ("奶酪", "nǎilào", "名", "cheese", None),
        ("沙拉酱", "shālàjiàng", "名", "salad dressing", None),
        ("锅", "guō", "名", "pot; wok", None),
        ("碗", "wǎn", "名", "bowl", None),
        ("盘子", "pánzi", "名", "plate", None),
        ("刀", "dāo", "名", "knife", None),
        ("铲子", "chǎnzi", "名", "spatula; scoop", "Book gloss: scoop."),
        ("微波炉", "wēibōlú", "名", "microwave oven", None),
        ("帮", "bāng", "动", "to help", None),
        ("切", "qiē", "动", "to cut; to slice", None),
        ("问题", "wèntí", "名", "question; problem", None),
        ("准备", "zhǔnbèi", "动", "to prepare", None),
        ("行", "xíng", "形", "capable; OK", None),
        ("步", "bù", "名", "step", None),
        ("倒", "dào", "动", "to pour", "Cooking sense dào (not dǎo)."),
        ("油", "yóu", "名", "oil", None),
        ("加热", "jiārè", "动", "to heat; to warm", None),
        ("拿", "ná", "动", "to hold; to take", None),
        ("端", "duān", "动", "to hold level with both hands; to carry", None),
        ("举", "jǔ", "动", "to lift; to raise", None),
        ("盛", "chéng", "动", "to fill; to ladle", None),
        ("上来", "shànglái", "趋", "to come up", None),
        ("上去", "shàngqù", "趋", "to go up", None),
        ("下来", "xiàlái", "趋", "to come down", None),
        ("下去", "xiàqù", "趋", "to go down", None),
        ("出来", "chūlái", "趋", "to come out", None),
        ("出去", "chūqù", "趋", "to go out", None),
        ("进来", "jìnlái", "趋", "to come in", None),
        ("进去", "jìnqù", "趋", "to go in", None),
        ("回来", "huílái", "趋", "to come back", None),
        ("回去", "huíqù", "趋", "to go back", None),
        ("过来", "guòlái", "趋", "to come over", None),
        ("过去", "guòqù", "趋", "to go over", None),
        ("起来", "qǐlái", "趋", "to stand up; up (directional)", None),
    ]:
        src = ["vocabList"]
        if h in {
            "炒",
            "酱油",
            "醋",
            "盐",
            "糖",
            "碗",
            "盘子",
            "拿",
            "放",
            "过来",
            "出来",
            "回来",
            "进去",
        }:
            src.append("keyWords")
        if h in self_eval:
            src.append("selfEval")
        add(S, h, py, pos, gloss, "core", src, notes)

    # key word 放 is on cover key words but not vocab list as standalone in unit 9 list
    # (放 appears in sentences 放进去). Add as core via keyWords.
    add(S, "放", "fàng", "动", "to put; to place", "core", ["keyWords", "taskDemo", "keySentences"])

    for h, py, gloss in [
        ("小丽", "Xiǎolì", "Xiaoli (character name)"),
        ("大龙", "Dàlóng", "Dalong (character name)"),
    ]:
        add(S, h, py, "专有", gloss, "core", ["properNouns", "taskDemo"])

    # brainstorm unique
    for h, py, pos, gloss, notes in [
        ("做菜", "zuò cài", "动", "to cook", None),
        ("厨具", "chújù", "名", "cooking utensils", None),
        ("调料", "tiáoliào", "名", "seasonings", None),
        ("做法", "zuòfǎ", "名", "cooking method", None),
        ("原料", "yuánliào", "名", "ingredients", None),
        ("盆", "pén", "名", "basin", None),
        ("勺子", "sháozi", "名", "spoon", "OCR 勺丁 → 勺子."),
        ("筷子", "kuàizi", "名", "chopsticks", None),
        ("烤箱", "kǎoxiāng", "名", "oven", None),
        ("菜板", "càibǎn", "名", "cutting board", None),
        ("油腻", "yóunì", "形", "oily; greasy", None),
        ("清淡", "qīngdàn", "形", "light (in flavor)", None),
        ("拌", "bàn", "动", "to mix; to toss", None),
        ("炸", "zhá", "动", "to deep-fry", None),
        ("炖", "dùn", "动", "to stew", None),
        ("烤", "kǎo", "动", "to roast; to bake", None),
        ("辣椒", "làjiāo", "名", "hot pepper; chili", None),
        ("胡椒粉", "hújiāofěn", "名", "pepper (powder)", None),
        ("芥末", "jièmo", "名", "mustard", None),
        ("鱼", "yú", "名", "fish", None),
        ("虾", "xiā", "名", "shrimp", None),
        ("鸡", "jī", "名", "chicken", None),
        ("肉", "ròu", "名", "meat", None),
        ("牛", "niú", "名", "cow; beef", None),
        ("羊", "yáng", "名", "sheep; mutton", None),
        ("猪", "zhū", "名", "pig; pork", None),
        ("葱", "cōng", "名", "green onion; scallion", None),
        ("姜", "jiāng", "名", "ginger", None),
        ("蒜", "suàn", "名", "garlic", None),
        ("白菜", "báicài", "名", "Chinese cabbage", None),
        ("香肠", "xiāngcháng", "名", "sausage", None),
    ]:
        add(S, h, py, pos, gloss, "brainstorm", ["brainstorm"], notes)

    for h in [
        "锅",
        "碗",
        "盘子",
        "铲子",
        "刀",
        "微波炉",
        "酱油",
        "醋",
        "盐",
        "糖",
        "油",
        "沙拉酱",
        "咖喱",
        "奶酪",
        "炒",
        "煎",
        "煮",
        "蒸",
    ]:
        touch(S, h, ["brainstorm"])

    for h, py, pos, gloss, src, notes in [
        ("西红柿", "xīhóngshì", "名", "tomato", ["taskDemo", "keySentences", "wordPower"], None),
        ("阿姨", "āyí", "名", "auntie; older woman", ["taskDemo", "keySentences"], None),
        ("尝尝", "chángchang", "动", "to taste; to try (food)", ["taskDemo", "keySentences"], None),
        ("没问题", "méi wèntí", "短", "no problem", ["taskDemo"], None),
        ("开始", "kāishǐ", "动", "to begin; to start", ["taskDemo"], None),
        ("第一步", "dì yī bù", "名", "the first step", ["taskDemo"], None),
        ("下一步", "xià yī bù", "名", "the next step", ["taskDemo"], None),
        ("一点儿", "yìdiǎnr", "数量", "a little", ["taskDemo"], None),
        ("买", "mǎi", "动", "to buy", ["taskDemo", "keySentences"], None),
        ("别", "bié", "副", "don't", ["taskDemo"], None),
        ("用", "yòng", "动", "to use", ["taskDemo", "tasks"], None),
        ("早", "zǎo", "副/形", "early; already", ["taskDemo"], None),
        ("请", "qǐng", "动", "to invite; please", ["taskDemo"], None),
        ("送", "sòng", "动", "to send; to deliver", ["grammar", "tasks"], None),
        ("拿来", "nálái", "动", "to bring here", ["grammar"], None),
        ("送去", "sòngqù", "动", "to send over/away", ["grammar"], None),
        ("上楼", "shàng lóu", "动", "to go upstairs", ["grammar"], None),
        ("回家", "huí jiā", "动", "to go/come home", ["grammar"], None),
        ("开来", "kāilái", "趋", "to open toward speaker / drive over", ["grammar"], None),
        ("开去", "kāiqù", "趋", "to drive away", ["grammar"], None),
        ("麻婆豆腐", "mápó dòufu", "名", "Mapo tofu", ["wordPower"], None),
        ("蔬菜沙拉", "shūcài shālà", "名", "green salad", ["wordPower"], None),
        ("咖喱鸡块", "gālí jīkuài", "名", "curry chicken", ["wordPower"], None),
        ("黑椒牛柳", "hēijiāo niúliǔ", "名", "black pepper beef fillet", ["wordPower"], "OCR Beer → beef."),
        ("三明治", "sānmíngzhì", "名", "sandwich", ["wordPower"], None),
        ("糖醋里脊", "tángcù lǐjī", "名", "sweet and sour fillet", ["wordPower"], None),
        ("生鱼片", "shēngyúpiàn", "名", "sashimi", ["wordPower"], None),
        ("寿司", "shòusī", "名", "sushi", ["wordPower"], None),
        ("炒鸡蛋", "chǎo jīdàn", "名", "stir-fried eggs", ["wordPower"], None),
        ("中国菜", "Zhōngguó cài", "名", "Chinese food/cuisine", ["objectives", "warmUp", "taskDemo"], None),
        ("饮食习惯", "yǐnshí xíguàn", "名", "dietary habits", ["objectives"], None),
        ("烹调", "pēngtiáo", "动", "to cook", ["objectives"], None),
        ("材料", "cáiliào", "名", "ingredients; materials", ["objectives"], None),
        ("狗不理", "Gǒubulǐ", "专有", "Goubuli (famous baozi brand)", ["cultural"], None),
        ("包子", "bāozi", "名", "steamed stuffed bun", ["cultural"], None),
        ("天津", "Tiānjīn", "专有", "Tianjin (city)", ["cultural"], None),
        ("狗子", "Gǒuzi", "专有", "Gouzi (person in cultural story)", ["cultural"], None),
        ("不耐烦", "bù nàifán", "形", "impatient", ["cultural"], None),
        ("催", "cuī", "动", "to urge; to hurry (someone)", ["cultural"], None),
        ("答应", "dāying", "动", "to answer; to agree", ["cultural"], None),
        ("菜单", "càidān", "名", "menu", ["tasks"], None),
        ("美食", "měishí", "名", "fine food; delicacies", ["tasks"], None),
        ("调查", "diàochá", "动", "to survey; to investigate", ["tasks"], None),
        ("食物", "shíwù", "名", "food", ["tasks"], None),
        ("含义", "hányì", "名", "meaning", ["tasks"], None),
        ("先", "xiān", "副", "first", ["tasks", "taskDemo"], None),
        ("然后", "ránhòu", "副", "then; afterwards", ["tasks"], None),
        ("再", "zài", "副", "then; again", ["taskDemo", "tasks", "keySentences"], None),
        ("快", "kuài", "形/副", "quick; quickly", ["taskDemo", "keySentences"], None),
        ("好", "hǎo", "形", "good; done (result)", ["taskDemo"], None),
        ("楼", "lóu", "名", "building; floor", ["tasks"], None),
        ("礼物", "lǐwù", "名", "gift", ["tasks"], None),
        ("公共汽车", "gōnggòng qìchē", "名", "bus", ["tasks"], None),
        ("带", "dài", "动", "to bring; to take along", ["tasks"], None),
    ]:
        add(S, h, py, pos, gloss, "extended", src, notes)

    for h in ["炒", "煎", "煮", "蒸", "酱油", "醋", "盐", "糖", "咖喱", "奶酪", "沙拉酱"]:
        touch(S, h, ["wordPower"])

    entries, stats = finalize(S, self_eval, vocab_list, proper)
    return {
        "meta": {
            "bookId": "ntcsl-l2",
            "bookTitleZh": "新目标汉语口语课本 2",
            "bookTitleEn": "New Target Chinese Spoken Language [2]",
            "sourcePdf": "level2_NTCSL.pdf",
            "unit": 9,
            "titleZh": "做中国菜",
            "titleEn": "Cooking Chinese Food",
            "pdfPages": {"from": 179, "to": 198},
            "printPages": {"from": 161, "to": 180},
            "curatedAt": "2026-08-08",
            "notes": (
                "Lexicon harvested from unit gold blocks + brainstorm + smart extras from dialogue/tasks/cultural. "
                "OCR re-checked against page images. Title confirmed 做中国菜 (not garbled OCR variants). "
                "priority=core is 生词大盘点 (44) + 专有名词 + 重点词语 + self-eval checklist. "
                "Corrections: 倒 dào 'to pour'; 煎 'to fry' (OCR try); 勺子 (OCR 勺丁); "
                "黑椒牛柳 beef (OCR Beer); directional complements POS as 趋. "
                "Full unit range PDF 179-198 (print 161-180); cultural on p197 (狗不理)."
            ),
        },
        "objectives": {
            "topicZh": "做中国菜",
            "topicEn": "Cooking Chinese food",
            "instructionalZh": "了解基本的中国菜的烹调方法，能询问和谈论做菜的材料和一个国家的饮食习惯",
            "instructionalEn": (
                "Students get to know the basic cooking methods of Chinese food; "
                "they can also ask and talk about the cooking ingredients and dietary habits in a country."
            ),
            "keyWords": [
                "炒",
                "酱油",
                "醋",
                "盐",
                "糖",
                "碗",
                "盘子",
                "拿",
                "放",
                "过来",
                "出来",
                "回来",
                "进去",
            ],
            "keySentences": [
                {"hanzi": "鸡蛋买回来了！", "pinyin": "Jīdàn mǎi huílai le!"},
                {
                    "hanzi": "快过来帮我切西红柿吧。",
                    "pinyin": "Kuài guòlái bāng wǒ qiē xīhóngshì ba.",
                },
                {"hanzi": "再把鸡蛋放进去。", "pinyin": "Zài bǎ jīdàn fàng jìnqu."},
                {
                    "hanzi": "我要端出去让阿姨尝尝。",
                    "pinyin": "Wǒ yào duān chuqu ràng āyí chángchang.",
                },
            ],
            "grammarPoints": [
                {"zh": "简单趋向补语", "en": "Simple directional complement"},
                {"zh": "复合趋向补语", "en": "Compound directional complement"},
            ],
        },
        "taskDemo": {
            "pdfPage": 185,
            "sceneZh": "小丽和大龙在做中国菜。",
            "sceneEn": "Xiaoli and Dalong are cooking Chinese food.",
            "lines": [
                {"speaker": "大龙", "hanzi": "小丽，鸡蛋买回来了！"},
                {"speaker": "小丽", "hanzi": "好啊，快过来帮我切西红柿吧。"},
                {"speaker": "大龙", "hanzi": "没问题。……切好了！"},
                {"speaker": "小丽", "hanzi": "好的，都准备好了，我们开始炒吧。"},
                {"speaker": "大龙", "hanzi": "你行吗？"},
                {
                    "speaker": "小丽",
                    "hanzi": "没问题！第一步，先倒一点儿油，加热，再把鸡蛋放进去。",
                },
                {"speaker": "大龙", "hanzi": "好，下一步呢？"},
                {"speaker": "小丽", "hanzi": "把西红柿放进去。哎呀，快拿盐来！"},
                {
                    "speaker": "大龙",
                    "hanzi": "给你。对了，只买回来了鸡蛋，没买酱油。我现在就出去买！",
                },
                {"speaker": "小丽", "hanzi": "别去了！西红柿炒鸡蛋不用酱油。"},
                {"speaker": "大龙", "hanzi": "好。"},
                {"speaker": "小丽", "hanzi": "快炒好了，把盘子拿出来吧。"},
                {"speaker": "大龙", "hanzi": "早准备好了。我要端出去请阿姨尝尝。"},
            ],
        },
        "grammar": [
            {
                "id": "simple-directional",
                "titleZh": "简单趋向补语",
                "titleEn": "Simple directional complement",
                "patternZh": "S＋V＋来/去；S＋上/下/进/出/回/过/到＋处所＋来/去",
                "patternEn": "S + V + 来/去; S + directional verb + place + 来/去",
                "examples": [
                    {"hanzi": "拿来", "pinyin": "ná lái", "note": "towards speaker"},
                    {"hanzi": "送去", "pinyin": "sòng qù", "note": "away from speaker"},
                    {"hanzi": "拿盐来", "pinyin": "ná yán lái"},
                    {"hanzi": "拿来盐", "pinyin": "ná lái yán"},
                    {"hanzi": "他进房间去了。", "pinyin": "Tā jìn fángjiān qù le."},
                    {"hanzi": "他回家来了。", "pinyin": "Tā huí jiā lái le."},
                    {"hanzi": "他上楼来了。", "pinyin": "Tā shàng lóu lái le."},
                ],
                "notes": [
                    "来 = towards speaker/topic; 去 = away from speaker/topic.",
                    "Place objects go before 来/去.",
                ],
            },
            {
                "id": "compound-directional",
                "titleZh": "复合趋向补语",
                "titleEn": "Compound directional complement",
                "patternZh": "V＋上来/上去/下来/下去/进来/进去/出来/出去/回来/回去/过来/过去/起来/开来/开去",
                "patternEn": "V + compound directional complement",
                "examples": [
                    {"hanzi": "鸡蛋买回来了！", "note": "from key sentences / task demo"},
                    {"hanzi": "再把鸡蛋放进去。", "note": "from key sentences"},
                    {"hanzi": "把盘子拿出来吧。", "note": "from task demo"},
                    {"hanzi": "我要端出去请阿姨尝尝。", "note": "from task demo"},
                ],
                "notes": [
                    "Combines a path verb (上/下/进/出/回/过/起/开) with 来/去.",
                ],
            },
        ],
        "selfEvalChecklist": self_eval,
        "entries": entries,
        "stats": stats,
    }


def build_unit10() -> dict:
    S: OrderedDict = OrderedDict()
    # 20 confirmed on rotated Vision OCR; scoring band is 18–21
    self_eval = [
        "约会",
        "网友",
        "聊天儿",
        "见面",
        "着",
        "裙子",
        "衬衫",
        "牛仔裤",
        "围巾",
        "帽子",
        "领带",
        "拿",
        "站",
        "坐",
        "播放",
        "方式",
        "杂志",
        "戴",
        "穿",
        "握",
    ]
    vocab_list = [
        "约会",
        "穿",
        "戴",
        "系",
        "靠",
        "站",
        "播放",
        "握",
        "捧",
        "着",
        "衬衫",
        "牛仔",
        "裤子",
        "T恤衫",
        "领带",
        "围巾",
        "帽子",
        "杂志",
        "玫瑰",
        "项链",
        "耳环",
        "戒指",
        "雷",
        "网友",
        "聊",
        "见面",
        "方式",
        "会……（的）",
        "按照",
        "约定",
        "中",
        "汽车",
        "原来",
        "笔",
        "牛奶",
        "钟",
        "地图",
        "花",
        "包",
        "钱包",
    ]
    proper = ["查理", "美善"]

    for h, py, pos, gloss, notes in [
        ("约会", "yuēhuì", "名/动", "date, appointment; to make an appointment", None),
        ("穿", "chuān", "动", "to wear; to put on (clothes)", None),
        ("戴", "dài", "动", "to wear (accessories, etc.)", None),
        ("系", "jì", "动", "to tie", None),
        ("靠", "kào", "动", "to lean on", None),
        ("站", "zhàn", "动", "to stand", None),
        ("播放", "bōfàng", "动", "to play (audio/video)", None),
        ("握", "wò", "动", "to hold; to grasp", None),
        ("捧", "pěng", "动", "to carry or hold in both hands", None),
        ("着", "zhe", "助", "particle for continuous state of an action", None),
        ("衬衫", "chènshān", "名", "shirt", None),
        ("牛仔", "niúzǎi", "名", "jeans; cowboy", "Often compounds as 牛仔裤."),
        ("裤子", "kùzi", "名", "trousers", "Book lists 裤（子）."),
        ("T恤衫", "T xùshān", "名", "T-shirt", "Book lists T恤（衫）."),
        ("领带", "lǐngdài", "名", "tie", None),
        ("围巾", "wéijīn", "名", "scarf", None),
        ("帽子", "màozi", "名", "hat", None),
        ("杂志", "zázhì", "名", "magazine", None),
        ("玫瑰", "méiguī", "名", "rose", None),
        ("项链", "xiàngliàn", "名", "necklace", None),
        ("耳环", "ěrhuán", "名", "earring", None),
        ("戒指", "jièzhi", "名", "ring", None),
        ("雷", "léi", "名", "thunder", None),
        ("网友", "wǎngyǒu", "名", "net friend", None),
        ("聊", "liáo", "动", "to chat", None),
        ("见面", "jiànmiàn", "动", "to meet", None),
        ("方式", "fāngshì", "名", "way; method", None),
        ("会……（的）", "huì……(de)", "能动", "will (future/possibility)", None),
        ("按照", "ànzhào", "介", "according to", None),
        ("约定", "yuēdìng", "名/动", "arrangement; to agree on", None),
        ("中", "zhōng", "名", "center; middle", None),
        ("汽车", "qìchē", "名", "automobile; motor vehicle", None),
        ("原来", "yuánlái", "副", "originally; as it turns out", None),
        ("笔", "bǐ", "名", "pen", None),
        ("牛奶", "niúnǎi", "名", "milk", None),
        ("钟", "zhōng", "名", "clock; bell", None),
        ("地图", "dìtú", "名", "map", None),
        ("花", "huā", "名", "flower", None),
        ("包", "bāo", "名", "bag", None),
        ("钱包", "qiánbāo", "名", "wallet; purse", None),
    ]:
        src = ["vocabList"]
        if h in {"约会", "网友", "见面", "方式", "穿", "戴", "按照", "原来"}:
            src.append("keyWords")
        if h in self_eval:
            src.append("selfEval")
        add(S, h, py, pos, gloss, "core", src, notes)

    for h, py, gloss in [
        ("查理", "Chálǐ", "Charlie (character name)"),
        ("美善", "Měishàn", "Meishan (character name)"),
    ]:
        add(S, h, py, "专有", gloss, "core", ["properNouns", "taskDemo"])

    # self-eval compounds / extras
    add(
        S,
        "聊天儿",
        "liáotiānr",
        "动",
        "to chat",
        "core",
        ["selfEval", "tasks"],
        "Self-eval lists 聊天儿; vocab list has 聊.",
    )
    add(
        S,
        "牛仔裤",
        "niúzǎikù",
        "名",
        "jeans",
        "core",
        ["selfEval", "taskDemo"],
        "Self-eval/task demo compound; vocab splits 牛仔 + 裤（子）.",
    )
    add(S, "坐", "zuò", "动", "to sit", "core", ["selfEval", "grammar"])
    add(S, "拿", "ná", "动", "to take; to hold", "core", ["selfEval", "brainstorm", "wordPower", "keySentences"])

    # brainstorm unique
    for h, py, pos, gloss, notes in [
        ("打扮", "dǎban", "动", "to dress up", None),
        ("穿着", "chuānzhuó", "名", "apparel; what one wears", None),
        ("配饰", "pèishì", "名", "ornamental accessories", None),
        ("场景", "chǎngjǐng", "名", "scene", None),
        ("天气", "tiānqì", "名", "weather", None),
        ("动作", "dòngzuò", "名", "action", None),
        ("衣服", "yīfu", "名", "clothes", None),
        ("裙子", "qúnzi", "名", "skirt", None),
        ("鞋", "xié", "名", "shoes", None),
        ("皮带", "pídài", "名", "belt", None),
        ("首饰", "shǒushi", "名", "jewellery", None),
        ("路边", "lùbiān", "名", "roadside", None),
        ("咖啡厅", "kāfēitīng", "名", "coffee shop", None),
        ("公园", "gōngyuán", "名", "park", None),
        ("雨", "yǔ", "名", "rain", None),
        ("雪", "xuě", "名", "snow", None),
        ("风", "fēng", "名", "wind", None),
        ("举", "jǔ", "动", "to raise", None),
    ]:
        add(S, h, py, pos, gloss, "brainstorm", ["brainstorm"], notes)

    for h in [
        "约会",
        "帽子",
        "围巾",
        "领带",
        "项链",
        "戒指",
        "耳环",
        "裤子",
        "站",
        "靠",
        "捧",
        "握",
        "戴",
        "系",
        "播放",
        "拿",
    ]:
        touch(S, h, ["brainstorm"])

    for h, py, pos, gloss, src, notes in [
        ("手表", "shǒubiǎo", "名", "watch", ["taskDemo"], None),
        ("远方", "yuǎnfāng", "名", "distance; far away", ["taskDemo"], None),
        ("焦急", "jiāojí", "形", "anxious", ["taskDemo"], None),
        ("等待", "děngdài", "动", "to wait", ["taskDemo"], None),
        ("门口", "ménkǒu", "名", "entrance; doorway", ["taskDemo"], None),
        ("网上", "wǎngshàng", "名", "online; on the internet", ["taskDemo"], None),
        ("约好", "yuēhǎo", "动", "to agree on (a time/place)", ["taskDemo"], None),
        ("白色", "báisè", "名", "white (color)", ["taskDemo"], None),
        ("蓝色", "lánsè", "名", "blue (color)", ["taskDemo"], None),
        ("短裤", "duǎnkù", "名", "shorts", ["taskDemo"], None),
        ("手中", "shǒuzhōng", "名", "in one's hand", ["taskDemo", "keySentences"], None),
        ("猜", "cāi", "动", "to guess", ["taskDemo"], None),
        ("应该", "yīnggāi", "能动", "should; ought to", ["taskDemo"], None),
        ("好好儿", "hǎohāor", "副", "carefully; properly", ["taskDemo"], None),
        ("不是……吗", "bú shì……ma", "短", "rhetorical question pattern", ["grammar", "keySentences", "taskDemo"], None),
        ("美国人", "Měiguórén", "名", "American", ["grammar"], None),
        ("华盛顿", "Huáshèngdùn", "专有", "Washington", ["grammar"], None),
        ("门", "mén", "名", "door", ["grammar"], None),
        ("开着", "kāizhe", "动", "to be open (continuous)", ["grammar"], None),
        ("昨天", "zuótiān", "名", "yesterday", ["grammar"], None),
        ("明天", "míngtiān", "名", "tomorrow", ["grammar"], None),
        ("辞典", "cídiǎn", "名", "dictionary", ["grammar"], None),
        ("窗户", "chuānghu", "名", "window", ["grammar"], None),
        ("孩子", "háizi", "名", "child", ["grammar"], None),
        ("说话", "shuōhuà", "动", "to speak; to talk", ["grammar"], None),
        ("汉字", "Hànzì", "专有", "Chinese character", ["grammar"], None),
        ("警察", "jǐngchá", "名", "police; police officer", ["tasks"], None),
        ("走失", "zǒushī", "动", "to get lost", ["tasks"], None),
        ("着急", "zháojí", "形", "worried; anxious", ["tasks"], None),
        ("情况", "qíngkuàng", "名", "situation", ["tasks"], None),
        ("假期", "jiàqī", "名", "holiday; vacation", ["tasks"], None),
        ("陪", "péi", "动", "to accompany", ["tasks"], None),
        ("爷爷", "yéye", "名", "paternal grandfather", ["tasks"], None),
        ("奶奶", "nǎinai", "名", "paternal grandmother", ["tasks"], None),
        ("上海", "Shànghǎi", "专有", "Shanghai", ["tasks"], None),
        ("相亲", "xiāngqīn", "动/名", "blind date; arranged meeting for marriage", ["cultural"], None),
        ("媒人", "méirén", "名", "matchmaker", ["cultural"], None),
        ("内向", "nèixiàng", "形", "introverted", ["cultural"], None),
        ("害羞", "hàixiū", "形", "shy", ["cultural"], None),
        ("社交", "shèjiāo", "名", "social contact", ["cultural"], None),
        ("谈婚论嫁", "tán hūn lùn jià", "短", "to talk about marriage", ["cultural"], None),
        ("开朗", "kāilǎng", "形", "outgoing; cheerful", ["cultural"], None),
        ("网络", "wǎngluò", "名", "the Internet", ["cultural"], None),
        ("过时", "guòshí", "形", "outdated", ["cultural"], None),
        ("异性", "yìxìng", "名", "opposite sex", ["cultural"], None),
        ("下午", "xiàwǔ", "名", "afternoon", ["taskDemo", "keySentences"], None),
        ("时间", "shíjiān", "名", "time", ["taskDemo"], None),
        ("知道", "zhīdào", "动", "to know", ["taskDemo"], None),
        ("来", "lái", "动", "to come", ["taskDemo", "grammar"], None),
        ("描述", "miáoshù", "动", "to describe", ["objectives"], None),
        ("衣着", "yīzhuó", "名", "clothing; attire", ["objectives"], None),
        ("状态", "zhuàngtài", "名", "state; condition", ["objectives"], None),
        ("正确", "zhèngquè", "形", "correct", ["objectives"], None),
        ("信息", "xìnxī", "名", "information", ["objectives"], None),
        ("情景", "qíngjǐng", "名", "scene; situation", ["warmUp"], None),
        ("什么样", "shénme yàng", "代", "what kind", ["warmUp"], None),
    ]:
        add(S, h, py, pos, gloss, "extended", src, notes)

    for h in [
        "靠",
        "站",
        "戴",
        "播放",
        "握",
        "捧",
        "系",
        "拿",
        "举",
        "雨",
        "雪",
        "风",
    ]:
        touch(S, h, ["wordPower"])

    entries, stats = finalize(S, self_eval, vocab_list, proper)
    return {
        "meta": {
            "bookId": "ntcsl-l2",
            "bookTitleZh": "新目标汉语口语课本 2",
            "bookTitleEn": "New Target Chinese Spoken Language [2]",
            "sourcePdf": "level2_NTCSL.pdf",
            "unit": 10,
            "titleZh": "约会",
            "titleEn": "Making an Appointment",
            "pdfPages": {"from": 199, "to": 219},
            "printPages": {"from": 181, "to": 201},
            "curatedAt": "2026-08-08",
            "notes": (
                "Lexicon harvested from unit gold blocks + brainstorm + smart extras from dialogue/tasks/cultural. "
                "OCR re-checked against page images (Vision OCR on rotated pages). "
                "priority=core is 生词大盘点 (40) + 专有名词 + 重点词语 + self-eval checklist. "
                "Unit ends at PDF 219; 221+ 词语总表 index ignored. "
                "Corrections: ornamental (OCR oramental); 牛仔裤 compound on self-eval; "
                "vocab 裤（子）/T恤（衫） normalized; 雷 'thunder' (OCR sometimes skipped). "
                "Full unit range PDF 199-219 (print 181-201); cultural on p219 (相亲)."
            ),
        },
        "objectives": {
            "topicZh": "约会",
            "topicEn": "Making an appointment",
            "instructionalZh": "能正确描述人物衣着、配饰、动作状态等信息",
            "instructionalEn": (
                "Students can correctly describe someone's clothing, ornamental accessories and actions, etc."
            ),
            "keyWords": ["约会", "网友", "见面", "方式", "穿", "戴", "按照", "原来"],
            "keySentences": [
                {"hanzi": "你怎么在这儿站着？", "pinyin": "Nǐ zěnme zài zhèr zhànzhe?"},
                {
                    "hanzi": "今天下午你不是有约会吗？",
                    "pinyin": "Jīntiān xiàwǔ nǐ bú shì yǒu yuēhuì ma?",
                },
                {
                    "hanzi": "她会穿着一件白衬衫。",
                    "pinyin": "Tā huì chuānzhe yī jiàn bái chènshān.",
                },
                {
                    "hanzi": "他手中拿着一本《汽车》杂志。",
                    "pinyin": "Tā shǒu zhōng názhe yī běn 《Qìchē》 zázhì.",
                },
            ],
            "grammarPoints": [
                {"zh": "反问句“不是……吗？”", "en": 'The rhetorical question using “不是……吗？”'},
                {"zh": "“着”表示动作的持续状态", "en": "“着” indicating the continuous state of an action"},
                {"zh": "“会”表示将来、可能", "en": "“会” indicating the future or possibility"},
            ],
        },
        "taskDemo": {
            "pdfPage": 204,
            "sceneZh": "查理站在一个公园门口，一会儿看看手表，一会儿看看远方，焦急地等待着。这时候美善来了……",
            "sceneEn": (
                "Charlie sometimes looks at his watch and sometimes looks afar, waiting anxiously "
                "at the entrance of a park. Then Meishan is coming…"
            ),
            "lines": [
                {"speaker": "查理", "hanzi": "美善！"},
                {
                    "speaker": "美善",
                    "hanzi": "查理！你怎么在这儿站着？今天下午你不是有约会吗？",
                },
                {
                    "speaker": "查理",
                    "hanzi": "是的。我要见一个网友，我们在网上聊了很长时间，约好今天在这儿见面。",
                },
                {"speaker": "美善", "hanzi": "你们在网上见过面了吗？"},
                {"speaker": "查理", "hanzi": "还没有。不过我们约好了见面的方式。"},
                {"speaker": "美善", "hanzi": "什么方式？"},
                {
                    "speaker": "查理",
                    "hanzi": "她会穿着一件白衬衫，一条牛仔短裤。",
                },
                {
                    "speaker": "美善",
                    "hanzi": "今天你穿着白色T恤衫和蓝色牛仔裤，我猜，按照你们的约定，你手中还应该拿着一本《汽车》杂志吧。",
                },
                {
                    "speaker": "查理",
                    "hanzi": "对啊，你怎么知道？我们约好了10:00见面，可是她还没来。",
                },
                {"speaker": "美善", "hanzi": "你再好好儿看看，真的没来吗？"},
                {"speaker": "查理", "hanzi": "啊？原来是你！"},
            ],
        },
        "grammar": [
            {
                "id": "rhetorical-bushima",
                "titleZh": "反问句“不是……吗？”",
                "titleEn": 'The rhetorical question using “不是……吗？”',
                "patternZh": "不是……吗？",
                "patternEn": "bú shì … ma?",
                "examples": [
                    {
                        "hanzi": "他不是美国人吗？怎么不知道华盛顿是谁？",
                        "pinyin": "Tā bú shì Měiguórén ma? Zěnme bù zhīdào Huáshèngdùn shì shéi?",
                    },
                    {
                        "hanzi": "你不是不想来吗？怎么来了？",
                        "pinyin": "Nǐ bú shì bù xiǎng lái ma? Zěnme lái le?",
                    },
                    {
                        "hanzi": "今天下午你不是有约会吗？",
                        "note": "from key sentences / task demo",
                    },
                ],
                "notes": [
                    "Rhetorical; answer is already known; used for emphasis, especially in spoken Chinese.",
                ],
            },
            {
                "id": "zhe-continuous",
                "titleZh": "“着”表示动作的持续状态",
                "titleEn": "“着” indicating the continuous state of an action",
                "patternZh": "主语＋动词＋着＋（宾语）",
                "patternEn": "Subject + Verb + 着 + (Object)",
                "examples": [
                    {"hanzi": "门开着。", "pinyin": "Mén kāizhe."},
                    {
                        "hanzi": "他穿着一件白衬衫。",
                        "pinyin": "Tā chuānzhe yī jiàn bái chènshān.",
                    },
                    {
                        "hanzi": "昨天我看见他穿着一件白衬衫。",
                        "pinyin": "Zuótiān wǒ kànjian tā chuānzhe yī jiàn bái chènshān.",
                    },
                    {
                        "hanzi": "明天我还会带着我的辞典来上课。",
                        "pinyin": "Míngtiān wǒ hái huì dàizhe wǒ de cídiǎn lái shàngkè.",
                    },
                    {"hanzi": "他没站着，他坐着呢。", "pinyin": "Tā méi zhànzhe, tā zuòzhe ne."},
                ],
                "notes": [
                    "Negation: 没＋动词＋着.",
                    "Continuous state may be past, present, or future (with time words).",
                ],
            },
            {
                "id": "hui-future-ability",
                "titleZh": "“会”表示将来、可能",
                "titleEn": "“会” indicating the future or possibility",
                "patternZh": "会＋动词；会……的",
                "patternEn": "huì + Verb; huì … de",
                "examples": [
                    {
                        "hanzi": "那个孩子会说话了。",
                        "pinyin": "Nàge háizi huì shuōhuà le.",
                        "note": "ability acquired through learning",
                    },
                    {
                        "hanzi": "我会写一些汉字，但是写得不太好。",
                        "pinyin": "Wǒ huì xiě yìxiē Hànzì, dànshì xiě de bú tài hǎo.",
                    },
                    {
                        "hanzi": "她会穿着一件白衬衫。",
                        "note": "future/possibility; from key sentences",
                    },
                    {
                        "hanzi": "下星期你会不会去上海？",
                        "note": "self-eval grammar check",
                    },
                ],
                "notes": [
                    "Two senses: learned ability; future possibility.",
                ],
            },
        ],
        "selfEvalChecklist": self_eval,
        "entries": entries,
        "stats": stats,
    }


def main():
    for name, builder in [
        ("unit-08.json", build_unit8),
        ("unit-09.json", build_unit9),
        ("unit-10.json", build_unit10),
    ]:
        data = builder()
        path = OUT / name
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        st = data["stats"]
        print(
            f"{name}: entries={st['entryCount']} core={st['byPriority']['core']} "
            f"brainstorm={st['byPriority']['brainstorm']} extended={st['byPriority']['extended']} "
            f"selfEval={st['selfEvalCount']} vocab={st['vocabListCount']} proper={st['properNounCount']}"
        )


if __name__ == "__main__":
    main()
