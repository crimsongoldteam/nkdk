import fs from "fs"
import { basename, dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { ExternalFilePropertyRule } from "./types"

export const syncExternalFileToXML = async (params: {
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const rule = params.rule as ExternalFilePropertyRule
  const srcPath = join(params.nkdkDir, rule.nkdkPath)
  if (!fs.existsSync(srcPath)) return

  const objectXmlDir = params.name
    ? basename(params.xmlDir) === params.name
      ? params.xmlDir
      : join(params.xmlDir, params.name)
    : params.xmlDir
  const dstPath = join(objectXmlDir, rule.xmlPath)
  await fs.promises.mkdir(dirname(dstPath), { recursive: true })
  await fs.promises.copyFile(srcPath, dstPath)
  params.xmlManifest?.addFile(dstPath)
}

registerTypeRule("ExternalFile", "syncExternalToXML", syncExternalFileToXML)
