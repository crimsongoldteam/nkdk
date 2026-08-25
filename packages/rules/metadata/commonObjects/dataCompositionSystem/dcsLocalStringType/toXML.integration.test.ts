import { importFromYAML } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe,expect,it } from "vitest"
import { serializeDirectXML,testPropertyFromYAMLToXML } from "../../../../tests/directConversion"
import { fixtureDcsLocalStringTwoLangs } from "./__fixtures__/data"

import "./fromYAML"
import "./toXML"

const rule = {
  itemType: "DcsLocalStringProbe",
  properties: {
    title: { type: "DcsLocalStringType", yaml: "Заголовок", xml: "dcsset:userSettingPresentation" },
  },
} as MetadataItemRule

describe("DcsLocalStringType YAML → XML", () => {

  it("always exports an ordinary one-language value as LocalStringType", () => {
    expect(convert("Заголовок: Текст")).toContain(
      '<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">',
    )
  })

  it("exports two languages as LocalStringType", () => {
    const xml = serializeDirectXML(
      testPropertyFromYAMLToXML({ rule, yaml: { Заголовок: fixtureDcsLocalStringTwoLangs.items } }).xml,
    )

    expect(xml).toContain('<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">')
    expect(xml).toContain("English language - local string")
  })
})

function convert(yaml: string): string {
  return serializeDirectXML(testPropertyFromYAMLToXML({ rule, yaml: importFromYAML(yaml) }).xml)
}
