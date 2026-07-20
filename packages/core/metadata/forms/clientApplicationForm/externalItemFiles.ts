import fs from "fs"
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "path"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import type { PropertyRule } from "../../orchestration"
import type { XmlImportRoute } from "../../importFromXml/types"
import { ClientApplicationFormRules } from "./rules"

type ExternalFormItemFileSpec = {
  propertyName: string
  xmlName: string
  nkdkDir: string
}

const isExternalFormItemFileRule = (
  rule: PropertyRule
): rule is PropertyRule & { type: "ExternalFormItemFile"; xml: string; yaml: string } =>
  rule.type === "ExternalFormItemFile"

const getExternalItemFileSpecs = (): ExternalFormItemFileSpec[] =>
  (Object.entries(ClientApplicationFormRules.properties) as Array<[string, PropertyRule]>)
    .filter((entry): entry is [string, PropertyRule & { type: "ExternalFormItemFile"; xml: string; yaml: string }] =>
      isExternalFormItemFileRule(entry[1])
    )
    .map(([propertyName, rule]) => ({ propertyName, xmlName: rule.xml, nkdkDir: rule.yaml }))

const externalItemFileSpecs = getExternalItemFileSpecs()

export function describeFormItemXmlImportRoutes(params: {
  xmlFormDirPattern: string
  targetFormDirPattern: string
  assignmentTargetPattern: string
}): XmlImportRoute[] {
  return externalItemFileSpecs.map((spec) => ({
    kind: "externalFile",
    xmlPattern: joinImportPattern(
      params.xmlFormDirPattern,
      "Form",
      "Items",
      "{formItemName}",
      `${spec.xmlName}.{extension}`
    ),
    targetPattern: joinImportPattern(params.targetFormDirPattern, spec.nkdkDir, "{formItemName}.{extension}"),
    assignmentTargetPattern: params.assignmentTargetPattern,
    source: { kind: "property", propertyName: spec.propertyName, propertyType: "ExternalFormItemFile" },
  }))
}

function joinImportPattern(...parts: string[]): string {
  return parts
    .filter((part) => part.length > 0)
    .join("/")
    .replace(/\\/g, "/")
}

export async function copyFormItemExternalFilesFromXML(params: {
  formXmlDir: string
  formNkdkDir: string
}): Promise<void> {
  const itemsDir = join(params.formXmlDir, "Form", "Items")
  if (!fs.existsSync(itemsDir)) return

  for (const item of await fs.promises.readdir(itemsDir, { withFileTypes: true })) {
    if (!item.isDirectory()) continue
    const itemDir = join(itemsDir, item.name)
    const files = await fs.promises.readdir(itemDir, { withFileTypes: true })

    for (const spec of externalItemFileSpecs) {
      for (const file of files) {
        if (!file.isFile()) continue
        const ext = extname(file.name)
        if (ext === "" || basename(file.name, ext) !== spec.xmlName) continue

        const src = join(itemDir, file.name)
        const dst = join(params.formNkdkDir, spec.nkdkDir, `${item.name}${ext}`)
        await fs.promises.mkdir(dirname(dst), { recursive: true })
        await fs.promises.copyFile(src, dst)
      }
    }
  }
}

export async function copyFormItemExternalFilesToXML(params: {
  formNkdkDir: string
  formXmlDir: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  for (const spec of externalItemFileSpecs) {
    const srcDir = join(params.formNkdkDir, spec.nkdkDir)
    if (!fs.existsSync(srcDir)) continue

    for (const file of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
      if (!file.isFile()) continue
      const ext = extname(file.name)
      if (ext === "") continue

      const itemName = file.name.slice(0, -ext.length)
      if (itemName === "" || itemName === "." || itemName === "..") continue
      const src = join(srcDir, file.name)
      const dst = join(params.formXmlDir, "Form", "Items", itemName, `${spec.xmlName}${ext}`)
      if (!isInside(join(params.formXmlDir, "Form", "Items"), dst)) continue
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
      params.xmlManifest?.addFile(dst)
    }
  }
}

const isInside = (root: string, target: string): boolean => {
  const rel = relative(resolve(root), resolve(target))
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}
