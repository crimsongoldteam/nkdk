import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "../../appliedObjects/metadataDocument/rules"
import { MetadataDocumentNumeratorRules } from "../../appliedObjects/metadataDocumentNumerator/rules"
import { MetadataSequenceRules } from "../../appliedObjects/metadataSequence/rules"
import { mockContextFromXML } from "../../../tests/mockContext"
import { convertAppliedObjectFromXML } from "./convertFromXML"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { registerTypeRule } from "../property/typeRuleRegistry"

const APPLIED_NIL_PROBE_TYPE = "AppliedNilProbe" as never
registerTypeRule(APPLIED_NIL_PROBE_TYPE, "importFromXML", (_context, _rule, value) =>
  value !== null && typeof value === "object" && (value["_xsi:nil"] === true || value["_xsi:nil"] === "true")
    ? "preserved"
    : "lost"
)

// Minimal catalog XML with a form in ChildObjects
const CATALOG_XML_WITH_FORM = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xpr="http://v8.1c.ru/8.3/xcf/predef" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<Catalog uuid="00000000-0000-0000-0000-000000000001">
\t\t<InternalInfo/>
\t\t<Properties>
\t\t\t<Name>ТестСправочник</Name>
\t\t</Properties>
\t\t<ChildObjects>
\t\t\t<Form>ФормаСписка</Form>
\t\t</ChildObjects>
\t</Catalog>
</MetaDataObject>`

const CATALOG_XML_WITH_COMMAND = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
  <Catalog uuid="00000000-0000-0000-0000-000000000001">
    <Properties><Name>ТестСправочник</Name></Properties>
    <ChildObjects>
      <Command uuid="00000000-0000-0000-0000-000000000002">
        <Properties><Name>Обновить</Name></Properties>
      </Command>
    </ChildObjects>
  </Catalog>
</MetaDataObject>`

const APPLIED_XML_WITH_NIL = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Catalog><Properties><Value xsi:nil="true"/></Properties></Catalog>
</MetaDataObject>`

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(join(os.tmpdir(), "aplobj-convert-test-"))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("convertAppliedObjectFromXML — объект без форм/шаблонов", () => {
  it("создаёт Свойства.yaml в outputDir/{name}/", async () => {
    // DocumentNumerator не имеет ChildFormNames/ChildTemplateNames
    const fixtureXml = join(
      import.meta.dirname,
      "../../appliedObjects/metadataDocumentNumerator/__fixtures__/minimal.xml"
    )
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    fs.mkdirSync(inputDir, { recursive: true })
    fs.copyFileSync(fixtureXml, join(inputDir, "НумераторПоУмолчанию.xml"))

    await convertAppliedObjectFromXML({
      rule: MetadataDocumentNumeratorRules,
      context: mockContextFromXML(),
      inputDir,
      name: "НумераторПоУмолчанию",
      outputDir,
    })

    const outputPath = join(outputDir, "НумераторПоУмолчанию", "Свойства.yaml")
    expect(fs.existsSync(outputPath)).toBe(true)
  })

  it("convertAppliedObjectFromXML работает для Document (xmlParents-обёртка вместо XMLRoot)", async () => {
    const fixtureXml = join(import.meta.dirname, "../../appliedObjects/metadataDocument/__fixtures__/minimal.xml")
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    fs.mkdirSync(inputDir, { recursive: true })
    fs.copyFileSync(fixtureXml, join(inputDir, "ДокументПоУмолчанию.xml"))

    await convertAppliedObjectFromXML({
      rule: MetadataDocumentRules,
      context: mockContextFromXML(),
      inputDir,
      name: "ДокументПоУмолчанию",
      outputDir,
    })

    const outputPath = join(outputDir, "ДокументПоУмолчанию", "Свойства.yaml")
    expect(fs.existsSync(outputPath)).toBe(true)
  })

  it("convertAppliedObjectFromXML работает для Sequence", async () => {
    const fixtureXml = join(import.meta.dirname, "../../appliedObjects/metadataSequence/__fixtures__/minimal.xml")
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    fs.mkdirSync(inputDir, { recursive: true })
    fs.copyFileSync(fixtureXml, join(inputDir, "ПоследовательностьПоУмолчанию.xml"))

    await convertAppliedObjectFromXML({
      rule: MetadataSequenceRules,
      context: mockContextFromXML(),
      inputDir,
      name: "ПоследовательностьПоУмолчанию",
      outputDir,
    })

    const outputPath = join(outputDir, "ПоследовательностьПоУмолчанию", "Свойства.yaml")
    expect(fs.existsSync(outputPath)).toBe(true)
  })

  it("имя выходного файла фиксировано: Свойства.yaml", async () => {
    const fixtureXml = join(
      import.meta.dirname,
      "../../appliedObjects/metadataDocumentNumerator/__fixtures__/minimal.xml"
    )
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    fs.mkdirSync(inputDir, { recursive: true })
    fs.copyFileSync(fixtureXml, join(inputDir, "НумераторПоУмолчанию.xml"))

    await convertAppliedObjectFromXML({
      rule: MetadataDocumentNumeratorRules,
      context: mockContextFromXML(),
      inputDir,
      name: "НумераторПоУмолчанию",
      outputDir,
    })

    const expectedFile = join(outputDir, "НумераторПоУмолчанию", "Свойства.yaml")
    const unexpectedFile = join(outputDir, "НумераторПоУмолчанию.yaml")
    expect(fs.existsSync(expectedFile)).toBe(true)
    expect(fs.existsSync(unexpectedFile)).toBe(false)
  })
})

describe("convertAppliedObjectFromXML — объект с формами/шаблонами", () => {
  it("создаёт Свойства.yaml; формы из XML не попадают в YAML (forReferenceOnly)", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    fs.mkdirSync(inputDir, { recursive: true })
    fs.writeFileSync(join(inputDir, "ТестСправочник.xml"), CATALOG_XML_WITH_FORM, "utf-8")

    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: mockContextFromXML(),
      inputDir,
      name: "ТестСправочник",
      outputDir,
    })

    const outputPath = join(outputDir, "ТестСправочник", "Свойства.yaml")
    expect(fs.existsSync(outputPath)).toBe(true)

    // Формы не экспортируются в YAML (toYAML: false)
    const yaml = fs.readFileSync(outputPath, "utf-8")
    expect(yaml).not.toContain("ФормаСписка")
  })

  it("собирает uuid прикладного объекта под его logicalAddress", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    const collector = createConfigurationIndexCollector()
    fs.mkdirSync(inputDir, { recursive: true })
    fs.writeFileSync(join(inputDir, "ТестСправочник.xml"), CATALOG_XML_WITH_FORM, "utf-8")

    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: withConfigurationIndexCollector(mockContextFromXML(), collector, "Справочник.ТестСправочник"),
      inputDir,
      name: "ТестСправочник",
      outputDir,
    })

    expect(collector.fragment("Справочник/ТестСправочник/Свойства.yaml").identities).toContainEqual({
      logicalAddress: "Справочник.ТестСправочник",
      kind: "uuid",
      value: "00000000-0000-0000-0000-000000000001",
    })
  })

  it("создаёт контекст дочернего объекта до импорта его свойств", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    const collector = createConfigurationIndexCollector()
    fs.mkdirSync(inputDir, { recursive: true })
    fs.writeFileSync(join(inputDir, "ТестСправочник.xml"), CATALOG_XML_WITH_COMMAND, "utf-8")

    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: withConfigurationIndexCollector(mockContextFromXML(), collector, "Справочник.ТестСправочник"),
      inputDir,
      name: "ТестСправочник",
      outputDir,
    })

    expect(collector.fragment("Справочник/ТестСправочник/Свойства.yaml").identities).toContainEqual({
      logicalAddress: "Справочник.ТестСправочник.Команда.Обновить",
      kind: "uuid",
      value: "00000000-0000-0000-0000-000000000002",
    })
  })

  it("сохраняет xsi:nil при чтении applied XML", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    fs.mkdirSync(inputDir, { recursive: true })
    fs.writeFileSync(join(inputDir, "Тест.xml"), APPLIED_XML_WITH_NIL, "utf-8")

    await convertAppliedObjectFromXML({
      rule: {
        itemType: "Catalog",
        properties: {
          xmlRoot: {
            type: "XMLRoot",
            container: "Catalog",
            rootAttributes: {},
            forReferenceOnly: true,
          },
          value: {
            type: APPLIED_NIL_PROBE_TYPE,
            xml: "Value",
            yaml: "Значение",
            xmlParents: ["Properties"],
          },
        },
      } as any,
      context: mockContextFromXML(),
      inputDir,
      name: "Тест",
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, "Тест", "Свойства.yaml"), "utf-8")).toContain("Значение: preserved")
  })
})
