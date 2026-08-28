import {
  parseMetadataYaml,
  parseXmlDocumentWithSaxes,
  parseXmlRootStructuresWithSaxes,
  serializeYAMLDocument,
  xmlAnnotatedMappingEntries,
  yamlScalarTagAt,
  type XmlAnomalyRuntime,
} from "@nkdk/runtime"
import {
  composeMetadataRules,
  createRuleRegistrySet,
  defineMetadataRules,
  definePropertyTypeRule,
  emptyMetadataRules,
  propertyTypesFromContributions,
  withPropertyRuleRegistrySet,
  withRuleRegistrySet,
  convertMetadataItemFromYAMLToXML,
  convertPropertiesFromYAMLToXML,
  bindDeferredObjectValues,
  type MetadataItemRule,
  type YAMLToXMLNestedRule,
} from "@nkdk/runtime/rule-kit"
import { describe, expect, it, vi } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { metadataRules } from "../composition/metadataRules"
import "../../tests/metadataExecutionContext"
import {
  clientApplicationFormYamlToXmlNestedRule,
  convertClientApplicationFormFromYAMLToXML,
} from "../forms/clientApplicationForm/fromYAMLToXML"
import { ClientApplicationFormRules, FormRulesTags } from "../forms/clientApplicationForm/rules"
import type { ClientApplicationFormYAML } from "../forms/clientApplicationForm/types"
import { prepareFormDataPathContextFromYAML } from "../forms/clientApplicationForm/formDataPathContext"
import { catalogOwnerCache } from "../forms/clientApplicationForm/__tests__/catalogOwnerCache"
import { MetadataCommonFormRules } from "../appliedObjects/metadataCommonForm/rules"
import { configurationExtensionYamlToXmlAugmenter } from "../appliedObjects/configurationExtension/exportPropertyStates"
import {
  createPropertyStateCapabilityRegistry,
  definePropertyStateItemCapabilities,
} from "../appliedObjects/configurationExtension/propertyStateCapabilities"
import { withOperationRegistrySet } from "../operations/operationExecutionContext"
import {
  buildPreparedAssignmentControlDocument,
  buildPreparedAssignmentXml,
} from "./xmlAnomalyAssignment"
import { prepareTestXmlAnomalyAssignment } from "../xmlAnomalies/testSupport"

const rule = {
  itemType: "SyntheticOwner",
  properties: {
    invalid: { type: "string", yaml: "Неверное", xml: "Invalid" },
    important: { type: "string", yaml: "Важное", xml: "Important" },
    expanded: { type: "string", yaml: "Развернутое", xml: "Expanded" },
    missing: { type: "string", yaml: "Отсутствует", xml: "Missing", defaultValueXML: "default" },
    compact: { type: "string", yaml: "Компактное", xml: "Compact" },
  },
} as const satisfies MetadataItemRule

const deferredControlType = "SyntheticDeferredControl" as never
const deferredControlRule = {
  itemType: "SyntheticDeferredOwner",
  properties: {
    value: { type: deferredControlType, yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

const parentPatchRule = {
  itemType: "SyntheticParentPatchOwner",
  properties: {
    known: {
      type: "string",
      yaml: "Известное",
      xml: "Known",
      xmlParents: ["Properties"],
    },
  },
} as const satisfies MetadataItemRule

const collectionItemRule = {
  itemType: "SyntheticCollectionItem",
  properties: {
    name: { type: "string", xml: "Name" },
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

type CollectionNestedRule = Extract<YAMLToXMLNestedRule, { readonly kind: "collection" }>
const resolveCollectionItemRule = vi.fn(
  (_params: Parameters<NonNullable<CollectionNestedRule["resolveItemRule"]>>[0]) => collectionItemRule,
)
const mapCollectionItemOutput = vi.fn(
  ({ xml }: Parameters<NonNullable<CollectionNestedRule["mapItemOutput"]>>[0]) => xml,
)
const collectionDescriptor = {
  kind: "collection",
  itemRule: collectionItemRule,
  yamlShape: "record",
  xmlElement: "Item",
  keyField: "name",
  resolveItemRule: resolveCollectionItemRule,
  mapItemOutput: mapCollectionItemOutput,
} as const satisfies YAMLToXMLNestedRule

const collectionOwnerRule = {
  itemType: "SyntheticCollectionOwner",
  properties: {
    items: {
      type: "SyntheticNamedCollection",
      yaml: "Реквизиты",
      xml: "Items",
    },
  },
} as const satisfies MetadataItemRule

const singletonOwnerRule = {
  itemType: "SyntheticSingletonOwner",
  properties: {
    extendedTooltip: {
      type: "ExtendedTooltip",
      yaml: "РасширеннаяПодсказка",
      xml: "ExtendedTooltip",
    },
  },
} as const satisfies MetadataItemRule

const scalarCollectionOwnerRule = {
  itemType: "SyntheticScalarCollectionOwner",
  properties: {
    order: {
      type: "StructureItemGroupCollection",
      yaml: "Порядок",
      xml: "Order",
    },
  },
} as const satisfies MetadataItemRule

const filterArrayOwnerRule = {
  itemType: "SyntheticFilterArrayOwner",
  properties: {
    filter: {
      type: "FilterItem",
      yaml: "Отбор",
      xml: "Filter",
    },
  },
} as const satisfies MetadataItemRule

const anomalyRegistries = createRuleRegistrySet(composeMetadataRules(
  metadataRules,
  defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: propertyTypesFromContributions([
      definePropertyTypeRule(
        deferredControlType,
        "finalizeExportedXML",
        ({ value }) => `${String(value)}:final`,
      ),
      definePropertyTypeRule(
        "SyntheticNamedCollection" as never,
        "yamlToXMLNestedRule",
        collectionDescriptor,
      ),
    ]),
    xmlAnomalies: [],
  }),
))

describe("единое восстановление XML-аномалий assignment", () => {
  it("считает структуру обычного документа напрямую и создаёт XML только по запросу", () => {
    const document = {
      targetXmlPath: "Root.xml",
      xml: { Root: { Value: "ordinary" } },
      deferred: [],
      rootRule: rule,
      rawBoundaries: [],
    }

    const control = buildPreparedAssignmentControlDocument({ document, context: mockContextToXML() })

    expect(control.mode).toBe("direct")
    const xml = control.materializeXml()
    expect(control.roots).toEqual(rootFingerprints(parseXmlRootStructuresWithSaxes(xml).roots))
  })

  it("строит контрольные roots из материализованного XML при отложенных значениях", () => {
    const draftXml = { Root: { Value: "draft" } }
    const control = withPropertyRuleRegistrySet(anomalyRegistries.property, () =>
      buildPreparedAssignmentControlDocument({
        document: {
          targetXmlPath: "Root.xml",
          xml: draftXml,
          deferred: bindDeferredObjectValues(draftXml, [{
            valuePath: ["Root", "Value"],
            rulePath: [{ propertyKey: "value" }],
          }]),
          rootRule: deferredControlRule,
          rawBoundaries: [],
        },
        context: mockContextToXML(),
      }),
    )

    expect(control.mode).toBe("serialized")
    expect(control.roots).toEqual(rootFingerprints(
      parseXmlRootStructuresWithSaxes(control.materializeXml()).roots,
    ))
  })

  it("использует строковый путь для смешанного XML-содержимого", () => {
    const control = buildPreparedAssignmentControlDocument({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: { "#text": "prefix", Child: "value" } },
        deferred: [],
        rootRule: rule,
        rawBoundaries: [],
      },
      context: mockContextToXML(),
    })

    expect(control.mode).toBe("serialized")
    expect(control.roots).toEqual(rootFingerprints(
      parseXmlRootStructuresWithSaxes(control.materializeXml()).roots,
    ))
  })

  it("сохраняет служебную явную строку скаляром в смысловой проекции", () => {
    const parsed = parseMetadataYaml('Неверное: "         "')
    parsed.annotations.set(parsed.data as object, "Неверное", {
      kind: "invalid",
      occurrence: 1,
      target: "value",
    })

    const prepared = prepareParsedAnomalies(parsed, { mode: "projectionOnly" })

    expect(serializeYAMLDocument(
      prepared.preparedYamlFile.data,
      prepared.preparedYamlFile.annotations,
    ).text).toBe('Неверное: !xml/invalid "         "')
  })

  it("projection-only исключает полный raw, но сохраняет его $значение", () => {
    const runtime = anomalyRuntime({})
    const parsed = parseMetadataYaml([
      "Компактное: !xml/raw",
      "  $xml: { Generated: 'true' }",
      "Развернутое: !xml/raw",
      "  $значение: '01'",
      "  $xml: { '#text': '01' }",
      "Важное: !xml/important keep",
    ].join("\n"))

    const prepared = prepareParsedAnomalies(parsed, { runtime, mode: "projectionOnly" })

    expect(prepared.preparedYamlFile.data).toEqual({ Развернутое: "01", Важное: "keep" })
    expect(prepared.rawBoundaries).toEqual([])

    expect(parseMetadataYaml("!xml/raw\n$xml: { Future: value }\n").syntaxErrors).toHaveLength(1)
  })

  it("projection-only переносит аннотацию sequence после исключённого raw на новый индекс", () => {
    const parsed = parseMetadataYaml([
      "- !xml/raw",
      "  $xml: one",
      "- !xml/important two",
    ].join("\n"))

    const prepared = prepareParsedAnomalies(parsed, { mode: "projectionOnly" })

    expect(prepared.preparedYamlFile.data).toEqual(["two"])
    expect(prepared.preparedYamlFile.annotations.at(prepared.preparedYamlFile.data as object, 0)).toMatchObject({
      kind: "important",
    })
  })

  it("передаёт invalid/important обычному экспорту и извлекает raw до fromYAML", () => {
    const yaml = [
      "Неверное: !xml/invalid bad",
      "Важное: !xml/important keep",
      "Развернутое: !xml/raw",
      "  $значение: ordinary",
      "  $xml: { '#text': '01' }",
      "Отсутствует: !xml/raw",
      "  $значение: default",
      "  $xml: null",
      "Компактное: !xml/raw",
      "  $xml: { _generated: 'yes' }",
      "Properties\\Future: !xml/raw",
      "  $xml: future",
    ].join("\n")
    const runtime = anomalyRuntime({})

    const prepared = prepareAnomalies(yaml, runtime)

    expect(prepared.itemName).toBe("Один")
    expect(prepared.preparedYamlFile.data).toEqual({
      Неверное: "bad",
      Важное: "keep",
      Развернутое: "ordinary",
      Отсутствует: "default",
    })
    expect(prepared.rawBoundaries.map(({ path }) => path)).toEqual([
      "Expanded",
      "Missing",
      "Compact",
      "Properties\\Future",
    ])
  })

  it("объединяет expanded/compact raw после deferred и подавляет default через raw null", () => {
    const yaml = [
      "Развернутое: !xml/raw",
      "  $значение: ordinary",
      "  $xml: { '#text': '01' }",
      "Отсутствует: !xml/raw",
      "  $значение: default",
      "  $xml: null",
      "Компактное: !xml/raw",
      "  $xml: { Generated: 'true' }",
      "Properties\\Future: !xml/raw",
      "  $xml: future",
    ].join("\n")
    const prepared = prepareAnomalies(yaml, anomalyRuntime({}))
    expect(prepared.rawBoundaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "Missing", value: null, hasSemanticValue: true }),
    ]))

    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Objects/One.xml",
        xml: {
          Root: {
            Expanded: "ordinary",
            Missing: "default",
            Deferred: "before",
          },
        },
        deferred: [],
        rootRule: rule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })
    const root = parseXmlDocumentWithSaxes(xml).compatibility.Root as Record<string, unknown>

    expect(root).toMatchObject({
      Expanded: "01",
      Compact: { Generated: "true" },
      Properties: { Future: "future" },
    })
    expect(root).not.toHaveProperty("Missing")
  })

  it("считает удаление XML-атрибута поправкой поверх обычного вывода свойства", () => {
    const prepared = prepareAnomalies([
      "Отсутствует: !xml/raw",
      "  $xml:",
      "    _xsi:type: xs:dateTime",
      "    '#text': 0001-01-01T00:00:00",
      "    _xsi:nil: null",
      "    '#order': ['#text']",
    ].join("\n"), anomalyRuntime({}))

    expect(prepared.rawBoundaries).toContainEqual(expect.objectContaining({
      path: "Missing",
      value: {
        "_xsi:type": "xs:dateTime",
        "#text": "0001-01-01T00:00:00",
        "_xsi:nil": null,
        "#order": ["#text"],
      },
      suppressOrdinaryOutput: false,
      hasSemanticValue: true,
    }))

    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Objects/One.xml",
        xml: { Root: { Missing: { "_xsi:nil": "true" } } },
        deferred: [],
        rootRule: rule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })

    expect(xml).toContain('<Missing xsi:type="xs:dateTime">0001-01-01T00:00:00</Missing>')
    expect(xml).not.toContain("xsi:nil")
  })

  it("дополняет известного XML-родителя raw-атрибутом, не скрывая его свойства", () => {
    const prepared = prepareAnomalies([
      "Известное: value",
      "Properties: !xml/raw",
      "  $xml:",
      "    _future: x",
    ].join("\n"), anomalyRuntime({}))

    const xml = buildKnownParentXml(prepared.rawBoundaries)

    expect(xml).toContain('<Properties future="x">')
    expect(xml).toContain("<Known>value</Known>")
  })

  it("объединяет raw-ребёнка с порядком в raw известного родителя", () => {
    const prepared = prepareAnomalies([
      "Известное: value",
      "Properties\\Future: !xml/raw",
      "  $xml: future",
      "Properties: !xml/raw",
      "  $xml:",
      "    '#order': [Known, Future]",
    ].join("\n"), anomalyRuntime({}), parentPatchRule)

    const xml = buildKnownParentXml(prepared.rawBoundaries)
    const properties = parseXmlDocumentWithSaxes(xml).roots[0]?.content
      .find((node): node is import("@nkdk/runtime").XmlElementNode =>
        node.type === "element" && node.name === "Properties"
      )

    expect(properties?.content.flatMap((node) => node.type === "element" ? [node.name] : [])).toEqual([
      "Known",
      "Future",
    ])
  })

  it("связывает raw скрытого свойства с его XML-путём из rules", () => {
    const hiddenRule = {
      itemType: "Root",
      properties: {
        templates: {
          type: "string",
          xml: "Template",
          xmlParents: ["ChildObjects"],
          toYAML: false,
          fromYAML: false,
        },
      },
    } as const satisfies MetadataItemRule
    const prepared = prepareAnomalies([
      "templates: !xml/raw",
      "  $xml: Макет",
    ].join("\n"), anomalyRuntime({}), hiddenRule)

    expect(prepared.rawBoundaries).toEqual([
      expect.objectContaining({ path: "ChildObjects\\Template" }),
    ])
  })

  it("объединяет смысловую поправку ребёнка с порядком raw-родителя", () => {
    const prepared = prepareAnomalies([
      "Известное: !xml/raw",
      "  $значение: value",
      "  $xml: original",
      "Properties: !xml/raw",
      "  $xml:",
      "    '#order': [Known]",
    ].join("\n"), anomalyRuntime({}), parentPatchRule)

    const xml = buildKnownParentXml(prepared.rawBoundaries)

    expect(xml).toContain("<Known>original</Known>")
  })

  it("дополняет корень основного XML-документа через путь @", () => {
    const prepared = prepareAnomalies([
      "'@': !xml/raw",
      "  $xml:",
      "    _future: x",
    ].join("\n"), anomalyRuntime({}), parentPatchRule)

    expect(prepared.rawBoundaries).toMatchObject([{
      path: "@",
      documentSelector: "",
      documentRootName: parentPatchRule.itemType,
    }])
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: { Known: "value" } },
        deferred: [],
        rootRule: rule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })

    expect(xml).toContain('<Root future="x">')
    expect(xml).toContain("<Known>value</Known>")
  })

  it("не изменяет исходный XML-документ при чистой сборке", () => {
    const xml = { Root: { Value: "before" } }

    buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml,
        deferred: [],
        rootRule: rule,
        rawBoundaries: [],
      },
      context: mockContextToXML(),
    })

    expect(xml).toEqual({ Root: { Value: "before" } })
  })

  it("явно дополняет XML вложенного singleton, не скрывая смысловые поля", () => {
    const prepared = prepareAnomalies([
      "РасширеннаяПодсказка: !xml/raw",
      "  $значение:",
      "    Заголовок:",
      "      Текст: Подсказка",
      "  $xml:",
      "    _name: СтароеИмяExtendedTooltip",
    ].join("\n"), anomalyRegistries.xmlAnomalies, singletonOwnerRule, anomalyRegistries)

    expect(prepared.itemName).toBe("Один")
    expect(prepared.preparedYamlFile.data).toEqual({
      РасширеннаяПодсказка: { Заголовок: { Текст: "Подсказка" } },
    })
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: {
          Root: {
            ExtendedTooltip: {
              _name: "КаноническоеИмяРасширеннаяПодсказка",
              Title: "Подсказка",
            },
          },
        },
        deferred: [],
        rootRule: singletonOwnerRule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })

    expect(xml).toContain('<ExtendedTooltip name="СтароеИмяExtendedTooltip">')
    expect(xml).toContain("<Title>Подсказка</Title>")
  })

  it("отклоняет нестроковое значение XML-атрибута", () => {
    expect(parseMetadataYaml([
      "РасширеннаяПодсказка: !xml/raw",
      "  $значение: {}",
      "  $xml: { _name: 1 }",
    ].join("\n")).syntaxErrors).toHaveLength(1)
  })

  it("адресует raw item и его поля по физическим вхождениям named collection", () => {
    resolveCollectionItemRule.mockClear()
    mapCollectionItemOutput.mockClear()
    const prepared = prepareAnomalies([
      "Реквизиты:",
      "  Код:",
      "    Значение: !xml/raw",
      "      $xml: '01'",
      "  !xml/invalid Код: !xml/raw",
      "    $xml:",
      "      Name: Код",
      "      Value: '02'",
      "  !xml/invalid/2 Код:",
      "    Значение: !xml/raw",
      "      $xml: '03'",
    ].join("\n"), anomalyRuntime({}), collectionOwnerRule, anomalyRegistries)

    const semanticCollection = (prepared.preparedYamlFile.data as Record<string, unknown>).Реквизиты as Record<string, unknown>
    expect(xmlAnnotatedMappingEntries(semanticCollection, prepared.preparedYamlFile.annotations)).toEqual([
      ["Код", {}],
      ["Код", {}],
    ])
    const physicalKeys = Object.keys(semanticCollection)
    expect(prepared.preparedYamlFile.annotations.keyAt(semanticCollection, physicalKeys[1]!)).toMatchObject({
      kind: "invalid",
      logicalKey: "Код",
      occurrence: 2,
    })
    expect(resolveCollectionItemRule.mock.calls.map(([params]) => [params.name, params.index])).toEqual([
      ["Код", 0],
      ["Код", 2],
    ])

    const ordinary = exportCollectionOwner(prepared)
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: ordinary },
        deferred: [],
        rootRule: collectionOwnerRule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })
    const root = parseXmlDocumentWithSaxes(xml).compatibility.Root as Record<string, unknown>
    const items = (root.Items as Record<string, unknown>).Item as Array<Record<string, unknown>>

    expect(items.map(({ Name, Value }) => ({ Name, Value }))).toEqual([
      { Name: "Код", Value: "01" },
      { Name: "Код", Value: "02" },
      { Name: "Код", Value: "03" },
    ])
    expect(mapCollectionItemOutput).toHaveBeenCalledTimes(2)
  })

  it("связывает raw поля form element с фактическим XML после normalize и wrapper map", () => {
    const xml = exportFormWithAnomalies([
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    Future: !xml/raw",
      "      $xml: value",
    ])

    const inputStart = xml.indexOf('<InputField name="Поле"')
    const inputEnd = xml.indexOf("</InputField>", inputStart)
    const future = xml.indexOf("<Future>value</Future>")
    expect(inputStart).toBeGreaterThan(-1)
    expect(future).toBeGreaterThan(inputStart)
    expect(inputEnd).toBeGreaterThan(future)
  })

  it("сохраняет raw-привязку при материализации неявного пути элемента формы", () => {
    const prepared = prepareAnomalies([
      "Реквизиты:",
      "  Объект:",
      "    Тип: CatalogObject.Товары",
      "    ОсновнойРеквизит: Истина",
      "Элементы:",
      "  Наименование:",
      "    Вид: ПолеВвода",
      "    Future: !xml/raw",
      "      $xml: value",
    ].join("\n"), anomalyRegistries.xmlAnomalies, ClientApplicationFormRules, anomalyRegistries)
    const yaml = prepared.preparedYamlFile.data as ClientApplicationFormYAML
    const xml = exportPreparedFormAssignment(prepared, yaml)

    expect(xml).toContain('<InputField name="Наименование"')
    expect(xml).toContain("<DataPath>Объект.Наименование</DataPath>")
    expect(xml).toContain("<Future>value</Future>")
  })

  it("сохраняет raw-привязку вложенного элемента при материализации пути владельца", () => {
    const prepared = prepareAnomalies([
      "Реквизиты:",
      "  Объект:",
      "    Тип: CatalogObject.Товары",
      "    ОсновнойРеквизит: Истина",
      "Элементы:",
      "  Таблица:",
      "    Вид: ТаблицаФормы",
      "    КонтекстноеМеню: !xml/raw",
      "      $значение:",
      "        Автозаполнение: Ложь",
      "      $xml:",
      "        Future: value",
    ].join("\n"), anomalyRegistries.xmlAnomalies, ClientApplicationFormRules, anomalyRegistries)
    const yaml = prepared.preparedYamlFile.data as ClientApplicationFormYAML
    expect(prepared.rawBoundaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining("ContextMenu"), tag: FormRulesTags.Form }),
    ]))
    const xml = exportPreparedFormAssignment(prepared, yaml)

    expect(xml).toContain('<Table name="Таблица"')
    expect(xml).toContain("<DataPath>Объект.Таблица</DataPath>")
    expect(xml).toContain("<ContextMenu")
    expect(xml).toContain("<Future>value</Future>")
  })

  it("сохраняет raw-привязку унаследованного элемента формы при построении BaseForm", () => {
    const prepared = prepareAnomalies([
      "Элементы:",
      "  Список:",
      "    Вид: ТаблицаФормы",
      "    ВыборГруппИЭлементов: !xml/raw",
      "      $значение: Группы",
      "      $xml: Folders",
    ].join("\n"), anomalyRegistries.xmlAnomalies, ClientApplicationFormRules, anomalyRegistries)
    const context = mockContextToXML()
    const converted = withPropertyRuleRegistrySet(anomalyRegistries.property, () =>
      withRuleRegistrySet(anomalyRegistries, () => clientApplicationFormYamlToXmlNestedRule.convert({
        context,
        yaml: prepared.preparedYamlFile.data,
        ownerYAML: {},
        baseYAML: {
          Реквизиты: { Список: { Тип: "ДинамическийСписок" } },
          Элементы: {
            Список: { Вид: "ТаблицаФормы", ПутьКДанным: "Список" },
          },
        },
        baseYAMLContext: context,
        name: "Форма",
        referenceXML: undefined,
      })),
    )
    if (converted === undefined) throw new Error("Управляемая форма не преобразована")
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Form.xml",
        xml: converted,
        deferred: [],
        rootRule: ClientApplicationFormRules,
        rawBoundaries: prepared.rawBoundaries,
      },
      context,
    })

    expect(xml).toContain("<ChoiceFoldersAndItems>Folders</ChoiceFoldersAndItems>")
    expect(xml).toContain("<BaseForm")
  })

  it("разрешает логическое имя локального raw через PropertyRule элемента формы", () => {
    const prepared = prepareAnomalies(
      tableRowFilterYaml().join("\n"),
      anomalyRegistries.xmlAnomalies,
      ClientApplicationFormRules,
      anomalyRegistries,
    )

    expect(prepared.rawBoundaries).toContainEqual(expect.objectContaining({
      path: "RowFilter",
      documentSelector: "Form",
    }))

    const xml = exportFormWithAnomalies(tableRowFilterYaml())
    expect(xml).toContain('<RowFilter xsi:nil="true"')
    expect(xml).not.toContain("<ОтборСтрок")
  })

  it("привязывает raw внутри внешнего XML-свойства к Rules и фактическому item", () => {
    const prepared = prepareAnomalies([
      "Форма:",
      "  Реквизиты:",
      "    Первый:",
      "      Тип: СписокЗначений",
      '      "@Form\\\\ТипЗначения": !xml/raw',
      "        $xml: null",
      "    Второй:",
      "      Тип: СписокЗначений",
      '      "@Form\\\\ТипЗначения": !xml/raw',
      "        $xml: null",
    ].join("\n"), anomalyRegistries.xmlAnomalies, MetadataCommonFormRules, anomalyRegistries)

    expect(prepared.rawBoundaries).toHaveLength(2)
    expect(prepared.rawBoundaries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "Settings",
        documentPath: "Ext/Form.xml",
        exportClaimId: expect.any(String),
      }),
      expect.objectContaining({
        path: "Settings",
        documentPath: "Ext/Form.xml",
        exportClaimId: expect.any(String),
      }),
    ]))
    expect(prepared.rawBoundaries.every(boundary => !("tag" in boundary))).toBe(true)
    expect(new Set(prepared.rawBoundaries.map(({ exportClaimId }) => exportClaimId)).size).toBe(2)
  })

  it("сохраняет привязку пустой группы дополнительных колонок после mapItemOutput", () => {
    const xml = exportFormWithAnomalies([
      "Реквизиты:",
      "  Объект:",
      "    Тип: CatalogObject.Товары",
      "    ОсновнойРеквизит: Истина",
      "    ДополнительныеКолонки:",
      "      Объект.Таблица:",
      "    Columns\\AdditionalColumns: !xml/raw",
      "      $xml:",
      "        _table: Объект.Таблица",
    ], true)

    expect(xml).toContain('<AdditionalColumns table="Объект.Таблица"')
  })

  it("сохраняет относительный XML-путь raw внутри вложенных объектов external item", () => {
    const prepared = prepareAnomalies([
      "Форма:",
      "  Реквизиты:",
      "    Список:",
      "      Тип: ДинамическийСписок",
      "      ДинамическийСписок:",
      "        Отбор:",
      "          ПредставлениеПользовательскойНастройки: !xml/raw",
      "            $значение: Отбор",
      "            $xml: { _xsi:type: 'xs:string', '#text': Отбор }",
      "        Порядок:",
      "          ПредставлениеПользовательскойНастройки: !xml/raw",
      "            $значение: Порядок",
      "            $xml: { _xsi:type: 'xs:string', '#text': Порядок }",
    ].join("\n"), anomalyRegistries.xmlAnomalies, MetadataCommonFormRules, anomalyRegistries)

    expect(prepared.rawBoundaries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "Settings\\ListSettings\\dcsset:filter\\dcsset:userSettingPresentation",
        documentPath: "Ext/Form.xml",
        exportClaimId: expect.any(String),
      }),
      expect.objectContaining({
        path: "Settings\\ListSettings\\dcsset:order\\dcsset:userSettingPresentation",
        documentPath: "Ext/Form.xml",
        exportClaimId: expect.any(String),
      }),
    ]))
  })

  it("привязывает поправку корня collection item к самому экспортированному элементу", () => {
    const prepared = prepareAnomalies([
      "Форма:",
      "  Элементы:",
      "    Метка:",
      "      Вид: Надпись",
      '      "@Form\\\\LabelDecoration": !xml/raw',
      "        $xml:",
      "          '#order': [MaxWidth, Title, ContextMenu, ExtendedTooltip]",
    ].join("\n"), anomalyRegistries.xmlAnomalies, MetadataCommonFormRules, anomalyRegistries)

    expect(prepared.rawBoundaries).toContainEqual(expect.objectContaining({
      path: "$item",
      documentPath: "Ext/Form.xml",
      exportClaimId: expect.any(String),
    }))
  })

  it("накладывает атрибуты вычисляемого collection item поверх обычного экспорта", () => {
    const yaml = [
      "Элементы:",
      "  Метка:",
      "    Вид: Надпись",
      '    "@Form\\\\РасширеннаяПодсказка": !xml/raw',
      "      $xml:",
      "        _name: МеткаExtendedTooltip",
    ]
    const prepared = prepareAnomalies(
      yaml.join("\n"),
      anomalyRegistries.xmlAnomalies,
      ClientApplicationFormRules,
      anomalyRegistries,
    )

    expect(prepared.rawBoundaries).toContainEqual(expect.objectContaining({
      path: "ExtendedTooltip",
      value: { _name: "МеткаExtendedTooltip" },
      suppressOrdinaryOutput: false,
      hasSemanticValue: true,
      exportClaimId: expect.any(String),
    }))
    expect(exportFormWithAnomalies(yaml)).toMatch(
      /<ExtendedTooltip name="МеткаExtendedTooltip" id="[^"]+"\/>/u,
    )
  })

  it("дополняет скрытый вычисляемый singleton вложенным raw, сохраняя имя и id", () => {
    const yaml = [
      "Элементы:",
      "  Метка:",
      "    Вид: Надпись",
      '    "@Form\\\\РасширеннаяПодсказка": !xml/raw',
      "      $xml:",
      "        Title:",
      '          _formatted: "true"',
      "        '#order': [Title]",
    ]

    expect(exportFormWithAnomalies(yaml)).toMatch(
      /<ExtendedTooltip name="МеткаРасширеннаяПодсказка" id="[^"]+">\s*<Title formatted="true"\/>\s*<\/ExtendedTooltip>/u,
    )
  })

  it("накладывает вложенную raw-поправку поверх имени и id вычисляемого singleton", () => {
    const yaml = [
      "Элементы:",
      "  Метка:",
      "    Вид: Надпись",
      "    РасширеннаяПодсказка: !xml/raw",
      "      $значение:",
      "        АвтоМаксимальнаяШирина: Ложь",
      "      $xml:",
      "        Title:",
      '          _formatted: "true"',
    ]

    expect(exportFormWithAnomalies(yaml)).toMatch(
      /<ExtendedTooltip name="МеткаРасширеннаяПодсказка" id="[^"]+">[\s\S]*<Title formatted="true"\/>[\s\S]*<\/ExtendedTooltip>/u,
    )
  })

  it("вставляет локальный raw в каноническую позицию xmlOrder без публичного #order", () => {
    const xml = exportFormWithAnomalies(tableRowFilterYaml())
    const document = parseXmlDocumentWithSaxes(xml)
    const table = document.roots[0]?.content
      .find((node): node is import("@nkdk/runtime").XmlElementNode =>
        node.type === "element" && node.name === "ChildItems"
      )?.content.find((node): node is import("@nkdk/runtime").XmlElementNode =>
        node.type === "element" && node.name === "Table"
      )
    const names = table?.content.flatMap((node) => node.type === "element" ? [node.name] : []) ?? []

    expect(names.indexOf("RowFilter")).toBeGreaterThan(names.indexOf("DataPath"))
    expect(names.indexOf("ContextMenu")).toBeGreaterThan(names.indexOf("RowFilter"))
    expect(tableRowFilterYaml().join("\n")).not.toContain("#order")
  })

  it("восстанавливает whole raw полиморфного form item без смыслового Вида", () => {
    const xml = exportFormWithAnomalies([
      "Элементы:",
      "  Первое:",
      "    Вид: ПолеВвода",
      "  Будущее: !xml/raw",
      "    $xml:",
      '      "#name": InputField',
      "      _name: Будущее",
      "      _id: raw-id",
      '      Future: "value"',
      "  Второе:",
      "    Вид: ПолеВвода",
    ])

    const first = xml.indexOf('<InputField name="Первое"')
    const raw = xml.indexOf('<InputField name="Будущее" id="raw-id">')
    const second = xml.indexOf('<InputField name="Второе"')
    expect(first).toBeGreaterThan(-1)
    expect(raw).toBeGreaterThan(first)
    expect(second).toBeGreaterThan(raw)
    expect(xml).toContain("<Future>value</Future>")
  })

  it.each([
    {
      name: "единственный raw item",
      yaml: [
        "Отбор:",
        "  - !xml/raw",
        "    $xml:",
        '      "#name": dcsset:item',
        "      _xsi:type: dcsset:FutureFilter",
        '      "dcsset:future": one',
      ],
      orderedValues: ["one"],
      semanticItems: 0,
    },
    {
      name: "два raw item",
      yaml: [
        "Отбор:",
        "  - !xml/raw",
        "    $xml:",
        '      "#name": dcsset:item',
        "      _xsi:type: dcsset:FutureFilter",
        '      "dcsset:future": one',
        "  - !xml/raw",
        "    $xml:",
        '      "#name": dcsset:item',
        "      _xsi:type: dcsset:FutureFilter",
        '      "dcsset:future": two',
      ],
      orderedValues: ["one", "two"],
      semanticItems: 0,
    },
    {
      name: "raw item и смысловой сосед",
      yaml: [
        "Отбор:",
        "  - !xml/raw",
        "    $xml:",
        '      "#name": dcsset:item',
        "      _xsi:type: dcsset:FutureFilter",
        '      "dcsset:future": one',
        "  - ЛевоеЗначение: .Код",
      ],
      orderedValues: ["one", "Код"],
      semanticItems: 1,
    },
  ])("восстанавливает $name реальной array collection", ({ yaml, orderedValues, semanticItems }) => {
    const xml = exportFilterArrayWithAnomalies(yaml)

    const positions = orderedValues.map((value) => xml.indexOf(`>${value}<`))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((left, right) => left - right))
    expect(xml.match(/<dcsset:item\b/g)).toHaveLength(orderedValues.length)
    expect(xml.match(/<dcsset:comparisonType\b/g) ?? []).toHaveLength(semanticItems)
    expect(xml).not.toContain("nkdkXmlAnomaly")
  })

  it("не материализует обычную пустую array collection без raw sidecar", () => {
    const xml = exportFilterArrayWithAnomalies(["Отбор: []"])

    expect(xml).not.toContain("<Filter")
    expect(xml).not.toContain("<dcsset:item")
  })

  it("не назначает export claim скалярным item без raw-потомков", () => {
    const prepared = prepareAnomalies([
      "Порядок:",
      "  - !xml/invalid Наименование",
      "  - !xml/important Артикул",
    ].join("\n"), anomalyRegistries.xmlAnomalies, scalarCollectionOwnerRule, anomalyRegistries)

    const ordinary = withPropertyRuleRegistrySet(anomalyRegistries.property, () =>
      withRuleRegistrySet(anomalyRegistries, () => convertMetadataItemFromYAMLToXML({
        convertProperties: convertPropertiesFromYAMLToXML,
        context: mockContextToXML(),
        yaml: prepared.preparedYamlFile.data,
        annotations: prepared.preparedYamlFile.annotations,
        rule: scalarCollectionOwnerRule,
        outputs: [{ key: "owner" }],
      }).outputs.get("owner")),
    )

    expect(ordinary).toMatchObject({
      Order: [
        { "_xsi:type": "dcsset:GroupItemField", "dcsset:field": "Наименование" },
        { "_xsi:type": "dcsset:GroupItemField", "dcsset:field": "Артикул" },
      ],
    })
  })

  it("fail-closed отклоняет коллизию служебного export claim атрибута", () => {
    const prepared = prepareAnomalies(
      "Реквизиты:\n  Код:\n    Значение: !xml/raw\n      $xml: '01'",
      anomalyRuntime({}),
      collectionOwnerRule,
      anomalyRegistries,
    )
    const ordinary = exportCollectionOwner(prepared)

    expect(() => buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: { Other: { _nkdkXmlAnomalyClaim: "item-1" }, ...ordinary } },
        deferred: [],
        rootRule: collectionOwnerRule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })).toThrow("занят и не может служить export claim")
  })

  it("объединяет атрибуты и порядок raw-родителя с обычным выводом", () => {
    const prepared = prepareAnomalies([
      "Properties: !xml/raw",
      "  $xml:",
      '    _known: "k"',
      '    _future: "x"',
      "    \"#order\": [Known, Future]",
      "Properties\\Future: !xml/raw",
      "  $xml: future",
    ].join("\n"), anomalyRuntime({}), parentPatchRule)

    expect(prepared.rawBoundaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "Properties", suppressOrdinaryOutput: false }),
      expect.objectContaining({ path: "Properties\\Future", suppressOrdinaryOutput: true }),
    ]))
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: { Properties: { _known: "k", Known: "known" } } },
        deferred: [],
        rootRule: parentPatchRule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })

    expect(xml.indexOf('known="k"')).toBeLessThan(xml.indexOf('future="x"'))
    expect(xml.indexOf("<Known>")).toBeLessThan(xml.indexOf("<Future>"))
  })

  it("сохраняет служебный порядок XML-дочерних элементов в чистой сборке", () => {
    const root = { First: "first", Second: "second" }
    Object.defineProperty(root, Symbol.for("xmlOrderedChildren"), {
      enumerable: false,
      value: [
        { key: "Second", value: "second" },
        { key: "First", value: "first" },
      ],
    })

    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: root },
        deferred: [],
        rootRule: rule,
        rawBoundaries: [],
      },
      context: mockContextToXML(),
    })

    expect(xml.indexOf("<Second>")).toBeLessThan(xml.indexOf("<First>"))
  })

  it("разрешает invalid-ключу иметь raw-значение", () => {
    const prepared = prepareAnomalies(
      "!xml/invalid Развернутое: !xml/raw\n  $xml: '01'\n",
      anomalyRuntime({}),
    )

    expect(prepared.preparedYamlFile.data).toEqual({})
    expect(prepared.rawBoundaries).toEqual([
      expect.objectContaining({ path: "Expanded", value: "01" }),
    ])
  })

  it("экспортирует режим свойства на ключе и anomaly на значении", () => {
    const prepared = prepareAnomalies([
      "!изменять Неверное: !xml/invalid bad",
      "!проверять Развернутое: !xml/raw",
      "  $xml: '01'",
    ].join("\n"), anomalyRuntime({}))
    const semantic = prepared.preparedYamlFile.data as Record<string, unknown>
    const invalidKey = Object.keys(semantic)[0]!

    expect(yamlScalarTagAt(semantic, invalidKey)).toBe("изменять")
    expect(prepared.rawBoundaries).toEqual([
      expect.objectContaining({ path: "Expanded", value: "01" }),
    ])

    const ordinary = convertMetadataItemFromYAMLToXML({
      convertProperties: convertPropertiesFromYAMLToXML,
      context: mockContextToXML(),
      yaml: semantic,
      annotations: prepared.preparedYamlFile.annotations,
      rule,
      outputs: [{ key: "owner" }],
    }).outputs.get("owner")
    expect(ordinary).toMatchObject({ Invalid: "bad" })
  })

  it("сохраняет PropertyState compact/expanded raw через serialize→parse и assignment export", () => {
    const first = parseMetadataYaml([
      "!проверять Компактное: !xml/raw",
      "  $xml: { _generated: 'yes' }",
      "!изменять Развернутое: !xml/raw",
      "  $значение: ordinary",
      "  $xml: { '#text': '01' }",
    ].join("\n"))
    const serialized = serializeYAMLDocument(first.data, first.annotations)
    const reparsed = parseMetadataYaml(serialized.text)
    const prepared = prepareParsedAnomalies(reparsed, {
      runtime: anomalyRuntime({}),
    })
    const semantic = prepared.preparedYamlFile.data as Record<string, unknown>

    expect(serialized.text).toBe([
      "!проверять Компактное: !xml/raw",
      "  $xml:",
      "    _generated: yes",
      "!изменять Развернутое: !xml/raw",
      "  $значение: ordinary",
      "  $xml:",
      '    "#text": "01"',
    ].join("\n"))
    expect(Object.keys(semantic)).toEqual(["Компактное", "Развернутое"])
    expect(yamlScalarTagAt(semantic, "Компактное")).toBe("проверять")
    expect(yamlScalarTagAt(semantic, "Развернутое")).toBe("изменять")

    const outputs = new Map<string, Record<string, unknown>>([["owner", {}]])
    const capabilities = definePropertyStateItemCapabilities(rule, {
      properties: {
        compact: { availability: "borrowed", modes: ["notify"], representation: "tagged" },
        expanded: { availability: "borrowed", modes: ["extend"], representation: "tagged" },
      },
    })
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([capabilities]),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: {
        ...mockContextToXML(),
        exportToXML: {
          ...mockContextToXML().exportToXML,
          xmlDefaultVariantByLogicalAddress: { "Synthetic.One": "adopted" },
        },
      },
      rule,
      yaml: semantic,
      outputs,
      logicalAddress: "Synthetic.One",
    }))

    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: outputs.get("owner") },
        deferred: [],
        rootRule: rule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })
    expect(xml).toContain('<Compact generated="yes"')
    expect(xml).toContain("<Expanded>01</Expanded>")
    expect(xml).toContain("<xr:Property>Compact</xr:Property>")
    expect(xml).toContain("<xr:State>Notify</xr:State>")
    expect(xml).toContain("<xr:Property>Expanded</xr:Property>")
    expect(xml).toContain("<xr:State>Extended</xr:State>")
  })
})

function rootFingerprints(
  roots: ReturnType<typeof parseXmlRootStructuresWithSaxes>["roots"],
) {
  return roots.map(({ name, path, structuralHash }) => ({ name, path, structuralHash }))
}

function exportFormWithAnomalies(lines: readonly string[], withDataPaths = false): string {
  const prepared = prepareAnomalies(
    lines.join("\n"),
    anomalyRegistries.xmlAnomalies,
    ClientApplicationFormRules,
    anomalyRegistries,
  )
  const yaml = prepared.preparedYamlFile.data as ClientApplicationFormYAML
  return exportPreparedFormAssignment(prepared, yaml, withDataPaths)
}

function exportPreparedFormAssignment(
  prepared: ReturnType<typeof prepareAnomalies>,
  yaml: ClientApplicationFormYAML,
  withDataPaths = true,
): string {
  const context = mockContextToXML()
  const formDataPathContext = withDataPaths
    ? prepareFormDataPathContextFromYAML({ yaml, ownerCache: catalogOwnerCache() })
    : undefined
  const ordinary = withPropertyRuleRegistrySet(anomalyRegistries.property, () =>
    withRuleRegistrySet(anomalyRegistries, () => convertClientApplicationFormFromYAMLToXML({
      context,
      yaml,
      annotations: prepared.preparedYamlFile.annotations,
      ...(formDataPathContext === undefined ? {} : { formDataPathContext }),
      name: "Форма",
    }).formXML),
  )

  return buildPreparedAssignmentXml({
    document: {
      targetXmlPath: "Form.xml",
      xml: { Form: ordinary },
      deferred: [],
      rootRule: ClientApplicationFormRules,
      rawBoundaries: prepared.rawBoundaries,
    },
    context,
  })
}

function tableRowFilterYaml(): readonly string[] {
  return [
    "Элементы:",
    "  Таблица:",
    "    Вид: ТаблицаФормы",
    "    ПутьКДанным: Объект.ТабличнаяЧасть",
    "    '@Form\\ОтборСтрок': !xml/raw",
    "      $xml:",
    "        _xsi:nil: 'true'",
  ]
}

function exportFilterArrayWithAnomalies(lines: readonly string[]): string {
  const prepared = prepareAnomalies(
    lines.join("\n"),
    anomalyRegistries.xmlAnomalies,
    filterArrayOwnerRule,
    anomalyRegistries,
  )
  const context = mockContextToXML()
  const ordinary = withPropertyRuleRegistrySet(anomalyRegistries.property, () =>
    withRuleRegistrySet(anomalyRegistries, () => convertMetadataItemFromYAMLToXML({
      convertProperties: convertPropertiesFromYAMLToXML,
      context,
      yaml: prepared.preparedYamlFile.data,
      annotations: prepared.preparedYamlFile.annotations,
      rule: filterArrayOwnerRule,
      outputs: [{ key: "owner" }],
    }).outputs.get("owner")),
  )
  return buildPreparedAssignmentXml({
    document: {
      targetXmlPath: "Filter.xml",
      xml: { Root: ordinary },
      deferred: [],
      rootRule: filterArrayOwnerRule,
      rawBoundaries: prepared.rawBoundaries,
    },
    context,
  })
}

function anomalyRuntime(_overrides: object): XmlAnomalyRuntime {
  return { requiresImportant: () => false }
}

function buildKnownParentXml(
  rawBoundaries: ReturnType<typeof prepareAnomalies>["rawBoundaries"],
): string {
  return buildPreparedAssignmentXml({
    document: {
      targetXmlPath: "Root.xml",
      xml: { Root: { Properties: { Known: "value" } } },
      deferred: [],
      rootRule: parentPatchRule,
      rawBoundaries,
    },
    context: mockContextToXML(),
  })
}

function prepareAnomalies(
  yaml: string,
  runtime: XmlAnomalyRuntime,
  rootRule: MetadataItemRule = rule,
  registries?: ReturnType<typeof createRuleRegistrySet>,
) {
  const parsed = parseMetadataYaml(yaml)
  const prepare = () => prepareParsedAnomalies(parsed, { runtime, rootRule })
  return registries === undefined ? prepare() : withRuleRegistrySet(registries, prepare)
}

function prepareParsedAnomalies(
  parsed: ReturnType<typeof parseMetadataYaml>,
  options: {
    readonly runtime?: XmlAnomalyRuntime
    readonly rootRule?: MetadataItemRule
    readonly mode?: "preserve" | "projectionOnly"
  },
) {
  return prepareTestXmlAnomalyAssignment({
    parsed,
    rootRule: options.rootRule ?? rule,
    ...(options.runtime === undefined ? {} : { runtime: options.runtime }),
    ...(options.mode === undefined ? {} : { mode: options.mode }),
  })
}

function exportCollectionOwner(prepared: ReturnType<typeof prepareAnomalies>) {
  return withPropertyRuleRegistrySet(anomalyRegistries.property, () =>
    withRuleRegistrySet(anomalyRegistries, () => convertMetadataItemFromYAMLToXML({
      convertProperties: convertPropertiesFromYAMLToXML,
      context: mockContextToXML(),
      yaml: prepared.preparedYamlFile.data,
      annotations: prepared.preparedYamlFile.annotations,
      rule: collectionOwnerRule,
      outputs: [{ key: "owner" }],
    }).outputs.get("owner")),
  )
}
