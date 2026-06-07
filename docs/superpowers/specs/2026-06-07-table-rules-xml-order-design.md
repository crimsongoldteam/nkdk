# Исправить XML-порядок свойств TableRules

## Контекст

Проверка `round-trip-yaml-1c` для конфигурации `acc` падает при загрузке generated XML в 1С:

```text
Invalid name of form item command. - Add
Invalid name of form item command. - Copy
Invalid name of form item command. - Delete
```

Бинарная подмена `Form.xml` локализовала воспроизведение до одного файла:

```text
DataProcessors/НастройкаПравилОбработкиЗаявокКабинетСотрудника/Forms/НастройкаПравил/Ext/Form.xml
```

Внутри файла ошибка снимается, если у таблицы `НастройкиПравилПоПодразделениям` оставить generated-содержимое, но переставить прямые XML-теги в порядок эталона.

## Причина

При экспорте без reference порядок XML-свойств берется из порядка ключей в `TableRules.properties`.
Сейчас этот порядок отличается от порядка XML 1С: например, `AutoCommandBar` и `ChildItems` выходят раньше `CommandSet`, `DataPath`, `Representation` и связанных свойств таблицы.

Для некоторых таблиц 1С валидирует `CommandSet` с учетом уже прочитанного контекста таблицы. Когда `CommandSet` встречается до нужных свойств, короткие команды `Add`, `Copy`, `Delete` считаются недопустимыми именами команд элемента формы.

## Выбранный подход

Исправить только `TableRules`: физически переставить ключи в `properties` так, чтобы XML без reference выходил в каноническом порядке 1С для таблиц.

Критичный порядок начала таблицы:

```text
Representation
ChangeRowSet
ChangeRowOrder
AutoInsertNewRow
EnableStartDrag
EnableDrag
DataPath
RowPictureDataPath
RowsPicture
CommandSet
ContextMenu
AutoCommandBar
ExtendedTooltip
SearchStringAddition
ViewStatusAddition
SearchControlAddition
Events
ChildItems
```

`order` не добавляем на этом шаге: выбран вариант (А), то есть порядок задается расположением ключей в `TableRules`. Это сохраняет текущую модель оркестратора и не вводит новый механизм.

## Границы

- Не менять XML-фикстуры и эталонный `/home/nikita/git/round-trip/acc`.
- Не менять формат YAML.
- Не менять `CommandSet` как тип данных: значения `Add`, `Copy`, `Delete` валидны.
- Не добавлять новый механизм XML-порядка в orchestration.
- Не исправлять другие form elements в рамках этой задачи.

## Проверки

1. Точечный тест экспорта `Table`, который проверяет относительный порядок критичных XML-тегов.
2. `pnpm --dir packages/core run type-check`.
3. `round-trip-yaml-1c` для `acc`: ошибка `Invalid name of form item command` должна исчезнуть.
4. Если изменение затрагивает общий экспорт форм шире ожидаемого, дополнительно запустить релевантные form tests или `pnpm test`.

## Риски

Физическая перестановка ключей в `TableRules` может изменить порядок XML у всех таблиц. Это ожидаемое изменение для режима без reference, но нужно проверить, что оно не ломает существующие round-trip тесты с reference.

Если в других элементах формы есть похожая чувствительность к порядку, они останутся отдельными задачами.
