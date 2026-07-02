import { StringboolYAML, StringboolXML } from "../boolean/types"
import { MetadataItemLink } from "../metadataRef/types"
import { MetadataItem } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { HomePageWorkAreaRules } from "./rules"

export type HomePageWorkAreaTemplate = "OneColumn" | "TwoColumnsEqualWidth" | "TwoColumnsVariableWidth" | string

export type HomePageWorkAreaCommandInterfaceDisplay = "Top" | "Bottom" | "None" | string

export interface HomePageWorkAreaVisibility {
  common?: boolean
  roles?: Record<MetadataItemLink, boolean>
}

export interface HomePageWorkAreaColumnItem {
  form?: string
  height?: number
  visibility?: HomePageWorkAreaVisibility
}

export type HomePageWorkAreaColumnItems = HomePageWorkAreaColumnItem[]

export interface HomePageWorkAreaVisibilityXML {
  "xr:Common"?: StringboolXML
  "xr:Value"?: HomePageWorkAreaRoleVisibilityXML | HomePageWorkAreaRoleVisibilityXML[]
}

export interface HomePageWorkAreaRoleVisibilityXML {
  _name?: string
  name?: string
  "#text"?: StringboolXML
}

export interface HomePageWorkAreaColumnItemXML {
  Form?: string
  Height?: string | number
  Visibility?: HomePageWorkAreaVisibilityXML
}

export interface HomePageWorkAreaColumnXML {
  Item?: HomePageWorkAreaColumnItemXML | HomePageWorkAreaColumnItemXML[]
}

export interface HomePageWorkAreaVisibilityYAML {
  Общее?: StringboolYAML
  Роли?: Record<string, StringboolYAML>
}

export interface HomePageWorkAreaColumnItemYAML {
  Форма?: string
  Высота?: number
  Видимость?: HomePageWorkAreaVisibilityYAML
}

export type HomePageWorkAreaColumnItemsYAML = HomePageWorkAreaColumnItemYAML[]

export type HomePageWorkArea = MetadataTypeByRule<typeof HomePageWorkAreaRules> & MetadataItem
export type HomePageWorkAreaYAML = YAMLTypeByRule<typeof HomePageWorkAreaRules>
