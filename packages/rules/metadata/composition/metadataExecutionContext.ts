import {
  enterPropertyRuleRegistrySet,
  enterRuleRegistrySet,
  withPropertyRuleRegistrySet,
  withRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import {
  enterOperationRegistrySet,
  withOperationRegistrySet,
} from "../operations/operationExecutionContext"
import type { OperationRegistrySet } from "../operations/operationRegistrySet"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import {
  enterValidationRegistrySet,
  withValidationRegistrySet,
} from "../validation/validationExecutionContext"
import type { ValidationRegistrySet } from "../validation/validationRegistrySet"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../validation/validationRegistrySet"
import { createOperationRegistrySet } from "../operations/operationRegistrySet"

export interface MetadataExecutionRegistrySets {
  readonly rules: RuleRegistrySet
  readonly validation: ValidationRegistrySet
  readonly operations: OperationRegistrySet
}

export function createMetadataExecutionRegistrySets(
  definition: Parameters<typeof createRuleRegistrySet>[0]
    & Parameters<typeof createValidationRegistrySet>[0]
    & Parameters<typeof createOperationRegistrySet>[0],
): MetadataExecutionRegistrySets {
  const rules = createRuleRegistrySet(definition)
  return {
    rules,
    validation: createValidationRegistrySet(definition, rules),
    operations: createOperationRegistrySet(definition),
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

export function enterMetadataExecutionRegistrySets(registries: MetadataExecutionRegistrySets): void {
  enterRuleRegistrySet(registries.rules)
  enterPropertyRuleRegistrySet(registries.rules.property)
  enterValidationRegistrySet(registries.validation)
  enterOperationRegistrySet(registries.operations)
}
