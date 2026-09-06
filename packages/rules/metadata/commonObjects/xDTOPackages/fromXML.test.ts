import { describe, expect, it } from "vitest"
import { importContentFromXML } from "@nkdk/runtime"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importXDTOPackagesFromXML } from "./fromXML"
import type { XDTOPackagesXML } from "./types"

describe("structural XDTO packages", () => {
  it.each([
    ["<Packages/>", undefined],
    ["<Packages><xr:Item/></Packages>", undefined],
    ['<Packages><xr:Item><xr:Value xsi:type="xr:MDObjectRef">XDTOPackage.Основной</xr:Value></xr:Item><xr:Item><xr:Value xsi:type="xs:string">12345678-1234-4234-9234-123456789abc</xr:Value></xr:Item></Packages>', ["XDTOPackage.Основной", "12345678-1234-4234-9234-123456789abc"]],
    ['<Packages><xr:Item><xr:Value xsi:type="xs:string"/></xr:Item></Packages>', [""]],
    ['<Packages><xr:Item><xr:Value>untyped</xr:Value></xr:Item></Packages>', [""]],
  ])("preserves %s", (xml, expected) => {
    expect(importXDTOPackagesFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ Packages?: XDTOPackagesXML }>(xml).Packages)).toEqual(expected)
    expect(importXDTOPackagesFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })
})
