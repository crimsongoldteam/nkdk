import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { importXMLRootFromXML } from "./fromXML"

describe("importXMLRootFromXML", () => {
  it("возвращает undefined при любом входе — обёртка обрабатывается оркестратором", () => {
    const rule = {
      type: "XMLRoot",
      container: "DocumentNumerator",
      rootAttributes: {},
      forReferenceOnly: true,
    } as const
    const xml = {
      _uuid: "04a24565-fe2a-45f1-bb2a-e0aef3324322",
      Properties: { Name: "НумераторПоУмолчанию" },
    }
    const result = importXMLRootFromXML(mockContextFromXML(), rule as any, xml)
    expect(result).toBeUndefined()
  })

  it("возвращает undefined когда xml === undefined", () => {
    const result = importXMLRootFromXML(mockContextFromXML(), undefined, undefined)
    expect(result).toBeUndefined()
  })
})
