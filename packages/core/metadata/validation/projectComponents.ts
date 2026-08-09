import { readdir, stat } from "node:fs/promises"
import { join, resolve } from "node:path"
import { componentPath, type ComponentAddress } from "../components/address"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { createMetadataItemProjectSchemaExporter } from "../projectDefinition/projectSpecHelpers"
import type { RegisteredProjectSpec } from "../projectDefinition/projectSpecContracts"
import { compileMetadataResourceTopologyForRootRule } from "../resourceTopology/adapters/ruleTopology"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import { configurationValidationProjectSpec, validationProjectSpecs } from "./projectSpecs"

export interface ValidationProjectComponent {
  componentPath: string
  componentDir: string
  kind: ComponentAddress["kind"]
  rootRule: MetadataItemRule
  rootSpec: RegisteredProjectSpec
  topology: CompiledMetadataResourceTopology
}

export interface ValidationProjectComponentDiscovery {
  components: ValidationProjectComponent[]
  hasConfiguration: boolean
}

export async function discoverValidationProjectComponents(
  projectDir: string
): Promise<ValidationProjectComponentDiscovery> {
  const root = resolve(projectDir)
  const components: ValidationProjectComponent[] = []

  if (await isDirectory(join(root, "cf"))) {
    components.push(createValidationProjectComponent(root, { kind: "configuration" }))
  }

  const extensionsDir = join(root, "cfe")
  if (await isDirectory(extensionsDir)) {
    const entries = await readdir(extensionsDir, { withFileTypes: true })
    for (const entry of entries
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name, "ru"))) {
      components.push(createValidationProjectComponent(root, { kind: "configurationExtension", name: entry.name }))
    }
  }

  return { components, hasConfiguration: components.some((component) => component.kind === "configuration") }
}

export function createValidationProjectComponent(
  projectDir: string,
  address: ComponentAddress,
): ValidationProjectComponent {
  const descriptor = getMetadataComponentDescriptor(address.kind)
  const rootSpec: RegisteredProjectSpec = {
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
    topology: compileMetadataResourceTopologyForRootRule(
      descriptor.rootRule,
      [configurationValidationProjectSpec, ...validationProjectSpecs],
    ),
  }
}

export function validationProjectComponentFromAddress(
  projectDir: string,
  address: { componentPath: string; componentDir: string }
): ValidationProjectComponent {
  const componentAddress =
    address.componentPath === "cf"
      ? ({ kind: "configuration" } as const)
      : address.componentPath.startsWith("cfe/") && address.componentPath.length > "cfe/".length
        ? ({ kind: "configurationExtension", name: address.componentPath.slice("cfe/".length) } as const)
        : undefined
  if (componentAddress === undefined) {
    throw new Error(`Недопустимый validation componentPath: ${address.componentPath}`)
  }

  const component = createValidationProjectComponent(projectDir, componentAddress)
  if (address.componentPath === "cf" && resolve(address.componentDir) === resolve(projectDir)) {
    return { ...component, componentDir: resolve(address.componentDir) }
  }
  if (resolve(component.componentDir) !== resolve(address.componentDir)) {
    throw new Error(`Каталог компонента не соответствует componentPath: ${address.componentPath}`)
  }
  return component
}

export function bindValidationProjectComponent(
  template: ValidationProjectComponent,
  projectDir: string,
  nextComponentPath: string,
): ValidationProjectComponent {
  const expectedKind = nextComponentPath === "cf"
    ? "configuration"
    : nextComponentPath.startsWith("cfe/") && nextComponentPath.length > "cfe/".length
      ? "configurationExtension"
      : undefined
  if (expectedKind === undefined || template.kind !== expectedKind) {
    throw new Error(`Недопустимый validation componentPath для ${template.kind}: ${nextComponentPath}`)
  }
  return {
    ...template,
    componentPath: nextComponentPath,
    componentDir: join(projectDir, ...nextComponentPath.split("/")),
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
