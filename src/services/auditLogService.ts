import type {
  AcceptedFindingEntry,
  DecisionLogEntry
} from "./reviewWorkflowService";
import type { AuditLogExport } from "../types/auditLog";
import { auditLogExportSchemaVersion } from "../types/auditLog";

export type BuildAuditLogExportInput = {
  readonly workspaceName: string;
  readonly exportedAt?: Date;
  readonly decisions: readonly DecisionLogEntry[];
  readonly acceptedFindings: readonly AcceptedFindingEntry[];
};

export function buildAuditLogExport(
  input: BuildAuditLogExportInput
): AuditLogExport {
  return {
    schemaVersion: auditLogExportSchemaVersion,
    workspaceName: input.workspaceName,
    exportedAt: (input.exportedAt ?? new Date()).toISOString(),
    decisions: input.decisions.map((decision) => ({
      task: decision.task,
      decision: decision.decision,
      reason: decision.reason,
      verification: decision.verification,
      createdAt: decision.createdAt.toISOString()
    })),
    acceptedFindings: input.acceptedFindings.map((entry) => ({
      finding: entry.finding,
      task: entry.task,
      note: entry.note,
      createdAt: entry.createdAt.toISOString()
    }))
  };
}

export function formatAuditLogExport(exportData: AuditLogExport): string {
  return `${JSON.stringify(exportData, null, 2)}\n`;
}
