import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { describe,expect,it } from "vitest"

import {
createXmlAnomalyAnnotations,
createXmlImportAuditSession,
importContentFromXML,
parseXmlDocumentWithSaxes,
serializeYAMLDocument,
xmlElementChildren,
xmlExport
} from "@nkdk/runtime"
import { createRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import {
createDirectRoundTripContexts,
testPropertyFromXMLToYAML,
testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"

import "../index"
import "./fromXMLToYAML"
import { FormAttributeColumnRules,FormAttributeRules } from "./rules"
import { metadataRules } from "../../../composition/metadataRules"

const rule = {
  itemType: "FormAttributesProbe",
  properties: {
    value: { type: "FormAttributes", yaml: "Значение", xml: "Attribute" },
  },
} as const satisfies MetadataItemRule

const fixtures = [
  "attributeAnyType.xml",
  "chartSettings.xml",
  "columnAnyType.xml",
  "ganttChartSettings.xml",
  "mixedColumns.xml",
  "plannerSettings.xml",
  "plannerSettingsWithNil.xml",
  "spreadsheetDocumentSettings.xml",
  "tableWithColumns.xml",
  "titleColumnsType.xml",
  "treeWithColumn.xml",
  "twoTables.xml",
  "valueListWithReferenceEmptySettings.xml",
  "valueListWithoutSettings.xml",
] as const

const settingsFixtures = [
  "chartSettings.xml",
  "ganttChartSettings.xml",
  "plannerSettings.xml",
  "plannerSettingsWithNil.xml",
  "spreadsheetDocumentSettings.xml",
] as const

function importStructuredFormAttributes(
  xml: string,
  execution?: ReturnType<typeof createRuleRegistrySet>["execution"],
) {
  const document = parseXmlDocumentWithSaxes(xml, { preserveXsiNil: true })
  const root = document.roots[0]!
  const audit = createXmlImportAuditSession([root])
  const annotations = createXmlAnomalyAnnotations()
  const structuredRule = {
    ...rule,
    properties: {
      value: { ...rule.properties.value, xml: "Attributes" },
    },
  } as const satisfies MetadataItemRule
  const { yaml } = testPropertyFromXMLToYAML({
    rule: structuredRule,
    xml: root,
    audit,
    annotations,
    execution,
  })
  return { root, audit, yaml }
}

describe("FormAttributes XML → YAML → XML", () => {
  it("привязывает общие Settings к выбранному по xsi:type свойству", () => {
    const registries = createRuleRegistrySet(metadataRules)
    const attribute = fs.readFileSync(
      fileURLToPath(new URL("__fixtures__/plannerSettings.xml", import.meta.url)),
      "utf8",
    )
    const { root, audit, yaml } = importStructuredFormAttributes(
      `<Root><Attributes>${attribute}</Attributes></Root>`,
      registries.execution,
    )
    audit.finalize()
    const attributesNode = xmlElementChildren(root, "Attributes")[0]!
    const attributeNode = xmlElementChildren(attributesNode, "Attribute")[0]!
    const settingsNode = xmlElementChildren(attributeNode, "Settings")[0]!
    expect(audit.getOutcome(settingsNode)).toMatchObject({
      state: "claimed",
      boundaries: [expect.objectContaining({ propertyKey: "planner", yamlPath: ["Значение", "Канбан", "Планировщик"] })],
    })
    expect(audit.outcomes().filter(({ node }) => node.path.startsWith(settingsNode.path)).map(({ state }) => state))
      .toEqual(Array(audit.outcomes().filter(({ node }) => node.path.startsWith(settingsNode.path)).length).fill("claimed"))

    expect(yaml).toHaveProperty("Значение.Канбан.Планировщик")
    expect(yaml).not.toHaveProperty("Значение.Канбан.ДинамическийСписок")
  })

  it("переносит audit повторных реквизитов и колонок на их runtime-ключи", () => {
    const { root, audit, yaml } = importStructuredFormAttributes(`
      <Root xmlns:v8="http://v8.1c.ru/8.1/data/core">
        <Attributes>
          <Attribute name="Таблица" id="1">
            <Type><v8:Type>v8:ValueTable</v8:Type></Type>
            <Columns>
              <Column name="Колонка" id="1"><Type><v8:Type>xs:string</v8:Type></Type></Column>
              <Column name="Колонка" id="2"><Type><v8:Type>xs:boolean</v8:Type></Type></Column>
            </Columns>
          </Attribute>
          <Attribute name="Таблица" id="2"><Type><v8:Type>xs:string</v8:Type></Type></Attribute>
        </Attributes>
      </Root>
    `)
    const attributes = (yaml as { Значение: Record<string, Record<string, unknown>> }).Значение
    const attributeRuntimeKeys = Object.keys(attributes)
    const attributesNode = xmlElementChildren(root, "Attributes")[0]!
    const attributeNodes = xmlElementChildren(attributesNode, "Attribute")
    expect(audit.getOutcome(attributeNodes[0]!).boundaries
      .find(({ itemType }) => itemType === FormAttributeRules.itemType)?.yamlPath)
      .toEqual(["Значение", attributeRuntimeKeys[0]])
    expect(audit.getOutcome(attributeNodes[1]!).boundaries
      .find(({ itemType }) => itemType === FormAttributeRules.itemType)?.yamlPath)
      .toEqual(["Значение", attributeRuntimeKeys[1]])

    const columns = attributes[attributeRuntimeKeys[0]!]!.Колонки as Record<string, unknown>
    const columnRuntimeKeys = Object.keys(columns)
    const columnsNode = xmlElementChildren(attributeNodes[0]!, "Columns")[0]!
    const columnNodes = xmlElementChildren(columnsNode, "Column")
    expect(audit.getOutcome(columnNodes[0]!).boundaries
      .find(({ itemType }) => itemType === FormAttributeColumnRules.itemType)?.yamlPath)
      .toEqual(["Значение", attributeRuntimeKeys[0], "Колонки", columnRuntimeKeys[0]])
    expect(audit.getOutcome(columnNodes[1]!).boundaries
      .find(({ itemType }) => itemType === FormAttributeColumnRules.itemType)?.yamlPath)
      .toEqual(["Значение", attributeRuntimeKeys[0], "Колонки", columnRuntimeKeys[1]])
  })

  it("сохраняет реквизиты и колонки с повторными именами в XML-порядке", () => {
    const annotations = createXmlAnomalyAnnotations()
    const source = {
      Attribute: [
        {
          _name: "Таблица",
          _id: "1",
          Type: { "v8:Type": "v8:ValueTable" },
          Columns: {
            Column: [
              { _name: "Колонка", _id: "1", Type: { "v8:Type": "xs:string" } },
              { _name: "Колонка", _id: "2", Type: { "v8:Type": "xs:boolean" } },
            ],
          },
        },
        { _name: "Таблица", _id: "2", Type: { "v8:Type": "xs:string" } },
      ],
    }

    const { yaml } = testPropertyFromXMLToYAML({ rule, xml: source, annotations })
    const text = serializeYAMLDocument(yaml, annotations).text
    expect(text).toContain("!xml/invalid Таблица:")
    expect(text).toContain("!xml/invalid Колонка:")

    const { xml } = testPropertyFromYAMLToXML({ rule, yaml, annotations })
    expect(xml).toMatchObject({
      Attribute: [
        {
          _name: "Таблица",
          Columns: {
            Column: [
              { _name: "Колонка", Type: { "v8:Type": "xs:string" } },
              { _name: "Колонка", Type: { "v8:Type": "xs:boolean" } },
            ],
          },
        },
        { _name: "Таблица", Type: { "v8:Type": "xs:string" } },
      ],
    })
  })

  it("не помечает отсутствие Settings у составного типа", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml: {
        Attribute: {
          _name: "Список",
          Type: { "v8:Type": ["v8:ValueListType", "xs:string"] },
        },
      },
    })
    const item = (yaml as { Значение: Record<string, Record<string, unknown>> }).Значение.Список!

    expect(item).not.toHaveProperty("ТипЗначения")
  })

  it("сохраняет непустой Settings у единственного СпискаЗначений", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml: {
        Attribute: {
          _name: "Список",
          Type: { "v8:Type": "v8:ValueListType" },
          Settings: {
            "_xsi:type": "v8:TypeDescription",
            "v8:Type": "xs:string",
            "v8:StringQualifiers": { "v8:Length": 0, "v8:AllowedLength": "Variable" },
          },
        },
      },
    })
    const item = (yaml as { Значение: Record<string, Record<string, unknown>> }).Значение.Список!

    expect(item.ТипЗначения).toBe("Строка")
  })

  it("создаёт канонический Settings без маркера", () => {
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: { Список: { Тип: "СписокЗначений" } } },
    })
    const attribute = Array.isArray(xml.Attribute) ? xml.Attribute[0] : xml.Attribute

    expect(attribute).toHaveProperty("Settings", { "_xsi:type": "v8:TypeDescription" })
  })

  it.each(fixtures)("сохраняет %s", (fixture) => {
    const { expected, result } = roundTripFixture(fixture, true)
    expect(result).toBe(expected.trim())
  })

  it.each(settingsFixtures)("восстанавливает %s без reference XML", (fixture) => {
    const { expected, result } = roundTripFixture(fixture, false)
    expect(result).toBe(expected.trim())
  })

  it("не помечает TypeDescription как присутствующий DynamicList", () => {
    const source = fs.readFileSync(
      fileURLToPath(new URL("__fixtures__/valueListWithReferenceEmptySettings.xml", import.meta.url)),
      "utf8",
    )
    const xml = importContentFromXML<Record<string, unknown>>(source, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "ОбщаяФорма.СписокЗначений",
    })
    const collection = contexts.importContext.fromXML.configurationIndex
    const importContext = collection === undefined
      ? contexts.importContext
      : {
          ...contexts.importContext,
          fromXML: {
            ...contexts.importContext.fromXML,
            configurationIndex: { ...collection, yamlPathAddressing: true as const },
          },
        }

    testPropertyFromXMLToYAML({ rule, xml, context: importContext })
    const entities = collection?.collector.fragment("Форма.yaml").entities ?? []

    expect(entities).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        logicalAddress: expect.stringContaining("ДинамическийСписок"),
        xml: expect.objectContaining({ present: true }),
      }),
    ]))
  })

  it("сохраняет отсутствие заголовка колонки как пустой YAML", () => {
    const source = fs.readFileSync(
      fileURLToPath(new URL("__fixtures__/tableWithColumns.xml", import.meta.url)),
      "utf8"
    )
    const xml = importContentFromXML<Record<string, unknown>>(source, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml,
      context: contexts.importContext,
    })

    expect(yaml).toMatchObject({
      Значение: {
        Таблица: {
          Колонки: {
            Колонка1: { Заголовок: "" },
            Колонка2: { Заголовок: "" },
          },
        },
      },
    })

    const roundTrip = testPropertyFromYAMLToXML({
      rule,
      yaml,
      context: contexts.exportContext(),
    })
    expect(xmlExport(roundTrip.xml, false)).not.toContain("<Title>")
  })

  it("исключает заголовок колонки, равный имени, из YAML", () => {
    const source = fs.readFileSync(
      fileURLToPath(new URL("__fixtures__/columnAnyType.xml", import.meta.url)),
      "utf8"
    )
    const xml = importContentFromXML<Record<string, unknown>>(source, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const { yaml } = testPropertyFromXMLToYAML({ rule, xml })

    expect(yaml).not.toHaveProperty(
      "Значение.ТаблицаСКолонкойБезТипа.Колонки.РеквизитБезТипа.Заголовок"
    )
  })

  it("восстанавливает заголовок колонки из имени при отсутствии поля в YAML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml: {
        Значение: {
          Таблица: {
            Тип: "ТаблицаЗначений",
            Колонки: {
              РеквизитБезТипа: {},
            },
          },
        },
      },
      context: contexts.exportContext(),
    })

    expect(xmlExport(xml, false)).toContain("<v8:content>Реквизит без типа</v8:content>")
  })

  it("различает обычные и дополнительные колонки", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml: {
        Attribute: {
          _name: "Таблица",
          Type: { "v8:Type": "v8:ValueTable" },
          Columns: {
            Column: { _name: "Обычная", Type: { "v8:Type": "xs:string" } },
            AdditionalColumns: [
              { _table: "Таблица.Пустая" },
              {
                _table: "Таблица.Заполненная",
                Column: { _name: "Дополнительная", Type: { "v8:Type": "xs:boolean" } },
              },
            ],
          },
        },
      },
    })

    expect(yaml).toMatchObject({
      Значение: {
        Таблица: {
          Колонки: { Обычная: expect.any(Object) },
          ДополнительныеКолонки: {
            "Таблица.Пустая": {},
            "Таблица.Заполненная": { Дополнительная: expect.any(Object) },
          },
        },
      },
    })
  })

  it("восстанавливает id дополнительных колонок из индекса без reference XML", () => {
    const source = {
      Attribute: {
        _name: "Таблица",
        _id: "7",
        Type: { "v8:Type": "v8:ValueTable" },
        Columns: {
          AdditionalColumns: [
            {
              _table: "Таблица.Первая",
              Column: [
                { _name: "Код", _id: "1", Type: { "v8:Type": "xs:string" } },
                { _name: "Сумма", _id: "2", Type: { "v8:Type": "xs:decimal" } },
              ],
            },
            {
              _table: "Таблица.Вторая",
              Column: [
                { _name: "Код", _id: "1", Type: { "v8:Type": "xs:string" } },
                { _name: "Признак", _id: "2", Type: { "v8:Type": "xs:boolean" } },
              ],
            },
          ],
        },
      },
    }
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const yaml = testPropertyFromXMLToYAML({ rule, xml: source, context: contexts.importContext }).yaml
    const { xml } = testPropertyFromYAMLToXML({ rule, yaml, context: contexts.exportContext() })

    expect(xml).toMatchObject({
      Attribute: [
        {
          Columns: {
            AdditionalColumns: [
              {
                _table: "Таблица.Первая",
                Column: [
                  { _name: "Код", _id: "1" },
                  { _name: "Сумма", _id: "2" },
                ],
              },
              {
                _table: "Таблица.Вторая",
                Column: [
                  { _name: "Код", _id: "1" },
                  { _name: "Признак", _id: "2" },
                ],
              },
            ],
          },
        },
      ],
    })
  })

  it("не создаёт настройки динамического списка у обычного реквизита без reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "БизнесПроцесс.Заказ.Форма.ФормаЗадачи",
    })
    const source = {
      Attribute: {
        _name: "Объект",
        _id: "1",
        Type: { "v8:Type": "cfg:BusinessProcessObject.Заказ" },
        MainAttribute: true,
        SavedData: true,
      },
    }
    const yaml = testPropertyFromXMLToYAML({
      rule,
      xml: source,
      context: contexts.importContext,
    }).yaml
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml,
      context: contexts.exportContext(),
    })

    expect(xml).toEqual({ Attribute: [source.Attribute] })
  })

})

function roundTripFixture(fixture: string, withReference: boolean): { expected: string; result: string } {
  const expected = readFormAttributeFixture(fixture)
  const parsed = importContentFromXML<Record<string, unknown>>(expected, {
    preserveEmptyElements: true,
    preserveXsiNil: true,
  })
  const contexts = createDirectRoundTripContexts({
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
  })
  const imported = testPropertyFromXMLToYAML({
    context: contexts.importContext,
    rule,
    xml: parsed,
  })
  const exportContext = contexts.exportContext()
  const converted = testPropertyFromYAMLToXML({
    context: exportContext,
    referenceXML: withReference ? parsed : undefined,
    rule,
    yaml: imported.yaml,
  })
  return { expected, result: withoutDeclaration(xmlExport(converted.xml, false)) }
}

function readFormAttributeFixture(fixture: string): string {
  return fs.readFileSync(fileURLToPath(new URL(`__fixtures__/${fixture}`, import.meta.url)), "utf8")
}

function withoutDeclaration(xml: string): string {
  return xml.replace(/^\uFEFF?<\?xml[^>]+>\s*/, "").trim()
}
