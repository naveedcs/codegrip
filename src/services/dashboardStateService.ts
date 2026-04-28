import { readFile, stat } from "fs/promises";
import * as path from "path";

import { readCurrentGitDiff } from "./gitService";
import { getAgentRuleFileStatuses } from "./syncService";
import type { TemplateService } from "./templateService";
import { getWorkspaceInfo } from "./workspaceService";
import { analyzeGitDiff } from "./riskAnalyzer";
import { loadRiskRules } from "./ruleService";
import type { AgentTarget } from "./promptBuilder";
import type {
  DashboardChecklistItem,
  DashboardDiffRisk,
  DashboardNotice,
  DashboardState,
  DashboardStatus
} from "../webview/messageTypes";

type DashboardStateInput = {
  readonly currentTask: string;
  readonly target: AgentTarget;
  readonly templateService: TemplateService;
  readonly notice?: DashboardNotice;
};

const coreReadinessFiles = [
  {
    label: "Protocol",
    path: ".codegrip/agent-protocol.md"
  },
  {
    label: "Architecture",
    path: ".codegrip/architecture.md"
  },
  {
    label: "Conventions",
    path: ".codegrip/conventions.md"
  },
  {
    label: "Risk rules",
    path: ".codegrip/risk-rules.json"
  }
] as const;

export async function buildDashboardState(
  input: DashboardStateInput
): Promise<DashboardState> {
  const workspaceInfo = await getWorkspaceInfo();

  if (!workspaceInfo) {
    return {
      currentTask: input.currentTask,
      target: input.target,
      systemReadiness: [],
      agentFiles: [],
      diffRisk: {
        state: "unavailable",
        message: "Open a workspace folder to use CodeGrip.",
        topFindings: []
      },
      notice: input.notice
    };
  }

  const [systemReadiness, agentFiles, diffRisk] = await Promise.all([
    buildSystemReadiness(workspaceInfo.fsPath),
    buildAgentFileStatus(workspaceInfo.fsPath, input.templateService),
    buildDiffRisk(workspaceInfo.fsPath, input.templateService)
  ]);
  const initialized = systemReadiness.every((item) => item.status !== "missing");

  return {
    currentTask: input.currentTask,
    target: input.target,
    workspace: {
      name: workspaceInfo.name,
      fsPath: workspaceInfo.fsPath,
      isWritable: workspaceInfo.isWritable,
      isGitRepo: workspaceInfo.isGitRepo,
      initialized
    },
    systemReadiness,
    diffRisk,
    agentFiles,
    notice: input.notice
  };
}

async function buildSystemReadiness(
  workspaceRoot: string
): Promise<readonly DashboardChecklistItem[]> {
  return Promise.all(
    coreReadinessFiles.map(async (file) => {
      const content = await readOptionalFile(workspaceRoot, file.path);

      if (content === undefined) {
        return createChecklistItem(file.label, file.path, "missing", "Missing");
      }

      if (needsDetail(file.path, content)) {
        return createChecklistItem(
          file.label,
          file.path,
          "needs-detail",
          "Needs detail"
        );
      }

      return createChecklistItem(file.label, file.path, "ready", "Ready");
    })
  );
}

async function buildAgentFileStatus(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<readonly DashboardChecklistItem[]> {
  const statuses = await getAgentRuleFileStatuses(workspaceRoot, templateService);

  return statuses.map((status) => {
    if (status.state === "missing") {
      return createChecklistItem(status.label, status.path, "missing", "Missing");
    }

    if (status.state === "out-of-sync") {
      return createChecklistItem(
        status.label,
        status.path,
        "warning",
        "Out of sync"
      );
    }

    return createChecklistItem(status.label, status.path, "ready", "Synced");
  });
}

async function buildDiffRisk(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<DashboardDiffRisk> {
  let snapshot: Awaited<ReturnType<typeof readCurrentGitDiff>>;

  try {
    snapshot = await readCurrentGitDiff(workspaceRoot);
  } catch (error) {
    return {
      state: "error",
      message: `Git diff read failed: ${formatUnknownError(error)}`,
      topFindings: []
    };
  }

  if (!snapshot.isGitRepo) {
    return {
      state: "unavailable",
      message: "No Git repository detected.",
      topFindings: []
    };
  }

  if (snapshot.changedFiles.length === 0) {
    return {
      state: "clean",
      message: "No current Git diff.",
      changedFileCount: 0,
      additions: 0,
      deletions: 0,
      topFindings: []
    };
  }

  try {
    const rules = await loadRiskRules(workspaceRoot, templateService);
    const review = analyzeGitDiff(snapshot, rules);

    return {
      state: "reviewed",
      message: `${capitalize(review.riskScore)} risk across ${review.changedFileCount} changed files.`,
      riskScore: review.riskScore,
      changedFileCount: review.changedFileCount,
      additions: review.additions,
      deletions: review.deletions,
      testsChanged: review.testsChanged,
      matchingTestsChanged: review.matchingTestsChanged,
      findingCount: review.findings.length,
      topFindings: review.findings.slice(0, 3).map((finding) => finding.title)
    };
  } catch (error) {
    return {
      state: "error",
      message: `Risk rules could not be loaded: ${formatUnknownError(error)}`,
      changedFileCount: snapshot.changedFiles.length,
      additions: snapshot.additions,
      deletions: snapshot.deletions,
      topFindings: []
    };
  }
}

async function readOptionalFile(
  workspaceRoot: string,
  relativePath: string
): Promise<string | undefined> {
  const fsPath = path.join(workspaceRoot, relativePath);

  try {
    await stat(fsPath);
    return await readFile(fsPath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) {
      return undefined;
    }

    throw error;
  }
}

function createChecklistItem(
  label: string,
  filePath: string,
  status: DashboardStatus,
  detail: string
): DashboardChecklistItem {
  return {
    label,
    path: filePath,
    status,
    detail
  };
}

function needsDetail(filePath: string, content: string): boolean {
  if (filePath.endsWith("risk-rules.json")) {
    return content.trim().length === 0;
  }

  if (filePath.endsWith("agent-protocol.md")) {
    return content.trim().length === 0;
  }

  return (
    content.trim().length === 0 ||
    content.includes("Use this file to capture") ||
    content.includes("- Application entry points:") ||
    content.includes("- Follow existing naming")
  );
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: string }).code === "ENOENT"
  );
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
