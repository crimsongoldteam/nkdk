import type { MetadataMemberKind, MetadataRootName, ParsedMetadataTarget } from "../ruleRuntime/metadataTarget"
import type { OwnerMetadata, OwnerMetadataCache } from "./dataPath/ownerCache"
import type { ProjectMemberIndexEntry, MetadataReferenceResolveResult } from "./projectReferenceIndex"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"
import type { ParsedYaml } from "@nkdk/runtime"
import { currentValidationRegistrySet } from "./validationExecutionContext"
import type { DataTableDeclarationContribution } from "./dataTables/contracts"

export type ProjectReferenceObjectPathContributor = (params: {
  projectDir: string
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
}) => { filePath: string } | undefined

export type ProjectReferenceMemberContributor = (params: {
  projectDir: string
  ownerFilePath: string
  owner?: OwnerMetadata
  rawYaml: unknown
  segment: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"][number]
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  yamlCache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
}) => MetadataReferenceResolveResult | undefined

export type ProjectReferenceValueContributor = (params: {
  owner: OwnerMetadata
  target: Extract<ParsedMetadataTarget, { kind: "value" }>
}) => MetadataReferenceResolveResult | undefined

export type ProjectFileValidator = (params: { filePath: string; parsed: ParsedYaml }) => Diagnostic[]

export type ProjectReferenceMemberIndexContributor = (params: {
  projectDir: string
  owner: OwnerMetadata
  objectTarget: Extract<ParsedMetadataTarget, { kind: "object" }>
  rawYaml: unknown
}) => Iterable<ProjectMemberIndexEntry>

export type ProjectReferenceContribution =
  | DataTableDeclarationContribution
  | {
      readonly kind: "objectPath"
      readonly root: MetadataRootName
      readonly contributor: ProjectReferenceObjectPathContributor
    }
  | {
      readonly kind: "member"
      readonly memberKind: MetadataMemberKind
      readonly contributor: ProjectReferenceMemberContributor
    }
  | {
      readonly kind: "value"
      readonly root: MetadataRootName
      readonly contributor: ProjectReferenceValueContributor
    }
  | {
      readonly kind: "fileValidator"
      readonly role: string
      readonly validator: ProjectFileValidator
    }
  | {
      readonly kind: "memberIndex"
      readonly contributor: ProjectReferenceMemberIndexContributor
    }

export interface ProjectReferenceRegistrySet {
  getObjectPathContributor(root: MetadataRootName): ProjectReferenceObjectPathContributor | undefined
  getMemberContributors(kind: MetadataMemberKind): readonly ProjectReferenceMemberContributor[]
  getValueContributor(root: MetadataRootName): ProjectReferenceValueContributor | undefined
  getFileValidators(role: string): readonly ProjectFileValidator[]
  getMemberIndexContributors(): readonly ProjectReferenceMemberIndexContributor[]
}

type ContextualValidationRegistry = { references: ProjectReferenceRegistrySet }

export function createProjectReferenceRegistrySet(
  contributions: readonly ProjectReferenceContribution[],
): ProjectReferenceRegistrySet {
  const objectPaths = new Map<MetadataRootName, ProjectReferenceObjectPathContributor>()
  const members = new Map<MetadataMemberKind, ProjectReferenceMemberContributor[]>()
  const values = new Map<MetadataRootName, ProjectReferenceValueContributor>()
  const fileValidators = new Map<string, ProjectFileValidator[]>()
  const memberIndexes: ProjectReferenceMemberIndexContributor[] = []

  for (const contribution of contributions) {
    if (contribution.kind === "objectPath") objectPaths.set(contribution.root, contribution.contributor)
    else if (contribution.kind === "member") {
      members.set(contribution.memberKind, [...(members.get(contribution.memberKind) ?? []), contribution.contributor])
    } else if (contribution.kind === "value") values.set(contribution.root, contribution.contributor)
    else if (contribution.kind === "fileValidator") {
      fileValidators.set(contribution.role, [...(fileValidators.get(contribution.role) ?? []), contribution.validator])
    } else if (contribution.kind === "memberIndex") memberIndexes.push(contribution.contributor)
  }

  return {
    getObjectPathContributor: (root) => objectPaths.get(root),
    getMemberContributors: (kind) => members.get(kind) ?? [],
    getValueContributor: (root) => values.get(root),
    getFileValidators: (role) => fileValidators.get(role) ?? [],
    getMemberIndexContributors: () => memberIndexes,
  }
}

export function getProjectReferenceObjectPathContributor(
  root: MetadataRootName
): ProjectReferenceObjectPathContributor | undefined {
  return currentValidationRegistrySet<ContextualValidationRegistry>()?.references.getObjectPathContributor(root)
}

export function getProjectReferenceMemberContributors(
  kind: MetadataMemberKind
): readonly ProjectReferenceMemberContributor[] {
  return currentValidationRegistrySet<ContextualValidationRegistry>()?.references.getMemberContributors(kind) ?? []
}

export function getProjectReferenceValueContributor(
  root: MetadataRootName
): ProjectReferenceValueContributor | undefined {
  return currentValidationRegistrySet<ContextualValidationRegistry>()?.references.getValueContributor(root)
}

export function getProjectFileValidators(role: string): readonly ProjectFileValidator[] {
  return currentValidationRegistrySet<ContextualValidationRegistry>()?.references.getFileValidators(role) ?? []
}

export function getProjectReferenceMemberIndexContributors(): readonly ProjectReferenceMemberIndexContributor[] {
  return currentValidationRegistrySet<ContextualValidationRegistry>()?.references.getMemberIndexContributors() ?? []
}
