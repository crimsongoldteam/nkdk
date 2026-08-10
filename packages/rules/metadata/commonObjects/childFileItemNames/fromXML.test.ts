import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { importChildFileItemNamesFromXML } from "./fromXML"

const rule = { type: "ChildFileItemNames" as const, xml: "Table", forReferenceOnly: true as const }

describe("importChildFileItemNamesFromXML", () => {
  it("возвращает undefined при xml = undefined", () => {
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, undefined)).toBeUndefined()
  })

  it("возвращает undefined при xml = null", () => {
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, null)).toBeUndefined()
  })

  it("возвращает undefined при пустом массиве", () => {
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, [])).toBeUndefined()
  })

  it("возвращает массив имён file-item объектов при xml = массив", () => {
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, ["Таблица", "Куб"])).toEqual(["Таблица", "Куб"])
  })

  it("оборачивает одиночную строку в массив", () => {
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, "Таблица")).toEqual(["Таблица"])
  })
})
