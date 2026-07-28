import { readdir, stat } from "node:fs/promises"
import { join, resolve } from "node:path"
import { componentPath } from "../components/address"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import type { MetadataItemRule } from "../orchestration/property/types"
import { createMetadataItemProjectSchemaExporter, type MetadataProjectSpec } from "../project/specs"
import { registerCoreMetadata } from "../register"
import { compileMetadataResourceTopologyForRootRule } from "../resourceTopology/registry"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/types"

export interface ValidationProjectComponent {
  componentPath: string
  componentDir: string
  kind: "configuration" | "configurationExtension"
  rootRule: MetadataItemRule
  rootSpec: MetadataProjectSpec
  topology: CompiledMetadataResourceTopology
}

export interface ValidationProjectComponentDiscovery {
  components: ValidationProjectComponent[]
  hasConfiguration: boolean
}

export async function discoverValidationProjectComponents(
  projectDir: string
): Promise<ValidationProjectComponentDiscovery> {
  registerCoreMetadata()
  const root = resolve(projectDir)
  const components: ValidationProjectComponent[] = []

  if (await isDirectory(join(root, "cf"))) {
    components.push(createComponent(root, { kind: "configuration" }))
  }

  const extensionsDir = join(root, "cfe")
  if (await isDirectory(extensionsDir)) {
    const entries = await readdir(extensionsDir, { withFileTypes: true })
    for (const entry of entries
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name, "ru"))) {
      components.push(createComponent(root, { kind: "configurationExtension", name: entry.name }))
    }
  }

  return { components, hasConfiguration: components.some((component) => component.kind === "configuration") }
}

function createComponent(
  projectDir: string,
  address: { kind: "configuration" } | { kind: "configurationExtension"; name: string }
): ValidationProjectComponent {
  const descriptor = getMetadataComponentDescriptor(address.kind)
  const rootSpec: MetadataProjectSpec = {
    dir: "",
    kind: descriptor.kind,
    rule: descriptor.rootRule,
    exportSchema: createMetadataItemProjectSchemaExporter(descriptor.rootRule),
  }
  const path = componentPath(address)
  return {
    componentPath: path,
    componentDir: join(projectDir, ...path.split("/")),
    kind: address.kind,
    rootRule: descriptor.rootRule,
    rootSpec,
    topology: compileMetadataResourceTopologyForRootRule(descriptor.rootRule),
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch (error: unknown) {
    if (isMissingPath(error)) return false
    throw error
  }
}

function isMissingPath(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
