import {
  TrackBarField,
  TrackBarFieldEnterprise,
  TrackBarFieldPartialYAML,
} from "~/metadata/forms/elements/trackBarField/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/__fixtures__/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullTrackBarField: RequiredFieldsElement<TrackBarField> = {
  itemType: "TrackBarField",
  name: "ЭлементФормы",
  title: {
    items: { ru: "Заголовок элемента" },
  },
  events: {
    onChange: "ПроцедураПриИзменении",
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  height: 100,
  horizontalStretch: false,
  markingAppearance: "TopLeft",
  maxHeight: 200,
  maxWidth: 300,
  width: 200,
  verticalStretch: false,
  largeStep: 5,
  markingStep: 6,
  maxValue: 90,
  minValue: 10,
  orientation: "Vertical",
  step: 2,
  ...fullFormFieldCommonFixture,
} satisfies RequiredFieldsElement<TrackBarField>

export const fullTrackBarFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ЭлементФормы",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.TrackBarField" },
  Title: "Заголовок элемента",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  Height: 100,
  MarkingAppearance: {
    Type: "SystemEnumeration",
    Value: "TrackBarMarkingAppearance.TopLeft",
  },
  MaxHeight: 200,
  MaxWidth: 300,
  Orientation: {
    Type: "SystemEnumeration",
    Value: "FormItemOrientation.Vertical",
  },
  Width: 200,
  ...fullFormFieldEnterpriseCommonFixture,
  HorizontalStretch: false,
  LargeStep: 5,
  MarkingStep: 6,
  MaxValue: 90,
  MinValue: 10,
  Step: 2,
  VerticalStretch: false,
} satisfies Required<TrackBarFieldEnterprise>

export const fullTrackBarFieldPartialYAML: TrackBarFieldPartialYAML = {
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Высота: 100,
  Заголовок: "Заголовок элемента",
  МаксимальнаяВысота: 200,
  МаксимальнаяШирина: 300,
  ОтображениеРазметки: "СверхуИлиСлева",
  Ширина: 200,
  ...fullFormFieldPartialYAMLCommonFixture,
  РастягиватьПоГоризонтали: "Ложь",
  БольшойШаг: 5,
  ШагРазметки: 6,
  МаксимальноеЗначение: 90,
  МинимальноеЗначение: 10,
  Ориентация: "Вертикально",
  Шаг: 2,
} satisfies Omit<Required<TrackBarFieldPartialYAML>, "Использование">

export const minimalTrackBarField: TrackBarField = {
  itemType: "TrackBarField",
  name: "ПолеПолосыПрокрутки",
}

export const minimalTrackBarFieldPartialYAML: TrackBarFieldPartialYAML = {}
