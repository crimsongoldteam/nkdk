import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { importMetaDataObjectFromXML } from "./fromXML"

describe("importMetaDataObjectFromXML", () => {
  it("возвращает undefined при любом входе — обёртка обрабатывается оркестратором", () => {
    const rule = { type: "MetaDataObject", container: "DocumentNumerator", rootAttributes: {}, forReferenceOnly: true } as const
    const xml = {
      _uuid: "04a24565-fe2a-45f1-bb2a-e0aef3324322",
      Properties: { Name: "НумераторПоУмолчанию" },
    }
    const result = importMetaDataObjectFromXML(mockContextFromXML(), rule as any, xml)
    expect(result).toBeUndefined()
  })

  it("возвращает undefined когда xml === undefined", () => {
    const result = importMetaDataObjectFromXML(mockContextFromXML(), undefined, undefined)
    expect(result).toBeUndefined()
  })
})
