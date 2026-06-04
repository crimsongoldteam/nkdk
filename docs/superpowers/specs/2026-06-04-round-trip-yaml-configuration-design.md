# Round-Trip YAML Configuration Design

## Контекст

Диагностика `round-trip-yaml --triage --all-configs --batch-size 1000` нашла 407 XML-diff'ов.
После отдельной проверки переводов строк выяснилось, что 404 diff'а в каталоге `all` связаны с
`CRLF -> LF`, а содержательные расхождения остаются в `Configuration.xml` для каталогов `acc`, `all`
и `erp`.

Работа ведётся в отдельном worktree:

- путь: `/home/nikita/git/nkdk/.worktrees/round-trip-yaml-spec`;
- ветка: `codex/round-trip-yaml-spec`;
- базовая проверка: `pnpm test` зелёный вне песочницы.

## Источники

- `/home/nikita/git/round-trip/all/Configuration.xml` — основной источник структуры и заполненных
  значений для новых фикстур.
- `/home/nikita/git/round-trip/acc/Configuration.xml` и
  `/home/nikita/git/round-trip/erp/Configuration.xml` — источники формы случаев с пустыми
  `mime`, `uti` и `ext`; значения из этих конфигураций нельзя переносить дословно.
- `/home/nikita/git/1c_res/mobileApp.xsdconfig_root.res` — русская документация контейнеров:
  «Навигационные ссылки мобильного приложения» и «Допустимые типы входящих запросов "Поделиться"».
- `/home/nikita/git/1c_res/mngapp.xsdmngcore_root.res` и
  `/home/nikita/git/1c_res/model.xdtomngcore_root.res` — структура типов
  `MobileApplicationURL`, `MobileApplicationURLs`, `AllowedIncomingShareRequestType` и
  `AllowedIncomingShareRequestTypes`.
- `/home/nikita/git/1c_res/hlp/1/FileStorage/objects` — проверен на русские имена вложенных полей;
  прямых справочных имён для `baseUrl`, `useAndroid`, `useIOS`, `useWindows`, `mime`, `uti`,
  `ext`, `processingVariant` и `isCustom` не найдено.

## Решение 1. Переводы Строк

`nkdk sync` должен писать XML в `LF`. Сохранение `CRLF` из reference не является целью.

Каталог `/home/nikita/git/round-trip/all` будет приведён к `LF` отдельно от реализации этой задачи.
После этого массовые diff'ы `CRLF -> LF` не должны считаться дефектом `nkdk`.

В реализации не нужно добавлять сохранение исходного стиля переводов строк и не нужно менять
`xmlExport` ради `CRLF`.

## Решение 2. YAML-Договор Для MobileApplicationURLs

`MobileApplicationURLs` должен быть частью человекочитаемого YAML-договора конфигурации.

YAML-ключ контейнера:

```yaml
НавигационныеСсылкиМобильногоПриложения:
  - baseUrl: sample-mobile-url
    useAndroid: Истина
    useIOS: Истина
    useWindows: Истина
```

Причины:

- русское имя контейнера взято из `res`;
- вложенные поля остаются техническими, потому что в `hlp` не найдено прямых русских имён;
- структура должна соответствовать XSD/XDTO: список элементов `MobileApplicationURL` с полями
  `baseUrl`, `useAndroid`, `useIOS`, `useWindows`.

XML должен восстанавливаться так:

```xml
<MobileApplicationURLs>
  <v8:Value xsi:type="app:MobileApplicationURL">
    <app:baseUrl>sample-mobile-url</app:baseUrl>
    <app:useAndroid>true</app:useAndroid>
    <app:useIOS>true</app:useIOS>
    <app:useWindows>true</app:useWindows>
  </v8:Value>
</MobileApplicationURLs>
```

## Решение 3. YAML-Договор Для AllowedIncomingShareRequestTypes

`AllowedIncomingShareRequestTypes` должен быть частью человекочитаемого YAML-договора конфигурации.

YAML-ключ контейнера:

```yaml
ДопустимыеТипыВходящихЗапросовПоделиться:
  - mime: text/plain
    uti: public.plain-text
    ext: txt
    processingVariant: 0
    isCustom: Ложь
```

Причины:

- русское имя контейнера взято из `res`;
- вложенные поля остаются техническими, потому что в `hlp` не найдено прямых русских имён;
- структура должна соответствовать XSD/XDTO: список элементов `AllowedIncomingShareRequestType` с
  полями `mime`, `uti`, `ext`, `processingVariant`, `isCustom`.

XML должен восстанавливаться так:

```xml
<AllowedIncomingShareRequestTypes>
  <v8:Value xsi:type="app:AllowedIncomingShareRequestType">
    <app:mime>text/plain</app:mime>
    <app:uti>public.plain-text</app:uti>
    <app:ext>txt</app:ext>
    <app:processingVariant xsi:type="xs:decimal">0</app:processingVariant>
    <app:isCustom>false</app:isCustom>
  </v8:Value>
</AllowedIncomingShareRequestTypes>
```

Пустые значения `mime`, `uti` и `ext` должны восстанавливаться как пустые XML-теги:

```xml
<app:mime/>
<app:uti/>
<app:ext/>
```

## Фикстуры

Новые тестовые фикстуры должны включать два класса данных.

1. Заполненные значения из `/home/nikita/git/round-trip/all/Configuration.xml`.
   Структура берётся из `all`, значения можно заменить на нейтральные, если они не важны для
   проверки поведения.

2. Случаи с пустыми `mime`, `uti` и `ext` по форме из `acc` и `erp`.
   Значения из `acc` и `erp` не переносить дословно из-за авторских прав. Использовать обобщённые
   значения вроде `text/plain`, `public.plain-text`, `txt`, `application/example` и
   `sample-mobile-url`.

Фикстуры должны проверять не только импорт из XML, но и полный путь
`XML -> модель -> YAML -> модель -> XML`.

## Ожидаемые Изменения В Коде

Реализация должна добавить локальные типы и правила в модуле
`packages/core/metadata/appliedObjects/configuration`:

- `MobileApplicationURL`;
- `MobileApplicationURLs`;
- `AllowedIncomingShareRequestType`;
- `AllowedIncomingShareRequestTypes`.

В `packages/core/metadata/appliedObjects/configuration/rules.ts` поля
`mobileApplicationURLs` и `allowedIncomingShareRequestTypes` должны перестать быть исключёнными из
YAML. Вместо `type: "string"` и `toYAML: false` / `fromYAML: false` они должны ссылаться на новые
типы и иметь русские YAML-ключи.

Поведение `xsi:type` обязательно:

- элемент списка `MobileApplicationURLs` должен выходить как
  `v8:Value xsi:type="app:MobileApplicationURL"`;
- элемент списка `AllowedIncomingShareRequestTypes` должен выходить как
  `v8:Value xsi:type="app:AllowedIncomingShareRequestType"`;
- `processingVariant` должен выходить с `xsi:type="xs:decimal"`.

## Проверки

Минимальный набор проверок реализации:

- fromXML для `MobileApplicationURLs` с заполненными значениями;
- toXML для `MobileApplicationURLs` с корректным `xsi:type`;
- fromYAML/toYAML для `MobileApplicationURLs`;
- fromXML для `AllowedIncomingShareRequestTypes` с заполненными значениями;
- fromXML для `AllowedIncomingShareRequestTypes` с пустыми `mime`, `uti` и `ext`;
- toXML для `AllowedIncomingShareRequestTypes` с корректными `xsi:type` и пустыми тегами;
- fromYAML/toYAML для `AllowedIncomingShareRequestTypes`;
- короткий round-trip `Configuration.xml`;
- полный `pnpm test` перед закрытием реализации.

## Вне Границ

- Не сохранять `CRLF` из reference.
- Не переносить дословные ERP/acc значения в новые фикстуры.
- Не добавлять raw XML-сохранение для этих контейнеров вместо YAML-договора.
- Не менять существующие XML-фикстуры без отдельного решения пользователя.
