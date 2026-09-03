import { describe, expect, it } from "vitest"
import { orderXmlPropertyOutput } from "./xmlPropertyOutputOrder"

describe("порядок собственного XML-выхода свойства", () => {
  it("упорядочивает только объявленные оболочки, не читая готовые дочерние значения", () => {
    const opaque = new Proxy({}, { ownKeys() { throw new Error("Готового ребёнка нельзя обходить") } })
    const group = { B: opaque, A: "a" }
    const xml = { Tail: "tail", Group: group, Extra: opaque }
    const plan = [{ xmlPath: ["Group", "A"] }, { xmlPath: ["Group", "B"] }, { xmlPath: ["Tail"] }]

    orderXmlPropertyOutput(xml, plan)

    expect(Object.keys(xml)).toEqual(["Group", "Tail", "Extra"])
    expect(xml.Group).toBe(group)
    expect(Object.keys(group)).toEqual(["A", "B"])
    expect(group.B).toBe(opaque)
    const another = { Tail: "other" }
    orderXmlPropertyOutput(another, plan)
    expect(another).toEqual({ Tail: "other" })
    expect(Object.keys(another)).toEqual(["Tail"])
  })
})
