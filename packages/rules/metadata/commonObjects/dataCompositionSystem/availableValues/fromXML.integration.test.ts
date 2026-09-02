import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { importPropertyFromXML } from "../../../ruleRuntime"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { createXmlImportAuditSession, importContentFromXML, parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import {
  nilAndBooleanAvailableValues,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"
import "../index"
import { createPropertyRuleExecutor, createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../../composition/metadataRules"
import { testPropertyFromXMLToYAML } from "../../../../tests/directConversion"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__")
const rule = { type: "DcsAvailableValues", xml: "dcssch:availableValue" } as const
const execution = createPropertyRuleExecutor(createRuleRegistrySet(metadataRules).property)

describe("import DcsAvailableValues from XML", () => {
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

  it("imports every repeated structural XML node without audit remainder", () => {
    const document = parseXmlDocumentWithSaxes(`<Root>
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
</Root>`)
    const root = document.roots[0]!
    const audit = createXmlImportAuditSession([root])

    const result = testPropertyFromXMLToYAML({
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
      xml: root,
      audit,
    })

    expect(result.yaml).toEqual({ ДоступныеЗначения: stringAvailableValuesYAML })
    expect([...new Set(audit.outcomes().map(({ state }) => state))]).toEqual(["claimed"])
  })
})
