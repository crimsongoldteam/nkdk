import { describe, expect, it } from "vitest"
import {
  canonicalNamedChildren,
  childrenToPersist,
  mergeSavedChildren,
} from "./omittedChildren"

describe("configuration index children", () => {
  it.each(["Form", "Template", "Table", "Cube", "DimensionTable"])(
    "builds canonical UTF-8 order for %s",
    (xmlName) => {
      expect(canonicalNamedChildren(xmlName, ["Я", "A", "А"])).toEqual([
        { xmlName, name: "A" },
        { xmlName, name: "А" },
        { xmlName, name: "Я" },
      ])
    },
  )

  it("omits canonical order and preserves a complete noncanonical order", () => {
    const canonical = canonicalNamedChildren("Form", ["А", "Б"])
    expect(childrenToPersist(canonical, canonical)).toBeUndefined()
    expect(childrenToPersist([...canonical].reverse(), canonical)).toEqual([...canonical].reverse())
  })

  it("removes absent children and appends new children in canonical order", () => {
    const current = canonicalNamedChildren("Form", ["НоваяБ", "Б", "НоваяА"])
    const saved = canonicalNamedChildren("Form", ["А", "Удалена", "Б"])
    expect(mergeSavedChildren(current, saved, current)).toEqual([
      { xmlName: "Form", name: "Б" },
      { xmlName: "Form", name: "НоваяА" },
      { xmlName: "Form", name: "НоваяБ" },
    ])
  })

  it("uses canonical order when saved children are absent", () => {
    const canonical = canonicalNamedChildren("Template", ["Б", "А"])
    expect(mergeSavedChildren([...canonical].reverse(), undefined, canonical)).toEqual(canonical)
  })

  it("rejects duplicate pairs", () => {
    expect(() => canonicalNamedChildren("Form", ["А", "А"])).toThrow("Дублирующийся")
  })
})
