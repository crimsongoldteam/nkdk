import { mkdtemp, readFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createRuleOrderOutput } from "./output"
import type { AnalyzeRuleOrderResult } from "../../metadata/ruleOrderAnalysis/analyze"

describe("rule order output", () => {
  it("writes observations and final reports", async () => {
    const parent = await mkdtemp(join(tmpdir(), "rule-order-output-"))
    const outputDir = join(parent, "report")
    const output = await createRuleOrderOutput(outputDir)
    await output.accept({
      configuration: "all",
      sourceXmlPath: "/xml/a.xml",
      logicalAddress: "A",
      xmlNodeLogicalAddress: "A",
      ruleId: "id",
      source: {
        candidate: "a/rules.ts#Rules",
        filePath: "/a/rules.ts",
        exportName: "Rules",
        propertyPath: [],
        declarationOrder: ["name", "use"],
        numericOrder: {},
      },
      itemType: "A",
      fields: ["name"],
    })
    const result: AnalyzeRuleOrderResult = {
      configurations: ["all"],
      configurationStats: [],
      assignmentCount: 1,
      xmlFileCount: 1,
      observationCount: 1,
      skippedObservationCount: 0,
      skippedItemTypes: [],
      rules: [],
      ambiguities: [],
    }
    await output.complete(result)

    expect((await readFile(join(outputDir, "observations.jsonl"), "utf8")).trim().split("\n")).toHaveLength(1)
    expect(await readdir(outputDir)).toEqual(["conflicts.json", "observations.jsonl", "report.md"])
  })
})
