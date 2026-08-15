import type { ConfigurationContextWithExportToXML, MetadataTargetOwnerContext } from "@nkdk/runtime"

import { RecalculationRules } from "../metadata/appliedObjects/metadataCalculationRegister/recalculation/rules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../metadata/composition/metadataExecutionContext"
import { metadataRules } from "../metadata/composition/metadataRules"
import {
  createDirectRoundTripContexts,
  testMetadataItemFromYAMLToXML,
} from "./directConversion"

export function exportRecalculationYAML(params: {
  readonly yaml: unknown
  readonly metadataTargetOwners: readonly MetadataTargetOwnerContext[]
  readonly referenceXML?: unknown
  readonly logicalAddress?: string
  readonly context?: ConfigurationContextWithExportToXML
}) {
  const contexts = createDirectRoundTripContexts({
    logicalAddress: params.logicalAddress,
    metadataTargetOwners: params.metadataTargetOwners,
  })
  return withMetadataExecutionRegistrySets(createMetadataExecutionRegistrySets(metadataRules), () =>
    testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(params.context),
      rule: RecalculationRules,
      name: "ПерерасчетВсеСвойства",
      yaml: params.yaml,
      referenceXML: params.referenceXML,
    }))
}
