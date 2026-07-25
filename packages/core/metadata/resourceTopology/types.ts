import type { MetadataItemRule } from "../orchestration/property/types"

export type MetadataResourceRole =
  | "configuration"
  | "properties"
  | "fileItem"
  | "metadata"
  | "body"
  | "property"
  | "external"

export interface MetadataResourceSource {
  readonly kind: "projectSpec" | "itemRule" | "property"
  readonly description: string
}

export interface MetadataContentDeclaration {
  readonly kind: "content"
  readonly projectPattern: string
  readonly role: "configuration" | "properties" | "fileItem"
  readonly required: boolean
  readonly repeatable: boolean
  readonly compositionImpact: "none" | "configurationComposition"
  readonly itemRule: MetadataItemRule
  readonly logicalAddressSegment?: string
  readonly ownerProjectPattern?: string
  readonly dumpInfoNamePatterns?: readonly string[]
  readonly source: MetadataResourceSource
}

export interface MetadataXmlDocumentDeclaration {
  readonly kind: "xmlDocument"
  readonly assignmentProjectPattern: string
  readonly xmlPattern: string
  readonly role: "metadata" | "body" | "property"
  readonly required: boolean
  readonly read?: { readonly inputRole: "metadata" | "body" | "property" }
  readonly prepareCapabilityId?: string
  readonly source: MetadataResourceSource
}

export interface MetadataExternalFileDeclaration {
  readonly kind: "externalFile"
  readonly assignmentProjectPattern: string
  readonly projectPattern: string
  readonly xmlPattern: string
  readonly direction: "both" | "xmlToProject" | "projectToXml"
  readonly transferCapabilityId: string
  readonly selection?: {
    readonly manifestPattern: string
    readonly listPath: readonly string[]
    readonly candidateParameter: string
    readonly candidateSuffix?: string
    readonly alwaysIncludePrefixes?: readonly string[]
  }
  readonly fallback?: boolean
  readonly dumpInfoNamePatterns?: readonly string[]
  readonly compositionImpact: "none" | "configurationComposition"
  readonly source: MetadataResourceSource
}

export interface MetadataIgnoredPathDeclaration {
  readonly kind: "ignore"
  readonly side: "project" | "xml"
  readonly pattern: string
  readonly source: MetadataResourceSource
}

export interface MetadataChildCollectionDeclaration {
  readonly kind: "childCollection"
  readonly projectBasePattern: string
  readonly xmlBasePattern: string
  readonly declarations: readonly MetadataResourceDeclaration[]
  readonly source: MetadataResourceSource
}

export type MetadataResourceDeclaration =
  | MetadataContentDeclaration
  | MetadataXmlDocumentDeclaration
  | MetadataExternalFileDeclaration
  | MetadataIgnoredPathDeclaration
  | MetadataChildCollectionDeclaration

export interface CompiledMetadataXmlDocumentNode extends MetadataXmlDocumentDeclaration {
  readonly id: string
}

export interface CompiledMetadataExternalFileNode extends MetadataExternalFileDeclaration {
  readonly id: string
  readonly projectPattern: string
  readonly xmlPattern: string
}

export interface CompiledMetadataAssignmentNode extends MetadataContentDeclaration {
  readonly id: string
  readonly ownerProjectPattern?: string
  readonly xmlDocuments: readonly CompiledMetadataXmlDocumentNode[]
  readonly externalFiles: readonly CompiledMetadataExternalFileNode[]
}

export interface CompiledMetadataIgnoredPathNode extends MetadataIgnoredPathDeclaration {
  readonly id: string
}

export interface CompiledMetadataPathMatch {
  readonly nodeId: string
  readonly values: Readonly<Record<string, string>>
}

export interface CompiledMetadataPathIndex {
  readonly match: (path: string) => readonly CompiledMetadataPathMatch[]
}

export interface CompiledMetadataResourceTopology {
  readonly assignments: readonly CompiledMetadataAssignmentNode[]
  readonly ignoredPaths: readonly CompiledMetadataIgnoredPathNode[]
  readonly projectIndex: CompiledMetadataPathIndex
  readonly xmlIndex: CompiledMetadataPathIndex
}
