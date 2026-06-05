import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToXMLFunctionNew, InternalInfoPropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import {
  InternalInfo,
  InternalInfoContainedObject,
  InternalInfoContainedObjectXML,
  InternalInfoItemsXML,
  InternalInfoParam,
  InternalInfoRootXML,
} from "./types"

export const exportInternalInfoToXML: ExportToXMLFunctionNew = (params): InternalInfoRootXML => {
  const { context, rule, value, referenceMetadata, metadataItem } = params

  const internalInfoRule = rule as InternalInfoPropertyRule

  const metadata = value as InternalInfo | undefined
  const reference = referenceMetadata as InternalInfo | undefined
  const thisNode =
    internalInfoRule.thisNode === true ? (reference?.thisNode ?? metadata?.thisNode ?? getUUID(context)) : undefined

  const itemsRule = ((rule as any).items ?? []) as { name: string; category: string }[]

  const nameItemPart = internalInfoRule?.getName
    ? internalInfoRule.getName({ context, metadata: metadataItem as any })
    : ((metadataItem as any)?.name ?? "")

  const generated = itemsRule.map((item) => {
    const name = item.name

    const fromReference = getInternalInfoItem(reference?.[name])

    const typeId = fromReference?.typeId ?? getUUID(context)
    const valueId = fromReference?.valueId ?? getUUID(context)

    const fullName = `${item.name}.${nameItemPart}`

    return {
      _name: fullName,
      _category: item.category,
      "xr:TypeId": typeId,
      "xr:ValueId": valueId,
    }
  })

  const result: InternalInfoRootXML = {}
  if (thisNode !== undefined) {
    result["xr:ThisNode"] = thisNode
  }
  if (generated.length > 0) {
    result["xr:GeneratedType"] = generated
  }
  const containedObjects = getContainedObjectsXML({
    context,
    rule: internalInfoRule,
    metadata,
    reference,
  })
  if (containedObjects.length > 0) {
    result["xr:ContainedObject"] = containedObjects
  }

  return result
}

const getInternalInfoItem = (value: InternalInfo[string]): { typeId: string; valueId: string } | undefined => {
  if (value === undefined || value === null || typeof value !== "object" || Array.isArray(value)) return undefined
  if (!("typeId" in value) || !("valueId" in value)) return undefined
  return value
}

const getContainedObjectsXML = (params: {
  context: ConfigurationContext
  rule: InternalInfoPropertyRule
  metadata: InternalInfo | undefined
  reference: InternalInfo | undefined
}): InternalInfoContainedObjectXML[] => {
  const classIds = params.rule.containedObjectClassIds ?? []
  if (classIds.length === 0) return []

  const referenceObjects = params.reference?.containedObjects ?? []
  const metadataObjects = params.metadata?.containedObjects ?? []
  const seen = new Set<string>()

  const result = classIds.map((classId) => {
    seen.add(classId)
    const existing = findContainedObject(referenceObjects, classId) ?? findContainedObject(metadataObjects, classId)
    return {
      "xr:ClassId": classId,
      "xr:ObjectId": existing?.objectId ?? getUUID(params.context),
    }
  })

  for (const item of referenceObjects) {
    if (seen.has(item.classId)) continue
    result.push({
      "xr:ClassId": item.classId,
      "xr:ObjectId": item.objectId,
    })
  }

  return result
}

const findContainedObject = (
  containedObjects: InternalInfoContainedObject[],
  classId: string
): InternalInfoContainedObject | undefined => containedObjects.find((item) => item.classId === classId)

/** @deprecated */
export const exportInternalInfoToXMLOld = <T extends InternalInfoParam[]>(
  context: ConfigurationContext,
  data: T
): InternalInfoItemsXML<T> => {
  return {
    "xr:GeneratedType": data.map((param) => ({
      _name: param.name,
      _category: param.category,
      "xr:TypeId": getUUID(context),
      "xr:ValueId": getUUID(context),
    })),
  }
}

registerTypeRule("InternalInfo", "exportToXML", exportInternalInfoToXML)
