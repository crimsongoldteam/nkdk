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

При экспорте без reference общий helper `buildPathStructure` не сохраняет физический порядок ключей в `TableRules.properties`: свойства без `referenceMetadata` и без `order` сортируются по XML-имени.
Из-за этого `AutoCommandBar` и `ChildItems` выходят раньше `CommandSet`, `DataPath`, `Representation` и связанных свойств таблицы.

Для некоторых таблиц 1С валидирует `CommandSet` с учетом уже прочитанного контекста таблицы. Когда `CommandSet` встречается до нужных свойств, короткие команды `Add`, `Copy`, `Delete` считаются недопустимыми именами команд элемента формы.

## Выбранный подход

Исправить только `TableRules`: добавить `order` на критичные свойства таблицы, чтобы XML без reference выходил в каноническом порядке 1С.

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

Физической перестановки ключей недостаточно, потому что orchestration сортирует свойства без `order` по XML-имени. `order` здесь используется точечно и обоснованно: это уже существующий механизм правил для случаев, где 1С чувствительна к порядку тегов.

## Границы

- Не менять XML-фикстуры и эталонный `/home/nikita/git/round-trip/acc`.
- Не менять формат YAML.
- Не менять `CommandSet` как тип данных: значения `Add`, `Copy`, `Delete` валидны.
- Не менять общий механизм XML-порядка в orchestration.
- Не исправлять другие form elements в рамках этой задачи.

## Проверки

1. Точечный тест экспорта `Table`, который проверяет относительный порядок критичных XML-тегов.
2. `pnpm --dir packages/core run type-check`.
3. `round-trip-yaml-1c` для `acc`: ошибка `Invalid name of form item command` должна исчезнуть.
4. Если изменение затрагивает общий экспорт форм шире ожидаемого, дополнительно запустить релевантные form tests или `pnpm test`.

## Предупреждения по HTML-справке

После исправления XML-порядка таблиц загрузка generated XML в 1С проходит успешно, но `ibcmd` может выводить предупреждения вида:

```text
the help page possibly contains an invalid link: true
the help page possibly contains an invalid link: ПутьККартинке
```

Это не ошибка round-trip. Контрольная проверка прямой загрузки эталонного `/home/nikita/git/round-trip/acc` в 1С показывает те же предупреждения. Проблемные значения уже находятся в исходных HTML-файлах справки, например:

```html
<a href="true">...</a>
<img src="true">
<img src="ПутьККартинке">
```

Generated XML сохраняет эти HTML-файлы байт-в-байт. Поэтому критерий успешности этой задачи — отсутствие ошибки `Invalid name of form item command`; help-warning'и считаются эталонным фоном и не требуют исправления в `TableRules`.

## Риски

`order` на критичных свойствах `TableRules` меняет порядок XML у всех таблиц в режиме без reference. Это ожидаемое изменение, но нужно проверить, что оно не ломает существующие round-trip тесты с reference.

Если в других элементах формы есть похожая чувствительность к порядку, они останутся отдельными задачами.
