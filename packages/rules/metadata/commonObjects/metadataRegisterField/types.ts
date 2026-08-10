import { StringboolXML, StringboolYAML } from "../boolean/types"
import { I8nTextXML, I8nTextYAML } from "../i8nText/types"
import { MetadataPrimitiveValueXML, MetadataValueXML, MetadataValueYAML } from "../metadataValue/types"
import { TypeDescriptionXML, TypeDescriptionYAML } from "../typeDescription/types"
import { TypeLinkXML, TypeLinkYAML } from "../typeLink/types"
import { ChoiceParameterLinksXML, ChoiceParameterLinksYAML } from "../сhoiceParameterLinks/types"
import { ChoiceParametersXML, ChoiceParametersYAML } from "../сhoiceParameters/types"
import * as SE from "../../systemEnumerations/types"

type MinMaxValueXML = MetadataPrimitiveValueXML<"string"> | { "_xsi:nil": true }

export interface MetadataRegisterFieldXML {
  _uuid?: string
  Properties: {
    BinaryDataStorageLocationUse?: SE.BinaryDataStorageLocationUse
    BinaryDataStorageLocationUseField?: string
    ChoiceFoldersAndItems?: SE.FoldersAndItemsUse
    ChoiceForm?: string
    ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
    ChoiceParameterLinks?: ChoiceParameterLinksXML
    ChoiceParameters?: ChoiceParametersXML
    Comment?: string
    CreateOnInput?: SE.CreateOnInput
    DataHistory?: SE.DataHistoryUse
    EditFormat?: I8nTextXML
    ExtendedEdit?: StringboolXML
    ExtendedConfigurationObject?: string
    FillChecking?: SE.FillChecking
    FillFromFillingValue?: StringboolXML
    FillValue?: MetadataValueXML
    Format?: I8nTextXML
    FullTextSearch?: SE.UseFullTextSearch
    Indexing?: SE.Indexing
    LinkByType?: TypeLinkXML
    MarkNegatives?: StringboolXML
    Mask?: string
    MaxValue?: MinMaxValueXML
    MinValue?: MinMaxValueXML
    MultiLine?: StringboolXML
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    PasswordMode?: StringboolXML
    QuickChoice?: SE.UseQuickChoice
    Synonym?: I8nTextXML
    ToolTip?: I8nTextXML
    Type: TypeDescriptionXML
  }
}

export interface MetadataRegisterFieldFullYAML {
  Тип: TypeDescriptionYAML
  БыстрыйВыбор?: SE.UseQuickChoiceYAML
  ВыборГруппИЭлементов?: SE.FoldersAndItemsUseYAML
  ВыделятьОтрицательные?: StringboolYAML
  ЗаполнятьИзДанныхЗаполнения?: StringboolYAML
  ЗначениеЗаполнения?: MetadataValueYAML
  Имя?: string
  Индексирование?: SE.IndexingYAML
  ИспользованиеХраненияВХранилищеДвоичныхДанных?: SE.BinaryDataStorageLocationUseYAML
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputYAML
  ИсторияДанных?: SE.DataHistoryUseYAML
  Комментарий?: string
  МаксимальноеЗначение?: number
  Маска?: string
  МинимальноеЗначение?: number
  МногострочныйРежим?: StringboolYAML
  ПараметрыВыбора?: ChoiceParametersYAML
  Подсказка?: I8nTextYAML
  ПолеИспользованияХраненияВХранилищеДвоичныхДанных?: string
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchYAML
  ПроверкаЗаполнения?: SE.FillCheckingYAML
  РасширенноеРедактирование?: StringboolYAML
  РежимПароля?: StringboolYAML
  СвязиПараметровВыбора?: ChoiceParameterLinksYAML
  СвязьПоТипу?: TypeLinkYAML
  Синоним?: I8nTextYAML
  СозданиеПриВводе?: SE.CreateOnInputYAML
  ФормаВыбора?: string
  Формат?: I8nTextYAML
  ФорматРедактирования?: I8nTextYAML
}

export type MetadataRegisterFieldYAML = MetadataRegisterFieldFullYAML
