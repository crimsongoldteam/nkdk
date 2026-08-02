import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { PropertyRule } from "../../orchestration/property/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { internalInfoRule, type InternalInfoParam } from "../internalInfo/types"
import {
  metadataChildNameProperty,
  metadataChildSynonymProperty,
} from "../metadataAttribute/fragments"
import { metadataRuleFragment } from "../metadataRuleFragment"
import { uuidPropertyRule } from "../uuid/rule"

const propertiesParents = ["Properties"]
const childObjectsParents = ["ChildObjects"]
const emptyAttributes: [] = []

export const metadataTabularSectionRuleBase = {
  itemType: "MetadataTabularSection",
  externalMetadata: { segment: "TabularSection", placement: "ownerChild" },
} as const

export function tabularSectionInternalInfoFragment(params: {
  getName: (params: {
    context: ConfigurationContextWithExportToXML
    metadata: { name: string }
  }) => string
  items: InternalInfoParam[]
}) {
  return metadataRuleFragment(["internalInfo"], {
    internalInfo: internalInfoRule({
      forReferenceOnly: true,
      getName: params.getName,
      items: params.items,
    }),
  })
}

export const tabularSectionIdentityFragment = metadataRuleFragment(
  ["objectBelonging", "name"],
  {
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: propertiesParents,
      noImplicitValueYAML: true,
    },
    name: metadataChildNameProperty,
  } as const satisfies Record<string, PropertyRule>
)

export const tabularSectionPresentationFragment = metadataRuleFragment(
  ["synonym", "comment", "toolTip"],
  {
    synonym: metadataChildSynonymProperty,
    comment: {
      yaml: "Комментарий",
      xml: "Comment",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    toolTip: {
      yaml: "Подсказка",
      xml: "ToolTip",
      type: "I8nText",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
  } as const satisfies Record<string, PropertyRule>
)

export const tabularSectionFillCheckingFragment = metadataRuleFragment(["fillChecking"], {
  fillChecking: {
    yaml: "ПроверкаЗаполнения",
    xml: "FillChecking",
    type: "SystemEnumeration",
    typeSE: "FillChecking",
    xmlParents: propertiesParents,
    defaultValueXML: "DontCheck",
    implicitValueYAML: "DontCheck",
  },
} as const satisfies Record<string, PropertyRule>)

export const tabularSectionStandardAttributesFragment = metadataRuleFragment(["standardAttributes"], {
  standardAttributes: {
    yaml: "СтандартныеРеквизиты",
    xml: "StandardAttributes",
    type: "StandardAttributeDescriptions",
    standartAttributeNames: { LineNumber: "НомерСтроки" },
    xmlParents: propertiesParents,
  },
} as const satisfies Record<string, PropertyRule>)

export const tabularSectionUseFragment = metadataRuleFragment(["use"], {
  use: systemEnumerationRule({
    yaml: "Использование",
    xml: "Use",
    typeSE: "AttributeUse",
    xmlParents: propertiesParents,
    defaultValueXML: "ForItem",
    implicitValueYAML: "ForItem",
  }),
})

export const tabularSectionLineNumberFragment = metadataRuleFragment(["lineNumberLength"], {
  lineNumberLength: {
    yaml: "ДлинаНомераСтроки",
    xml: "LineNumberLength",
    type: "number",
    xmlParents: propertiesParents,
    defaultValueXML: 5,
    implicitValueYAML: 5,
  },
} as const satisfies Record<string, PropertyRule>)

export function tabularSectionAttributesFragment<const PropertyType extends string>(propertyType: PropertyType) {
  return metadataRuleFragment(["attributes"], {
    attributes: {
      yaml: "Реквизиты",
      type: propertyType,
      operationTarget: namedCollectionTarget({
        kind: "attribute",
        migrationSegment: "Реквизит",
        requiresMigration: true,
      }),
      defaultValue: emptyAttributes,
      defaultValueXMLEmpty: emptyAttributes,
      defaultValueXMLRaw: {},
      xmlParents: childObjectsParents,
      xml: "Attribute",
    },
  })
}

export const tabularSectionUuidFragment = metadataRuleFragment(["uuid"], { uuid: uuidPropertyRule })

export const metadataTabularSectionModelProperties = {
  ...tabularSectionInternalInfoFragment({
    getName: ({ metadata }) => metadata.name,
    items: [],
  }).properties,
  ...tabularSectionIdentityFragment.properties,
  ...tabularSectionPresentationFragment.properties,
  ...tabularSectionFillCheckingFragment.properties,
  ...tabularSectionStandardAttributesFragment.properties,
  ...tabularSectionUseFragment.properties,
  ...tabularSectionLineNumberFragment.properties,
  ...tabularSectionAttributesFragment("MetadataTabularSectionAttributes").properties,
  ...tabularSectionUuidFragment.properties,
} as const
