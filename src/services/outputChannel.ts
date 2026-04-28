import { window } from "vscode";

export function createOutputChannel() {
  return window.createOutputChannel("CodeGrip");
}
