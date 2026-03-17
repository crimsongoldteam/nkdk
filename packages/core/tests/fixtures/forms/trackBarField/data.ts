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
  name: "ПолеПолосыПрокрутки",
  title: {
    items: { ru: "Поле полосы прокрутки" },
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
    Value: "FormItemOrientation.Horizontal",
  },
  Width: 200,
  ...fullFormFieldEnterpriseCommonFixture,
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
} satisfies Omit<
  Required<TrackBarFieldPartialYAML>,
  "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование"
>

// Удаляем Заголовок, так как exportFormFieldPropsToYAML не экспортирует его
delete (fullTrackBarFieldPartialYAML as any).Заголовок

export const minimalTrackBarField: TrackBarField = {
  itemType: "TrackBarField",
  name: "ПолеПолосыПрокрутки",
}

export const minimalTrackBarFieldPartialYAML: TrackBarFieldPartialYAML = {}
