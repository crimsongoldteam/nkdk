import { isAbsolute, resolve } from "path"
import {
  assertMetadataProjectPathInside,
  createMetadataProjectAssignmentResourceProjector,
  discoverMetadataProjectResources,
  resolveMetadataProjectResource,
  type MetadataProjectResourceRef,
  type MetadataProjectAssignmentAddress,
} from "../projectDefinition/resources"
import type { ValidationProjectComponent } from "./projectComponents"
import type { ValidationProjectSpec } from "./projectSpecs"
import type { MetadataItemRule, TopologyMetadataTarget } from "@nkdk/runtime/rule-kit"

export interface ComponentFileAddress {
  componentPath: string
  componentDir: string
  rootProjectPath: string
}

export interface ValidationProjectFile extends ComponentFileAddress {
  absolutePath: string
  projectPath: string
  kind: "configuration" | "properties" | "form"
  topologyNodeId: string
  itemType: string
  owner: { dir: string; name: string; spec: ValidationProjectSpec }
  formName?: string
  itemRule: MetadataItemRule
  metadataTarget?: TopologyMetadataTarget
  logicalAddress?: string
}

export async function discoverValidationProjectFiles(
  projectDir: string,
  component?: ValidationProjectComponent
): Promise<ValidationProjectFile[]> {
  const componentAddress = componentFileAddress(projectDir, component)
  return (await discoverMetadataProjectResources(projectDir, { include: "yaml" }, component)).flatMap((resource) => {
    const file = toValidationProjectFile(resource, componentAddress)
    return file ? [file] : []
  })
}

export function resolveValidationProjectFile(
  projectDir: string,
  filePath: string,
  component?: ValidationProjectComponent
): ValidationProjectFile | undefined {
  const componentAddress = componentFileAddress(projectDir, component)
  const resource = resolveMetadataProjectResource(projectDir, filePath, component)
  return resource ? toValidationProjectFile(resource, componentAddress) : undefined
}

export function createValidationProjectAssignmentFileProjector(
  projectDir: string,
  component: ValidationProjectComponent,
): (params: {
  readonly projectPath: string
  readonly topologyAddress: MetadataProjectAssignmentAddress
}) => ValidationProjectFile | undefined {
  const componentAddress = componentFileAddress(projectDir, component)
  const project = createMetadataProjectAssignmentResourceProjector(component)
  return (params) => {
    const resource = project(params)
    return resource === undefined
      ? undefined
      : toValidationProjectFile({
          ...resource,
          absolutePath: resolve(component.componentDir, ...params.projectPath.split("/")),
        }, componentAddress)
  }
}

export function assertProjectFileInside(projectDir: string, filePath: string): string {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  return assertMetadataProjectPathInside(projectRoot, absolutePath)
}

function toValidationProjectFile(
  resource: MetadataProjectResourceRef,
  component: Omit<ComponentFileAddress, "rootProjectPath">
): ValidationProjectFile | undefined {
  if (resource.absolutePath === undefined) return undefined

  const address: ComponentFileAddress = {
    ...component,
    rootProjectPath: `${component.componentPath}/${resource.projectPath}`,
  }

  if (resource.kind !== "yaml") return undefined

  if (resource.role === "configuration") {
    return {
      ...address,
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "configuration",
      topologyNodeId: resource.topologyNodeId,
      itemType: resource.itemType,
      owner: resource.owner,
      itemRule: resource.itemRule,
      ...(resource.logicalAddress === undefined ? {} : { logicalAddress: resource.logicalAddress }),
    }
  }

  if (resource.role === "properties") {
    return {
      ...address,
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "properties",
      topologyNodeId: resource.topologyNodeId,
      itemType: resource.itemType,
      owner: resource.owner,
      itemRule: resource.itemRule,
      ...(resource.logicalAddress === undefined ? {} : { logicalAddress: resource.logicalAddress }),
      ...(resource.metadataTarget === undefined ? {} : { metadataTarget: resource.metadataTarget }),
    }
  }

  if (resource.kind === "yaml" && resource.role === "form") {
    return {
      ...address,
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "form",
      topologyNodeId: resource.topologyNodeId,
      itemType: resource.itemType,
      owner: resource.owner,
      formName: resource.formName,
      itemRule: resource.itemRule,
      ...(resource.logicalAddress === undefined ? {} : { logicalAddress: resource.logicalAddress }),
      ...(resource.metadataTarget === undefined ? {} : { metadataTarget: resource.metadataTarget }),
    }
  }

  return undefined
}

function componentFileAddress(
  projectDir: string,
  component: ValidationProjectComponent | undefined
): Omit<ComponentFileAddress, "rootProjectPath"> {
  return component === undefined
    ? { componentPath: "cf", componentDir: resolve(projectDir) }
    : { componentPath: component.componentPath, componentDir: component.componentDir }
}
