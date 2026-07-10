import { access, readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import ts from "typescript"
import type { MetadataTarget } from "./types"

const appliedObjectsPath = "packages/core/metadata/appliedObjects"

export async function listMetadataItems(projectRoot: string): Promise<string[]> {
  const appliedObjectsDir = join(projectRoot, appliedObjectsPath)
  const entries = await readdir(appliedObjectsDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

export async function readXmlDirFromRules(itemDir: string): Promise<string | undefined> {
  const rulesPath = join(itemDir, "rules.ts")

  try {
    await access(rulesPath)
  } catch {
    return undefined
  }

  const sourceText = await readFile(rulesPath, "utf-8")
  const sourceFile = ts.createSourceFile(rulesPath, sourceText, ts.ScriptTarget.Latest, true)
  let xmlDir: string | undefined

  const visit = (node: ts.Node) => {
    if (xmlDir !== undefined) {
      return
    }

    if (ts.isPropertyAssignment(node) && isXmlDirProperty(node.name)) {
      xmlDir = readStringLiteral(node.initializer)
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return xmlDir
}

export async function resolveMetadataTarget(projectRoot: string, metadataItem: string): Promise<MetadataTarget> {
  const available = await listMetadataItems(projectRoot)

  if (!available.includes(metadataItem)) {
    throw new Error(`metadataItem ${metadataItem} не найден. Доступные: ${available.join(", ")}`)
  }

  const itemDir = join(projectRoot, appliedObjectsPath, metadataItem)
  const fixturesDir = join(itemDir, "__fixtures__")

  return {
    metadataItem,
    itemDir,
    fixturesDir,
    syncXmlDir: join(fixturesDir, "sync/xml"),
    xmlDir: await readXmlDirFromRules(itemDir),
  }
}

function isXmlDirProperty(name: ts.PropertyName): boolean {
  return (ts.isIdentifier(name) && name.text === "xmlDir") || (ts.isStringLiteral(name) && name.text === "xmlDir")
}

function readStringLiteral(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }

  return undefined
}
