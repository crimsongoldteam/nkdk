import type {
  ComponentValidationLayer,
  ProjectValidationGraph,
  ValidationGraphContribution,
} from "./projectValidationTypes"

export function createProjectValidationGraph(layers: readonly ComponentValidationLayer[]): ProjectValidationGraph {
  const byComponent = new Map<string, ValidationGraphContribution>()
  for (const layer of layers) {
    if (byComponent.has(layer.componentPath)) {
      throw new Error(`Повторный validation-слой компонента: ${layer.componentPath}`)
    }
    byComponent.set(layer.componentPath, cloneValidationContribution(layer.contribution))
  }

  return {
    layers: [...byComponent.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([componentPath, contribution]) => ({
        componentPath,
        contribution,
      })),
  }
}

function cloneValidationContribution(contribution: ValidationGraphContribution): ValidationGraphContribution {
  return {
    objectRecords: [...contribution.objectRecords],
    ...(contribution.objectIndexEntries === undefined
      ? {}
      : { objectIndexEntries: [...contribution.objectIndexEntries] }),
    ...(contribution.memberIndexEntries === undefined
      ? {}
      : { memberIndexEntries: [...contribution.memberIndexEntries] }),
    ...(contribution.valueIndexEntries === undefined ? {} : { valueIndexEntries: [...contribution.valueIndexEntries] }),
    ...(contribution.pendingReferences === undefined ? {} : { pendingReferences: [...contribution.pendingReferences] }),
  }
}
