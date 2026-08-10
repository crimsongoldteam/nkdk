import { describe, expect, it } from "vitest"
import { Type } from "typebox"
import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import type { RegisteredProjectSpec } from "../../projectDefinition/projectSpecRegistry"
import { compileMetadataResourceTopology } from "./compiler"
import { compileMetadataPathIndex } from "./pathIndex"
import {
  expandMetadataPathPattern,
  matchMetadataPathPattern,
} from "./patterns"
import type {
  CompiledMetadataPathCursor,
  CompiledMetadataPathIndex,
  MetadataResourceDeclaration,
} from "./types"

describe("metadata resource topology path patterns", () => {
  const pathCases = [
    {
      pattern: "Catalogs/Items.yaml",
      path: "Catalogs/Items.yaml",
      values: {},
    },
    {
      pattern: "Catalogs/{name}/Items.yaml",
      path: "Catalogs/Products/Items.yaml",
      values: { name: "Products" },
    },
    {
      pattern: "Catalogs/{name}.yaml",
      path: "Catalogs/Products.yaml",
      values: { name: "Products" },
    },
    {
      pattern: "Files/{rest...}",
      path: "Files/a/b/c.bin",
      values: { rest: "a/b/c.bin" },
    },
    {
      pattern: "{name}/{name}.yaml",
      path: "Products/Products.yaml",
      values: { name: "Products" },
    },
    {
      pattern: "{name}/{name}.yaml",
      path: "One/Two.yaml",
      values: undefined,
    },
  ] as const

  it.each(pathCases)("сохраняет договор шаблона $pattern", ({ pattern, path, values }) => {
    const index = compileMetadataPathIndex([["node", pattern]])
    const expected = values === undefined ? [] : [{ nodeId: "node", values }]

    expect(index.match(path)).toEqual(expected)
    expect(cursorMatch(index, path)).toEqual(expected)
  })

  it("сообщает, может ли курсор продолжить путь", () => {
    const exactIndex = compileMetadataPathIndex([["node", "Catalogs/Items.yaml"]])
    const catalogs = exactIndex.root().advance("Catalogs")
    const file = catalogs?.advance("Items.yaml")
    const restIndex = compileMetadataPathIndex([["node", "Files/{rest...}"]])
    const rest = restIndex.root().advance("Files")?.advance("a")

    expect(exactIndex.root().canDescend).toBe(true)
    expect(catalogs?.canDescend).toBe(true)
    expect(file?.canDescend).toBe(false)
    expect(rest?.canDescend).toBe(true)
  })

  it("matches named parameters inside path segments", () => {
    expect(
      matchMetadataPathPattern(
        "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
        "Справочник/Товары/Формы/Элемент/Форма.yaml"
      )
    ).toEqual({ ownerName: "Товары", itemName: "Элемент" })
  })

  it("expands named parameters inside path segments", () => {
    expect(
      expandMetadataPathPattern("Catalogs/{ownerName}/Forms/{itemName}.xml", {
        ownerName: "Товары",
        itemName: "Элемент",
      })
    ).toBe("Catalogs/Товары/Forms/Элемент.xml")
  })

  it("matches a remaining path only in the final segment", () => {
    expect(matchMetadataPathPattern("Files/{rest...}", "Files/a/b/c.bin")).toEqual({
      rest: "a/b/c.bin",
    })
    expect(matchMetadataPathPattern("Files/{rest...}/Tail", "Files/a/b/Tail")).toBeUndefined()
  })

  it("rejects conflicting values of a repeated parameter", () => {
    expect(matchMetadataPathPattern("{name}/{name}.xml", "One/Two.xml")).toBeUndefined()
  })
})

describe("compileMetadataResourceTopology", () => {
  it.each([
    {
      name: "параметр имени отсутствует в пути ресурса",
      declaration: { itemNameParameter: "missing" },
      message: "параметр имени",
    },
    {
      name: "шаблон каталога требует недоступный параметр",
      declaration: { itemProjectPattern: "Объект/{ownerName}/Макеты/{unknown}" },
      message: "параметр пути",
    },
  ])("отклоняет файловую цель: $name", ({ declaration, message }) => {
    const ownerRule = rule("Owner", { kind: "self", root: "Document" })
    const target = {
      kind: "member" as const,
      memberKind: "Template" as const,
      itemNameParameter: "itemName",
      itemProjectPattern: "Объект/{ownerName}/Макеты/{itemName}",
      owner: "assignment" as const,
      ...declaration,
    }

    expect(() => compileMetadataResourceTopology([
      spec("Объект", ownerRule, [
        content("Объект/{ownerName}/Свойства.yaml", ownerRule),
        external("Объект/{ownerName}/Свойства.yaml", "Объект/{ownerName}/Макеты/{itemName}/Template.xml", target),
      ]),
    ])).toThrow(message)
  })

  it("отклоняет assignmentOwner без владельца assignment", () => {
    const formRule = rule("Form", { kind: "self", root: "CommonForm" })
    const declaration = content("Формы/{itemName}/Форма.yaml", formRule) as Extract<
      MetadataResourceDeclaration,
      { kind: "content" }
    >

    expect(() => compileMetadataResourceTopology([
      spec("", formRule, [{
        ...declaration,
        fileBackedTarget: {
          kind: "member",
          memberKind: "Form",
          itemNameParameter: "itemName",
          itemProjectPattern: "Формы/{itemName}",
          owner: "assignmentOwner",
        },
      }]),
    ])).toThrow("не имеет владельца")
  })

  it("отклоняет владельца без декларации metadataTargetOwner", () => {
    const ownerRule = rule("Owner")
    const target = {
      kind: "member" as const,
      memberKind: "Template" as const,
      itemNameParameter: "itemName",
      itemProjectPattern: "Объект/{ownerName}/Макеты/{itemName}",
      owner: "assignment" as const,
    }

    expect(() => compileMetadataResourceTopology([
      spec("Объект", ownerRule, [
        content("Объект/{ownerName}/Свойства.yaml", ownerRule),
        external("Объект/{ownerName}/Свойства.yaml", "Объект/{ownerName}/Макеты/{itemName}/Template.xml", target),
      ]),
    ])).toThrow("не имеет metadataTargetOwner")
  })

  it("groups multiple XML documents around one content file", () => {
    const ownerRule = rule("Owner")
    const topology = compileMetadataResourceTopology([
      spec("Объект", ownerRule, [
        content("Объект/{ownerName}/Свойства.yaml", ownerRule),
        xml("", "Objects/{ownerName}.xml", "metadata"),
        xml("", "Objects/{ownerName}/Ext/Additional.xml", "property"),
      ]),
    ])

    expect(topology.assignments).toHaveLength(1)
    expect(topology.assignments[0]).toMatchObject({
      projectPattern: "Объект/{ownerName}/Свойства.yaml",
    })
    expect(topology.assignments[0]?.ownerProjectPattern).toBeUndefined()
    expect(topology.assignments[0]?.xmlDocuments.map((document) => [document.role, document.xmlPattern])).toEqual([
      ["metadata", "Objects/{ownerName}.xml"],
      ["property", "Objects/{ownerName}/Ext/Additional.xml"],
    ])
  })

  it("компилирует YAML-спутник внутри задания без отдельного XML-задания", () => {
    const formRule = rule("Form")
    const topology = compileMetadataResourceTopology([
      spec("Объект", formRule, [
        content("Объект/{ownerName}/Форма.yaml", formRule, "fileItem"),
        {
          kind: "yamlCompanion",
          assignmentProjectPattern: "",
          projectPattern: "Объект/{ownerName}/БазоваяФорма.yaml",
          required: false,
          itemRule: formRule,
          projectRole: "form",
          indexContribution: "isolated",
          logicalAddressSegment: "ОсноваФормы",
          source: source("base form"),
        },
        xml("", "Objects/{ownerName}/Form.xml", "body"),
      ]),
    ])

    expect(topology.assignments).toHaveLength(1)
    expect(topology.assignments[0]?.yamlCompanions).toEqual([
      expect.objectContaining({
        projectPattern: "Объект/{ownerName}/БазоваяФорма.yaml",
        projectRole: "form",
        indexContribution: "isolated",
        logicalAddressSegment: "ОсноваФормы",
      }),
    ])
    expect(topology.projectIndex.match("Объект/Первая/БазоваяФорма.yaml")).toEqual([
      expect.objectContaining({ values: { ownerName: "Первая" } }),
    ])
    expect(topology.xmlIndex.match("Объект/Первая/БазоваяФорма.yaml")).toEqual([])
  })

  it("compiles root, nested, and recursively nested assignments by the same contract", () => {
    const configurationRule = rule("Configuration")
    const ownerRule = rule("Owner")
    const childRule = rule("Child")
    const topology = compileMetadataResourceTopology([
      spec("", configurationRule, [
        content("Конфигурация.yaml", configurationRule, "configuration"),
        xml("", "Configuration.xml", "metadata"),
      ]),
      spec("Объект", ownerRule, [
        content("Объект/{ownerName}/Свойства.yaml", ownerRule),
        xml("", "Objects/{ownerName}.xml", "metadata"),
        {
          kind: "childCollection",
          projectBasePattern: "Объект/{ownerName}/Дети/{itemName}",
          xmlBasePattern: "Objects/{ownerName}/Children/{itemName}",
          declarations: [
            content("Свойства.yaml", childRule, "fileItem"),
            xml("", ".xml", "metadata"),
            {
              kind: "childCollection",
              projectBasePattern: "Дети/{nestedName}",
              xmlBasePattern: "Children/{nestedName}",
              declarations: [
                content("Свойства.yaml", childRule, "fileItem"),
                xml("", ".xml", "metadata"),
              ],
              source: source("recursive children"),
            },
          ],
          source: source("children"),
        },
      ]),
    ])

    expect(topology.assignments.map((assignment) => assignment.projectPattern)).toEqual([
      "Конфигурация.yaml",
      "Объект/{ownerName}/Свойства.yaml",
      "Объект/{ownerName}/Дети/{itemName}/Свойства.yaml",
      "Объект/{ownerName}/Дети/{itemName}/Дети/{nestedName}/Свойства.yaml",
    ])
    expect(topology.assignments[2]?.ownerProjectPattern).toBe("Объект/{ownerName}/Свойства.yaml")
    expect(topology.assignments[3]?.ownerProjectPattern).toBe(
      "Объект/{ownerName}/Дети/{itemName}/Свойства.yaml"
    )
  })

  it("rejects two assignments that own the same XML path", () => {
    const ownerRule = rule("Owner")

    expect(() =>
      compileMetadataResourceTopology([
        spec("Объект", ownerRule, [
          content("Объект/{ownerName}/Свойства.yaml", ownerRule),
          xml("", "Objects/Same.xml", "metadata"),
          content("Другой/{ownerName}/Свойства.yaml", ownerRule),
          xml("", "Objects/Same.xml", "metadata"),
        ]),
      ])
    ).toThrow("XML-путь принадлежит нескольким заданиям")
  })

  it("rejects a required XML document without a preparation capability", () => {
    const ownerRule = rule("Owner")
    const document = xml("", "Objects/{ownerName}.xml", "metadata")
    const withoutPrepare = { ...document, prepareCapabilityId: undefined }

    expect(() =>
      compileMetadataResourceTopology([
        spec("Объект", ownerRule, [
          content("Объект/{ownerName}/Свойства.yaml", ownerRule),
          withoutPrepare,
        ]),
      ])
    ).toThrow("не имеет возможности подготовки")
  })

  it("indexes content, XML documents, and ignored XML paths", () => {
    const ownerRule = rule("Owner")
    const topology = compileMetadataResourceTopology([
      spec("Объект", ownerRule, [
        content("Объект/{ownerName}/Свойства.yaml", ownerRule),
        xml("", "Objects/{ownerName}.xml", "metadata"),
        {
          kind: "ignore",
          side: "xml",
          pattern: "ConfigDumpInfo.xml",
          source: source("dump info"),
        },
      ]),
    ])

    expect(topology.projectIndex.match("Объект/Первый/Свойства.yaml")).toEqual([
      expect.objectContaining({ values: { ownerName: "Первый" } }),
    ])
    expect(topology.xmlIndex.match("Objects/Первый.xml")).toEqual([
      expect.objectContaining({ values: { ownerName: "Первый" } }),
    ])
    expect(topology.xmlIndex.match("ConfigDumpInfo.xml")).toEqual([
      expect.objectContaining({ values: {} }),
    ])
  })
})

function cursorMatch(index: CompiledMetadataPathIndex, path: string) {
  let cursor: CompiledMetadataPathCursor | undefined = index.root()
  for (const segment of path.split("/")) cursor = cursor?.advance(segment)
  return cursor?.matches() ?? []
}

function spec(
  dir: string,
  itemRule: MetadataItemRule,
  resources: readonly MetadataResourceDeclaration[]
): RegisteredProjectSpec {
  return {
    dir,
    kind: itemRule.itemType,
    rule: itemRule,
    exportSchema: () => Type.Object({}),
    resources,
  }
}

function rule(itemType: string, metadataTargetOwner?: MetadataItemRule["metadataTargetOwner"]): MetadataItemRule {
  return { itemType, properties: {}, metadataTargetOwner } as MetadataItemRule
}

function external(
  assignmentProjectPattern: string,
  projectPattern: string,
  fileBackedTarget: NonNullable<Extract<MetadataResourceDeclaration, { kind: "externalFile" }>["fileBackedTarget"]>
): MetadataResourceDeclaration {
  return {
    kind: "externalFile",
    assignmentProjectPattern,
    projectPattern,
    xmlPattern: "Objects/{ownerName}/Templates/{itemName}.xml",
    direction: "both",
    transferCapabilityId: "copy",
    compositionImpact: "none",
    fileBackedTarget,
    source: source("external"),
  }
}

function content(
  projectPattern: string,
  itemRule: MetadataItemRule,
  role: "configuration" | "properties" | "fileItem" = "properties"
): MetadataResourceDeclaration {
  return {
    kind: "content",
    projectPattern,
    role,
    required: true,
    repeatable: projectPattern.includes("{"),
    compositionImpact: role === "configuration" ? "none" : "configurationComposition",
    itemRule,
    source: source(`${itemRule.itemType} content`),
  }
}

function xml(
  assignmentProjectPattern: string,
  xmlPattern: string,
  role: "metadata" | "body" | "property"
): MetadataResourceDeclaration {
  return {
    kind: "xmlDocument",
    assignmentProjectPattern,
    xmlPattern,
    role,
    required: true,
    read: { inputRole: role },
    prepareCapabilityId: `${role}:prepare`,
    source: source(`${role} xml`),
  }
}

function source(description: string) {
  return { kind: "projectSpec" as const, description }
}
