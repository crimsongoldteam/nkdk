import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { mockContextToXML } from "~/tests/mockContext"
import { MetadataCatalogRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataCatalog", () => {
  const fixturesDir = join(import.meta.dirname, "__fixtures__/sync")
  const inputDir = join(fixturesDir, "nkdk")
  const referenceDir = join(fixturesDir, "xml")
  const outputDir = join(fixturesDir, "out")
  const catalogName = "СправочникCоВсемиОбъектами"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("читает Catalog из YAML и записывает XML в outputDir", async () => {
    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name: catalogName,
      outputDir,
      referenceDir,
    })

    const expectedXML = fs.readFileSync(join(referenceDir, `${catalogName}.xml`), "utf-8")
    const resultXML = fs.readFileSync(join(outputDir, `${catalogName}.xml`), "utf-8")
    expect(resultXML).toBe(expectedXML)

    const expectedPredefined = fs.readFileSync(join(referenceDir, "Ext", "Predefined.xml"), "utf-8")
    const resultPredefined = fs.readFileSync(join(outputDir, "Ext", "Predefined.xml"), "utf-8")
    expect(resultPredefined).toBe(expectedPredefined)
  })
})
