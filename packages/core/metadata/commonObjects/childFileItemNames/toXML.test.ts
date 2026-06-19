import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { exportChildFileItemNamesToXML } from "./toXML"

const rule = { type: "ChildFileItemNames" as const, xml: "Table", forReferenceOnly: true as const }

describe("exportChildFileItemNamesToXML", () => {
  it("возвращает непустой массив имён file-item объектов", () => {
    expect(
      exportChildFileItemNamesToXML({ context: mockContextToXML(), rule, value: ["Таблица", "Куб"] })
    ).toEqual(["Таблица", "Куб"])
  })

  it("возвращает undefined при пустом массиве", () => {
    expect(exportChildFileItemNamesToXML({ context: mockContextToXML(), rule, value: [] })).toBeUndefined()
  })

  it("возвращает undefined при value = undefined", () => {
    expect(exportChildFileItemNamesToXML({ context: mockContextToXML(), rule, value: undefined })).toBeUndefined()
  })
})
