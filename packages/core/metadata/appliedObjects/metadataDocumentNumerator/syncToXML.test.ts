import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { mockContextToXML } from "~/tests/mockContext"
import { MetadataDocumentNumeratorRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataDocumentNumerator", () => {
  const fixturesDir = join(import.meta.dirname, "__fixtures__/sync")
  const inputDir = join(fixturesDir, "nkdk")
  const referenceDir = join(fixturesDir, "xml")
  const outputDir = join(fixturesDir, "out")
  const name = "НумераторПоУмолчанию"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("читает DocumentNumerator из YAML и записывает XML в outputDir", async () => {
    await syncAppliedObjectToXML({
      rule: MetadataDocumentNumeratorRules,
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
