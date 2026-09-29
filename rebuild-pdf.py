# -*- coding: utf-8 -*-
"""把同目录下的 Markdown 报告重新生成 PDF。双击同目录的「重新生成PDF.bat」即可。"""
import os
import re
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, HRFlowable, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle)

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = ["行醒-产品功能与竞争力报告.md", "行醒-一页简历.md", "行醒-录屏分镜脚本.md"]

FONT, BOLD, KAI = "Song", "Hei", "Kai"
pdfmetrics.registerFont(TTFont(FONT, "C:/Windows/Fonts/simsun.ttc", subfontIndex=0))
pdfmetrics.registerFont(TTFont(BOLD, "C:/Windows/Fonts/simhei.ttf"))
pdfmetrics.registerFont(TTFont(KAI, "C:/Windows/Fonts/simkai.ttf"))
pdfmetrics.registerFontFamily(FONT, normal=FONT, bold=BOLD, italic=KAI, boldItalic=BOLD)

INK = colors.HexColor("#1F1A10")
INK_SOFT = colors.HexColor("#4A4133")
GOLD = colors.HexColor("#8B6914")
PAPER = colors.HexColor("#FAF6EC")
LINE = colors.HexColor("#DED4C2")


def st(name, **kw):
    base = dict(fontName=FONT, wordWrap="CJK", textColor=INK_SOFT)
    base.update(kw)
    fs = base.get("fontSize", 10)
    lead = base.get("leading", 1.62)
    if lead < 3:
        lead = fs * lead
    base["leading"] = round(lead, 2)
    return ParagraphStyle(name, **base)


S_TITLE = st("t", fontName=BOLD, fontSize=21, leading=1.35, textColor=INK, alignment=TA_CENTER, spaceAfter=6)
S_H2 = st("h2", fontName=BOLD, fontSize=14.5, textColor=INK, leading=1.4, spaceBefore=16, spaceAfter=7)
S_H3 = st("h3", fontName=BOLD, fontSize=11.5, textColor=GOLD, leading=1.4, spaceBefore=11, spaceAfter=5)
S_P = st("p", fontSize=10, spaceAfter=6)
S_QUOTE = st("q", fontName=KAI, fontSize=10.5, textColor=INK, leading=1.6, leftIndent=10, rightIndent=6, spaceBefore=2, spaceAfter=8)
S_LI = st("li", fontSize=10, spaceAfter=3.5, leftIndent=12, bulletIndent=2)
S_CODE = st("code", fontSize=9, leading=1.75, textColor=INK, backColor=PAPER, borderColor=LINE,
            borderWidth=0.6, borderPadding=7, leftIndent=4, rightIndent=4, spaceBefore=6, spaceAfter=8)
S_TH = st("th", fontName=BOLD, fontSize=9, textColor=INK, leading=1.4)
S_TD = st("td", fontSize=9, leading=1.45)

DROP = re.compile("[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF\u2B00-\u2BFF\uFE0F]")


def clean(t):
    return DROP.sub("", t).replace("—", "-").replace("–", "-")


def inline(t):
    t = clean(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    return re.sub(r"`(.+?)`", r'<font color="#8B6914">\1</font>', t)


def build(md_path, pdf_path, title):
    lines = open(md_path, encoding="utf-8").read().split("\n")
    story, i, in_code, buf = [], 0, False, []
    while i < len(lines):
        raw, s = lines[i].rstrip(), lines[i].strip()
        if s.startswith("```"):
            if in_code:
                esc = [clean(x).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") for x in buf]
                story.append(Paragraph("<br/>".join(esc), S_CODE))
                buf, in_code = [], False
            else:
                in_code = True
            i += 1
            continue
        if in_code:
            buf.append(raw)
            i += 1
            continue
        if s.startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            header = [c.strip() for c in s.strip("|").split("|")]
            rows, i = [], i + 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            data = [[Paragraph(inline(c), S_TH) for c in header]]
            data += [[Paragraph(inline(c), S_TD) for c in r] for r in rows]
            width = A4[0] - 3.2 * cm
            n = len(header)
            w = [0.22, 0.39, 0.39] if n == 3 else [1.0] * n
            tbl = Table(data, colWidths=[width * x / sum(w) for x in w], repeatRows=1)
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1E7D4")),
                ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story += [tbl, Spacer(1, 8)]
            continue
        if not s:
            i += 1
            continue
        if s == "---":
            story.append(HRFlowable(width="100%", thickness=0.7, color=LINE, spaceBefore=6, spaceAfter=10))
        elif s.startswith("# "):
            story.append(Paragraph(inline(s[2:]), S_TITLE))
        elif s.startswith("## "):
            story.append(Paragraph(clean(s[3:]), S_H2))
        elif s.startswith("### "):
            story.append(Paragraph(inline(s[4:]), S_H3))
        elif s.startswith("> "):
            story.append(Paragraph(inline(s[2:]), S_QUOTE))
        elif re.match(r"^[-*]\s+", s):
            story.append(Paragraph("• " + inline(re.sub(r"^[-*]\s+", "", s)), S_LI))
        elif re.match(r"^\d+\.\s+", s):
            story.append(Paragraph(inline(s), S_LI))
        else:
            story.append(Paragraph(inline(s), S_P))
        i += 1

    def deco(canv, doc):
        canv.saveState()
        canv.setFont(FONT, 8)
        canv.setFillColor(GOLD)
        canv.drawString(1.6 * cm, 1.05 * cm, title)
        canv.setFillColor(colors.HexColor("#B0A48C"))
        canv.drawRightString(A4[0] - 1.6 * cm, 1.05 * cm, "第 %d 页" % doc.page)
        canv.setStrokeColor(LINE)
        canv.setLineWidth(0.5)
        canv.line(1.6 * cm, 1.5 * cm, A4[0] - 1.6 * cm, 1.5 * cm)
        canv.restoreState()

    doc = BaseDocTemplate(pdf_path, pagesize=A4, leftMargin=1.6 * cm, rightMargin=1.6 * cm,
                          topMargin=1.5 * cm, bottomMargin=1.9 * cm, title=title, author="行醒")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=deco)])
    doc.build(story)


if __name__ == "__main__":
    done = []
    for name in SOURCES:
        md = os.path.join(HERE, name)
        if not os.path.exists(md):
            continue
        pdf = md[:-3] + ".pdf"
        try:
            build(md, pdf, name[:-3])
            done.append(name + "  ->  " + os.path.basename(pdf))
        except Exception as e:
            print("失败:", name, e)
    if done:
        print("已重新生成：")
        for d in done:
            print("  " + d)
    else:
        print("没找到可以生成的 .md 文件")
    input("按回车关闭")
