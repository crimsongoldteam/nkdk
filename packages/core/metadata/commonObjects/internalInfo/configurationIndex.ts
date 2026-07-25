import type { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { getConfigurationIndexCollectionContext } from "../../configurationIndex/collector/context"
import { childSegmentUid, childUid } from "../../configurationIndex/logicalAddress"
import { getUUID } from "../../helpers/uuid"
import type { CollectConfigurationIndexFromXMLFunction } from "../../orchestration/property/fn"
import type { InternalInfoRootXML } from "./types"

const internalInfoAddress = (ownerAddress: string): string => childSegmentUid(ownerAddress, "InternalInfo")

const generatedTypeAddress = (ownerAddress: string, name: string): string =>
  childUid(internalInfoAddress(ownerAddress), "GeneratedType", name)

const containedObjectAddress = (ownerAddress: string, classId: string): string =>
  childUid(internalInfoAddress(ownerAddress), "ContainedObject", classId)

export const internalInfoThisNodeAddress = (ownerAddress: string): string =>
  childSegmentUid(internalInfoAddress(ownerAddress), "ThisNode")

export const internalInfoGeneratedTypeIdAddress = (ownerAddress: string, name: string): string =>
  childSegmentUid(generatedTypeAddress(ownerAddress, name), "TypeId")

export const internalInfoGeneratedValueIdAddress = (ownerAddress: string, name: string): string =>
  childSegmentUid(generatedTypeAddress(ownerAddress, name), "ValueId")

export const internalInfoContainedObjectIdAddress = (ownerAddress: string, classId: string): string =>
  childSegmentUid(containedObjectAddress(ownerAddress, classId), "ObjectId")

export function resolveInternalInfoUuid(params: {
  context: ConfigurationContext
  logicalAddress: string | undefined
  fallback?: string
}): string {
  const runtime = params.context.exportToXML?.configurationIndex
  if (runtime === undefined || params.logicalAddress === undefined) {
    return params.fallback ?? getUUID(params.context)
  }

  const stored = runtime.identity("uuid", params.logicalAddress)
  if (stored !== undefined) {
    runtime.collector.setUuid(params.logicalAddress, stored)
    return stored
  }
  if (params.fallback !== undefined) {
    runtime.collector.setUuid(params.logicalAddress, params.fallback)
    return params.fallback
  }
  return runtime.identityOrCreate("uuid", params.logicalAddress)
}

export const collectInternalInfoConfigurationIndexFromXML: CollectConfigurationIndexFromXMLFunction = ({
  context,
  xml,
}) => {
  collectInternalInfoIdentities(context, xml as InternalInfoRootXML)
}

function collectInternalInfoIdentities(context: ConfigurationContextFromXML, xml: InternalInfoRootXML): void {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return

  for (const item of asArray(xml["xr:GeneratedType"])) {
    const name = item._name.split(".")[0]!
    collection.collector.setUuid(
      internalInfoGeneratedTypeIdAddress(collection.logicalAddress, name),
      item["xr:TypeId"]
    )
    collection.collector.setUuid(
      internalInfoGeneratedValueIdAddress(collection.logicalAddress, name),
      item["xr:ValueId"]
    )
  }

  const thisNode = xml["xr:ThisNode"]
  if (thisNode !== undefined) {
    collection.collector.setUuid(internalInfoThisNodeAddress(collection.logicalAddress), thisNode)
  }

  for (const item of asArray(xml["xr:ContainedObject"])) {
    collection.collector.setUuid(
      internalInfoContainedObjectIdAddress(collection.logicalAddress, item["xr:ClassId"]),
      item["xr:ObjectId"]
    )
  }
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}
