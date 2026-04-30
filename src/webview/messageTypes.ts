import type { AgentTarget } from "../services/promptBuilder";
import type { RiskSeverity } from "../types/findings";

export type DashboardMessage =
  | {
      readonly type: "ready";
    }
  | {
      readonly type: "refresh";
      readonly task?: string;
      readonly target?: string;
    }
  | {
      readonly type: "initializeRepo";
    }
  | {
      readonly type: "generatePrompt";
      readonly task: string;
      readonly target: string;
    }
  | {
      readonly type: "reviewDiff";
      readonly task?: string;
      readonly target?: string;
    }
  | {
      readonly type: "openReviewDetails";
      readonly task?: string;
      readonly target?: string;
    }
  | {
      readonly type: "syncRules";
      readonly task?: string;
      readonly target?: string;
    };

export type DashboardStatus = "ready" | "needs-detail" | "missing" | "warning";

export type DashboardNotice = {
  readonly level: "info" | "warning" | "error";
  readonly text: string;
};

export type DashboardChecklistItem = {
  readonly label: string;
  readonly path: string;
  readonly status: DashboardStatus;
  readonly detail: string;
};

export type DashboardDiffRisk = {
  readonly state: "unavailable" | "clean" | "reviewed" | "error";
  readonly message: string;
  readonly riskScore?: RiskSeverity;
  readonly changedFileCount?: number;
  readonly additions?: number;
  readonly deletions?: number;
  readonly binaryFileCount?: number;
  readonly diffTruncated?: boolean;
  readonly testsChanged?: boolean;
  readonly matchingTestsChanged?: boolean;
  readonly findingCount?: number;
  readonly topFindings: readonly string[];
};

export type DashboardState = {
  readonly currentTask: string;
  readonly target: AgentTarget;
  readonly workspace?: {
    readonly name: string;
    readonly fsPath: string;
    readonly isWritable: boolean;
    readonly isGitRepo: boolean;
    readonly workspaceFolderCount: number;
    readonly initialized: boolean;
  };
  readonly systemReadiness: readonly DashboardChecklistItem[];
  readonly diffRisk: DashboardDiffRisk;
  readonly agentFiles: readonly DashboardChecklistItem[];
  readonly notice?: DashboardNotice;
};
