import type { RegisteredProjectSpec } from "../metadata/projectDefinition/projectSpecContracts"

export function projectSpecFixturePath(spec: RegisteredProjectSpec, itemName: string): string {
  return spec.projectLayout === "flatFile"
    ? `${spec.dir}/${itemName}.yaml`
    : `${spec.dir}/${itemName}/Свойства.yaml`
}

export function projectSpecFixturePaths(
  specs: readonly RegisteredProjectSpec[],
  itemName: string,
): string[] {
  return specs
    .map((spec) => projectSpecFixturePath(spec, itemName))
    .sort((left, right) => left.localeCompare(right, "ru"))
}
