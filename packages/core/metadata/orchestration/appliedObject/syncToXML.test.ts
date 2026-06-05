import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataChartOfCharacteristicTypesRules } from "~/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules"
import { MetadataDocumentNumeratorRules } from "~/metadata/appliedObjects/metadataDocumentNumerator/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
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

describe("syncAppliedObjectToXML — (б2) основной reference XML", () => {
  it("не передаёт обычные свойства из reference в YAML import", async () => {
    const inputDir = join(tmpDir, "input")
    const referenceDir = join(tmpDir, "reference")
    const outputDir = join(tmpDir, "output")
    const propertyType = "RoundTripYamlOrdinarySource" as never
    let observedYamlImportSource: { marker?: string } | undefined

    registerTypeRule(propertyType, "importFromXML", () => ({ marker: "from-main-reference" }))
    registerTypeRule(propertyType, "importFromYAML", (params: { source?: { marker?: string } }) => {
      observedYamlImportSource = params.source
      return {
        marker: params.source?.marker ?? "without-main-reference-source",
      }
    })
    registerTypeRule(propertyType, "exportToXML", (_context: unknown, _rule: unknown, value: { marker?: string }) => ({
      Ordinary: {
        Marker: value.marker,
      },
    }))

    const rule = {
      itemType: "RoundTripYamlOrdinarySourceObject",
      properties: {
        xmlRoot: {
          type: "XMLRoot",
          container: "Catalog",
          forReferenceOnly: true,
        },
        name: {
          type: "string",
          xmlParents: ["Properties"],
          required: true,
        },
        ordinarySource: {
          yaml: "ОбычныйИсточник",
          xml: "Ordinary",
          xmlParents: ["Properties"],
          type: propertyType,
        },
      },
    } as unknown as MetadataItemRule

    fs.mkdirSync(join(inputDir, "ТестСправочник"), { recursive: true })
    fs.writeFileSync(
      join(inputDir, "ТестСправочник", "Свойства.yaml"),
      ["ОбычныйИсточник: {}", ""].join("\n"),
      "utf-8"
    )
    fs.mkdirSync(referenceDir, { recursive: true })
    fs.writeFileSync(
      join(referenceDir, "ТестСправочник.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject ${XMLNS}>
\t<Catalog uuid="00000000-0000-0000-0000-000000000001">
\t\t<InternalInfo/>
\t\t<Properties>
\t\t\t<Name>ТестСправочник</Name>
\t\t\t<Ordinary>
\t\t\t\t<Marker>from-main-reference</Marker>
\t\t\t</Ordinary>
\t\t</Properties>
\t\t<ChildObjects/>
\t</Catalog>
</MetaDataObject>`,
      "utf-8"
    )

    await syncAppliedObjectToXML({
      rule,
      context: mockContextToXML(),
      inputDir,
      name: "ТестСправочник",
      outputDir,
      referenceDir,
    })

    expect(observedYamlImportSource).toBeUndefined()
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

describe("syncAppliedObjectToXML — (г) без referenceDir", () => {
  it("без referenceDir не читает reference XML из outputDir", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    const name = "ТестСправочник"

    fs.mkdirSync(join(inputDir, name), { recursive: true })
    fs.writeFileSync(join(inputDir, name, "Свойства.yaml"), "Имя: ТестСправочник\n", "utf-8")
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(join(outputDir, `${name}.xml`), catalogXml(["ФормаАвторства"]), "utf-8")

    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
    })

    const result = fs.readFileSync(join(outputDir, `${name}.xml`), "utf-8")
    expect(result).toContain("<Catalog")
    expect(result).not.toContain("ФормаАвторства")
  })
})

describe("syncAppliedObjectToXML — (д) explicit null reference", () => {
  it("не читает reference XML, когда referenceModel передан как null", async () => {
    const inputDir = join(tmpDir, "input")
    const referenceDir = join(tmpDir, "reference")
    const outputDir = join(tmpDir, "output")

    fs.mkdirSync(join(inputDir, "ТестСправочник"), { recursive: true })
    fs.writeFileSync(join(inputDir, "ТестСправочник", "Свойства.yaml"), "", "utf-8")
    fs.mkdirSync(referenceDir, { recursive: true })
    fs.writeFileSync(join(referenceDir, "ТестСправочник.xml"), catalogXml(["ФормаИзReference"]), "utf-8")

    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name: "ТестСправочник",
      outputDir,
      referenceDir,
      referenceModel: null,
    })

    const result = fs.readFileSync(join(outputDir, "ТестСправочник.xml"), "utf-8")
    expect(result).not.toContain("ФормаИзReference")
  })
})

describe("syncAppliedObjectToXML — (е) filePath без YAML-значения", () => {
  it("не копирует внешний XML из reference для обычных filePath-свойств", async () => {
    const inputDir = join(tmpDir, "input")
    const referenceDir = join(tmpDir, "reference")
    const outputDir = join(tmpDir, "output")

    fs.mkdirSync(join(inputDir, "ТестСправочник"), { recursive: true })
    fs.writeFileSync(join(inputDir, "ТестСправочник", "Свойства.yaml"), "", "utf-8")
    fs.mkdirSync(join(referenceDir, "Ext"), { recursive: true })
    fs.writeFileSync(join(referenceDir, "ТестСправочник.xml"), catalogXml([]), "utf-8")
    fs.copyFileSync(
      join(import.meta.dirname, "../../appliedObjects/metadataCatalog/__fixtures__/sync/xml/Ext/AdditionalIndexes.xml"),
      join(referenceDir, "Ext/AdditionalIndexes.xml")
    )

    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name: "ТестСправочник",
      outputDir,
      referenceDir,
    })

    expect(fs.existsSync(join(outputDir, "Ext/AdditionalIndexes.xml"))).toBe(false)
  })
})

describe("syncAppliedObjectToXML — (ж) source из filePath reference для YAML import", () => {
  it("передаёт во внешний filePath-свойство source, прочитанный из reference XML", async () => {
    const inputDir = join(tmpDir, "input")
    const referenceDir = join(tmpDir, "reference")
    const outputDir = join(tmpDir, "output")
    const fileType = "RoundTripYamlSourceFile" as never
    let observedYamlImportSource: { marker?: string } | undefined

    registerTypeRule(fileType, "importFromXML", () => ({ marker: "from-reference-file" }))
    registerTypeRule(fileType, "importFromYAML", (params: { source?: { marker?: string } }) => {
      observedYamlImportSource = params.source
      return {
        marker: params.source?.marker ?? "without-reference-file-source",
      }
    })
    registerTypeRule(fileType, "exportToXML", (_context: unknown, _rule: unknown, value: { marker?: string }) => ({
      ExternalSource: {
        Marker: value.marker,
      },
    }))

    const rule = {
      itemType: "RoundTripYamlSourceObject",
      properties: {
        xmlRoot: {
          type: "XMLRoot",
          container: "Catalog",
          forReferenceOnly: true,
        },
        name: {
          type: "string",
          xmlParents: ["Properties"],
          required: true,
        },
        externalSource: {
          yaml: "ВнешнийИсточник",
          type: fileType,
          filePath: "Ext/Source.xml",
        },
      },
    } as unknown as MetadataItemRule

    fs.mkdirSync(join(inputDir, "ТестСправочник"), { recursive: true })
    fs.writeFileSync(
      join(inputDir, "ТестСправочник", "Свойства.yaml"),
      ["ВнешнийИсточник: {}", ""].join("\n"),
      "utf-8"
    )
    fs.mkdirSync(join(referenceDir, "Ext"), { recursive: true })
    fs.writeFileSync(join(referenceDir, "ТестСправочник.xml"), catalogXml([]), "utf-8")
    fs.writeFileSync(
      join(referenceDir, "Ext", "Source.xml"),
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        "<ExternalSource>",
        "\t<Marker>from-reference-file</Marker>",
        "</ExternalSource>",
      ].join("\n"),
      "utf-8"
    )

    await syncAppliedObjectToXML({
      rule,
      context: mockContextToXML(),
      inputDir,
      name: "ТестСправочник",
      outputDir,
      referenceDir,
    })

    const result = fs.readFileSync(join(outputDir, "Ext", "Source.xml"), "utf-8")
    const mainResult = fs.readFileSync(join(outputDir, "ТестСправочник.xml"), "utf-8")
    expect(observedYamlImportSource).toEqual({ marker: "from-reference-file" })
    expect(result).toContain("<Marker>from-reference-file</Marker>")
    expect(result).not.toContain("<Marker>without-reference-file-source</Marker>")
    expect(mainResult).not.toContain("<Marker>without-reference-file-source</Marker>")
  })
})

describe("syncAppliedObjectToXML — (з) owner context для filePath", () => {
  it("передаёт владельца во внешний Predefined.xml ПВХ без reference", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    const objectName = "ВидыСубконто"

    fs.mkdirSync(join(inputDir, objectName), { recursive: true })
    fs.writeFileSync(
      join(inputDir, objectName, "Свойства.yaml"),
      [
        "ТипЗначения:",
        "  - Строка(10)",
        "Предопределенные:",
        "  СубкнтоОдно:",
        '    Код: "000000001"',
        "    Наименование: Субкнто1",
        "    ТипЗначения: Строка(10)",
        "",
      ].join("\n"),
      "utf-8"
    )

    await syncAppliedObjectToXML({
      rule: MetadataChartOfCharacteristicTypesRules,
      context: mockContextToXML(),
      inputDir,
      name: objectName,
      outputDir,
    })

    const result = fs.readFileSync(join(outputDir, objectName, "Ext", "Predefined.xml"), "utf-8")
    expect(result).toContain('xsi:type="PlanOfCharacteristicKindPredefinedItems"')
    expect(result).not.toContain('xsi:type="CatalogPredefinedItems"')
    expect(result).toContain("<Type>")
    expect(result).toContain("<v8:Type>xs:string</v8:Type>")
    expect(result).toContain("<v8:Length>10</v8:Length>")
  })
})
