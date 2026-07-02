import fs from "fs"
import { dirname, join } from "path"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"

export async function copyExistingRawFile(params: {
  sourcePath: string
  targetPath: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  if (!fs.existsSync(params.sourcePath)) return

  await fs.promises.mkdir(dirname(params.targetPath), { recursive: true })
  await fs.promises.copyFile(params.sourcePath, params.targetPath)
  params.xmlManifest?.addFile(params.targetPath)
}

export async function copyRawDirectoryFiles(params: {
  sourceDir: string
  targetDir: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  if (!fs.existsSync(params.sourceDir)) return

  for (const entry of await fs.promises.readdir(params.sourceDir, { withFileTypes: true })) {
    const sourcePath = join(params.sourceDir, entry.name)
    const targetPath = join(params.targetDir, entry.name)

    if (entry.isDirectory()) {
      await copyRawDirectoryFiles({ ...params, sourceDir: sourcePath, targetDir: targetPath })
      continue
    }

    if (!entry.isFile()) continue
    await copyExistingRawFile({ sourcePath, targetPath, xmlManifest: params.xmlManifest })
  }
}
