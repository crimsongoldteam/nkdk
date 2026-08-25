import { createConfigurationIndexCollector,serializeYAMLDocument } from "@nkdk/runtime"
import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach,describe,expect,it } from "vitest"
import { mockXmlImportContext } from "../../tests/mockContext"
import "../../tests/metadataExecutionContext"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { prepareImportYaml } from "./prepareYaml"
import type { ImportAssignment } from "./types"


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
      expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).not.toContainEqual(
        expect.objectContaining({
          logicalAddress: "Справочник.СправочникПолный.Реквизит.СтроковыйРеквизитСИндексом.fillValue",
        }),
      )
    },
  )

  it("не сохраняет канонический xsi:nil нестрокового реквизита", async () => {
    const prepared = await prepareImportYaml({
      assignment: assignment(fixture),
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.yaml).not.toHaveProperty(
      "Реквизиты.РеквизитСправочника.ЗначениеЗаполнения",
    )
  })

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

  it("сохраняет пробелы строкового FillValue как строку YAML", async () => {
    const sourcePath = copiedCatalogCodeFixture("         ")
    const prepared = await prepareImportYaml({
      assignment: assignment(sourcePath),
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(serializeYAMLDocument(prepared.yaml).text).toContain(
      'ЗначениеЗаполнения: "         "',
    )
  })

  it("откладывает DefinedType без сохранения исходного XML в снимке", async () => {
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
    expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).not.toContainEqual(
      expect.objectContaining({
        logicalAddress: "Справочник.СправочникПолный.Реквизит.АвторДействия.fillValue",
      }),
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

function copiedCatalogCodeFixture(value = "--", length = 3): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-code-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  let xml = fs.readFileSync(fixture, "utf8")
    .replace("<CodeLength>11</CodeLength>", `<CodeLength>${length}</CodeLength>`)
    .replace("\n\t\t\t<CodeType>Number</CodeType>", "")
  const codeStart = xml.indexOf('<xr:StandardAttribute name="Code">')
  const fillStart = xml.indexOf('<xr:FillValue xsi:nil="true"/>', codeStart)
  if (codeStart === -1 || fillStart === -1) throw new Error("Не найден стандартный реквизит Code")
  const emptyFill = '<xr:FillValue xsi:nil="true"/>'
  xml = `${xml.slice(0, fillStart)}<xr:FillValue xsi:type="xs:string">${value}</xr:FillValue>${xml.slice(fillStart + emptyFill.length)}`
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

function assignment(sourcePath: string): ImportAssignment {
  const node = compileRegisteredMetadataResourceTopology().assignments.find(
    ({ projectPattern }) => projectPattern === "Справочник/{ownerName}/Свойства.yaml",
  )
  if (node === undefined) throw new Error("Не найден topology-узел справочника")
  return {
    id: "fill-value",
    topologyAddress: { nodeId: node.id, values: { ownerName: "СправочникПолный" } },
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
