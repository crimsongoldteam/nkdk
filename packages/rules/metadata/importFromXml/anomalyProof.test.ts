import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  parseMetadataYaml,
  restoreXmlAnomalyAnnotations,
  serializeYAMLDocument,
  snapshotXmlAnomalyAnnotations,
  type XmlElementNode,
} from "@nkdk/runtime"
import { describe, expect, it, vi } from "vitest"
import { getTypeRule, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
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
  proveXmlAnomalyBoundaries,
  resetXmlPathIndexVisitCountForTests,
  selectXmlAnomalyRawLevel,
  xmlPathIndexVisitCountForTests,
  type XmlAnomalyProofBoundary,
} from "./anomalyProof"

const sourcePath = "/source/Owner.xml"

describe("XML anomaly proof", () => {
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
    const childItemsDescriptor = getTypeRule(
      ClientApplicationFormRules.properties.childItems.type,
      "yamlToXMLNestedRule",
    )
    expect(childItemsDescriptor?.kind).toBe("collection")
    if (childItemsDescriptor?.kind !== "collection" || childItemsDescriptor.resolveItemRule === undefined) {
      throw new Error("У GroupChildItems отсутствует dynamic resolveItemRule")
    }
    const resolver = vi.spyOn(childItemsDescriptor, "resolveItemRule")
    const data = {
      Элементы: {
        Поле: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Количество" },
      },
    }

    try {
      const boundaries = deriveXmlAnomalyProofBoundaries({
        sources: [{ sourcePath: "/source/Ext/Form.xml", role: "body", document }],
        audit,
        rule: ClientApplicationFormRules,
        data,
      })
      const boundary = boundaries.find(({ yamlPath }) =>
        yamlPath.join("/") === "Элементы/Поле/ПутьКДанным"
      )

      expect(resolver).toHaveBeenCalledOnce()
      expect(boundary?.levels?.[0]).toEqual(expect.objectContaining({
        xmlPath: "/Form[1]/ChildItems[1]/InputField[1]/DataPath[1]",
        yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
      }))

      const result = await proveXmlAnomalyBoundaries({
        data,
        annotations: { version: 1, entries: [] },
        audit: captureXmlAnomalyProofAudit({
          sources: [{ sourcePath: "/source/Ext/Form.xml", role: "body", document }],
          boundaries: [boundary!],
        }),
        exported: [{
          role: "body",
          sourcePath: "/source/Ext/Form.xml",
          document: parseXmlDocumentWithSaxes(exported),
        }],
        readSource: async (path) => {
          expect(path).toBe("/source/Ext/Form.xml")
          return source
        },
      })

      expect(result.annotations.entries).toContainEqual(expect.objectContaining({
        parentPath: ["Элементы", "Поле"],
        key: "ПутьКДанным",
        annotation: expect.objectContaining({ kind: "raw", target: "value" }),
      }))
      expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
        parentPath: ["Элементы"],
        key: "Поле",
      }))
      expect(result.data).toMatchObject({ Элементы: { Поле: { Вид: "ПолеВвода" } } })
    } finally {
      resolver.mockRestore()
    }
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
    const depth = 5_000
    const document = parseXmlDocumentWithSaxes(
      `<Root>${"<Node>".repeat(depth)}x${"</Node>".repeat(depth)}</Root>`,
    )
    resetXmlPathIndexVisitCountForTests()

    const audit = captureXmlAnomalyProofAudit({
      sources: [{ sourcePath, role: "metadata", document }],
      boundaries: [boundary("/Root[1]", ["Корень"], ["root"])],
    })

    expect(audit.boundaries).toHaveLength(1)
    expect(xmlPathIndexVisitCountForTests()).toBe(depth + 2)
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
      expected: "01",
    },
    {
      name: "неизвестный xsi:type",
      source: '<Root><Value xmlns:xsi="u" xsi:type="xs:future">true</Value></Root>',
      exported: "<Root><Value>true</Value></Root>",
      data: { Значение: true },
      expected: { "_xmlns:xsi": "u", "_xsi:type": "xs:future", "#text": "true" },
    },
    {
      name: "лишнего ребёнка",
      source: "<Root><Value><Known>ok</Known><Future>x</Future></Value></Root>",
      exported: "<Root><Value><Known>ok</Known></Value></Root>",
      data: { Значение: { Known: "ok" } },
      expected: { Known: "ok", Future: "x" },
    },
    {
      name: "явного default",
      source: "<Root><Mode>Auto</Mode></Root>",
      exported: "<Root/>",
      data: { Режим: "Auto" },
      expected: "Auto",
    },
  ])("локализует $name минимальным raw", async ({ source, exported, data, expected }) => {
    const result = await prove(source, exported, data, [
      boundary("/Root[1]/Value[1]", ["Значение"], ["value"], source.includes("<Value")),
      boundary("/Root[1]/Mode[1]", ["Режим"], ["mode"], source.includes("<Mode")),
    ].filter(({ presentInSource }) => presentInSource))

    const key = Object.keys(data)[0]!
    expect(result.data).toEqual({ [key]: expected })
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key,
        annotation: { kind: "raw", occurrence: 1, target: "value" },
      }),
    ])
    expect(result.rereadSourcePaths).toEqual([sourcePath])
  })

  it("представляет лишний экспортированный default как raw null без чтения source", async () => {
    const source = "<Root/>"
    const exported = "<Root><Mode>Auto</Mode></Root>"
    const data = {}
    const result = await prove(source, exported, data, [
      boundary("/Root[1]/Mode[1]", ["Режим"], ["mode"], false),
    ])

    expect(result.data).toEqual({ Режим: null })
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key: "Режим",
        annotation: { kind: "raw", occurrence: 1, target: "value" },
      }),
    ])
    expect(result.rereadSourcePaths).toEqual([])
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

    expect(result.data).toEqual({
      Объект: { _marker: "x", Value: "01" },
    })
    expect(result.annotations.entries).toEqual([
      expect.objectContaining({
        parentPath: [],
        key: "Объект",
        annotation: { kind: "raw", occurrence: 1, target: "value" },
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

    expect(result.data).toEqual({
      Wrapper: { _marker: "x", Value: "01" },
      Сосед: "ok",
    })
    expect(result.annotations.entries).toContainEqual(expect.objectContaining({
      parentPath: [],
      key: "Wrapper",
      annotation: expect.objectContaining({ kind: "raw" }),
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

  it("не повторяет подъём после несовпавшего родителя", async () => {
    const candidate = proofBoundary(escalationLevels())
    const visited: string[] = []

    await expect(selectXmlAnomalyRawLevel({
      boundary: candidate,
      annotations: { version: 1, entries: [] },
      verify: async (candidateLevel) => {
        visited.push(candidateLevel.xmlPath)
        return false
      },
    })).rejects.toThrow("Повторное несовпадение поднятой XML-границы")
    expect(visited).toEqual([
      "/Root[1]/Wrapper[1]/Value[1]",
      "/Root[1]/Wrapper[1]",
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
