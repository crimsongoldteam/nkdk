import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { importPropertyFromXML } from "../../../ruleRuntime"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { serializeYAMLDocument, importContentFromXML, parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import {
  nilAndBooleanAvailableValues,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"
import "../index"
import { createPropertyRuleExecutor, createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../../composition/metadataRules"
import { testPropertiesYamlRoundTrip } from "../../../../tests/directConversion"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"
import { readXMLFixtureAsString } from "../../../../tests/readFixtureXML"
import { xmlElementChildren } from "@nkdk/runtime"
import { importDcsAvailableValuesFromXML } from "./fromXML"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__")
const rule = { type: "DcsAvailableValues", xml: "dcssch:availableValue" } as const
const execution = createPropertyRuleExecutor(createRuleRegistrySet(metadataRules).property)

describe("import DcsAvailableValues from XML", () => {
  it.each([
    ["<dcssch:availableValue/>", undefined],
    ["<dcssch:availableValue><dcssch:value/></dcssch:availableValue>", [{ itemType: "DcsAvailableValue" }]],
    ['<dcssch:availableValue><dcssch:value xsi:type="xs:string"/></dcssch:availableValue>', [{ itemType: "DcsAvailableValue", value: { type: "string", value: "" } }]],
  ])("preserves empty available values: %s", (xml, expected) => {
    const legacy = importContentFromXML<{ "dcssch:availableValue": unknown }>(xml)["dcssch:availableValue"]
    expect(importDcsAvailableValuesFromXML(mockContextFromXML(), rule, legacy)).toEqual(expected)
    expect(importDcsAvailableValuesFromXML(mockContextFromXML(), rule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it.each([
    ["strings.xml", stringAvailableValues],
    ["nilAndBoolean.xml", nilAndBooleanAvailableValues],
  ] as const)("imports nodes without XML wrappers: %s", (path, expected) => {
    const root = parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, path))
    expect(importDcsAvailableValuesFromXML(mockContextFromXML(), rule, xmlElementChildren(root))).toEqual(expected)
  })

  it("imports string values and presentations", () => {
    const xml = readAndParseXMLFile<{ root: { "dcssch:availableValue": unknown } }>("strings.xml", fixturesDir)
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xml.root["dcssch:availableValue"],
      execution,
    })

    expect(result).toEqual(stringAvailableValues)
  })

  it("imports nil and boolean values without null", () => {
    const xml = readAndParseXMLFile<{ root: { "dcssch:availableValue": unknown } }>("nilAndBoolean.xml", fixturesDir)
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xml.root["dcssch:availableValue"],
      execution,
    })

    expect(result).toEqual(nilAndBooleanAvailableValues)
  })

  it("imports preserved xsi:nil string and boolean values without null", () => {
    const xml = importContentFromXML<{ root: { "dcssch:availableValue": unknown } }>(
      `<root>
	<dcssch:availableValue>
		<dcssch:value xsi:nil="true"/>
	</dcssch:availableValue>
	<dcssch:availableValue>
		<dcssch:value xsi:type="xs:boolean">true</dcssch:value>
	</dcssch:availableValue>
</root>`,
      { preserveXsiNil: true }
    )
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xml.root["dcssch:availableValue"],
      execution,
    })

    expect(result).toEqual(nilAndBooleanAvailableValues)
  })

  it("сохраняет повторные XML-узлы через YAML без лишних аномалий", () => {
    const sourceXML = `
	<dcssch:availableValue>
		<dcssch:value xsi:type="xs:string">Выставлен</dcssch:value>
		<dcssch:presentation xsi:type="v8:LocalStringType">
			<v8:item><v8:lang>ru</v8:lang><v8:content>Выставлен</v8:content></v8:item>
		</dcssch:presentation>
	</dcssch:availableValue>
	<dcssch:availableValue>
		<dcssch:value xsi:type="xs:string">Аннулирован</dcssch:value>
		<dcssch:presentation xsi:type="v8:LocalStringType">
			<v8:item><v8:lang>ru</v8:lang><v8:content>Аннулирован</v8:content></v8:item>
		</dcssch:presentation>
	</dcssch:availableValue>
`

    const result = testPropertiesYamlRoundTrip({
      rule: {
        itemType: "DcsAvailableValuesProbe",
        properties: {
          availableValues: {
            type: "DcsAvailableValues",
            xml: "dcssch:availableValue",
            yaml: "ДоступныеЗначения",
          },
        },
      },
      sourceXML,
    })

    expect(result.yamlText).toBe(serializeYAMLDocument({ ДоступныеЗначения: stringAvailableValuesYAML }).text)
    expect(result.yamlText).not.toContain("!xml/")
    expect(parseXmlDocumentWithSaxes(`<Root>${result.result}</Root>`).roots[0]!.structuralHash)
      .toEqual(parseXmlDocumentWithSaxes(`<Root>${sourceXML}</Root>`).roots[0]!.structuralHash)
  })
})
