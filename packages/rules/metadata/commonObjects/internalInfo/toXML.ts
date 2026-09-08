import type { ConfigurationContext } from "@nkdk/runtime"
import { ExportToXMLFunctionNew, InternalInfoPropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import {
  internalInfoContainedObjectIdAddress,
  internalInfoGeneratedTypeIdAddress,
  internalInfoGeneratedValueIdAddress,
  internalInfoThisNodeAddress,
  resolveInternalInfoUuid,
} from "./configurationIndex"
import {
  InternalInfo,
  InternalInfoContainedObjectXML,
  InternalInfoRootXML,
} from "./types"

export const exportInternalInfoToXML: ExportToXMLFunctionNew = (params): InternalInfoRootXML | undefined => {
  const { context, rule, value, metadataItem, source } = params

  const internalInfoRule = rule as InternalInfoPropertyRule

  const metadata = value as InternalInfo | undefined
  const ownerAddress = context.exportToXML.configurationIndex?.logicalAddress
  const thisNode =
    internalInfoRule.thisNode === true
      ? resolveInternalInfoUuid({
          context,
          logicalAddress: ownerAddress === undefined ? undefined : internalInfoThisNodeAddress(ownerAddress),
          fallback: metadata?.thisNode,
        })
      : undefined

  const itemsRule = ((rule as any).items ?? []) as { name: string; category: string }[]

  const itemName = source?.itemName ?? (metadataItem as { name?: string } | undefined)?.name ?? ""
  const nameItemPart = internalInfoRule?.getName
    ? internalInfoRule.getName({ context, metadata: { name: itemName } })
    : itemName

  const generated = itemsRule.map((item) => {
    const name = item.name

    const existing = getInternalInfoItem(metadata?.[name])

    const typeId = resolveInternalInfoUuid({
      context,
      logicalAddress: ownerAddress === undefined ? undefined : internalInfoGeneratedTypeIdAddress(ownerAddress, name),
      fallback: existing?.typeId,
    })
    const valueId = resolveInternalInfoUuid({
      context,
      logicalAddress: ownerAddress === undefined ? undefined : internalInfoGeneratedValueIdAddress(ownerAddress, name),
      fallback: existing?.valueId,
    })

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
    ownerAddress,
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
  ownerAddress: string | undefined
}): InternalInfoContainedObjectXML[] => {
  const metadataObjects = params.metadata?.containedObjects ?? []

  if (params.classIds.length === 0) {
    return metadataObjects.map((item) => {
      const objectId = resolveInternalInfoUuid({
        context: params.context,
        logicalAddress:
          params.ownerAddress === undefined
            ? undefined
            : internalInfoContainedObjectIdAddress(params.ownerAddress, item.classId),
        fallback: item.objectId,
      })
      return {
        "xr:ClassId": item.classId,
        "xr:ObjectId": objectId,
      }
    })
  }

  const usedClassIds = new Set<string>()
  const findContainedObject = (classId: string) =>
    metadataObjects.find((item) => item.classId === classId)

  const declared = params.classIds.map((classId) => {
    usedClassIds.add(classId)
    const item = findContainedObject(classId)
    const objectId = resolveInternalInfoUuid({
      context: params.context,
      logicalAddress:
        params.ownerAddress === undefined
          ? undefined
          : internalInfoContainedObjectIdAddress(params.ownerAddress, classId),
      fallback: item?.objectId,
    })
    return {
      "xr:ClassId": classId,
      "xr:ObjectId": objectId,
    }
  })

  const extras = metadataObjects
    .filter((item) => {
      if (usedClassIds.has(item.classId)) return false
      usedClassIds.add(item.classId)
      return true
    })
    .map((item) => {
      const objectId = resolveInternalInfoUuid({
        context: params.context,
        logicalAddress:
          params.ownerAddress === undefined
            ? undefined
            : internalInfoContainedObjectIdAddress(params.ownerAddress, item.classId),
        fallback: item.objectId,
      })
      return {
        "xr:ClassId": item.classId,
        "xr:ObjectId": objectId,
      }
    })

  return [...declared, ...extras]
}

export const metadataPropertyRule000 = definePropertyTypeRule("InternalInfo", "exportToXML", exportInternalInfoToXML)
