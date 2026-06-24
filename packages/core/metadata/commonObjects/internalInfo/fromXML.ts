import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { InternalInfo, InternalInfoRootXML } from "./types"

export const importInternalInfoFromXML = (
  _context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: InternalInfoRootXML | undefined
): InternalInfo | undefined => {
  if (!xml) return undefined

  if (rule?.forReferenceOnly !== true) return undefined

  const rawItems = xml["xr:GeneratedType"]
  const thisNode = xml["xr:ThisNode"]
  const rawContainedObjects = xml["xr:ContainedObject"]
  if (!rawItems && !thisNode && !rawContainedObjects) return undefined

  const items = rawItems === undefined ? [] : Array.isArray(rawItems) ? rawItems : [rawItems]
  const containedObjects =
    rawContainedObjects === undefined
      ? []
      : Array.isArray(rawContainedObjects)
        ? rawContainedObjects
        : [rawContainedObjects]

  const result: InternalInfo = {}
  for (const item of items) {
    const name = item._name.split(".")[0]
    result[name] = {
      typeId: item["xr:TypeId"],
      valueId: item["xr:ValueId"],
    }
  }
  if (thisNode !== undefined) {
    result.thisNode = thisNode
  }
  if (containedObjects.length > 0) {
    result.containedObjects = containedObjects.map((item) => ({
      classId: item["xr:ClassId"],
      objectId: item["xr:ObjectId"],
    }))
  }

  return result
}

registerTypeRule("InternalInfo", "importFromXML", importInternalInfoFromXML)
