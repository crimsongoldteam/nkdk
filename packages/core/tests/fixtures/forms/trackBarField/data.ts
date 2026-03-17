import {
  TrackBarField,
  TrackBarFieldEnterprise,
  TrackBarFieldPartialYAML,
} from "~/metadata/forms/elements/trackBarField/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
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
  largeStep: 0,
  markingStep: 0,
  maxValue: 0,
  minValue: 0,
  orientation: "Vertical",
  step: 0,
  ...fullFormFieldCommonFixture,
} satisfies RequiredFieldsElement<TrackBarField>

export const fullTrackBarFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеПолосыПрокрутки",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.TrackBarField" },
  Title: "Поле полосы прокрутки",
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
  LargeStep: 0,
  MarkingStep: 0,
  MaxValue: 0,
  MinValue: 0,
  Step: 0,
  VerticalStretch: false,
} satisfies Required<TrackBarFieldEnterprise>

export const fullTrackBarFieldPartialYAML: TrackBarFieldPartialYAML = {
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Высота: 100,
  МаксимальнаяВысота: 200,
  МаксимальнаяШирина: 300,
  ОтображениеРазметки: "СверхуИлиСлева",
  Ширина: 200,
  ...fullFormFieldPartialYAMLCommonFixture,
  РастягиватьПоГоризонтали: "Ложь",
  РастягиватьПоВертикали: "Ложь",
  БольшойШаг: 0,
  ШагРазметки: 0,
  МаксимальноеЗначение: 0,
  МинимальноеЗначение: 0,
  Ориентация: "Вертикально",
  Шаг: 0,
} satisfies Omit<Required<TrackBarFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

// Удаляем Заголовок, так как exportFormFieldPropsToYAML не экспортирует его
delete (fullTrackBarFieldPartialYAML as any).Заголовок

export const minimalTrackBarField: TrackBarField = {
  itemType: "TrackBarField",
  name: "ПолеПолосыПрокрутки",
}

export const minimalTrackBarFieldPartialYAML: TrackBarFieldPartialYAML = {}
