import { isAbsolute, resolve } from "path"
import {
  assertMetadataProjectPathInside,
  discoverMetadataProjectResources,
  resolveMetadataProjectResource,
  type MetadataProjectResourceRef,
} from "../project/resources"
import type { ValidationProjectSpec } from "./projectSpecs"

export interface ValidationProjectFile {
  absolutePath: string
  projectPath: string
  kind: "configuration" | "properties" | "form"
  owner: { dir: string; name: string; spec: ValidationProjectSpec }
  formName?: string
}

export function discoverValidationProjectFiles(projectDir: string): ValidationProjectFile[] {
  return discoverMetadataProjectResources(projectDir, { include: "yaml" }).flatMap((resource) => {
    const file = toValidationProjectFile(resource)
    return file ? [file] : []
  })
}

export function resolveValidationProjectFile(projectDir: string, filePath: string): ValidationProjectFile | undefined {
  const resource = resolveMetadataProjectResource(projectDir, filePath)
  return resource ? toValidationProjectFile(resource) : undefined
}

export function assertProjectFileInside(projectDir: string, filePath: string): string {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  return assertMetadataProjectPathInside(projectRoot, absolutePath)
}

function toValidationProjectFile(resource: MetadataProjectResourceRef): ValidationProjectFile | undefined {
  if (resource.absolutePath === undefined) return undefined

  if (resource.role === "configuration") {
    return {
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "configuration",
      owner: resource.owner,
    }
  }

  if (resource.role === "properties") {
    return {
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "properties",
      owner: resource.owner,
    }
  }

  if (resource.role === "form") {
    return {
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "form",
      owner: resource.owner,
      formName: resource.formName,
    }
  }

  return undefined
}
