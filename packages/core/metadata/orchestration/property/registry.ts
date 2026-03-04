import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderYAML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontYAML } from "~/metadata/commonObjects/font/types"
import { FormattedI8nText, FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { DataPathYAML, MetadataType, MetadataTypeYAML } from "~/metadata/commonObjects/metadataPath/types"
import { Picture, PictureEnterprise, PictureYAML } from "~/metadata/commonObjects/picture/types"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionYAML,
} from "~/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import {
  AllChildItemsEnterprise,
  CommandBarChildItems,
  CommandBarChildItemsEnterprise,
  CommandBarChildItemsPartialYAML,
  GroupChildItems,
  GroupChildItemsEnterprise,
  GroupChildItemsPartialYAML,
  TableChildItems,
  TableChildItemsEnterprise,
  TableChildItemsPartialYAML,
} from "~/metadata/forms/commonObjects/childItems/types"
import { DataPath } from "~/metadata/forms/commonObjects/dataPath/types"
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

  ChildItems: {
    item: unknown
    enterprise: AllChildItemsEnterprise
    yaml: unknown
  }

  //#endregion
}

export type PropertyType = keyof PropertyTypeRegistry

export const PropertyType: Record<PropertyType, PropertyType> = {
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
  ChildItems: "ChildItems",
  Picture: "Picture",
  Border: "Border",
  CommandName: "CommandName",
  UserVisible: "UserVisible",
  TableAdditionalSource: "TableAdditionalSource",
  StandardAttributeDescription: "StandardAttributeDescription",
  MetadataType: "MetadataType",
  MetadataTypeCollection: "MetadataTypeCollection",
  GroupChildItems: "GroupChildItems",
  CommandBarChildItems: "CommandBarChildItems",
  TableChildItems: "TableChildItems",
} as const

export type PropertyRuleType = keyof PropertyTypeRegistry

export type PropertyToMetadata<Key extends PropertyRuleType> = PropertyTypeRegistry[Key]["item"]
export type PropertyYoEnterprise<Key extends PropertyRuleType> = PropertyTypeRegistry[Key]["enterprise"]
export type PropertyToYAML<Key extends PropertyRuleType> = PropertyTypeRegistry[Key]["yaml"]

// export const TypesNames = PropertyType
