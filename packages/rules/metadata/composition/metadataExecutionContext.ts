import {
  enterPropertyRuleRegistrySet,
  enterRuleRegistrySet,
  setDefaultPropertyRuleRegistrySet,
  setDefaultRuleRegistrySet,
  withPropertyRuleRegistrySet,
  withRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import {
  enterOperationRegistrySet,
  setDefaultOperationRegistrySet,
  withOperationRegistrySet,
} from "../operations/operationExecutionContext"
import type { OperationRegistrySet } from "../operations/operationRegistrySet"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import {
  enterValidationRegistrySet,
  setDefaultValidationRegistrySet,
  withValidationRegistrySet,
} from "../validation/validationExecutionContext"
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

export function enterMetadataExecutionRegistrySets(registries: MetadataExecutionRegistrySets): void {
  enterRuleRegistrySet(registries.rules)
  enterPropertyRuleRegistrySet(registries.rules.property)
  enterValidationRegistrySet(registries.validation)
  enterOperationRegistrySet(registries.operations)
}

export function setDefaultMetadataExecutionRegistrySets(registries: MetadataExecutionRegistrySets): void {
  setDefaultRuleRegistrySet(registries.rules)
  setDefaultPropertyRuleRegistrySet(registries.rules.property)
  setDefaultValidationRegistrySet(registries.validation)
  setDefaultOperationRegistrySet(registries.operations)
}
