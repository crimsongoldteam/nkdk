import type { ConfigurationContext, ConfigurationContextFromXML, XmlElementNode } from "@nkdk/runtime"
import { getConfigurationIndexCollectionContext } from "@nkdk/runtime"
import { childSegmentUid, childUid } from "@nkdk/runtime"
import { getUUID } from "../../helpers/uuid"
import type { CollectConfigurationIndexFromXMLFunction } from "@nkdk/runtime/rule-kit"
import type { InternalInfoRootXML } from "./types"
import { readInternalInfoXML } from "./readXML"

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
    runtime.collector.setIdentity(params.logicalAddress, "uuid", stored)
    return stored
  }
  if (params.fallback !== undefined) {
    runtime.collector.setIdentity(params.logicalAddress, "uuid", params.fallback)
    return params.fallback
  }
  return runtime.identityOrCreate("uuid", params.logicalAddress)
}

export const collectInternalInfoConfigurationIndexFromXML: CollectConfigurationIndexFromXMLFunction = ({
  context,
  xml,
}) => {
  if (xml === undefined) return
  collectInternalInfoIdentities(context, xml as InternalInfoRootXML | XmlElementNode)
}

function collectInternalInfoIdentities(context: ConfigurationContextFromXML, xml: InternalInfoRootXML | XmlElementNode): void {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return

  readInternalInfoXML(xml, {
    generatedType(name, typeId, valueId) {
      collection.collector.setIdentity(internalInfoGeneratedTypeIdAddress(collection.logicalAddress, name), "uuid", typeId!)
      collection.collector.setIdentity(internalInfoGeneratedValueIdAddress(collection.logicalAddress, name), "uuid", valueId!)
    },
    thisNode(value) {
      collection.collector.setIdentity(internalInfoThisNodeAddress(collection.logicalAddress), "uuid", value)
    },
    containedObject(classId, objectId) {
      collection.collector.setIdentity(internalInfoContainedObjectIdAddress(collection.logicalAddress, classId!), "uuid", objectId!)
    },
  })
}
