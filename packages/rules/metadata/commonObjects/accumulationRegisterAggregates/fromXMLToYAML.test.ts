import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { aggregatesYAML } from "./__fixtures__/data"
import { AccumulationRegisterAggregatesRules } from "./rules"

import "./register"

const fixture = "../../../appliedObjects/metadataAccumulationRegister/__fixtures__/sync/xml/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml"

describe("AccumulationRegisterAggregates XML → YAML", () => {
  it("imports aggregate YAML model without reference-only ids", () => {
    const xml = readAppliedObjectFixture(import.meta.url, fixture)
    const result = testMetadataItemFromXMLToYAML({ rule: AccumulationRegisterAggregatesRules, xml })

    expect(result.yaml).toEqual(aggregatesYAML)
    expect(JSON.stringify(result.yaml)).not.toContain("35aa98aa-6732-4e20-8187-b6b54e2ad9ef")
  })

  it("imports aggregate items and dimension refs as names", () => {
    const xml = readAppliedObjectFixture(import.meta.url, fixture)
    const result = testMetadataItemFromXMLToYAML({ rule: AccumulationRegisterAggregatesRules, xml })

    expect(result.yaml).toMatchObject([
      { Измерения: { ИзмерениеВсеСвойства: "Истина", ИспользоватьХранилищеДвоичныхДанных: "Истина" } },
      { Измерения: { ИзмерениеВсеСвойства: "Ложь", ИспользоватьХранилищеДвоичныхДанных: "Ложь" } },
    ])
  })

  it("exports aggregate dimensions as a YAML map keyed by dimension name", () => {
    const xml = readAppliedObjectFixture(import.meta.url, fixture)
    const result = testMetadataItemFromXMLToYAML({ rule: AccumulationRegisterAggregatesRules, xml })

    expect(result.yaml).toEqual(aggregatesYAML)
  })
})
