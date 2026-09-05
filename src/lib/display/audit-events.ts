const auditActionLabels: Record<string, string> = {
  "application.created": "Application created",
  "application.documents_uploaded": "Evidence documents uploaded",
  "application.fields_extracted": "Evidence details entered",
  "application.fields_reviewed": "SME review completed",
  "application.verification_completed": "Document checks completed",
  "application.sent_to_buyer": "Sent to large customer",
  "application.evidence_entry_started": "Evidence entry started",
  "application.evidence_entered": "Evidence details submitted",
  "buyer.confirmation_signed": "Large customer confirmation signed",
  "buyer.confirmation_disputed": "Large customer reported a difference",
  "document.extracted": "Evidence document prepared",
  "integration.coupa_checked": "Customer-system record check completed",
  "integration.exception_resolved": "Customer-system difference resolved",
  "funder.review_started": "Funder review started",
  "funder.application_declined": "Funder decision recorded",
  "funder.simulated_offer_created": "Funding proposal created",
  "sme.simulated_offer_accepted": "Funding proposal accepted",
  "sme.simulated_offer_declined": "Funding proposal declined",
  "application.simulated_funding_completed": "Funding partner confirmation recorded",
  "application.external_compliance_status_recorded": "External compliance status updated",
};

export function presentAuditAction(action: string) {
  return (
    auditActionLabels[action] ??
    action.replaceAll(".", " · ").replaceAll("_", " ")
  );
}
