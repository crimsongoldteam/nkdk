import { describe, expect, it } from "vitest"
import { xmlImport } from "~/packages/core"
import { mockСontext } from "~/tests/mockContext"
import { importTypeLinkFromXML } from "./importFromXML"
import { TypeLink, TypeLinkXML } from "./types"

describe("importTypeLinkFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importTypeLinkFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import TypeLink with numeric LinkItem", () => {
    const xmlData = `<TypeLink>
\t<xr:DataPath>Реквизит1</xr:DataPath>
\t<xr:LinkItem>1</xr:LinkItem>
</TypeLink>`

    const expectedResult: TypeLink = {
      dataPath: "Реквизит1",
      linkItem: 1,
    }

    const xml = xmlImport<{ TypeLink: TypeLinkXML }>(xmlData)

    const result = importTypeLinkFromXML(mockСontext, xml.TypeLink)

    expect(result).toEqual(expectedResult)
  })
})
