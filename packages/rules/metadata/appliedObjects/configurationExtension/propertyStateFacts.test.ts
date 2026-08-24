import { parseMetadataYaml } from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
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
    package: { nkdkPath: "Package.bin" },
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
      "Изменять: [Пакет]",
      "",
    ].join("\n"))

    const documents = collectConfigurationExtensionPropertyStateDocuments({
      yaml: parsed.data as Record<string, unknown>,
      rule,
      capability,
      logicalAddress: "Example.Один",
      workingProjectPath: "Пример/Один/Свойства.yaml",
      projectFileExists: (projectPath) => projectPath === "Пример/Один/Package.bin",
    })

    expect(documents.map(({ name, payload, yamlPath }) => ({
      name,
      yamlPath,
      payload: JSON.parse(payload!),
    }))).toEqual([
      {
        name: "title",
        yamlPath: ["Заголовок"],
        payload: { version: 1, itemType: "MetadataExample", propertyKey: "title", mode: "notify", value: "Новый", explicitMode: true },
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
          explicitMode: true,
          value: [
            { mode: "control", value: "Строка" },
            { mode: "extend", value: "Число" },
          ],
        },
      },
      {
        name: "package",
        yamlPath: ["Изменять", 0],
        payload: { version: 1, itemType: "MetadataExample", propertyKey: "package", mode: "extend", value: { externalProjectPath: "Пример/Один/Package.bin" }, explicitMode: true },
      },
    ])
  })

  it.each([
    ["Заголовок: !изменять Новый\n", "изменять", "title"],
    ["Модуль: !проверять Код\n", "проверять", "module"],
  ])("rejects !%s when the property does not allow the mode", (source, tag, propertyKey) => {
    const parsed = parseMetadataYaml(source)

    expect(() => collectConfigurationExtensionPropertyStateDocuments({
      yaml: parsed.data as Record<string, unknown>, rule, capability,
      logicalAddress: "Example.Один", workingProjectPath: "Пример/Один/Свойства.yaml",
    })).toThrow(`Режим !${tag} недопустим для MetadataExample.${propertyKey}`)
  })

  it("rejects PropertyState tags on an own object", () => {
    const parsed = parseMetadataYaml("Заголовок: !проверять Новый\n")

    expect(() => collectConfigurationExtensionPropertyStateDocuments({
      yaml: parsed.data as Record<string, unknown>, rule, capability,
      logicalAddress: "Example.Один", workingProjectPath: "Пример/Один/Свойства.yaml",
      borrowed: false,
    })).toThrow("Режимы PropertyState допустимы только для заимствованного объекта")
  })
})
