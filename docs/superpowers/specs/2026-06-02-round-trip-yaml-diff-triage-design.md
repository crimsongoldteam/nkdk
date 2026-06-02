# Round-Trip YAML Diff Triage Design

## Цель

Зафиксировать текущие расхождения полного metadata round-trip
`XML -> модель -> YAML -> модель -> XML`, чтобы разбирать их последовательно
без повторного запуска полного round-trip на каждом шаге.

Документ является журналом triage, а не планом исправления. Для каждой группы
здесь фиксируются симптомы, примеры, уже связанные спеки и первый следующий
вопрос для анализа.

## Источник прогона

Дата анализа: 2026-06-01.

Команда:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --all-configs --batch-size 80
```

Настройки окружения:

- `NKDK_XML_REPO=/home/nikita/git/round-trip`;
- `NKDK_ROUND_TRIP_YAML_DIR=/home/nikita/git/temp-yaml`;
- рабочий каталог nkdk: `/home/nikita/git/nkdk`;
- активный набор конфигураций: каталоги внутри `/home/nikita/git/round-trip`.

Итог прогона:

- `DIFF_COUNT=481`;
- `acc`, `all`, `doc`, `erp`, `small`, `trade` были пройдены без ошибок import/sync;
- в `small` был пропущен известный допустимый diff ошибочных дублей кнопок:
  `DataProcessors/ДокументооборотСКонтролирующимиОрганами/Forms/МастерФормированияЗаявкиНаПодключениеУпрощенное/Ext/Form.xml`;
- вывод triage был слишком большим и в интерфейсе был обрезан, поэтому сырой
  список всех 481 файлов не сохранен в этом документе;
- новый round-trip для восстановления полного сырого списка намеренно не
  запускался.

## Проверенные факты из вывода

Первые видимые diff'ы:

1. `acc/Configuration.xml` - потеря содержимого
   `AllowedIncomingShareRequestTypes`.
2. `acc/Ext/ClientApplicationInterface.xml` - удаление файла.
3. `acc/Ext/CommandInterface.xml` - удаление файла.
4. `acc/Ext/ExternalConnectionModule.bsl` - удаление файла.
5. `acc/Ext/HomePageWorkArea.xml` - удаление файла.

Видимые diff'ы из `all` в конце первой пачки:

1. `all/Catalogs/СправочникПолный/Forms/ФормаГруппы.xml` - только смена
   переводов строк `CRLF -> LF`.
2. `all/Catalogs/СправочникПолный/Forms/ФормаГруппы/Ext/Form.xml` - только
   смена переводов строк `CRLF -> LF`.
3. `all/Catalogs/СправочникПолный/Forms/ФормаСписка.xml` - только смена
   переводов строк `CRLF -> LF`.

Текущий оставшийся git diff после завершения скрипта относится к последней
проверенной конфигурации `trade` и состоит из удалений:

- `trade/Ext/ClientApplicationInterface.xml`;
- `trade/Ext/CommandInterface.xml`;
- `trade/Ext/ExternalConnectionModule.bsl`;
- `trade/Ext/HomePageWorkArea.xml`;
- `trade/Ext/MainSectionCommandInterface.xml`;
- `trade/Ext/MainSectionPicture.xml`;
- `trade/Ext/MainSectionPicture/Picture.png`;
- `trade/Ext/ManagedApplicationModule.bsl`;
- `trade/Ext/MobileClientSignature.bin`;
- `trade/Ext/OrdinaryApplicationModule.bsl`;
- `trade/Ext/SessionModule.bsl`;
- `trade/Ext/Splash.xml`;
- `trade/Ext/Splash/Picture.png`;
- `trade/Ext/StandaloneConfigurationContent.bin`.

## Группа 1. Корневые Ext-файлы конфигурации удаляются

### Симптом

Файлы в `Ext/*` есть в исходном XML, но не представлены в YAML-договоре или не
восстанавливаются при `sync`. После полного цикла они исчезают из XML.

После дополнительного разбора для непрозрачных файлов и корневых картинок
выяснилось, что часть правил уже существует, но в коде они смотрят на
`ext/...` с маленькой буквы. Текущий XML-источник `trade` содержит `Ext/...` с
большой буквы. Поэтому `import` не создает YAML-файлы, а `sync` не может
восстановить исходные XML-файлы.

### Примеры

- `acc/Ext/ClientApplicationInterface.xml`;
- `acc/Ext/CommandInterface.xml`;
- `acc/Ext/ExternalConnectionModule.bsl`;
- `acc/Ext/HomePageWorkArea.xml`;
- `trade/Ext/MainSectionCommandInterface.xml`;
- `trade/Ext/MainSectionPicture.xml`;
- `trade/Ext/MainSectionPicture/Picture.png`;
- `trade/Ext/MobileClientSignature.bin`;
- `trade/Ext/Splash.xml`;
- `trade/Ext/Splash/Picture.png`;
- `trade/Ext/StandaloneConfigurationContent.bin`.

### Связанные спеки

Уже есть отдельные проектные решения для части файлов:

- `docs/superpowers/specs/2026-05-27-client-application-interface-yaml-design.md`;
- `docs/superpowers/specs/2026-05-27-command-interface-yaml-design.md`;
- `docs/superpowers/specs/2026-05-27-configuration-root-modules-yaml-design.md`;
- `docs/superpowers/specs/2026-05-27-home-page-work-area-yaml-design.md`;
- `docs/superpowers/specs/2026-05-27-root-external-pictures-yaml-design.md`;
- `docs/superpowers/specs/2026-05-27-mobile-client-signature-yaml-design.md`;
- `docs/superpowers/specs/2026-05-28-round-trip-yaml-16-diffs-design.md`.

Спека `docs/superpowers/specs/2026-05-31-root-ext-lowercase-design.md`
противоречит текущему решению по этому разбору и должна считаться устаревшей:
канонический каталог корневых внешних файлов конфигурации - `Ext`, а не `ext`.

### Предварительная классификация

Это не один технический случай. Внутри группы есть как минимум три подтипа:

1. Файлы, для которых уже выбран полноценный YAML-формат:
   `ClientApplicationInterface.xml`, `CommandInterface.xml`,
   `MainSectionCommandInterface.xml`, `HomePageWorkArea.xml`,
   корневые BSL-модули.
2. Непрозрачные бинарные или медиа-файлы, для которых вероятнее нужен
   reference-only или внешний YAML-файл:
   `MobileClientSignature.bin`, `StandaloneConfigurationContent.bin`,
   `Picture.png`.
3. Малые XML-обертки вокруг внешних файлов:
   `MainSectionPicture.xml`, `Splash.xml`.

### Решение по регистру каталога

Канонический XML-путь для корневых внешних файлов конфигурации должен быть
`Ext/...` с большой буквы.

Это касается:

- корневых BSL-модулей;
- `ClientApplicationInterface.xml`;
- `CommandInterface.xml`;
- `MainSectionCommandInterface.xml`;
- `HomePageWorkArea.xml`;
- `MobileClientSignature.bin`;
- `StandaloneConfigurationContent.bin`;
- `MainSectionPicture.xml` и `MainSectionPicture/*`;
- `Splash.xml` и `Splash/*`;
- других корневых внешних файлов конфигурации, если они будут добавлены тем же
  механизмом.

Следствие для будущей реализации: правила `MetadataConfigurationRules`, тесты и
YAML sync внешних файлов должны использовать `Ext/...`. Если в коде остались
пути `ext/...`, это отдельный источник текущего расхождения.

### Следующий вопрос для разбора

После фиксации регистра нужно выбрать следующий подтип: корневые интерфейсные
XML-файлы с полноценной YAML-моделью или непрозрачные внешние файлы, которые
копируются байт-в-байт через `ExternalFile`/`ExternalPicture`.

## Группа 2. Теряется содержимое `AllowedIncomingShareRequestTypes`

### Симптом

В `acc/Configuration.xml` элементы внутри
`AllowedIncomingShareRequestTypes` заменяются пустыми строками.

Исходный XML содержит элементы вида:

```xml
<v8:Value xsi:type="app:AllowedIncomingShareRequestType">
  <app:mime/>
  <app:uti/>
  <app:ext>txt</app:ext>
  <app:processingVariant xsi:type="xs:decimal">0</app:processingVariant>
  <app:isCustom>false</app:isCustom>
</v8:Value>
```

После round-trip остаются пустые места внутри контейнера.

### Предварительная классификация

Это потеря элементов сложного списка в `Configuration.xml`. Вероятный модуль:
`packages/core/metadata/appliedObjects/configuration`.

Похоже, свойство либо не описано в YAML-слое, либо описано как коллекция без
корректного типа элемента `AllowedIncomingShareRequestType`.

### Первый вопрос для разбора

Должен ли список входящих share request types быть частью человекочитаемого
YAML или временно сохраняться через reference?

## Группа 3. Нормализация переводов строк `CRLF -> LF`

### Симптом

XML-содержимое визуально не меняется, но diff показывает полную замену строк
из-за перевода строк.

Видимые примеры:

- `all/Catalogs/СправочникПолный/Forms/ФормаГруппы.xml`;
- `all/Catalogs/СправочникПолный/Forms/ФормаГруппы/Ext/Form.xml`;
- `all/Catalogs/СправочникПолный/Forms/ФормаСписка.xml`.

### Предварительная классификация

Это форматный diff, а не смысловая потеря модели. Вероятный слой - запись XML
или файловая синхронизация, где текущий writer всегда пишет `LF`, даже если
reference был с `CRLF`.

### Первый вопрос для разбора

Нужно ли сохранять исходный стиль переводов строк из reference или считать
`LF` допустимой нормализацией и исключать такие diff'ы из triage?

## Группа 4. Крупные diff'ы в `Ext/Form.xml` форм

### Симптом

В первой triage-пачке был виден крупный diff формы из `all`, где меняется
значительная часть `Ext/Form.xml`: в diff присутствуют `ChildItems`,
`Attributes`, `DynamicList`, настройки списка и элементы формы.

### Предварительная классификация

Это не один простой тип. Возможные причины внутри одного файла:

- восстановление default-значений;
- изменение порядка XML-узлов;
- дозапись элементов формы из reference;
- нормализация строк;
- расхождения в YAML-представлении форм.

### Первый вопрос для разбора

Для этой группы нужно выбирать один конкретный `Ext/Form.xml` и разбирать его
как single-case, потому что краткая групповая классификация может смешать
несколько независимых причин.

## Группа 5. Известный допустимый diff дублей кнопок

### Симптом

В `small` скрипт пропустил известный допустимый diff:

`DataProcessors/ДокументооборотСКонтролирующимиОрганами/Forms/МастерФормированияЗаявкиНаПодключениеУпрощенное/Ext/Form.xml`.

### Статус

Это уже встроенное исключение в `round-trip-yaml` skill. Его не нужно разбирать
в текущем цикле, пока не изменится решение по известным аномалиям форм.

## Порядок дальнейшего разбора

Рекомендуемый порядок:

1. Корневые `Ext`-файлы конфигурации, начиная с тех, где уже есть отдельные
   спеки.
2. Непрозрачные `Ext`-файлы: картинки, `.bin`, малые XML-обертки.
3. `AllowedIncomingShareRequestTypes`.
4. `CRLF -> LF`.
5. Один конкретный крупный `Ext/Form.xml` как отдельный single-case.

## Ограничения

- Не запускать полный round-trip повторно только ради восстановления списка,
  пока пользователь не попросит.
- Не изменять XML-фикстуры: они остаются источником истины.
- Не писать реализацию из этого документа напрямую; сначала выбрать одну
  группу, разобрать ее и при необходимости сделать отдельный план.
- Если нужен полный машинный список всех 481 diff-файлов, его нужно получить
  отдельным диагностическим запуском с сохранением вывода в файл.
