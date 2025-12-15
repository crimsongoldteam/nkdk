import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  MetadataCommandGroup,
  MetadataCommandGroupEnterprise,
  MetadataCommandGroupXML,
} from "~/lib/metadata/commonObjects/metadataCommandGroup/types"
import { Picture, PictureEnterprise, PictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/lib/metadata/commonObjects/typeDescription/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface MetadataCommand {
  commandParameterType?: TypeDescription
  comment?: string
  group?: MetadataCommandGroup
  modifiesData?: boolean
  name?: string
  objectBelonging?: SE.ObjectBelonging
  parameterUsageMode?: SE.CommandParameterUseMode
  picture?: Picture
  representation?: SE.ButtonRepresentation
  shortcut?: string
  synonym?: I8nText
  tooltip?: I8nText
}

export interface MetadataCommandXML {
  CommandParameterType?: TypeDescriptionXML
  Comment?: string
  Group?: MetadataCommandGroupXML
  ModifiesData?: boolean
  Name?: string
  ObjectBelonging?: SE.ObjectBelonging
  ParameterUsageMode?: SE.CommandParameterUseMode
  Picture?: PictureXML
  Representation?: SE.ButtonRepresentation
  Shortcut?: string
  Synonym?: I8nTextXML
  Tooltip?: I8nTextXML
}

export interface MetadataCommandEnterprise {
  ТипПараметраКоманды?: TypeDescriptionEnterprise
  Комментарий?: string
  Группа?: MetadataCommandGroupEnterprise
  ИзменяетДанные?: StringboolEnterprise
  Имя?: string
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  РежимИспользованияПараметра?: SE.CommandParameterUseModeEnterprise
  Картинка?: PictureEnterprise
  Отображение?: SE.ButtonRepresentationEnterprise
  СочетаниеКлавиш?: string
  Синоним?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
}

export type MetadataCommands = MetadataCommand[]
export type MetadataCommandsXML = MetadataCommandXML[]
export type MetadataCommandsEnterprise = MetadataCommandEnterprise[]
