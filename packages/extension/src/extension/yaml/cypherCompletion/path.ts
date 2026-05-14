import { createHash } from "crypto"
import { resolve } from "path"

export type TopLevelPropertiesOwner = {
  projectPath: string
  dir: "Справочник"
  name: string
}

export type OwnerScope = Pick<TopLevelPropertiesOwner, "dir" | "name">

export function parseTopLevelPropertiesPath(filePath: string): TopLevelPropertiesOwner | undefined {
  const normalizedPath = filePath.replace(/\\/g, "/")
  const parts = normalizedPath.split("/")

  const fileName = parts.at(-1)
  const name = parts.at(-2)
  const dir = parts.at(-3)

  if (fileName !== "Свойства.yaml" || dir !== "Справочник" || !name) {
    return undefined
  }

  return {
    projectPath: parts.slice(0, -3).join("/") || "/",
    dir,
    name,
  }
}

export function projectGraphName(projectPath: string): string {
  const hash = createHash("sha1").update(resolve(projectPath)).digest("hex").slice(0, 12)

  return `nkdk_${hash}`
}

export function scopeIdFromOwner(owner: OwnerScope): string {
  return `${owner.dir}.${owner.name}`
}

export function graphIdToYamlReference(id: string): string {
  const match = /^Справочник\.([^.]+)\.Форма\.([^.]+)$/.exec(id)

  if (!match) {
    return id
  }

  return `Catalog.${match[1]}.Form.${match[2]}`
}
