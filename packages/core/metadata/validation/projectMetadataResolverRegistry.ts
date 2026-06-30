import type {
  MetadataMemberKind,
  MetadataRootName,
  ParsedMetadataTarget,
  StyleItemTargetType,
} from "~/metadata/commonObjects/metadataTargets"
import type { OwnerMetadata, OwnerMetadataCache } from "./dataPath/ownerCache"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"

export type MetadataResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[] }

export type ProjectObjectPathResolver = (params: {
  projectDir: string
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
}) => { filePath: string } | undefined

export type ProjectMemberResolver = (params: {
  projectDir: string
  ownerFilePath: string
  owner?: OwnerMetadata
  rawYaml: unknown
  segment: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"][number]
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  yamlCache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
}) => MetadataResolveResult | undefined

export type ProjectValueResolver = (params: {
  owner: OwnerMetadata
  target: Extract<ParsedMetadataTarget, { kind: "value" }>
}) => MetadataResolveResult | undefined

export type ProjectInlineObjectResolver = (params: {
  projectDir: string
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
  yamlCache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
}) => MetadataResolveResult | undefined

export type ProjectNamedResourceResolver = (params: {
  projectDir: string
  name: string
  expectedTypes?: readonly StyleItemTargetType[]
  yamlCache: ProjectYamlCache
}) => MetadataResolveResult

export type ProjectFileValidator = (params: {
  filePath: string
  parsed: ParsedYaml
}) => Diagnostic[]

const objectPathResolvers = new Map<MetadataRootName, ProjectObjectPathResolver>()
const memberResolvers = new Map<MetadataMemberKind, ProjectMemberResolver[]>()
const valueResolvers = new Map<MetadataRootName, ProjectValueResolver>()
const inlineObjectResolvers = new Map<MetadataRootName, ProjectInlineObjectResolver[]>()
const namedResourceResolvers = new Map<string, ProjectNamedResourceResolver>()
const projectFileValidators = new Map<string, ProjectFileValidator[]>()

export interface ProjectMetadataResolverRegistrySnapshot {
  objectPathResolvers: Map<MetadataRootName, ProjectObjectPathResolver>
  memberResolvers: Map<MetadataMemberKind, ProjectMemberResolver[]>
  valueResolvers: Map<MetadataRootName, ProjectValueResolver>
  inlineObjectResolvers: Map<MetadataRootName, ProjectInlineObjectResolver[]>
  namedResourceResolvers: Map<string, ProjectNamedResourceResolver>
  projectFileValidators: Map<string, ProjectFileValidator[]>
}

export function registerProjectObjectPathResolver(root: MetadataRootName, resolver: ProjectObjectPathResolver): void {
  objectPathResolvers.set(root, resolver)
}

export function getProjectObjectPathResolver(root: MetadataRootName): ProjectObjectPathResolver | undefined {
  return objectPathResolvers.get(root)
}

export function registerProjectMemberResolver(kind: MetadataMemberKind, resolver: ProjectMemberResolver): void {
  memberResolvers.set(kind, [...(memberResolvers.get(kind) ?? []), resolver])
}

export function getProjectMemberResolvers(kind: MetadataMemberKind): readonly ProjectMemberResolver[] {
  return memberResolvers.get(kind) ?? []
}

export function getProjectMemberResolver(kind: MetadataMemberKind): ProjectMemberResolver | undefined {
  return getProjectMemberResolvers(kind)[0]
}

export function registerProjectValueResolver(root: MetadataRootName, resolver: ProjectValueResolver): void {
  valueResolvers.set(root, resolver)
}

export function getProjectValueResolver(root: MetadataRootName): ProjectValueResolver | undefined {
  return valueResolvers.get(root)
}

export function registerProjectInlineObjectResolver(root: MetadataRootName, resolver: ProjectInlineObjectResolver): void {
  inlineObjectResolvers.set(root, [...(inlineObjectResolvers.get(root) ?? []), resolver])
}

export function getProjectInlineObjectResolvers(root: MetadataRootName): readonly ProjectInlineObjectResolver[] {
  return inlineObjectResolvers.get(root) ?? []
}

export function registerProjectNamedResourceResolver(kind: string, resolver: ProjectNamedResourceResolver): void {
  namedResourceResolvers.set(kind, resolver)
}

export function getProjectNamedResourceResolver(kind: string): ProjectNamedResourceResolver | undefined {
  return namedResourceResolvers.get(kind)
}

export function registerProjectFileValidator(role: string, validator: ProjectFileValidator): void {
  projectFileValidators.set(role, [...(projectFileValidators.get(role) ?? []), validator])
}

export function getProjectFileValidators(role: string): readonly ProjectFileValidator[] {
  return projectFileValidators.get(role) ?? []
}

export function clearProjectMetadataResolverRegistryForTests(): void {
  objectPathResolvers.clear()
  memberResolvers.clear()
  valueResolvers.clear()
  inlineObjectResolvers.clear()
  namedResourceResolvers.clear()
  projectFileValidators.clear()
}

export function snapshotProjectMetadataResolverRegistryForTests(): ProjectMetadataResolverRegistrySnapshot {
  return {
    objectPathResolvers: new Map(objectPathResolvers),
    memberResolvers: cloneArrayMap(memberResolvers),
    valueResolvers: new Map(valueResolvers),
    inlineObjectResolvers: cloneArrayMap(inlineObjectResolvers),
    namedResourceResolvers: new Map(namedResourceResolvers),
    projectFileValidators: cloneArrayMap(projectFileValidators),
  }
}

export function restoreProjectMetadataResolverRegistryForTests(snapshot: ProjectMetadataResolverRegistrySnapshot): void {
  replaceMap(objectPathResolvers, snapshot.objectPathResolvers)
  replaceMap(memberResolvers, snapshot.memberResolvers)
  replaceMap(valueResolvers, snapshot.valueResolvers)
  replaceMap(inlineObjectResolvers, snapshot.inlineObjectResolvers)
  replaceMap(namedResourceResolvers, snapshot.namedResourceResolvers)
  replaceMap(projectFileValidators, snapshot.projectFileValidators)
}

function cloneArrayMap<Key, Value>(map: Map<Key, Value[]>): Map<Key, Value[]> {
  return new Map([...map.entries()].map(([key, value]) => [key, [...value]]))
}

function replaceMap<Key, Value>(target: Map<Key, Value>, source: Map<Key, Value>): void {
  target.clear()
  for (const [key, value] of source) target.set(key, value)
}
