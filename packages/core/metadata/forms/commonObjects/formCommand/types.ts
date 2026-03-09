import { I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataSimpleValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { PictureXML, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { UserVisibleXML, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { MetadataReferenceTypeByRule, MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { ButtonRepresentation, CurrentRowUse, CurrentRowUseYAML } from "~/metadata/systemEnumerations/types"
import { FormCommandRules } from "./rules"

export type FormCommand = MetadataTypeByRule<typeof FormCommandRules>

export type FormCommandReference = MetadataReferenceTypeByRule<typeof FormCommandRules>

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
  Заголовок?: I8nTextYAML
  Подсказка?: I8nTextYAML
  СочетаниеКлавиш?: string
  Картинка?: PictureYAML
  Действие?: string
  ОтображениеКнопки?: ButtonRepresentation
  ИспользованиеТекущейСтроки?: CurrentRowUseYAML
  ИзменяемыеДанные?: boolean
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  Таблица?: string
}

export type FormCommandsYAML = Record<string, FormCommandYAML>
