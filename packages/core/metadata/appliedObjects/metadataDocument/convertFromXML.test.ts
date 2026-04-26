import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { mockContextFromXML } from "~/tests/mockContext"
import { MetadataDocumentRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDocument", () => {
  const inputDir = join(import.meta.dirname, "__fixtures__/sync")
  const outputDir = join(import.meta.dirname, "__fixtures__/sync/out")
  const name = "ДокументВсеСвойства"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("читает Document из XML и записывает Свойства.yaml в outputDir", async () => {
    await convertAppliedObjectFromXML({
      rule: MetadataDocumentRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    const yamlPath = join(outputDir, name, "Свойства.yaml")
    expect(fs.existsSync(yamlPath)).toBe(true)
    const yamlContent = fs.readFileSync(yamlPath, "utf-8")
    expect(yamlContent).toContain("Проведение: Разрешить")
  })
})
