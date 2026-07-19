import fs from "fs"
import { basename, dirname, join } from "path"
import { registerTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"
import type { ExternalPicturePropertyRule } from "./types"

export const syncExternalPictureFromXML = async (params: {
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  name?: string
}): Promise<void> => {
  const rule = params.rule as ExternalPicturePropertyRule
  const sourceRoot = resolveSourceRoot({
    xmlDir: params.xmlDir,
    xmlPath: rule.xmlPath,
    objectName: params.name,
  })
  const srcDescriptorPath = join(sourceRoot, rule.xmlPath)
  if (!fs.existsSync(srcDescriptorPath)) return

  const nkdkPictureDir = join(params.nkdkDir, rule.nkdkDir)
  const dstDescriptorPath = join(nkdkPictureDir, basename(rule.xmlPath))
  await fs.promises.mkdir(dirname(dstDescriptorPath), { recursive: true })
  await fs.promises.copyFile(srcDescriptorPath, dstDescriptorPath)

  const payloadDir = join(sourceRoot, rule.payloadXmlDir)
  await copyRegularFiles({ srcDir: payloadDir, dstDir: nkdkPictureDir })
}

registerTypeRule("ExternalPicture", "syncExternalFromXML", syncExternalPictureFromXML)
registerTypeRule("ExternalPicture", "xmlImportRoutes", ({ propertyRule }) => {
  const rule = propertyRule as ExternalPicturePropertyRule
  return [
    {
      kind: "externalFile",
      xmlPattern: rule.xmlPath,
      targetPattern: `${rule.nkdkDir}/${basename(rule.xmlPath)}`,
      assignmentTargetPattern: "",
      source: { kind: "propertyType", type: "ExternalPicture" },
    },
    {
      kind: "externalFile",
      xmlPattern: `${rule.payloadXmlDir}/{relativePath...}`,
      targetPattern: `${rule.nkdkDir}/{relativePath...}`,
      assignmentTargetPattern: "",
      source: { kind: "propertyType", type: "ExternalPicture" },
    },
  ]
})

const resolveSourceRoot = (params: { xmlDir: string; xmlPath: string; objectName?: string }): string => {
  const directPath = join(params.xmlDir, params.xmlPath)
  if (fs.existsSync(directPath) || !params.objectName) return params.xmlDir

  const objectRoot = join(params.xmlDir, params.objectName)
  return fs.existsSync(join(objectRoot, params.xmlPath)) ? objectRoot : params.xmlDir
}

const copyRegularFiles = async (params: { srcDir: string; dstDir: string }): Promise<void> => {
  if (!fs.existsSync(params.srcDir)) return

  const entries = await fs.promises.readdir(params.srcDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const srcPath = join(params.srcDir, entry.name)
    const dstPath = join(params.dstDir, entry.name)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }
}
