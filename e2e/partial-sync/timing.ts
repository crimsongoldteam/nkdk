import { randomUUID } from "node:crypto"
import { mkdir, rename, writeFile } from "node:fs/promises"
import { join } from "node:path"

export type BlockExecutionTiming = {
  readonly blockKey: string
  readonly applyMs: number
  readonly validationMs: number
  readonly synchronizeMs: number
  readonly unchangedMs: number
  readonly checkpointMs: number
}

export type ScenarioTimingReport = {
  record(timing: BlockExecutionTiming): Promise<void>
}

export function createScenarioTimingReport(logsDir: string): ScenarioTimingReport {
  const blocks: BlockExecutionTiming[] = []
  return {
    async record(timing) {
      blocks.push(timing)
      await mkdir(logsDir, { recursive: true })
      const path = join(logsDir, "timings.json")
      const temporaryPath = `${path}.${randomUUID()}.tmp`
      await writeFile(temporaryPath, `${JSON.stringify({ version: 1, blocks }, null, 2)}\n`)
      await rename(temporaryPath, path)
    },
  }
}
