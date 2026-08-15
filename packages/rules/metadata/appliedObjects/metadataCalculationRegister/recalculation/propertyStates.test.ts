import { describe, expect, it } from "vitest"
import { Type } from "typebox"

import {
  metadataCalculationRegisterRecalculationDimensionPropertyStateCapabilities,
  metadataCalculationRegisterRecalculationPropertyStateCapabilities,
} from "./propertyStates"
import {
  createPropertyStateCapabilityRegistry,
} from "../../configurationExtension/propertyStateCapabilities"
import {
  configurationExtensionPropertyStateCapabilities,
} from "../../configurationExtension/propertyStateRules"
import { exportBorrowedPropertyStateSchema } from "../../../ruleRuntime/property/propertyStateSchema"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { MetadataCalculationRegisterRecalculationDimensionRules } from "./dimension/rules"

describe("recalculation configuration-extension property states", () => {
  it.each([
    metadataCalculationRegisterRecalculationPropertyStateCapabilities,
    metadataCalculationRegisterRecalculationDimensionPropertyStateCapabilities,
  ])("uses the borrowed object profiles", (contribution) => {
    expect(contribution.item?.profiles).toEqual(["borrowed-base", "mutable-synonym"])
  })

  it("keeps recalculation links optional for a borrowed dimension", () => {
    const registry = createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities)
    const item = registry.item("MetadataCalculationRegisterRecalculationDimension")

    expect(item?.properties.synonym).toMatchObject({ availability: "borrowed" })
    expect(item?.properties.registerDimension).toBeUndefined()
    expect(item?.properties.leadingRegisterData).toBeUndefined()
    if (item === undefined) throw new Error("Recalculation dimension capabilities are missing")
    const schema = exportBorrowedPropertyStateSchema({
      rule: MetadataCalculationRegisterRecalculationDimensionRules,
      capability: item,
      source: Type.Object({
        ИзмерениеРегистра: Type.String(),
        ДанныеВедущихРегистров: Type.Optional(Type.Array(Type.String())),
      }, { additionalProperties: false }),
    })
    expect(compileValidationSchema(schema).Check({})).toBe(true)
  })
})
