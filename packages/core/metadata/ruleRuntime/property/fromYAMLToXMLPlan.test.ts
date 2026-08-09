import { describe, expect, it } from "vitest"

import { getYAMLToXMLPlan } from "./fromYAMLToXMLPlan"

describe("getYAMLToXMLPlan", () => {
  it("кэширует YAML/XML-адреса properties отдельно от данных объекта", () => {
    const rule = {
      itemType: "TestItem",
      properties: {
        title: { type: "string", yaml: "Заголовок", xml: "Title" },
        value: { type: "string", yaml: "Значение", xmlParents: ["Properties"] },
      },
    } as const

    const first = getYAMLToXMLPlan(rule as never)
    const second = getYAMLToXMLPlan(rule as never)

    expect(first).toBe(second)
    expect(first.properties.map((item) => [item.propertyKey, item.yamlKey, item.xmlPath])).toEqual([
      ["title", "Заголовок", ["Title"]],
      ["value", "Значение", ["Properties", "Value"]],
    ])
  })
})
