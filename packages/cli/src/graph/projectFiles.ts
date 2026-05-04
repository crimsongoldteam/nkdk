import { existsSync, readdirSync } from "fs"
import { join, relative, sep } from "path"

const OWNER_DIRS = ["Справочник", "Документ", "Перечисление"] as const

export function normalizeProjectFile(projectPath: string, path: string): string {
  return relative(projectPath, path).split(sep).join("/")
}

export function absoluteProjectFile(projectPath: string, filePath: string): string {
  return join(projectPath, ...filePath.split("/"))
}

export function pairedFormPath(filePath: string): string | undefined {
  if (filePath.endsWith("/Форма.nkdk")) {
    return filePath.slice(0, -"Форма.nkdk".length) + "Форма.yaml"
  }
  if (filePath.endsWith("/Форма.yaml")) {
    return filePath.slice(0, -"Форма.yaml".length) + "Форма.nkdk"
  }
  return undefined
}

export function isSupportedProjectFile(filePath: string): boolean {
  return (
    OWNER_DIRS.some((dir) => filePath.startsWith(`${dir}/`)) &&
    (filePath.endsWith("/Свойства.yaml") ||
      filePath.endsWith("/Форма.yaml") ||
      filePath.endsWith("/Форма.nkdk"))
  )
}

export function readProjectFileList(projectPath: string): string[] {
  const result: string[] = []

  for (const ownerDir of OWNER_DIRS) {
    const ownerRoot = join(projectPath, ownerDir)
    if (!existsSync(ownerRoot)) continue

    for (const entry of readdirSync(ownerRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue

      const objectRoot = join(ownerRoot, entry.name)
      const props = join(objectRoot, "Свойства.yaml")
      if (existsSync(props)) result.push(normalizeProjectFile(projectPath, props))

      const formsRoot = join(objectRoot, "Формы")
      if (!existsSync(formsRoot)) continue

      for (const formEntry of readdirSync(formsRoot, { withFileTypes: true })) {
        if (!formEntry.isDirectory()) continue

        const formRoot = join(formsRoot, formEntry.name)
        for (const fileName of ["Форма.yaml", "Форма.nkdk"] as const) {
          const fullPath = join(formRoot, fileName)
          if (existsSync(fullPath)) result.push(normalizeProjectFile(projectPath, fullPath))
        }
      }
    }
  }

  return result.sort()
}
