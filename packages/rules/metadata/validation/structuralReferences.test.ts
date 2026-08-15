import { expect, it } from "vitest"
import {
  markYAMLMappingKeyTag,
  parseMetadataYaml,
  yamlMappingKeyTagAt,
} from "@nkdk/runtime"
import type {
  MetadataTargetOccurrence,
  StructuralReferenceCandidate,
} from "@nkdk/runtime/rule-kit"
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
import { functionalOptionsPropertyRule } from "../commonObjects/functionalOptionsProperty/types"
import { userVisibleRule } from "../commonObjects/userVisible/types"

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
      context: { version: "2.20", languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' } },
      runtime: createPropertyStructuralReferenceRuntime(),
    }))).toThrow(message)
})

it("excludes only tagged transported MDObjectRef from structural references", () => {
  const parsed = parseMetadataYaml(`Состав:\n  - Справочник.Товары\n  - !xml/reference 447e2bd8-fa43-442e-91db-b17634e036d9\n`)
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

  const result = collectProbeReferences(parsed, rule, registry)

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

it("collects translateOnly targets for find and rename without validating their existence", () => {
  const parsed = parseMetadataYaml("ВидыХарактеристик: Справочник.Товары\n")
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const rule = {
    itemType: "TranslateOnlyStructuralProbe",
    properties: {
      characteristicTypes: {
        type: "string",
        yaml: "ВидыХарактеристик",
        metadataTarget: { kind: "dataTable", validation: "translateOnly" },
      },
    },
  } as MetadataItemRule

  const result = collectProbeReferences(parsed, rule, registry)

  expect(result).toMatchObject({
    ok: true,
    references: [expect.objectContaining({ canonical: "Catalog.Товары" })],
  })
  if (!result.ok) throw new Error(result.message)
  result.references[0]?.setCanonical("Catalog.Номенклатура")
  expect(parsed.data).toMatchObject({ ВидыХарактеристик: "Справочник.Номенклатура" })
})

it("collects the base calculation register embedded in a Base virtual table", () => {
  const parsed = parseMetadataYaml("ОсновнаяТаблица: РегистрРасчета.Начисления.БазаОснование\n")
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const rule = {
    itemType: "CalculationBaseStructuralProbe",
    properties: {
      mainTable: {
        type: "string",
        yaml: "ОсновнаяТаблица",
        metadataTarget: { kind: "dataTable" },
      },
    },
  } as MetadataItemRule

  const result = collectProbeReferences(parsed, rule, registry)

  expect(result).toMatchObject({
    ok: true,
    references: expect.arrayContaining([
      expect.objectContaining({ canonical: "CalculationRegister.Начисления.BaseОснование" }),
      expect.objectContaining({ canonical: "CalculationRegister.Основание" }),
    ]),
  })
  if (!result.ok) throw new Error(result.message)
  const base = result.references.find(({ canonical }) => canonical === "CalculationRegister.Основание")
  if (base === undefined) throw new Error("Не найдена ссылка на базовый регистр расчёта")
  base.setCanonical("CalculationRegister.НоваяБаза")
  expect(parsed.data).toMatchObject({
    ОсновнаяТаблица: "РегистрРасчета.Начисления.БазаНоваяБаза",
  })
})

it("collects and rewrites functional-option references", () => {
  const parsed = parseMetadataYaml("ФункциональныеОпции:\n  - ДоступностьСкладов\n")
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const rule = {
    itemType: "FunctionalOptionsStructuralProbe",
    properties: {
      functionalOptions: functionalOptionsPropertyRule({
        yaml: "ФункциональныеОпции",
        metadataTarget: { kind: "object", roots: ["FunctionalOption"] },
      }),
    },
  } as MetadataItemRule

  const result = collectProbeReferences(parsed, rule, registry)

  expect(result).toMatchObject({
    ok: true,
    references: [expect.objectContaining({ canonical: "FunctionalOption.ДоступностьСкладов" })],
  })
  if (!result.ok) throw new Error(result.message)
  result.references[0]?.setCanonical("FunctionalOption.ДоступностьМагазинов")
  expect(parsed.data).toMatchObject({ ФункциональныеОпции: ["ДоступностьМагазинов"] })
})

it("collects and rewrites role keys in user visibility", () => {
  const parsed = parseMetadataYaml([
    "Использование:",
    "  Роли:",
    "    Администратор: Ложь",
  ].join("\n"))
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const rule = {
    itemType: "UserVisibleStructuralProbe",
    properties: {
      use: userVisibleRule({ yaml: "Использование", xml: "Use" }),
    },
  } as MetadataItemRule

  const result = collectProbeReferences(parsed, rule, registry)

  expect(result).toMatchObject({
    ok: true,
    references: [expect.objectContaining({ canonical: "Role.Администратор" })],
  })
  if (!result.ok) throw new Error(result.message)
  result.references[0]?.setCanonical("Role.Аудитор")
  expect(parsed.data).toMatchObject({ Использование: { Роли: { Аудитор: "Ложь" } } })
})

it("перечисляет значения, элементы списка и ключи ролей единым metadataTarget-договором", () => {
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const directRule = {
    type: "string",
    metadataTarget: { kind: "object", roots: ["Catalog"] },
  } as const
  const listRule = {
    type: "MetadataItemLinks",
    metadataTarget: { kind: "object", roots: ["Catalog"] },
  } as const
  const userVisibleProperty = userVisibleRule({ yaml: "Использование", xml: "Use" })
  const roles = {
    Администратор: "Ложь",
    Аудитор: "Истина",
  }
  markYAMLMappingKeyTag(roles, "Администратор", "xml/reference")
  const use = { Роли: roles }

  const occurrences = [
    ...registry.getTypeRule("string", "metadataTargetOccurrences")!({
      value: "Catalog.Товары",
      representation: "model",
      yamlPath: ["Ссылка"],
      propRule: directRule,
    }),
    ...registry.getTypeRule("MetadataItemLinks", "metadataTargetOccurrences")!({
      value: ["Catalog.Услуги"],
      representation: "model",
      yamlPath: ["Ссылки"],
      propRule: listRule,
    }),
    ...registry.getTypeRule("UserVisible", "metadataTargetOccurrences")!({
      value: use,
      representation: "yaml",
      yamlPath: ["Использование"],
      propRule: userVisibleProperty,
    }),
  ] satisfies readonly MetadataTargetOccurrence[]

  expect(occurrences.map(({ location, constraint }) => ({ location, constraint }))).toEqual([
    {
      location: { kind: "value", path: ["Ссылка"] },
      constraint: { kind: "object", roots: ["Catalog"] },
    },
    {
      location: { kind: "value", path: ["Ссылки", 0] },
      constraint: { kind: "object", roots: ["Catalog"] },
    },
    {
      location: { kind: "key", path: ["Использование", "Роли"], key: "Администратор" },
      constraint: { kind: "object", roots: ["Role"] },
    },
    {
      location: { kind: "key", path: ["Использование", "Роли"], key: "Аудитор" },
      constraint: { kind: "object", roots: ["Role"] },
    },
  ])

  occurrences[2]!.setValue("Role.Кассир")
  expect(Object.keys(roles)).toEqual(["Role.Кассир", "Аудитор"])
  expect(roles).toEqual({ "Role.Кассир": "Ложь", Аудитор: "Истина" })
  expect(yamlMappingKeyTagAt(roles, "Role.Кассир")).toBe("xml/reference")
  expect(yamlMappingKeyTagAt(roles, "Администратор")).toBeUndefined()
})

function collectProbeReferences(
  parsed: ReturnType<typeof parseMetadataYaml>,
  rule: MetadataItemRule,
  registry: ReturnType<typeof createPropertyRuleRegistrySet>,
) {
  return withPropertyRuleRegistrySet(registry, () => collectStructuralYamlReferences({
    filePath: "/project/Свойства.yaml",
    parsed,
    rule,
    yaml: parsed.data,
    context: mockContext,
    runtime: createPropertyStructuralReferenceRuntime(),
  }))
}
