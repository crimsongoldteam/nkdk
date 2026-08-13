import type {
  DataTableDeclarationContribution,
  DataTableDeclarationContributor,
} from "./contracts"

export interface DataTableRegistrySet {
  readonly contributors: readonly DataTableDeclarationContributor[]
}

export function createDataTableRegistrySet(
  contributions: readonly DataTableDeclarationContribution[],
): DataTableRegistrySet {
  return {
    contributors: contributions.map(({ contributor }) => contributor),
  }
}
