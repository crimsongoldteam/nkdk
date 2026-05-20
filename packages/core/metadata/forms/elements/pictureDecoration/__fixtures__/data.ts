import {
  PictureDecoration,
  PictureDecorationEnterprise,
  PictureDecorationPartialYAML,
} from "~/metadata/forms/elements/pictureDecoration/types"

import { StructureResult } from "~/tests/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormDecorationCommonFixture,
  fullFormDecorationEnterpriseCommonFixture,
  fullFormDecorationPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formDecoration/__fixtures__/data"

export const fullPictureDecoration: Omit<
  RequiredFieldsElement<PictureDecoration>,
  "border" | "borderColor" | "picture" | "pictureSize"
> = {
  itemType: "PictureDecoration",
  name: "ДекорацияКартинка",
  title: {
    formatted: true,
    items: { ru: "<b>Заголовок</>" },
  },
  ...fullFormDecorationCommonFixture,
  enableDrag: true,
  enableStartDrag: true,
  fileDragMode: "AsFile",
  hyperlink: true,
  nonselectedPictureText: { items: { ru: "Текст невыбранной картинки" } },
  scale: 90,
  zoomable: true,
  events: {
    click: "ДекорацияКартинкаНажатие",
    dragStart: "ДекорацияКартинкаНачалоПеретаскивания",
    dragEnd: "ДекорацияКартинкаОкончаниеПеретаскивания",
    drag: "ДекорацияКартинкаПеретаскивание",
    dragCheck: "ДекорацияКартинкаПроверкаПеретаскивания",
  },
}

export const fullPictureDecorationEnterprise = {
  ElementType: "FormDecoration",
  Name: "prefix_ДекорацияКартинка",
  Type: { Type: "SystemEnumeration", Value: "FormDecorationType.Picture" },
  ...fullFormDecorationEnterpriseCommonFixture,
  EnableDrag: true,
  EnableStartDrag: true,
  FileDragMode: {
    Type: "SystemEnumeration",
    Value: "FileDragMode.AsFile",
  },
  Hyperlink: true,
  NonselectedPictureText: "Текст невыбранной картинки",
  Scale: 90,
  Zoomable: true,
  Title: "<b>Заголовок</>",
} satisfies Omit<Required<PictureDecorationEnterprise>, "Border" | "BorderColor" | "Picture" | "PictureSize">

export const fullPictureDecorationPartialYAML: Required<
  Omit<
    PictureDecorationPartialYAML,
    "Заголовок" | "ФорматированныйЗаголовок" | "ЗапретитьИспользование" | "Картинка" | "Рамка" | "ЦветРамки" | "РазмерКартинки"
  >
> = {
  ...fullFormDecorationPartialYAMLCommonFixture,
  Гиперссылка: "Истина",
  Масштаб: 90,
  Масштабировать: "Истина",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  ТекстНевыбраннойКартинки: "Текст невыбранной картинки",
  СпособПеретаскиванияФайлов: "КакФайл",
  КонтекстноеМеню: { Автозаполнение: "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "РасширеннаяПодсказка" },
  События: {
    Нажатие: "ДекорацияКартинкаНажатие",
    НачалоПеретаскивания: "ДекорацияКартинкаНачалоПеретаскивания",
    ОкончаниеПеретаскивания: "ДекорацияКартинкаОкончаниеПеретаскивания",
    Перетаскивание: "ДекорацияКартинкаПеретаскивание",
    ПроверкаПеретаскивания: "ДекорацияКартинкаПроверкаПеретаскивания",
  },
}

export const minimalPictureDecoration: PictureDecoration = {
  itemType: "PictureDecoration",
  name: "ДекорацияКартинки",
}

export const minimalPictureDecorationPartialYAML: PictureDecorationPartialYAML = {}

export const sourcePictureDecoration: PictureDecoration = {
  name: "ДекорацияКартинка",
  itemType: "PictureDecoration",
  title: { items: { ru: "<b>Заголовок</>" }, formatted: true },
}

export interface PictureDecorationStructureFixture {
  name: string
  element: PictureDecoration
  structured: StructureResult
  skipImport?: boolean
}

export const pictureDecorationStructureFixturesTable: PictureDecorationStructureFixture[] = [
  // {
  //   name: "with title",
  //   element: {
  //     name: "ИмяПоля",
  //     itemType: "PictureDecoration",
  //     picture: { type: "StandardPicture", ref: "Print", loadTransparent: true },
  //     title: { items: { ru: "Заголовок декорации картинки" }, formatted: false },
  //   },

  //   structured: {
  //     strings: ['![Печать] "Заголовок декорации картинки" ИмяПоля'],
  //     haveSimpleHorizontalGroup: false,
  //   },
  // },
  {
    name: "without title",
    element: {
      name: "ИмяПоля",
      picture: { type: "StandardPicture", ref: "Print", loadTransparent: true },
      itemType: "PictureDecoration",
    },
    structured: {
      strings: ["![Печать] ИмяПоля"],
      toOneLineGroup: true,
    },
  },
  {
    name: "with common picture",
    element: {
      name: "ИмяПоля",
      picture: { type: "CommonPicture", ref: "Предупреждение32", loadTransparent: false },
      itemType: "PictureDecoration",
    },
    structured: {
      strings: ["![Предупреждение32] ИмяПоля"],
      toOneLineGroup: true,
    },
  },
  {
    name: "without picture",
    element: {
      name: "ИмяПоля",
      itemType: "PictureDecoration",
    },
    structured: {
      strings: ["!ИмяПоля"],
      toOneLineGroup: true,
    },
  },
  {
    name: "with absolute picture",
    element: {
      name: "ИмяПоля",
      itemType: "PictureDecoration",
      picture: {
        type: "AbsolutePicture",
        ref: "Picture.png",
        loadTransparent: true,
      },
    },
    structured: {
      strings: ["!ИмяПоля"],
      toOneLineGroup: true,
    },
    skipImport: true,
  },
]
