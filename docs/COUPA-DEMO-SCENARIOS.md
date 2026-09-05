# Demo Coupa scenarios

All records are synthetic. Use the bundled valid sample pack for the SME documents, then select a result under **Account -> Business connections -> Coupa** before the SME runs **Run automated verification**.

| Demo result | Demo Coupa record | Expected workflow |
| --- | --- | --- |
| Complete match | PO, mapped supplier, invoice, ZAR amount, receipt, unpaid balance, and due date match | Automated verification complete |
| Invoice missing | PO exists; invoice lookup returns no record | Buyer reviews the invoice exception |
| Amount mismatch | Supplier invoice is R82,300; Demo Coupa invoice is R79,800 | Buyer reviews the amount exception |
| Receipt missing | PO and invoice exist; no receiving transaction exists | Buyer reviews the delivery exception |
| Already paid | Demo Coupa payment status is paid with zero outstanding | Application cannot proceed |
| Coupa disconnected | Connection returns a safe unavailable code and no evidence | Existing six-question signed confirmation is requested |

The selected scenario is demo configuration, not evidence supplied by the SME. C001-C010 remain pure deterministic TypeScript comparisons. Missing records are review items, not fraud findings. Demo Coupa never approves funding.
