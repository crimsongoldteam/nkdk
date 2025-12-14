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


export interface MetadataAttribute  {

  binaryDataStorageLocationUse?: ИспользованиеХраненияВХранилищеДвоичныхДанных,
  binaryDataStorageLocationUseField?: boolean,
  choiceFoldersAndItems?: SE.FoldersAndItemsUse,
  choiceForm?: string,
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput,
  choiceParameterLinks?: ChoiceParameterLinks,
  choiceParameters?: ChoiceParameterLinks,
  comment?: string,
  createOnInput?: SE.CreateOnInput,
  dataHistory?: SE.DataHistoryUse,
  editFormat?: I8nText,
  extendedConfigurationObject?: УникальныйИдентификатор,
  extendedEdit?: boolean,
  fillChecking?: SE.FillChecking,
  fillFromFillingValue?: boolean,
  fillingValue?: Неопределено,
  format?: I8nText,
  fullTextSearch?: SE.UseFullTextSearch,
  indexing?: SE.Indexing,
  linkByType?: TypeLink,
  markNegatives?: boolean,
  mask?: string,
  maxValue?: number,
  minValue?: number,
  multiLine?: boolean,
  objectBelonging?: SE.ObjectBelonging,
  passwordMode?: boolean,
  quickChoice?: SE.UseQuickChoice,
  synonym?: string,
  tooltip?: string,
  type?: TypeDescription,
  use?: SE.AttributeUse,
  userVisible?: UserVisible,
}

export interface MetadataAttributeXML  {
  
  BinaryDataStorageLocationUse?: ИспользованиеХраненияВХранилищеДвоичныхДанныхXML,
  BinaryDataStorageLocationUseField?: boolean,
  ChoiceFoldersAndItems?: SE.FoldersAndItemsUse,
  ChoiceForm?: string,
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput,
  ChoiceParameterLinks?: ChoiceParameterLinksXML,
  ChoiceParameters?: ChoiceParameterLinksXML,
  Comment?: string,
  CreateOnInput?: SE.CreateOnInput,
  DataHistory?: SE.DataHistoryUse,
  EditFormat?: I8nTextXML,
  ExtendedConfigurationObject?: УникальныйИдентификаторXML,
  ExtendedEdit?: boolean,
  FillChecking?: SE.FillChecking,
  FillFromFillingValue?: boolean,
  FillingValue?: НеопределеноXML,
  Format?: I8nTextXML,
  FullTextSearch?: SE.UseFullTextSearch,
  Indexing?: SE.Indexing,
  LinkByType?: TypeLinkXML,
  MarkNegatives?: boolean,
  Mask?: string,
  MaxValue?: number,
  MinValue?: number,
  MultiLine?: boolean,
  ObjectBelonging?: SE.ObjectBelonging,
  PasswordMode?: boolean,
  QuickChoice?: SE.UseQuickChoice,
  Synonym?: string,
  Tooltip?: string,
  Type?: TypeDescriptionXML,
  Use?: SE.AttributeUse,
  UserVisible?: UserVisibleXML,
}

export interface MetadataAttributeEnterprise  {
  ИспользованиеХраненияВХранилищеДвоичныхДанных?: ИспользованиеХраненияВХранилищеДвоичныхДанныхEnterprise,
  ПолеИспользованияХраненияВХранилищеДвоичныхДанных?: boolean,
  ВыборГруппИЭлементов?: SE.FoldersAndItemsUseEnterprise,
  ФормаВыбора?: string,
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise,
  СвязиПараметровВыбора?: ChoiceParameterLinksEnterprise,
  ПараметрыВыбора?: ChoiceParameterLinksEnterprise,
  Комментарий?: string,
  СозданиеПриВводе?: SE.CreateOnInputEnterprise,
  ИсторияДанных?: SE.DataHistoryUseEnterprise,
  ФорматРедактирования?: I8nTextEnterprise,
  ОбъектРасширяемойКонфигурации?: УникальныйИдентификаторEnterprise,
  РасширенноеРедактирование?: boolean,
  ПроверкаЗаполнения?: SE.FillCheckingEnterprise,
  ЗаполнятьИзДанныхЗаполнения?: boolean,
  ЗначениеЗаполнения?: НеопределеноEnterprise,
  Формат?: I8nTextEnterprise,
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise,
  Индексирование?: SE.IndexingEnterprise,
  СвязьПоТипу?: TypeLinkEnterprise,
  ВыделятьОтрицательные?: boolean,
  Маска?: string,
  МаксимальноеЗначение?: number,
  МинимальноеЗначение?: number,
  МногострочныйРежим?: boolean,
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise,
  РежимПароля?: boolean,
  БыстрыйВыбор?: SE.UseQuickChoiceEnterprise,
  Синоним?: string,
  Подсказка?: string,
  Тип?: TypeDescriptionEnterprise,
  Использование?: SE.AttributeUseEnterprise,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
}