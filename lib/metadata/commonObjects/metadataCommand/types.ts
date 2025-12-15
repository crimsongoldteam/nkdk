import { Picture, PictureEnterprise, PictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/lib/metadata/commonObjects/typeDescription/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface MetadataCommand {
  commandModule?: Неопределено
  commandParameterType?: TypeDescription
  comment?: string
  extendedConfigurationObject?: УникальныйИдентификатор
  group?: ГруппаКоманд
  modifiesData?: boolean
  objectBelonging?: SE.ObjectBelonging
  parameterUsageMode?: SE.CommandParameterUseMode
  picture?: Picture
  representation?: SE.ButtonRepresentation
  shortcut?: string
  synonym?: string
  tooltip?: string
}

export interface MetadataCommandXML {
  CommandModule?: НеопределеноXML
  CommandParameterType?: TypeDescriptionXML
  Comment?: string
  ExtendedConfigurationObject?: УникальныйИдентификаторXML
  Group?: ГруппаКомандXML
  ModifiesData?: boolean
  ObjectBelonging?: SE.ObjectBelonging
  ParameterUsageMode?: SE.CommandParameterUseMode
  Picture?: PictureXML
  Representation?: SE.ButtonRepresentation
  Shortcut?: string
  Synonym?: string
  Tooltip?: string
}

export interface MetadataCommandEnterprise {
  МодульКоманды?: НеопределеноEnterprise
  ТипПараметраКоманды?: TypeDescriptionEnterprise
  Комментарий?: string
  ОбъектРасширяемойКонфигурации?: УникальныйИдентификаторEnterprise
  Группа?: ГруппаКомандEnterprise
  ИзменяетДанные?: boolean
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  РежимИспользованияПараметра?: SE.CommandParameterUseModeEnterprise
  Картинка?: PictureEnterprise
  Отображение?: SE.ButtonRepresentationEnterprise
  СочетаниеКлавиш?: string
  Синоним?: string
  Подсказка?: string
}

export type MetadataCommands = MetadataCommand[]
export type MetadataCommandsXML = MetadataCommandXML[]
export type MetadataCommandsEnterprise = MetadataCommandEnterprise[]
