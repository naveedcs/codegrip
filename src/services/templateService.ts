import { readFile } from "fs/promises";
import * as path from "path";
import type { Uri } from "vscode";

export type TemplateName =
  | "agent-protocol.md"
  | "architecture.md"
  | "conventions.md"
  | "risk-rules.json"
  | "org-template.json"
  | "decision-log.md"
  | "AGENTS.md"
  | "CLAUDE.md"
  | "cursor-rule.mdc"
  | "copilot-instructions.md"
  | "llm-review-prompt.md";

export class TemplateService {
  public constructor(private readonly extensionUri: Uri) {}

  public async read(templateName: TemplateName): Promise<string> {
    const templatePath = path.join(
      this.extensionUri.fsPath,
      "src",
      "templates",
      templateName
    );

    return readFile(templatePath, "utf8");
  }
}
