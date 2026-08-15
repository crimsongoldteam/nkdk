import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import {
  createConfigurationLanguages,
  importContentFromXML,
  yamlMappingTagOf,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import { importFormattedI8nTextFromXML } from "./fromXML"
import { FormattedI8nTextPropertyRule, FormattedI8nTextXML } from "./types"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"

const multilingualXMLContext = {
  ...mockContextFromXML(),
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en", "de"] }),
}

describe("importFormattedI8nTextFromXML", () => {
  it.each(formattedI8nTextFixtures)("should import: $name", (fixture) => {
    const xml = fixture.xml ? importContentFromXML<{ Title: FormattedI8nTextXML }>(fixture.xml) : undefined
    const result = importFormattedI8nTextFromXML(multilingualXMLContext, mockRule, xml?.Title)
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

  it("preserves order and duplicate anomalies on items", () => {
    const result = importFormattedI8nTextFromXML(multilingualXMLContext, mockRule, {
      "v8:item": [
        { "v8:lang": "en", "v8:content": "Group" },
        { "v8:lang": "ru", "v8:content": "Группа" },
        { "v8:lang": "ru", "v8:content": "Группа" },
      ],
    })!

    expect(yamlMappingTagOf(result.items)).toBe("xml/order")
    expect(yamlScalarTagAt(result.items, "ru")).toBe("xml/duplicate")
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
