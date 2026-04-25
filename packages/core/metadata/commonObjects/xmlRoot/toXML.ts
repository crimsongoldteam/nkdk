import { registerTypeRule } from "~/metadata/orchestration"

export const exportXMLRootToXML = (): undefined => {
  return undefined
}

registerTypeRule("XMLRoot", "exportToXML", exportXMLRootToXML)
