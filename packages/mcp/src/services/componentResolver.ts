import { existsSync, mkdirSync, readdirSync, statSync } from "fs"
import { isAbsolute, relative, resolve, sep } from "path"
import { toolError, type ToolFailure } from "../contracts/common"

const STANDARD_COMPONENT_ROOTS = new Set(["cf", "cfe", "erf", "epf"])

export interface ResolveComponentOptions {
  projectDir: string
  componentPath?: string
  createIfMissing?: boolean
}

export type ResolveComponentResult =
  | { ok: true; projectDir: string; componentPath: string; componentDir: string; nkdkDir: string }
  | { ok: false; error: ToolFailure }

export function resolveComponent(options: ResolveComponentOptions): ResolveComponentResult {
  const projectDir = resolve(options.projectDir)
  const componentPath = normalizeRelativePath(options.componentPath ?? "cf")

  if (componentPath === undefined) {
    return { ok: false, error: toolError("invalid_arguments", "componentPath должен быть относительным путем") }
  }

  const root = componentPath.split("/")[0]
  if (!STANDARD_COMPONENT_ROOTS.has(root)) {
    return { ok: false, error: toolError("invalid_arguments", "componentPath должен начинаться с cf, cfe, erf или epf") }
  }

  if (!existsSync(projectDir)) {
    return { ok: false, error: toolError("not_found", "Проект не найден", { projectDir: options.projectDir }) }
  }
  if (!statSync(projectDir).isDirectory()) {
    return {
      ok: false,
      error: toolError("invalid_arguments", "Путь не является каталогом проекта", { projectDir: options.projectDir }),
    }
  }

  const cfDir = resolve(projectDir, "cf")
  if (!existsSync(cfDir) || !statSync(cfDir).isDirectory()) {
    return { ok: false, error: toolError("not_found", "Компонент cf не найден", { projectDir: options.projectDir }) }
  }

  const componentDir = resolve(projectDir, ...componentPath.split("/"))
  if (!isInside(projectDir, componentDir)) {
    return { ok: false, error: toolError("invalid_arguments", "componentPath должен находиться внутри projectDir") }
  }

  if (!existsSync(componentDir)) {
    if (options.createIfMissing === true) mkdirSync(componentDir, { recursive: true })
    else {
      return {
        ok: false,
        error: toolError("not_found", "Компонент не найден", { projectDir: options.projectDir, componentPath }),
      }
    }
  }

  if (!statSync(componentDir).isDirectory()) {
    return { ok: false, error: toolError("invalid_arguments", "Компонент должен быть каталогом", { componentPath }) }
  }

  const nestedNkdkDir = resolve(componentDir, ".nkdk")
  if (existsSync(nestedNkdkDir)) {
    return { ok: false, error: toolError("invalid_arguments", ".nkdk должен находиться только в корне projectDir") }
  }

  return {
    ok: true,
    projectDir,
    componentPath,
    componentDir,
    nkdkDir: resolve(projectDir, ".nkdk"),
  }
}

export function assertImportTargetEmpty(componentDir: string): ToolFailure | undefined {
  if (!existsSync(componentDir)) return undefined
  if (!statSync(componentDir).isDirectory()) {
    return toolError("invalid_arguments", "Цель импорта должна быть каталогом", { componentDir })
  }

  const entries = readdirSync(componentDir)
  if (entries.length === 0) return undefined

  return toolError("invalid_arguments", "Целевой каталог компонента должен быть пустым", { componentDir })
}

export function resolveStructurePath(componentDir: string, structurePath: string | undefined): string | undefined {
  if (structurePath === undefined) return undefined

  if (structurePath.trim() === "" || isAbsolute(structurePath)) {
    throw new Error("structurePath должен быть относительным путем")
  }

  const segments = structurePath
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== ".")
  if (segments.length === 0) throw new Error("structurePath должен быть относительным путем")
  if (segments.some((segment) => segment === "..")) throw new Error("structurePath должен находиться внутри компонента")

  const normalized = segments.join("/")
  const resolved = resolve(componentDir, ...segments)
  if (!isInside(resolve(componentDir), resolved)) throw new Error("structurePath должен находиться внутри компонента")

  return normalized
}

function normalizeRelativePath(input: string): string | undefined {
  if (input.trim() === "" || isAbsolute(input)) return undefined

  const normalized = input.replaceAll("\\", "/")
  const segments = normalized.split("/").filter((segment) => segment.length > 0 && segment !== ".")
  if (segments.length === 0 || segments.some((segment) => segment === "..")) return undefined

  return segments.join("/")
}

function isInside(root: string, child: string): boolean {
  const rel = relative(root, child)
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel) && !rel.split(sep).includes(".."))
}
