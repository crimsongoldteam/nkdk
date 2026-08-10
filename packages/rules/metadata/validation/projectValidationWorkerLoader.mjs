import { existsSync, statSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"

const coreRoot = fileURLToPath(new URL("../../", import.meta.url))

export function resolve(specifier, context, nextResolve) {
  if (specifier === "~" || specifier.startsWith("~/")) {
    const relativePath = specifier === "~" ? "" : specifier.slice(2)
    return nextResolve(pathToFileURL(resolveSourcePath(coreRoot + relativePath)).href, context)
  }

  if (specifier.startsWith("file:")) {
    return nextResolve(pathToFileURL(resolveSourcePath(fileURLToPath(specifier))).href, context)
  }

  if (isRelativeSpecifier(specifier) && context.parentURL?.startsWith("file:")) {
    return nextResolve(pathToFileURL(resolveSourcePath(fileURLToPath(new URL(specifier, context.parentURL)))).href, context)
  }

  return nextResolve(specifier, context)
}

function resolveSourcePath(path) {
  if (existsSync(path)) {
    if (statSync(path).isDirectory()) {
      const indexPath = `${path}/index.ts`
      if (existsSync(indexPath)) return indexPath
    }
    return path
  }

  const tsPath = `${path}.ts`
  return existsSync(tsPath) ? tsPath : path
}

function isRelativeSpecifier(specifier) {
  return specifier === "." || specifier === ".." || specifier.startsWith("./") || specifier.startsWith("../")
}
