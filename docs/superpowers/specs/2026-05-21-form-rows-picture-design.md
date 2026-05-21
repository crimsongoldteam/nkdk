# Form Rows Picture Design

## Контекст

`round-trip-yaml` показывает потерю файлов:
`Forms/<Форма>/Ext/Form/Items/<Элемент>/RowsPicture.png`.

Формы уже поддерживают явные внешние файлы элементов через тип `ExternalFormItemFile`.
Сейчас в `ClientApplicationFormRules` есть правила для `Picture`, `HeaderPicture` и `ValuesPicture`.
Свойство таблицы `rowsPicture` уже описано как обычное свойство `Picture`, но соответствующий
внешний файл `RowsPicture.*` не включен в список файлов формы.

## Решение

Добавить явное правило формы:

```ts
itemRowsPictures: {
  type: "ExternalFormItemFile",
  xml: "RowsPicture",
  yaml: "КартинкиСтрок",
  syncExternalOnly: true,
}
```

Файл хранится в YAML-каталоге формы по имени элемента:
`Формы/<Форма>/КартинкиСтрок/<Элемент>.<ext>`.

При обратной синхронизации он восстанавливается в:
`Forms/<Форма>/Ext/Form/Items/<Элемент>/RowsPicture.<ext>`.

## Тестирование

Существующие тесты внешних картинок формы должны быть расширены файлом `RowsPicture.png`.
Проверки:

- fromXML копирует файл в `КартинкиСтрок`;
- toXML восстанавливает файл как `RowsPicture.png`;
- восстановленный файл добавляется в `XmlSyncManifest`.

## Вне Границ

Этот пункт не меняет разбор свойства `rowsPicture` как `Picture` и не добавляет общий механизм
для всех возможных картинок формы. Только `RowsPicture` включается в уже существующий явный
механизм `ExternalFormItemFile`.
