import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { aggregates, aggregatesReference } from "./__fixtures__/data"
import { AccumulationRegisterAggregatesRules } from "./rules"

import "./register"

const aggregatesXmlPath = join(
  __dirname,
  "../../appliedObjects/metadataAccumulationRegister/__fixtures__/sync/xml/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml"
)

describe("import AccumulationRegisterAggregates from XML", () => {
  it("imports aggregate YAML model without reference-only ids", () => {
    const xmlString = readFileSync(aggregatesXmlPath, "utf-8")

    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: AccumulationRegisterAggregatesRules,
      xmlString,
    })

    expect(result).toEqual(aggregates)
  })

  it("imports aggregate items and dimension refs as names", () => {
    const xmlString = readFileSync(aggregatesXmlPath, "utf-8")

    const result = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: AccumulationRegisterAggregatesRules,
      xmlString,
    })

    expect(JSON.parse(JSON.stringify(result))).toEqual(aggregatesReference)
  })
})
