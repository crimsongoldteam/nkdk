# Проверки строк и полной коллекции AppearanceFields

Декларации общего строкового значения и элемента коллекции находятся в
`rust/declarations/common/dcs-appearance-parameter.yaml`. Полная таблица 12
параметров — в `rust/declarations/common/appearance-fields.generated.yaml`.
В этом каталоге остаются только проверочные оболочки и примеры. Они не означают
завершения приёмки всего AppearanceFields.

Из корня worktree:

```sh
node tests/migration/proposals/appearance-strings/probe.mjs
node tests/migration/proposals/appearance-strings/probe.mjs --collection
```

Коллекция проверяет 39 договоров: прежние профили, целую независимую e2e-пару
из 12 параметров, короткие обычные строки, полные записи со служебными полями,
многоязычный и форматированный текст, отсутствие, null и аномалии. XML-фикстуры
не изменяются. Короткая и полная запись используют одну декларацию элемента.

Таблица извлекается автоматически из статически разобранного AppearanceFieldsRules:

```sh
node tools/rules-migration/generate-parameter-table.mjs AppearanceFieldsRules common.appearance-fields common.dcs-appearance-parameter rust/declarations/common/appearance-fields.generated.yaml --check
```

Без `--check` команда обновляет сгенерированный файл. Перед этим проверяется,
что исходные файлы совпадают со снимком переноса; неизвестные конструкции,
повторы имён и неподдержанные типы не пропускаются. Тест переносчика сверяет
всю декларацию с таблицей источника.

Через общий механизм индексируемых common распознаются все три исходных
использования. Проверены пустая оболочка ConditionalAppearanceItemRules и
оформление реального поля схемы с подготовленным ownerKind. Полная сборка
владельцев и привязка этого входа в ней учитываются отдельно. Предварительные
замеры оптимизированного исполнения записаны в отчёте; сравнение с TS не проведено.


Проекция `working.dcs-schema-field-appearance` дополнительно проверяет kind
из XML владельца и старый YAML без вида. Общий запуск коллекции содержит
39 договоров и компилирует разные размещения последовательно, без пропусков.
Один маршрут можно проверить отдельно:

```sh
node tests/migration/proposals/appearance-strings/probe.mjs --collection --entry working.dcs-schema-field-appearance
node tools/rules-migration/generate-source-projection.mjs tools/rules-migration/profiles/dcs-schema-field-appearance.json --check
```

Это проекция выбранных свойств, а не законченный владелец; публикация в рабочем
каталоге и приёмка словарных индексов ещё требуются.
