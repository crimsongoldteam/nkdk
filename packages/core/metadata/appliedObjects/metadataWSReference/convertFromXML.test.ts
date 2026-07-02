import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "../../orchestration/appliedObject/convertFromXML"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readWSReferenceYAML } from "./__fixtures__/sync/data"
import { MetadataWSReferenceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataWSReference", () => {
  const name = "WSСсылкаВсеСвойства"

  it("читает WSReference из XML и записывает Свойства.yaml + WSDefinition.xml", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataWSReferenceRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readWSReferenceYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const expectedDefinition = fs.readFileSync(join(inputDir, "Ext", "WSDefinition.xml"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "WSDefinition.xml"), "utf-8")).toBe(expectedDefinition)
  })

  it("копирует XSD из Ext в YAML-каталог WSReference", async () => {
    const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "sync", "xml")
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "wsreference-xsd-xml-"))
    const outputDir = fs.mkdtempSync(join(os.tmpdir(), "wsreference-xsd-yaml-"))
    const xsdContent = "<xs:schema/>"

    fs.cpSync(fixtureDir, inputDir, { recursive: true })
    fs.rmSync(join(inputDir, "Ext"), { recursive: true, force: true })
    fs.writeFileSync(join(inputDir, name, "Ext", "service.xsd"), xsdContent, "utf-8")

    await convertAppliedObjectFromXML({
      rule: MetadataWSReferenceRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "XSD", "service.xsd"), "utf-8")).toBe(xsdContent)
  })
})
