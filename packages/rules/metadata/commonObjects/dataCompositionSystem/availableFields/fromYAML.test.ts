import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testAtomicFromYAML } from "../../../../tests/property/atomicFromYAML"
import {
  fullAvailableFields,
  fullAvailableFieldsYAML,
  selectedItemAvailableFields,
  selectedItemAvailableFieldsYAML,
} from "./__fixtures__/data"
import "./types"
import { importFromYAML } from "@nkdk/runtime"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("import available fields from YAML", () => {
  it("imports full YAML", () => {
    const result = testAtomicFromYAML({
      rule,
      value: fullAvailableFieldsYAML,
    })

    expect(result).toEqual(fullAvailableFields)
  })

  it("imports selected items", () => {
    const result = testAtomicFromYAML({
      rule,
      value: selectedItemAvailableFieldsYAML,
    })

    expect(result).toEqual(selectedItemAvailableFields)
  })

  it("imports item with only field as string", () => {
    const result = testAtomicFromYAML({
      rule,
      value: [{ Поле: "Документ" }],
    })

    expect(result).toEqual(["Документ"])
  })

  it("imports !xml/reference in short and extended items", () => {
    const result = testAtomicFromYAML({
      rule,
      value: importFromYAML([
        "- !xml/reference НеизвестныйЭлемент",
        "- Поле: !xml/reference ДругойЭлемент",
        "  Использование: Истина",
      ].join("\n")),
    })

    expect(result).toEqual([
      "НеизвестныйЭлемент",
      { field: "ДругойЭлемент", use: true },
    ])
  })

  it.each([
    "- !xml/reference",
    "- Поле: !xml/reference",
  ])("rejects empty !xml/reference: %s", (yaml) => {
    expect(() => testAtomicFromYAML({ rule, value: importFromYAML(yaml) }))
      .toThrow("!xml/reference требует непустое имя поля")
  })
})
