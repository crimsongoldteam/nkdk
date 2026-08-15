import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, it } from "vitest"
import { createScenarioTimingReport } from "./timing"

it("atomically persists accumulated block timings", async () => {
  const logsDir = await mkdtemp(join(tmpdir(), "nkdk-partial-timing-"))
  const report = createScenarioTimingReport(logsDir)

  await report.record({
    blockKey: "roots:create:bulk",
    applyMs: 10,
    validationMs: 20,
    synchronizeMs: 30,
    unchangedMs: 40,
    checkpointMs: 50,
  })

  await expect(readFile(join(logsDir, "timings.json"), "utf8")).resolves.toContain(
    '"blockKey": "roots:create:bulk"',
  )
})
