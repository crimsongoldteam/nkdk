import { definePropertyTypeRule } from "../../ruleRuntime"

export const exportXMLRootToXML = (): undefined => {
  return undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("XMLRoot", "exportToXML", exportXMLRootToXML)
