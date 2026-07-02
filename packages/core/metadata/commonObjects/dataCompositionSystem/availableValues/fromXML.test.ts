import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { importPropertyFromXML } from "../../../orchestration"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { importContentFromXML } from "../../../../xml/import/importer"
import { nilAndBooleanAvailableValues, stringAvailableValues } from "./__fixtures__/data"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__")
const rule = { type: "DcsAvailableValues", xml: "dcssch:availableValue" } as const

describe("import DcsAvailableValues from XML", () => {
  it("imports string values and presentations", () => {
    const xml = readAndParseXMLFile<{ root: { "dcssch:availableValue": unknown } }>("strings.xml", fixturesDir)
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xml.root["dcssch:availableValue"],
    })

    expect(result).toEqual(stringAvailableValues)
  })

  it("imports nil and boolean values without null", () => {
    const xml = readAndParseXMLFile<{ root: { "dcssch:availableValue": unknown } }>("nilAndBoolean.xml", fixturesDir)
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xml.root["dcssch:availableValue"],
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
    })

    expect(result).toEqual(nilAndBooleanAvailableValues)
  })
})
