import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type SystemCertificateData = {
  verificationId: string;
  buyer: string;
  supplier: string;
  purchaseOrder: string;
  invoice: string;
  invoiceAmount: string;
  outstandingAmount: string;
  expectedPaymentDate: string;
  retrievedAt: string;
  evidenceHash: string;
  checks: Array<{ code: string; title: string; result: string }>;
  verificationUrl: string;
};
const green = rgb(11 / 255, 107 / 255, 87 / 255),
  ink = rgb(23 / 255, 32 / 255, 29 / 255),
  muted = rgb(100 / 255, 112 / 255, 107 / 255),
  soft = rgb(243 / 255, 240 / 255, 232 / 255),
  white = rgb(1, 1, 1);

export async function generateSystemVerificationCertificate(
  data: SystemCertificateData,
) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(
    `ProofFlow System Verification Certificate ${data.verificationId}`,
  );
  pdf.setAuthor("ProofFlow");
  pdf.setSubject("Customer system evidence verification");
  const page = pdf.addPage([595.28, 841.89]),
    regular = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
    color: white,
  });
  page.drawRectangle({ x: 0, y: 765, width: 595.28, height: 77, color: green });
  page.drawText("PROOFFLOW", {
    x: 42,
    y: 807,
    size: 16,
    font: bold,
    color: white,
  });
  page.drawText("SYSTEM VERIFICATION CERTIFICATE", {
    x: 42,
    y: 785,
    size: 10,
    font: bold,
    color: rgb(0.76, 0.9, 0.85),
  });
  page.drawText("CUSTOMER SYSTEM", {
    x: 462,
    y: 797,
    size: 8,
    font: bold,
    color: white,
  });
  page.drawText("Customer-system verification complete", {
    x: 42,
    y: 724,
    size: 23,
    font: bold,
    color: ink,
  });
  page.drawText(`Verification ID: ${data.verificationId}`, {
    x: 42,
    y: 704,
    size: 8.5,
    font: regular,
    color: muted,
  });
  let y = 665;
  label(page, bold, "VERIFIED TRANSACTION", y);
  y -= 21;
  const rows = [
    ["Buyer", data.buyer],
    ["Supplier", data.supplier],
    ["Purchase order", data.purchaseOrder],
    ["Invoice", data.invoice],
    ["Invoice amount", data.invoiceAmount],
    ["Outstanding amount", data.outstandingAmount],
    ["Expected payment date", data.expectedPaymentDate],
  ];
  rows.forEach(([key, value], index) => {
    const rowY = y - index * 27;
    if (index % 2 === 0)
      page.drawRectangle({
        x: 42,
        y: rowY - 7,
        width: 511,
        height: 25,
        color: soft,
      });
    page.drawText(key, { x: 52, y: rowY, size: 8.5, font: bold, color: muted });
    page.drawText(fit(value, bold, 9.5, 335), {
      x: 207,
      y: rowY,
      size: 9.5,
      font: bold,
      color: ink,
    });
  });
  y -= rows.length * 27 + 11;
  label(page, bold, "CUSTOMER RECORD CHECKS", y);
  y -= 23;
  data.checks.forEach((check, index) => {
    const column = index % 2,
      row = Math.floor(index / 2),
      x = 42 + column * 255,
      checkY = y - row * 25;
    page.drawCircle({ x: x + 6, y: checkY + 4, size: 6, color: green });
    page.drawText("+", {
      x: x + 3.1,
      y: checkY + 1,
      size: 7,
      font: bold,
      color: white,
    });
    page.drawText(fit(`${check.code} ${check.title}`, regular, 8.7, 222), {
      x: x + 18,
      y: checkY,
      size: 8.7,
      font: regular,
      color: ink,
    });
  });
  y -= 145;
  label(page, bold, "AUDIT REFERENCE", y);
  y -= 22;
  page.drawRectangle({ x: 42, y: y - 75, width: 511, height: 84, color: soft });
  pair(page, bold, regular, "Source", "Customer system", 55, y - 13);
  pair(page, bold, regular, "Retrieved", data.retrievedAt, 55, y - 35);
  pair(page, bold, regular, "Evidence hash", data.evidenceHash, 55, y - 57);
  y -= 96;
  page.drawRectangle({
    x: 42,
    y: y - 43,
    width: 511,
    height: 51,
    borderColor: rgb(0.79, 0.8, 0.77),
    borderWidth: 0.7,
  });
  page.drawText("VERIFY INSIDE PROOFFLOW", {
    x: 53,
    y: y - 11,
    size: 7.5,
    font: bold,
    color: green,
  });
  page.drawText(fit(data.verificationUrl, regular, 8, 486), {
    x: 53,
    y: y - 28,
    size: 8,
    font: regular,
    color: ink,
  });
  page.drawText(
    "No person signed this certificate. It records evidence retrieved from Customer system and deterministic ProofFlow checks.",
    { x: 42, y: 61, size: 7.7, font: bold, color: ink },
  );
  wrap(
    page,
    "This certificate records evidence verification and does not constitute a guarantee of payment or funding approval.",
    42,
    44,
    511,
    7.8,
    10,
    regular,
    muted,
  );
  return pdf.save();
}
function label(page: PDFPage, font: PDFFont, text: string, y: number) {
  page.drawText(text, { x: 42, y, size: 8, font, color: green });
  page.drawLine({
    start: { x: 190, y: y + 3 },
    end: { x: 553, y: y + 3 },
    color: rgb(0.84, 0.84, 0.81),
    thickness: 0.7,
  });
}
function pair(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  key: string,
  value: string,
  x: number,
  y: number,
) {
  page.drawText(key, { x, y, size: 7.5, font: bold, color: muted });
  page.drawText(fit(value, regular, 8.8, 390), {
    x: x + 78,
    y,
    size: 8.8,
    font: regular,
    color: ink,
  });
}
function fit(text: string, font: PDFFont, size: number, width: number) {
  let value = text;
  while (value.length > 5 && font.widthOfTextAtSize(value, size) > width)
    value = value.slice(0, -2);
  return value === text ? text : `${value}...`;
}
function wrap(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  lineHeight: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
) {
  let line = "";
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > width) {
      page.drawText(line, { x, y, size, font, color });
      y -= lineHeight;
      line = word;
    } else line = candidate;
  }
  if (line) page.drawText(line, { x, y, size, font, color });
}
