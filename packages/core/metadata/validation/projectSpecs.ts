import { Type } from "typebox"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import type { RegisteredProjectSpec } from "../projectDefinition/projectSpecContracts"

export type ValidationProjectSpec = RegisteredProjectSpec

export const validationProjectSpecs: ValidationProjectSpec[] = []
export const validationProjectSpecByDir = new Map<string, ValidationProjectSpec>()
export let configurationValidationProjectSpec: ValidationProjectSpec = {
  kind: "configuration",
  dir: "",
  rule: { itemType: "MetadataConfiguration", properties: {} } as MetadataItemRule,
  exportSchema: () => Type.Object({}),
}

export function registerValidationProjectSpecs(projectSpecs: readonly RegisteredProjectSpec[]): void {
  validationProjectSpecs.splice(0, validationProjectSpecs.length, ...projectSpecs.filter((spec) => spec.dir !== ""))
  validationProjectSpecByDir.clear()
  for (const spec of validationProjectSpecs) validationProjectSpecByDir.set(spec.dir, spec)
  configurationValidationProjectSpec = projectSpecs.find((spec) => spec.dir === "")
    ?? configurationValidationProjectSpec
}

export function getValidationProjectSpecByDir(dir: string): ValidationProjectSpec | undefined {
  return dir === "" ? configurationValidationProjectSpec : validationProjectSpecByDir.get(dir)
}
