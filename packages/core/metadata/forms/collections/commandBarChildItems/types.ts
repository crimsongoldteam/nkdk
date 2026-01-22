import { FormElementType } from "~/metadata/metadataFactory/types"
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
export type CommandBarGroupChildItemXML = ButtonXML | ButtonGroupXML | PopupXML

export type CommandBarChildItem = CommandBarGroupChildItem | SearchStringAddition | SearchControlAddition
export type CommandBarChildItems = CommandBarChildItem[]

export type CommandBarChildItemXML = CommandBarGroupChildItemXML | SearchStringAdditionXML | SearchControlAdditionXML
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
  | SearchControlAdditionEnterprise
  | SearchStringAdditionEnterprise

export type CommandBarChildItemsPartialEnterprise = Record<string, CommandBarChildItemPartialEnterprise>
