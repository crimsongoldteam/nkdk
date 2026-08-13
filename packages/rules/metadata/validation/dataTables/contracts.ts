import type {
  MetadataReferenceResolveResult,
  PendingMetadataTargetReference,
} from "../projectReferenceIndex"
import type { ParsedMetadataTarget } from "@nkdk/runtime/rule-kit"
import type { ValidationObjectRecord } from "../projectValidationTypes"

export interface DataTableFieldDeclaration {
  readonly canonical: string
  readonly target: Extract<ParsedMetadataTarget, { kind: "dataTableField" }>
  readonly result: MetadataReferenceResolveResult
}

export interface DataTableDeclaration {
  readonly canonical: string
  readonly target: Extract<ParsedMetadataTarget, { kind: "dataTable" }>
  readonly result: MetadataReferenceResolveResult
  readonly fields: readonly DataTableFieldDeclaration[]
}

export type DataTableDeclarationContributor = (
  records: readonly ValidationObjectRecord[],
) => Iterable<DataTableDeclaration>

export interface DataTableDeclarationContribution {
  readonly kind: "dataTableDeclarations"
  readonly contributor: DataTableDeclarationContributor
}

export interface DataTableIndex {
  resolve(
    reference: PendingMetadataTargetReference,
    context?: { readonly tableCanonical?: string },
  ): import("../projectReferenceIndex").ProjectReferenceIndexResult
}
