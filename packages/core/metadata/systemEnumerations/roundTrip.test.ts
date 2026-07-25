import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../tests/directConversion"
import type { MetadataItemRule } from "../orchestration/property/types"

import "./index"

describe("SystemEnumeration XML → YAML → XML", () => {
  it("восстанавливает исходный XML-псевдоним без reference XML", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "SystemEnumerationAliasProbe",
      properties: {
        mode: {
          type: "SystemEnumeration",
          typeSE: "RadioButtonType",
          xml: "RadioButtonType",
          yaml: "Вид",
        },
      },
    } as const satisfies MetadataItemRule

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { RadioButtonType: "RadioButtons" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({ Вид: "Переключатель" })
    expect(exported.xml).toEqual({ RadioButtonType: "RadioButtons" })
  })
})
