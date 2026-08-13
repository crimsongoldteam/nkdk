import { expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import type { StructuralReferenceCandidate } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
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
import { createPropertyStructuralReferenceRuntime } from "../operations/references"
import { collectStructuralYamlReferences } from "./structuralReferences"
import { MetadataSubsystemRules } from "../appliedObjects/metadataSubsystem/rules"
import { mockContext } from "../../tests/mockContext"

it.each([
  ["setter", "без setter"],
  ["index", "не материализовало индекс"],
] as const)("останавливает сбор при нарушении %s contract", (brokenContract, message) => {
  const candidate = {
    yamlPath: ["Ссылка"],
    canonical: "Catalog.Товары",
    setCanonical() {},
  } satisfies StructuralReferenceCandidate
  const definition = composeMetadataRules(metadataRules, defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: propertyTypesFromContributions([
      definePropertyTypeRule("string", "structuralReferences", () => [
      brokenContract === "setter"
        ? { yamlPath: candidate.yamlPath, canonical: candidate.canonical } as unknown as StructuralReferenceCandidate
        : candidate,
      ]),
      definePropertyTypeRule("string", "collectMetadataTargetReferences", () => ({
      references: brokenContract === "index"
        ? []
        : [{
            yamlPath: candidate.yamlPath,
            canonical: candidate.canonical,
            target: { kind: "object", root: "Catalog", objectName: "Товары" },
            constraint: { kind: "object" },
          }],
      diagnostics: [],
      })),
    ]),
  }))
  const registry = createPropertyRuleRegistrySet(definition)

    const parsed = parseMetadataYaml("Ссылка: Справочник.Товары")
    const rule = {
      itemType: "TestStructuralReferences",
      properties: { reference: { type: "string", yaml: "Ссылка" } },
    } as MetadataItemRule

    expect(() => withPropertyRuleRegistrySet(registry, () => collectStructuralYamlReferences({
      filePath: "/project/Свойства.yaml",
      parsed,
      rule,
      yaml: parsed.data,
      context: { version: "2.20", defaultLanguage: "ru" },
      runtime: createPropertyStructuralReferenceRuntime(),
    }))).toThrow(message)
})

it("excludes only tagged transported MDObjectRef from structural references", () => {
  const parsed = parseMetadataYaml(`Состав:\n  - Справочник.Товары\n  - !xml 447e2bd8-fa43-442e-91db-b17634e036d9\n`)
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const rule = {
    itemType: "BrokenMDObjectRefStructuralProbe",
    properties: { content: MetadataSubsystemRules.properties.content },
  } as MetadataItemRule

  const result = withPropertyRuleRegistrySet(registry, () => collectStructuralYamlReferences({
    filePath: "/project/Подсистема/Продажи/Свойства.yaml",
    parsed,
    rule,
    yaml: parsed.data,
    context: mockContext,
    runtime: createPropertyStructuralReferenceRuntime(),
  }))

  expect(result).toMatchObject({
    ok: true,
    references: [{ canonical: "Catalog.Товары" }],
  })
})

it("resolves and preserves a short member reference owned by the sibling type", () => {
  const parsed = parseMetadataYaml("Тип: Справочник.Товары\nФормаВыбора: ФормаВыбора\n")
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const rule = {
    itemType: "TypeOwnedMemberStructuralProbe",
    properties: {
      type: {
        type: "string",
        yaml: "Тип",
        metadataTarget: { kind: "object" },
      },
      choiceForm: {
        type: "string",
        yaml: "ФормаВыбора",
        metadataTarget: {
          kind: "member",
          owner: "type",
          typeProperty: "type",
          memberKinds: ["Form"],
        },
      },
    },
  } as MetadataItemRule

  const result = withPropertyRuleRegistrySet(registry, () => collectStructuralYamlReferences({
    filePath: "/project/Свойства.yaml",
    parsed,
    rule,
    yaml: parsed.data,
    context: mockContext,
    runtime: createPropertyStructuralReferenceRuntime(),
  }))

  expect(result).toMatchObject({
    ok: true,
    references: expect.arrayContaining([
      expect.objectContaining({ canonical: "Catalog.Товары.Form.ФормаВыбора" }),
    ]),
  })
  if (!result.ok) throw new Error(result.message)
  const choiceForm = result.references.find(({ canonical }) => canonical.endsWith(".Form.ФормаВыбора"))
  if (choiceForm === undefined) throw new Error("Не найдена ссылка на форму выбора")
  choiceForm.setCanonical("Catalog.Товары.Form.НоваяФорма")
  expect(parsed.data).toMatchObject({ ФормаВыбора: "НоваяФорма" })
})
