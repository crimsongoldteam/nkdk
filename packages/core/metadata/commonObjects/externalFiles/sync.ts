import fs from "fs"
import { dirname, isAbsolute, join, relative, resolve, sep } from "path"

import type { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import type { ExternalFilePath, ExternalFilePathParams, ExternalFileRule } from "./types"

const resolvePath = (path: ExternalFilePath, params: ExternalFilePathParams): string =>
  typeof path === "function" ? path(params) : path

const matches = (name: string, include: readonly (string | RegExp)[]): boolean =>
  include.some((pattern) => (typeof pattern === "string" ? pattern === name : pattern.test(name)))

const assertInside = (root: string, target: string): boolean => {
  const rel = relative(resolve(root), resolve(target))
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

export async function syncExplicitExternalFilesFromXML(params: {
  rules: readonly ExternalFileRule[] | undefined
  xmlDir: string
  nkdkDir: string
  pathParams: ExternalFilePathParams
}): Promise<void> {
  for (const rule of params.rules ?? []) {
    if (rule.kind === "file") {
      const src = join(params.xmlDir, resolvePath(rule.xmlPath, params.pathParams))
      const dst = join(params.nkdkDir, resolvePath(rule.nkdkPath, params.pathParams))
      if (!assertInside(params.xmlDir, src) || !assertInside(params.nkdkDir, dst) || !fs.existsSync(src)) continue

      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
      continue
    }

    const srcDir = join(params.xmlDir, resolvePath(rule.xmlDir, params.pathParams))
    const dstDir = join(params.nkdkDir, resolvePath(rule.nkdkDir, params.pathParams))
    if (!assertInside(params.xmlDir, srcDir) || !assertInside(params.nkdkDir, dstDir) || !fs.existsSync(srcDir)) continue

    for (const entry of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
      if (!entry.isFile() || !matches(entry.name, rule.include)) continue

      const src = join(srcDir, entry.name)
      const dst = join(dstDir, entry.name)
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
    }
  }
}

export async function syncExplicitExternalFilesToXML(params: {
  rules: readonly ExternalFileRule[] | undefined
  nkdkDir: string
  xmlDir: string
  pathParams: ExternalFilePathParams
  xmlManifest?: XmlSyncManifest
}): Promise<void> {
  for (const rule of params.rules ?? []) {
    if (rule.kind === "file") {
      const src = join(params.nkdkDir, resolvePath(rule.nkdkPath, params.pathParams))
      const dst = join(params.xmlDir, resolvePath(rule.xmlPath, params.pathParams))
      if (!assertInside(params.nkdkDir, src) || !assertInside(params.xmlDir, dst) || !fs.existsSync(src)) continue

      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
      params.xmlManifest?.addFile(dst)
      continue
    }

    const srcDir = join(params.nkdkDir, resolvePath(rule.nkdkDir, params.pathParams))
    const dstDir = join(params.xmlDir, resolvePath(rule.xmlDir, params.pathParams))
    if (!assertInside(params.nkdkDir, srcDir) || !assertInside(params.xmlDir, dstDir) || !fs.existsSync(srcDir)) continue

    for (const entry of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
      if (!entry.isFile() || !matches(entry.name, rule.include)) continue

      const src = join(srcDir, entry.name)
      const dst = join(dstDir, entry.name)
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
      params.xmlManifest?.addFile(dst)
    }
  }
}
