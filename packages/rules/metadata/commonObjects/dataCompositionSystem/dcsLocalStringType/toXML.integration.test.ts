import { describe, expect, it } from "vitest"
import { importFromYAML } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { serializeDirectXML, testPropertyFromYAMLToXML } from "../../../../tests/directConversion"
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
  it("exports !xml/type String without reference XML", () => {
    expect(convert('Заголовок: !xml/type "String Текст"')).toContain(
      '<dcsset:userSettingPresentation xsi:type="xs:string">Текст</dcsset:userSettingPresentation>',
    )
  })

  it("exports an empty !xml/type String", () => {
    expect(convert("Заголовок: !xml/type String")).toContain(
      '<dcsset:userSettingPresentation xsi:type="xs:string"/>',
    )
  })

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

  it.each(["Заголовок: !xml/type", "Заголовок: !xml/value String Текст", "Заголовок: !xml/type Raw Текст"]) (
    "rejects an unsupported marker: %s",
    (yaml) => expect(() => testPropertyFromYAMLToXML({ rule, yaml: importFromYAML(yaml) })).toThrow(),
  )
})

function convert(yaml: string): string {
  return serializeDirectXML(testPropertyFromYAMLToXML({ rule, yaml: importFromYAML(yaml) }).xml)
}
