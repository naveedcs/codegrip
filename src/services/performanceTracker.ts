import type { OutputChannel } from "vscode";

export type PerformanceSample = {
  readonly label: string;
  readonly durationMs: number;
  readonly recordedAt: Date;
};

type Timer = {
  readonly label: string;
  readonly start: bigint;
};

export class PerformanceTracker {
  private readonly samples: PerformanceSample[] = [];

  public constructor(private readonly output: OutputChannel) {}

  public static start(label: string): Timer {
    return {
      label,
      start: process.hrtime.bigint()
    };
  }

  public record(timer: Timer): PerformanceSample {
    const durationMs = Number(process.hrtime.bigint() - timer.start) / 1_000_000;
    const sample: PerformanceSample = {
      label: timer.label,
      durationMs,
      recordedAt: new Date()
    };

    this.samples.push(sample);
    this.output.appendLine(
      `[perf] ${sample.label}: ${sample.durationMs.toFixed(2)} ms`
    );

    return sample;
  }

  public async trackCommand<T>(
    commandName: string,
    operation: () => Promise<T> | T
  ): Promise<T> {
    const timer = PerformanceTracker.start(`command ${commandName}`);

    try {
      return await operation();
    } finally {
      this.record(timer);
    }
  }

  public printReport(): void {
    this.output.show(true);
    this.output.appendLine("");
    this.output.appendLine("CodeGrip Performance Report");
    this.output.appendLine("==========================");

    if (this.samples.length === 0) {
      this.output.appendLine("No samples recorded yet.");
      return;
    }

    for (const sample of this.samples) {
      this.output.appendLine(
        `${sample.recordedAt.toISOString()} | ${sample.label} | ${sample.durationMs.toFixed(2)} ms`
      );
    }
  }
}
