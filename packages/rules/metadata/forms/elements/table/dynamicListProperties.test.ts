import { describe, expect, it } from "vitest"
import type { ConfigurationContextWithExportToXML, YAMLPropertySource } from "@nkdk/runtime/rule-kit"
import { dynamicListTableProperties, hasRowFilterTableSource } from "./dynamicListProperties"

const source: YAMLPropertySource = {
  itemName: "Таблица",
  has: () => false,
  raw: (propertyKey) => propertyKey === "dataPath" ? "" : undefined,
  yamlKey: () => undefined,
}

describe("RowFilter таблицы формы", () => {
  it("объявляет значения для заимствованной таблицы динамического списка", () => {
    for (const rule of Object.values(dynamicListTableProperties)) {
      expect(rule.defaultValueAdoptedXML).toBe(rule.implicitValueYAML)
    }
  })

  it("вычисляется при экспорте без индекса", () => {
    expect(hasRowFilterTableSource(source)).toBe(true)
  })

  it.each([
    ["dynamicList", false],
    ["rowFilter", true],
    ["none", false],
  ] as const)("вычисляет RowFilter только для профиля %s", (profile, expected) => {
    const context = {
      languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
      version: "2.20",
      importFromYAML: { resolveTableSourceProfile: () => profile },
      exportToXML: { version: "2.20", itemsTree: [], context: {
        metadataForNumbering: [], forms: [], templates: [], parentName: "",
      } },
    } as ConfigurationContextWithExportToXML

    expect(hasRowFilterTableSource(source, context)).toBe(expected)
  })
})
