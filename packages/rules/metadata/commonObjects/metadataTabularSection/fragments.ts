import {
  metadataChildNameProperty,
  metadataChildSynonymProperty,
} from "../metadataAttribute/fragments"
import {
  type MetadataRulePropertyShape,
  metadataRuleFragment,
  systemEnumerationProperty,
} from "../metadataRuleFragment"

const propertiesParents = ["Properties"]
const childObjectsParents = ["ChildObjects"]
const emptyAttributes: [] = []

interface TabularSectionInternalInfoParam {
  name: string
  category: string
}

interface TabularSectionExportContext {
  exportToXML: {
    itemsTree: readonly { itemType: string; name: string; path: string }[]
  }
}

export const metadataTabularSectionRuleBase = {
  itemType: "MetadataTabularSection",
  externalMetadata: { segment: "TabularSection", placement: "ownerChild" },
} as const

export function tabularSectionInternalInfoFragment(params: {
  getName: (params: {
    context: TabularSectionExportContext
    metadata: { name: string }
  }) => string
  items: TabularSectionInternalInfoParam[]
}) {
  return metadataRuleFragment(["internalInfo"], {
    internalInfo: {
      type: "InternalInfo",
      evaluateWhenYAMLMissing: true,
      forReferenceOnly: true,
      getName: params.getName,
      items: params.items,
    },
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
  } as const satisfies Record<string, MetadataRulePropertyShape>
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
  } as const satisfies Record<string, MetadataRulePropertyShape>
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
} as const satisfies Record<string, MetadataRulePropertyShape>)

export const tabularSectionStandardAttributesFragment = metadataRuleFragment(["standardAttributes"], {
  standardAttributes: {
    yaml: "СтандартныеРеквизиты",
    xml: "StandardAttributes",
    type: "StandardAttributeDescriptions",
    standartAttributeNames: { LineNumber: "НомерСтроки" },
    xmlParents: propertiesParents,
  },
} as const satisfies Record<string, MetadataRulePropertyShape>)

export const tabularSectionUseFragment = metadataRuleFragment(["use"], {
  use: systemEnumerationProperty({
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
} as const satisfies Record<string, MetadataRulePropertyShape>)

export function tabularSectionAttributesFragment<
  const PropertyType extends string,
  const ItemRule extends Readonly<Record<string, unknown>> | undefined = undefined,
>(propertyType: PropertyType, itemRule?: ItemRule) {
  return metadataRuleFragment(["attributes"], {
    attributes: {
      yaml: "Реквизиты",
      type: propertyType,
      ...(itemRule === undefined ? {} : { itemRule }),
      operationTarget: {
        kind: "namedCollectionTarget",
        targetKind: "attribute",
        migrationSegment: "Реквизит",
        requiresMigration: true,
      },
      defaultValue: emptyAttributes,
      defaultValueXMLEmpty: emptyAttributes,
      defaultValueXMLRaw: {},
      xmlParents: childObjectsParents,
      xml: "Attribute",
    },
  })
}

export const tabularSectionUuidFragment = metadataRuleFragment(["uuid"], {
  uuid: {
    type: "UUID",
    xml: "_uuid",
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  },
})

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
