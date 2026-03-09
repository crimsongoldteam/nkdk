import { receiveUUID } from "~/metadata/appliedObjects/configDumpInfo/getUUID"
import { getChildContextToXML, getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { mergeIgnoringUndefined, sortObject } from "~/metadata/helpers/compactObject"
import { exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
import { exportInternalInfoToXMLOld } from "../internalInfo/toXML"
import { MetadataAttributesXML } from "../metadataAttribute/types"
import { getDefaults } from "./defaults"
import { MetadataTabularSectionRules } from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "./types"

export const exportMetadataTabularSectionsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToXML(context, undefined, value)!)
}

export const exportMetadataTabularSectionToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSection
): MetadataTabularSectionXML => {
  const defaults = getDefaults(context, data)
  const mergedData = mergeIgnoringUndefined(data, defaults)

  const parent = getParentFromContext(context, ["MetadataCatalog"])
  const parentPath = parent.path
  const parentName = parent.name

  const path = `${parentPath}.TabularSection.${mergedData.name}`

  const currentContext = getChildContextToXML({
    context,
    itemType: "MetadataTabularSection",
    path: path,
    name: mergedData.name,
  })

  const exported = exportPropertiesToXML({
    context: currentContext,
    metadata: mergedData,
    rule: MetadataTabularSectionRules,
  }) as { Properties?: MetadataTabularSectionXML["Properties"]; ChildObjects?: { Attribute?: MetadataAttributesXML } }

  const result: MetadataTabularSectionXML = {
    _uuid: receiveUUID({ context: currentContext, parentPath: parentPath, path: path }),
    InternalInfo: exportInternalInfoToXMLOld(context, [
      { name: `CatalogTabularSection.${parentName}.${mergedData.name}`, category: "TabularSection" },
      { name: `CatalogTabularSectionRow.${parentName}.${mergedData.name}`, category: "TabularSectionRow" },
    ]),
    Properties: sortObject(exported.Properties ?? ({} as MetadataTabularSectionXML["Properties"])),
  }

  const attributes = exported.ChildObjects?.Attribute
  if (attributes != null && (Array.isArray(attributes) ? attributes.length > 0 : true)) {
    result.ChildObjects = { Attribute: attributes }
  }

  return result
}

registerTypeRule("MetadataTabularSections", "exportToXML", exportMetadataTabularSectionsToXML)
