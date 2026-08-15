import type { MetadataTargetOwnerContext } from "@nkdk/runtime"

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
}) {
  const contexts = createDirectRoundTripContexts({
    metadataTargetOwners: params.metadataTargetOwners,
  })
  return withMetadataExecutionRegistrySets(createMetadataExecutionRegistrySets(metadataRules), () =>
    testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: RecalculationRules,
      name: "ПерерасчетВсеСвойства",
      yaml: params.yaml,
    }))
}
