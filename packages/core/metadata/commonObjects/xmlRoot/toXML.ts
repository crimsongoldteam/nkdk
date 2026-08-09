import { registerTypeRule } from "../../ruleRuntime"

export const exportXMLRootToXML = (): undefined => {
  return undefined
}

registerTypeRule("XMLRoot", "exportToXML", exportXMLRootToXML)
