import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  verticalStretch?: boolean
  width?: number
  userVisible?: UserVisible
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
  VerticalStretch?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface TrackBarFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  БольшойШаг?: number
  ОтображениеРазметки?: SE.TrackBarMarkingAppearanceEnterprise
  ШагРазметки?: number
  МаксимальнаяВысота?: number
  МаксимальноеЗначение?: number
  МаксимальнаяШирина?: number
  МинимальноеЗначение?: number
  Ориентация?: SE.FormItemOrientationEnterprise
  Шаг?: number
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  События?: {
    ПриИзменении?: string
  }
}
