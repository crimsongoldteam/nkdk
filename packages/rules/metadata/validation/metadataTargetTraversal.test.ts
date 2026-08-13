import { describe, expect, it } from "vitest"
import "../commonObjects/metadataTargets/validationHandlers"
import {
  composeMetadataRules,
  createPropertyRuleRegistrySet,
  defineMetadataRules,
  definePropertyTypeRule,
  propertyTypesFromContributions,
  withPropertyRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { metadataRules } from "../composition/metadataRules"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { parseMetadataYaml } from "@nkdk/runtime"
import { collectMetadataTargetReferencesInModel } from "./metadataTargetTraversal"

const emptyParsedYaml = () => parseMetadataYaml("")

describe("collectMetadataTargetReferencesInModel", () => {
  it("collects metadata targets in nested collection items", () => {
    const testCollectionType = "__MetadataTargetTraversalNestedCollectionUnit" as never
    const tabularSectionRule: MetadataItemRule = {
      itemType: "MetadataTabularSection",
      properties: {
        name: { type: "string" },
        defaultForm: {
          type: "string",
          yaml: "ФормаПоУмолчанию",
          metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
        },
      },
    } as never

    const definition = composeMetadataRules(metadataRules, defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: propertyTypesFromContributions([
        definePropertyTypeRule(testCollectionType, "collectionItemRule", { itemRule: tabularSectionRule }),
      ]),
    }))

    const rule: MetadataItemRule = {
      itemType: "MetadataDocument",
      properties: {
        tabularSections: {
          type: testCollectionType,
          yaml: "ТабличныеЧасти",
        },
      },
    } as never

    const result = withPropertyRuleRegistrySet(createPropertyRuleRegistrySet(definition), () => collectMetadataTargetReferencesInModel({
      filePath: "/tmp/Документ/АвансовыйОтчет/Свойства.yaml",
      parsed: emptyParsedYaml(),
      model: {
        itemType: "MetadataDocument",
        tabularSections: [
          {
            itemType: "MetadataTabularSection",
            name: "Товары",
            defaultForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
          },
        ],
      } as never,
      rule,
      owner: { root: "Document", objectName: "АвансовыйОтчет" },
    }))

    expect(result.diagnostics).toEqual([])
    expect(result.references).toEqual([
      expect.objectContaining({
        yamlPath: ["ТабличныеЧасти", "Товары", "ФормаПоУмолчанию"],
        canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        target: expect.objectContaining({
          kind: "member",
          root: "Document",
          objectName: "АвансовыйОтчет",
          segments: [{ kind: "Form", name: "ФормаДокумента" }],
        }),
      }),
    ])
  })

  it("collects pending metadata target references without resolving them", () => {
    const rule: MetadataItemRule = {
      itemType: "MetadataFunctionalOption",
      properties: {
        content: {
          type: "MetadataItemLinks",
          yaml: "СоставФункциональнойОпции",
          metadataTarget: { kind: "member", owner: "explicit" },
        },
      },
    } as never

    const references = collectMetadataTargetReferencesInModel({
      filePath: "/tmp/ФункциональнаяОпция/Опция.yaml",
      parsed: parseMetadataYaml(["СоставФункциональнойОпции:", "  - Catalog.Номенклатура.Attribute.Артикул"].join("\n")),
      model: {
        itemType: "MetadataFunctionalOption",
        content: ["Catalog.Номенклатура.Attribute.Артикул"],
      } as never,
      rule,
    })

    expect(references.diagnostics).toEqual([])
    expect(references.references).toEqual([
      expect.objectContaining({
        filePath: "/tmp/ФункциональнаяОпция/Опция.yaml",
        yamlPath: ["СоставФункциональнойОпции", 0],
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        target: expect.objectContaining({
          kind: "member",
          root: "Catalog",
          objectName: "Номенклатура",
          segments: [{ kind: "Attribute", name: "Артикул" }],
        }),
        constraint: expect.objectContaining({ kind: "member", owner: "explicit" }),
      }),
    ])
  })

  it("collects structure diagnostics for invalid pending metadata targets", () => {
    const rule: MetadataItemRule = {
      itemType: "MetadataDocument",
      properties: {
        mainForm: {
          type: "string",
          yaml: "ОсновнаяФорма",
          metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
        },
      },
    } as never

    const references = collectMetadataTargetReferencesInModel({
      filePath: "/tmp/Документ/АвансовыйОтчет/Свойства.yaml",
      parsed: parseMetadataYaml("ОсновнаяФорма: CommonForm.ФормаДокумента"),
      model: { itemType: "MetadataDocument", mainForm: "CommonForm.ФормаДокумента" } as never,
      rule,
      owner: { root: "Document", objectName: "АвансовыйОтчет" },
    })

    expect(references.references).toEqual([])
    expect(references.diagnostics).toEqual([
      expect.objectContaining({
        source: "structure",
        severity: "error",
      }),
    ])
  })
})
