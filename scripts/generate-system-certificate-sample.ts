import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateSystemVerificationCertificate } from "../src/lib/integrations/system-certificate";

async function main() {
  const outputDirectory = path.resolve("output", "pdf");
  const outputFile = path.join(
    outputDirectory,
    "ProofFlow-System-Verification-Demo.pdf",
  );

  await mkdir(outputDirectory, { recursive: true });
  const bytes = await generateSystemVerificationCertificate({
    verificationId: "c0ffee00-0000-4000-8000-000000002048",
    buyer: "Ubuntu Retail Group Demo",
    supplier: "Mokoena Catering Demo",
    purchaseOrder: "PO-2048",
    invoice: "INV-2048",
    invoiceAmount: "R 82,300.00",
    outstandingAmount: "R 82,300.00",
    expectedPaymentDate: "9 October 2026",
    retrievedAt: "5 September 2026, 14:32 SAST",
    evidenceHash: "a".repeat(64),
    checks: [
      "Buyer connection",
      "Supplier mapping",
      "Purchase order",
      "PO supplier",
      "Invoice",
      "Invoice PO reference",
      "Amount and currency",
      "Delivery receipt",
      "Outstanding status",
      "Expected payment date",
    ].map((title, index) => ({
      code: `C${String(index + 1).padStart(3, "0")}`,
      title,
      result: "pass",
    })),
    verificationUrl:
      "https://demo.proofflow.example/applications/demo/system-evidence",
  });
  await writeFile(outputFile, bytes);
  console.log(`Generated ${outputFile}`);
}

void main();
