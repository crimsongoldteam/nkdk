import { MetadataAttributesXML } from "../metadataAttribute/types"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "./types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { mergeIgnoringUndefined, sortObject } from "~/metadata/helpers/compactObject"
import { exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import { exportInternalInfoToXML } from "../internalInfo/toXML"
import { getDefaults } from "./defaults"
import { MetadataTabularSectionRules } from "./rules"

export const exportMetadataTabularSectionsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToXML(context, undefined, value)!)
}

export const exportMetadataTabularSectionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSection
): MetadataTabularSectionXML => {
  const defaults = getDefaults(context, data)
  const mergedData = mergeIgnoringUndefined(data, defaults)

  const parentName = (context.context as { parentName?: string }).parentName ?? ""

  const exported = exportPropertiesToXML({
    context,
    metadataItem: mergedData,
    rule: MetadataTabularSectionRules,
  }) as { Properties?: MetadataTabularSectionXML["Properties"]; ChildObjects?: { Attribute?: MetadataAttributesXML } }

  const result: MetadataTabularSectionXML = {
    _uuid: getUUID(context),
    InternalInfo: exportInternalInfoToXML(context, [
      { name: `CatalogTabularSection.${parentName}.${mergedData.name}`, category: "TabularSection" },
      { name: `CatalogTabularSectionRow.${parentName}.${mergedData.name}`, category: "TabularSectionRow" },
    ]),
    Properties: sortObject(exported.Properties ?? ({} as MetadataTabularSectionXML["Properties"])),
  }

  const attributes = exported.ChildObjects?.Attribute
  if (
    attributes != null &&
    (Array.isArray(attributes) ? attributes.length > 0 : true)
  ) {
    result.ChildObjects = { Attribute: attributes }
  }

  return result
}

registerTypeRule("MetadataTabularSections", "exportToXML", exportMetadataTabularSectionsToXML)
