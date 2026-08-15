import type { ConfigurationContextWithExportToXML, MetadataTargetOwnerContext } from "@nkdk/runtime"

import {
  createDirectRoundTripContexts,
  testMetadataItemFromYAMLToXML,
} from "../../../../tests/directConversion"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../composition/metadataExecutionContext"
import { metadataRules } from "../../../composition/metadataRules"
import { RecalculationRules } from "./rules"

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
