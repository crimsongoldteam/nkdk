import { MetadataEnterpriseName } from "~/metadata/commonObjects/metadataName/types"
import { CommandBar, CommandBarEnterprise, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"

export interface AutoCommandBar extends CommandBar {}

export interface AutoCommandBarXML extends CommandBarXML {}

export interface AutoCommandBarEnterprise extends CommandBarEnterprise {
  Имя: MetadataEnterpriseName
}
