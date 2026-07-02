import fs from "fs"
import { basename, dirname, join } from "path"
import { registerTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import type { ExternalPicturePropertyRule } from "./types"

export const syncExternalPictureToXML = async (params: {
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name?: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const rule = params.rule as ExternalPicturePropertyRule
  const descriptorName = basename(rule.xmlPath)
  const nkdkPictureDir = join(params.nkdkDir, rule.nkdkDir)
  const srcDescriptorPath = join(nkdkPictureDir, descriptorName)
  if (!fs.existsSync(srcDescriptorPath)) return

  const objectXmlDir = resolveObjectXmlDir({ xmlDir: params.xmlDir, objectName: params.name })
  const dstDescriptorPath = join(objectXmlDir, rule.xmlPath)
  await fs.promises.mkdir(dirname(dstDescriptorPath), { recursive: true })
  await fs.promises.copyFile(srcDescriptorPath, dstDescriptorPath)
  params.xmlManifest?.addFile(dstDescriptorPath)

  const entries = await fs.promises.readdir(nkdkPictureDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || entry.name === descriptorName) continue

    const srcPayloadPath = join(nkdkPictureDir, entry.name)
    const dstPayloadPath = join(objectXmlDir, rule.payloadXmlDir, entry.name)
    await fs.promises.mkdir(dirname(dstPayloadPath), { recursive: true })
    await fs.promises.copyFile(srcPayloadPath, dstPayloadPath)
    params.xmlManifest?.addFile(dstPayloadPath)
  }
}

registerTypeRule("ExternalPicture", "syncExternalToXML", syncExternalPictureToXML)

const resolveObjectXmlDir = (params: { xmlDir: string; objectName?: string }): string => {
  const { xmlDir, objectName } = params
  if (!objectName) return xmlDir
  return basename(xmlDir) === objectName ? xmlDir : join(xmlDir, objectName)
}
