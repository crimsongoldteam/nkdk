import { describe, expect, it } from "vitest"
import { mockContext, mockContextFromXML } from "../../../tests/mockContext"
import { inputByStringFieldsRule } from "./types"
import {
  metadataPropertyRule000,
  metadataPropertyRule001,
  metadataPropertyRule002,
  metadataPropertyRule003,
  metadataPropertyRule004,
} from "./propertyRules"

const rule = inputByStringFieldsRule({
  yaml: "ВводПоСтроке",
  xml: "InputByString",
  xmlParents: ["Properties"],
  metadataTarget: {
    kind: "member",
    owner: "this",
    memberKinds: ["Attribute", "StandardAttribute"],
    filters: [{ kind: "inputByStringField" }],
  },
  standardFields: [
    {
      yaml: "СтандартныйРеквизит.Номер",
      length: { propertyKey: "numberLength", yaml: "ДлинаНомера", implicitValue: 9 },
    },
  ],
})

const owner = { root: "Document", objectName: "Заказ" } as const

describe("InputByStringFields property rules", () => {
  it("delegates the MetadataFields XML shape", () => {
    const imported = (metadataPropertyRule000.handler as Function)(
      mockContextFromXML(),
      rule,
      { "xr:Field": "Document.Заказ.StandardAttribute.Number" },
    )
    expect(imported).toEqual(["Document.Заказ.StandardAttribute.Number"])

    const exported = (metadataPropertyRule001.handler as Function)(mockContext, rule, imported)
    expect(exported).toEqual({ "xr:Field": ["Document.Заказ.StandardAttribute.Number"] })
  })

  it("delegates owner-relative YAML paths", () => {
    const imported = (metadataPropertyRule002.handler as Function)({
      context: mockContext,
      rule,
      value: ["СтандартныйРеквизит.Номер"],
      owner,
    })
    expect(imported).toEqual(["Document.Заказ.StandardAttribute.Number"])

    const exported = (metadataPropertyRule003.handler as Function)({
      context: mockContext,
      rule,
      value: imported,
      owner,
    })
    expect(exported).toEqual(["СтандартныйРеквизит.Номер"])
  })

  it("delegates the metadata-target array schema", () => {
    const schema = (metadataPropertyRule004.handler as Function)({ context: mockContext, rule })
    expect(schema).toMatchObject({ type: "array", items: { type: "string" } })
    expect(String(schema.items.description)).toContain("пригодные для ввода по строке")
  })

  it("computes the implicit YAML value from the root document", () => {
    const implicit = rule.implicitValueYAML
    expect(typeof implicit).toBe("function")
    if (typeof implicit !== "function") throw new Error("Ожидалась функция implicitValueYAML")

    expect(implicit({ context: mockContext, operation: "importFromYAML", yaml: {} })).toEqual([
      "СтандартныйРеквизит.Номер",
    ])
    expect(implicit({
      context: mockContext,
      operation: "importFromYAML",
      yaml: { ДлинаНомера: 0 },
    })).toEqual([])
  })
})
