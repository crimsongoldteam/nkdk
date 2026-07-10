import { StringboolYAML } from "../../../commonObjects/boolean/types"
import { FieldsListYAML } from "../../../commonObjects/fieldsList/types"
import { FunctionalOptionsYAML } from "../../../commonObjects/functionalOptionsProperty/types"
import { I8nTextYAML } from "../../../commonObjects/i8nText/types"
import { TypeDescriptionXML, TypeDescriptionYAML } from "../../../commonObjects/typeDescription/types"
import { UserEditKeysYAML, UserVisibleYAML, UserViewKeysYAML } from "../../../commonObjects/userVisible/types"
import { ChartXML, ChartYAML } from "../chart/types"
import { DynamicListXML, DynamicListYAML } from "../dynamicList/types"
import { FlowchartContextXML, FlowchartContextYAML } from "../flowchartContext/types"
import { GanttChartXML, GanttChartYAML } from "../ganttChart/types"
import { PlannerXML, PlannerYAML } from "../planner/types"
import { SpreadsheetDocumentXML, SpreadsheetDocumentYAML } from "../spreadsheetDocument/types"
import { ElementXML } from "../../../orchestration"
import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { FillCheckingYAML } from "../../../systemEnumerations/types"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"

export type FormAttribute = FormTypeByRule<typeof FormAttributeRules>

export type FormAttributeColumn = FormTypeByRule<typeof FormAttributeColumnRules>

export interface FormAttributeAdditionalColumns {
  table: string
  columns: FormAttributeColumn[]
}

export type FormAttributeColumns = FormAttributeColumn[]

export type FormAttributeAdditionalColumnsCollection = FormAttributeAdditionalColumns[]

export type FormAttributeAdditionalColumn = FormAttributeAdditionalColumns

export type FormAttributeWithAdditionalColumns = FormAttribute & {
  additionalColumns?: FormAttributeAdditionalColumns[]
}

interface SettingsTypeDescriptionXML extends TypeDescriptionXML {
  "_xsi:type": "v8:TypeDescription"
}

export interface FormAttributeColumnXML extends ElementXML {}

export interface FormAttributeAdditionalColumnXML {
  _table: string
  Column?: FormAttributeColumnXML[]
}

export interface FormAttributeColumnsXML {
  Column?: FormAttributeColumnXML | FormAttributeColumnXML[]
  AdditionalColumns?: FormAttributeAdditionalColumnXML | FormAttributeAdditionalColumnXML[]
}

export interface FormAttributeXML extends ElementXML {
  Columns?: FormAttributeColumnsXML
  Settings?:
    | SettingsTypeDescriptionXML
    | DynamicListXML
    | ChartXML
    | GanttChartXML
    | FlowchartContextXML
    | SpreadsheetDocumentXML
    | PlannerXML
}

export interface ConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface FormAttributeColumnYAML {
  Заголовок?: I8nTextYAML
  Тип?: TypeDescriptionYAML
  ПроверкаЗаполнения?: FillCheckingYAML
  [UserViewKeysYAML.Value]?: UserVisibleYAML
  [UserEditKeysYAML.Value]?: UserVisibleYAML
  Колонки?: Record<string, FormAttributeColumnYAML>
  ФункциональныеОпции?: FunctionalOptionsYAML
}

export interface FormAttributeAdditionalColumnYAML {
  [tableName: string]: Record<string, FormAttributeColumnYAML>
}

export type FormAttributeColumnsYAML = Record<string, FormAttributeColumnYAML>

export interface FormAttributeYAML {
  Заголовок?: I8nTextYAML
  Тип?: TypeDescriptionYAML
  ТипЗначения?: TypeDescriptionYAML
  ОсновнойРеквизит?: StringboolYAML
  СохраняемыеДанные?: StringboolYAML
  ДинамическийСписок?: DynamicListYAML
  Диаграмма?: ChartYAML
  ДиаграммаГанта?: GanttChartYAML
  ГрафическаяСхема?: FlowchartContextYAML
  ТабличныйДокумент?: SpreadsheetDocumentYAML
  Планировщик?: PlannerYAML
  [UserViewKeysYAML.Value]?: UserVisibleYAML
  [UserEditKeysYAML.Value]?: UserVisibleYAML
  Колонки?: FormAttributeColumnsYAML
  ДополнительныеКолонки?: FormAttributeAdditionalColumnYAML
  ФункциональныеОпции?: FunctionalOptionsYAML
  ИспользоватьВсегда?: FieldsListYAML
  ПроверкаЗаполнения?: FillCheckingYAML
  Сохранение?: FieldsListYAML
}

export type FormAttributes = FormAttribute[]

export type FormAttributesXML = (FormAttributeXML | ConditionalAppearanceXML)[]

export type FormAttributesYAML = Record<string, FormAttributeYAML>
