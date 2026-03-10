import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { getUUID } from "~/metadata/helpers/uuid"
import { exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
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
  data: MetadataTabularSections | undefined,
  referenceData?: MetadataTabularSections | undefined
): MetadataTabularSectionsXML | undefined => {
  if (!data) return undefined

  const referenceByName = referenceData ? new Map(referenceData.map((ref) => [ref.name, ref])) : undefined

  return data.map(
    (value: MetadataTabularSection) =>
      exportMetadataTabularSectionToXML(context, undefined, value, referenceByName?.get(value.name))!
  )
}

export const exportMetadataTabularSectionToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSection,
  referenceData?: MetadataTabularSection | undefined
): MetadataTabularSectionXML => {
  // const defaults = getDefaults(context, data)
  // const mergedData = mergeIgnoringUndefined(data, defaults)
  // const mergedReferenceData = referenceData ? mergeIgnoringUndefined(referenceData, defaults) : undefined

  // const parent = getParentFromContext(context, ["MetadataCatalog"])
  // const parentPath = parent.path
  // const parentName = parent.name

  // const path = `${parentPath}.TabularSection.${mergedData.name}`

  // const currentContext = getChildContextToXML({
  //   context,
  //   itemType: "MetadataTabularSection",
  //   path: path,
  //   name: mergedData.name,
  // })

  const properties = exportPropertiesToXML({
    context: context,
    metadata: data,
    referenceMetadata: referenceData,
    rule: MetadataTabularSectionRules,
  }) as MetadataTabularSectionXML

  const result: MetadataTabularSectionXML = {
    _uuid: referenceData?.uuid ?? getUUID(context),
    ...properties,
  }

  // const attributes = properties.ChildObjects?.Attribute
  // if (attributes != null && (Array.isArray(attributes) ? attributes.length > 0 : true)) {
  //   result.ChildObjects = { Attribute: attributes }
  // }

  return result
}

registerTypeRule("MetadataTabularSections", "exportToXML", exportMetadataTabularSectionsToXML)
