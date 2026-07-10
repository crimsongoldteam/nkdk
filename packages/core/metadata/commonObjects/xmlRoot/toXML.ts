import { registerTypeRule } from "../../orchestration"

export const exportXMLRootToXML = (): undefined => {
  return undefined
}

registerTypeRule("XMLRoot", "exportToXML", exportXMLRootToXML)
