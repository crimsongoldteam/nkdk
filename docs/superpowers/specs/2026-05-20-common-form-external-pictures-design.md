# Декларативные внешние файлы форм и ManualQuery

## Контекст

`round-trip-yaml --triage --batch-size 5 --start-index 6` и `--start-index 11` показали два близких класса расхождений в общих формах:

- при XML -> YAML -> XML `ManualQuery` у динамических списков меняется с `true` на `false`;
- удаляются бинарные картинки элементов общей формы `CommonForms/ВыборВидаДеятельности`.

Примеры diff:

- `Ext/Form/Items/КлассификаторКонтекстноеМенюДобавитьВИзбранное/Picture.png`
- `Ext/Form/Items/КлассификаторКонтекстноеМенюИсключитьИзИзбранного/Picture.png`
- `Ext/Form/Items/МоиВидыИзбранное/HeaderPicture.png`
- `Ext/Form/Items/МоиВидыКонтекстноеМенюИсключитьИзИзбранного/Picture.png`
- `Ext/Form/Items/ЭлементыКатегорийИзбранное/HeaderPicture.png`

Обычные формы уже имеют механизм копирования внешних картинок элементов через `ClientApplicationForm`, но список файлов зашит в коде, а путь общей формы отличается: форма лежит в `ОбщаяФорма/<Имя>` и XML находится в `CommonForms/<Имя>/Ext/Form.xml`.

Для `ManualQuery` проблема проявилась в `CommonForms/АдреснаяКнига/Ext/Form.xml` и `CommonForms/ВводНачальныхОстатковДляВеденияРаздельногоУчетаНДС/Ext/Form.xml`: XML содержит `ManualQuery=true` вместе с `QueryText`, а после цикла флаг становится `false`.

`Font ref="0"` из той же пачки diff откладывается до проверки семантики в 1С и вынесен в `todo.md`.

## Корневая Причина

Расхождение с картинками складывается из двух проблем.

Первая: `packages/core/metadata/forms/clientApplicationForm/externalItemFiles.ts` содержит жёсткий список внешних файлов элементов формы. В нём есть `Picture` и `ValuesPicture`, но нет `HeaderPicture`, поэтому файлы `HeaderPicture.png` не могут пройти полный цикл даже для уже поддержанного пути.

Вторая: прямое свойство `MetadataCommonFormRules.form` типа `ClientApplicationForm` обрабатывается как `filePath`-свойство оркестратора. Для `ClientApplicationForm` зарегистрированы `importFromXML`, `exportToXML`, `importFromYAML` и `exportToYAML`, но нет `syncExternalFromXML` / `syncExternalToXML`. Поэтому внешний sync картинок элементов формы вызывается только из `ChildFormNames`, а общая форма, где форма встроена в `Свойства.yaml`, не получает копирование файлов из `Ext/Form/Items`.

Следствие: YAML содержит ссылки внутри формы, например `Картинка: Picture.png` или `КартинкаШапки: HeaderPicture.png`, но соответствующий бинарный файл отсутствует в YAML-каталоге. При обратном sync файл не добавляется в `XmlSyncManifest`, и cleanup удаляет исходный PNG из XML.

Расхождение с `ManualQuery` вызвано тем, что свойство `customQuery` сейчас связано с внешним файлом `queryText` через `derivedFrom.externalFile`. Такая связь делает `ManualQuery` производным от наличия `.query`. В прямых общих формах внешний `.query` не записывается рядом с `Свойства.yaml`, поэтому при обратном импорте нет признака, из которого можно восстановить `ManualQuery=true`.

Даже когда `.query` есть, сама связь ошибочна: `ManualQuery` и `QueryText` в XML не являются одним и тем же фактом. Реальные XML встречаются с `ManualQuery=false` и присутствующим `QueryText`, поэтому флаг должен сохраняться независимо от текста запроса.

## Цель

Сделать обработку внешних файлов элементов форм декларативной через обычные property rules, чтобы один механизм работал для:

- обычных форм прикладных объектов через `ChildFormNames`;
- общей формы через прямое свойство `MetadataCommonFormRules.form` типа `ClientApplicationForm`.

Сделать `ManualQuery` самостоятельным свойством модели/YAML: `.query` хранит только `QueryText` и не влияет на значение `ПроизвольныйЗапрос`.

## Не Цель

- Не чинить в этой спеке `Font ref="0"` и другие классы round-trip diff.
- Не менять формат YAML-значений картинок внутри `Форма.yaml` / `Свойства.yaml`.
- Не добавлять частный код, который знает только про `MetadataCommonForm`.

## Дизайн Внешних Файлов Форм

Внешние файлы элементов формы описываются в `ClientApplicationFormRules` обычными свойствами, а не отдельным массивом настроек.

Пример формы правила:

```ts
itemPictures: {
  type: "ExternalFormItemFile",
  xml: "Picture",
  yaml: "Картинки",
  syncExternalOnly: true,
},
itemHeaderPictures: {
  type: "ExternalFormItemFile",
  xml: "HeaderPicture",
  yaml: "КартинкиШапки",
  syncExternalOnly: true,
},
itemValuesPictures: {
  type: "ExternalFormItemFile",
  xml: "ValuesPicture",
  yaml: "КартинкиЗначений",
  syncExternalOnly: true,
},
```

Эти свойства не попадают в модель `ClientApplicationForm` и не меняют YAML формы. `syncExternalOnly` означает, что свойство участвует только во внешней синхронизации.

Тип `ExternalFormItemFile` получает правило свойства и фактические каталоги формы. Он использует:

- `rule.xml` как имя файла в XML: `Picture`, `HeaderPicture`, `ValuesPicture`;
- `rule.yaml` как YAML-каталог: `Картинки`, `КартинкиШапки`, `КартинкиЗначений`.

Текущий жёсткий список в `externalItemFiles.ts` заменяется проходом по property rules формы, у которых `syncExternalOnly: true` и тип `ExternalFormItemFile`.

`ChildFormNamesPropertyRule` больше не должен передавать отдельный список файлов. Он вызывает sync формы, а sync формы сам читает `ClientApplicationFormRules`.

`MetadataCommonFormRules.form` остаётся обычным прямым свойством:

- `type: "ClientApplicationForm"`
- `filePath: "Ext/Form.xml"`

Внешние обработчики прямого `ClientApplicationForm` используют `rule.filePath`, чтобы вычислить каталог XML-формы. Для `Ext/Form.xml` внешние файлы лежат в `Ext/Form/Items`.

Исполняющий код работает только с rules и каталогами, которые уже вычислены оркестратором. Он не должен проверять тип родительского объекта и не должен иметь отдельной ветки для `CommonForms`.

Для прямых свойств `ClientApplicationForm` нужно зарегистрировать внешние sync-обработчики:

- `syncExternalFromXML` копирует файлы по `ExternalFormItemFile` из XML-каталога формы в YAML-каталог объекта;
- `syncExternalToXML` восстанавливает файлы по тем же правилам и добавляет их в `XmlSyncManifest`.

## Дизайн ManualQuery

`DynamicListRules.customQuery` перестаёт быть производным от `queryText`.

Нужно удалить связь:

```ts
derivedFrom: { externalFile: "queryText" }
```

`queryText` продолжает храниться во внешнем `.query`-файле и отвечает только за XML-тег `QueryText`.

`customQuery` отвечает только за XML-тег `ManualQuery` и YAML-ключ `ПроизвольныйЗапрос`. Наличие или отсутствие `.query` не должно менять значение `customQuery` ни при XML -> YAML, ни при YAML -> XML.

Правило экспорта YAML должно сохранять явный `ManualQuery=true`, даже если рядом есть `QueryText`. Для редкого случая `ManualQuery=false + QueryText` YAML также должен сохранять `ПроизвольныйЗапрос: Ложь`, чтобы обратный sync не сделал `true` из наличия текста запроса.

## Поток Данных

XML -> YAML:

1. Оркестратор читает форму по правилу свойства.
2. Для `ChildFormNames` фактические каталоги формы приходят из `syncChildFormNamesFromXML`.
3. Для прямого свойства `ClientApplicationForm` фактический XML-каталог формы вычисляется из `rule.filePath`, а YAML-каталогом является каталог текущего объекта.
4. Код `ClientApplicationForm` получает фактический XML-каталог формы и YAML-каталог формы.
5. По правилам `ExternalFormItemFile` сканируется `Ext/Form/Items/<Элемент>/<rule.xml>.*`.
6. Найденные файлы копируются в `<YAML-каталог>/<rule.yaml>/<Элемент>.<ext>`.

YAML -> XML:

1. Код `ClientApplicationForm` получает те же property rules.
2. Для `ChildFormNames` пишет в `Forms/<ИмяФормы>/Ext/Form/Items`.
3. Для прямого свойства `ClientApplicationForm` пишет рядом с `rule.filePath`, например в `Ext/Form/Items`.
4. Сканирует `<YAML-каталог>/<rule.yaml>/*.*`.
5. Восстанавливает файлы в `Ext/Form/Items/<Элемент>/<rule.xml>.<ext>`.
6. Добавляет восстановленные файлы в `XmlSyncManifest`, чтобы cleanup их не удалил.

YAML-текст остаётся прежним: значения вроде `Картинка: Picture.png` и `КартинкаШапки: HeaderPicture.png` не разворачиваются в содержимое файла.

`ManualQuery`:

1. XML -> модель читает `ManualQuery` в `customQuery`.
2. Модель -> YAML пишет `ПроизвольныйЗапрос`, если `customQuery` явно присутствует в модели и рядом есть `queryText`.
3. YAML -> модель читает `ПроизвольныйЗапрос` напрямую.
4. Модель -> XML пишет `ManualQuery` из `customQuery` или из XML-default, не обращаясь к наличию `.query`.
5. `.query` читается и пишется только как хранилище `QueryText`.

## Ошибки И Ограничения

Если каталог внешних картинок отсутствует, обработка ничего не делает.

Если имя файла не даёт корректное имя элемента или целевой путь выходит за корень `Ext/Form/Items`, файл пропускается. Это сохраняет текущую защиту от некорректных путей.

Если расширение отсутствует, файл пропускается: XML-формат внешних картинок требует реальный файл с расширением.

Если YAML не содержит `ПроизвольныйЗапрос`, используется обычный default rules для `ManualQuery`. Наличие `.query` не должно менять этот default.

## Тесты

Добавить тесты для rule-driven поведения:

- `ClientApplicationForm`: XML -> YAML копирует `Picture`, `HeaderPicture`, `ValuesPicture` по настройке из rule.
- `ClientApplicationForm`: YAML -> XML восстанавливает эти файлы и добавляет их в `XmlSyncManifest`.
- `ChildFormNames`: обычная форма прикладного объекта продолжает сохранять внешние картинки элементов через декларативную настройку.
- `MetadataCommonForm`: общая форма сохраняет внешние картинки элементов из `CommonForms/<Имя>/Ext/Form/Items`.
- `DynamicList`: XML/YAML/XML сохраняет `ManualQuery=true` при наличии `QueryText`.
- `DynamicList`: XML/YAML/XML сохраняет `ManualQuery=false` при наличии `QueryText`.
- sync-тест общей формы покрывает `ManualQuery=true + QueryText` в прямом `MetadataCommonForm`.

После реализации запустить точечные sync-тесты форм и общей формы, затем:

- `round-trip-yaml --triage --batch-size 5 --start-index 6`, чтобы проверить `ManualQuery` и не трогать отложенный `Font ref="0"`;
- `round-trip-yaml --triage --batch-size 5 --start-index 11`, чтобы проверить исчезновение пяти удалений PNG.
