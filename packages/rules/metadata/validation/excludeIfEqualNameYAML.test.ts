import { describe, expect, it } from "vitest"
import {
  createPropertyRuleRegistrySet,
  defineMetadataRules,
  definePropertyTypeRule,
  propertyTypesFromContributions,
  withPropertyRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { createConfigurationLanguages, parseMetadataYaml } from "@nkdk/runtime"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"

const context = {
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] }),
  version: "2.20",
} as const

describe("validateExcludedEqualNameYAML", () => {
  it("reports a root I8nText value equal to the current item name", () => {
    const parsed = parseMetadataYaml("Синоним: Какое то поле\n")
    const rule: MetadataItemRule = {
      itemType: "MetadataCatalog",
      properties: {
        synonym: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
      },
    } as never

    const diagnostics = validateExcludedEqualNameYAML({
      context,
      filePath: "/tmp/Свойства.yaml",
      parsed,
      rule,
      name: "КакоеТоПоле",
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        source: "structure",
        severity: "error",
        path: "/Синоним",
        message: 'Поле "Синоним" не нужно указывать, если его значение совпадает с именем "КакоеТоПоле"',
      }),
    ])
  })

  it("uses record keys as names for nested collection items", () => {
    const parsed = parseMetadataYaml(["Реквизиты:", "  КакоеТоПоле:", "    Заголовок: Какое то поле"].join("\n"))
    const testCollectionType = "__ExcludeEqualNameCollectionUnit" as never
    const itemRule: MetadataItemRule = {
      itemType: "FormAttribute",
      properties: {
        title: { type: "I8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
      },
    } as never
    const rootRule: MetadataItemRule = {
      itemType: "ClientApplicationForm",
      properties: {
        attributes: { type: testCollectionType, yaml: "Реквизиты" },
      },
    } as never

    const diagnostics = withCollectionItemRule(testCollectionType, itemRule, () => validateExcludedEqualNameYAML({
      context,
      filePath: "/tmp/Форма.yaml",
      parsed,
      rule: rootRule,
      name: "ФормаЭлемента",
    }))

    expect(diagnostics).toEqual([
      expect.objectContaining({
        path: "/Реквизиты/КакоеТоПоле/Заголовок",
      }),
    ])
  })

  it("reports formatted default-language values at the nested text path", () => {
    const parsed = parseMetadataYaml(
      [
        "Реквизиты:",
        "  КакоеТоПоле:",
        "    Заголовок:",
        "      Форматированный: Истина",
        "      Текст:",
        "        ru: Какое то поле",
        "        en: Some field",
      ].join("\n")
    )
    const testCollectionType = "__ExcludeEqualNameFormattedCollectionUnit" as never
    const itemRule: MetadataItemRule = {
      itemType: "FormattedItem",
      properties: {
        title: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
      },
    } as never
    const rootRule: MetadataItemRule = {
      itemType: "ClientApplicationForm",
      properties: {
        attributes: { type: testCollectionType, yaml: "Реквизиты" },
      },
    } as never

    const diagnostics = withCollectionItemRule(testCollectionType, itemRule, () => validateExcludedEqualNameYAML({
      context,
      filePath: "/tmp/Форма.yaml",
      parsed,
      rule: rootRule,
      name: "ФормаЭлемента",
    }))

    expect(diagnostics).toEqual([
      expect.objectContaining({
        path: "/Реквизиты/КакоеТоПоле/Заголовок/Текст/ru",
      }),
    ])
  })

  it.each([
    ["order anomaly", "Синоним: !xml/order\n  en: Text\n  ru: Какое то поле"],
    ["duplicate anomaly", "Синоним:\n  ru: !xml/duplicate Какое то поле"],
  ])("allows an explicit calculated value for $name", (_name, source) => {
    const parsed = parseMetadataYaml(source)
    const rule: MetadataItemRule = {
      itemType: "MetadataCatalog",
      properties: {
        synonym: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
      },
    } as never

    expect(validateExcludedEqualNameYAML({
      context,
      filePath: "/tmp/Свойства.yaml",
      parsed,
      rule,
      name: "КакоеТоПоле",
    })).toEqual([])
  })
})

function withCollectionItemRule<Result>(
  propertyType: string,
  itemRule: MetadataItemRule,
  execute: () => Result,
): Result {
  const definition = defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: propertyTypesFromContributions([
      definePropertyTypeRule(propertyType as never, "collectionItemRule", { itemRule }),
    ]),
  })
  return withPropertyRuleRegistrySet(createPropertyRuleRegistrySet(definition), execute)
}
