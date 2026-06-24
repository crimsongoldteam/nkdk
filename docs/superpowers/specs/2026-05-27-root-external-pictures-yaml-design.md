# Root External Pictures YAML Design

## Цель

Сохранять корневые внешние картинки конфигурации при полном `XML -> YAML -> XML` round-trip.

Текущие расхождения:

- `Ext/MainSectionPicture.xml` удаляется;
- `Ext/MainSectionPicture/Picture.svg` удаляется;
- `Ext/Splash.xml` удаляется;
- `Ext/Splash/Picture.png` удаляется.

## Источники

- `model.xdtobackend_root.res`: у `ConfigurationProperties` есть внешние свойства `MainSectionPicture`, `Logo`, `Splash`.
- `ru-en-map`: `КартинкаОсновногоРаздела` -> `MainSectionPicture`.
- `ru-en-map`: `Заставка` -> `Splash`.
- `/Users/nikita/git/round-trip-source/acc/Ext/MainSectionPicture.xml`: описатель `ExtPicture` со ссылкой `Picture.svg`.
- `/Users/nikita/git/round-trip-source/acc/Ext/MainSectionPicture/Picture.svg`: файл картинки основного раздела.
- `/Users/nikita/git/round-trip-source/acc/Ext/Splash.xml`: описатель `ExtPicture` со ссылкой `Picture.png`.
- `/Users/nikita/git/round-trip-source/acc/Ext/Splash/Picture.png`: файл заставки.
- `/Users/nikita/git/clean_cf`: чистая конфигурация без `Ext/MainSectionPicture.xml`, `Ext/Splash.xml` и `Ext/Logo.xml`.
- Существующий тип `ExternalPicture`, используемый для `ОбщаяКартинка`.

## Принятые решения

Корневые картинки не разбираются в YAML-поля.
Используем существующую модель `ExternalPicture`: `Picture.xml` и файлы картинок копируются как внешние файлы.

YAML-проект получает папки рядом с `Конфигурация.yaml`:

```text
КартинкаОсновногоРаздела/
  Picture.xml
  Picture.svg

Заставка/
  Picture.xml
  Picture.png
```

Соответствие путей:

- `КартинкаОсновногоРаздела/Picture.xml` -> `Ext/MainSectionPicture.xml`;
- `КартинкаОсновногоРаздела/*` кроме `Picture.xml` -> `Ext/MainSectionPicture/*`;
- `Заставка/Picture.xml` -> `Ext/Splash.xml`;
- `Заставка/*` кроме `Picture.xml` -> `Ext/Splash/*`.

`Picture.xml` сохраняется непрозрачно.
Это оставляет без изменений `xr:Abs`, `xr:LoadTransparent`, XML-пространства имен, порядок узлов и BOM.
Файлы картинок копируются байт-в-байт.

`Logo` в этой работе не добавляется в YAML-договор, потому что текущая диагностическая пачка не содержит `Ext/Logo.xml`.
Если такой файл появится в фикстуре или реальной конфигурации, его нужно разобрать отдельным расхождением или расширить этот же типовой договор.

## Поведение по умолчанию

`КартинкаОсновногоРаздела` и `Заставка` являются необязательными внешними свойствами.
Если в XML-выгрузке нет соответствующего `Picture.xml`, YAML-папка не создается.
Если в YAML нет папки и нет reference-файла, экспорт не создает новый XML-файл.

Если YAML-папка отсутствует, но reference содержит соответствующие XML-файлы, экспорт сохраняет reference только в сценарии сохранения существующего XML без изменения этой части модели.
Если YAML-папка присутствует, XML строится из YAML-папки.

Если в YAML-папке есть `Picture.xml`, но нет файла картинки, указанного в `xr:Abs`, это считается ошибкой данных или отдельным расхождением, а не поводом создавать пустой файл.

## Архитектура

Добавить в `MetadataConfigurationRules` внешние свойства типа `ExternalPicture` для корневой конфигурации.
Для корневых картинок `ExternalPicture` должен уметь работать без имени metadataItem, потому что файлы лежат напрямую в корневом `Ext/`, а не в каталоге объекта.

Предпочтительный путь реализации:

- переиспользовать существующий `ExternalPicture`;
- расширить его так, чтобы `syncExternalToXML` корректно писал корневой `Picture.xml` без обязательного `name`;
- не вводить отдельный разборщик для `ExtPicture`.

Ожидаемые правила:

```ts
mainSectionPicture: {
  yaml: "КартинкаОсновногоРаздела",
  type: "ExternalPicture",
  nkdkDir: "КартинкаОсновногоРаздела",
  xmlPath: "Ext/MainSectionPicture.xml",
  payloadXmlDir: "Ext/MainSectionPicture",
}

splash: {
  yaml: "Заставка",
  type: "ExternalPicture",
  nkdkDir: "Заставка",
  xmlPath: "Ext/Splash.xml",
  payloadXmlDir: "Ext/Splash",
}
```

`syncExternalOnly` или аналогичный внешний sync-механизм должен исключать эти свойства из обычного YAML-вывода значений.
Наличие папки является YAML-представлением свойства.

## Проверка

План проверки для будущей реализации:

1. XML -> YAML для `/Users/nikita/git/round-trip-source/acc`: появляются папки `КартинкаОсновногоРаздела` и `Заставка`.
2. `КартинкаОсновногоРаздела/Picture.xml` совпадает с `Ext/MainSectionPicture.xml`, а `Picture.svg` копируется байт-в-байт.
3. `Заставка/Picture.xml` совпадает с `Ext/Splash.xml`, а `Picture.png` копируется байт-в-байт.
4. YAML -> XML с reference восстанавливает `Picture.xml` и файлы картинок в `Ext/`.
5. XML/YAML цикл для `/Users/nikita/git/clean_cf`: папки отсутствуют, новые XML-файлы не создаются.
6. Полный `round-trip-yaml --triage --batch-size 10 --start-index 6` больше не показывает удаления `Ext/MainSectionPicture.*` и `Ext/Splash.*`.
