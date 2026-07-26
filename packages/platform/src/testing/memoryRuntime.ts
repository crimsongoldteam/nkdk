import type { PlatformEnvironment, PlatformRuntime } from "../runtime"
import { posix, win32 } from "node:path"

export type MemoryRuntime = PlatformRuntime & {
  directory(path: string): MemoryRuntime
  file(path: string, options?: { mode?: number; content?: string }): MemoryRuntime
  canonical(path: string, canonicalPath: string): MemoryRuntime
  readError(path: string, error: Error): MemoryRuntime
}

export function createMemoryRuntime(environment: PlatformEnvironment): MemoryRuntime {
  type Node = { kind: "directory"; children: Set<string>; mode: number } | { kind: "file"; content: string; mode: number }
  const pathApi = environment.os === "win32" ? win32 : posix
  const nodes = new Map<string, Node>()
  const canonicalPaths = new Map<string, string>()
  const readErrors = new Map<string, Error>()
  const normalize = (path: string) => {
    const normalized = pathApi.normalize(path)
    return environment.os === "win32" ? normalized.toLowerCase() : normalized
  }
  const missing = (path: string) => {
    const error = new Error(`ENOENT: ${path}`) as Error & { code: string }
    error.code = "ENOENT"
    return error
  }
  const addToParent = (path: string) => {
    const parentPath = normalize(pathApi.dirname(path))
    const parent = nodes.get(parentPath)
    if (parent?.kind === "directory") parent.children.add(pathApi.basename(path))
  }
  const resolveNode = (path: string) => {
    const key = normalize(canonicalPaths.get(normalize(path)) ?? path)
    const node = nodes.get(key)
    if (node === undefined) throw missing(path)
    return node
  }
  const runtime: MemoryRuntime = {
    environment,
    fs: {
      readFile: async (path) => {
        const error = readErrors.get(normalize(path))
        if (error !== undefined) throw error
        const node = resolveNode(path)
        if (node.kind !== "file") throw new Error(`EISDIR: ${path}`)
        return node.content
      },
      readdir: async (path) => {
        const node = resolveNode(path)
        if (node.kind !== "directory") throw new Error(`ENOTDIR: ${path}`)
        return [...node.children]
      },
      stat: async (path) => {
        const node = resolveNode(path)
        return {
          isFile: node.kind === "file",
          isDirectory: node.kind === "directory",
          mode: node.mode,
        }
      },
      realpath: async (path) => {
        const target = canonicalPaths.get(normalize(path)) ?? path
        resolveNode(target)
        return pathApi.normalize(target)
      },
    },
    directory: (path) => {
      nodes.set(normalize(path), { kind: "directory", children: new Set(), mode: 0o755 })
      addToParent(path)
      return runtime
    },
    file: (path, options = {}) => {
      nodes.set(normalize(path), {
        kind: "file",
        content: options.content ?? "",
        mode: options.mode ?? 0o644,
      })
      addToParent(path)
      return runtime
    },
    canonical: (path, canonicalPath) => {
      canonicalPaths.set(normalize(path), pathApi.normalize(canonicalPath))
      return runtime
    },
    readError: (path, error) => {
      readErrors.set(normalize(path), error)
      return runtime
    },
  }
  return runtime
}
