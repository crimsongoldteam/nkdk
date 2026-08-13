import { splitPascalCase } from "../../helpers/canConvertToPascalCase"
import {
  type MetadataRulePropertyShape,
  metadataRuleFragment,
  systemEnumerationProperty,
} from "../metadataRuleFragment"

const propertiesParents = ["Properties"]

export const metadataChildNameProperty = {
  xml: "Name",
  type: "string",
  required: true,
  xmlParents: propertiesParents,
} as const satisfies MetadataRulePropertyShape

export const metadataChildSynonymProperty = {
  yaml: "Синоним",
  xml: "Synonym",
  type: "I8nText",
  excludeIfEqualNameYAML: true,
  defaultValue: ({
    context,
    name,
    operation,
  }: {
    context: { defaultLanguage: string }
    name?: string
    operation?: string
  }) =>
    operation === "importFromYAML" && name
      ? { items: { [context.defaultLanguage]: splitPascalCase(name) } }
      : { items: { [context.defaultLanguage]: "" } },
  xmlParents: propertiesParents,
  defaultValueXMLEmpty: { items: {} },
  defaultValueXMLRaw: "",
  preserveEmptyXML: true,
} as const satisfies MetadataRulePropertyShape

export const METADATA_ATTRIBUTE_ALLOWED_TYPES = [
  "string",
  "decimal",
  "date",
  "boolean",
  "ValueStorage",
  "UUID",
  "CatalogRef",
  "CatalogRef.*",
  "DocumentRef",
  "DocumentRef.*",
  "EnumRef",
  "EnumRef.*",
  "ChartOfCharacteristicTypesRef",
  "ChartOfCharacteristicTypesRef.*",
  "ChartOfAccountsRef",
  "ChartOfAccountsRef.*",
  "ChartOfCalculationTypesRef",
  "ChartOfCalculationTypesRef.*",
  "BusinessProcessRef",
  "BusinessProcessRef.*",
  "BusinessProcessRoutePointRef",
  "BusinessProcessRoutePointRef.*",
  "TaskRef",
  "TaskRef.*",
  "ExchangePlanRef",
  "ExchangePlanRef.*",
  "AnyIBRef",
  "DefinedType.*",
  "Characteristic.*",
  "ExternalDataSourceTableRef.*",
  "ExternalDataSourceCubeDimensionTableRef.*",
] as const

export const metadataAttributeRuleBase = {
  itemType: "MetadataAttribute",
  metadataTargetOwner: { kind: "inherit" },
  externalMetadata: { segment: "Attribute", placement: "ownerChild" },
} as const

export const attributeIdentityFragment = metadataRuleFragment(
  ["objectBelonging", "name"],
  {
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: propertiesParents,
    },
    name: metadataChildNameProperty,
  } as const satisfies Record<string, MetadataRulePropertyShape>
)

export function attributePresentationFragment(params: {
  allowedTypes?: readonly string[]
}) {
  return metadataRuleFragment(
    [
      "synonym",
      "comment",
      "type",
      "passwordMode",
      "format",
      "editFormat",
      "toolTip",
      "markNegatives",
      "mask",
      "multiLine",
      "extendedEdit",
      "minValue",
      "maxValue",
    ],
    {
      synonym: metadataChildSynonymProperty,
      comment: {
        yaml: "Комментарий",
        xml: "Comment",
        type: "string",
        xmlParents: propertiesParents,
        defaultValueXMLRaw: "",
      },
      type: {
        yaml: "Тип",
        type: "TypeDescription",
        xml: "Type",
        xmlParents: propertiesParents,
        defaultValueXMLRaw: "",
        ...(params.allowedTypes === undefined ? {} : { allowedTypes: params.allowedTypes }),
      },
      passwordMode: {
        yaml: "РежимПароля",
        xml: "PasswordMode",
        type: "boolean",
        defaultValueXML: false,
        implicitValueYAML: false,
        xmlParents: propertiesParents,
      },
      format: {
        yaml: "Формат",
        xml: "Format",
        type: "I8nText",
        xmlParents: propertiesParents,
        defaultValueXMLRaw: "",
      },
      editFormat: {
        yaml: "ФорматРедактирования",
        xml: "EditFormat",
        type: "I8nText",
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
      markNegatives: {
        yaml: "ВыделятьОтрицательные",
        xml: "MarkNegatives",
        type: "boolean",
        defaultValueXML: false,
        implicitValueYAML: false,
        xmlParents: propertiesParents,
      },
      mask: {
        yaml: "Маска",
        xml: "Mask",
        type: "string",
        xmlParents: propertiesParents,
        defaultValueXMLRaw: "",
      },
      multiLine: {
        yaml: "МногострочныйРежим",
        xml: "MultiLine",
        type: "boolean",
        defaultValueXML: false,
        implicitValueYAML: false,
        xmlParents: propertiesParents,
      },
      extendedEdit: {
        yaml: "РасширенноеРедактирование",
        xml: "ExtendedEdit",
        type: "boolean",
        defaultValueXML: false,
        implicitValueYAML: false,
        xmlParents: propertiesParents,
      },
      minValue: {
        yaml: "МинимальноеЗначение",
        xml: "MinValue",
        type: "MinMaxValue",
        xmlParents: propertiesParents,
        typedXML: "xs:string",
        defaultValueXMLRaw: { "_xsi:nil": true },
      },
      maxValue: {
        yaml: "МаксимальноеЗначение",
        xml: "MaxValue",
        type: "MinMaxValue",
        xmlParents: propertiesParents,
        typedXML: "xs:string",
        defaultValueXMLRaw: { "_xsi:nil": true },
      },
    } as const satisfies Record<string, MetadataRulePropertyShape>
  )
}

export const attributeFillFragment = metadataRuleFragment(
  ["fillFromFillingValue", "fillValue"],
  {
    fillFromFillingValue: {
      yaml: "ЗаполнятьИзДанныхЗаполнения",
      xml: "FillFromFillingValue",
      type: "boolean",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: propertiesParents,
    },
    fillValue: {
      yaml: "ЗначениеЗаполнения",
      xml: "FillValue",
      type: "MetadataValue",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: { "_xsi:nil": true },
      exportNilValue: true,
      preserveUnknownReferenceXML: false,
    },
  } as const satisfies Record<string, MetadataRulePropertyShape>
)

export const attributeChoiceFragment = metadataRuleFragment(
  [
    "fillChecking",
    "choiceFoldersAndItems",
    "choiceParameterLinks",
    "choiceParameters",
    "quickChoice",
    "createOnInput",
    "choiceForm",
    "linkByType",
    "choiceHistoryOnInput",
  ],
  {
    fillChecking: {
      yaml: "ПроверкаЗаполнения",
      xml: "FillChecking",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
      defaultValueXML: "DontCheck",
      implicitValueYAML: "DontCheck",
      xmlParents: propertiesParents,
    },
    choiceFoldersAndItems: {
      yaml: "ВыборГруппИЭлементов",
      xml: "ChoiceFoldersAndItems",
      type: "SystemEnumeration",
      typeSE: "FoldersAndItemsUse",
      defaultValueXML: "Items",
      implicitValueYAML: "Items",
      xmlParents: propertiesParents,
    },
    choiceParameterLinks: {
      yaml: "СвязиПараметровВыбора",
      xml: "ChoiceParameterLinks",
      type: "ChoiceParameterLinks",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    choiceParameters: {
      yaml: "ПараметрыВыбора",
      xml: "ChoiceParameters",
      type: "ChoiceParameters",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    quickChoice: {
      yaml: "БыстрыйВыбор",
      xml: "QuickChoice",
      type: "SystemEnumeration",
      typeSE: "UseQuickChoice",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: propertiesParents,
    },
    createOnInput: {
      yaml: "СозданиеПриВводе",
      xml: "CreateOnInput",
      type: "SystemEnumeration",
      typeSE: "CreateOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: propertiesParents,
    },
    choiceForm: {
      yaml: "ФормаВыбора",
      xml: "ChoiceForm",
      type: "string",
      metadataTarget: { kind: "member", owner: "type", typeProperty: "type", memberKinds: ["Form"] },
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    linkByType: {
      yaml: "СвязьПоТипу",
      xml: "LinkByType",
      type: "TypeLink",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    choiceHistoryOnInput: {
      yaml: "ИсторияВыбораПриВводе",
      xml: "ChoiceHistoryOnInput",
      type: "SystemEnumeration",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
      xmlParents: propertiesParents,
    },
  } as const satisfies Record<string, MetadataRulePropertyShape>
)

export const attributeUseFragment = metadataRuleFragment(["use"], {
  use: systemEnumerationProperty({
    yaml: "Использование",
    xml: "Use",
    typeSE: "AttributeUse",
    defaultValueXML: "ForItem",
    implicitValueYAML: "ForItem",
    xmlParents: propertiesParents,
  }),
})

const indexing = {
  yaml: "Индексирование",
  xml: "Indexing",
  type: "SystemEnumeration",
  typeSE: "Indexing",
  defaultValueXML: "DontIndex",
  implicitValueYAML: "DontIndex",
  xmlParents: propertiesParents,
} as const satisfies MetadataRulePropertyShape

const fullTextSearch = {
  yaml: "ПолнотекстовыйПоиск",
  xml: "FullTextSearch",
  type: "SystemEnumeration",
  typeSE: "UseFullTextSearch",
  defaultValueXML: "Use",
  implicitValueYAML: "Use",
  xmlParents: propertiesParents,
} as const satisfies MetadataRulePropertyShape

const dataHistory = {
  yaml: "ИсторияДанных",
  xml: "DataHistory",
  type: "SystemEnumeration",
  typeSE: "DataHistoryUse",
  defaultValueXML: "Use",
  implicitValueYAML: "Use",
  xmlParents: propertiesParents,
} as const satisfies MetadataRulePropertyShape

export const attributeSearchAndHistoryFragment = metadataRuleFragment(
  ["indexing", "fullTextSearch", "dataHistory"],
  { indexing, fullTextSearch, dataHistory }
)

export const attributeIndexAndFullTextFragment = metadataRuleFragment(
  ["indexing", "fullTextSearch"],
  { indexing, fullTextSearch }
)

export const attributeBinaryStorageUseFragment = metadataRuleFragment(["binaryDataStorageLocationUse"], {
  binaryDataStorageLocationUse: systemEnumerationProperty({
    yaml: "ИспользованиеХраненияВХранилищеДвоичныхДанных",
    xml: "BinaryDataStorageLocationUse",
    typeSE: "BinaryDataStorageLocationUse",
    implicitValueYAML: "Use",
    xmlParents: propertiesParents,
  }),
})

export const attributeBinaryStorageUseFieldFragment = metadataRuleFragment(
  ["binaryDataStorageLocationUseField"],
  {
    binaryDataStorageLocationUseField: {
      yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUseField",
      type: "string",
      xmlParents: propertiesParents,
      metadataTarget: {
        kind: "member",
        owner: "this",
        memberKinds: ["Attribute"],
        filters: [{ kind: "directMember" }, { kind: "hasType", type: "boolean" }],
      },
    },
  } as const satisfies Record<string, MetadataRulePropertyShape>
)

export const attributeUuidFragment = metadataRuleFragment(["uuid"], {
  uuid: {
    type: "uuid",
    xml: "_uuid",
    evaluateWhenYAMLMissing: true,
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  },
})

export const metadataAttributeModelProperties = {
  ...attributeIdentityFragment.properties,
  ...attributePresentationFragment({}).properties,
  ...attributeFillFragment.properties,
  ...attributeChoiceFragment.properties,
  ...attributeUseFragment.properties,
  ...attributeSearchAndHistoryFragment.properties,
  ...attributeBinaryStorageUseFragment.properties,
  ...attributeBinaryStorageUseFieldFragment.properties,
  ...attributeUuidFragment.properties,
} as const
