from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "samples" / "evidence-packs"
GREEN = colors.HexColor("#0B6B57")
INK = colors.HexColor("#17201D")
MUTED = colors.HexColor("#64706B")
SOFT = colors.HexColor("#F3F0E8")
BORDER = colors.HexColor("#DDDCD5")
ERROR = colors.HexColor("#B42318")


def build_pdf(path: Path, eyebrow: str, title: str, subtitle: str, rows: list[tuple[str, str]], note: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=24 * mm,
        leftMargin=24 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=title,
        author="ProofFlow development fixtures",
    )
    small = ParagraphStyle("small", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=GREEN, spaceAfter=8)
    heading = ParagraphStyle("heading", fontName="Helvetica-Bold", fontSize=24, leading=28, textColor=INK, spaceAfter=6)
    body = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=15, textColor=MUTED)
    label = ParagraphStyle("label", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=MUTED)
    value = ParagraphStyle("value", fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=INK)
    warning = ParagraphStyle("warning", fontName="Helvetica-Bold", fontSize=9, leading=14, textColor=ERROR)

    story = [
        Paragraph(eyebrow.upper(), small),
        Paragraph(title, heading),
        Paragraph(subtitle, body),
        Spacer(1, 12 * mm),
    ]
    table_data = [[Paragraph(label_text, label), Paragraph(value_text, value)] for label_text, value_text in rows]
    table = Table(table_data, colWidths=[52 * mm, 105 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.6, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 0), (0, -1), SOFT),
            ]
        )
    )
    story.extend([table, Spacer(1, 9 * mm), Paragraph(note, warning), Spacer(1, 18 * mm)])
    story.append(Paragraph("FICTIONAL DEVELOPMENT RECORD - NOT A REAL ORDER, DELIVERY, INVOICE, OR FINANCIAL CLAIM", small))
    doc.build(story)


def main():
    valid = OUTPUT / "valid"
    duplicate = OUTPUT / "duplicate"
    mismatch = OUTPUT / "mismatch"
    valid.mkdir(parents=True, exist_ok=True)
    duplicate.mkdir(parents=True, exist_ok=True)

    build_pdf(
        valid / "purchase-order.pdf",
        "Ndlovu Office Supplies",
        "Purchase Order PO-8841",
        "Purchase order issued for workplace equipment supply.",
        [
            ("Buyer", "Ubuntu Retail Group"),
            ("Supplier", "Ndlovu Office Supplies"),
            ("Issue date", "2026-08-20"),
            ("Currency", "ZAR"),
            ("Order total", "R 48,750.25"),
        ],
        "Fictional development fixture. Values are not payable.",
    )
    build_pdf(
        valid / "delivery-evidence.pdf",
        "Ndlovu Office Supplies",
        "Delivery Record PO-8841",
        "Delivery recorded against the referenced purchase order.",
        [
            ("Delivered to", "Ubuntu Retail Group"),
            ("Supplier", "Ndlovu Office Supplies"),
            ("Completion date", "2026-08-22"),
            ("Receiver/signature", "Present"),
        ],
        "Fictional development fixture. This is not customer confirmation.",
    )
    build_pdf(
        valid / "invoice.pdf",
        "Ndlovu Office Supplies",
        "Invoice INV-2039",
        "Invoice issued for the completed workplace equipment order.",
        [
            ("Bill to", "Ubuntu Retail Group"),
            ("Supplier", "Ndlovu Office Supplies"),
            ("PO reference", "PO-8841"),
            ("Invoice date", "2026-08-22"),
            ("Due date", "2026-10-21"),
            ("Currency", "ZAR"),
            ("Subtotal", "42,391.52"),
            ("Tax", "6,358.73"),
            ("Invoice total", "48,750.25"),
        ],
        "Fictional development fixture. This is not a financial claim.",
    )
    for name in ("purchase-order.pdf", "delivery-evidence.pdf", "invoice.pdf"):
        (duplicate / name).write_bytes((valid / name).read_bytes())

    build_pdf(
        mismatch / "purchase-order.pdf",
        "ProofFlow mismatch pack",
        "Purchase Order PO-9001",
        "A deliberately inconsistent fictional transaction for explainable rule testing.",
        [
            ("Buyer", "Ubuntu Retail Group"),
            ("Supplier", "Ndlovu Office Supplies"),
            ("Issue date", "2026-09-01"),
            ("Currency", "ZAR"),
            ("Order total", "R 48,750.00"),
        ],
        "Expected comparison: the invoice uses a different buyer, PO reference, currency, amount, and impossible date order.",
    )
    build_pdf(
        mismatch / "delivery-evidence.pdf",
        "ProofFlow mismatch pack",
        "Delivery Evidence PO-9001",
        "Fictional delivery evidence with no receiver signature recorded.",
        [
            ("Delivered to", "Ubuntu Retail Group"),
            ("Supplier", "Ndlovu Office Supplies"),
            ("Completion date", "2026-09-05"),
            ("Receiver/signature", "Not present"),
        ],
        "Expected comparison: delivery occurs after the invoice date and V011 requires review because receipt/signature evidence is absent.",
    )
    build_pdf(
        mismatch / "invoice.pdf",
        "ProofFlow mismatch pack",
        "Invoice INV-9001",
        "A deliberately contradictory fictional invoice. Values are not payable.",
        [
            ("Bill to", "Ubuntu Retail Holdings"),
            ("Supplier", "Ndlovu Office Supplies"),
            ("PO reference", "PO-9002"),
            ("Invoice date", "2026-08-30"),
            ("Due date", "2026-10-30"),
            ("Currency", "USD"),
            ("Subtotal", "45,000.00"),
            ("Tax", "6,750.00"),
            ("Invoice total", "52,000.00"),
        ],
        "Expected comparison: buyer, PO, currency, totals, arithmetic, PO date, and delivery date checks fail.",
    )


if __name__ == "__main__":
    main()
