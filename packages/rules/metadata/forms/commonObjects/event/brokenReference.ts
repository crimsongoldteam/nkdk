import {
  defineMetadataRules,
  definePropertyTypeRule,
  emptyMetadataRules,
  propertyTypesFromContributions,
} from "@nkdk/runtime/rule-kit"
import { collectEventMetadataTargetOccurrences } from "./metadataTargetOccurrences"

export const brokenEventReferenceRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    definePropertyTypeRule("Events", "metadataTargetOccurrences", collectEventMetadataTargetOccurrences),
  ]),
})
