import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  parseMetadataYaml,
  restoreXmlAnomalyAnnotations,
  serializeYAMLDocument,
  snapshotXmlAnomalyAnnotations,
  type XmlElementNode,
  type XmlImportAuditSession,
} from "@nkdk/runtime"
import { beforeAll, describe, expect, it, vi } from "vitest"
import {
  getTypeRule,
  getXMLImportPlan,
  visitXMLImportPlan,
  type MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import "../../tests/metadataExecutionContext"
import { MetadataCommonFormRules } from "../appliedObjects/metadataCommonForm/rules"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import { mockContextToXML } from "../../tests/mockContext"
import {
  buildPreparedAssignmentXml,
  prepareXmlAnomalyAssignment,
} from "../fullSyncToXml/xmlAnomalyAssignment"
import {
  captureXmlAnomalyProofAudit,
  deriveXmlAnomalyProofBoundaries,
  deriveXmlAnomalyProofPlan,
  proveXmlAnomalyBoundaries,
  resetXmlPathIndexVisitCountForTests,
  selectXmlAnomalyRawLevel,
  xmlPathIndexVisitCountForTests,
  type XmlAnomalyProofBoundary,
  type XmlAnomalyProofLevel,
} from "./anomalyProof"

const sourcePath = "/source/Owner.xml"
const formSourcePath = "/source/Ext/Form.xml"

describe("XML anomaly proof", () => {
  const deepXmlDepth = 3_000
  let deepXmlDocument: ReturnType<typeof parseXmlDocumentWithSaxes>

  beforeAll(() => {
    deepXmlDocument = parseXmlDocumentWithSaxes(
      `<Root>${"<Node>".repeat(deepXmlDepth)}x${"</Node>".repeat(deepXmlDepth)}</Root>`,
    )
  })

  it("принимает отсутствие осмысленно исключённого поддерева в контрольном XML", async () => {
    const source = "<Root><Value><Known>value</Known></Value><Sibling/></Root>"
    const { document, boundaries } = elidedValueProof(source)

    const result = await proveCapturedBoundaries({
      data: {},
      document,
      boundaries,
      exported: "<Root><Sibling/></Root>",
      source,
    })

    expect(boundaries).toContainEqual(expect.objectContaining({
      xmlPath: "/Root[1]/Value[1]",
      auditState: "semanticallyElided",
    }))
    expect(result.data).toEqual({})
    expect(result.annotations.entries).toEqual([])
    expect(result.rereadSourcePaths).toEqual([])
  })

  it("не принимает другое значение вместо осмысленно исключённого поддерева", async () => {
    const source = "<Root><Value><Known>value</Known></Value></Root>"
    const { document, boundaries } = elidedValueProof(source)

    const result = await proveCapturedBoundaries({
      data: {},
      document,
      boundaries,
      exported: "<Root><Value><Known>other</Known></Value></Root>",
      source,
    })

    expect(result.annotations.entries).toContainEqual(expect.objectContaining({
      key: "Значение",
      annotation: expect.objectContaining({ kind: "raw" }),
    }))
  })

  it("сравнивает структурно заявленное XML-only поддерево одной полной целью", async () => {
    const source = '<Root><RowFilter nil="true"><Future code="x"/></RowFilter></Root>'
    const document = parseXmlDocumentWithSaxes(source)
    const rowFilter = nestedElement(document.roots[0]!, ["RowFilter"])
    const audit = createXmlImportAuditSession(document.roots)
    const boundary = {
      itemType: "Owner",
      propertyKey: "rowFilter",
      yamlPath: ["ОтборСтрок"],
      rulePath: [{ propertyKey: "rowFilter" }],
    }
    audit.claim(rowFilter, boundary)
    expect(audit.claimStructuralSubtree(rowFilter, boundary)).toBe(true)
    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document }],
      audit,
      rule: rowFilterRule(),
    })
    const [proofBoundary] = boundaries

    expect(proofBoundary).toMatchObject({
      xmlPath: rowFilter.path,
      auditState: "structurallyClaimed",
      targetPaths: [rowFilter.path],
      capturedTargets: [{ path: rowFilter.path, signature: rowFilter.structuralHash }],
    })
    const exact = await proveCapturedBoundaries({
      data: {},
      document,
      boundaries,
      exported: source,
      source,
    })
    expect(exact.annotations.entries).toEqual([])

    const changed = await proveCapturedBoundaries({
      data: {},
      document,
      boundaries,
      exported: '<Root><RowFilter nil="true"><Future code="y"/></RowFilter></Root>',
      source,
    })
    expect(changed.annotations.entries).toContainEqual(expect.objectContaining({
      key: "ОтборСтрок",
      annotation: expect.objectContaining({ kind: "raw" }),
    }))
    expect(changed.annotations.entries).not.toContainEqual(expect.objectContaining({ key: "@" }))
  })

  it("объединяет вложенные PropertyRule одной YAML-границы до общего XML-элемента", () => {
    const document = parseXmlDocumentWithSaxes("<Root><Type><Qualifier>value</Qualifier></Type></Root>")
    const root = document.roots[0]!
    const type = root.content.find((node) => node.type === "element")!
    const qualifier = type.content.find((node) => node.type === "element")!
    const audit = createXmlImportAuditSession([root])
    audit.claim(type, { itemType: "Owner", propertyKey: "type", yamlPath: ["Тип"] })
    audit.claim(qualifier, { itemType: "Qualifier", propertyKey: "value", yamlPath: ["Тип"] })

    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document }],
      audit,
      rule: { itemType: "Owner", properties: {} },
    })

    expect(boundaries).toEqual([
      expect.objectContaining({ xmlPath: "/Root[1]/Type[1]", yamlPath: ["Тип"] }),
    ])
  })

  it("не поднимает raw на коллекцию из-за изменения её дочернего свойства", async () => {
    const source = "<Root><Items><Item><Value>01</Value></Item></Items></Root>"
    const exported = "<Root><Items><Item><Value>1</Value></Item></Items></Root>"
    const document = parseXmlDocumentWithSaxes(source)
    const root = document.roots[0]!
    const items = root.content.find((node): node is XmlElementNode => node.type === "element")!
    const item = items.content.find((node): node is XmlElementNode => node.type === "element")!
    const value = item.content.find((node): node is XmlElementNode => node.type === "element")!
    const audit = createXmlImportAuditSession([root])
    audit.claim(items, {
      itemType: "Owner",
      propertyKey: "items",
      yamlPath: ["Элементы"],
    })
    const valueBoundary = {
      itemType: "Item",
      propertyKey: "value",
      yamlPath: ["Элементы", "Один", "Значение"],
    }
    audit.claim(value, valueBoundary)
    audit.claim(value.content[0]!, valueBoundary)
    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document }],
      audit,
      rule: { itemType: "Owner", properties: {} },
    })

    const result = await proveCapturedBoundaries({
      data: { Элементы: { Один: { Значение: 1 } } },
      document,
      boundaries,
      exported,
      source,
    })

    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: ["Элементы", "Один"],
        key: "Значение",
        annotation: expect.objectContaining({ kind: "raw" }),
      }),
    ])
  })

  it("сохраняет порядок независимо принадлежащих дочерних свойств через #order", async () => {
    const { source, exported, document, properties, children } = orderProofFixture()
    const root = document.roots[0]!
    const boundaries = children.map((child, index) => orderProofBoundary({
      child,
      index,
      parent: properties,
      parentRawYamlPath: [index === 0 ? "Первое" : "Второе"],
      root,
    }))
    const data = { Первое: {}, Второе: {} }

    const result = await proveCapturedBoundaries({
      data,
      document,
      boundaries,
      exported,
      source,
    })

    expect(result.data).toEqual({
      Первое: {},
      Второе: {},
      Properties: undefined,
    })
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key: "Properties",
        annotation: expect.objectContaining({
          kind: "raw",
          xml: { "#order": ["A", "B"] },
        }),
      }),
    ])
  })

  it("не поднимает порядок вложенного XML-родителя до корня документа при неполном аудите", async () => {
    const { source, exported, document, properties, children } = orderProofFixture()
    const boundaries = children.map((child, index) => orderProofBoundary({
      child,
      index,
      parent: properties,
      parentRawYamlPath: [index === 0 ? "Первое" : "Второе"],
    }))

    const result = await proveCapturedBoundaries({
      data: { Первое: {}, Второе: {} },
      document,
      boundaries,
      exported,
      source,
    })

    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key: "Properties",
        annotation: expect.objectContaining({ xml: { "#order": ["A", "B"] } }),
      }),
    ])
  })

  it("сохраняет порядок родителя, когда raw возвращает отсутствующего при обычном экспорте ребёнка", async () => {
    const source = "<Root><Properties><A/><UnknownProperty>future</UnknownProperty><B/></Properties></Root>"
    const exported = "<Root><Properties><B/></Properties></Root>"
    const document = parseXmlDocumentWithSaxes(source)
    const properties = firstElement(document)
    const children = properties.content.filter(
      (node): node is XmlElementNode => node.type === "element" && node.name !== "UnknownProperty",
    )
    const boundaries = children.map((child, index) => orderProofBoundary({
      child,
      index,
      parent: properties,
      parentRawYamlPath: ["Properties"],
    }))

    const result = await proveCapturedBoundaries({
      data: { Первое: {}, Второе: {}, "Properties\\UnknownProperty": undefined },
      annotations: {
        version: 1,
        entries: [{
          parentPath: [],
          key: "Properties\\UnknownProperty",
          annotation: {
            kind: "raw",
            occurrence: 1,
            target: "value",
            xml: "future",
            hasSemanticValue: false,
          },
        }],
      },
      document,
      boundaries,
      exported,
      source,
    })

    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "Первое", annotation: expect.objectContaining({ kind: "raw" }) }),
      expect.objectContaining({
        key: "Properties\\UnknownProperty",
        annotation: expect.objectContaining({ kind: "raw", xml: "future" }),
      }),
      expect.objectContaining({
        key: "Properties",
        annotation: expect.objectContaining({
          kind: "raw",
          xml: { "#order": ["A", "UnknownProperty", "B"] },
        }),
      }),
    ]))
  })

  it("добавляет краткое имя дополнительного XML-документа к неизвестному raw-пути", async () => {
    const formPath = "/configuration/Forms/One/Ext/Form.xml"
    const source = "<Form><Properties><Future>x</Future></Properties></Form>"
    const exported = "<Form><Properties/></Form>"
    const document = parseXmlDocumentWithSaxes(source)
    const future = document.roots[0]?.content
      .find((node): node is XmlElementNode => node.type === "element" && node.name === "Properties")
      ?.content.find((node): node is XmlElementNode => node.type === "element" && node.name === "Future")
    if (future === undefined) throw new Error("Не найден Future")
    const proofBoundary: XmlAnomalyProofBoundary = {
      sourcePath: formPath,
      sourceRole: "body",
      xmlPath: future.path,
      yamlPath: ["Properties\\Future"],
      rulePath: ["future"],
      presentInSource: true,
    }
    const data: Record<string, unknown> = {}

    const result = await proveXmlAnomalyBoundaries({
      data,
      annotations: { version: 1, entries: [] },
      audit: captureXmlAnomalyProofAudit({
        sources: [{ sourcePath: formPath, role: "body", document }],
        boundaries: [proofBoundary],
      }),
      exported: [{
        role: "body",
        sourcePath: formPath,
        document: parseXmlDocumentWithSaxes(exported),
      }],
      readSource: async () => source,
    })

    expect(result.data).toEqual({ "@Form\\Properties\\Future": undefined })
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        key: "@Form\\Properties\\Future",
        annotation: expect.objectContaining({ kind: "raw", xml: "x" }),
      }),
    ])
  })

  it("восстанавливает порядок после локального raw дополнительного XML-документа до проверки fallback", async () => {
    const source = '<Form><Item><A/><Title formatted="true"/><B/></Item></Form>'
    const document = parseXmlDocumentWithSaxes(source)
    const root = document.roots[0]!
    const title = nestedElement(root, ["Item", "Title"])
    const proofBoundary: XmlAnomalyProofBoundary = {
      sourcePath: formSourcePath,
      sourceRole: "property",
      xmlPath: title.path,
      yamlPath: ["Форма", "Элемент", "Заголовок"],
      rulePath: ["form", "item", "title"],
      presentInSource: true,
    }
    const result = await proveXmlAnomalyBoundaries({
      data: { Форма: { Элемент: {} } },
      annotations: { version: 1, entries: [] },
      audit: captureXmlAnomalyProofAudit({
        sources: [{ sourcePath: formSourcePath, role: "property", document }],
        boundaries: [proofBoundary],
        fallbackBoundaries: [formPropertyFallback(root)],
      }),
      exported: [{
        role: "property",
        sourcePath: formSourcePath,
        document: parseXmlDocumentWithSaxes("<Form><Item><A/><B/></Item></Form>"),
      }],
      readSource: async () => source,
    })

    expect(result.annotations.entries).toContainEqual(expect.objectContaining({
      parentPath: ["Форма", "Элемент"],
      key: "@Form\\Заголовок",
      annotation: expect.objectContaining({ kind: "raw" }),
    }))
    expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
      parentPath: [],
      key: "Форма",
    }))
  })

  it("поднимает raw до однозначно адресуемого родителя повторяющегося XML-элемента", async () => {
    const source = [
      "<Form><Parameter><Inputs>",
      '<Entry><Value future="x">A</Value></Entry>',
      "<Entry><Value>B</Value></Entry>",
      "</Inputs></Parameter></Form>",
    ].join("")
    const exported = source.replace(' future="x"', "")
    const document = parseXmlDocumentWithSaxes(source)
    const root = document.roots[0]!
    const parameter = nestedElement(root, ["Parameter"])
    const inputs = nestedElement(parameter, ["Inputs"])
    const entry = nestedElement(inputs, ["Entry"])
    const value = nestedElement(entry, ["Value"])
    const yamlPath = ["Параметры", "Параметр1", "Значение"] as const
    const boundary: XmlAnomalyProofBoundary = {
      sourcePath: formSourcePath,
      sourceRole: "property",
      xmlPath: value.path,
      yamlPath,
      rulePath: ["parameters", "value"],
      presentInSource: true,
      targetPaths: [value.path],
      capturedTargets: [{
        path: value.path,
        signature: value.structuralHash,
        span: value.span,
      }],
      levels: [
        proofLevel(value, yamlPath, yamlPath),
        proofLevel(entry, yamlPath, ["Параметры", "Параметр1", "Inputs\\Entry"]),
        proofLevel(inputs, yamlPath, ["Параметры", "Параметр1", "Inputs"]),
      ],
    }

    const result = await proveXmlAnomalyBoundaries({
      data: { Параметры: { Параметр1: { Значение: "A" } } },
      annotations: { version: 1, entries: [] },
      audit: captureXmlAnomalyProofAudit({
        sources: [{ sourcePath: formSourcePath, role: "property", document }],
        boundaries: [boundary],
        itemAnchors: [{
          sourcePath: formSourcePath,
          xmlPath: parameter.path,
          yamlPath: ["Параметры", "Параметр1"],
          rulePath: ["parameters"],
        }],
      }),
      exported: [{
        role: "property",
        sourcePath: formSourcePath,
        document: parseXmlDocumentWithSaxes(exported),
      }],
      readSource: async () => source,
    })

    expect(result.data).toEqual({
      Параметры: { Параметр1: { "@Form\\Inputs": undefined } },
    })
    expect(result.annotations.entries).toContainEqual(expect.objectContaining({
      parentPath: ["Параметры", "Параметр1"],
      key: "@Form\\Inputs",
      annotation: expect.objectContaining({ kind: "raw" }),
    }))
  })

  it("считает вложенное владение коллекции и свойства одной скомпилированной границей", () => {
    const document = parseXmlDocumentWithSaxes(
      "<Root><Item><Type><Qualifier>value</Qualifier></Type></Item></Root>",
    )
    const root = document.roots[0]!
    const item = root.content.find((node) => node.type === "element")!
    const type = item.content.find((node) => node.type === "element")!
    const qualifier = type.content.find((node) => node.type === "element")!
    const audit = createXmlImportAuditSession([root])
    audit.claim(item, { itemType: "Item", yamlPath: ["Элементы", "Один"] })
    audit.claim(type, { itemType: "Item", yamlPath: ["Элементы", "Один"] })
    audit.claim(type, {
      itemType: "Item",
      propertyKey: "type",
      yamlPath: ["Элементы", "Один", "Тип"],
    })
    audit.claim(qualifier, {
      itemType: "Qualifier",
      propertyKey: "value",
      yamlPath: ["Элементы", "Один", "Тип"],
    })

    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document }],
      audit,
      rule: { itemType: "Owner", properties: {} },
    })

    expect(boundaries).toContainEqual(expect.objectContaining({
      xmlPath: "/Root[1]/Item[1]/Type[1]",
      yamlPath: ["Элементы", "Один", "Тип"],
    }))
    expect(boundaries).not.toContainEqual(expect.objectContaining({
      yamlPath: ["Элементы", "Один"],
    }))
  })

  it("не создаёт запасную proof-границу для присутствующего составного свойства", () => {
    const document = parseXmlDocumentWithSaxes(
      "<MetaDataObject><Items><Item/></Items></MetaDataObject>",
    )
    const audit = createXmlImportAuditSession(document.roots)

    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document }],
      audit,
      rule: {
        itemType: "Owner",
        properties: { items: { type: "ItemCollection", xml: "Items", yaml: "Элементы" } },
      },
    })

    expect(boundaries).toEqual([])
  })

  it("планирует отсутствующее вложенное поле body-документа по скомпилированному PropertyRule", () => {
    const document = parseXmlDocumentWithSaxes("<Form><Properties/></Form>")
    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath: "/source/Ext/Form.xml", role: "body", document }],
      audit: createXmlImportAuditSession(document.roots),
      rule: ClientApplicationFormRules,
    })

    expect(boundaries).toContainEqual(expect.objectContaining({
      sourcePath: "/source/Ext/Form.xml",
      sourceRole: "body",
      xmlPath: "/Form[1]/Title[1]",
      yamlPath: ["Заголовок"],
      presentInSource: false,
    }))
  })

  it("планирует отсутствующее поле вложенного property-документа", () => {
    const document = parseXmlDocumentWithSaxes("<Form><Properties/></Form>")
    const metadata = parseXmlDocumentWithSaxes(
      "<MetaDataObject><CommonForm><Properties/></CommonForm></MetaDataObject>",
    )
    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [
        { sourcePath: "/source/CommonForm.xml", role: "metadata", document: metadata },
        { sourcePath: "/source/Ext/Form.xml", role: "property", document },
      ],
      audit: createXmlImportAuditSession([...metadata.roots, ...document.roots]),
      rule: MetadataCommonFormRules,
    })

    expect(boundaries).toContainEqual(expect.objectContaining({
      sourcePath: "/source/Ext/Form.xml",
      sourceRole: "property",
      xmlPath: "/Form[1]/Title[1]",
      yamlPath: ["Форма", "Заголовок"],
      presentInSource: false,
    }))
  })

  it("планирует одну границу для альтернативных свойств с общим XML-путём", () => {
    const document = parseXmlDocumentWithSaxes("<Root/>")
    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "body", document }],
      audit: createXmlImportAuditSession(document.roots),
      rule: {
        itemType: "AlternativeOwner",
        properties: {
          first: { type: "string", xml: "Settings", yaml: "Первое" },
          second: { type: "string", xml: "Settings", yaml: "Второе" },
        },
      },
    })

    expect(boundaries.filter(({ xmlPath }) => xmlPath === "/Root[1]/Settings[1]"))
      .toEqual([expect.objectContaining({ yamlPath: ["Первое"] })])
  })

  it("не поднимает локальное отсутствие до fallback внешнего XML-свойства", async () => {
    const result = await proveExternalPropertyFallback({
      source: "<Form><Attribute/></Form>",
      exported: "<Form><Attribute><Settings/></Attribute></Form>",
    })

    expect(result.annotations.entries).toContainEqual(expect.objectContaining({
      parentPath: ["Форма", "Реквизиты", "Список"],
      key: "ТипЗначения",
      annotation: expect.objectContaining({ kind: "raw", xml: null }),
    }))
    expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
      parentPath: [],
      key: "Форма",
    }))
  })

  it("применяет fallback внешнего XML-свойства при остаточном расхождении", async () => {
    const result = await proveExternalPropertyFallback({
      source: "<Form><Attribute/><Future/></Form>",
      exported: "<Form><Attribute><Settings/></Attribute></Form>",
    })

    expect(result.annotations.entries).toContainEqual(expect.objectContaining({
      parentPath: [],
      key: "Форма",
      annotation: expect.objectContaining({ kind: "raw" }),
    }))
  })

  it("исключает из proof формы XML-поддерево, сохранённое во внешнем файле", async () => {
    const source = "<Form><QueryText>select 1</QueryText></Form>"
    const document = parseXmlDocumentWithSaxes(source)
    const root = document.roots[0]!
    const queryText = nestedElement(root, ["QueryText"])
    const audit = createXmlImportAuditSession(document.roots)
    const queryBoundary = {
      itemType: "DynamicList",
      propertyKey: "queryText",
      propertyType: "string",
      yamlPath: ["Форма", "Реквизиты", "Список", "queryText"],
      rulePath: [{ propertyKey: "queryText" }],
    }
    audit.claim(queryText, queryBoundary)
    for (const node of queryText.content) audit.claim(node, queryBoundary)
    expect(audit.persistExternalSubtree(queryText, queryBoundary)).toBe(true)
    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath: formSourcePath, role: "property", document }],
      audit,
      rule: { itemType: "Form", properties: {} },
    })

    expect(boundaries).toContainEqual(expect.objectContaining({
      xmlPath: queryText.path,
      auditState: "externallyPersisted",
    }))
    const result = await proveFormPropertyBoundaries({
      source,
      document,
      boundaries,
      exported: "<Form/>",
    })

    expect(result.annotations.entries).toEqual([])
  })

  it("планирует отсутствующее поле каждого physical item именованной коллекции", () => {
    const document = parseXmlDocumentWithSaxes([
      "<MetaDataObject><Catalog><ChildObjects><Attribute><Properties>",
      "<Name>Код</Name>",
      "</Properties></Attribute></ChildObjects></Catalog></MetaDataObject>",
    ].join(""))
    const catalog = document.roots[0]!.content.find(
      (node): node is XmlElementNode => node.type === "element",
    )!
    const childObjects = catalog.content.find(
      (node): node is XmlElementNode => node.type === "element" && node.name === "ChildObjects",
    )!
    const attribute = childObjects.content.find(
      (node): node is XmlElementNode => node.type === "element",
    )!
    const audit = createXmlImportAuditSession(document.roots)
    audit.claim(attribute, {
      itemType: "MetadataCatalogAttribute",
      yamlPath: ["Реквизиты", "Код"],
      rulePath: [{ propertyKey: "attributes" }],
    })

    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document }],
      audit,
      rule: MetadataCatalogRules,
    })

    expect(boundaries).toContainEqual(expect.objectContaining({
      xmlPath: "/MetaDataObject[1]/Catalog[1]/ChildObjects[1]/Attribute[1]/Properties[1]/Type[1]",
      yamlPath: ["Реквизиты", "Код", "Тип"],
      rulePath: ["attributes", "type"],
      presentInSource: false,
    }))
  })

  it("планирует отсутствующий XML-default внутри элемента массива", () => {
    const document = parseXmlDocumentWithSaxes([
      '<Owner xmlns:xr="urn:xr"><Characteristics>',
      "<xr:Characteristic><xr:CharacteristicTypes/><xr:CharacteristicValues/></xr:Characteristic>",
      "</Characteristics></Owner>",
    ].join(""))
    const characteristics = document.roots[0]!.content.find(
      (node): node is XmlElementNode => node.type === "element" && node.name === "Characteristics",
    )!
    const characteristic = characteristics.content.find(
      (node): node is XmlElementNode => node.type === "element",
    )!
    const audit = createXmlImportAuditSession(document.roots)
    audit.claim(characteristic, {
      itemType: "CharacteristicsDescription",
      yamlPath: ["Характеристики", 0],
      rulePath: [{ propertyKey: "characteristics" }],
    })

    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "body", document }],
      audit,
      rule: {
        itemType: "Owner",
        properties: {
          characteristics: {
            type: "CharacteristicsDescriptions",
            xml: "Characteristics",
            yaml: "Характеристики",
          },
        },
      },
      data: { Характеристики: [{}] },
    })

    expect(boundaries).toContainEqual(expect.objectContaining({
      xmlPath: expect.stringContaining("xr:DataPathField[1]"),
      yamlPath: ["Характеристики", 0, "ПолеПутиКДанным"],
      presentInSource: false,
    }))
  })

  it("планирует отсутствующее поле формы через dynamic resolveItemRule", () => {
    const document = parseXmlDocumentWithSaxes([
      '<Form><ChildItems><InputField name="Поле" id="id-1">',
      "<Visible>true</Visible>",
      "</InputField></ChildItems></Form>",
    ].join(""))
    const root = document.roots[0]!
    const childItems = root.content.find(
      (node): node is XmlElementNode => node.type === "element" && node.name === "ChildItems",
    )!
    const input = childItems.content.find(
      (node): node is XmlElementNode => node.type === "element" && node.name === "InputField",
    )!
    const audit = createXmlImportAuditSession(document.roots)
    audit.claim(input, {
      itemType: "InputField",
      yamlPath: ["Элементы", "Поле"],
      rulePath: [{ propertyKey: "childItems" }],
    })

    const boundaries = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath: "/source/Ext/Form.xml", role: "body", document }],
      audit,
      rule: ClientApplicationFormRules,
      data: {
        Элементы: {
          Поле: { Вид: "ПолеВвода", Видимость: true },
        },
      },
    })

    expect(boundaries).toContainEqual(expect.objectContaining({
      sourcePath: "/source/Ext/Form.xml",
      sourceRole: "body",
      xmlPath: "/Form[1]/ChildItems[1]/InputField[1]/DataPath[1]",
      yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
      rulePath: ["childItems", "dataPath"],
      presentInSource: false,
    }))
  })

  it("локализует несовпадение существующего поля dynamic collection через фактическое item rule", async () => {
    const source = [
      '<Form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><ChildItems>',
      '<InputField name="Поле" id="id-1">',
      '<DataPath xsi:type="xs:string">Объект.Количество</DataPath>',
      "</InputField></ChildItems></Form>",
    ].join("")
    const exported = [
      '<Form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><ChildItems>',
      '<InputField name="Поле" id="id-1">',
      "<DataPath>Объект.Количество</DataPath>",
      "</InputField></ChildItems></Form>",
    ].join("")
    const document = parseXmlDocumentWithSaxes(source)
    const root = document.roots[0]!
    const childItems = nestedElement(root, ["ChildItems"])
    const input = nestedElement(childItems, ["InputField"])
    const dataPath = nestedElement(input, ["DataPath"])
    const audit = createXmlImportAuditSession(document.roots)
    audit.claim(input, {
      itemType: "InputField",
      yamlPath: ["Элементы", "Поле"],
      rulePath: [{ propertyKey: "childItems" }],
    })
    audit.claim(dataPath, {
      itemType: "InputField",
      propertyKey: "dataPath",
      yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
      rulePath: [
        { propertyKey: "childItems", nestedItemType: "InputField" },
        { propertyKey: "dataPath" },
      ],
    })
    const resolver = spyOnFormChildItemsResolver()
    const data = {
      Элементы: {
        Поле: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Количество" },
      },
    }

    try {
      const boundary = deriveFormDataPathBoundary(
        document,
        audit,
        data,
        ["Элементы", "Поле", "ПутьКДанным"],
      )

      expect(resolver).toHaveBeenCalledOnce()
      expect(boundary?.levels?.[0]).toEqual(expect.objectContaining({
        xmlPath: "/Form[1]/ChildItems[1]/InputField[1]/DataPath[1]",
        yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
      }))

      const result = await proveFormDataPathBoundary({ source, exported, document, data, boundary })

      expectFormDataPathRaw(result, "Поле")
      expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
        parentPath: ["Элементы"],
        key: "Поле",
      }))
      expect(result.data).toMatchObject({ Элементы: { Поле: { Вид: "ПолеВвода" } } })
    } finally {
      resolver.mockRestore()
    }
  })

  it("разрешает dynamic item rule один раз на physical item из import audit", async () => {
    const source = [
      '<Form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><ChildItems>',
      '<InputField name="Первое" id="id-1"><ChildItems>',
      '<DataPath xsi:type="xs:string">Объект.Количество</DataPath>',
      "</ChildItems></InputField>",
      '<InputField name="Второе" id="id-2"/>',
      "</ChildItems></Form>",
    ].join("")
    const exported = source.replace(' xsi:type="xs:string"', "")
    const document = parseXmlDocumentWithSaxes(source)
    const root = document.roots[0]!
    const childItems = nestedElement(root, ["ChildItems"])
    const inputs = childItems.content.filter(
      (node): node is XmlElementNode => node.type === "element" && node.name === "InputField",
    )
    const audit = createXmlImportAuditSession(document.roots)
    const physicalYamlPaths = [
      ["Элементы", "Первое"],
      ["Элементы", "Второе"],
    ] as const
    const importPlan = getXMLImportPlan({
      rule: {
        itemType: "InputField",
        properties: {
          dataPath: {
            type: "DataPath",
            yaml: "ПутьКДанным",
            xml: "DataPath",
            xmlParents: ["ChildItems"],
          },
        },
      },
      includeAllTags: true,
    })
    for (const [index, input] of inputs.entries()) {
      const yamlPath = physicalYamlPaths[index]!
      visitXMLImportPlan({
        plan: importPlan,
        xml: input,
        audit,
        auditItemBoundary: {
          itemType: "InputField",
          yamlPath,
          rulePath: [{ propertyKey: "childItems" }],
        },
        auditBoundary: ({ propertyKey, rule }) => ({
          itemType: "InputField",
          propertyKey,
          propertyType: rule.type,
          yamlPath: [...yamlPath, rule.yaml ?? propertyKey],
          rulePath: [
            { propertyKey: "childItems", nestedItemType: "InputField" },
            { propertyKey },
          ],
        }),
        visit() {},
      })
    }
    audit.finalize()

    const resolver = spyOnFormChildItemsResolver()
    const data = {
      Элементы: {
        Первое: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Количество" },
        Второе: { Вид: "ПолеВвода" },
      },
    }

    try {
      const boundary = deriveFormDataPathBoundary(
        document,
        audit,
        data,
        ["Элементы", "Первое", "ПутьКДанным"],
      )

      expect(resolver).toHaveBeenCalledTimes(2)
      expect(resolver.mock.calls.map(([input]) => ({ name: input.name, index: input.index }))).toEqual([
        { name: "Первое", index: 0 },
        { name: "Второе", index: 1 },
      ])
      expect(boundary?.levels?.[0]).toEqual(expect.objectContaining({
        xmlPath: "/Form[1]/ChildItems[1]/InputField[1]/ChildItems[1]/DataPath[1]",
        yamlPath: ["Элементы", "Первое", "ПутьКДанным"],
      }))

      const result = await proveFormDataPathBoundary({ source, exported, document, data, boundary })

      expectFormDataPathRaw(result, "Первое")
      expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
        parentPath: ["Элементы"],
        key: "Первое",
      }))
    } finally {
      resolver.mockRestore()
    }
  })

  it("сохраняет для большой dynamic-коллекции только physical item, а не все возможные отсутствия", () => {
    const itemCount = 1_000
    const items = Array.from({ length: itemCount }, (_, index) =>
      `<InputField name="Поле${index}" id="id-${index}"/>`
    )
    const document = parseXmlDocumentWithSaxes(`<Form><ChildItems>${items.join("")}</ChildItems></Form>`)
    const root = document.roots[0]!
    const childItems = nestedElement(root, ["ChildItems"])
    const audit = createXmlImportAuditSession(document.roots)
    const data: Record<string, unknown> = { Элементы: {} }
    for (const [index, input] of childItems.content
      .filter((node): node is XmlElementNode => node.type === "element")
      .entries()) {
      const name = `Поле${index}`
      audit.claim(input, {
        itemType: "InputField",
        yamlPath: ["Элементы", name],
        rulePath: [{ propertyKey: "childItems" }],
      })
      ;(data.Элементы as Record<string, unknown>)[name] = { Вид: "ПолеВвода" }
    }

    const startedAt = performance.now()
    const plan = deriveXmlAnomalyProofPlan({
      sources: [{ sourcePath: formSourcePath, role: "body", document }],
      audit,
      rule: ClientApplicationFormRules,
      data,
      includePlannedAbsences: false,
    })
    const durationMs = performance.now() - startedAt

    expect(plan.boundaries).toEqual([])
    expect(plan.itemAnchors).toHaveLength(itemCount)
    expect(durationMs).toBeLessThan(750)
  })

  it("сохраняет между проходами только хэши, координаты и пути", () => {
    const document = parseXmlDocumentWithSaxes(
      "<Root><Flag>true</Flag><Text>ok</Text><Count>12</Count></Root>",
    )
    const audit = captureXmlAnomalyProofAudit({
      sources: [{ sourcePath, role: "metadata", document }],
      boundaries: [
        boundary("/Root[1]/Flag[1]", ["Флаг"], ["flag"]),
        boundary("/Root[1]/Text[1]", ["Текст"], ["text"]),
        boundary("/Root[1]/Count[1]", ["Число"], ["count"]),
      ],
    })
    const elements = document.roots[0]!.content.filter((node) => node.type === "element")

    expect(audit.boundaries.map(({ levels }) => levels[0]?.structuralHash)).toEqual([
      elements[0]!.structuralHash,
      elements[1]!.structuralHash,
      elements[2]!.structuralHash,
    ])
    expect(audit.boundaries.map(({ levels }) => levels.length)).toEqual([1, 1, 1])
    expect(audit.boundaries[0]?.levels[0]?.span).toEqual({ start: 6, end: 23 })
    expect(JSON.stringify(audit, (_key, value) => typeof value === "bigint" ? value.toString() : value))
      .not.toMatch(/compatibilityValue|attributes|content/u)
  })

  it("строит бюджет flat YAML по compiled xmlParents, а не по YAML-depth", async () => {
    const document = parseXmlDocumentWithSaxes(
      "<Root><Wrapper><Inner><Value>01</Value></Inner><Sibling>ok</Sibling></Wrapper></Root>",
    )
    const [derived] = deriveClaimedValueBoundary(
      document,
      ["Wrapper", "Inner", "Value"],
      {
        itemType: "Owner",
        properties: {
          value: { type: "string", yaml: "Значение", xml: "Value", xmlParents: ["Wrapper", "Inner"] },
        },
      },
    )
    const captured = captureXmlAnomalyProofAudit({
      sources: [{ sourcePath, role: "metadata", document }],
      boundaries: [derived!],
    }).boundaries[0]!

    expect(captured.levels.map(({ xmlPath }) => xmlPath)).toEqual([
      "/Root[1]/Wrapper[1]/Inner[1]/Value[1]",
      "/Root[1]/Wrapper[1]/Inner[1]",
      "/Root[1]/Wrapper[1]",
    ])
    expect(captured.levels.map(({ yamlPath }) => yamlPath)).toEqual([
      ["Значение"], ["Значение"], ["Значение"],
    ])

    const visited: string[] = []
    const selected = await selectXmlAnomalyRawLevel({
      boundary: captured,
      annotations: {
        version: 1,
        entries: [{
          parentPath: [],
          key: "Сосед",
          annotation: { kind: "invalid", occurrence: 1, target: "value" },
        }],
      },
      verify: async (level) => {
        visited.push(level.xmlPath)
        return level.xmlPath.endsWith("/Inner[1]")
      },
    })
    expect(selected.xmlPath).toBe("/Root[1]/Wrapper[1]/Inner[1]")
    expect(visited).toHaveLength(2)
  })

  it("индексирует глубокий XML одним итеративным O(N) обходом", () => {
    resetXmlPathIndexVisitCountForTests()

    const audit = captureXmlAnomalyProofAudit({
      sources: [{ sourcePath, role: "metadata", document: deepXmlDocument }],
      boundaries: [boundary("/Root[1]", ["Корень"], ["root"])],
    })

    expect(audit.boundaries).toHaveLength(1)
    expect(xmlPathIndexVisitCountForTests()).toBe(deepXmlDepth + 2)
  })

  it("не индексирует весь документ повторно для каждого локального raw", async () => {
    const count = 100
    const source = `<Root>${Array.from(
      { length: count },
      (_, index) => `<Value${index}>0${index}</Value${index}>`,
    ).join("")}</Root>`
    const exported = `<Root>${Array.from(
      { length: count },
      (_, index) => `<Value${index}>${index}</Value${index}>`,
    ).join("")}</Root>`
    const document = parseXmlDocumentWithSaxes(source)
    const audit = captureXmlAnomalyProofAudit({
      sources: [{ sourcePath, role: "metadata", document }],
      boundaries: Array.from({ length: count }, (_, index) =>
        boundary(`/Root[1]/Value${index}[1]`, [`Значение${index}`], [`value${index}`])),
    })
    resetXmlPathIndexVisitCountForTests()

    const result = await proveXmlAnomalyBoundaries({
      data: Object.fromEntries(Array.from({ length: count }, (_, index) => [`Значение${index}`, index])),
      annotations: { version: 1, entries: [] },
      audit,
      exported: [{ role: "metadata", document: parseXmlDocumentWithSaxes(exported) }],
      readSource: async () => source,
    })

    expect(result.annotations.entries).toHaveLength(count)
    expect(xmlPathIndexVisitCountForTests()).toBeLessThanOrEqual((count * 2 + 1) * 2)
  })

  it.each([
    { type: "boolean", source: "<Root><Value>true</Value></Root>", data: { Значение: true } },
    { type: "string", source: "<Root><Value>ok</Value></Root>", data: { Значение: "ok" } },
    { type: "number", source: "<Root><Value>12</Value></Root>", data: { Значение: 12 } },
  ])("оставляет точный $type обычным YAML", async ({ source, data }) => {
    const result = await prove(source, source, data, [
      boundary("/Root[1]/Value[1]", ["Значение"], ["value"]),
    ])

    expect(result.data).toEqual(data)
    expect(result.annotations.entries).toEqual([])
    expect(result.rereadSourcePaths).toEqual([])
  })

  it("оставляет понятное context-invalid значение смысловым кандидатом", async () => {
    const source = "<Root><Mode>Switch</Mode></Root>"
    const data = { Режим: "Switch" }
    const result = await prove(source, source, data, [
      boundary("/Root[1]/Mode[1]", ["Режим"], ["mode"]),
    ])

    expect(result.data).toEqual(data)
    expect(result.annotations.entries).toEqual([])
    expect(result.rereadSourcePaths).toEqual([])
  })

  it("не копирует смысловое YAML-дерево, когда raw хранит только XML-поправку", async () => {
    const data = { Значение: 1 }
    const result = await prove(
      "<Root><Value>01</Value></Root>",
      "<Root><Value>1</Value></Root>",
      data,
      [boundary("/Root[1]/Value[1]", ["Значение"], ["value"])],
    )

    expect(result.data).toBe(data)
    expect(result.annotations.entries).toHaveLength(1)
  })

  it("не проверяет несовпавшую дочернюю границу внутри существующего parent raw", async () => {
    const source = "<Root><Object><Value>01</Value></Object></Root>"
    const exported = "<Root><Object><Value>1</Value></Object></Root>"
    const data = { Объект: { Значение: "01" } }
    const annotations = {
      version: 1 as const,
      entries: [{
        parentPath: [],
        key: "Объект",
        annotation: { kind: "raw" as const, occurrence: 1, target: "value" as const },
      }],
    }

    const result = await proveXmlAnomalyBoundaries({
      data,
      annotations,
      audit: captureXmlAnomalyProofAudit({
        sources: [{ sourcePath, role: "metadata", document: parseXmlDocumentWithSaxes(source) }],
        boundaries: [boundary(
          "/Root[1]/Object[1]/Value[1]",
          ["Объект", "Значение"],
          ["object", "value"],
        )],
      }),
      exported: [{ role: "metadata", document: parseXmlDocumentWithSaxes(exported) }],
      readSource: async () => { throw new Error("raw source не должен перечитываться") },
    })

    expect(result.data).toEqual(data)
    expect(result.annotations).toEqual(annotations)
    expect(result.rereadSourcePaths).toEqual([])
  })

  it.each([
    {
      name: "лексическую форму числа",
      source: "<Root><Value>01</Value></Root>",
      exported: "<Root><Value>1</Value></Root>",
      data: { Значение: 1 },
      expectedXml: { "#text": "01" },
    },
    {
      name: "неизвестный xsi:type",
      source: '<Root><Value xmlns:xsi="u" xsi:type="xs:future">true</Value></Root>',
      exported: "<Root><Value>true</Value></Root>",
      data: { Значение: true },
      expectedXml: { "_xmlns:xsi": "u", "_xsi:type": "xs:future", "#text": "true" },
    },
    {
      name: "лишнего ребёнка",
      source: "<Root><Value><Known>ok</Known><Future>x</Future></Value></Root>",
      exported: "<Root><Value><Known>ok</Known></Value></Root>",
      data: { Значение: { Known: "ok" } },
      expectedXml: { Future: "x", "#order": ["Known", "Future"] },
    },
    {
      name: "явного default",
      source: "<Root><Mode>Auto</Mode></Root>",
      exported: "<Root/>",
      data: { Режим: "Auto" },
      expectedXml: "Auto",
    },
  ])("локализует $name минимальным raw", async ({ source, exported, data, expectedXml }) => {
    const result = await prove(source, exported, data, [
      boundary("/Root[1]/Value[1]", ["Значение"], ["value"], source.includes("<Value")),
      boundary("/Root[1]/Mode[1]", ["Режим"], ["mode"], source.includes("<Mode")),
    ].filter(({ presentInSource }) => presentInSource))

    const key = Object.keys(data)[0]!
    expect(result.data).toEqual(data)
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key,
        annotation: {
          kind: "raw",
          occurrence: 1,
          target: "value",
          xml: expectedXml,
          hasSemanticValue: true,
        },
      }),
    ])
    expect(result.rereadSourcePaths).toEqual([sourcePath])
  })

  it("создаёт отсутствующего именованного владельца для точечного raw", async () => {
    const source = "<Root><Value>future</Value></Root>"
    const result = await prove(source, "<Root/>", { Коллекция: {} }, [
      boundary(
        "/Root[1]/Value[1]",
        ["Коллекция", "Элемент", "Значение"],
        ["collection", "item", "value"],
      ),
    ])

    expect(result.data).toEqual({
      Коллекция: {
        Элемент: { Значение: undefined },
      },
    })
    expect(result.annotations.entries).toContainEqual(expect.objectContaining({
      parentPath: ["Коллекция", "Элемент"],
      key: "Значение",
      annotation: expect.objectContaining({ kind: "raw", hasSemanticValue: false }),
    }))
  })

  it("представляет лишний экспортированный default как raw null без чтения source", async () => {
    const source = "<Root/>"
    const exported = "<Root><Mode>Auto</Mode></Root>"
    const data = {}
    const result = await prove(source, exported, data, [
      boundary("/Root[1]/Mode[1]", ["Режим"], ["mode"], false),
    ])

    expect(result.data).toEqual({ Режим: undefined })
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key: "Режим",
        annotation: {
          kind: "raw",
          occurrence: 1,
          target: "value",
          xml: null,
          hasSemanticValue: false,
        },
      }),
    ])
    expect(result.rereadSourcePaths).toEqual([])
    expect(serializeYAMLDocument(
      result.data,
      restoreXmlAnomalyAnnotations(result.data, result.annotations),
    ).text).toContain("Режим: !xml/raw\n  $xml:")
  })

  it("планирует raw null только после того, как контрольный экспорт действительно добавил узел", async () => {
    const source = "<Root/>"
    const document = parseXmlDocumentWithSaxes(source)
    const rule = {
      itemType: "Owner",
      properties: {
        mode: { type: "string", yaml: "Режим", xml: "Mode" },
      },
    } as const satisfies MetadataItemRule
    const result = await proveXmlAnomalyBoundaries({
      data: {},
      annotations: { version: 1, entries: [] },
      audit: captureXmlAnomalyProofAudit({
        sources: [{ sourcePath, role: "body", document }],
        boundaries: [],
      }),
      rule,
      exported: [{ role: "body", document: parseXmlDocumentWithSaxes("<Root><Mode>Auto</Mode></Root>") }],
      readSource: async () => source,
    })

    expect(result.data).toEqual({ Режим: undefined })
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key: "Режим",
        annotation: expect.objectContaining({ kind: "raw", xml: null, hasSemanticValue: false }),
      }),
    ])
    expect(result.rereadSourcePaths).toEqual([sourcePath])
  })

  it("поднимает raw ровно на один следующий уровень и останавливается на первом доказанном", async () => {
    const candidate = proofBoundary(escalationLevels())
    const visited: string[] = []

    const selected = await selectXmlAnomalyRawLevel({
      boundary: candidate,
      annotations: { version: 1, entries: [] },
      verify: async (candidateLevel) => {
        visited.push(candidateLevel.xmlPath)
        return candidateLevel.xmlPath === "/Root[1]/Wrapper[1]"
      },
    })

    expect(selected.xmlPath).toBe("/Root[1]/Wrapper[1]")
    expect(visited).toEqual([
      "/Root[1]/Wrapper[1]/Value[1]",
      "/Root[1]/Wrapper[1]",
    ])
  })

  it("поднимает production raw, если дочерний фрагмент не восстанавливает родителя", async () => {
    const source = '<Root><Wrapper marker="x"><Value>01</Value></Wrapper></Root>'
    const exported = "<Root><Wrapper><Value>1</Value></Wrapper></Root>"
    const data = { Объект: { Значение: 1 } }
    const result = await prove(source, exported, data, [
      boundary("/Root[1]/Wrapper[1]/Value[1]", ["Объект", "Значение"], ["object", "value"]),
    ])

    expect(result.data).toEqual({ Объект: { Значение: 1 } })
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key: "Объект",
        annotation: {
          kind: "raw",
          occurrence: 1,
          target: "value",
          xml: { _marker: "x", Value: "01" },
          hasSemanticValue: true,
        },
      }),
    ])
  })

  it("сохраняет поднятую compiled XML-границу через YAML serialize→parse и не поглощает sibling", async () => {
    const source = '<Root><Wrapper marker="x"><Value>01</Value></Wrapper><Sibling>ok</Sibling></Root>'
    const exported = "<Root><Wrapper><Value>1</Value></Wrapper><Sibling>ok</Sibling></Root>"
    const sourceDocument = parseXmlDocumentWithSaxes(source)
    const value = nestedElement(sourceDocument.roots[0]!, ["Wrapper", "Value"])
    const rule = {
      itemType: "SerializableLiftOwner",
      properties: {
        value: { type: "string", yaml: "Значение", xml: "Value", xmlParents: ["Wrapper"] as string[] },
        sibling: { type: "string", yaml: "Сосед", xml: "Sibling" },
      },
    } as const satisfies MetadataItemRule
    const auditSession = createXmlImportAuditSession(sourceDocument.roots)
    auditSession.claim(value, {
      itemType: rule.itemType,
      propertyKey: "value",
      yamlPath: ["Значение"],
      rulePath: [{ propertyKey: "value" }],
    })
    const [derived] = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document: sourceDocument }],
      audit: auditSession,
      rule,
      data: { Значение: 1, Сосед: "ok" },
    })
    const result = await proveXmlAnomalyBoundaries({
      data: { Значение: 1, Сосед: "ok" },
      annotations: { version: 1, entries: [] },
      audit: captureXmlAnomalyProofAudit({
        sources: [{ sourcePath, role: "metadata", document: sourceDocument }],
        boundaries: [derived!],
      }),
      exported: [{ role: "metadata", document: parseXmlDocumentWithSaxes(exported) }],
      readSource: async () => source,
    })

    expect(result.data).toEqual({ Wrapper: undefined, Сосед: "ok" })
    expect(result.annotations.entries).toContainEqual(expect.objectContaining({
      parentPath: [],
      key: "Wrapper",
      annotation: expect.objectContaining({
        kind: "raw",
        xml: { _marker: "x", Value: "01" },
        hasSemanticValue: false,
      }),
    }))

    const serialized = serializeYAMLDocument(
      result.data,
      restoreXmlAnomalyAnnotations(result.data, result.annotations),
    )
    const reparsed = parseMetadataYaml(serialized.text)
    const anomalyAssignment = prepareXmlAnomalyAssignment({
      preparedYamlFile: {
        projectPath: "Объект/Один/Свойства.yaml",
        filePath: "/project/Объект/Один/Свойства.yaml",
        role: "properties",
        owner: { dir: "Объект", name: "Один" },
        data: reparsed.data,
        annotations: reparsed.annotations,
        syntaxDiagnostics: [],
      },
      rootRule: rule,
      itemName: "Один",
    })
    const restored = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: { Sibling: "ok" } },
        deferred: [],
        rootRule: rule,
        rawBoundaries: anomalyAssignment.rawBoundaries,
      },
      context: mockContextToXML(),
    })
    const restoredDocument = parseXmlDocumentWithSaxes(restored)
    expect(restoredDocument.compatibility.Root).toMatchObject(sourceDocument.compatibility.Root as object)
    expect(restoredDocument.roots[0]!.content
      .filter((node): node is XmlElementNode => node.type === "element")
      .map(({ name }) => name)).toEqual(["Wrapper", "Sibling"])
  })

  it.each([
    ["обычное значение", collisionYaml("ordinary")],
    ["PropertyState", collisionYaml("propertyState")],
    ["XML-аннотацию", collisionYaml("important")],
    ["нумерованные физические дубли", collisionYaml("duplicates")],
  ])("атомарно отклоняет коллизию поднятого path-key с %s", async (_name, parsed) => {
    const source = '<Root><Wrapper><Inner marker="x"><Value>01</Value></Inner></Wrapper><Sibling>ok</Sibling></Root>'
    const exported = "<Root><Wrapper><Inner><Value>1</Value></Inner></Wrapper><Sibling>ok</Sibling></Root>"
    const document = parseXmlDocumentWithSaxes(source)
    const [derived] = deriveClaimedValueBoundary(
      document,
      ["Wrapper", "Inner", "Value"],
      {
        itemType: "CollisionOwner",
        properties: {
          value: { type: "string", yaml: "Значение", xml: "Value", xmlParents: ["Wrapper", "Inner"] },
          sibling: { type: "string", yaml: "Сосед", xml: "Sibling" },
        },
      },
    )
    const before = serializeYAMLDocument(parsed.data, parsed.annotations).text

    await expect(proveXmlAnomalyBoundaries({
      data: parsed.data,
      annotations: snapshotXmlAnomalyAnnotations(parsed.data, parsed.annotations),
      audit: captureXmlAnomalyProofAudit({
        sources: [{ sourcePath, role: "metadata", document }],
        boundaries: [derived!],
      }),
      exported: [{ role: "metadata", document: parseXmlDocumentWithSaxes(exported) }],
      readSource: async () => source,
    })).rejects.toThrow("Коллизия YAML-границы raw /Wrapper\\Inner")

    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toBe(before)
  })

  it("не поднимает raw на XML-родителя с независимым ordinary PropertyRule", async () => {
    const document = parseXmlDocumentWithSaxes(
      "<Root><Wrapper><Value>01</Value><Sibling>ok</Sibling></Wrapper></Root>",
    )
    const [derived] = deriveClaimedValueBoundary(
      document,
      ["Wrapper", "Value"],
      {
        itemType: "Owner",
        properties: {
          value: { type: "string", yaml: "Значение", xml: "Value", xmlParents: ["Wrapper"] },
          sibling: { type: "string", yaml: "Сосед", xml: "Sibling", xmlParents: ["Wrapper"] },
        },
      },
    )

    await expect(selectXmlAnomalyRawLevel({
      boundary: derived!,
      annotations: { version: 1, entries: [] },
      verify: async ({ xmlPath }) => xmlPath.endsWith("/Wrapper[1]"),
    })).rejects.toThrow("ordinary PropertyRule")
  })

  it("исчерпывает все безопасные уровни подъёма", async () => {
    const candidate = proofBoundary(escalationLevels())
    const visited: string[] = []

    await expect(selectXmlAnomalyRawLevel({
      boundary: candidate,
      annotations: { version: 1, entries: [] },
      verify: async (candidateLevel) => {
        visited.push(candidateLevel.xmlPath)
        return false
      },
    })).rejects.toThrow("Исчерпан бюджет подъёма XML-границы")
    expect(visited).toEqual([
      "/Root[1]/Wrapper[1]/Value[1]",
      "/Root[1]/Wrapper[1]",
      "/Root[1]",
    ])
  })

  it("не поглощает независимую аннотацию sibling при подъёме", async () => {
    const candidate = proofBoundary([
      level("/Root[1]/Wrapper[1]/Value[1]", ["Объект", "Значение"]),
      level("/Root[1]/Wrapper[1]", ["Объект"]),
    ])

    await expect(selectXmlAnomalyRawLevel({
      boundary: candidate,
      annotations: {
        version: 1,
        entries: [{
          parentPath: ["Объект"],
          key: "Сосед",
          annotation: { kind: "invalid", occurrence: 1, target: "value" },
        }],
      },
      verify: async ({ xmlPath }) => xmlPath === "/Root[1]/Wrapper[1]",
    })).rejects.toThrow("независимую YAML-аннотацию")
  })

  it("не изменяет исходные YAML и annotations при фатальной ошибке", async () => {
    const source = "<Root><First>01</First><Second>02</Second></Root>"
    const exported = "<Root><First>1</First><Second>2</Second></Root>"
    const data = { Первое: 1, Второе: 2 }
    const annotations = createXmlAnomalyAnnotations()
    const annotationSnapshot = snapshotXmlAnomalyAnnotations(data, annotations)
    const audit = captureXmlAnomalyProofAudit({
      sources: [{ sourcePath, role: "metadata", document: parseXmlDocumentWithSaxes(source) }],
      boundaries: [
        boundary("/Root[1]/First[1]", ["Первое"], ["first"]),
        proofBoundary([
          level("/Root[1]/Second[1]", ["Второе"], 1n),
          level("/Root[1]", [], 2n),
        ]),
      ],
    })

    await expect(proveXmlAnomalyBoundaries({
      data,
      annotations: annotationSnapshot,
      audit,
      exported: [{ role: "metadata", document: parseXmlDocumentWithSaxes(exported) }],
      readSource: async () => source.replace("<Second>02</Second>", ""),
    })).rejects.toThrow()
    expect(data).toEqual({ Первое: 1, Второе: 2 })
    expect(snapshotXmlAnomalyAnnotations(data, annotations)).toEqual(annotationSnapshot)
  })
})

async function prove(
  source: string,
  exported: string,
  data: Record<string, unknown>,
  boundaries: XmlAnomalyProofBoundary[],
) {
  return proveXmlAnomalyBoundaries({
    data,
    annotations: { version: 1, entries: [] },
    audit: captureXmlAnomalyProofAudit({
      sources: [{ sourcePath, role: "metadata", document: parseXmlDocumentWithSaxes(source) }],
      boundaries,
    }),
    exported: [{ role: "metadata", document: parseXmlDocumentWithSaxes(exported) }],
    readSource: async (path) => {
      expect(path).toBe(sourcePath)
      return source
    },
  })
}

function boundary(
  xmlPath: string,
  yamlPath: readonly (string | number)[],
  rulePath: readonly string[],
  presentInSource = true,
): XmlAnomalyProofBoundary {
  return {
    sourcePath,
    sourceRole: "metadata",
    xmlPath,
    yamlPath,
    rulePath,
    presentInSource,
  }
}

function proofBoundary(levels: NonNullable<XmlAnomalyProofBoundary["levels"]>): XmlAnomalyProofBoundary {
  const first = levels[0]!
  return {
    sourcePath,
    sourceRole: "metadata",
    xmlPath: first.xmlPath,
    yamlPath: first.yamlPath,
    rulePath: first.yamlPath.map(String),
    presentInSource: true,
    levels,
  }
}

function level(
  xmlPath: string,
  yamlPath: readonly (string | number)[],
  structuralHash = 1n,
): NonNullable<XmlAnomalyProofBoundary["levels"]>[number] {
  const elementName = xmlPath.match(/\/([^/[]+)\[\d+\]$/u)?.[1] ?? "Root"
  return {
    xmlPath,
    yamlPath,
    elementName,
    structuralHash,
    span: { start: 0, end: 1 },
  }
}

function escalationLevels(): NonNullable<XmlAnomalyProofBoundary["levels"]> {
  return [
    level("/Root[1]/Wrapper[1]/Value[1]", ["Объект", "Значение"]),
    level("/Root[1]/Wrapper[1]", ["Объект"]),
    level("/Root[1]", []),
  ]
}

function deriveClaimedValueBoundary(
  document: ReturnType<typeof parseXmlDocumentWithSaxes>,
  elementPath: readonly string[],
  rule: MetadataItemRule,
) {
  const audit = createXmlImportAuditSession(document.roots)
  audit.claim(nestedElement(document.roots[0]!, elementPath), {
    itemType: rule.itemType,
    propertyKey: "value",
    yamlPath: ["Значение"],
    rulePath: [{ propertyKey: "value" }],
  })
  return deriveXmlAnomalyProofBoundaries({
    sources: [{ sourcePath, role: "metadata", document }],
    audit,
    rule,
  })
}

function singleValueRule(): MetadataItemRule {
  return {
    itemType: "Owner",
    properties: {
      value: { type: "string", xml: "Value", yaml: "Значение" },
    },
  } as MetadataItemRule
}

function elidedValueProof(source: string) {
  const document = parseXmlDocumentWithSaxes(source)
  const value = nestedElement(document.roots[0]!, ["Value"])
  const audit = createXmlImportAuditSession(document.roots)
  const boundary = {
    itemType: "Owner",
    propertyKey: "value",
    yamlPath: ["Значение"],
    rulePath: [{ propertyKey: "value" }],
  }
  for (const outcome of audit.outcomes()) {
    if (outcome.node.path.startsWith(value.path)) audit.claim(outcome.node, boundary)
  }
  expect(audit.elideSubtree(value, boundary)).toBe(true)
  return {
    document,
    boundaries: deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document }],
      audit,
      rule: singleValueRule(),
    }),
  }
}

function rowFilterRule(): MetadataItemRule {
  return {
    itemType: "Owner",
    properties: {
      rowFilter: { type: "string", xml: "RowFilter", yaml: "ОтборСтрок", fromXML: false },
    },
  } as MetadataItemRule
}

function spyOnFormChildItemsResolver() {
  const descriptor = getTypeRule(
    ClientApplicationFormRules.properties.childItems.type,
    "yamlToXMLNestedRule",
  )
  expect(descriptor?.kind).toBe("collection")
  if (descriptor?.kind !== "collection" || descriptor.resolveItemRule === undefined) {
    throw new Error("У GroupChildItems отсутствует dynamic resolveItemRule")
  }
  return vi.spyOn(descriptor, "resolveItemRule")
}

function firstElement(document: ReturnType<typeof parseXmlDocumentWithSaxes>): XmlElementNode {
  const element = document.roots[0]?.content.find(
    (node): node is XmlElementNode => node.type === "element",
  )
  if (element === undefined) throw new Error("Не найден первый XML-элемент")
  return element
}

function proveCapturedBoundaries(params: {
  readonly data: unknown
  readonly annotations?: Parameters<typeof proveXmlAnomalyBoundaries>[0]["annotations"]
  readonly document: ReturnType<typeof parseXmlDocumentWithSaxes>
  readonly boundaries: readonly XmlAnomalyProofBoundary[]
  readonly exported: string
  readonly source: string
}) {
  return proveXmlAnomalyBoundaries({
    data: params.data,
    annotations: params.annotations ?? { version: 1, entries: [] },
    audit: captureXmlAnomalyProofAudit({
      sources: [{ sourcePath, role: "metadata", document: params.document }],
      boundaries: params.boundaries,
    }),
    exported: [{ role: "metadata", document: parseXmlDocumentWithSaxes(params.exported) }],
    readSource: async () => params.source,
  })
}

function orderProofBoundary(params: {
  readonly child: XmlElementNode
  readonly index: number
  readonly parent: XmlElementNode
  readonly parentRawYamlPath: readonly (string | number)[]
  readonly root?: XmlElementNode
}): XmlAnomalyProofBoundary {
  const yamlPath = [params.index === 0 ? "Первое" : "Второе"] as const
  return {
    sourcePath,
    sourceRole: "metadata",
    xmlPath: params.child.path,
    yamlPath,
    rulePath: [params.child.name],
    presentInSource: true,
    levels: [{
      xmlPath: params.child.path,
      yamlPath,
      rawYamlPath: yamlPath,
      elementName: params.child.name,
      structuralHash: params.child.structuralHash,
      span: params.child.span,
    }, {
      xmlPath: params.parent.path,
      yamlPath: [],
      rawYamlPath: params.parentRawYamlPath,
      elementName: params.parent.name,
      structuralHash: params.parent.structuralHash,
      span: params.parent.span,
    }, ...(params.root === undefined ? [] : [{
      xmlPath: params.root.path,
      yamlPath: [] as const,
      rawYamlPath: [] as const,
      elementName: params.root.name,
      structuralHash: params.root.structuralHash,
      span: params.root.span,
    }])],
  }
}

function orderProofFixture() {
  const source = "<Root><Properties><A/><B/></Properties></Root>"
  const exported = "<Root><Properties><B/><A/></Properties></Root>"
  const document = parseXmlDocumentWithSaxes(source)
  const properties = firstElement(document)
  const children = properties.content.filter(
    (node): node is XmlElementNode => node.type === "element",
  )
  return { source, exported, document, properties, children }
}

function deriveFormDataPathBoundary(
  document: ReturnType<typeof parseXmlDocumentWithSaxes>,
  audit: XmlImportAuditSession,
  data: Record<string, unknown>,
  yamlPath: readonly (string | number)[],
): XmlAnomalyProofBoundary {
  const boundary = deriveXmlAnomalyProofBoundaries({
    sources: [{ sourcePath: formSourcePath, role: "body", document }],
    audit,
    rule: ClientApplicationFormRules,
    data,
  }).find((candidate) => candidate.yamlPath.join("/") === yamlPath.join("/"))
  if (boundary === undefined) throw new Error(`Не найдена proof-граница ${yamlPath.join("/")}`)
  return boundary
}

async function proveFormDataPathBoundary(params: {
  readonly source: string
  readonly exported: string
  readonly document: ReturnType<typeof parseXmlDocumentWithSaxes>
  readonly data: Record<string, unknown>
  readonly boundary: XmlAnomalyProofBoundary
}) {
  return proveXmlAnomalyBoundaries({
    data: params.data,
    annotations: { version: 1, entries: [] },
    audit: captureXmlAnomalyProofAudit({
      sources: [{ sourcePath: formSourcePath, role: "body", document: params.document }],
      boundaries: [params.boundary],
    }),
    exported: [{
      role: "body",
      sourcePath: formSourcePath,
      document: parseXmlDocumentWithSaxes(params.exported),
    }],
    readSource: async (path) => {
      expect(path).toBe(formSourcePath)
      return params.source
    },
  })
}

function expectFormDataPathRaw(
  result: Awaited<ReturnType<typeof proveXmlAnomalyBoundaries>>,
  itemName: string,
): void {
  expect(result.annotations.entries).toContainEqual(expect.objectContaining({
    parentPath: ["Элементы", itemName],
    key: "ПутьКДанным",
    annotation: expect.objectContaining({ kind: "raw", target: "value" }),
  }))
}

function nestedElement(root: XmlElementNode, path: readonly string[]): XmlElementNode {
  let current = root
  for (const name of path) {
    const child = current.content.find(
      (node): node is XmlElementNode => node.type === "element" && node.name === name,
    )
    if (child === undefined) throw new Error(`Не найден XML-элемент ${name}`)
    current = child
  }
  return current
}

function proofLevel(
  element: XmlElementNode,
  yamlPath: readonly (string | number)[],
  rawYamlPath: readonly (string | number)[],
): XmlAnomalyProofLevel {
  return {
    xmlPath: element.path,
    yamlPath,
    rawYamlPath,
    protectedYamlPaths: [],
    elementName: element.name,
    structuralHash: element.structuralHash,
    span: element.span,
  }
}

function collisionYaml(kind: "ordinary" | "propertyState" | "important" | "duplicates") {
  const collision = kind === "duplicates"
    ? ['!xml/invalid "Wrapper\\\\Inner": first', '!xml/invalid/2 "Wrapper\\\\Inner": second']
    : [`"Wrapper\\\\Inner": ${kind === "propertyState" ? "!проверять " : kind === "important" ? "!xml/important " : ""}${kind}`]
  return parseMetadataYaml([
    ...collision,
    "Значение: 1",
    "Сосед: ok",
  ].join("\n"))
}

async function proveExternalPropertyFallback(params: {
  readonly source: string
  readonly exported: string
}) {
  const document = parseXmlDocumentWithSaxes(params.source)
  const missingSettings: XmlAnomalyProofBoundary = {
    sourcePath: formSourcePath,
    sourceRole: "property",
    xmlPath: "/Form[1]/Attribute[1]/Settings[1]",
    yamlPath: ["Форма", "Реквизиты", "Список", "ТипЗначения"],
    rulePath: ["form", "attributes", "valueType"],
    presentInSource: false,
  }
  return proveFormPropertyBoundaries({
    source: params.source,
    document,
    boundaries: [missingSettings],
    exported: params.exported,
  })
}

function proveFormPropertyBoundaries(params: {
  readonly source: string
  readonly document: ReturnType<typeof parseXmlDocumentWithSaxes>
  readonly boundaries: readonly XmlAnomalyProofBoundary[]
  readonly exported: string
}) {
  const root = params.document.roots[0]!
  return proveXmlAnomalyBoundaries({
    data: { Форма: { Реквизиты: { Список: {} } } },
    annotations: { version: 1, entries: [] },
    audit: captureXmlAnomalyProofAudit({
      sources: [{ sourcePath: formSourcePath, role: "property", document: params.document }],
      boundaries: params.boundaries,
      fallbackBoundaries: [formPropertyFallback(root)],
    }),
    exported: [{
      role: "property",
      sourcePath: formSourcePath,
      document: parseXmlDocumentWithSaxes(params.exported),
    }],
    readSource: async () => params.source,
  })
}

function formPropertyFallback(root: XmlElementNode): XmlAnomalyProofBoundary {
  return {
    sourcePath: formSourcePath,
    sourceRole: "property",
    xmlPath: root.path,
    yamlPath: ["Форма"],
    rulePath: ["form"],
    presentInSource: true,
    targetPaths: [root.path],
  }
}
