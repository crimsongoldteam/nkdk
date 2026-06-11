import fs from "fs"
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "path"
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"
import type { PropertyRule } from "~/metadata/orchestration"
import { ClientApplicationFormRules } from "./rules"

type ExternalFormItemFileSpec = {
  xmlName: string
  nkdkDir: string
}

const isExternalFormItemFileRule = (
  rule: PropertyRule
): rule is PropertyRule & { type: "ExternalFormItemFile"; xml: string; yaml: string } =>
  rule.type === "ExternalFormItemFile"

const getExternalItemFileSpecs = (): ExternalFormItemFileSpec[] =>
  (Object.values(ClientApplicationFormRules.properties) as PropertyRule[])
    .filter(isExternalFormItemFileRule)
    .map((rule) => ({ xmlName: rule.xml, nkdkDir: rule.yaml }))

const externalItemFileSpecs = getExternalItemFileSpecs()

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
