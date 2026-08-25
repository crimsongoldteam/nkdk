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
      const sourcePath = copiedAttributeFixture({
        name: "СтроковыйРеквизитСИндексом",
        type: "<v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>10</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers>",
        fillValue: '<FillValue xsi:type="xs:string"/>',
        fillBeforeType: order === "fill-before",
        includeDeletionMark: true,
      })
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
    const sourcePath = copiedAttributeFixture({
      name: "РеквизитСправочника",
      type: "<v8:Type>xs:dateTime</v8:Type><v8:DateQualifiers><v8:DateFractions>Date</v8:DateFractions></v8:DateQualifiers>",
      fillValue: '<FillValue xsi:nil="true"/>',
    })
    const prepared = await prepareImportYaml({
      assignment: assignment(sourcePath),
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

function copiedCatalogCodeFixture(value = "--", length = 3): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-code-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses"
  xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Catalog uuid="f8ffca12-d09d-4111-ba91-67077462df5b">
    <Properties>
      <Name>СправочникПолный</Name>
      <CodeLength>${length}</CodeLength>
      <StandardAttributes>
        <xr:StandardAttribute name="Code">
          <xr:FillValue xsi:type="xs:string">${value}</xr:FillValue>
        </xr:StandardAttribute>
      </StandardAttributes>
    </Properties>
  </Catalog>
</MetaDataObject>`
  fs.writeFileSync(sourcePath, xml)
  return sourcePath
}

function copiedDefinedTypeFixture(): string {
  return copiedAttributeFixture({
    name: "АвторДействия",
    type: "<v8:TypeSet>cfg:DefinedType.АвторДействия</v8:TypeSet>",
    fillValue: '<FillValue xsi:type="xr:DesignTimeRef">Catalog.Пользователи.EmptyRef</FillValue>',
  })
}

function copiedAttributeFixture(params: {
  readonly name: string
  readonly type: string
  readonly fillValue: string
  readonly fillBeforeType?: boolean
  readonly includeDeletionMark?: boolean
}): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-attribute-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  const type = `<Type>${params.type}</Type>`
  const ordered = params.fillBeforeType
    ? `${params.fillValue}${type}`
    : `${type}${params.fillValue}`
  const deletionMark = params.includeDeletionMark
    ? '<StandardAttributes><xr:StandardAttribute name="DeletionMark"><xr:FillValue xsi:nil="true"/></xr:StandardAttribute></StandardAttributes>'
    : ""
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses"
  xmlns:v8="http://v8.1c.ru/8.1/data/core"
  xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"
  xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Catalog uuid="f8ffca12-d09d-4111-ba91-67077462df5b">
    <Properties><Name>СправочникПолный</Name>${deletionMark}</Properties>
    <ChildObjects>
      <Attribute uuid="301fda37-ce86-4a9a-a764-f914a74e0188">
        <Properties><Name>${params.name}</Name>${ordered}</Properties>
      </Attribute>
    </ChildObjects>
  </Catalog>
</MetaDataObject>`
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
