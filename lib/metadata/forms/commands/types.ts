import { I8nText, I8nTextEnterprise, I8nTextXML } from "../../commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "../../commonObjects/pictures/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "../../commonObjects/userVisible/types"
import { TButtonRepresentation, TCurrentRowUse, TCurrentRowUseEnterprise } from "../../systemEnumerations/types"

export interface CommandXML {
  _name: string
  _id: string
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  Use?: UserVisibleXML
  Shortcut?: string
  Picture?: PictureXML
  Action?: string
  Representation?: TButtonRepresentation
  ModifiesSavedData?: boolean
  CurrentRowUse?: TCurrentRowUse
}

export interface Command {
  name: string
  id: string
  title?: I8nText
  toolTip?: I8nText
  use?: UserVisible
  shortcut?: string
  picture?: Picture
  action?: string
  representation?: TButtonRepresentation
  currentRowUse?: TCurrentRowUse
  modifiesSavedData?: boolean
}

export interface CommandEnterpriseItem {
  Заголовок?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
  СочетаниеКлавиш?: string
  Картинка?: PictureEnterprise
  Действие?: string
  ОтображениеКнопки?: TButtonRepresentation
  ИспользованиеТекущейСтроки?: TCurrentRowUseEnterprise
  ИзменяемыеДанные?: boolean
}

export type CommandEnterprise = Record<string, CommandEnterpriseItem | UserVisibleEnterprise>
