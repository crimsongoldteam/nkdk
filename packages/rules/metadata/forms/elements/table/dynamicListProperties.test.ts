import { describe, expect, it } from "vitest"
import type { ConfigurationContextWithExportToXML, YAMLPropertySource } from "@nkdk/runtime/rule-kit"
import { hasRowFilterTableSource } from "./dynamicListProperties"

const source: YAMLPropertySource = {
  itemName: "Таблица",
  has: () => false,
  raw: (propertyKey) => propertyKey === "dataPath" ? "" : undefined,
  yamlKey: () => undefined,
}

describe("RowFilter таблицы формы", () => {
  it("вычисляется при экспорте без индекса", () => {
    expect(hasRowFilterTableSource(source)).toBe(true)
  })

  it.each([
    ["dynamicList", false],
    ["rowFilter", true],
    ["none", false],
  ] as const)("вычисляет RowFilter только для профиля %s", (profile, expected) => {
    const context = {
      defaultLanguage: "ru",
      version: "2.20",
      importFromYAML: { resolveTableSourceProfile: () => profile },
      exportToXML: { version: "2.20", itemsTree: [], context: {
        metadataForNumbering: [], forms: [], templates: [], parentName: "",
      } },
    } as ConfigurationContextWithExportToXML

    expect(hasRowFilterTableSource(source, context)).toBe(expected)
  })
})
