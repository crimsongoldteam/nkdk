import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockXmlImportContext } from "../../tests/mockContext"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { prepareImportYaml } from "./prepareYaml"
import type { ImportAssignment } from "./types"
import { registerCoreMetadata } from "../composition/coreMetadata"
import { serializeYAMLDocument } from "../../yaml/export"

registerCoreMetadata()

const fixture = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__/full.xml")
const adoptedExtensionFixture = join(
  import.meta.dirname,
  "__fixtures__/configurationExtension/Catalogs/СправочникПолный.xml",
)
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe("fill value XML import", () => {
  it("удаляет начальную дату после импорта и сохраняет точный XML", async () => {
    const sourcePath = copiedBeginningDateFixture()
    const collector = createConfigurationIndexCollector()
    const prepared = await prepareImportYaml({
      assignment: assignment(sourcePath),
      context: mockXmlImportContext(),
      collector,
    })

    expect(prepared.yaml).not.toHaveProperty("Реквизиты.Момент.ЗначениеЗаполнения")
    expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).toContainEqual({
      logicalAddress: "Справочник.СправочникПолный.Реквизит.Момент.fillValue",
      sourceProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
      xml: { present: true, xsiType: "xs:dateTime", xmlText: "0001-01-01T00:00:00" },
    })
  })

  it.each(["type-before", "fill-before"] as const)(
    "нормализует значение после полного дерева при порядке %s",
    async (order) => {
      const sourcePath = copiedFixture(order)
      const collector = createConfigurationIndexCollector()
      const prepared = await prepareImportYaml({
        assignment: assignment(sourcePath),
        context: mockXmlImportContext(),
        collector,
      })

      expect(prepared.yaml).not.toHaveProperty(
        "Реквизиты.СтроковыйРеквизитСИндексом.ЗначениеЗаполнения",
      )
      expect(prepared.yaml).not.toHaveProperty(
        "СтандартныеРеквизиты.ПометкаУдаления.ЗначениеЗаполнения",
      )
      expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ xml: expect.objectContaining({ xsiType: "xs:string" }) }),
        ]),
      )
    },
  )

  it("сохраняет содержательный код при неявном строковом типе", async () => {
    const sourcePath = copiedCatalogCodeFixture()
    const prepared = await prepareImportYaml({
      assignment: assignment(sourcePath),
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.yaml).not.toHaveProperty("ТипКода")
    expect(prepared.yaml).toHaveProperty("ДлинаКода", 3)
    expect(serializeYAMLDocument(prepared.yaml).text).toContain('ЗначениеЗаполнения: "--"')
  })

  it("откладывает DefinedType и заранее сохраняет исходный XML", async () => {
    const sourcePath = copiedDefinedTypeFixture()
    const collector = createConfigurationIndexCollector()
    const prepared = await prepareImportYaml({
      assignment: assignment(sourcePath),
      context: mockXmlImportContext(),
      collector,
    })

    expect(prepared.dependentDeferred).toEqual(expect.arrayContaining([
      expect.objectContaining({
        yamlPath: ["Реквизиты", "АвторДействия", "ЗначениеЗаполнения"],
      }),
    ]))
    expect(prepared.yaml).toHaveProperty(
      "Реквизиты.АвторДействия.ЗначениеЗаполнения",
      "Справочник.Пользователи.ПустаяСсылка",
    )
    expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).toContainEqual({
      logicalAddress: "Справочник.СправочникПолный.Реквизит.АвторДействия.fillValue",
      sourceProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
      xml: { present: true, xsiType: "xr:DesignTimeRef", xmlText: "Catalog.Пользователи.EmptyRef" },
    })
  })

  it.each([
    ["typed", "Справочник.ПапкиФайлов.ПустаяСсылка", false],
    ["empty", "DesignTimeRef", true],
  ] as const)("откладывает %s XML-исключение владельца без snapshot", async (kind, expected, tagged) => {
    const sourcePath = copiedEmptyOwnerFixture(kind)
    const collector = createConfigurationIndexCollector()
    const prepared = await prepareImportYaml({
      assignment: assignment(sourcePath),
      context: mockXmlImportContext(),
      collector,
    })

    expect(prepared.yaml).not.toHaveProperty("Владельцы")
    expect(prepared.yaml).toHaveProperty(
      "СтандартныеРеквизиты.Владелец.ЗначениеЗаполнения",
      tagged ? `!xml ${expected}` : expected,
    )
    expect(serializeYAMLDocument(prepared.yaml).text).toContain(
      `ЗначениеЗаполнения: ${tagged ? "!xml " : ""}${expected}`,
    )
    if (!tagged) {
      expect(prepared.dependentDeferred).toEqual(expect.arrayContaining([
        expect.objectContaining({
          yamlPath: ["СтандартныеРеквизиты", "Владелец", "ЗначениеЗаполнения"],
        }),
      ]))
    }
    expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).not.toContainEqual(
      expect.objectContaining({ logicalAddress: "Справочник.СправочникПолный.СтандартныйРеквизит.Владелец.fillValue" }),
    )
  })

  it("не синтезирует стандартные реквизиты заимствованного справочника расширения", async () => {
    const prepared = await prepareImportYaml({
      assignment: assignment(adoptedExtensionFixture),
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.yaml).not.toHaveProperty("СтандартныеРеквизиты")
    expect(prepared.yaml).not.toHaveProperty("Владельцы")
    expect(prepared.dependentDeferred).toEqual([])
  })
})

function copiedBeginningDateFixture(): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-date-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  const xml = fs.readFileSync(fixture, "utf8")
    .replace("<Name>РеквизитСправочника</Name>", "<Name>Момент</Name>")
    .replace("<v8:DateFractions>Date</v8:DateFractions>", "<v8:DateFractions>DateTime</v8:DateFractions>")
    .replace('<FillValue xsi:nil="true"/>', '<FillValue xsi:type="xs:dateTime">0001-01-01T00:00:00</FillValue>')
  fs.writeFileSync(sourcePath, xml)
  return sourcePath
}

function copiedFixture(order: "type-before" | "fill-before"): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  let xml = fs.readFileSync(fixture, "utf8")
  if (order === "fill-before") {
    const start = xml.indexOf("<Name>СтроковыйРеквизитСИндексом</Name>")
    const fill = xml.indexOf('<FillValue xsi:type="xs:string"/>', start)
    const type = xml.indexOf("<Type>", start)
    const fillLineStart = xml.lastIndexOf("\n", fill) + 1
    const fillLineEnd = xml.indexOf("\n", fill) + 1
    const fillLine = xml.slice(fillLineStart, fillLineEnd)
    xml = `${xml.slice(0, fillLineStart)}${xml.slice(fillLineEnd)}`
    const adjustedType = type < fillLineStart ? type : type - fillLine.length
    const typeLineStart = xml.lastIndexOf("\n", adjustedType) + 1
    xml = `${xml.slice(0, typeLineStart)}${fillLine}${xml.slice(typeLineStart)}`
  }
  fs.writeFileSync(sourcePath, xml)
  return sourcePath
}

function copiedCatalogCodeFixture(): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-code-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  let xml = fs.readFileSync(fixture, "utf8")
    .replace("<CodeLength>11</CodeLength>", "<CodeLength>3</CodeLength>")
    .replace("\n\t\t\t<CodeType>Number</CodeType>", "")
  const codeStart = xml.indexOf('<xr:StandardAttribute name="Code">')
  const fillStart = xml.indexOf('<xr:FillValue xsi:nil="true"/>', codeStart)
  if (codeStart === -1 || fillStart === -1) throw new Error("Не найден стандартный реквизит Code")
  const emptyFill = '<xr:FillValue xsi:nil="true"/>'
  xml = `${xml.slice(0, fillStart)}<xr:FillValue xsi:type="xs:string">--</xr:FillValue>${xml.slice(fillStart + emptyFill.length)}`
  fs.writeFileSync(sourcePath, xml)
  return sourcePath
}

function copiedDefinedTypeFixture(): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-defined-type-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  const sourceType = `<Type>
						<v8:Type>xs:dateTime</v8:Type>
						<v8:DateQualifiers>
							<v8:DateFractions>Date</v8:DateFractions>
						</v8:DateQualifiers>
					</Type>`
  const xml = fs.readFileSync(fixture, "utf8")
    .replace("<Name>РеквизитСправочника</Name>", "<Name>АвторДействия</Name>")
    .replace(sourceType, "<Type><v8:TypeSet>cfg:DefinedType.АвторДействия</v8:TypeSet></Type>")
    .replace('<FillValue xsi:nil="true"/>', '<FillValue xsi:type="xr:DesignTimeRef">Catalog.Пользователи.EmptyRef</FillValue>')
  fs.writeFileSync(sourcePath, xml)
  return sourcePath
}

function copiedEmptyOwnerFixture(kind: "typed" | "empty"): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-empty-owner-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  const sourceOwners = `<Owners>
\t\t\t\t<xr:Item xsi:type="xr:MDObjectRef">Catalog.СправочникВладелец</xr:Item>
\t\t\t</Owners>`
  const sourceFill = '<xr:FillValue xsi:type="xr:DesignTimeRef">447e2bd8-fa43-442e-91db-b17634e036d9.c26f06ab-fb3e-46a7-a391-fdccd77b4231</xr:FillValue>'
  const targetFill = kind === "typed"
    ? '<xr:FillValue xsi:type="xr:DesignTimeRef">Catalog.ПапкиФайлов.EmptyRef</xr:FillValue>'
    : '<xr:FillValue xsi:type="xr:DesignTimeRef"/>'
  const xml = fs.readFileSync(fixture, "utf8")
    .replace(sourceOwners, "<Owners/>")
    .replace(sourceFill, targetFill)
  fs.writeFileSync(sourcePath, xml)
  return sourcePath
}

function assignment(sourcePath: string): ImportAssignment {
  return {
    id: "fill-value",
    role: "properties",
    targetProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "СправочникПолный",
    logicalAddress: "Справочник.СправочникПолный",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath }],
    externalFiles: [],
  }
}
