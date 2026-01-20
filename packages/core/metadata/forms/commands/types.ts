import { I8nText, I8nTextEnterprise, I8nTextXML } from "../../commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "../../commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "../../commonObjects/userVisible/types"
import { ButtonRepresentation, CurrentRowUse, CurrentRowUseEnterprise } from "../../systemEnumerations/types"

export interface Command {
  name: string
  title?: I8nText
  toolTip?: I8nText
  use?: UserVisible
  shortcut?: string
  picture?: Picture
  action?: string
  representation?: ButtonRepresentation
  currentRowUse?: CurrentRowUse
  modifiesSavedData?: boolean
}

export type Commands = Command[]

export interface CommandXML {
  _name: string
  _id: string
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  Use?: UserVisibleXML
  Shortcut?: string
  Picture?: PictureXML
  Action?: string
  Representation?: ButtonRepresentation
  ModifiesSavedData?: boolean
  CurrentRowUse?: CurrentRowUse
}

export type CommandsXML = CommandXML | CommandXML[]

export interface CommandEnterprise {
  Заголовок?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
  СочетаниеКлавиш?: string
  Картинка?: PictureEnterprise
  Действие?: string
  ОтображениеКнопки?: ButtonRepresentation
  ИспользованиеТекущейСтроки?: CurrentRowUseEnterprise
  ИзменяемыеДанные?: boolean
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
}

export type CommandsEnterprise = Record<string, CommandEnterprise>
