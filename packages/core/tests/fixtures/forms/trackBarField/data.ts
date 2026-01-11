import { TrackBarField, TrackBarFieldEnterprise } from "~/metadata/forms/elements/trackBarField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullTrackBarField: TrackBarField = {
  ...fullFormField,
  elementType: FormElementType.TrackBarField,
  name: "ПолеПолосыПрокрутки",
  title: {
    items: { ru: "Поле полосы прокрутки" },
  },
  editMode: "EnterOnInput",
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
  warningOnEdit: {
    items: { ru: "Предупреждение" },
  },
  warningOnEditRepresentation: "DontShow",
  width: 200,
}

export const fullTrackBarFieldEnterprise: TrackBarFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле полосы прокрутки",
  РежимРедактирования: "ВходПриВводе",
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
  ПредупреждениеПриРедактировании: "Предупреждение",
  ОтображениеПредупрежденияПриРедактировании: "НеОтображать",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Истина",
  Шаг: 1,
  ШагРазметки: 5,
  Ширина: 200,
}

export const minimalTrackBarField: TrackBarField = {
  elementType: FormElementType.TrackBarField,
  name: "ПолеПолосыПрокрутки",
}

export const minimalTrackBarFieldEnterprise: TrackBarFieldEnterprise = {}
