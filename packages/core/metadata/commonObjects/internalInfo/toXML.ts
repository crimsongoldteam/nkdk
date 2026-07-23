import type { ConfigurationContext } from "../../context/types"
import { ExportToXMLFunctionNew, InternalInfoPropertyRule, registerTypeRule } from "../../orchestration"
import { getUUID } from "../../helpers/uuid"
import {
  InternalInfo,
  InternalInfoContainedObjectXML,
  InternalInfoItemsXML,
  InternalInfoParam,
  InternalInfoRootXML,
} from "./types"

export const exportInternalInfoToXML: ExportToXMLFunctionNew = (params): InternalInfoRootXML => {
  const { context, rule, value, referenceMetadata, metadataItem, source } = params

  const internalInfoRule = rule as InternalInfoPropertyRule

  const metadata = value as InternalInfo | undefined
  const reference = referenceMetadata as InternalInfo | undefined
  const thisNode =
    internalInfoRule.thisNode === true ? (reference?.thisNode ?? metadata?.thisNode ?? getUUID(context)) : undefined

  const itemsRule = ((rule as any).items ?? []) as { name: string; category: string }[]

  const itemName = source?.itemName ?? (metadataItem as { name?: string } | undefined)?.name ?? ""
  const nameItemPart = internalInfoRule?.getName
    ? internalInfoRule.getName({ context, metadata: { name: itemName } })
    : itemName

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
    classIds: internalInfoRule.containedObjectClassIds ?? [],
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
  classIds: string[]
  metadata: InternalInfo | undefined
  reference: InternalInfo | undefined
}): InternalInfoContainedObjectXML[] => {
  const referenceObjects = params.reference?.containedObjects ?? []
  const metadataObjects = params.metadata?.containedObjects ?? []

  if (params.classIds.length === 0) {
    const containedObjects = referenceObjects.length > 0 ? referenceObjects : metadataObjects

    return containedObjects.map((item) => ({
      "xr:ClassId": item.classId,
      "xr:ObjectId": item.objectId,
    }))
  }

  const usedClassIds = new Set<string>()
  const findContainedObject = (classId: string) =>
    referenceObjects.find((item) => item.classId === classId) ??
    metadataObjects.find((item) => item.classId === classId)

  const declared = params.classIds.map((classId) => {
    usedClassIds.add(classId)
    const item = findContainedObject(classId)
    return {
      "xr:ClassId": classId,
      "xr:ObjectId": item?.objectId ?? getUUID(params.context),
    }
  })

  const extras = [...referenceObjects, ...metadataObjects]
    .filter((item) => {
      if (usedClassIds.has(item.classId)) return false
      usedClassIds.add(item.classId)
      return true
    })
    .map((item) => ({
      "xr:ClassId": item.classId,
      "xr:ObjectId": item.objectId,
    }))

  return [...declared, ...extras]
}

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
