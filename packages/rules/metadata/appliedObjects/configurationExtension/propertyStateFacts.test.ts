import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import type { ResolvedPropertyStateItemCapability } from "../../ruleRuntime/definition"
import { collectConfigurationExtensionPropertyStateDocuments } from "../../validation/configurationExtensionPropertyStateFacts"

const capability: ResolvedPropertyStateItemCapability = {
  itemType: "MetadataExample",
  properties: {
    title: { availability: "borrowed", modes: ["control", "notify"], representation: "tagged" },
    module: { availability: "borrowed", modes: ["extend"], representation: "plain" },
    type: { availability: "borrowed", modes: ["control", "notify", "extend", "multi"], representation: "multi" },
    package: {
      availability: "borrowed",
      modes: ["control", "notify", "extend"],
      representation: "section",
      externalName: "Пакет",
    },
  },
}

const rule = {
  itemType: "MetadataExample",
  properties: {
    title: { yaml: "Заголовок" },
    module: { yaml: "Модуль" },
    type: { yaml: "Тип" },
    package: { yaml: "СодержимоеПакета" },
  },
} as never

describe("configuration extension PropertyState facts", () => {
  it("extracts ordinary, tagged, section and MultiState facts", () => {
    const parsed = parseMetadataYaml([
      "Заголовок: !проверять Новый",
      "Модуль: Код",
      "Тип:",
      "  - Строка",
      "  - !изменять Число",
      "СодержимоеПакета: пакет",
      "Изменять: [Пакет]",
      "",
    ].join("\n"))

    const documents = collectConfigurationExtensionPropertyStateDocuments({
      yaml: parsed.data as Record<string, unknown>,
      rule,
      capability,
      logicalAddress: "Example.Один",
      workingProjectPath: "Пример/Один/Свойства.yaml",
    })

    expect(documents.map(({ name, payload, yamlPath }) => ({
      name,
      yamlPath,
      payload: JSON.parse(payload!),
    }))).toEqual([
      {
        name: "title",
        yamlPath: ["Заголовок"],
        payload: { version: 1, itemType: "MetadataExample", propertyKey: "title", mode: "notify", value: "Новый" },
      },
      {
        name: "module",
        yamlPath: ["Модуль"],
        payload: { version: 1, itemType: "MetadataExample", propertyKey: "module", mode: "extend", value: "Код" },
      },
      {
        name: "type",
        yamlPath: ["Тип"],
        payload: {
          version: 1,
          itemType: "MetadataExample",
          propertyKey: "type",
          mode: "multi",
          value: [
            { mode: "control", value: "Строка" },
            { mode: "extend", value: "Число" },
          ],
        },
      },
      {
        name: "package",
        yamlPath: ["Изменять", 0],
        payload: { version: 1, itemType: "MetadataExample", propertyKey: "package", mode: "extend", value: "пакет" },
      },
    ])
  })

  it("marks !xml as a subject-validation bypass", () => {
    const parsed = parseMetadataYaml("Заголовок: !xml сырой\n")
    const [document] = collectConfigurationExtensionPropertyStateDocuments({
      yaml: parsed.data as Record<string, unknown>, rule, capability,
      logicalAddress: "Example.Один", workingProjectPath: "Пример/Один/Свойства.yaml",
    })

    expect(JSON.parse(document!.payload!)).toEqual({
      version: 1, itemType: "MetadataExample", propertyKey: "title", mode: "xml", value: "!xml сырой",
    })
  })
})
