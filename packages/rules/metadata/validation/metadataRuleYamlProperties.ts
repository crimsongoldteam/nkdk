import {
  validateRuleYAMLObjectProperties,
  type Diagnostic,
  type ValidateExcludedEqualNameYAMLParams,
} from "@nkdk/runtime"
import { traverseMetadataRuleYaml } from "./metadataRuleYamlTraversal"

export function validateMetadataRuleYamlProperties(
  params: ValidateExcludedEqualNameYAMLParams,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  traverseMetadataRuleYaml<{ readonly name: string | undefined }>({
    yaml: params.parsed.data,
    annotations: params.parsed.annotations,
    rule: params.rule,
    initialState: { name: params.name },
    onObject: ({ yaml, rule, yamlPath, state }) => {
      diagnostics.push(...validateRuleYAMLObjectProperties({
        ...params,
        rule,
        value: yaml,
        yamlPath,
        name: state.name,
      }))
    },
    enterCollectionItem: ({ itemName }) => ({ name: itemName }),
  })
  return diagnostics
}
