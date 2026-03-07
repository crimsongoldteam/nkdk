import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { PictureXML, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { TypeDescriptionXML, TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataItemLinkYAML } from "../../commonObjects/metadataRef/types"
import { MetadataCommandRules } from "./rules"

export type MetadataCommand = MetadataTypeByRule<typeof MetadataCommandRules>

export interface MetadataCommandXML {
  _uuid: string
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

export type MetadataCommandGroupYAML = SE.StandardCommandsGroupYAML | MetadataItemLinkYAML

export interface MetadataCommandFullYAML {
  Группа?: MetadataCommandGroupYAML
  ИзменяетДанные?: StringboolYAML
  Картинка?: PictureYAML
  Комментарий?: string
  Отображение?: SE.ButtonRepresentationYAML
  Подсказка?: I8nTextYAML
  ПринадлежностьОбъекта?: SE.ObjectBelongingYAML
  РежимИспользованияПараметра?: SE.CommandParameterUseModeYAML
  Синоним?: I8nTextYAML
  СочетаниеКлавиш?: string
  ТипПараметраКоманды?: TypeDescriptionYAML
  ПоведениеПриНедоступностиОсновногоСервера?: SE.OnMainServerUnavalableBehaviorYAML
}

export type MetadataCommandYAML = MetadataCommandFullYAML | MetadataCommandGroupYAML

export type MetadataCommands = MetadataCommand[]

export type MetadataCommandsXML = MetadataCommandXML | MetadataCommandXML[]

export type MetadataCommandsYAML = Record<string, MetadataCommandYAML>
