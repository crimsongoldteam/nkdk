export interface MetadataResourceTopologyTypeMap {}

/** Минимальная структурная часть правила, необходимая топологии ресурсов. */
interface NeutralMetadataResourceItemRule extends TopologyMetadataTargetOwnerRule {
  readonly properties: Readonly<Record<string, any>>
  readonly externalMetadata?: {
    readonly segment: string
    readonly placement: "rootEntry" | "ownerChild" | "ownedEntry"
  }
}

export type MetadataResourceItemRule = keyof MetadataResourceTopologyTypeMap extends never
  ? NeutralMetadataResourceItemRule
  : MetadataResourceTopologyTypeMap extends { itemRule: infer ItemRule }
    ? ItemRule
    : NeutralMetadataResourceItemRule

export type MetadataResourceRole =
  | "configuration"
  | "properties"
  | "fileItem"
  | "metadata"
  | "body"
  | "property"
  | "form"
  | "external"

export interface TopologyMetadataTargetOwnerRule {
  readonly itemType: string
  readonly metadataTargetOwner?:
    | { readonly kind: "inherit" }
    | { readonly kind: "self"; readonly root: string }
    | { readonly kind: "resolver" }
}

export interface TopologyMetadataTargetOwner {
  readonly root: string
  readonly objectName: string
}

export interface TopologyMetadataTargetOwnerFrame {
  readonly itemType: string
  readonly name: string
  readonly owner?: TopologyMetadataTargetOwner
}

export type TopologyMetadataTargetOwnerResolver = (params: {
  readonly itemRule: TopologyMetadataTargetOwnerRule
  readonly name: string | undefined
  readonly frames: readonly TopologyMetadataTargetOwnerFrame[]
  readonly context?: object
}) => TopologyMetadataTargetOwner | undefined

export interface MetadataResourceSource {
  readonly kind: "projectSpec" | "itemRule" | "property"
  readonly description: string
  readonly propertyName?: string
  readonly propertyType?: string
}

export interface MetadataContentDeclaration {
  readonly kind: "content"
  readonly projectPattern: string
  readonly role: "configuration" | "properties" | "fileItem"
  readonly required: boolean
  readonly repeatable: boolean
  readonly compositionImpact: "none" | "configurationComposition"
  readonly projectRole?: "form"
  readonly itemRule: MetadataResourceItemRule
  readonly logicalAddressSegment?: string
  readonly ownerProjectPattern?: string
  readonly dumpInfoNamePatterns?: readonly string[]
  readonly source: MetadataResourceSource
  readonly fileBackedTarget?: MetadataFileBackedMemberTargetDeclaration
}

export interface MetadataFileBackedMemberTargetDeclaration {
  readonly kind: "member"
  readonly memberKind: "Form" | "Template"
  readonly itemNameParameter: string
  readonly itemProjectPattern: string
  readonly owner: "assignment" | "assignmentOwner"
}

export interface CompiledMetadataFileBackedMemberTargetDeclaration
  extends MetadataFileBackedMemberTargetDeclaration {
  readonly ownerProjectPattern: string
  readonly ownerAssignmentNodeId: string
}

export interface MetadataXmlDocumentDeclaration {
  readonly kind: "xmlDocument"
  readonly assignmentProjectPattern: string
  readonly xmlPattern: string
  readonly role: "metadata" | "body" | "property"
  readonly required: boolean
  readonly read?: { readonly inputRole: "metadata" | "body" | "property" }
  readonly prepareCapabilityId?: string
  readonly baseInput?: MetadataXmlBaseInputDeclaration
  readonly source: MetadataResourceSource
}

export interface MetadataXmlBaseInputDeclaration {
  readonly kind: "sameProjectPath"
  readonly value: "wholeYaml" | "sourceProperty"
  readonly propertyName?: string
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
  readonly fileBackedTarget?: MetadataFileBackedMemberTargetDeclaration
}

export interface MetadataYamlCompanionDeclaration {
  readonly kind: "yamlCompanion"
  readonly assignmentProjectPattern: string
  readonly projectPattern: string
  readonly required: boolean
  readonly itemRule: MetadataResourceItemRule
  readonly projectRole: "form"
  readonly indexContribution: "isolated"
  readonly logicalAddressSegment: string
  readonly source: MetadataResourceSource
}

export interface MetadataIgnoredPathDeclaration {
  readonly kind: "ignore"
  readonly side: "project" | "xml"
  readonly pattern: string
  readonly snapshotImport?: {
    readonly capabilityId: string
    readonly targetProjectPath: string
  }
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
  | MetadataYamlCompanionDeclaration
  | MetadataExternalFileDeclaration
  | MetadataIgnoredPathDeclaration
  | MetadataChildCollectionDeclaration

export interface MetadataResourceTopologySpec {
  readonly resources?: readonly MetadataResourceDeclaration[]
}

export interface CompiledMetadataXmlDocumentNode extends MetadataXmlDocumentDeclaration {
  readonly id: string
}

export interface CompiledMetadataExternalFileNode
  extends Omit<MetadataExternalFileDeclaration, "fileBackedTarget"> {
  readonly id: string
  readonly projectPattern: string
  readonly xmlPattern: string
  readonly fileBackedTarget?: CompiledMetadataFileBackedMemberTargetDeclaration
}

export interface CompiledMetadataYamlCompanionNode extends MetadataYamlCompanionDeclaration {
  readonly id: string
  readonly projectPattern: string
}

export interface CompiledMetadataAssignmentNode
  extends Omit<MetadataContentDeclaration, "fileBackedTarget"> {
  readonly id: string
  readonly ownerProjectPattern?: string
  readonly fileBackedTarget?: CompiledMetadataFileBackedMemberTargetDeclaration
  readonly xmlDocuments: readonly CompiledMetadataXmlDocumentNode[]
  readonly yamlCompanions: readonly CompiledMetadataYamlCompanionNode[]
  readonly externalFiles: readonly CompiledMetadataExternalFileNode[]
}

export interface CompiledMetadataIgnoredPathNode extends MetadataIgnoredPathDeclaration {
  readonly id: string
}

export interface CompiledMetadataPathMatch {
  readonly nodeId: string
  readonly values: Readonly<Record<string, string>>
}

export interface CompiledMetadataPathCursor {
  readonly canDescend: boolean
  advance(segment: string): CompiledMetadataPathCursor | undefined
  matches(): readonly CompiledMetadataPathMatch[]
}

export interface CompiledMetadataPathIndex {
  root(): CompiledMetadataPathCursor
  match(path: string): readonly CompiledMetadataPathMatch[]
}

export interface CompiledMetadataResourceTopology {
  readonly assignments: readonly CompiledMetadataAssignmentNode[]
  readonly ignoredPaths: readonly CompiledMetadataIgnoredPathNode[]
  readonly projectIndex: CompiledMetadataPathIndex
  readonly xmlIndex: CompiledMetadataPathIndex
}
