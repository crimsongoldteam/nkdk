import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import {
  createValidationRulesSnapshot,
  findValidationRulesItem,
  findValidationRulesSpec,
} from "./rulesSnapshot"
import { registerValidationMetadata } from "./registerValidationMetadata"
import { getRegisteredProjectSpecs } from "../projectDefinition/projectSpecRegistry"
import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { compileMetadataResourceTopology } from "../resourceTopology/core/compiler"

registerValidationMetadata(getRegisteredProjectSpecs())

describe("ValidationRulesSnapshot", () => {
  it("is JSON-compatible", () => {
    const snapshot = createValidationRulesSnapshot(mockContext)

    expect(structuredClone(snapshot)).toEqual(snapshot)
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot)
  })

  it("includes catalog properties descriptor", () => {
    const snapshot = createValidationRulesSnapshot(mockContext)
    const catalog = findValidationRulesSpec(snapshot, "Справочник")

    expect(catalog).toMatchObject({
      dir: "Справочник",
      itemType: "MetadataCatalog",
      root: "Catalog",
      properties: expect.arrayContaining([
        expect.objectContaining({
          modelKey: "attributes",
          yamlPath: ["Реквизиты"],
        }),
      ]),
    })
  })

  it("includes metadata target descriptors", () => {
    const snapshot = createValidationRulesSnapshot(mockContext)
    const catalog = findValidationRulesSpec(snapshot, "Справочник")

    expect(catalog?.properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelKey: "defaultObjectForm",
          yamlPath: ["ОсновнаяФормаОбъекта"],
          metadataTarget: expect.objectContaining({ kind: "member" }),
        }),
      ])
    )
  })

  it("preserves nested item types for dependent validation", () => {
    const catalog = findValidationRulesSpec(createValidationRulesSnapshot(mockContext), "Справочник")
    const attributes = catalog?.properties.find(({ modelKey }) => modelKey === "attributes")
    const standardAttributes = catalog?.properties.find(({ modelKey }) => modelKey === "standardAttributes")

    expect(attributes?.nestedItemType).toBe("MetadataAttribute")
    expect(standardAttributes?.nestedItemType).toBe("StandardAttributeDescription")
  })

  it("includes the actual rule of a nested file assignment", () => {
    const cube = findValidationRulesItem(
      createValidationRulesSnapshot(mockContext),
      "MetadataExternalDataSourceCube",
    )

    expect(cube).toMatchObject({
      itemType: "MetadataExternalDataSourceCube",
      properties: expect.arrayContaining([
        expect.objectContaining({ modelKey: "nameInDataSource" }),
      ]),
    })
  })

  it("resolves project and nested rules from the owning registry set", () => {
    const registryWithChild = (childType: string) => createRuleRegistrySet(
      defineMetadataRules({
        ...emptyMetadataRules,
        propertyTypes: {
          Children: {
            collectionItemRule: {
              itemRule: { itemType: childType, properties: {} },
            },
          },
        },
        projectSpecs: {
          sample: {
            dir: "sample",
            kind: "sample",
            rule: {
              itemType: "Owner",
              properties: {
                children: { type: "Children", yaml: "Дети" },
              },
            },
            exportSchema: () => ({ type: "object" }),
          },
        },
      }),
    )
    const topology = compileMetadataResourceTopology([])
    const first = createValidationRulesSnapshot(
      mockContext,
      topology,
      registryWithChild("FirstChild"),
    )
    const second = createValidationRulesSnapshot(
      mockContext,
      topology,
      registryWithChild("SecondChild"),
    )

    expect(findValidationRulesSpec(first, "sample")?.properties[0]?.nestedItemType)
      .toBe("FirstChild")
    expect(findValidationRulesSpec(second, "sample")?.properties[0]?.nestedItemType)
      .toBe("SecondChild")
  })
})
