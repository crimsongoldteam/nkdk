import { readdir, stat } from "node:fs/promises"
import { extname, join, parse } from "node:path"
import type { CandidateScan, XmlCandidate } from "./types"

function isErrorWithCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
}

async function isExistingDirectory(path: string): Promise<boolean> {
  try {
    const sourceStat = await stat(path)
    return sourceStat.isDirectory()
  } catch (error) {
    if (isErrorWithCode(error) && error.code === "ENOENT") {
      return false
    }

    throw error
  }
}

export async function listXmlDirs(dumpRoot: string): Promise<string[]> {
  const entries = await readdir(dumpRoot, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

export async function scanCandidates(dumpRoot: string, xmlDir: string): Promise<CandidateScan> {
  const sourceDir = join(dumpRoot, xmlDir)

  if (!(await isExistingDirectory(sourceDir))) {
    throw new Error(`XML-каталог ${xmlDir} не найден в выгрузке`)
  }

  const entries = await readdir(sourceDir, { withFileTypes: true })
  const candidates = entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".xml")
    .map((entry): XmlCandidate => {
      const fileName = entry.name

      return {
        name: parse(fileName).name,
        fileName,
        path: join(sourceDir, fileName),
      }
    })
    .sort((left, right) => left.fileName.localeCompare(right.fileName))

  return {
    xmlDir,
    sourceDir,
    candidates,
    fullCandidates: candidates.filter((candidate) => candidate.name.includes("ВсеСвойства")),
    minimalCandidates: candidates.filter((candidate) => candidate.name.includes("ПоУмолчанию")),
  }
}
