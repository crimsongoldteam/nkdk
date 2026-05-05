import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataDocumentNumeratorRules } from "~/metadata/appliedObjects/metadataDocumentNumerator/rules"
import { mockContextToXML } from "~/tests/mockContext"
import { syncAppliedObjectToXML } from "./syncToXML"

const XMLNS =
  'xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xpr="http://v8.1c.ru/8.3/xcf/predef" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20"'

function catalogXml(forms: string[], templates: string[] = []): string {
  const childObjects =
    forms.length === 0 && templates.length === 0
      ? "<ChildObjects/>"
      : `<ChildObjects>\n${forms.map((f) => `\t\t\t<Form>${f}</Form>`).join("\n")}${templates.map((t) => `\n\t\t\t<Template>${t}</Template>`).join("")}\n\t\t</ChildObjects>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject ${XMLNS}>
\t<Catalog uuid="00000000-0000-0000-0000-000000000001">
\t\t<InternalInfo/>
\t\t<Properties>
\t\t\t<Name>ТестСправочник</Name>
\t\t</Properties>
\t\t${childObjects}
\t</Catalog>
</MetaDataObject>`
}

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(join(os.tmpdir(), "aplobj-sync-test-"))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("syncAppliedObjectToXML — (а) объект без форм/шаблонов", () => {
  it("создаёт XML в outputDir/{name}.xml", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    const fixtureXml = join(
      import.meta.dirname,
      "../../appliedObjects/metadataDocumentNumerator/__fixtures__/minimal.xml"
    )

    // Нумератор без форм/шаблонов: пустой YAML
    fs.mkdirSync(join(inputDir, "НумераторПоУмолчанию"), { recursive: true })
    fs.writeFileSync(join(inputDir, "НумераторПоУмолчанию", "Свойства.yaml"), "", "utf-8")

    fs.mkdirSync(outputDir, { recursive: true })
    fs.copyFileSync(fixtureXml, join(outputDir, "НумераторПоУмолчанию.xml"))

    await syncAppliedObjectToXML({
      rule: MetadataDocumentNumeratorRules,
      context: mockContextToXML(),
      inputDir,
      name: "НумераторПоУмолчанию",
      outputDir,
    })

    const outputPath = join(outputDir, "НумераторПоУмолчанию.xml")
    expect(fs.existsSync(outputPath)).toBe(true)

    const result = fs.readFileSync(outputPath, "utf-8")
    expect(result).toContain("<Name>НумераторПоУмолчанию</Name>")
  })
})

describe("syncAppliedObjectToXML — (б) формы из reference-XML", () => {
  it("формы из ChildObjects reference-XML появляются в результирующем XML", async () => {
    const inputDir = join(tmpDir, "input")
    const referenceDir = join(tmpDir, "reference")
    const outputDir = join(tmpDir, "output")

    fs.mkdirSync(join(inputDir, "ТестСправочник"), { recursive: true })
    fs.writeFileSync(join(inputDir, "ТестСправочник", "Свойства.yaml"), "", "utf-8")
    fs.mkdirSync(referenceDir, { recursive: true })
    fs.writeFileSync(join(referenceDir, "ТестСправочник.xml"), catalogXml(["ФормаЭлемента"]), "utf-8")

    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name: "ТестСправочник",
      outputDir,
      referenceDir,
    })

    const result = fs.readFileSync(join(outputDir, "ТестСправочник.xml"), "utf-8")
    expect(result).toContain("ФормаЭлемента")
  })
})

describe("syncAppliedObjectToXML — (в) формы из сканирования подпапок", () => {
  it("имена подпапок Формы/ попадают в результирующий XML при отсутствии reference-XML", async () => {
    const inputDir = join(tmpDir, "input")
    const referenceDir = join(tmpDir, "reference") // пустая — нет reference XML
    const outputDir = join(tmpDir, "output")

    // YAML без форм; папки с формами в Формы/
    fs.mkdirSync(join(inputDir, "ТестСправочник", "Формы", "ФормаСписка"), { recursive: true })
    fs.writeFileSync(join(inputDir, "ТестСправочник", "Свойства.yaml"), "", "utf-8")
    fs.mkdirSync(referenceDir, { recursive: true }) // reference dir пустая — нет XML-файла

    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name: "ТестСправочник",
      outputDir,
      referenceDir,
    })

    const result = fs.readFileSync(join(outputDir, "ТестСправочник.xml"), "utf-8")
    expect(result).toContain("ФормаСписка")
  })
})

describe("syncAppliedObjectToXML — (г) fallback referenceDir на outputDir", () => {
  it("при отсутствии referenceDir читает reference-XML из outputDir", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")

    // reference XML лежит в outputDir (не в отдельном referenceDir)
    fs.mkdirSync(join(inputDir, "ТестСправочник"), { recursive: true })
    fs.writeFileSync(join(inputDir, "ТестСправочник", "Свойства.yaml"), "", "utf-8")
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(join(outputDir, "ТестСправочник.xml"), catalogXml(["ФормаАвторства"]), "utf-8")

    // referenceDir не передаётся — должен использоваться outputDir
    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name: "ТестСправочник",
      outputDir,
    })

    const result = fs.readFileSync(join(outputDir, "ТестСправочник.xml"), "utf-8")
    expect(result).toContain("ФормаАвторства")
  })
})
