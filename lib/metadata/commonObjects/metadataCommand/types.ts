import { Color, ColorXML, ColorEnterprise } from "~/lib/metadata/commonObjects/color/types";
import { I8nText, I8nTextXML, I8nTextEnterprise } from "~/lib/metadata/commonObjects/i8nText/types";
import { Picture, PictureXML, PictureEnterprise } from "~/lib/metadata/commonObjects/pictures/types";
import { UserVisible, UserVisibleXML, UserVisibleEnterprise } from "~/lib/metadata/commonObjects/userVisible/types";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { FormGroup, FormGroupXML, FormGroupEnterprise } from "../formGroup/types";
import { Table, TableXML, TableEnterprise } from "../table/types";
import { CommandBar, CommandBarXML, CommandBarEnterprise } from "../commandBar/types";
import { BaseElement, BaseElementXML, BaseElementEnterprise } from "../baseElement/types";
import { Font, FontXML, FontEnterprise } from "~/lib/metadata/commonObjects/font/types";
import { TypeDescription, TypeDescriptionXML, TypeDescriptionEnterprise } from "~/lib/metadata/commonObjects/typeDescription/types";
import { Border, BorderXML, BorderEnterprise } from "~/lib/metadata/commonObjects/border/types";
import { FormField, FormFieldXML, FormFieldEnterprise } from "../formField/types";
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"
import { ChoiceList, ChoiceListXML, ChoiceListEnterprise } from "~/lib/metadata/commonObjects/choiceList/types"
import { FormItemAddition, FormItemAdditionXML, FormItemAdditionEnterprise } from "../formItemAddition/types"
import { TypeLink, TypeLinkXML, TypeLinkEnterprise } from "~/lib/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinksEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import { SearchStringAddition, SearchStringAdditionXML, SearchStringAdditionEnterprise } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { ViewStatusAddition, ViewStatusAdditionXML, ViewStatusAdditionEnterprise } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { SearchControlAddition, SearchControlAdditionXML, SearchControlAdditionEnterprise } from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { CommandSet, CommandSetXML, CommandSetEnterprise } from "~/lib/metadata/forms/commandSet/types"
import { EventsXML } from "~/lib/metadata/forms/events/types";
import { ChildItems, ChildItemsXML } from "../childItems/types";
import { MetadataAttributes, MetadataAttributesEnterprise, MetadataAttributesXML } from "~/lib/metadata/commonObjects/metadataAttribute/types"
import { StandardAttributeDescriptions, StandardAttributeDescriptionsXML, StandardAttributeDescriptionsEnterprise } from "~/lib/metadata/commonObjects/standardAttributeDescription/types";
import { MetadataValue, MetadataValueXML, MetadataValueEnterprise } from "~/lib/metadata/commonObjects/metadataValue/types";
import { MetadataTabularSections, MetadataTabularSectionsXML, MetadataTabularSectionsEnterprise } from "~/lib/metadata/commonObjects/metadataTabularSection/types";
import { FieldList, FieldListXML, FieldListEnterprise } from "~/lib/metadata/commonObjects/field/types"
import { PredefinedList, PredefinedListXML, PredefinedListEnterprise } from "~/lib/metadata/commonObjects/predifined/types"
import { CommandList, CommandListXML, CommandListEnterprise } from "~/lib/metadata/commonObjects/command/types"
import { MetadataItemLinks, MetadataItemLinksEnterprise,MetadataItemLinksXML } from "~/lib/metadata/commonObjects/metadataItemLink/types"
import { IndexFields, IndexFieldsXML, IndexFieldsEnterprise } from "~/lib/metadata/commonObjects/indexField/types"
import { MetadataFields, MetadataFieldsXML, MetadataFieldsEnterprise } from "~/lib/metadata/commonObjects/metadataField/types";
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinkXML } from "~/lib/metadata/commonObjects/metadataItemLink/types"
import { AdditionalIndexes, AdditionalIndexesXML, AdditionalIndexesEnterprise } from "~/lib/metadata/commonObjects/additionalIndex/types";
import { CharacteristicsDescriptions, CharacteristicsDescriptionsXML, CharacteristicsDescriptionsEnterprise } from "~/lib/metadata/commonObjects/characteristicsDescription/types";


export interface MetadataCommand  {

  commandModule?: Неопределено,
  commandParameterType?: TypeDescription,
  comment?: string,
  extendedConfigurationObject?: УникальныйИдентификатор,
  group?: ГруппаКоманд,
  modifiesData?: boolean,
  objectBelonging?: SE.ObjectBelonging,
  parameterUsageMode?: SE.CommandParameterUseMode,
  picture?: Picture,
  representation?: SE.ButtonRepresentation,
  shortcut?: string,
  synonym?: string,
  tooltip?: string,
}

export interface MetadataCommandXML  {
  
  CommandModule?: НеопределеноXML,
  CommandParameterType?: TypeDescriptionXML,
  Comment?: string,
  ExtendedConfigurationObject?: УникальныйИдентификаторXML,
  Group?: ГруппаКомандXML,
  ModifiesData?: boolean,
  ObjectBelonging?: SE.ObjectBelonging,
  ParameterUsageMode?: SE.CommandParameterUseMode,
  Picture?: PictureXML,
  Representation?: SE.ButtonRepresentation,
  Shortcut?: string,
  Synonym?: string,
  Tooltip?: string,
}

export interface MetadataCommandEnterprise  {
  МодульКоманды?: НеопределеноEnterprise,
  ТипПараметраКоманды?: TypeDescriptionEnterprise,
  Комментарий?: string,
  ОбъектРасширяемойКонфигурации?: УникальныйИдентификаторEnterprise,
  Группа?: ГруппаКомандEnterprise,
  ИзменяетДанные?: boolean,
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise,
  РежимИспользованияПараметра?: SE.CommandParameterUseModeEnterprise,
  Картинка?: PictureEnterprise,
  Отображение?: SE.ButtonRepresentationEnterprise,
  СочетаниеКлавиш?: string,
  Синоним?: string,
  Подсказка?: string,
}

export type MetadataCommands = MetadataCommand[]
    export type MetadataCommandsXML = MetadataCommandXML[]
    export type MetadataCommandsEnterprise = MetadataCommandEnterprise[]