import { randomBytes } from "crypto";
import type { OutputChannel, Uri, WebviewView, WebviewViewProvider } from "vscode";
import { commands, window } from "vscode";

import { generatePromptFromTask } from "../commands/generatePrompt";
import {
  initializeRepo,
  writeInitializeRepoSummary
} from "../services/initializeRepoService";
import { buildDashboardState } from "../services/dashboardStateService";
import { PerformanceTracker } from "../services/performanceTracker";
import type { AgentTarget } from "../services/promptBuilder";
import { isAgentTarget } from "../services/promptBuilder";
import {
  syncAgentRuleFiles,
  writeAgentRuleSyncSummary
} from "../services/syncService";
import type { TemplateService } from "../services/templateService";
import { getWorkspaceInfo } from "../services/workspaceService";
import { getDashboardHtml } from "./dashboardHtml";
import type { DashboardMessage, DashboardNotice } from "./messageTypes";

export class DashboardProvider implements WebviewViewProvider {
  public static readonly viewType = "codegrip.dashboard";

  private currentTask = "";
  private target: AgentTarget = "Codex";
  private notice: DashboardNotice | undefined;
  private webviewView: WebviewView | undefined;

  public constructor(
    private readonly extensionUri: Uri,
    private readonly output: OutputChannel,
    private readonly performanceTracker: PerformanceTracker,
    private readonly templateService: TemplateService
  ) {}

  public resolveWebviewView(webviewView: WebviewView): void {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    const messageSubscription = webviewView.webview.onDidReceiveMessage(
      (message: unknown) => {
        void this.handleMessage(message);
      }
    );
    webviewView.onDidDispose(() => {
      messageSubscription.dispose();
      this.webviewView = undefined;
    });

    void this.render();
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!isDashboardMessage(message)) {
      return;
    }

    this.updateLocalInputState(message);

    switch (message.type) {
      case "ready":
        return;
      case "refresh":
        this.notice = undefined;
        await this.render();
        return;
      case "initializeRepo":
        await this.initializeRepoFromDashboard();
        await this.render();
        return;
      case "generatePrompt":
        await this.generatePromptFromDashboard();
        await this.render();
        return;
      case "reviewDiff":
        await commands.executeCommand("codegrip.reviewDiff");
        this.notice = {
          level: "info",
          text: "Diff review refreshed."
        };
        await this.render();
        return;
      case "openReviewDetails":
        await commands.executeCommand("codegrip.reviewDiff");
        await commands.executeCommand("codegrip.openReviewDetails");
        return;
      case "syncRules":
        await this.syncRulesFromDashboard();
        await this.render();
        return;
    }
  }

  private updateLocalInputState(message: DashboardMessage): void {
    if ("task" in message && typeof message.task === "string") {
      this.currentTask = message.task;
    }

    if (
      "target" in message &&
      typeof message.target === "string" &&
      isAgentTarget(message.target)
    ) {
      this.target = message.target;
    }
  }

  private async render(): Promise<void> {
    if (!this.webviewView) {
      return;
    }

    const timer = PerformanceTracker.start("dashboard render");
    const state = await buildDashboardState({
      currentTask: this.currentTask,
      target: this.target,
      templateService: this.templateService,
      notice: this.notice
    });

    this.webviewView.webview.html = getDashboardHtml({
      state,
      nonce: createNonce(),
      cspSource: this.webviewView.webview.cspSource
    });
    this.performanceTracker.record(timer);
  }

  private async initializeRepoFromDashboard(): Promise<void> {
    const workspaceInfo = await getWorkspaceInfo();

    if (!workspaceInfo) {
      this.notice = {
        level: "error",
        text: "Open a workspace folder before initializing CodeGrip."
      };
      window.showErrorMessage(
        "CodeGrip needs an open workspace folder before it can initialize repo files."
      );
      return;
    }

    if (!workspaceInfo.isWritable) {
      this.notice = {
        level: "error",
        text: `${workspaceInfo.name} is not writable.`
      };
      window.showErrorMessage(
        `CodeGrip cannot initialize ${workspaceInfo.name} because the workspace is not writable.`
      );
      return;
    }

    if (!workspaceInfo.isGitRepo) {
      window.showWarningMessage(
        "CodeGrip did not detect Git metadata. It will create local files, but diff review needs a Git repo."
      );
    }

    const result = await this.performanceTracker.trackCommand(
      "codegrip.dashboard.initializeRepo",
      async () => initializeRepo(workspaceInfo, this.templateService)
    );
    writeInitializeRepoSummary(this.output, result);

    const createdCount = result.files.filter(
      (file) => file.status === "created"
    ).length;
    const updatedCount = result.files.filter(
      (file) => file.status === "updated"
    ).length;
    const skippedCount = result.files.filter(
      (file) => file.status === "skipped"
    ).length;

    this.notice = {
      level: "info",
      text: `Initialized ${result.workspaceName}: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped.`
    };
    window.showInformationMessage(
      `CodeGrip initialized ${result.workspaceName}: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped.`
    );
  }

  private async generatePromptFromDashboard(): Promise<void> {
    const task = this.currentTask.trim();

    if (task.length === 0) {
      this.notice = {
        level: "warning",
        text: "Enter a task before generating a prompt."
      };
      return;
    }

    const workspaceInfo = await getWorkspaceInfo();

    if (!workspaceInfo) {
      this.notice = {
        level: "error",
        text: "Open a workspace folder before generating a prompt."
      };
      window.showErrorMessage(
        "CodeGrip needs an open workspace folder before it can generate a prompt."
      );
      return;
    }

    try {
      const result = await this.performanceTracker.trackCommand(
        "codegrip.dashboard.generatePrompt",
        async () =>
          generatePromptFromTask({
            output: this.output,
            templateService: this.templateService,
            workspaceInfo,
            task,
            target: this.target
          })
      );

      this.notice = {
        level: "info",
        text: `Generated a ${result.target} prompt and copied it to the clipboard.`
      };
      window.showInformationMessage(
        `CodeGrip generated a ${result.target} prompt and copied it to the clipboard.`
      );
    } catch (error) {
      const message = formatUnknownError(error);
      this.notice = {
        level: "error",
        text: `Prompt generation failed: ${message}`
      };
      this.output.show(true);
      this.output.appendLine("");
      this.output.appendLine("CodeGrip prompt generation failed");
      this.output.appendLine("=================================");
      this.output.appendLine(message);
      window.showErrorMessage(`CodeGrip could not generate a prompt: ${message}`);
    }
  }

  private async syncRulesFromDashboard(): Promise<void> {
    const workspaceInfo = await getWorkspaceInfo();

    if (!workspaceInfo) {
      this.notice = {
        level: "error",
        text: "Open a workspace folder before syncing agent rules."
      };
      window.showErrorMessage(
        "CodeGrip needs an open workspace folder before it can sync agent rules."
      );
      return;
    }

    if (!workspaceInfo.isWritable) {
      this.notice = {
        level: "error",
        text: `${workspaceInfo.name} is not writable.`
      };
      window.showErrorMessage(
        `CodeGrip cannot sync agent rules for ${workspaceInfo.name} because the workspace is not writable.`
      );
      return;
    }

    const result = await this.performanceTracker.trackCommand(
      "codegrip.dashboard.syncRules",
      async () => syncAgentRuleFiles(workspaceInfo, this.templateService)
    );
    writeAgentRuleSyncSummary(this.output, result);

    const updatedCount = result.files.filter(
      (file) => file.status === "updated"
    ).length;
    const createdCount = result.files.filter(
      (file) => file.status === "created"
    ).length;

    this.notice = {
      level: "info",
      text: `Synced agent rules: ${createdCount} created, ${updatedCount} updated.`
    };
    window.showInformationMessage(
      `CodeGrip synced agent rules: ${createdCount} created, ${updatedCount} updated.`
    );
  }
}

function isDashboardMessage(value: unknown): value is DashboardMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { readonly type?: unknown }).type === "string"
  );
}

function createNonce(): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = randomBytes(24);

  return [...values]
    .map((value) => alphabet[value % alphabet.length])
    .join("");
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
