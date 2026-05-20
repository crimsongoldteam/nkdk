# Декларативные внешние картинки элементов форм

## Контекст

`round-trip-yaml --triage --batch-size 5 --start-index 11` показал один класс расхождений: при XML -> YAML -> XML удаляются бинарные картинки элементов общей формы `CommonForms/ВыборВидаДеятельности`.

Примеры diff:

- `Ext/Form/Items/КлассификаторКонтекстноеМенюДобавитьВИзбранное/Picture.png`
- `Ext/Form/Items/КлассификаторКонтекстноеМенюИсключитьИзИзбранного/Picture.png`
- `Ext/Form/Items/МоиВидыИзбранное/HeaderPicture.png`
- `Ext/Form/Items/МоиВидыКонтекстноеМенюИсключитьИзИзбранного/Picture.png`
- `Ext/Form/Items/ЭлементыКатегорийИзбранное/HeaderPicture.png`

Обычные формы уже имеют механизм копирования внешних картинок элементов через `ClientApplicationForm`, но список файлов зашит в коде, а путь общей формы отличается: форма лежит в `ОбщаяФорма/<Имя>` и XML находится в `CommonForms/<Имя>/Ext/Form.xml`.

## Корневая Причина

Расхождение складывается из двух проблем.

Первая: `packages/core/metadata/forms/clientApplicationForm/externalItemFiles.ts` содержит жёсткий список внешних файлов элементов формы. В нём есть `Picture` и `ValuesPicture`, но нет `HeaderPicture`, поэтому файлы `HeaderPicture.png` не могут пройти полный цикл даже для уже поддержанного пути.

Вторая: прямое свойство `MetadataCommonFormRules.form` типа `ClientApplicationForm` обрабатывается как `filePath`-свойство оркестратора. Для `ClientApplicationForm` зарегистрированы `importFromXML`, `exportToXML`, `importFromYAML` и `exportToYAML`, но нет `syncExternalFromXML` / `syncExternalToXML`. Поэтому внешний sync картинок элементов формы вызывается только из `ChildFormNames`, а общая форма, где форма встроена в `Свойства.yaml`, не получает копирование файлов из `Ext/Form/Items`.

Следствие: YAML содержит ссылки внутри формы, например `Картинка: Picture.png` или `КартинкаШапки: HeaderPicture.png`, но соответствующий бинарный файл отсутствует в YAML-каталоге. При обратном sync файл не добавляется в `XmlSyncManifest`, и cleanup удаляет исходный PNG из XML.

## Цель

Сделать обработку внешних картинок элементов форм декларативной через `rules.ts`, чтобы один механизм работал для:

- обычных форм прикладных объектов через `ChildFormNames`;
- общей формы через прямое свойство `MetadataCommonFormRules.form` типа `ClientApplicationForm`.

## Не Цель

- Не чинить в этой спеке `ManualQuery`, `Font ref="0"` и другие классы round-trip diff.
- Не менять формат YAML-значений картинок внутри `Форма.yaml` / `Свойства.yaml`.
- Не добавлять частный код, который знает только про `MetadataCommonForm`.

## Дизайн

Добавить в правила свойств декларативную настройку внешних файлов элементов формы, например `externalItemFiles`.

Настройка описывает соответствие XML-имени файла и YAML-каталога:

- `xmlName: "Picture"` -> `nkdkDir: "Картинки"`
- `xmlName: "HeaderPicture"` -> `nkdkDir: "КартинкиШапки"`
- `xmlName: "ValuesPicture"` -> `nkdkDir: "КартинкиЗначений"`

`ChildFormNamesPropertyRule` получает эту настройку и передаёт её в `convertFormFromXML` / `syncFormToXML`. Текущий жёсткий список в `externalItemFiles.ts` заменяется чтением настройки из rule.

`MetadataCommonFormRules.form` получает такую же настройку на свойстве:

- `type: "ClientApplicationForm"`
- `filePath: "Ext/Form.xml"`
- `externalItemFiles: [...]`

Исполняющий код работает только с правилом и каталогами, которые уже вычислены оркестратором. Он не должен проверять тип родительского объекта и не должен иметь отдельной ветки для `CommonForms`.

Для прямых свойств `ClientApplicationForm` нужно зарегистрировать внешние sync-обработчики:

- `syncExternalFromXML` копирует файлы по `externalItemFiles` из XML-каталога формы в YAML-каталог объекта;
- `syncExternalToXML` восстанавливает файлы по той же настройке и добавляет их в `XmlSyncManifest`.

Эти обработчики должны использовать `rule.filePath` для вычисления XML-каталога формы. Для `MetadataCommonFormRules.form` путь `Ext/Form.xml` означает, что внешние файлы формы лежат рядом в `Ext/Form/Items`.

## Поток Данных

XML -> YAML:

1. Оркестратор читает форму по правилу свойства.
2. Для `ChildFormNames` фактические каталоги формы приходят из `syncChildFormNamesFromXML`.
3. Для прямого свойства `ClientApplicationForm` фактический XML-каталог формы вычисляется из `rule.filePath`, а YAML-каталогом является каталог текущего объекта.
4. Код `ClientApplicationForm` получает фактический XML-каталог формы и YAML-каталог формы.
5. По `externalItemFiles` сканируется `Ext/Form/Items/<Элемент>/<XmlName>.*`.
6. Найденные файлы копируются в `<YAML-каталог>/<nkdkDir>/<Элемент>.<ext>`.

YAML -> XML:

1. Код `ClientApplicationForm` получает те же настройки из rule.
2. Для `ChildFormNames` пишет в `Forms/<ИмяФормы>/Ext/Form/Items`.
3. Для прямого свойства `ClientApplicationForm` пишет рядом с `rule.filePath`, например в `Ext/Form/Items`.
4. Сканирует `<YAML-каталог>/<nkdkDir>/*.*`.
5. Восстанавливает файлы в `Ext/Form/Items/<Элемент>/<XmlName>.<ext>`.
6. Добавляет восстановленные файлы в `XmlSyncManifest`, чтобы cleanup их не удалил.

YAML-текст остаётся прежним: значения вроде `Картинка: Picture.png` и `КартинкаШапки: HeaderPicture.png` не разворачиваются в содержимое файла.

## Ошибки И Ограничения

Если каталог внешних картинок отсутствует, обработка ничего не делает.

Если имя файла не даёт корректное имя элемента или целевой путь выходит за корень `Ext/Form/Items`, файл пропускается. Это сохраняет текущую защиту от некорректных путей.

Если расширение отсутствует, файл пропускается: XML-формат внешних картинок требует реальный файл с расширением.

## Тесты

Добавить тесты для rule-driven поведения:

- `ClientApplicationForm`: XML -> YAML копирует `Picture`, `HeaderPicture`, `ValuesPicture` по настройке из rule.
- `ClientApplicationForm`: YAML -> XML восстанавливает эти файлы и добавляет их в `XmlSyncManifest`.
- `ChildFormNames`: обычная форма прикладного объекта продолжает сохранять внешние картинки элементов через декларативную настройку.
- `MetadataCommonForm`: общая форма сохраняет внешние картинки элементов из `CommonForms/<Имя>/Ext/Form/Items`.

После реализации запустить точечные sync-тесты форм и общей формы, затем `round-trip-yaml --triage --batch-size 5 --start-index 11`, чтобы проверить исчезновение пяти удалений PNG.
