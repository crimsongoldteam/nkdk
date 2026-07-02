import type { MetadataMemberKind, MetadataRootName, ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { OwnerMetadata, OwnerMetadataCache } from "./dataPath/ownerCache"
import type { ProjectMemberIndexEntry, MetadataReferenceResolveResult } from "./projectReferenceIndex"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"

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
  hasFile: (filePath: string) => boolean
}) => Iterable<ProjectMemberIndexEntry>

const objectPathContributors = new Map<MetadataRootName, ProjectReferenceObjectPathContributor>()
const memberContributors = new Map<MetadataMemberKind, ProjectReferenceMemberContributor[]>()
const valueContributors = new Map<MetadataRootName, ProjectReferenceValueContributor>()
const projectFileValidators = new Map<string, ProjectFileValidator[]>()
const memberIndexContributors: ProjectReferenceMemberIndexContributor[] = []

export interface ProjectReferenceIndexRegistrySnapshot {
  objectPathContributors: Map<MetadataRootName, ProjectReferenceObjectPathContributor>
  memberContributors: Map<MetadataMemberKind, ProjectReferenceMemberContributor[]>
  valueContributors: Map<MetadataRootName, ProjectReferenceValueContributor>
  projectFileValidators: Map<string, ProjectFileValidator[]>
  memberIndexContributors: ProjectReferenceMemberIndexContributor[]
}

export function registerProjectReferenceObjectPathContributor(
  root: MetadataRootName,
  contributor: ProjectReferenceObjectPathContributor
): void {
  objectPathContributors.set(root, contributor)
}

export function getProjectReferenceObjectPathContributor(
  root: MetadataRootName
): ProjectReferenceObjectPathContributor | undefined {
  return objectPathContributors.get(root)
}

export function registerProjectReferenceMemberContributor(
  kind: MetadataMemberKind,
  contributor: ProjectReferenceMemberContributor
): void {
  memberContributors.set(kind, [...(memberContributors.get(kind) ?? []), contributor])
}

export function getProjectReferenceMemberContributors(
  kind: MetadataMemberKind
): readonly ProjectReferenceMemberContributor[] {
  return memberContributors.get(kind) ?? []
}

export function registerProjectReferenceValueContributor(
  root: MetadataRootName,
  contributor: ProjectReferenceValueContributor
): void {
  valueContributors.set(root, contributor)
}

export function getProjectReferenceValueContributor(
  root: MetadataRootName
): ProjectReferenceValueContributor | undefined {
  return valueContributors.get(root)
}

export function registerProjectFileValidator(role: string, validator: ProjectFileValidator): void {
  projectFileValidators.set(role, [...(projectFileValidators.get(role) ?? []), validator])
}

export function getProjectFileValidators(role: string): readonly ProjectFileValidator[] {
  return projectFileValidators.get(role) ?? []
}

export function registerProjectReferenceMemberIndexContributor(
  contributor: ProjectReferenceMemberIndexContributor
): void {
  memberIndexContributors.push(contributor)
}

export function getProjectReferenceMemberIndexContributors(): readonly ProjectReferenceMemberIndexContributor[] {
  return memberIndexContributors
}

export function clearProjectReferenceIndexRegistryForTests(): void {
  objectPathContributors.clear()
  memberContributors.clear()
  valueContributors.clear()
  projectFileValidators.clear()
  memberIndexContributors.splice(0)
}

export function snapshotProjectReferenceIndexRegistryForTests(): ProjectReferenceIndexRegistrySnapshot {
  return {
    objectPathContributors: new Map(objectPathContributors),
    memberContributors: cloneArrayMap(memberContributors),
    valueContributors: new Map(valueContributors),
    projectFileValidators: cloneArrayMap(projectFileValidators),
    memberIndexContributors: [...memberIndexContributors],
  }
}

export function restoreProjectReferenceIndexRegistryForTests(
  snapshot: ProjectReferenceIndexRegistrySnapshot
): void {
  replaceMap(objectPathContributors, snapshot.objectPathContributors)
  replaceMap(memberContributors, snapshot.memberContributors)
  replaceMap(valueContributors, snapshot.valueContributors)
  replaceMap(projectFileValidators, snapshot.projectFileValidators)
  memberIndexContributors.splice(0, memberIndexContributors.length, ...snapshot.memberIndexContributors)
}

function cloneArrayMap<Key, Value>(map: Map<Key, Value[]>): Map<Key, Value[]> {
  return new Map([...map.entries()].map(([key, value]) => [key, [...value]]))
}

function replaceMap<Key, Value>(target: Map<Key, Value>, source: Map<Key, Value>): void {
  target.clear()
  for (const [key, value] of source) target.set(key, value)
}
