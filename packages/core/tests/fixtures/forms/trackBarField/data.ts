import {
  TrackBarField,
  TrackBarFieldEnterprise,
  TrackBarFieldPartialYAML,
} from "~/metadata/forms/elements/trackBarField/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullTrackBarField: RequiredFieldsElement<TrackBarField> = {
  itemType: "TrackBarField",
  name: "ПолеПолосыПрокрутки",
  title: {
    items: { ru: "Поле полосы прокрутки" },
  },
  events: {
    onChange: "ПроцедураПриИзменении",
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  height: 100,
  horizontalStretch: true,
  largeStep: 10,
  markingAppearance: "TopLeft",
  markingStep: 5,
  maxHeight: 200,
  maxValue: 100,
  maxWidth: 300,
  minValue: 0,
  orientation: "Horizontal",
  step: 1,
  verticalStretch: false,
  width: 200,
  ...fullFormFieldCommonFixture,
  ...fullFormFieldTableRelatedFixture,
} satisfies RequiredFieldsElement<TrackBarField>

export const fullTrackBarFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеПолосыПрокрутки",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.TrackBarField" },
  Title: "Поле полосы прокрутки",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  Height: 100,
  HorizontalStretch: true,
  LargeStep: 10,
  MarkingAppearance: {
    Type: "SystemEnumeration",
    Value: "TrackBarMarkingAppearance.TopLeft",
  },
  MarkingStep: 5,
  MaxHeight: 200,
  MaxValue: 100,
  MaxWidth: 300,
  MinValue: 0,
  Orientation: {
    Type: "SystemEnumeration",
    Value: "FormItemOrientation.Horizontal",
  },
  Step: 1,
  VerticalStretch: false,
  Width: 200,
  ...fullFormFieldEnterpriseCommonFixture,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<TrackBarFieldEnterprise>

export const fullTrackBarFieldPartialYAML: TrackBarFieldPartialYAML = {
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  БольшойШаг: 10,
  Высота: 100,
  МаксимальнаяВысота: 200,
  МаксимальнаяШирина: 300,
  МаксимальноеЗначение: 100,
  МинимальноеЗначение: 0,
  Ориентация: "Горизонтально",
  ОтображениеРазметки: "СверхуИлиСлева",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Истина",
  Шаг: 1,
  ШагРазметки: 5,
  Ширина: 200,
  ...fullFormFieldPartialYAMLCommonFixture,
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
} satisfies Omit<Required<TrackBarFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

// Удаляем Заголовок, так как exportFormFieldPropsToYAML не экспортирует его
delete (fullTrackBarFieldPartialYAML as any).Заголовок

export const minimalTrackBarField: TrackBarField = {
  itemType: "TrackBarField",
  name: "ПолеПолосыПрокрутки",
}

export const minimalTrackBarFieldPartialYAML: TrackBarFieldPartialYAML = {}
