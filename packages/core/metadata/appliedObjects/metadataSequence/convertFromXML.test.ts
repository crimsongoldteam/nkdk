import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { mockContextFromXML } from "~/tests/mockContext"
import { readSequenceYAML } from "./__fixtures__/sync/data"
import { MetadataSequenceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataSequence", () => {
  const inputDir = join(import.meta.dirname, "__fixtures__/sync/xml")
  const outputDir = join(import.meta.dirname, "__fixtures__/sync/out")
  const name = "ПоследовательностьВсеПоля"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("читает Sequence из XML и записывает Свойства.yaml в outputDir", async () => {
    await convertAppliedObjectFromXML({
      rule: MetadataSequenceRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "Свойства.yaml"), "utf-8")).toBe(readSequenceYAML)
  })
})
