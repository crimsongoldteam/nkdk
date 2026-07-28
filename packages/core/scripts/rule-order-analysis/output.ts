import { createWriteStream } from "node:fs"
import { mkdir, readdir, writeFile } from "node:fs/promises"
import { once } from "node:events"
import { join } from "node:path"
import type { AnalyzeRuleOrderResult } from "../../metadata/ruleOrderAnalysis/analyze"
import type { RuleOrderObservation } from "../../metadata/ruleOrderAnalysis/types"
import { renderRuleOrderConflictsJson, renderRuleOrderReportMarkdown } from "./render"

export interface RuleOrderOutput {
  accept(observation: RuleOrderObservation): Promise<void>
  complete(result: AnalyzeRuleOrderResult): Promise<void>
  fail(cause: unknown): Promise<void>
}

export async function createRuleOrderOutput(outputDir: string): Promise<RuleOrderOutput> {
  try {
    await mkdir(outputDir)
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code !== "EEXIST") throw caught
    if ((await readdir(outputDir)).length > 0) throw new Error(`Каталог результата не пуст: ${outputDir}`)
  }
  const stream = createWriteStream(join(outputDir, "observations.jsonl"), { flags: "wx", encoding: "utf8" })
  await once(stream, "open")
  let closed = false

  async function close(): Promise<void> {
    if (closed) return
    closed = true
    stream.end()
    await once(stream, "close")
  }

  return {
    async accept(observation) {
      if (!stream.write(`${JSON.stringify(observation)}\n`)) await once(stream, "drain")
    },
    async complete(result) {
      await close()
      await writeFile(join(outputDir, "conflicts.json"), renderRuleOrderConflictsJson(result), { flag: "wx" })
      await writeFile(join(outputDir, "report.md"), renderRuleOrderReportMarkdown(result), { flag: "wx" })
    },
    async fail(cause) {
      await close()
      const message = cause instanceof Error ? cause.message : String(cause)
      await writeFile(
        join(outputDir, "incomplete.json"),
        `${JSON.stringify({ status: "incomplete", message }, null, 2)}\n`,
        {
          flag: "wx",
        }
      )
    },
  }
}
