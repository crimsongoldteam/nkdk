import { describe, expect, it } from "vitest"
import type { MetadataRulesDefinition } from "@nkdk/runtime/rule-kit"

import { fillValueRules } from "./register"
import { ordinaryFillValueItemTypes } from "./ordinaryItemTypes"

const rules: MetadataRulesDefinition = fillValueRules

describe("регистрация FillValue обычных полей", () => {
  it.each(ordinaryFillValueItemTypes)("подключает единый договор для %s", (itemType) => {
    const explicit = Object.values(rules.explicitXMLProperties).find(
      (registration) => registration.itemType === itemType && registration.propertyKey === "fillValue",
    )
    const dependent = rules.dependentItems[itemType]
    const baseline = rules.dependentItems.MetadataAttribute

    expect(explicit).toMatchObject({
      action: "transportScalar",
      overrides: {
        Nil: { "_xsi:nil": true },
        DesignTimeRef: { "_xsi:type": "xr:DesignTimeRef" },
      },
    })
    expect(dependent?.yaml).toBe(baseline?.yaml)
    expect(dependent?.structural).toBe(baseline?.structural)
    expect(dependent?.imported).toBe(baseline?.imported)
  })

  it("не включает StandardAttributeDescription в обычные поля", () => {
    expect(ordinaryFillValueItemTypes).not.toContain("StandardAttributeDescription")
  })

  it("сохраняет Null у поля внешнего источника данных", () => {
    const explicit = Object.values(rules.explicitXMLProperties).find(
      (registration) => registration.itemType === "MetadataExternalDataSourceField",
    )

    expect(explicit).toMatchObject({
      overrides: {
        Null: { "_xsi:type": "v8:Null" },
        DesignTimeRef: { "_xsi:type": "xr:DesignTimeRef" },
      },
    })
  })
})
