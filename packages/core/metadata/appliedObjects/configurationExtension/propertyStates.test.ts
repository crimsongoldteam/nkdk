import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { configurationExtensionPropertyStatesAugmenter } from "./propertyStates"

describe("configuration extension PropertyState augmenter", () => {
  it("преобразует Notify по каноническому XML-имени builder-rule без явного xml", () => {
    const yaml: Record<string, unknown> = { ОсновнойРежимЗапуска: "ManagedApplication" }
    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: {
        itemType: "MetadataConfigurationExtension",
        properties: {
          defaultRunMode: systemEnumerationRule({
            yaml: "ОсновнойРежимЗапуска",
            typeSE: "ClientRunMode",
          }),
        },
      },
      source: propertyStates([
        ["DefaultRunMode", "Notify"],
        ["ExtendedConfigurationObject", "Notify"],
        ["DefaultRunMode", "Notify"],
        ["Unknown", "Notify"],
        ["DefaultRunMode", "Auto"],
      ]),
      yaml,
    })

    expect(yaml).toEqual({
      ОсновнойРежимЗапуска: "ManagedApplication",
      Контроль: ["ОсновнойРежимЗапуска", "ОбъектРасширяемойКонфигурации"],
    })

    const singleYaml: Record<string, unknown> = {}
    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: { itemType: "SingleState", properties: {} },
      source: propertyStates(["ExtendedConfigurationObject", "Notify"]),
      yaml: singleYaml,
    })
    expect(singleYaml).toEqual({ Контроль: ["ОбъектРасширяемойКонфигурации"] })
  })

  it.each([
    ["ClientApplicationForm", "Form", "form"],
    ["MetadataCommonModule", "Module", "module"],
    ["MetadataRole", "Rights", "rights"],
    ["MetadataConfigurationExtension", "CommandInterface", "commandInterface"],
    ["MetadataConfigurationExtension", "HomePageWorkArea", "homePageWorkArea"],
    ["MetadataConfigurationExtension", "Logo", "logo"],
    ["MetadataConfigurationExtension", "MainSectionCommandInterface", "mainSectionCommandInterface"],
    ["MetadataConfigurationExtension", "MainSectionPicture", "mainSectionPicture"],
    ["MetadataConfigurationExtension", "Splash", "splash"],
  ] as const)("сохраняет Extended для %s.%s в сегмент %s", (itemType, property, segment) => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const yaml: Record<string, unknown> = {}

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, logicalAddress),
      rule: { itemType, properties: {} } as MetadataItemRule,
      source: propertyStates([property, "Extended"]),
      yaml,
    })

    expect(collector.fragment("Форма.yaml").xmlValues).toEqual([
      { logicalAddress: `${logicalAddress}.${segment}`, extended: true },
    ])
    expect(yaml).not.toHaveProperty("Контроль")
  })

  it("пропускает Auto, неизвестные состояния, свойства и itemType", () => {
    const collector = createConfigurationIndexCollector()
    const yaml: Record<string, unknown> = {}

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, "Справочник.Товары"),
      rule: { itemType: "UnknownItem", properties: {} } as MetadataItemRule,
      source: propertyStates([
        ["Form", "Extended"],
        ["Unknown", "Extended"],
        ["Form", "Auto"],
        ["Form", "FutureState"],
      ]),
      yaml,
    })

    expect(collector.fragment("Свойства.yaml").xmlValues).toEqual([])
    expect(yaml).toEqual({})
  })
})

function extensionContext(
  collector?: ReturnType<typeof createConfigurationIndexCollector>,
  logicalAddress = "Конфигурация"
) {
  const base = {
    ...mockContextFromXML(),
    fromXML: {
      ...mockContextFromXML().fromXML,
      metadataItemAugmenter: "configurationExtension",
    },
  }
  return collector === undefined ? base : withConfigurationIndexCollector(base, collector, logicalAddress)
}

function propertyStates(
  states:
    | readonly [property: string, state: string]
    | readonly (readonly [property: string, state: string])[]
): Record<string, unknown> {
  const normalized = typeof states[0] === "string" ? [states] : states
  const values = normalized.map(([property, state]) => ({
    "xr:Property": property,
    "xr:State": state,
  }))
  return {
    InternalInfo: {
      "xr:PropertyState": values.length === 1 ? values[0] : values,
    },
  }
}
