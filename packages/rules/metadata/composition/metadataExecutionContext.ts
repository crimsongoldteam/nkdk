import { withPropertyRuleRegistrySet, withRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { withOperationRegistrySet } from "../operations/operationExecutionContext"
import type { OperationRegistrySet } from "../operations/operationRegistrySet"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { withValidationRegistrySet } from "../validation/validationExecutionContext"
import type { ValidationRegistrySet } from "../validation/validationRegistrySet"
import { metadataRules } from "./metadataRules"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../validation/validationRegistrySet"
import { createOperationRegistrySet } from "../operations/operationRegistrySet"

export interface MetadataExecutionRegistrySets {
  readonly rules: RuleRegistrySet
  readonly validation: ValidationRegistrySet
  readonly operations: OperationRegistrySet
}

export function createMetadataExecutionRegistrySets(): MetadataExecutionRegistrySets {
  const rules = createRuleRegistrySet(metadataRules)
  return {
    rules,
    validation: createValidationRegistrySet(metadataRules, rules),
    operations: createOperationRegistrySet(metadataRules),
  }
}

export function withMetadataExecutionRegistrySets<Result>(
  registries: MetadataExecutionRegistrySets,
  execute: () => Result,
): Result {
  return withRuleRegistrySet(registries.rules, () =>
    withPropertyRuleRegistrySet(registries.rules.property, () =>
      withValidationRegistrySet(registries.validation, () =>
        withOperationRegistrySet(registries.operations, execute))))
}
