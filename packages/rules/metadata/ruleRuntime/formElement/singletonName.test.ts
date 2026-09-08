import { describe, expect, it } from "vitest"
import { parseMetadataYaml, serializeYAMLDocument } from "@nkdk/runtime"
import {
  attachExplicitSingletonName,
  getSingletonName,
  getSingletonNameVariant,
  resolveExplicitSingletonName,
  type SingletonNameStyle,
} from "./singletonName"

const style = {
  canonicalSuffix: "РасширеннаяПодсказка",
  referenceSuffixes: ["РасширеннаяПодсказка", "ExtendedTooltip"],
  canonicalNameMode: "ownerSuffix",
  explicitXMLName: true,
} as const satisfies SingletonNameStyle

describe("singleton names without hidden reference", () => {
  it("uses the selected naming variant when the owner is renamed", () => {
    const variant = getSingletonNameVariant({
      xmlName: "СтарыйExtendedTooltip", ownerXmlName: "Старый", nameStyle: style,
    })
    expect(getSingletonName({
      ownerLogicalAddress: "Форма.Элемент.Новый", nameStyle: style, variant,
    })).toBe("НовыйExtendedTooltip")
  })

  it.each(["ИсторическоеИмя", ""])("preserves explicit name %j through serialized YAML", (xmlName) => {
    const yaml: Record<string, unknown> = {}
    attachExplicitSingletonName({
      yaml, xmlName, generatedName: "ПолеРасширеннаяПодсказка", nameStyle: style,
    })
    const serialized = serializeYAMLDocument(yaml).text
    expect(serialized).toContain("!xml/name")
    expect(resolveExplicitSingletonName({
      yaml: parseMetadataYaml(serialized).data,
      generatedName: "НовоеПолеРасширеннаяПодсказка", nameStyle: style,
    })).toBe(xmlName)
  })

  it("does not annotate the canonical name", () => {
    const yaml: Record<string, unknown> = {}
    attachExplicitSingletonName({
      yaml, xmlName: "ПолеРасширеннаяПодсказка",
      generatedName: "ПолеРасширеннаяПодсказка", nameStyle: style,
    })
    expect(yaml).toEqual({})
  })

  it("rejects an unmarked explicit XML name", () => {
    expect(() => resolveExplicitSingletonName({
      yaml: { Имя: "ИсторическоеИмя" }, generatedName: "ПолеРасширеннаяПодсказка", nameStyle: style,
    })).toThrow("!xml/name")
  })
})
