import type { Finding } from "./findings";

export const auditLogExportSchemaVersion = 1;

export type AuditLogExport = {
  readonly schemaVersion: typeof auditLogExportSchemaVersion;
  readonly workspaceName: string;
  readonly exportedAt: string;
  readonly decisions: readonly AuditDecisionEntry[];
  readonly acceptedFindings: readonly AuditAcceptedFindingEntry[];
};

export type AuditDecisionEntry = {
  readonly task: string;
  readonly decision: string;
  readonly reason: string;
  readonly verification: string;
  readonly createdAt: string;
};

export type AuditAcceptedFindingEntry = {
  readonly finding: Finding;
  readonly task?: string;
  readonly note?: string;
  readonly createdAt: string;
};
