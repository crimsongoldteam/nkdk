import { ConfigurationContextFromXML, type XmlElementNode } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { collectInternalInfoConfigurationIndexFromXML } from "./configurationIndex"
import { InternalInfo, InternalInfoRootXML, type InternalInfoContainedObject } from "./types"
import { readInternalInfoXML } from "./readXML"

export const importInternalInfoFromXML = (
  _context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: InternalInfoRootXML | XmlElementNode | undefined
): InternalInfo | undefined => {
  if (!xml) return undefined

  if (rule?.xmlOnly !== true) return undefined

  const result: InternalInfo = {}
  let containedObjects: InternalInfoContainedObject[] | undefined
  const present = readInternalInfoXML(xml, {
    generatedType(name, typeId, valueId) {
      result[name] = { typeId: typeId!, valueId: valueId! }
    },
    thisNode(value) { result.thisNode = value },
    containedObject(classId, objectId) {
      if (containedObjects === undefined) result.containedObjects = containedObjects = []
      containedObjects.push({ classId: classId!, objectId: objectId! })
    },
  })
  return present ? result : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("InternalInfo", "importFromXML", importInternalInfoFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("InternalInfo", "collectConfigurationIndexFromXML", collectInternalInfoConfigurationIndexFromXML)
