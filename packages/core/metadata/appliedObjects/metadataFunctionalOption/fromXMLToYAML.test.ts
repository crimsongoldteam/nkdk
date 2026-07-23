import { describe, expect, it } from "vitest"
import { testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration"
import { MetadataFunctionalOptionRules } from "./rules"

const rule = {
  itemType: "MetadataFunctionalOptionContentProbe",
  properties: {
    content: MetadataFunctionalOptionRules.properties.content,
  },
} satisfies MetadataItemRule

describe("MetadataFunctionalOption: единый XML → YAML-обход", () => {
  it("отклоняет неподдерживаемые ссылки состава", () => {
    expect(() =>
      testPropertyFromXMLToYAML({
        rule,
        xml: { Properties: { Content: { "xr:Object": ["CommonTemplate.ПечатнаяФорма"] } } },
      })
    ).toThrow()
  })
})
