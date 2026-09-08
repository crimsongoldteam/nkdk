import { xmlElementFromTestValue } from "../../../../tests/structuralXML"
import fs from "node:fs"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"
import { fileURLToPath } from "node:url"
import { describe,expect,it } from "vitest"

import {
createXmlAnomalyAnnotations,
createLocalXmlProof,
createXmlImportAuditSession,
parseXmlDocumentWithSaxes,
serializeYAMLDocument,
xmlElementChildren,
xmlExport
} from "@nkdk/runtime"
import { createRuleRegistrySet, createLocalIndexesCollector, createImportedDependentPropertyCollector, createDirectImportFactsCollector, createCompiledRuleExecution, createAnnotatedLocalXmlBodyConsumer, importPropertiesFromXMLToYAML, withRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import {
createDirectRoundTripContexts,
testPropertiesYamlRoundTrip,
testPropertyFromXMLToYAML,
testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"

import "../index"
import "./fromXMLToYAML"
import { FormAttributeAdditionalColumnRules,FormAttributeColumnRules,FormAttributeRules } from "./rules"
import { metadataRules } from "../../../composition/metadataRules"
import { collectImportDependencyFacts, prepareImportDependencies } from "../../../importFromXml/preparedDependencies"
import { createRegisteredMetadataRuleValidator } from "../../../validation/metadataRuleValidator"

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
  context?: ReturnType<typeof createDirectRoundTripContexts>["importContext"],
) {
  const document = parseXmlDocumentWithSaxes(xml)
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
    xml: xmlElementFromTestValue("Probe", root),
    audit,
    annotations,
    execution,
    ...(context === undefined ? {} : { context }),
  })
  return { root, audit, yaml }
}

describe("FormAttributes XML → YAML → XML", () => {

  it("проверяет общий Settings реквизита один раз", () => {
    const registries = createRuleRegistrySet(metadataRules)
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Форма.Атрибут.ДействияПроцесса" })
    const context = contexts.importContext
    const source = parseXmlDocumentWithSaxes(`
      <Attribute xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="ДействияПроцесса" id="5">
        <Type><v8:Type>v8:ValueListType</v8:Type></Type>
        <Settings xsi:type="v8:TypeDescription"><v8:TypeSet>cfg:BusinessProcessRoutePointRef</v8:TypeSet></Settings>
      </Attribute>
    `).roots[0]!
    const base = { execution: registries.execution, context, rule: FormAttributeRules,
      sources: [{ context, xml: source }], itemName: "ДействияПроцесса", yamlPath: [], rulePath: [] }
    const dependent = createImportedDependentPropertyCollector()
    const propertyFacts = createDirectImportFactsCollector()
    const first = importPropertiesFromXMLToYAML({ ...base, mode: "facts", produceResult: true,
      collector: createLocalIndexesCollector(), dependent, facts: propertyFacts,
    })
    const dependencies = attributeDependencies(registries.execution, first, dependent, propertyFacts)
    const annotations = createXmlAnomalyAnnotations()
    const roundTrip = createCompiledRuleExecution({
      execution: registries.execution,
      prepare: () => ({ context: contexts.exportContext(), name: "ДействияПроцесса", outputs: [{ key: "owner" }] }),
      consumer: ({ yaml }, receipts) => createAnnotatedLocalXmlBodyConsumer({
        key: "owner", source, proof: createLocalXmlProof(), yaml, annotations, ...receipts,
      }),
    })

    expect(importPropertiesFromXMLToYAML({ ...base, collector: createLocalIndexesCollector(), dependencies, roundTrip }))
      .toMatchObject({ Тип: "СписокЗначений" })
  })

  it.each(["before", "after", "missing"] as const)("восстанавливает пустой Settings по фактам типа: %s", (placement) => {
    const registries = createRuleRegistrySet(metadataRules)
    withRuleRegistrySet(registries, () => {
      const contexts = createDirectRoundTripContexts({ logicalAddress: "Форма.Атрибут.Список" })
      const context = contexts.importContext
      const settings = '<Settings xsi:type="v8:TypeDescription"/>'
      const source = parseXmlDocumentWithSaxes(`<Attribute name="Список" id="1">${placement === "before" ? settings : ""}<Type><v8:Type>v8:ValueListType</v8:Type></Type>${placement === "after" ? settings : ""}</Attribute>`).roots[0]!
      const dependent = createImportedDependentPropertyCollector()
      const propertyFacts = createDirectImportFactsCollector()
      const params = { execution: registries.execution, context, rule: FormAttributeRules,
        sources: [{ context, xml: source }], itemName: "Список", yamlPath: [], rulePath: [] }
      const first = importPropertiesFromXMLToYAML({ ...params, mode: "facts", produceResult: true,
        collector: createLocalIndexesCollector(), dependent, facts: propertyFacts,
      })
      const dependencies = attributeDependencies(registries.execution, first, dependent, propertyFacts)
      const writes: unknown[] = []
      const roundTrip = createCompiledRuleExecution({
        execution: registries.execution,
        prepare: () => ({ context: contexts.exportContext(), name: "Список", outputs: [{ key: "owner" }] }),
        consumer: ({ yaml }) => ({
          write({ property, value }) { if (property.propertyKey === "valueType") {
            if (placement === "before") expect(yaml).not.toHaveProperty("Тип")
            writes.push(value)
          } },
          finish: () => new Map([["owner", { type: "element", name: "Attribute", occurrence: 1, sourceId: source.id }]]),
        }),
      })
      const yaml = importPropertiesFromXMLToYAML({ ...params, collector: createLocalIndexesCollector(), dependencies, roundTrip })
      expect(writes).toEqual([{ "_xsi:type": "v8:TypeDescription" }])
      expect(yaml).toMatchObject({ Тип: "СписокЗначений" })
      expect(yaml).not.toHaveProperty("ТипЗначения")
    })
  })

  it.each([
    { types: ["v8:ValueListType"], expected: "Строка" },
    { types: ["xs:string"], expected: undefined },
    { types: ["v8:ValueListType", "xs:string"], expected: undefined },
  ])("готовит ТипЗначения по фактам до единственной проверки: $types", ({ types, expected }) => {
    const registries = createRuleRegistrySet(metadataRules)
    withRuleRegistrySet(registries, () => {
      const context = createDirectRoundTripContexts({ logicalAddress: "Форма" }).importContext
      const source = parseXmlDocumentWithSaxes(`<Root><Attributes><Attribute name="Объект" id="1">
        <Settings xsi:type="v8:TypeDescription"><v8:Type>xs:string</v8:Type></Settings>
        <Type>${types.map(type => `<v8:Type>${type}</v8:Type>`).join("")}</Type>
      </Attribute></Attributes></Root>`).roots[0]!
      const itemRule = { ...rule, properties: { value: { ...rule.properties.value, xml: "Attributes" } } }
      const dependent = createImportedDependentPropertyCollector()
      const params = { execution: registries.execution, context, rule: itemRule,
        sources: [{ context, xml: source }], yamlPath: [], rulePath: [] }
      const first = importPropertiesFromXMLToYAML({ ...params,
        collector: createLocalIndexesCollector(), dependent, mode: "facts", produceResult: true,
      })
      const facts = collectImportDependencyFacts({
        rule: itemRule, owner: { dir: "ОбщаяФорма", name: "Форма" }, yaml: first, candidates: dependent.finish(),
        execution: registries.execution,
      })
      let inspected = false
      importPropertiesFromXMLToYAML({ ...params,
        collector: createLocalIndexesCollector(), dependencies: prepareImportDependencies(facts, {}, registries.execution),
        roundTrip: { open({ rule: currentRule, yaml }) { return {
          ready({ propertyKey }) { if (currentRule === FormAttributeRules && propertyKey === "valueType") {
            expect(yaml.ТипЗначения).toBe(expected)
            inspected = true
          } },
          finish() {},
        } } },
      })
      expect(inspected).toBe(true)
    })
  })

  it("завершает обычные и дополнительные колонки до закрытия реквизита", () => {
    const context = createDirectRoundTripContexts({ logicalAddress: "Форма" }).importContext
    const root = parseXmlDocumentWithSaxes(`<Root><Attributes><Attribute name="Объект" id="1"><Columns>
      <Column name="Первая" id="2"><Type><v8:Type>xs:string</v8:Type></Type></Column>
      <AdditionalColumns table="Таблица"><Column name="Вторая" id="3"><Type><v8:Type>xs:boolean</v8:Type></Type></Column></AdditionalColumns>
    </Columns><Type><v8:Type>v8:ValueTable</v8:Type></Type></Attribute></Attributes></Root>`).roots[0]!
    const ready: string[] = []
    let closed: Record<string, unknown> | undefined
    let snapshot: Record<string, unknown> | undefined
    importPropertiesFromXMLToYAML({
      execution: createRuleRegistrySet(metadataRules).execution, context,
      rule: { ...rule, properties: { value: { ...rule.properties.value, xml: "Attributes" } } },
      sources: [{ context, xml: root }], yamlPath: [], rulePath: [], collector: createLocalIndexesCollector(),
      roundTrip: { open({ rule: itemRule, yaml }) { return {
        ready({ propertyKey }) { if (itemRule === FormAttributeRules) ready.push(propertyKey) },
        finish() { if (itemRule === FormAttributeRules) {
          expect(yaml.Колонки).toEqual({ Первая: { Заголовок: "", Тип: "Строка" } })
          expect(yaml.ДополнительныеКолонки).toEqual({ Таблица: { Вторая: { Заголовок: "", Тип: "Булево" } } })
          closed = yaml
          snapshot = structuredClone(yaml)
        } },
      } } },
    })
    expect(ready).toContain("columns")
    expect(ready).toContain("additionalColumns")
    expect(closed).toBeDefined()
    expect(closed).toEqual(snapshot)
  })

  it("проверяет готовые дополнительные колонки той же схемой, что и проект", () => {
    const registries = createRuleRegistrySet(metadataRules)
    const context = createDirectRoundTripContexts({ logicalAddress: "Форма" }).importContext
    const yaml = {
      ДополнительныеКолонки: {
        "Объект.Предметы": {
          Картинка: { Тип: "Число(10, 0)" },
        },
      },
    }

    expect(createRegisteredMetadataRuleValidator({ context, rules: registries }).validateBoundary({
      yaml,
      annotations: createXmlAnomalyAnnotations(),
      rule: FormAttributeRules,
      yamlPath: [],
    })).toEqual([])

    expect(createRegisteredMetadataRuleValidator({ context, rules: registries }).validateBoundary({
      yaml: { Колонки: { Шаг: { Тип: "Булево" } } },
      annotations: createXmlAnomalyAnnotations(),
      rule: FormAttributeAdditionalColumnRules,
      yamlPath: [],
    })).toEqual([])

    expect(createRegisteredMetadataRuleValidator({ context, rules: registries }).validateBoundary({
      yaml: { ИсходноеИмяПредмета: {} },
      annotations: createXmlAnomalyAnnotations(),
      rule: FormAttributeRules,
      yamlPath: [],
    })).toEqual([])
  })

  it("сворачивает известные дополнительные колонки ERP до первой", () => {
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Форма.Атрибут.Объект" })
    const context = {
      ...contexts.importContext,
      fromXML: {
        ...contexts.importContext.fromXML,
        currentXMLPath: "/xml/erp/Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml",
      },
    }
    const columns = ["1", "2", "3", "4", "5"].map((id) =>
      `<Column name="Реквизит1" id="${id}"><Type><v8:Type>xs:string</v8:Type></Type></Column>`
    ).join("")
    const { root, audit, yaml } = importStructuredFormAttributes(`
      <Root xmlns:v8="http://v8.1c.ru/8.1/data/core">
        <Attributes>
          <Attribute name="Объект" id="1">
            <Type><v8:Type>xs:string</v8:Type></Type>
            <Columns><AdditionalColumns table="Список.Способы">${columns}</AdditionalColumns></Columns>
          </Attribute>
        </Attributes>
      </Root>
    `, undefined, context)

    expect(audit.rawCandidates().map(({ error }) => error)).toEqual([])
    const additionalColumns = (yaml as {
      Значение: { Объект: { ДополнительныеКолонки: Record<string, Record<string, unknown>> } }
    }).Значение.Объект.ДополнительныеКолонки["Список.Способы"]!
    expect(Object.keys(additionalColumns)).toEqual(["Реквизит1"])

    const identities = context.fromXML.configurationIndex?.collector.fragment("Форма.yaml").entities
      .filter(({ logicalAddress }) => logicalAddress.includes("Колонка.Реквизит1"))
    expect(identities).toEqual([expect.objectContaining({ xmlId: "1" })])

    audit.finalize()
    const attributeNode = xmlElementChildren(xmlElementChildren(root, "Attributes")[0]!, "Attribute")[0]!
    const columnsNode = xmlElementChildren(attributeNode, "Columns")[0]!
    const additionalNode = xmlElementChildren(columnsNode, "AdditionalColumns")[0]!
    const omittedNodes = xmlElementChildren(additionalNode, "Column").slice(1)
    expect(omittedNodes.map((node) => audit.getOutcome(node).state)).toEqual(
      Array(4).fill("structurallyClaimed"),
    )
    for (const node of omittedNodes) expect(audit.getOutcome(node).boundaries[0]?.yamlPath)
      .toEqual(["Значение", "Объект", "ДополнительныеКолонки", "Список.Способы", "Реквизит1"])
  })

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

    const { yaml } = testPropertyFromXMLToYAML({ rule, xml: xmlElementFromTestValue("Probe", source), annotations })
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
      xml: xmlElementFromTestValue("Probe", {
        Attribute: {
          _name: "Список",
          Type: { "v8:Type": ["v8:ValueListType", "xs:string"] },
        },
      }),
    })
    const item = (yaml as { Значение: Record<string, Record<string, unknown>> }).Значение.Список!

    expect(item).not.toHaveProperty("ТипЗначения")
  })

  it("сохраняет непустой Settings у единственного СпискаЗначений", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml: xmlElementFromTestValue("Probe", {
        Attribute: {
          _name: "Список",
          Type: { "v8:Type": "v8:ValueListType" },
          Settings: {
            "_xsi:type": "v8:TypeDescription",
            "v8:Type": "xs:string",
            "v8:StringQualifiers": { "v8:Length": 0, "v8:AllowedLength": "Variable" },
          },
        },
      }),
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
    const xml = parseStructuralXMLWithoutCompatibility(`<Probe>${source}</Probe>`)
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

    testPropertyFromXMLToYAML({ rule, xml: xmlElementFromTestValue("Probe", xml), context: importContext })
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
    const xml = parseStructuralXMLWithoutCompatibility(`<Probe>${source}</Probe>`)
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml: xmlElementFromTestValue("Probe", xml),
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
    const xml = parseStructuralXMLWithoutCompatibility(`<Probe>${source}</Probe>`)
    const { yaml } = testPropertyFromXMLToYAML({ rule, xml: xmlElementFromTestValue("Probe", xml) })

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
      xml: xmlElementFromTestValue("Probe", {
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
      }),
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
    const yaml = testPropertyFromXMLToYAML({ rule, xml: xmlElementFromTestValue("Probe", source), context: contexts.importContext }).yaml
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
      xml: xmlElementFromTestValue("Probe", source),
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

function attributeDependencies(
  execution: ReturnType<typeof createRuleRegistrySet>["execution"],
  yaml: unknown,
  dependent: ReturnType<typeof createImportedDependentPropertyCollector>,
  propertyFacts: ReturnType<typeof createDirectImportFactsCollector>,
) {
  return prepareImportDependencies(collectImportDependencyFacts({
    rule: FormAttributeRules,
    owner: { dir: "ОбщаяФорма", name: "Форма" },
    yaml,
    candidates: dependent.finish(),
    propertyFacts: propertyFacts.finish(),
    execution,
  }), {}, execution)
}

function roundTripFixture(fixture: string, withReference: boolean): { expected: string; result: string } {
  const expected = readFormAttributeFixture(fixture)
  if (withReference) return testPropertiesYamlRoundTrip({ sourceXML: expected, rule })
  const parsed = parseStructuralXMLWithoutCompatibility(`<Probe>${expected}</Probe>`)
  const contexts = createDirectRoundTripContexts({
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
  })
  const imported = testPropertyFromXMLToYAML({
    context: contexts.importContext,
    rule,
    xml: xmlElementFromTestValue("Probe", parsed),
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
