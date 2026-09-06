import { createConfigurationIndexCollector, type XmlImportConfigurationContext } from "@nkdk/runtime"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../metadata/composition/metadataRules"
import { prepareImportFacts } from "../metadata/importFromXml/prepareFacts"
import { prepareImportDependencies } from "../metadata/importFromXml/preparedDependencies"
import { prepareImportYamlFromDocuments } from "../metadata/importFromXml/prepareYaml"
import type { ImportAssignment } from "../metadata/importFromXml/types"
import { mockContextToXML } from "./mockContext"

export function prepareProofYaml(
  assignment: ImportAssignment,
  inputs: Parameters<typeof prepareImportYamlFromDocuments>[0]["inputs"],
  context: XmlImportConfigurationContext,
  facts: Awaited<ReturnType<typeof prepareImportFacts>>,
) {
  const execution = createRuleRegistrySet(metadataRules).execution
  return prepareImportYamlFromDocuments({
    assignment, inputs, context, collector: createConfigurationIndexCollector(),
    dependencies: prepareImportDependencies(facts.dependencies, {}, execution),
    localRoundTrip: { execution, context: { ...mockContextToXML(), importFromYAML: context.importFromYAML }, decisions: [] },
  })
}
