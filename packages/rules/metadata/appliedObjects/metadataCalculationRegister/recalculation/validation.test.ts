import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import type { DependentYamlItemParams } from "../../../ruleRuntime/property/dependentItemRegistry"

import { analyzeRecalculationDimensionLinks } from "./validation"

const current = "ИзмерениеВсеСвойства"
const leadingDimension =
  "РегистрРасчета.РегистрРасчетаВедущий.Измерение.ИзмерениеПараметрыВыбора"
const leadingAttribute =
  "РегистрРасчета.РегистрРасчетаВедущий.Реквизит.РеквизитВедущего"

describe("recalculation leading-register links", () => {
  it("accepts a complete matrix and different field kinds", () => {
    expect(analyze({
      Первое: dimension([current, leadingDimension]),
      Второе: dimension([current, leadingAttribute]),
    })).toEqual([])
  })

  it("reports a register missing from one dimension", () => {
    const diagnostics = analyze({
      Первое: dimension([current, leadingDimension]),
      Второе: dimension([current]),
    })

    expect(diagnostics).toEqual([expect.objectContaining({
      path: "/Измерения/Второе/ДанныеВедущихРегистров",
      severity: "error",
      source: "cross-file",
      message: expect.stringContaining("РегистрРасчетаВедущий"),
    })])
  })

  it("does not require registers absent from every dimension", () => {
    expect(analyze({
      Первое: dimension([current]),
      Второе: dimension([current]),
    })).toEqual([])
  })

  it("does not cascade after a broken reference", () => {
    expect(analyze({
      Первое: dimension([current, leadingDimension]),
      Второе: dimension([current]),
    }, (canonical) => canonical.includes("РегистрРасчетаВедущий") ? "missing" : "found")).toEqual([])
  })

  it("skips a sparse adopted dimension", () => {
    expect(analyze({
      Собственное: dimension([current, leadingDimension]),
      Заимствованное: {},
    })).toEqual([])
  })
})

function dimension(leadingRegisterData: string[]) {
  return {
    ИзмерениеРегистра: current,
    ДанныеВедущихРегистров: leadingRegisterData,
  }
}

function analyze(
  dimensions: Record<string, Record<string, unknown>>,
  metadataTargetLookup: NonNullable<DependentYamlItemParams["metadataTargetLookup"]> = () => "found",
) {
  const parsed = parseMetadataYaml(JSON.stringify({ Измерения: dimensions }, null, 2))
  const rootYaml = parsed.data as Record<string, unknown>
  return Object.entries(dimensions).flatMap(([itemName, item]) =>
    analyzeRecalculationDimensionLinks({
      itemType: "MetadataCalculationRegisterRecalculationDimension",
      itemName,
      item,
      itemYamlPath: ["Измерения", itemName],
      rootYaml,
      rootRule: {},
      filePath: "/project/Свойства.yaml",
      parsed,
      owner: { dir: "РегистрРасчета", name: "РегистрРасчетаВсеСвойства" },
      metadataTargetLookup,
    }).diagnostics)
}
