import { open, stat } from "node:fs/promises"
import type { BigIntStats } from "node:fs"
import { hashFileBytes } from "../configurationIndex/hash"
import {
  discoverMetadataProjectResources,
  type MetadataProjectResourceRef,
} from "../project/resources"
import { discoverValidationProjectComponents } from "../validation/projectComponents"
import type { ProjectStateFileIdentity } from "./fileUpdate"
import type { ProjectStateFileHashBatch } from "./contracts"

const HASH_BYTE_LENGTH = 8

export interface ProjectResourceAddress {
  readonly componentPath: string
  readonly ref: MetadataProjectResourceRef
}

export interface ProjectResourceStability {
  readonly dev: bigint
  readonly ino: bigint
  readonly size: bigint
  readonly mtimeNs: bigint
}

export interface HashedProjectResource {
  readonly ref: MetadataProjectResourceRef
  readonly identity: ProjectStateFileIdentity
  readonly bytes: Uint8Array
  readonly localHash: bigint
  readonly stability: ProjectResourceStability
}

export interface ProjectStateFileCollection {
  readonly projectDir: string
  readonly resources: HashedProjectResource[]
  readonly hashBatch: ProjectStateFileHashBatch
  readonly discover: () => Promise<readonly ProjectResourceAddress[]>
}

export function releaseProjectResourceBytesExcept(
  collection: ProjectStateFileCollection,
  retainedProjectPaths: ReadonlySet<string>,
): void {
  collection.resources.forEach((resource, index) => {
    if (retainedProjectPaths.has(resource.identity.projectPath)) return
    collection.resources[index] = { ...resource, bytes: new Uint8Array(0) }
  })
}

export interface CollectProjectStateFilesParams {
  readonly projectDir: string
  readonly discover?: () => Promise<readonly ProjectResourceAddress[]>
  readonly hashBytes?: (bytes: Uint8Array) => bigint
  readonly signal?: AbortSignal
}

export class ProjectStateFilesChangedError extends Error {
  constructor() {
    super("Файлы проекта изменились во время чтения")
    this.name = "ProjectStateFilesChangedError"
  }
}

export async function collectProjectStateFiles(
  params: CollectProjectStateFilesParams,
): Promise<ProjectStateFileCollection> {
  const discover = params.discover ?? (() => discoverProjectResourceAddresses(params.projectDir))
  params.signal?.throwIfAborted()
  const addresses = [...await discover()].sort((left, right) =>
    rootProjectPath(left).localeCompare(rootProjectPath(right), "ru")
  )
  params.signal?.throwIfAborted()
  const resources = await Promise.all(addresses.map((address) =>
    readAndHashResource(address, params.hashBytes ?? hashFileBytes, params.signal)))
  const hashBytes = new Uint8Array(resources.length * HASH_BYTE_LENGTH)
  const view = new DataView(hashBytes.buffer)
  resources.forEach(({ localHash }, index) => view.setBigUint64(index * HASH_BYTE_LENGTH, localHash, false))
  return {
    projectDir: params.projectDir,
    resources,
    hashBatch: { files: resources.map(({ identity }) => identity), hashBytes },
    discover,
  }
}

export async function isProjectStateFileCollectionStable(
  collection: ProjectStateFileCollection,
  signal?: AbortSignal,
): Promise<boolean> {
  signal?.throwIfAborted()
  const current = [...await collection.discover()].sort((left, right) =>
    rootProjectPath(left).localeCompare(rootProjectPath(right), "ru")
  )
  if (current.length !== collection.resources.length) return false
  for (let index = 0; index < current.length; index += 1) {
    signal?.throwIfAborted()
    const address = current[index]!
    const resource = collection.resources[index]!
    if (rootProjectPath(address) !== resource.identity.projectPath || address.ref.absolutePath === undefined) return false
    try {
      const currentStat = await stat(address.ref.absolutePath, { bigint: true })
      signal?.throwIfAborted()
      if (!sameStability(resource.stability, stabilityFromStat(currentStat))) return false
    } catch (caught) {
      if (isMissingPath(caught)) return false
      throw caught
    }
  }
  return true
}

export async function discoverProjectResourceAddresses(
  projectDir: string,
): Promise<readonly ProjectResourceAddress[]> {
  const { components } = await discoverValidationProjectComponents(projectDir)
  const resources = await Promise.all(components.map(async (component) =>
    (await discoverMetadataProjectResources(component.componentDir, { include: "all" }, component))
      .map((ref) => ({ componentPath: component.componentPath, ref }))))
  return resources.flat()
}

async function readAndHashResource(
  address: ProjectResourceAddress,
  hashBytes: (bytes: Uint8Array) => bigint,
  signal?: AbortSignal,
): Promise<HashedProjectResource> {
  const absolutePath = address.ref.absolutePath
  if (absolutePath === undefined) throw new Error(`У ресурса отсутствует абсолютный путь: ${address.ref.projectPath}`)
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    signal?.throwIfAborted()
    handle = await open(absolutePath, "r")
    signal?.throwIfAborted()
    const before = stabilityFromStat(await handle.stat({ bigint: true }))
    const bytes = new Uint8Array(await handle.readFile({ signal }))
    signal?.throwIfAborted()
    const after = stabilityFromStat(await handle.stat({ bigint: true }))
    if (!sameStability(before, after)) throw new ProjectStateFilesChangedError()
    return {
      ref: address.ref,
      identity: identityFromAddress(address),
      bytes,
      localHash: hashBytes(bytes),
      stability: after,
    }
  } catch (caught) {
    if (isMissingPath(caught)) throw new ProjectStateFilesChangedError()
    throw caught
  } finally {
    await handle?.close()
  }
}

function identityFromAddress(address: ProjectResourceAddress): ProjectStateFileIdentity {
  return {
    projectPath: rootProjectPath(address),
    componentPath: address.componentPath,
    resourceKind: address.ref.kind,
    ...(address.ref.kind === "yaml" ? { yamlRole: address.ref.role } : {}),
  }
}

function rootProjectPath(address: ProjectResourceAddress): string {
  return `${address.componentPath}/${address.ref.projectPath}`
}

function stabilityFromStat(value: BigIntStats): ProjectResourceStability {
  return { dev: value.dev, ino: value.ino, size: value.size, mtimeNs: value.mtimeNs }
}

function sameStability(left: ProjectResourceStability, right: ProjectResourceStability): boolean {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
}

function isMissingPath(caught: unknown): boolean {
  return typeof caught === "object" && caught !== null && "code" in caught && caught.code === "ENOENT"
}
