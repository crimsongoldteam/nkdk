import { describe, expect, it } from "vitest"

import { mockContextToXML } from "../../../tests/mockContext"
import {
  testMetadataItemFromYAMLToXML,
  testMetadataItemYamlRoundTrip,
} from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { aggregatesYAML, currentRegisterName } from "./__fixtures__/data"
import { AccumulationRegisterAggregatesRules } from "./rules"

import "./register"
import { callAtomicToXML } from "../../ruleRuntime/property/fromYAMLToXML"

const fixture = "../../../appliedObjects/metadataAccumulationRegister/__fixtures__/sync/xml/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml"

describe("AccumulationRegisterAggregates YAML → XML", () => {
  it("не восстанавливает удалённые измерения из reference", () => {
    const context = mockContextToXML()
    context.exportToXML.context!.parentName = currentRegisterName
    const invocation = {
      context, rule: { type: "AccumulationRegisterAggregateDimensions" as const }, value: undefined,
      referenceValue: { СтароеИзмерение: true },
    }
    expect(callAtomicToXML(invocation)).toBeUndefined()
  })
  it("берёт владельца измерений из регистра, а не из вложенного агрегата", () => {
    const context = mockContextToXML()
    context.exportToXML = { ...context.exportToXML, itemsTree: [
      { itemType: "MetadataAccumulationRegister", name: currentRegisterName, path: "" },
      { itemType: "AccumulationRegisterAggregates", name: "", path: "Агрегаты" },
      { itemType: "AccumulationRegisterAggregate", name: "", path: "Агрегаты/0" },
    ] }
    const result = testMetadataItemFromYAMLToXML({ context, rule: AccumulationRegisterAggregatesRules, yaml: aggregatesYAML })
    expect(result.xml).toHaveProperty("AccumulationRegisterAggregates.Aggregate.0.Dimensions.Dimension.0._ref",
      `AccumulationRegister.${currentRegisterName}.Dimension.ИзмерениеВсеСвойства`)
  })

  it("round-trips real Aggregates.xml and restores dimension refs from current register context", () => {
    const context = mockContextToXML()
    context.exportToXML.context!.parentName = currentRegisterName
    const result = testMetadataItemYamlRoundTrip({
      context,
      rule: AccumulationRegisterAggregatesRules,
      sourceXML: readXMLFixtureAsString(import.meta.url, fixture),
    })

    expect(normalizeXML(result.result)).toBe(
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
