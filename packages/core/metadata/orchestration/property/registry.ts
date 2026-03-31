import { MetadataCommands, MetadataCommandsYAML } from "~/metadata/appliedObjects/metadataCommand/types"
import { AdditionalIndex, AdditionalIndexYAML } from "~/metadata/commonObjects/additionalIndex/types"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderYAML } from "~/metadata/commonObjects/border/types"
import {
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsYAML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { ChoiceList, ChoiceListYAML } from "~/metadata/commonObjects/choiceList/types"
import { Color, ColorEnterprise, ColorYAML } from "~/metadata/commonObjects/color/types"
import {
  AppearanceFields,
  AppearanceFieldsYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/appearanceFields/types"
import {
  AvailableFields,
  AvailableFieldsYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/availableFields/types"
import {
  CalculatedField,
  CalculatedFieldYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/calculatedField/types"
import {
  CalculatedFieldOrderExpression,
  CalculatedFieldOrderExpressionYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/types"
import type {
  CalculatedFieldUseRestriction,
  CalculatedFieldUseRestrictionYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/calculatedFieldUseRestriction/types"
import {
  ConditionalAppearanceItem,
  ConditionalAppearanceYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/types"
import {
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types"
import {
  DcsMetadataTypedValue,
  DcsMetadataTypedValueYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types"
import { Filter, FilterYAML } from "~/metadata/commonObjects/dataCompositionSystem/filter/types"
import { FilterItem, FilterItemYAML } from "~/metadata/commonObjects/dataCompositionSystem/filterItem/types"
import {
  SettingsParameterValue,
  SettingsParameterValueYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/parameterValue/types"
import {
  GroupItemAuto,
  GroupItemAutoYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/types"
import {
  GroupItem,
  GroupItemYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/types"
import {
  StructureItem,
  StructureItemYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/structureItemGroup/structureItem/types"
import {
  StructureItemGroup,
  StructureItemGroupYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/structureItemGroup/types"
import { FieldsList, FieldsListYAML } from "~/metadata/commonObjects/fieldsList/types"
import { Font, FontEnterprise, FontYAML } from "~/metadata/commonObjects/font/types"
import { FormattedI8nText, FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { FunctionalOptions, FunctionalOptionsYAML } from "~/metadata/commonObjects/functionalOptionsProperty/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { IndexField, IndexFieldYAML } from "~/metadata/commonObjects/indexField/types"
import { InternalInfo } from "~/metadata/commonObjects/internalInfo/types"
import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesYAML,
  MetadataAttributeYAML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { MetadataCommandGroup, MetadataCommandGroupYAML } from "~/metadata/commonObjects/metadataCommandGroup/types"
import {
  MetadataField,
  MetadataFields,
  MetadataFieldsYAML,
  MetadataFieldYAML,
} from "~/metadata/commonObjects/metadataField/types"
import { DataPathYAML, MetadataType, MetadataTypeYAML } from "~/metadata/commonObjects/metadataPath/types"
import {
  MetadataItemLink,
  MetadataItemLinks,
  MetadataItemLinksYAML,
  MetadataItemLinkYAML,
} from "~/metadata/commonObjects/metadataRef/types"
import {
  MetadataTabularSections,
  MetadataTabularSectionsYAML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import {
  MetadataTypedPrimitiveValue,
  MetadataValue,
  MetadataValueYAML,
} from "~/metadata/commonObjects/metadataValue/types"
import {
  MetadataValueCollection,
  MetadataValueCollectionYAML,
} from "~/metadata/commonObjects/metadataValueCollection/types"
import { Picture, PictureEnterprise, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { Predefined, PredefinedYAML } from "~/metadata/commonObjects/predifined/types"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
  StandardAttributeDescriptionYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionYAML,
} from "~/metadata/commonObjects/typeDescription/types"
import { TypeLink, TypeLinkYAML } from "~/metadata/commonObjects/typeLink/types"
import { UsePurposes, UsePurposesYAML } from "~/metadata/commonObjects/usePurposes/types"
import { UserSettingsID, UserSettingsIDYAML } from "~/metadata/commonObjects/userSettingsID/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { ChoiceParameters, ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import {
  CommandBarChildItems,
  CommandBarChildItemsEnterprise,
  CommandBarChildItemsTypedYAML,
  GroupChildItems,
  GroupChildItemsEnterprise,
  GroupChildItemsPartialYAML,
  PagesChildItems,
  PagesChildItemsEnterprise,
  PagesChildItemsPartialYAML,
  TableChildItems,
  TableChildItemsEnterprise,
  TableChildItemsPartialYAML,
} from "~/metadata/forms/commonObjects/childItems/types"
import { CommandInterface, CommandInterfaceYAML } from "~/metadata/forms/commonObjects/commandInterface/types"
import { CommandSet, CommandSetYAML } from "~/metadata/forms/commonObjects/commandSet/types"
import { DataPath } from "~/metadata/forms/commonObjects/dataPath/types"
import { DynamicList, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"
import {
  FormAttributeColumns,
  FormAttributeColumnsYAML,
  FormAttributes,
  FormAttributesYAML,
} from "~/metadata/forms/commonObjects/formAttribute/types"
import { FormCommands, FormCommandsYAML } from "~/metadata/forms/commonObjects/formCommand/types"
import { FormParameters, FormParametersYAML } from "~/metadata/forms/commonObjects/formParameter/types"
import { ScrollBarUseEnterprise } from "~/metadata/forms/commonObjects/scrollBarUse/types"
import { AutoCommandBar, AutoCommandBarYAML } from "~/metadata/forms/elements/autoCommandBar/types"
import { ContextMenu, ContextMenuYAML } from "~/metadata/forms/elements/contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "~/metadata/forms/elements/extendedTooltip/types"
import {
  SingleSearchControlAddition,
  SingleSearchControlAdditionYAML,
} from "~/metadata/forms/elements/searchControlAddition/types"
import {
  SingleSearchStringAddition,
  SingleSearchStringAdditionYAML,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { ViewStatusAddition, ViewStatusAdditionYAML } from "~/metadata/forms/elements/viewStatusAddition/types"
import { ScrollBarUseYAML, SystemEnumerationEnterprise } from "~/metadata/systemEnumerations/types"

export type PropertyTypeRegistry = {
  //#region Primitive types

  number: {
    item: number
    enterprise: number
    yaml: number
  }
  string: {
    item: string
    enterprise: string
    yaml: string
  }
  boolean: {
    item: boolean
    enterprise: boolean
    yaml: StringboolYAML
  }
  UserSettingsID: {
    item: UserSettingsID
    yaml: UserSettingsIDYAML
  }
  //#endregion

  //#region Common

  SystemEnumeration: {
    item: unknown
    enterprise: SystemEnumerationEnterprise
    yaml: string
  }
  Color: {
    item: Color
    enterprise: ColorEnterprise
    yaml: ColorYAML
  }
  TypeDescription: {
    item: TypeDescription
    enterprise: TypeDescriptionEnterprise
    yaml: TypeDescriptionYAML
  }
  DataPath: {
    item: DataPath
    enterprise: string
    yaml: DataPathYAML
  }
  I8nText: {
    item: I8nText
    enterprise: string
    yaml: I8nTextYAML
  }
  FormattedI8nText: {
    item: FormattedI8nText
    enterprise: string
    yaml: FormattedI8nTextYAML
  }
  Font: {
    item: Font
    enterprise: FontEnterprise
    yaml: FontYAML
  }

  Events: {
    item: Record<string, string>
    yaml: Record<string, string>
  }

  Picture: {
    item: Picture
    enterprise: PictureEnterprise
    yaml: PictureYAML
  }
  Border: {
    item: Border
    enterprise: BorderEnterprise
    yaml: BorderYAML
  }
  CommandName: {
    item: string
    enterprise: string
    yaml: string
  }
  UserVisible: {
    item: UserVisible

    yaml: UserVisibleYAML
  }
  TableAdditionalSource: {
    item: string
    enterprise: string
    yaml: string
  }
  StandardAttributeDescription: {
    item: StandardAttributeDescription

    yaml: StandardAttributeDescriptionYAML
  }
  StandardAttributeDescriptions: {
    item: StandardAttributeDescriptions

    yaml: StandardAttributeDescriptionsYAML
  }
  MetadataType: {
    item: MetadataType
    enterprise: string
    yaml: MetadataTypeYAML
  }
  MetadataTypeCollection: {
    item: MetadataType[]
    enterprise: string[]
    yaml: MetadataTypeYAML[]
  }
  AdditionalIndex: {
    item: AdditionalIndex

    yaml: AdditionalIndexYAML
  }
  CharacteristicsDescriptions: {
    item: CharacteristicsDescriptions
    yaml: CharacteristicsDescriptionsYAML
  }
  ChoiceList: {
    item: ChoiceList

    yaml: ChoiceListYAML
  }
  ChoiceParameterLinks: {
    item: ChoiceParameterLinks
    enterprise: string
    yaml: ChoiceParameterLinksYAML
  }
  ChoiceParameters: {
    item: ChoiceParameters

    yaml: ChoiceParametersYAML
  }
  FieldsList: {
    item: FieldsList
    enterprise: string[]
    yaml: FieldsListYAML
  }
  FunctionalOptions: {
    item: FunctionalOptions
    enterprise: string[]
    yaml: FunctionalOptionsYAML
  }
  IndexField: {
    item: IndexField
    enterprise: string
    yaml: IndexFieldYAML
  }
  MetadataAttribute: {
    item: MetadataAttribute

    yaml: MetadataAttributeYAML
  }
  MetadataCommandGroup: {
    item: MetadataCommandGroup
    enterprise: string
    yaml: MetadataCommandGroupYAML
  }
  MetadataField: {
    item: MetadataField
    enterprise: string
    yaml: MetadataFieldYAML
  }
  MetadataFields: {
    item: MetadataFields
    enterprise: string
    yaml: MetadataFieldsYAML
  }
  MetadataItemLink: {
    item: MetadataItemLink
    enterprise: string
    yaml: MetadataItemLinkYAML
  }
  MetadataTabularSections: {
    item: MetadataTabularSections

    yaml: MetadataTabularSectionsYAML
  }
  MetadataValue: {
    item: MetadataValue

    yaml: MetadataValueYAML
  }
  MetadataValueCollection: {
    item: MetadataValueCollection
    enterprise: string[]
    yaml: MetadataValueCollectionYAML
  }
  Predefined: {
    item: Predefined
    yaml: PredefinedYAML
  }
  TypeLink: {
    item: TypeLink
    yaml: TypeLinkYAML
  }
  UsePurposes: {
    item: UsePurposes
    enterprise: string[]
    yaml: UsePurposesYAML
  }

  FunctionalOptionsProperty: {
    item: FunctionalOptions
    enterprise: string[]
    yaml: FunctionalOptionsYAML
  }

  MetadataAttributes: {
    item: MetadataAttributes
    yaml: MetadataAttributesYAML
  }
  MetadataItemLinks: {
    item: MetadataItemLinks
    yaml: MetadataItemLinksYAML
  }
  MetadataCommands: {
    item: MetadataCommands
    yaml: MetadataCommandsYAML
  }
  CommandInterface: {
    item: CommandInterface
    yaml: CommandInterfaceYAML
  }
  InternalInfo: {
    item: InternalInfo
  }
  AssociatedTable: {
    item: string
    yaml: string
  }

  DynamicList: {
    item: DynamicList
    yaml: DynamicListYAML
  }

  CommandSet: {
    item: CommandSet
    yaml: CommandSetYAML
  }

  FormCommands: {
    item: FormCommands
    yaml: FormCommandsYAML
  }

  FormAttributes: {
    item: FormAttributes
    yaml: FormAttributesYAML
  }

  FormParameters: {
    item: FormParameters
    yaml: FormParametersYAML
  }

  FormAttributeColumns: {
    item: FormAttributeColumns
    yaml: FormAttributeColumnsYAML
  }

  // FormAttributeSettings: {
  //   item: FormAttributeSettings
  //   enterprise: unknown
  //   yaml: FormAttributeSettingsYAML
  // }

  //#endregion

  //#region Single form elements

  ContextMenu: {
    item: ContextMenu
    yaml: ContextMenuYAML
  }

  ExtendedTooltip: {
    item: ExtendedTooltip
    yaml: ExtendedTooltipYAML
  }

  SingleSearchControlAddition: {
    item: SingleSearchControlAddition
    yaml: SingleSearchControlAdditionYAML
  }

  SingleSearchStringAddition: {
    item: SingleSearchStringAddition
    yaml: SingleSearchStringAdditionYAML
  }

  ViewStatusAddition: {
    item: ViewStatusAddition
    yaml: ViewStatusAdditionYAML
  }
  AutoCommandBar: {
    item: AutoCommandBar
    yaml: AutoCommandBarYAML
  }
  TableAutoCommandBar: {
    item: AutoCommandBar
    yaml: AutoCommandBarYAML
  }

  //#endregion

  //#region ChildItems

  GroupChildItems: {
    item: GroupChildItems
    enterprise: GroupChildItemsEnterprise
    yaml: GroupChildItemsPartialYAML
  }
  CommandBarChildItems: {
    item: CommandBarChildItems
    enterprise: CommandBarChildItemsEnterprise
    yaml: CommandBarChildItemsTypedYAML
  }
  TableChildItems: {
    item: TableChildItems
    enterprise: TableChildItemsEnterprise
    yaml: TableChildItemsPartialYAML
  }
  PagesChildItems: {
    item: PagesChildItems
    enterprise: PagesChildItemsEnterprise
    yaml: PagesChildItemsPartialYAML
  }
  // ChildItems: {
  //   item: unknown
  //   enterprise: AllChildItemsEnterprise
  //   yaml: unknown
  // }

  //#endregion

  ScrollBarUseBoolean: {
    item: "AutoUse" | "DontUse" | "UseAlways"
    enterprise: ScrollBarUseEnterprise
    yaml: ScrollBarUseYAML
  }
  SettingsParameterValue: {
    item: SettingsParameterValue
    yaml: SettingsParameterValueYAML
  }
  MetadataDcsMetadataValue: {
    item: MetadataDcsMetadataValue
    yaml: MetadataDcsMetadataValueYAML
  }
  DcsMetadataTypedValue: {
    item: DcsMetadataTypedValue
    yaml: DcsMetadataTypedValueYAML
  }
  DcsField: {
    item: string
    yaml: string
  }
  DcsBoolean: {
    item: string
    yaml: string
  }
  DcsLocalStringType: {
    item: I8nText
    yaml: I8nTextYAML
  }
  FilterItemFieldValue: {
    item: string
    yaml: string
  }
  FilterItemLocalStringTypeValue: {
    item: I8nText
    yaml: I8nTextYAML
  }
  FilterItemPresentationValue: {
    item: I8nText
    yaml: I8nTextYAML
  }
  FilterItemPrimitiveValue: {
    item: MetadataTypedPrimitiveValue
    yaml: MetadataValueYAML
  }
  AppearanceFields: {
    item: AppearanceFields
    yaml: AppearanceFieldsYAML
  }
  CalculatedField: {
    item: CalculatedField
    yaml: CalculatedFieldYAML
  }
  CalculatedFieldUseRestriction: {
    item: CalculatedFieldUseRestriction
    yaml: CalculatedFieldUseRestrictionYAML
  }
  CalculatedFieldOrderExpression: {
    item: CalculatedFieldOrderExpression
    yaml: CalculatedFieldOrderExpressionYAML
  }
  Filter: {
    item: Filter
    yaml: FilterYAML
  }
  AvailableFields: {
    item: AvailableFields
    yaml: AvailableFieldsYAML
  }
  FilterItem: {
    item: FilterItem
    yaml: FilterItemYAML
  }
  GroupItemAuto: {
    item: GroupItemAuto
    yaml: GroupItemAutoYAML
  }
  GroupItem: {
    item: GroupItem
    yaml: GroupItemYAML
  }
  StructureItem: {
    item: StructureItem
    yaml: StructureItemYAML
  }
  StructureItemGroup: {
    item: StructureItemGroup
    yaml: StructureItemGroupYAML
  }
  ConditionalAppearance: {
    item: ConditionalAppearanceItem[]
    yaml: ConditionalAppearanceYAML
  }
  ElementId: {
    item: string
    yaml: string
  }
  UserSettingPresentation: {
    item: I8nText
    yaml: I8nTextYAML
  }
}

export type PropertyRuleType = keyof PropertyTypeRegistry

export const PropertyRuleTypeKeys = Object.keys({
  number: "number",
  string: "string",
  boolean: "boolean",
  UserSettingsID: "UserSettingsID",
  SystemEnumeration: "SystemEnumeration",
  Color: "Color",
  TypeDescription: "TypeDescription",
  DataPath: "DataPath",
  I8nText: "I8nText",
  FormattedI8nText: "FormattedI8nText",
  Font: "Font",
  Events: "Events",
  // ChildItems: "ChildItems",
  Picture: "Picture",
  Border: "Border",
  CommandName: "CommandName",
  UserVisible: "UserVisible",
  TableAdditionalSource: "TableAdditionalSource",
  StandardAttributeDescription: "StandardAttributeDescription",
  StandardAttributeDescriptions: "StandardAttributeDescriptions",
  MetadataType: "MetadataType",
  MetadataTypeCollection: "MetadataTypeCollection",
  AdditionalIndex: "AdditionalIndex",
  CharacteristicsDescriptions: "CharacteristicsDescriptions",
  ChoiceList: "ChoiceList",
  ChoiceParameterLinks: "ChoiceParameterLinks",
  ChoiceParameters: "ChoiceParameters",
  FieldsList: "FieldsList",
  FunctionalOptions: "FunctionalOptions",
  IndexField: "IndexField",
  MetadataAttribute: "MetadataAttribute",
  MetadataCommandGroup: "MetadataCommandGroup",
  MetadataField: "MetadataField",
  MetadataFields: "MetadataFields",
  MetadataItemLink: "MetadataItemLink",
  MetadataTabularSections: "MetadataTabularSections",
  MetadataValue: "MetadataValue",
  MetadataValueCollection: "MetadataValueCollection",
  Predefined: "Predefined",
  TypeLink: "TypeLink",
  UsePurposes: "UsePurposes",
  GroupChildItems: "GroupChildItems",
  CommandBarChildItems: "CommandBarChildItems",
  TableChildItems: "TableChildItems",
  PagesChildItems: "PagesChildItems",
  FunctionalOptionsProperty: "FunctionalOptionsProperty",
  MetadataAttributes: "MetadataAttributes",
  MetadataItemLinks: "MetadataItemLinks",
  MetadataCommands: "MetadataCommands",
  CommandInterface: "CommandInterface",
  ContextMenu: "ContextMenu",
  ExtendedTooltip: "ExtendedTooltip",
  SingleSearchControlAddition: "SingleSearchControlAddition",
  SingleSearchStringAddition: "SingleSearchStringAddition",
  ViewStatusAddition: "ViewStatusAddition",
  AssociatedTable: "AssociatedTable",
  AutoCommandBar: "AutoCommandBar",
  TableAutoCommandBar: "TableAutoCommandBar",
  DynamicList: "DynamicList",
  CommandSet: "CommandSet",
  FormCommands: "FormCommands",
  FormAttributes: "FormAttributes",
  FormAttributeColumns: "FormAttributeColumns",
  FormParameters: "FormParameters",
  InternalInfo: "InternalInfo",
  ScrollBarUseBoolean: "ScrollBarUseBoolean",
  SettingsParameterValue: "SettingsParameterValue",
  MetadataDcsMetadataValue: "MetadataDcsMetadataValue",
  DcsMetadataTypedValue: "DcsMetadataTypedValue",
  DcsField: "DcsField",
  DcsBoolean: "DcsBoolean",
  DcsLocalStringType: "DcsLocalStringType",
  FilterItemFieldValue: "FilterItemFieldValue",
  FilterItemLocalStringTypeValue: "FilterItemLocalStringTypeValue",
  FilterItemPresentationValue: "FilterItemPresentationValue",
  FilterItemPrimitiveValue: "FilterItemPrimitiveValue",
  AppearanceFields: "AppearanceFields",
  CalculatedField: "CalculatedField",
  CalculatedFieldUseRestriction: "CalculatedFieldUseRestriction",
  CalculatedFieldOrderExpression: "CalculatedFieldOrderExpression",
  Filter: "Filter",
  AvailableFields: "AvailableFields",
  FilterItem: "FilterItem",
  GroupItemAuto: "GroupItemAuto",
  GroupItem: "GroupItem",
  StructureItem: "StructureItem",
  StructureItemGroup: "StructureItemGroup",
  ConditionalAppearance: "ConditionalAppearance",
  ElementId: "ElementId",
  UserSettingPresentation: "UserSettingPresentation",
} as const satisfies Record<PropertyRuleType, PropertyRuleType>) as readonly PropertyRuleType[]

export type PropertyToMetadata<Key extends PropertyRuleType> = Key extends PropertyRuleType
  ? "item" extends keyof PropertyTypeRegistry[Key]
    ? PropertyTypeRegistry[Key]["item"]
    : undefined
  : never

export type PropertyToEnterprise<Key extends PropertyRuleType> = Key extends PropertyRuleType
  ? "enterprise" extends keyof PropertyTypeRegistry[Key]
    ? PropertyTypeRegistry[Key]["enterprise"]
    : undefined
  : never

export type PropertyToYAML<Key extends PropertyRuleType> = Key extends PropertyRuleType
  ? "yaml" extends keyof PropertyTypeRegistry[Key]
    ? PropertyTypeRegistry[Key]["yaml"]
    : undefined
  : never

// export const TypesNames = PropertyType
