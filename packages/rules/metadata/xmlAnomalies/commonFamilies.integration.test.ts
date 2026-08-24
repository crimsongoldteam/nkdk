import {
  parseMetadataYaml,
  serializeYAMLDocument,
  snapshotXmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"

describe("общий формат XML-аномалий для семейств common-типов", () => {
  it.each([
    ["boolean", "true", true, "TRUE"],
    ["string", "Текст", "Текст", " Текст "],
    ["number", "1", 1, "01"],
    ["SystemEnumeration", "Switch", "Switch", "Switch"],
  ] as const)("сохраняет смысл и XML-форму scalar %s", (_family, yamlValue, semantic, xmlText) => {
    const parsed = parseMetadataYaml([
      "Значение: !xml/raw",
      `  $значение: ${yamlValue}`,
      `  $xml: { \"#text\": \"${xmlText}\" }`,
    ].join("\n"))

    expect(parsed.syntaxErrors).toEqual([])
    expect((parsed.data as Record<string, unknown>).Значение).toBe(semantic)
    expect(snapshotXmlAnomalyAnnotations(parsed.data, parsed.annotations).entries).toEqual([
      expect.objectContaining({
        key: "Значение",
        annotation: expect.objectContaining({
          kind: "raw",
          hasSemanticValue: true,
          xml: { "#text": xmlText },
        }),
      }),
    ])
    expect(parseMetadataYaml(serializeYAMLDocument(parsed.data, parsed.annotations).text).syntaxErrors).toEqual([])
  })

  it.each([
    ["I8nText", "{ ru: Текст, en: Text }", { ru: "Текст", en: "Text" }],
    ["TypeDescription", "[Строка, Число]", ["Строка", "Число"]],
    ["sequence", "[Первый, Второй]", ["Первый", "Второй"]],
    ["named map", "{ Код: { Тип: Строка } }", { Код: { Тип: "Строка" } }],
  ] as const)("не скрывает смысловое значение составного семейства %s", (_family, yamlValue, semantic) => {
    const parsed = parseMetadataYaml([
      "Значение: !xml/raw",
      `  $значение: ${yamlValue}`,
      "  $xml:",
      "    Future:",
      "      _mode: custom",
      "      Item: [one, two]",
    ].join("\n"))

    expect(parsed.syntaxErrors).toEqual([])
    expect((parsed.data as Record<string, unknown>).Значение).toEqual(semantic)
    expect(parsed.annotations.at(parsed.data as object, "Значение")).toMatchObject({
      kind: "raw",
      hasSemanticValue: true,
      xml: { Future: { _mode: "custom", Item: ["one", "two"] } },
    })
  })

  it("оставляет invalid и important обычными смысловыми значениями", () => {
    const parsed = parseMetadataYaml([
      "Булево: !xml/invalid true",
      "Строка: !xml/important Текст",
      "Число: !xml/invalid 42",
    ].join("\n"))

    expect(parsed.data).toEqual({ Булево: true, Строка: "Текст", Число: 42 })
    expect(parsed.annotations.at(parsed.data as object, "Булево")?.kind).toBe("invalid")
    expect(parsed.annotations.at(parsed.data as object, "Строка")?.kind).toBe("important")
  })
})
