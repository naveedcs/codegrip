import * as path from "path";
import {
  Diagnostic,
  DiagnosticSeverity,
  languages,
  Range,
  Uri
} from "vscode";
import type { DiagnosticCollection } from "vscode";

import {
  buildRiskDiagnosticData,
  type RiskDiagnosticSeverity
} from "./diagnosticModel";
import type { RiskReview } from "./riskAnalyzer";

export class CodeGripDiagnosticService {
  private readonly collection: DiagnosticCollection =
    languages.createDiagnosticCollection("codegrip");

  public applyReview(workspaceRoot: string, review: RiskReview): number {
    this.collection.clear();

    const diagnosticsByFile = new Map<string, Diagnostic[]>();

    for (const item of buildRiskDiagnosticData(review)) {
      const fsPath = path.join(workspaceRoot, item.file);
      const diagnostics = diagnosticsByFile.get(fsPath) ?? [];
      diagnostics.push(toDiagnostic(item));
      diagnosticsByFile.set(fsPath, diagnostics);
    }

    for (const [fsPath, diagnostics] of diagnosticsByFile) {
      this.collection.set(Uri.file(fsPath), diagnostics);
    }

    return [...diagnosticsByFile.values()].reduce(
      (count, diagnostics) => count + diagnostics.length,
      0
    );
  }

  public clear(): void {
    this.collection.clear();
  }

  public dispose(): void {
    this.collection.dispose();
  }
}

function toDiagnostic(input: {
  readonly line: number;
  readonly severity: RiskDiagnosticSeverity;
  readonly message: string;
  readonly code: string;
}): Diagnostic {
  const diagnostic = new Diagnostic(
    new Range(input.line, 0, input.line, 1),
    input.message,
    mapDiagnosticSeverity(input.severity)
  );

  diagnostic.source = "CodeGrip";
  diagnostic.code = input.code;

  return diagnostic;
}

function mapDiagnosticSeverity(
  severity: RiskDiagnosticSeverity
): DiagnosticSeverity {
  if (severity === "error") {
    return DiagnosticSeverity.Error;
  }

  if (severity === "warning") {
    return DiagnosticSeverity.Warning;
  }

  if (severity === "hint") {
    return DiagnosticSeverity.Hint;
  }

  return DiagnosticSeverity.Information;
}
