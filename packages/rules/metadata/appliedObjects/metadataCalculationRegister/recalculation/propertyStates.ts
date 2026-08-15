import { definePropertyStateItemCapabilities } from "../../configurationExtension/propertyStateCapabilities"
import { MetadataCalculationRegisterRecalculationDimensionRules } from "./dimension/rules"
import { RecalculationRules } from "./rules"

export const metadataCalculationRegisterRecalculationPropertyStateCapabilities =
  definePropertyStateItemCapabilities(RecalculationRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
  })

export const metadataCalculationRegisterRecalculationDimensionPropertyStateCapabilities =
  definePropertyStateItemCapabilities(MetadataCalculationRegisterRecalculationDimensionRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
  })
