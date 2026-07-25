import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"
import type { ExternalFilePropertyRule } from "./types"

export const syncExternalFileFromXML = async (params: {
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  name?: string
}): Promise<void> => {
  const rule = params.rule as ExternalFilePropertyRule
  const srcPath = resolveSourcePath({
    xmlDir: params.xmlDir,
    xmlPath: rule.xmlPath,
    objectName: params.name,
  })
  if (!fs.existsSync(srcPath)) return

  const dstPath = join(params.nkdkDir, rule.nkdkPath)
  await fs.promises.mkdir(dirname(dstPath), { recursive: true })
  await fs.promises.copyFile(srcPath, dstPath)
}

registerTypeRule("ExternalFile", "syncExternalFromXML", syncExternalFileFromXML)
const resolveSourcePath = (params: { xmlDir: string; xmlPath: string; objectName?: string }): string => {
  const directPath = join(params.xmlDir, params.xmlPath)
  if (fs.existsSync(directPath) || !params.objectName) return directPath

  const objectPath = join(params.xmlDir, params.objectName, params.xmlPath)
  return fs.existsSync(objectPath) ? objectPath : directPath
}
