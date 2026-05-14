import { existsSync, readdirSync } from "fs"
import { join } from "path"
import type { ChildFormNamesPropertyRule } from "~/metadata/commonObjects/childFormNames/types"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { topLevelGraphImportSpecs } from "./registerTopLevelGraphImports"

export interface ProjectGraphFileOwner {
  dir: string
  name: string
  rule: MetadataItemRule
}

export function pairedProjectGraphFile(filePath: string): string | undefined {
  if (filePath.endsWith("/Форма.nkdk")) {
    return `${filePath.slice(0, -"Форма.nkdk".length)}Форма.yaml`
  }
  if (filePath.endsWith("/Форма.yaml")) {
    return `${filePath.slice(0, -"Форма.yaml".length)}Форма.nkdk`
  }
  return undefined
}

export function discoverProjectGraphFiles(projectPath: string): string[] {
  const files: string[] = []

  for (const spec of topLevelGraphImportSpecs) {
    const ownerRoot = join(projectPath, spec.dir)
    if (!existsSync(ownerRoot)) continue

    for (const entry of readdirSync(ownerRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue

      const owner: ProjectGraphFileOwner = { dir: spec.dir, name: entry.name, rule: spec.rule }
      const propsPath = join(ownerRoot, owner.name, "Свойства.yaml")
      if (existsSync(propsPath)) {
        files.push(ownerFile(owner, "Свойства.yaml"))
      }

      files.push(...discoverChildProjectGraphFiles(projectPath, owner))
    }
  }

  return files.sort()
}

export function isSupportedProjectGraphFile(filePath: string): boolean {
  const owner = parseProjectGraphFileOwner(filePath)
  if (!owner) return false

  const relativePath = filePath.split("/").slice(2).join("/")
  if (relativePath === "Свойства.yaml") return true

  return childProjectGraphFileMatchers(owner.rule).some((matcher) => matcher(relativePath))
}

export function parseProjectGraphFileOwner(filePath: string): ProjectGraphFileOwner | undefined {
  const parts = filePath.split("/")
  if (parts.length < 3) return undefined

  const dir = parts[0]!
  const name = parts[1]!
  const spec = topLevelGraphImportSpecs.find((candidate) => candidate.dir === dir)
  if (!spec) return undefined

  return { dir, name, rule: spec.rule }
}

function discoverChildProjectGraphFiles(projectPath: string, owner: ProjectGraphFileOwner): string[] {
  const files: string[] = []

  for (const rule of Object.values(owner.rule.properties)) {
    if (!isChildFormRule(rule)) continue

    const formsRoot = join(projectPath, owner.dir, owner.name, rule.folderName)
    if (!existsSync(formsRoot)) continue

    for (const entry of readdirSync(formsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue

      for (const fileName of ["Форма.yaml", "Форма.nkdk"] as const) {
        const fullPath = join(formsRoot, entry.name, fileName)
        if (existsSync(fullPath)) {
          files.push(ownerFile(owner, `${rule.folderName}/${entry.name}/${fileName}`))
        }
      }
    }
  }

  return files
}

function childProjectGraphFileMatchers(rule: MetadataItemRule): Array<(filePath: string) => boolean> {
  return Object.values(rule.properties).flatMap((propertyRule) => {
    if (!isChildFormRule(propertyRule)) return []

    return [
      (filePath: string) => isExactChildFormFilePath(filePath, propertyRule.folderName),
    ]
  })
}

function isExactChildFormFilePath(filePath: string, folderName: string): boolean {
  const parts = filePath.split("/")
  return (
    parts.length === 3 &&
    parts[0] === folderName &&
    parts[1] !== "" &&
    (parts[2] === "Форма.yaml" || parts[2] === "Форма.nkdk")
  )
}

function isChildFormRule(rule: PropertyRule): rule is ChildFormNamesPropertyRule {
  return rule.type === "ChildFormNames"
}

function ownerFile(owner: ProjectGraphFileOwner, filePath: string): string {
  return `${owner.dir}/${owner.name}/${filePath}`
}
