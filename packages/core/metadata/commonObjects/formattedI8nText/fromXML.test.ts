import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import importContentFromXML from "../../../xml/import/importer"
import { importFormattedI8nTextFromXML } from "./fromXML"
import { FormattedI8nTextPropertyRule, FormattedI8nTextXML } from "./types"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"

describe("importFormattedI8nTextFromXML", () => {
  it.each(formattedI8nTextFixtures)("should import: $name", (fixture) => {
    const xml = fixture.xml ? importContentFromXML<{ Title: FormattedI8nTextXML }>(fixture.xml) : undefined
    const result = importFormattedI8nTextFromXML(mockContextFromXML(), mockRule, xml?.Title)
    expect(result).toEqual(fixture.text)
  })

  it("should default formatted to false when _formatted attribute is missing", () => {
    const xmlString = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`
    const xml = importContentFromXML<{ Title: FormattedI8nTextXML }>(xmlString)
    const result = importFormattedI8nTextFromXML(mockContextFromXML(), mockRule, xml?.Title)
    expect(result).toEqual({ formatted: false, items: { ru: "Поле" } })
  })

  it("registers an explicit empty value for excludeIfEqualNameYAML", () => {
    const behavior = getTypeRule("FormattedI8nText", "xmlImportPropertyBehavior")
    const rule: FormattedI8nTextPropertyRule = {
      type: "FormattedI8nText",
      excludeIfEqualNameYAML: true,
    }

    expect(behavior?.explicitEmptyValue?.({ rule })).toEqual({
      formatted: false,
      items: {},
    })
  })
})
