import { describe, it, expect } from "vitest"
import { importTypeLinkFromXML } from "./importFromXML"
import { TTypeLinkXML } from "./types"
import { xmlImport } from "~/lib"

describe("importTypeLinkFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importTypeLinkFromXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should import TypeLink with numeric LinkItem", () => {
    const xmlData = `<TypeLinkXML>
    <xr:DataPath>Реквизит1</xr:DataPath>
    <xr:LinkItem>1</xr:LinkItem>
</TypeLink>`

    const expectedResult = {
      dataPath: "Реквизит1",
      linkItem: 1,
    }

    const xml = xmlImport<{ TypeLink: TTypeLinkXML }>(xmlData)
    const result = importTypeLinkFromXML(xml.TypeLink)

    expect(result).toEqual(expectedResult)
  })
})
