import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  snapshotXmlAnomalyAnnotations,
  type XmlElementNode,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { MetadataCommonFormRules } from "../appliedObjects/metadataCommonForm/rules"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
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
    const value = [...document.roots[0]!.content]
      .filter((node) => node.type === "element")[0]!
      .content.filter((node) => node.type === "element")[0]!
      .content.filter((node) => node.type === "element")[0]!
    const auditSession = createXmlImportAuditSession(document.roots)
    auditSession.claim(value, {
      itemType: "Owner",
      propertyKey: "value",
      yamlPath: ["Значение"],
      rulePath: [{ propertyKey: "value" }],
    })
    const [derived] = deriveXmlAnomalyProofBoundaries({
      sources: [{ sourcePath, role: "metadata", document }],
      audit: auditSession,
      rule: {
        itemType: "Owner",
        properties: {
          value: { type: "string", yaml: "Значение", xml: "Value", xmlParents: ["Wrapper", "Inner"] },
        },
      },
    })
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
