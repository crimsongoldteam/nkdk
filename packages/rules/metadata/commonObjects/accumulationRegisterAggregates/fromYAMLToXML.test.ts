import { describe, expect, it } from "vitest"

import { mockContextToXML } from "../../../tests/mockContext"
import {
  readAppliedObjectFixture,
  serializeDirectXML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { aggregatesYAML, currentRegisterName } from "./__fixtures__/data"
import { AccumulationRegisterAggregatesRules } from "./rules"

import "./register"

const fixture = "../../../appliedObjects/metadataAccumulationRegister/__fixtures__/sync/xml/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml"

describe("AccumulationRegisterAggregates YAML → XML", () => {
  it("round-trips real Aggregates.xml and restores dimension refs from current register context", () => {
    const context = mockContextToXML()
    context.exportToXML.context!.parentName = currentRegisterName
    const referenceXML = readAppliedObjectFixture(import.meta.url, fixture)

    const result = testMetadataItemFromYAMLToXML({
      context,
      rule: AccumulationRegisterAggregatesRules,
      yaml: aggregatesYAML,
      referenceXML,
    })

    expect(normalizeXML(serializeDirectXML(result.xml))).toBe(
      normalizeXML(readXMLFixtureAsString(import.meta.url, fixture))
    )
  })

  it("imports aggregate dimensions from a YAML map keyed by dimension name", () => {
    const context = mockContextToXML()
    context.exportToXML.context!.parentName = currentRegisterName
    const result = testMetadataItemFromYAMLToXML({
      context,
      rule: AccumulationRegisterAggregatesRules,
      yaml: aggregatesYAML,
    })

    expect(result.xml).toMatchObject({
      AccumulationRegisterAggregates: {
        Aggregate: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: {
              Dimension: expect.arrayContaining([
                { _ref: `AccumulationRegister.${currentRegisterName}.Dimension.ИзмерениеВсеСвойства`, "#text": true },
              ]),
            },
          }),
        ]),
      },
    })
  })
})

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")
