import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataSimpleValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { ButtonRepresentation, CurrentRowUse, CurrentRowUseEnterprise } from "~/metadata/systemEnumerations/types"

export interface FormCommand {
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
  table?: string
}

export type FormCommands = FormCommand[]

export interface FormCommandXML {
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
  AssociatedTableElementId?: MetadataSimpleValueXML
}

export type FormCommandsXML = FormCommandXML | FormCommandXML[]

export interface FormCommandYAML {
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
  Таблица?: string
}

export type FormCommandsYAML = Record<string, FormCommandYAML>
