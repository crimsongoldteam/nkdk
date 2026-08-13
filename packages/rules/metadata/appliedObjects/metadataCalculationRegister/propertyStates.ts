import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataCalculationRegisterRules } from "./rules"

export const metadataCalculationRegisterPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCalculationRegisterRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("periodicity", "actionPeriod", "basePeriod", "chartOfCalculationTypes", "schedule", "scheduleValue", "scheduleDate"),
})
