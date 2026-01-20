import { FormElementType } from "~/metadata/metadataFactory/types"
import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise, ButtonXML } from "../../elements/button/types"
import {
  ButtonGroup,
  ButtonGroupPartialEnterprise,
  ButtonGroupTypedEnterprise,
  ButtonGroupXML,
} from "../../elements/buttonGroup/types"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise, PopupXML } from "../../elements/popup/types"

export type CommandbarChildItem = Button | ButtonGroup | Popup
export type CommandBarChildItems = CommandbarChildItem[]

export type CommandBarChildItemXML = ButtonXML | ButtonGroupXML | PopupXML
export type CommandBarChildItemRecordXML = Record<FormElementType, CommandBarChildItemXML>
export type CommandBarChildItemsXML = CommandBarChildItemRecordXML | CommandBarChildItemRecordXML[]

export type CommandBarChildItemTypedEnterprise =
  | ButtonTypedEnterprise
  | ButtonGroupTypedEnterprise
  | PopupTypedEnterprise

export type CommandBarChildItemsTypedEnterprise = Record<string, CommandBarChildItemTypedEnterprise>

export type CommandBarChildItemPartialEnterprise =
  | ButtonPartialEnterprise
  | ButtonGroupPartialEnterprise
  | PopupPartialEnterprise

export type CommandBarChildItemsPartialEnterprise = Record<string, CommandBarChildItemPartialEnterprise>
