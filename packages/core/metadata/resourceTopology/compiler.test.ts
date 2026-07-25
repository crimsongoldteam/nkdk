import { describe, expect, it } from "vitest"
import { Type } from "typebox"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { RegisteredProjectSpec } from "../project/projectSpecRegistry"
import { compileMetadataResourceTopology } from "./compiler"
import {
  expandMetadataPathPattern,
  matchMetadataPathPattern,
} from "./patterns"
import type { MetadataResourceDeclaration } from "./types"

describe("metadata resource topology path patterns", () => {
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

function rule(itemType: string): MetadataItemRule {
  return { itemType, properties: {} } as MetadataItemRule
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
