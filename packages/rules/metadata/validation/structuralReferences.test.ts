import {
parseMetadataYaml
} from "@nkdk/runtime"
import type {
MetadataItemRule,
PropertyRule,
StructuralReferenceCandidate
} from "@nkdk/runtime/rule-kit"
import {
composeMetadataRules,
createPropertyRuleRegistrySet,
defineMetadataRules,
definePropertyTypeRule,
propertyTypesFromContributions,
withPropertyRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { expect,it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { functionalOptionsPropertyRule } from "../commonObjects/functionalOptionsProperty/types"
import { metadataRules } from "../composition/metadataRules"
import { createPropertyStructuralReferenceRuntime } from "../operations/references"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { collectStructuralYamlReferences } from "./structuralReferences"

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

it.each([
  "3062c54f-92ed-42c5-b62f-1c0e685cfe75",
  "1:93701593-5ac8-4266-b471-7e9ed35a9c3e",
])("сообщает структурную ошибку для нетегированной внутренней ссылки %s", (payload) => {
  const parsed = parseMetadataYaml(`Ссылка: ${payload}`)
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const rule = {
    itemType: "UntaggedDirectBrokenReferenceProbe",
    properties: {
      reference: {
        type: "string",
        yaml: "Ссылка",
        metadataTarget: { kind: "object", roots: ["Catalog"] },
      },
    },
  } as MetadataItemRule

  expect(() => collectProbeReferences(parsed, rule, registry)).toThrow("Неизвестный корень")
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

it.each([
  ["MetadataValue", { type: "ref", value: "Catalog.Товары.EmptyRef" }, { kind: "value", roots: ["Catalog"], valueKinds: ["emptyRef"] }, "Catalog.Товары.EmptyRef"],
  ["Color", { type: "StyleItem", value: "ОсновнойЦвет" }, { kind: "object", roots: ["StyleItem"] }, "StyleItem.ОсновнойЦвет"],
  ["Font", { kind: "StyleItem", ref: "ОсновнойШрифт" }, { kind: "object", roots: ["StyleItem"] }, "StyleItem.ОсновнойШрифт"],
  ["Border", { ref: "ОсновнаяРамка" }, { kind: "object", roots: ["StyleItem"] }, "StyleItem.ОсновнаяРамка"],
  ["Picture", { type: "CommonPicture", ref: "Логотип" }, { kind: "object", roots: ["CommonPicture"] }, "CommonPicture.Логотип"],
] as const)("перечисляет вложенную ссылку типа %s через metadataTargetOccurrences", (type, value, metadataTarget, canonical) => {
  const registry = createPropertyRuleRegistrySet(metadataRules)
  const occurrences = registry.getTypeRule(type, "metadataTargetOccurrences")!({
    value,
    representation: "model",
    yamlPath: ["Значение"],
    propRule: { type, metadataTarget } as PropertyRule,
  })

  expect(occurrences).toHaveLength(1)
  expect(occurrences[0]).toMatchObject({
    location: { kind: "value", path: ["Значение"] },
    representation: { kind: "canonical", canonical },
  })
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
