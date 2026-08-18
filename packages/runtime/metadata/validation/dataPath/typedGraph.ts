import type { OwnerTypeRef } from "./types"

export type ResolvedDataPathGraphTarget =
  | { readonly kind: "terminal"; readonly terminalTypes: readonly string[] }
  | { readonly kind: "structured"; readonly type: string }
  | { readonly kind: "collection"; readonly itemType: string }
  | { readonly kind: "metadataObject"; readonly owner: OwnerTypeRef }

export type DataPathGraphTarget =
  | ResolvedDataPathGraphTarget
  | { readonly kind: "dynamic"; readonly resolver: string }

export interface TypedDataPathMemberDeclaration {
  readonly internal: string
  readonly yaml: string
  readonly target: DataPathGraphTarget
}

export interface TypedDataPathTypeDeclaration {
  readonly type: string
  readonly aliases?: readonly string[]
  readonly members: readonly TypedDataPathMemberDeclaration[]
}

export interface DataPathTraceMember {
  readonly type: string
  readonly internal: string
  readonly yaml: string
}

export interface ResolvedTypedDataPathMember extends TypedDataPathMemberDeclaration {
  readonly declaringType: string
}

export interface DataPathViewDeclaration {
  readonly purpose: string
  readonly types: Readonly<Record<string, readonly string[]>>
}
