import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { mockcontext } from "~/lib/tests/mockContext"
import { importTypeLinkFromXML } from "./importFromXML"
import { TypeLink, TypeLinkXML } from "./types"

describe("importTypeLinkFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importTypeLinkFromXML(mockcontext, undefined)

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

    const result = importTypeLinkFromXML(mockcontext, xml.TypeLink)

    expect(result).toEqual(expectedResult)
  })
})
