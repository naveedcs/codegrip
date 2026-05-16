import { readFile } from "fs/promises";
import * as path from "path";

import { isAgentTarget } from "./promptBuilder";
import type { TemplateService } from "./templateService";
import type { OrgTemplate } from "../types/orgTemplate";
import { orgTemplateSchemaVersion } from "../types/orgTemplate";

const orgTemplateRelativePath = ".codegrip/org-template.json";

type OrgTemplateContent = {
  readonly content: string;
  readonly source: string;
};

export async function loadOrgTemplate(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<OrgTemplate> {
  const templateContent = await readOrgTemplateContent(
    workspaceRoot,
    templateService
  );
  let parsed: unknown;

  try {
    parsed = JSON.parse(templateContent.content);
  } catch (error) {
    throw new Error(
      `Malformed JSON in ${templateContent.source}: ${formatJsonError(error)}`
    );
  }

  return validateOrgTemplate(parsed, templateContent.source);
}

async function readOrgTemplateContent(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<OrgTemplateContent> {
  try {
    return {
      content: await readFile(
        path.join(workspaceRoot, orgTemplateRelativePath),
        "utf8"
      ),
      source: orgTemplateRelativePath
    };
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }

    return {
      content: await templateService.read("org-template.json"),
      source: "default org-template.json template"
    };
  }
}

function validateOrgTemplate(value: unknown, source: string): OrgTemplate {
  if (!isObject(value)) {
    throw createSchemaError(source, "expected a top-level object.");
  }

  if (value.schemaVersion !== orgTemplateSchemaVersion) {
    throw createSchemaError(source, "schemaVersion must be 1.");
  }

  const defaultAgentTarget = value.defaultAgentTarget;

  if (
    typeof defaultAgentTarget !== "string" ||
    !isAgentTarget(defaultAgentTarget)
  ) {
    throw createSchemaError(
      source,
      "defaultAgentTarget must be Generic, Codex, Claude, Cursor, or Copilot."
    );
  }

  const reviewStrictness = value.reviewStrictness;

  if (!isOrgTemplateReviewStrictness(reviewStrictness)) {
    throw createSchemaError(
      source,
      "reviewStrictness must be lenient, standard, or strict."
    );
  }

  return {
    schemaVersion: orgTemplateSchemaVersion,
    organizationName: readStringField(value, "organizationName", source),
    defaultAgentTarget,
    reviewStrictness,
    requiredChecks: readStringArrayField(value, "requiredChecks", source),
    sensitivePaths: readStringArrayField(value, "sensitivePaths", source),
    agentInstructions: readStringArrayField(value, "agentInstructions", source)
  };
}

function readStringField(
  value: Record<string, unknown>,
  field: string,
  source: string
): string {
  const fieldValue = value[field];

  if (typeof fieldValue !== "string" || fieldValue.trim().length === 0) {
    throw createSchemaError(source, `${field} must be a non-empty string.`);
  }

  return fieldValue.trim();
}

function readStringArrayField(
  value: Record<string, unknown>,
  field: string,
  source: string
): readonly string[] {
  const fieldValue = value[field];

  if (
    !Array.isArray(fieldValue) ||
    fieldValue.length === 0 ||
    !fieldValue.every(
      (item) => typeof item === "string" && item.trim().length > 0
    )
  ) {
    throw createSchemaError(source, `${field} must contain at least one string.`);
  }

  return fieldValue.map((item) => item.trim());
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOrgTemplateReviewStrictness(
  value: unknown
): value is OrgTemplate["reviewStrictness"] {
  return value === "lenient" || value === "standard" || value === "strict";
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: string }).code === "ENOENT"
  );
}

function createSchemaError(source: string, detail: string): Error {
  return new Error(`Invalid ${source}: ${detail}`);
}

function formatJsonError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
