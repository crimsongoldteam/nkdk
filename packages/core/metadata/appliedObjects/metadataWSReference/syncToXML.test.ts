import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { XmlSyncManifest } from "../configuration/migrations/xmlManifest"
import { syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { MetadataWSReferenceRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataWSReference", () => {
  it("читает WSReference из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataWSReferenceRules,
      name: "WSСсылкаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["WSСсылкаВсеСвойства.xml", "Ext/WSDefinition.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })

  it("копирует XSD из YAML-каталога WSReference в Ext", async () => {
    const name = "WSСсылкаВсеСвойства"
    const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "sync")
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "wsreference-xsd-yaml-"))
    const referenceDir = fs.mkdtempSync(join(os.tmpdir(), "wsreference-xsd-ref-"))
    const outputDir = fs.mkdtempSync(join(os.tmpdir(), "wsreference-xsd-xml-"))
    const xsdContent = "<xs:schema/>"

    fs.cpSync(join(fixtureDir, "yaml"), inputDir, { recursive: true })
    fs.cpSync(join(fixtureDir, "xml"), referenceDir, { recursive: true })
    fs.mkdirSync(join(inputDir, name, "XSD"), { recursive: true })
    fs.writeFileSync(join(inputDir, name, "XSD", "service.xsd"), xsdContent, "utf-8")
    const xmlManifest = new XmlSyncManifest(outputDir)

    await syncAppliedObjectToXML({
      rule: MetadataWSReferenceRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      externalOutputDir: join(outputDir, name),
      referenceDir,
      externalReferenceDir: join(referenceDir, name),
      xmlManifest,
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "service.xsd"), "utf-8")).toBe(xsdContent)
    expect(xmlManifest.expectedFiles()).toContain("WSСсылкаВсеСвойства/Ext/service.xsd")
  })
})
