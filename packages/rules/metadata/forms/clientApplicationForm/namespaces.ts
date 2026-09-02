import {
  childUid,
  getConfigurationIndexCollectionContext,
  isXmlElementNode,
  objectRecordOrUndefined,
} from "@nkdk/runtime"
import type {
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "@nkdk/runtime"

const DCS_SCHEMA_PREFIX = "dcssch"
const DCS_SCHEMA_ATTRIBUTE = `_xmlns:${DCS_SCHEMA_PREFIX}` as const
const DCS_SCHEMA_NAMESPACE = "http://v8.1c.ru/8.1/data-composition-system/schema"
const NAMESPACE_PRESENT = "present"
const NAMESPACE_ABSENT = "absent"

export const FORM_NAMESPACES = {
  _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
  "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
  "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
  "_xmlns:dcscor": "http://v8.1c.ru/8.1/data-composition-system/core",
  [DCS_SCHEMA_ATTRIBUTE]: DCS_SCHEMA_NAMESPACE,
  "_xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
  "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
  "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
  "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
  "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
  "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
  "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
  "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
  "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
  "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
} as const

export function recordClientApplicationFormNamespaces(
  context: ConfigurationContextFromXML,
  xml: unknown,
): void {
  const index = getConfigurationIndexCollectionContext(context)
  if (index === undefined) return
  const value = isXmlElementNode(xml) ? xml.compatibilityValue : xml
  const root = objectRecordOrUndefined(value)
  const state = root !== undefined && Object.prototype.hasOwnProperty.call(root, DCS_SCHEMA_ATTRIBUTE)
    ? NAMESPACE_PRESENT
    : NAMESPACE_ABSENT
  index.collector.setXmlValue(namespaceAddress(index.logicalAddress), state)
}

export function clientApplicationFormNamespaces(
  context: ConfigurationContextWithExportToXML,
): Readonly<Record<string, string>> {
  const index = context.exportToXML.configurationIndex
  if (index === undefined) return FORM_NAMESPACES
  const address = namespaceAddress(index.logicalAddress)
  const state = index.xmlValue(address)
  if (state === undefined) return FORM_NAMESPACES
  if (state !== NAMESPACE_PRESENT && state !== NAMESPACE_ABSENT) {
    throw new Error(`Некорректное состояние пространства имён ${DCS_SCHEMA_PREFIX}: ${state}`)
  }
  index.collector.setXmlValue(address, state)
  if (state === NAMESPACE_PRESENT) return FORM_NAMESPACES
  const { [DCS_SCHEMA_ATTRIBUTE]: _dcsSchema, ...namespaces } = FORM_NAMESPACES
  return namespaces
}

function namespaceAddress(logicalAddress: string): string {
  return childUid(logicalAddress, "XMLNamespace", DCS_SCHEMA_PREFIX)
}
