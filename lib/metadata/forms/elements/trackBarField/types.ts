import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"

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
  АвтоМаксимальнаяВысота?: boolean
  АвтоМаксимальнаяШирина?: boolean
  Высота?: number
  РастягиватьПоГоризонтали?: boolean
  БольшойШаг?: number
  ОтображениеРазметки?: SE.TrackBarMarkingAppearanceEnterprise
  ШагРазметки?: number
  МаксимальнаяВысота?: number
  МаксимальноеЗначение?: number
  МаксимальнаяШирина?: number
  МинимальноеЗначение?: number
  Ориентация?: SE.FormItemOrientationEnterprise
  Шаг?: number
  ПользовательскаяВидимость?: UserVisibleEnterprise
  РастягиватьПоВертикали?: boolean
  Ширина?: number
  События?: {
    ПриИзменении?: string
  }
}
