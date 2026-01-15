// import {
//   FormDecoration,
//   FormDecorationPartialEnterprise,
//   FormDecorationTypedEnterprise,
// } from "~/metadata/forms/elements/formDecoration/types"
// import { FormElementType } from "~/metadata/metadataFactory/types"

// export const fullFormDecoration: FormDecoration = {
//   elementType: FormElementType.FormDecoration,
//   name: "КакаяТоДекорацияФормы",
//   title: {
//     items: { ru: "Оформление формы" },
//   },
//   autoMaxHeight: true,
//   autoMaxWidth: true,
//   displayImportance: "High",
//   enabled: true,
//   font: { kind: "StyleItem", ref: "NormalTextFont" },
//   height: 200,
//   horizontalAlignInGroup: "Left",
//   horizontalStretch: true,
//   maxHeight: 500,
//   maxWidth: 400,
//   shortcut: "Ctrl+S",
//   skipOnInput: false,
//   textColor: { type: "WebColor", value: "Blue" },
//   toolTip: {
//     items: { ru: "Подсказка" },
//   },
//   toolTipRepresentation: "None",
//   type: "Label",
//   userVisible: {
//     common: true,
//     values: [{ name: "Администратор", value: true }],
//   },
//   verticalAlignInGroup: "Top",
//   verticalStretch: true,
//   visible: true,
//   width: 300,
// }

// const fullFormDecorationPartialEnterprise: FormDecorationPartialEnterprise = {
//   АвтоМаксимальнаяВысота: "Истина",
//   АвтоМаксимальнаяШирина: "Истина",
//   ВажностьПриОтображении: "Высокая",
//   ВертикальноеПоложениеВГруппе: "Верх",
//   Вид: "Надпись",
//   Видимость: "Истина",
//   Высота: 200,
//   ГоризонтальноеПоложениеВГруппе: "Лево",
//   Доступность: "Истина",
//   МаксимальнаяВысота: 500,
//   МаксимальнаяШирина: 400,
//   ОтображениеПодсказки: "Нет",
//   Подсказка: "Подсказка",
//   РазрешитьИспользование: { Администратор: "Истина" },
//   ПропускатьПриВводе: "Ложь",
//   РастягиватьПоВертикали: "Истина",
//   РастягиватьПоГоризонтали: "Истина",
//   СочетаниеКлавиш: "Ctrl+S",
//   ЦветТекста: "Синий",
//   Ширина: 300,
//   Шрифт: "ОбычныйШрифтТекста",
// }

// export const fullFormDecorationTypedEnterprise: FormDecorationTypedEnterprise = {
//   ...fullFormDecorationPartialEnterprise,
//   Тип: "ДекорацияФормы",
//   Заголовок: "Оформление формы",
// }

// export const minimalFormDecoration: FormDecoration = {
//   elementType: FormElementType.FormDecoration,
//   name: "ОформлениеФормы",
// }

// export const minimalFormDecorationPartialEnterprise: FormDecorationPartialEnterprise = {}

// export const minimalFormDecorationTypedEnterprise: FormDecorationTypedEnterprise = {
//   Тип: "ДекорацияФормы",
// }
