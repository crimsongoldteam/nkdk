import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { readFormNKDK, readFormYAML } from "~/tests/fixtures/sync/syncForm/data"
import { importFormFromNKDK } from "~/tests/fromNKDK"
import { mockContextToXML, mockContextToYAML } from "~/tests/mockContext"
import { convertFormFromXML } from "./convertFormFromXML"
import { convertFormToXML } from "./convertFormToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

describe("convertFormToXML", () => {
  const xmlInputDir = join(process.cwd(), "tests/fixtures/sync/syncForm/xml/Forms")
  const yamlOutputDir = join(process.cwd(), "tests/fixtures/sync/syncForm/out")
  const xmlOutputDir = join(process.cwd(), "tests/fixtures/sync/syncForm/toXmlOut")
  const roundtripYamlDir = join(process.cwd(), "tests/fixtures/sync/syncForm/roundtripOut")
  const formName = "ФормаЭлемента"

  beforeEach(() => {
    for (const dir of [yamlOutputDir, xmlOutputDir, roundtripYamlDir]) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true })
      }
    }
  })

  it("should read form from YAML/nkdk and export to XML files in output dir", async () => {
    await convertFormFromXML({
      context: mockContextToYAML,
      inputDir: xmlInputDir,
      formName,
      outputDir: yamlOutputDir,
    })

    expect(fs.readFileSync(join(yamlOutputDir, "Формы", formName, "Форма.yaml"), "utf-8")).toBe(readFormYAML)
    expect(fs.readFileSync(join(yamlOutputDir, "Формы", formName, "Форма.nkdk"), "utf-8")).toBe(readFormNKDK)

    await convertFormToXML({
      context: mockContextToXML(),
      inputDir: yamlOutputDir,
      formName,
      outputDir: xmlOutputDir,
      parseNkdK: importFormFromNKDK,
    })

    const metadataPath = join(xmlOutputDir, "Forms", `${formName}.xml`)
    const formXmlPath = join(xmlOutputDir, "Forms", formName, "Ext", "Form.xml")
    expect(fs.existsSync(metadataPath)).toBe(true)
    expect(fs.existsSync(formXmlPath)).toBe(true)

    await convertFormFromXML({
      context: mockContextToYAML,
      inputDir: join(xmlOutputDir, "Forms"),
      formName,
      outputDir: roundtripYamlDir,
    })

    const roundtripYaml = fs.readFileSync(join(roundtripYamlDir, "Формы", formName, "Форма.yaml"), "utf-8")
    const roundtripNkdk = fs.readFileSync(join(roundtripYamlDir, "Формы", formName, "Форма.nkdk"), "utf-8")
    expect(roundtripYaml).toContain("Синоним: Это форма контрагента")
    expect(roundtripYaml).toContain("ПолеВвода1")
    expect(roundtripNkdk).toBe(readFormNKDK)
  })
})
