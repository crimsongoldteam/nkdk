import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { mockContextToXML } from "~/tests/mockContext"
import { MetadataSequenceRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataSequence", () => {
  const fixturesDir = join(import.meta.dirname, "__fixtures__/sync")
  const inputDir = join(fixturesDir, "nkdk")
  const referenceDir = join(fixturesDir, "xml")
  const outputDir = join(fixturesDir, "out")
  const name = "ПоследовательностьВсеПоля"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("читает Sequence из YAML и записывает XML в outputDir", async () => {
    await syncAppliedObjectToXML({
      rule: MetadataSequenceRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
    })

    const expectedXML = fs.readFileSync(join(referenceDir, `${name}.xml`), "utf-8")
    const resultXML = fs.readFileSync(join(outputDir, `${name}.xml`), "utf-8")

    expect(resultXML).toBe(expectedXML)
  })
})
