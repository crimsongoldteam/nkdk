import { isAbsolute, posix, relative, resolve, sep, win32 } from "node:path"

export interface ProjectPathOptions {
  readonly allowRoot?: boolean
}

export function parseProjectPath(input: string, options: ProjectPathOptions = {}): string {
  if (input.includes("\0")) throw invalidProjectPath()

  const normalized = input.replaceAll("\\", "/")
  if (
    posix.isAbsolute(normalized) ||
    win32.isAbsolute(input) ||
    /^[a-z][a-z\d+.-]*:/i.test(normalized)
  ) {
    throw outsideProject()
  }
  if (normalized === "") {
    if (options.allowRoot === true) return ""
    throw invalidProjectPath()
  }

  const segments = normalized.split("/")
  if (segments.includes("..")) throw outsideProject()
  if (segments.some((segment) => segment === "" || segment === ".")) throw invalidProjectPath()
  return segments.join("/")
}

export function projectPathFromFileSystem(
  projectDir: string,
  filePath: string,
  options: ProjectPathOptions = {},
): string {
  const projectRoot = resolve(projectDir)
  const targetPath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const nativeRelativePath = relativeInsideProject(projectRoot, targetPath)
  const projectPath = nativeRelativePath.split(sep).join("/")
  return parseProjectPath(projectPath, options)
}

export function resolveProjectPath(
  projectDir: string,
  projectPath: string,
  options: ProjectPathOptions = {},
): string {
  const parsed = parseProjectPath(projectPath, options)
  const projectRoot = resolve(projectDir)
  const targetPath = parsed === "" ? projectRoot : resolve(projectRoot, ...parsed.split("/"))
  relativeInsideProject(projectRoot, targetPath)
  return targetPath
}

function relativeInsideProject(projectRoot: string, targetPath: string): string {
  const nativeRelativePath = relative(projectRoot, targetPath)
  if (
    nativeRelativePath === ".." ||
    nativeRelativePath.startsWith(`..${sep}`) ||
    isAbsolute(nativeRelativePath)
  ) {
    throw outsideProject()
  }
  return nativeRelativePath
}

function outsideProject(): Error {
  return new Error("Путь находится вне NKDK-проекта")
}

function invalidProjectPath(): Error {
  return new Error("Некорректный путь NKDK-проекта")
}
