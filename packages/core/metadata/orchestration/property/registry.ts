import { MetadataCommands, MetadataCommandsYAML } from "~/metadata/appliedObjects/metadataCommand/types"
import { AdditionalIndex, AdditionalIndexYAML } from "~/metadata/commonObjects/additionalIndex/types"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderYAML } from "~/metadata/commonObjects/border/types"
import {
  CharacteristicsDescription,
  CharacteristicsDescriptionYAML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { ChoiceList, ChoiceListYAML } from "~/metadata/commonObjects/choiceList/types"
import { Color, ColorEnterprise, ColorYAML } from "~/metadata/commonObjects/color/types"
import { FieldsList, FieldsListYAML } from "~/metadata/commonObjects/fieldsList/types"
import { Font, FontEnterprise, FontYAML } from "~/metadata/commonObjects/font/types"
import { FormattedI8nText, FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { FunctionalOptions, FunctionalOptionsYAML } from "~/metadata/commonObjects/functionalOptionsProperty/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { IndexField, IndexFieldYAML } from "~/metadata/commonObjects/indexField/types"
import {
  MetadataAttribute,
  MetadataAttributes,
  MetadataAttributesYAML,
  MetadataAttributeYAML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { MetadataCommandGroup, MetadataCommandGroupYAML } from "~/metadata/commonObjects/metadataCommandGroup/types"
import { MetadataField, MetadataFieldYAML } from "~/metadata/commonObjects/metadataField/types"
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
import { MetadataValue, MetadataValueYAML } from "~/metadata/commonObjects/metadataValue/types"
import {
  MetadataValueCollection,
  MetadataValueCollectionYAML,
} from "~/metadata/commonObjects/metadataValueCollection/types"
import { Picture, PictureEnterprise, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { Predefined, PredefinedYAML } from "~/metadata/commonObjects/predifined/types"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionYAML,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionYAML,
} from "~/metadata/commonObjects/typeDescription/types"
import { TypeLink, TypeLinkYAML } from "~/metadata/commonObjects/typeLink/types"
import { UsePurposes, UsePurposesYAML } from "~/metadata/commonObjects/usePurposes/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { ChoiceParameters, ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import {
  CommandBarChildItems,
  CommandBarChildItemsEnterprise,
  CommandBarChildItemsPartialYAML,
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
import { SystemEnumerationEnterprise } from "~/metadata/systemEnumerations/types"

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
    enterprise: unknown
    yaml: UserVisibleYAML
  }
  TableAdditionalSource: {
    item: string
    enterprise: string
    yaml: string
  }
  StandardAttributeDescription: {
    item: StandardAttributeDescription
    enterprise: unknown
    yaml: StandardAttributeDescriptionYAML
  }
  StandardAttributeDescriptions: {
    item: StandardAttributeDescriptions
    enterprise: unknown
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
    enterprise: unknown
    yaml: AdditionalIndexYAML
  }
  CharacteristicsDescription: {
    item: CharacteristicsDescription
    enterprise: unknown
    yaml: CharacteristicsDescriptionYAML
  }
  ChoiceList: {
    item: ChoiceList
    enterprise: unknown
    yaml: ChoiceListYAML
  }
  ChoiceParameterLinks: {
    item: ChoiceParameterLinks
    enterprise: string
    yaml: ChoiceParameterLinksYAML
  }
  ChoiceParameters: {
    item: ChoiceParameters
    enterprise: unknown
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
    enterprise: unknown
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
  MetadataItemLink: {
    item: MetadataItemLink
    enterprise: string
    yaml: MetadataItemLinkYAML
  }
  MetadataTabularSections: {
    item: MetadataTabularSections
    enterprise: unknown
    yaml: MetadataTabularSectionsYAML
  }
  MetadataValue: {
    item: MetadataValue
    enterprise: unknown
    yaml: MetadataValueYAML
  }
  MetadataValueCollection: {
    item: MetadataValueCollection
    enterprise: string[]
    yaml: MetadataValueCollectionYAML
  }
  Predefined: {
    item: Predefined
    enterprise: unknown
    yaml: PredefinedYAML
  }
  TypeLink: {
    item: TypeLink
    enterprise: unknown
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
    enterprise: unknown
    yaml: MetadataAttributesYAML
  }
  MetadataItemLinks: {
    item: MetadataItemLinks
    enterprise: unknown
    yaml: MetadataItemLinksYAML
  }
  MetadataCommands: {
    item: MetadataCommands
    enterprise: unknown
    yaml: MetadataCommandsYAML
  }
  CommandInterface: {
    item: CommandInterface
    enterprise: unknown
    yaml: CommandInterfaceYAML
  }

  AssociatedTable: {
    item: string
    enterprise: unknown
    yaml: string
  }

  DynamicList: {
    item: DynamicList
    enterprise: unknown
    yaml: DynamicListYAML
  }

  CommandSet: {
    item: CommandSet
    enterprise: unknown
    yaml: CommandSetYAML
  }

  FormCommands: {
    item: FormCommands
    enterprise: unknown
    yaml: FormCommandsYAML
  }

  FormAttributes: {
    item: FormAttributes
    enterprise: unknown
    yaml: FormAttributesYAML
  }

  FormParameters: {
    item: FormParameters
    enterprise: unknown
    yaml: FormParametersYAML
  }

  FormAttributeColumns: {
    item: FormAttributeColumns
    enterprise: unknown
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
    enterprise: unknown
    yaml: ContextMenuYAML
  }

  ExtendedTooltip: {
    item: ExtendedTooltip
    enterprise: unknown
    yaml: ExtendedTooltipYAML
  }

  SingleSearchControlAddition: {
    item: SingleSearchControlAddition
    enterprise: unknown
    yaml: SingleSearchControlAdditionYAML
  }

  SingleSearchStringAddition: {
    item: SingleSearchStringAddition
    enterprise: unknown
    yaml: SingleSearchStringAdditionYAML
  }

  ViewStatusAddition: {
    item: ViewStatusAddition
    enterprise: unknown
    yaml: ViewStatusAdditionYAML
  }
  AutoCommandBar: {
    item: AutoCommandBar
    enterprise: unknown
    yaml: AutoCommandBarYAML
  }
  TableAutoCommandBar: {
    item: AutoCommandBar
    enterprise: unknown
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
    yaml: CommandBarChildItemsPartialYAML
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
}

export type PropertyRuleType = keyof PropertyTypeRegistry

export const PropertyRuleTypeKeys = Object.keys({
  number: "number",
  string: "string",
  boolean: "boolean",
  SystemEnumeration: "SystemEnumeration",
  Color: "Color",
  TypeDescription: "TypeDescription",
  DataPath: "DataPath",
  I8nText: "I8nText",
  FormattedI8nText: "FormattedI8nText",
  Font: "Font",
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
  CharacteristicsDescription: "CharacteristicsDescription",
  ChoiceList: "ChoiceList",
  ChoiceParameterLinks: "ChoiceParameterLinks",
  ChoiceParameters: "ChoiceParameters",
  FieldsList: "FieldsList",
  FunctionalOptions: "FunctionalOptions",
  IndexField: "IndexField",
  MetadataAttribute: "MetadataAttribute",
  MetadataCommandGroup: "MetadataCommandGroup",
  MetadataField: "MetadataField",
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
} as const satisfies Record<PropertyRuleType, PropertyRuleType>) as readonly PropertyRuleType[]

export type PropertyToMetadata<Key extends PropertyRuleType> = PropertyTypeRegistry[Key]["item"]
export type PropertyToEnterprise<Key extends PropertyRuleType> = PropertyTypeRegistry[Key]["enterprise"]
export type PropertyToYAML<Key extends PropertyRuleType> = PropertyTypeRegistry[Key]["yaml"]

// export const TypesNames = PropertyType
