import { agentTargets } from "../services/promptBuilder";
import type {
  DashboardChecklistItem,
  DashboardDiffRisk,
  DashboardNotice,
  DashboardState,
  DashboardStatus
} from "./messageTypes";

export type DashboardHtmlInput = {
  readonly state: DashboardState;
  readonly nonce: string;
  readonly cspSource: string;
};

export function getDashboardHtml(input: DashboardHtmlInput): string {
  const state = input.state;
  const hasWorkspace = state.workspace !== undefined;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${input.cspSource} 'unsafe-inline'; script-src 'nonce-${input.nonce}';"
  >
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeGrip</title>
  <style>
    :root {
      color-scheme: light dark;
    }

    * {
      box-sizing: border-box;
    }

    body {
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      margin: 0;
      padding: 12px;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    h2 {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    section {
      border-top: 1px solid var(--vscode-sideBarSectionHeader-border);
      padding: 12px 0;
    }

    textarea,
    select,
    button {
      font: inherit;
      width: 100%;
    }

    textarea,
    select {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, transparent);
      color: var(--vscode-input-foreground);
      outline-color: var(--vscode-focusBorder);
    }

    textarea {
      min-height: 74px;
      padding: 8px;
      resize: vertical;
    }

    select {
      min-height: 28px;
      padding: 4px 7px;
    }

    button {
      align-items: center;
      background: var(--vscode-button-background);
      border: 1px solid transparent;
      color: var(--vscode-button-foreground);
      cursor: pointer;
      display: inline-flex;
      justify-content: center;
      min-height: 28px;
      padding: 4px 8px;
    }

    button:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }

    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    button.secondary:hover:not(:disabled) {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    button:disabled,
    textarea:disabled,
    select:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .subtle {
      color: var(--vscode-descriptionForeground);
      line-height: 1.45;
    }

    .repo-row,
    .summary-row,
    .check-row {
      align-items: center;
      display: flex;
      gap: 8px;
      justify-content: space-between;
    }

    .repo-row {
      margin-top: 8px;
    }

    .actions {
      display: grid;
      gap: 8px;
      grid-template-columns: 1fr 1fr;
      margin-top: 8px;
    }

    .actions .wide {
      grid-column: 1 / -1;
    }

    .field-stack {
      display: grid;
      gap: 8px;
    }

    .list {
      display: grid;
      gap: 7px;
    }

    .check-row {
      min-height: 22px;
    }

    .check-label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .check-detail {
      color: var(--vscode-descriptionForeground);
      flex: 0 0 auto;
      font-size: 11px;
    }

    .dot {
      border-radius: 50%;
      flex: 0 0 auto;
      height: 7px;
      width: 7px;
    }

    .status-ready {
      background: var(--vscode-testing-iconPassed);
    }

    .status-needs-detail,
    .status-warning {
      background: var(--vscode-testing-iconQueued);
    }

    .status-missing {
      background: var(--vscode-testing-iconFailed);
    }

    .badge,
    .risk-badge {
      border: 1px solid var(--vscode-badge-background);
      border-radius: 4px;
      color: var(--vscode-badge-foreground);
      flex: 0 0 auto;
      font-size: 11px;
      line-height: 1;
      padding: 4px 6px;
    }

    .risk-low {
      border-color: var(--vscode-testing-iconPassed);
    }

    .risk-medium {
      border-color: var(--vscode-testing-iconQueued);
    }

    .risk-high,
    .risk-critical {
      border-color: var(--vscode-testing-iconFailed);
    }

    .stats {
      color: var(--vscode-descriptionForeground);
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .findings {
      color: var(--vscode-descriptionForeground);
      display: grid;
      gap: 5px;
      margin-top: 8px;
      padding-left: 16px;
    }

    .notice {
      border-left: 3px solid var(--vscode-focusBorder);
      color: var(--vscode-foreground);
      margin-top: 10px;
      padding: 6px 8px;
    }

    .notice-warning {
      border-left-color: var(--vscode-testing-iconQueued);
    }

    .notice-error {
      border-left-color: var(--vscode-testing-iconFailed);
    }
  </style>
</head>
<body>
  <header>
    <h1>CodeGrip</h1>
    ${renderWorkspaceHeader(state)}
    ${renderNotice(state.notice)}
  </header>

  <section>
    <h2>Current Task</h2>
    <div class="field-stack">
      <textarea
        id="current-task"
        placeholder="Describe the next agent task"
        ${hasWorkspace ? "" : "disabled"}
      >${escapeHtml(state.currentTask)}</textarea>
      <select id="agent-target" ${hasWorkspace ? "" : "disabled"}>
        ${renderTargetOptions(state.target)}
      </select>
    </div>
    <div class="actions">
      <button data-action="generatePrompt">Generate Prompt</button>
      <button class="secondary" data-action="reviewDiff" ${hasWorkspace ? "" : "disabled"}>Review Diff</button>
      <button class="secondary" data-action="refresh" ${hasWorkspace ? "" : "disabled"}>Refresh</button>
      <button class="secondary" data-action="syncRules" ${hasWorkspace ? "" : "disabled"}>Sync Rules</button>
      ${
        state.workspace && !state.workspace.initialized
          ? `<button class="wide" data-action="initializeRepo">Initialize Repo</button>`
          : ""
      }
    </div>
    ${
      state.currentTask.trim().length === 0
        ? '<p class="subtle" style="margin-top: 8px;">No task entered.</p>'
        : ""
    }
  </section>

  <section>
    <h2>System Readiness</h2>
    ${renderChecklist(state.systemReadiness)}
  </section>

  <section>
    <h2>Current Diff Risk</h2>
    ${renderDiffRisk(state.diffRisk)}
  </section>

  <section>
    <h2>Agent Files</h2>
    ${renderChecklist(state.agentFiles)}
  </section>

  <script nonce="${input.nonce}">
    (() => {
      const vscode = acquireVsCodeApi();
      const task = document.getElementById("current-task");
      const target = document.getElementById("agent-target");
      const generateButton = document.querySelector('[data-action="generatePrompt"]');
      const hasWorkspace = ${JSON.stringify(hasWorkspace)};

      function currentPayload(type) {
        return {
          type,
          task: task ? task.value : "",
          target: target ? target.value : "Codex"
        };
      }

      function syncButtonState() {
        if (!generateButton) {
          return;
        }

        generateButton.disabled = !hasWorkspace || !task || task.value.trim().length === 0;
      }

      document.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => {
          vscode.postMessage(currentPayload(button.dataset.action));
        });
      });

      if (task) {
        task.addEventListener("input", syncButtonState);
      }

      syncButtonState();
      vscode.postMessage({ type: "ready" });
    })();
  </script>
</body>
</html>`;
}

function renderWorkspaceHeader(state: DashboardState): string {
  if (!state.workspace) {
    return '<p class="subtle">No workspace folder open.</p>';
  }

  const status = state.workspace.initialized ? "Initialized" : "Not initialized";
  const gitStatus = state.workspace.isGitRepo ? "Git detected" : "No Git metadata";

  return `<div class="repo-row">
    <p class="subtle">Repo: ${escapeHtml(state.workspace.name)}</p>
    <span class="badge">${escapeHtml(status)}</span>
  </div>
  <p class="subtle">${escapeHtml(gitStatus)}</p>`;
}

function renderNotice(notice: DashboardNotice | undefined): string {
  if (!notice) {
    return "";
  }

  return `<p class="notice notice-${notice.level}">${escapeHtml(notice.text)}</p>`;
}

function renderTargetOptions(selectedTarget: DashboardState["target"]): string {
  return agentTargets
    .map((target) => {
      const selected = target === selectedTarget ? " selected" : "";
      return `<option value="${escapeHtml(target)}"${selected}>${escapeHtml(target)}</option>`;
    })
    .join("");
}

function renderChecklist(items: readonly DashboardChecklistItem[]): string {
  if (items.length === 0) {
    return '<p class="subtle">No workspace data.</p>';
  }

  return `<div class="list">
    ${items.map(renderChecklistItem).join("")}
  </div>`;
}

function renderChecklistItem(item: DashboardChecklistItem): string {
  return `<div class="check-row" title="${escapeHtml(item.path)}">
    <span class="dot status-${statusClass(item.status)}"></span>
    <span class="check-label">${escapeHtml(item.label)}</span>
    <span class="check-detail">${escapeHtml(item.detail)}</span>
  </div>`;
}

function renderDiffRisk(diffRisk: DashboardDiffRisk): string {
  const badge = diffRisk.riskScore
    ? `<span class="risk-badge risk-${diffRisk.riskScore}">${escapeHtml(diffRisk.riskScore)}</span>`
    : "";
  const stats =
    diffRisk.changedFileCount === undefined
      ? ""
      : `<div class="stats">
          <span>${diffRisk.changedFileCount} files</span>
          <span>+${diffRisk.additions ?? 0}</span>
          <span>-${diffRisk.deletions ?? 0}</span>
          ${renderBooleanStat("Tests", diffRisk.testsChanged)}
          ${renderBooleanStat("Matching", diffRisk.matchingTestsChanged)}
          ${renderFindingCount(diffRisk.findingCount)}
        </div>`;
  const findings =
    diffRisk.topFindings.length === 0
      ? ""
      : `<ul class="findings">
          ${diffRisk.topFindings.map((finding) => `<li>${escapeHtml(finding)}</li>`).join("")}
        </ul>`;

  return `<div class="summary-row">
    <p class="subtle">${escapeHtml(diffRisk.message)}</p>
    ${badge}
  </div>
  ${stats}
  ${findings}`;
}

function renderBooleanStat(label: string, value: boolean | undefined): string {
  if (value === undefined) {
    return "";
  }

  return `<span>${escapeHtml(label)}: ${value ? "yes" : "no"}</span>`;
}

function renderFindingCount(value: number | undefined): string {
  if (value === undefined) {
    return "";
  }

  return `<span>${value} findings</span>`;
}

function statusClass(status: DashboardStatus): string {
  return status;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}
