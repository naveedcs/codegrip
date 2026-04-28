import { readFile } from "fs/promises";
import * as path from "path";

import type { TemplateService } from "./templateService";
import type { RiskSeverity } from "../types/findings";
import type { RiskRule } from "../types/rules";

type RiskRulesContent = {
  readonly content: string;
  readonly source: string;
};

const riskRulesRelativePath = ".codegrip/risk-rules.json";

export async function loadRiskRules(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<readonly RiskRule[]> {
  const riskRulesContent = await readRiskRulesContent(
    workspaceRoot,
    templateService
  );
  let parsed: unknown;

  try {
    parsed = JSON.parse(riskRulesContent.content);
  } catch (error) {
    throw new Error(
      `Malformed JSON in ${riskRulesContent.source}: ${formatJsonError(error)}`
    );
  }

  return validateRiskRulesFile(parsed, riskRulesContent.source);
}

async function readRiskRulesContent(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<RiskRulesContent> {
  try {
    return {
      content: await readFile(
        path.join(workspaceRoot, riskRulesRelativePath),
        "utf8"
      ),
      source: riskRulesRelativePath
    };
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }

    return {
      content: await templateService.read("risk-rules.json"),
      source: "default risk-rules.json template"
    };
  }
}

function validateRiskRulesFile(
  value: unknown,
  source: string
): readonly RiskRule[] {
  if (!isObject(value)) {
    throw createSchemaError(source, "expected a top-level object.");
  }

  if (!Array.isArray(value.rules)) {
    throw createSchemaError(source, "expected a top-level rules array.");
  }

  return value.rules.map((rule, index) =>
    validateRiskRule(rule, source, `rules[${index}]`)
  );
}

function validateRiskRule(
  value: unknown,
  source: string,
  location: string
): RiskRule {
  if (!isObject(value)) {
    throw createSchemaError(source, `${location} must be an object.`);
  }

  const severity = value.severity;

  if (!isRiskSeverity(severity)) {
    throw createSchemaError(
      source,
      `${location}.severity must be one of low, medium, high, or critical.`
    );
  }

  return {
    id: readStringField(value, "id", source, location),
    title: readStringField(value, "title", source, location),
    severity,
    matchPaths: readStringArrayField(value, "matchPaths", source, location),
    message: readStringField(value, "message", source, location),
    suggestedAction: readOptionalStringField(
      value,
      "suggestedAction",
      source,
      location
    ),
    requireTests: readOptionalBooleanField(
      value,
      "requireTests",
      source,
      location
    )
  };
}

function isRiskSeverity(value: unknown): value is RiskSeverity {
  return (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  );
}

function readStringField(
  value: Record<string, unknown>,
  field: string,
  source: string,
  location: string
): string {
  const fieldValue = value[field];

  if (typeof fieldValue !== "string" || fieldValue.trim().length === 0) {
    throw createSchemaError(source, `${location}.${field} must be a string.`);
  }

  return fieldValue;
}

function readStringArrayField(
  value: Record<string, unknown>,
  field: string,
  source: string,
  location: string
): readonly string[] {
  const fieldValue = value[field];

  if (
    !Array.isArray(fieldValue) ||
    fieldValue.length === 0 ||
    !fieldValue.every((item) => typeof item === "string")
  ) {
    throw createSchemaError(
      source,
      `${location}.${field} must contain at least one string.`
    );
  }

  return fieldValue;
}

function readOptionalStringField(
  value: Record<string, unknown>,
  field: string,
  source: string,
  location: string
): string | undefined {
  const fieldValue = value[field];

  if (fieldValue === undefined) {
    return undefined;
  }

  if (typeof fieldValue !== "string") {
    throw createSchemaError(source, `${location}.${field} must be a string.`);
  }

  return fieldValue;
}

function readOptionalBooleanField(
  value: Record<string, unknown>,
  field: string,
  source: string,
  location: string
): boolean | undefined {
  const fieldValue = value[field];

  if (fieldValue === undefined) {
    return undefined;
  }

  if (typeof fieldValue !== "boolean") {
    throw createSchemaError(source, `${location}.${field} must be a boolean.`);
  }

  return fieldValue;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
