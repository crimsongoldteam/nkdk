# Form User Settings Events XML Case

## Контекст

Short round-trip XML нашел расхождение в форме отчета:

```diff
- <Event name="OnLoadUserSettingsAtServer">ПриЗагрузкеПользовательскихНастроекНаСервере</Event>
- <Event name="OnSaveUserSettingsAtServer">ПриСохраненииПользовательскихНастроекНаСервере</Event>
+ <Event name="onLoadUserSettingsAtServer">ПриЗагрузкеПользовательскихНастроекНаСервере</Event>
+ <Event name="onSaveUserSettingsAtServer">ПриСохраненииПользовательскихНастроекНаСервере</Event>
```

Модуль `forms/commonObjects/event` импортирует XML-имя события в camelCase,
например `OnOpen` -> `onOpen`. При экспорте он возвращает канонический XML-регистр
через `capitalize(key)` только для известных событий из правила `Events.items`.

Для `ClientApplicationFormRules.properties.events.items` уже есть
`onUpdateUserSettingSetAtServer`, но нет двух событий из diff:

- `onLoadUserSettingsAtServer`;
- `onSaveUserSettingsAtServer`.

Такие же ключи уже используются у table-элемента, где они перечислены в
`forms/elements/table/rules.ts`.

## Решение

Добавить ровно два form-level события в
`ClientApplicationFormRules.properties.events.items`:

- `onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере"`;
- `onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере"`.

Общий механизм `Events.toXML` не менять. Он уже умеет выгружать известные ключи
в каноническом XML-регистре. Расхождение возникает не из-за алгоритма, а из-за
неполного списка известных событий формы.

## Границы

В рамках этой спеки:

- добавляются только два события из найденного diff;
- `BeforeLoadUserSettingsAtServer` и другие события не добавляются;
- `Events.fromXML` и `Events.toXML` не меняются;
- поведение table-элементов не меняется;
- YAML-формат событий не меняется.

## Проверка

Нужны точечные тесты:

- export `Events` с правилом `ClientApplicationFormRules.properties.events`
  выгружает `onLoadUserSettingsAtServer` как `OnLoadUserSettingsAtServer`;
- export `Events` с тем же правилом выгружает `onSaveUserSettingsAtServer` как
  `OnSaveUserSettingsAtServer`;
- существующий тест для `onUpdateUserSettingSetAtServer` остается зеленым;
- неизвестное событие продолжает использовать прежнее поведение сохранения имени
  из reference, если оно не включено в `items`.

После реализации нужно выборочно повторить short round-trip на каталоге `acc` и
проверить, что diff в
`Reports/АнализДвиженийДенежныхСредств/Forms/ФормаОтчета/Ext/Form.xml`
исчез.
