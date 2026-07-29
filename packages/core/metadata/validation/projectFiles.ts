import { isAbsolute, resolve } from "path"
import {
  assertMetadataProjectPathInside,
  discoverMetadataProjectResources,
  resolveMetadataProjectResource,
  type MetadataProjectResourceRef,
} from "../project/resources"
import type { ValidationProjectComponent } from "./projectComponents"
import type { ValidationProjectSpec } from "./projectSpecs"

export interface ComponentFileAddress {
  componentPath: string
  componentDir: string
  rootProjectPath: string
}

export interface ValidationProjectFile extends ComponentFileAddress {
  absolutePath: string
  projectPath: string
  kind: "configuration" | "properties" | "form"
  itemType: string
  owner: { dir: string; name: string; spec: ValidationProjectSpec }
  formName?: string
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

  if (resource.role === "configuration") {
    return {
      ...address,
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "configuration",
      itemType: resource.owner.spec.rule.itemType,
      owner: resource.owner,
    }
  }

  if (resource.role === "properties") {
    return {
      ...address,
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "properties",
      itemType: resource.owner.spec.rule.itemType,
      owner: resource.owner,
    }
  }

  if (resource.kind === "yaml" && resource.role === "form") {
    return {
      ...address,
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "form",
      itemType: resource.itemType,
      owner: resource.owner,
      formName: resource.formName,
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
