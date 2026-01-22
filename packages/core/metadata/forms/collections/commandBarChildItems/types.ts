import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise, ButtonXML } from "../../elements/button/types"
import {
  ButtonGroup,
  ButtonGroupPartialEnterprise,
  ButtonGroupTypedEnterprise,
  ButtonGroupXML,
} from "../../elements/buttonGroup/types"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise, PopupXML } from "../../elements/popup/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SearchControlAdditionXML,
} from "../../elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SearchStringAdditionXML,
} from "../../elements/searchStringAddition/types"

export type CommandBarGroupChildItem = Button | ButtonGroup | Popup
export type CommandBarGroupChildItems = CommandBarGroupChildItem[]

export type CommandBarGroupChildItemXML = ButtonXML | ButtonGroupXML | PopupXML
export type CommandBarGroupChildItemRecordXML = Record<"Button" | "ButtonGroup" | "Popup", CommandBarGroupChildItemXML>
export type CommandBarGroupChildItemsXML = CommandBarGroupChildItemRecordXML | CommandBarGroupChildItemsXML[]

export type CommandBarGroupChildItemTypedEnterprise =
  | ButtonTypedEnterprise
  | ButtonGroupTypedEnterprise
  | PopupTypedEnterprise
export type CommandBarGroupChildItemsTypedEnterprise = Record<string, CommandBarGroupChildItemTypedEnterprise>

export type CommandBarChildItem = CommandBarGroupChildItem | SearchStringAddition | SearchControlAddition
export type CommandBarChildItems = CommandBarChildItem[]

export type CommandBarChildItemXML = CommandBarGroupChildItemXML | SearchStringAdditionXML | SearchControlAdditionXML
export type CommandBarChildItemRecordXML = Record<
  "Button" | "ButtonGroup" | "Popup" | "SearchStringAddition" | "SearchControlAddition",
  CommandBarChildItemXML
>
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
  | SearchControlAdditionEnterprise
  | SearchStringAdditionEnterprise

export type CommandBarChildItemsPartialEnterprise = Record<string, CommandBarChildItemPartialEnterprise>
