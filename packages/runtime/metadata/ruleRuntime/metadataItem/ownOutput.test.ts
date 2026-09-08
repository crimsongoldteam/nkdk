import { describe, expect, it } from "vitest"
import { applyXMLItemOwnOutput } from "./ownOutput"

describe("подготовленный собственный XML-выход item", () => {
  it("передаёт предметному обработчику только атрибуты и сохраняет тождество ребёнка", () => {
    const child = new Proxy({}, { get() { throw new Error("Нельзя читать готового ребёнка") } })
    let initialized = 0
    const output = applyXMLItemOwnOutput({ _id: 17, Child: child, _name: "A" }, {
      attributes(own) {
        expect(own).toEqual({ _id: 17, _name: "A" })
        return { _name: own._name, _id: String(own._id) }
      },
      initialize(body) { expect(body).toHaveProperty("_id", "17"); initialized++ },
    })
    expect(Object.keys(output)).toEqual(["_name", "_id", "Child"])
    expect(output.Child).toBe(child)
    expect(initialized).toBe(1)
  })

  it("не позволяет обработчику атрибутов добавлять или менять детей", () => {
    expect(() => applyXMLItemOwnOutput({ Child: {} }, {
      attributes: () => ({ Added: "лишний ребёнок" }),
    })).toThrow(/атрибут/)
  })
})
