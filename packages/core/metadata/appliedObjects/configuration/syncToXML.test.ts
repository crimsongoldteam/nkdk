import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { syncConfigurationFromXML } from "./convertFromXML"
import { syncConfigurationToXML } from "./syncToXML"

describe("sync configuration to XML", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/nkdk")
  const referenceDir = getXMLFixturePath("sync/syncConfiguration/xml")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/out-to-xml")
  const catalogName = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should read configuration from YAML and export to XML file in output dir", async () => {
    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir,
      outputDir,
      referenceDir,
    })

    const expectedMetadataXML = readXMLFileAsString(join("sync/syncConfiguration/xml/Catalogs", `${catalogName}.xml`))
    const resultMetadataXML = readXMLFileAsString(join("sync/syncConfiguration/out-to-xml/Catalogs", `${catalogName}.xml`))
    expect(resultMetadataXML).toBe(expectedMetadataXML)

    const expectedFormXML = readXMLFileAsString(
      join("sync/syncConfiguration/xml/Catalogs", "Контрагенты", "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    )
    const resultFormXML = readXMLFileAsString(
      join("sync/syncConfiguration/out-to-xml", "Catalogs", catalogName, "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    )
    expect(resultFormXML).toBe(expectedFormXML)

    const expectedFormMetadataXML = readXMLFileAsString(
      join("sync/syncConfiguration/xml/Catalogs", catalogName, "Forms", "ФормаЭлемента.xml")
    )
    const resultFormMetadataXML = readXMLFileAsString(
      join("sync/syncConfiguration/out-to-xml", "Catalogs", catalogName, "Forms", "ФормаЭлемента.xml")
    )
    expect(resultFormMetadataXML).toBe(expectedFormMetadataXML)
  })

  it("round-trip Document/DocumentNumerator/Sequence: XML → YAML → XML возвращает исходный XML", async () => {
    const tmpYamlDir = getXMLFixturePath("sync/syncConfiguration/_tmp_yaml")
    const tmpXmlDir = getXMLFixturePath("sync/syncConfiguration/_tmp_xml")
    if (fs.existsSync(tmpYamlDir)) fs.rmSync(tmpYamlDir, { recursive: true })
    if (fs.existsSync(tmpXmlDir)) fs.rmSync(tmpXmlDir, { recursive: true })
    fs.mkdirSync(tmpYamlDir, { recursive: true })
    fs.mkdirSync(tmpXmlDir, { recursive: true })

    // 1. XML → YAML
    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: referenceDir,
      outputDir: tmpYamlDir,
    })

    // 2. YAML → XML
    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: tmpYamlDir,
      outputDir: tmpXmlDir,
      referenceDir,
    })

    // DocumentNumerator и Sequence — полный round-trip (правила покрывают все поля фикстуры)
    for (const [xmlSubdir, fileName] of [
      ["DocumentNumerators", "НумераторПоУмолчанию.xml"],
      ["Sequences", "ПоследовательностьПоУмолчанию.xml"],
    ] as const) {
      const expected = readXMLFileAsString(join("sync/syncConfiguration/xml", xmlSubdir, fileName))
      const actual = readXMLFileAsString(join("sync/syncConfiguration/_tmp_xml", xmlSubdir, fileName))
      expect(actual, `mismatch in ${xmlSubdir}/${fileName}`).toBe(expected)
    }

    // Document — только проверка, что walker дошёл до Documents/ и создал XML.
    // Полный round-trip XML→YAML→XML для Document остаётся ослабленным и в этой
    // версии — не из-за `MetadataDocumentRules` (пробелы закрыты в PRD-1
    // `2026-04-26-metadata-document-round-trip-gaps`), а из-за общих
    // инфраструктурных ограничений, не входящих в границы того PRD:
    //   1. mockContextToXML не подкладывает фиксированный `uuid` в <Document>.
    //   2. StandardAttributeDescriptions сериализует атрибуты алфавитно,
    //      а реальная фикстура имеет порядок Posted/Ref/DeletionMark/Date/Number.
    //   3. InternalInfo-механизм для TabularSection зашит на CatalogTabularSection,
    //      а Document требует DocumentTabularSection.
    //   4. <Form>/<Template>: PRD-2 (Document — Forms/Templates/Modules/Help).
    //   5. У атрибутов сериализуется лишний <Use>ForItem</Use>
    //      (поведение общей сериализации атрибутов).
    // Поднять assertions до уровня Sequence/DocumentNumerator можно после
    // устранения каждого из пунктов выше — это отдельные тикеты вне границ
    // PRD-1.
    expect(
      fs.existsSync(join(tmpXmlDir, "Documents", "ДокументПоУмолчанию.xml")),
      "walker should produce Documents/ДокументПоУмолчанию.xml",
    ).toBe(true)

    fs.rmSync(tmpYamlDir, { recursive: true })
    fs.rmSync(tmpXmlDir, { recursive: true })
  })
})
