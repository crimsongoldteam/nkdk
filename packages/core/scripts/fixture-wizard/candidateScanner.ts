import { readdir, stat } from "node:fs/promises"
import { join, parse } from "node:path"
import type { CandidateScan, XmlCandidate } from "./types"

export async function listXmlDirs(dumpRoot: string): Promise<string[]> {
  const entries = await readdir(dumpRoot, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

export async function scanCandidates(dumpRoot: string, xmlDir: string): Promise<CandidateScan> {
  const sourceDir = join(dumpRoot, xmlDir)

  try {
    const sourceStat = await stat(sourceDir)

    if (!sourceStat.isDirectory()) {
      throw new Error("not a directory")
    }
  } catch {
    throw new Error(`XML-каталог ${xmlDir} не найден в выгрузке`)
  }

  const entries = await readdir(sourceDir, { withFileTypes: true })
  const candidates = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".xml"))
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
