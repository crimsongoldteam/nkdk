import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface TrackBarField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  height?: number
  horizontalStretch?: boolean
  largeStep?: number
  markingAppearance?: SE.TrackBarMarkingAppearance
  markingStep?: number
  maxHeight?: number
  maxValue?: number
  maxWidth?: number
  minValue?: number
  orientation?: SE.FormItemOrientation
  step?: number
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  events?: {
    onChange?: string
  }
}

export interface TrackBarFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  Height?: number
  HorizontalStretch?: boolean
  LargeStep?: number
  MarkingAppearance?: SE.TrackBarMarkingAppearance
  MarkingStep?: number
  MaxHeight?: number
  MaxValue?: number
  MaxWidth?: number
  MinValue?: number
  Orientation?: SE.FormItemOrientation
  Step?: number
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface TrackBarFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  БольшойШаг?: number
  Высота?: number
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  МаксимальноеЗначение?: number
  МинимальноеЗначение?: number
  Ориентация?: SE.FormItemOrientationEnterprise
  ОтображениеРазметки?: SE.TrackBarMarkingAppearanceEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Шаг?: number
  ШагРазметки?: number
  Ширина?: number
  События?: {
    ПриИзменении?: string
  }
}
