import { tags } from "typia"
import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/metadata/commonObjects/typeDescription/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataItemLink, MetadataItemLinkEnterprise } from "../../commonObjects/metadataRef/types"

export interface MetadataCommand {
  commandParameterType?: TypeDescription
  comment?: string
  group: SE.StandardCommandsGroup | MetadataItemLink
  modifiesData?: boolean
  name: string
  objectBelonging?: SE.ObjectBelonging
  parameterUseMode?: SE.CommandParameterUseMode
  picture?: Picture
  representation?: SE.ButtonRepresentation
  shortcut?: string
  synonym: I8nText
  toolTip?: I8nText
  onMainServerUnavalableBehavior?: SE.OnMainServerUnavalableBehavior
}

export interface MetadataCommandXML {
  _uuid: string & tags.Format<"uuid">
  Properties: {
    CommandParameterType?: TypeDescriptionXML
    Comment?: string
    Group: SE.StandardCommandsGroup | string
    ModifiesData?: boolean
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    ParameterUseMode?: SE.CommandParameterUseMode
    Picture?: PictureXML
    Representation?: SE.ButtonRepresentation
    Shortcut?: string
    Synonym?: I8nTextXML
    ToolTip?: I8nTextXML
    OnMainServerUnavalableBehavior?: SE.OnMainServerUnavalableBehavior
  }
}

export type MetadataCommandGroupEnterprise = SE.StandardCommandsGroupEnterprise | MetadataItemLinkEnterprise

export interface MetadataCommandFullEnterprise {
  Группа?: MetadataCommandGroupEnterprise
  ИзменяетДанные?: StringboolEnterprise
  Картинка?: PictureEnterprise
  Комментарий?: string
  Отображение?: SE.ButtonRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  РежимИспользованияПараметра?: SE.CommandParameterUseModeEnterprise
  Синоним?: I8nTextEnterprise
  СочетаниеКлавиш?: string
  ТипПараметраКоманды?: TypeDescriptionEnterprise
  ПоведениеПриНедоступностиОсновногоСервера?: SE.OnMainServerUnavalableBehaviorEnterprise
}

export type MetadataCommandEnterprise = MetadataCommandFullEnterprise | MetadataCommandGroupEnterprise

export type MetadataCommands = MetadataCommand[]

export type MetadataCommandsXML = MetadataCommandXML | MetadataCommandXML[]

export type MetadataCommandsEnterprise = Record<string, MetadataCommandEnterprise>
