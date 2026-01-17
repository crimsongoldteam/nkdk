import { addNamespaces } from "./addNamespaces.js"
import { buildXml } from "./buildXml.js"
import { parseXml } from "./parseXml.js"
import { removeEmptyNodes } from "./removeEmptyNodes.js"
import { setUUID } from "./setUUID.js"
import { sortData } from "./sortData.js"
import { CleanContext } from "./types.js"

const metadataContext: CleanContext = {
  namespaces: {
    "xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
    "xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
    "xmlns:cmi": "http://v8.1c.ru/8.2/managed-application/cmi",
    "xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
    "xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
    "xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
    "xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
    "xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
    "xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
    "xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
    "xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
    "xmlns:xpr": "http://v8.1c.ru/8.3/xcf/predef",
    "xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    xmlns: "http://v8.1c.ru/8.3/MDClasses",
    version: "2.20",
  },

  sortableTags: [
    "Properties",
    "xr:Properties",
    "xr:StandardAttribute",
    "xr:CharacteristicTypes",
    "xr:CharacteristicValues",
  ],
}

const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) =>
    fns.reduce((acc, fn) => fn(acc), value)

export const cleanMetadata = (xmlContent: string): string => {
  const transform = pipe(
    (data) => addNamespaces(metadataContext, data),
    (data) => removeEmptyNodes(metadataContext, data),
    (data) => setUUID(metadataContext, data),
    (data) => sortData(metadataContext, data, false, "")
  )

  const parsedData = parseXml(xmlContent)
  const processedData = transform(parsedData)
  return buildXml(processedData)
}
