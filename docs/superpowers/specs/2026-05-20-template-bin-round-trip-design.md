# Template.bin round-trip design

## Проблема

При полном XML -> YAML -> XML часть файлов отображается в `git diff` как удалённая. Один доказанный пример:

`CommonTemplates/UsnPartnersMergedScheme_v1_1_0/Ext/Template.bin`

Файл существует в XML-выгрузке, а его корневой объект имеет `<TemplateType>BinaryData</TemplateType>`. Сейчас `Template.bin` не представлен в YAML-слое и не добавляется в `XmlSyncManifest` при обратном `sync`. После успешной записи объектов `pruneXmlByManifest` удаляет все файлы в поддерживаемых XML-каталогах, которых нет в manifest, поэтому бинарный макет исчезает.

## Цель

Поддержать `Template.bin` как непрозрачный внешний файл макета, чтобы XML -> YAML -> XML сохранял бинарные макеты и добавлял их в `XmlSyncManifest`.

## Границы

- Не менять XML-фикстуры-источники.
- Не разбирать содержимое `Template.bin`.
- Не менять YAML-формат свойств макета.
- Не отключать общий `pruneXmlByManifest`.
- Не решать все остальные классы удалённых файлов в этой задаче.

## Архитектура

Поддержка должна жить рядом с существующей синхронизацией макетов:

- `packages/core/metadata/commonObjects/module/fromXML.ts` и `toXML.ts` уже обслуживают тип `Template` для статических путей, в том числе `MetadataCommonTemplateRules`.
- `packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts` и `syncExternalToXML.ts` обслуживают объектные коллекции `Templates/<Имя>/Ext/...`.

Добавляем копирование `Template.bin` в тех же местах, где сейчас копируются `Template.xml` и `Template.txt`. Файл остаётся байтовым: используется `copyFile`, без чтения как UTF-8 и без XML-парсинга.

## Поток данных

Для общего макета:

1. XML -> YAML копирует `CommonTemplates/<Имя>/Ext/Template.bin` в YAML-каталог объекта как внешний файл.
2. YAML -> XML копирует этот файл обратно в `CommonTemplates/<Имя>/Ext/Template.bin`.
3. После копирования путь добавляется в `XmlSyncManifest`.
4. `pruneXmlByManifest` сохраняет файл.

Для макета внутри прикладного объекта:

1. XML -> YAML копирует `Templates/<Макет>/Ext/Template.bin` в каталог YAML-макета.
2. YAML -> XML копирует файл обратно в `Templates/<Макет>/Ext/Template.bin`.
3. Путь добавляется в `XmlSyncManifest`.

## Ошибки

Если `Template.bin` отсутствует, поведение остаётся прежним: копирование пропускается. Если файл есть, но копирование падает из-за файловой ошибки, ошибка должна всплыть как ошибка `sync`, как и для других внешних файлов.

## Тесты

Добавить точечные тесты:

- для `childTemplateNames`: XML -> YAML и YAML -> XML сохраняют `Ext/Template.bin`;
- для `Template` общего макета: внешний `Template.bin` копируется туда и обратно, а при YAML -> XML попадает в manifest косвенно через отсутствие удаления или прямую проверку ожидаемого файла.

Проверка полного `round-trip-yaml` остаётся диагностической и не входит в минимальный тест этой задачи.
