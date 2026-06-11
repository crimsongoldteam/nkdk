# JSON Schema Для Rule-Based Metadata Item В Validation Форм

## Цель

Сократить оставшиеся ошибки validation форм группы (А+Б): `Unexpected property` для `УсловноеОформление` и связанный каскад `Expected union value` для элементов формы вроде `Группа`, `ТаблицаФормы` и `Страницы`.

Следующий срез должен научить rule-based metadata item типы автоматически экспортировать JSON Schema. Объекты, уже описанные через `rules.ts`, должны приниматься validation без отдельных ручных schema-файлов на каждый тип.

## Контекст

После исправления схем singleton-элементов полный запуск validation на `/home/nikita/git/temp-yaml` показывает:

- `27482 error`, `36173 warning`
- `7828 Unexpected property`
- `6574 Expected union value`

В файлах форм главный оставшийся ключ `Unexpected property` — `УсловноеОформление`, около 3.9k вхождений. Самые частые значения `Expected union value` всё ещё `Группа`, `ТаблицаФормы` и `Страницы`; вероятно, это каскад, где валидный элемент не проходит свою ветку union из-за вложенного свойства, отсутствующего в сгенерированной схеме.

Ключевое наблюдение по коду: `registerMetadataItemRule` регистрирует XML/YAML import/export, но не регистрирует `exportToJSONSchema`. `ConditionalAppearance` подключён через `registerMetadataItemRule`, а вложенная коллекция `ConditionalAppearanceItems` уже умеет экспортировать схемы элементов. Поэтому модель может round-trip-ить `УсловноеОформление`, но генерация validation schema всё ещё может его пропускать.

## Решение

Добавить регистрацию JSON Schema по умолчанию в `registerMetadataItemRule`.

Если тип регистрируется с `itemRule`, его схема по умолчанию должна строиться так:

```ts
exportMetadataItemToJSONSchema({ context, rule: itemRule })
```

Это повторяет подход коллекционных правил, которые уже выводят схемы элементов из `itemRule`. Сгенерированный объект должен сохранить `additionalProperties: false`, потому что validation остаётся строгой.

`ConditionalAppearance` тогда становится обычным следствием общего механизма:

- `DynamicListRules.conditionalAppearance` имеет `type: "ConditionalAppearance"` и `yaml: "УсловноеОформление"`.
- `ConditionalAppearanceRules.conditionalAppearanceItems` имеет `type: "ConditionalAppearanceItems"` и `yaml: "Элементы"`.
- `ConditionalAppearanceItems` уже экспортирует схему элемента через коллекционное правило.

## Границы

Входит в работу:

- зарегистрировать `exportToJSONSchema` по умолчанию в `registerMetadataItemRule`;
- добавить focused regression coverage для `ДинамическийСписок.УсловноеОформление`;
- пересчитать ошибки validation форм после изменения;
- проверить, уменьшается ли каскад `Expected union value` по видам элементов формы.

Не входит в работу:

- не менять XML-фикстуры;
- не ослаблять `additionalProperties: false`;
- не заниматься нефомовыми группами `Свойства.yaml`, включая роли, права и metadata refs;
- не добавлять частную схему `ConditionalAppearance`, пока общий механизм не доказан небезопасным;
- не менять YAML-форму динамических списков или условного оформления.

## Риски

Общая регистрация может раскрыть дополнительные вложенные rule-based схемы, которые раньше пропускались. Для validation это желаемо, но может проявить более глубокие неподдержанные leaf-типы как новые `Unexpected property`. Это считается прогрессом, если parent `Expected union value` по элементам формы уменьшается, а новые ошибки указывают на более точные leaf-типы.

Ещё один риск — рекурсия через вложенные rule-based типы. Текущая генерация схем уже специально обрабатывает вложенные элементы формы, поэтому реализация должна сначала пройти focused schema tests, а при `Maximum call stack size exceeded` сразу остановиться на диагностике.

## Проверка

Использовать red-green срез:

1. Добавить focused-тест, который экспортирует inline `ClientApplicationForm` schema и валидирует фрагмент формы с:
   - реквизитом формы типа `ДинамическийСписок`;
   - вложенным `ДинамическийСписок.УсловноеОформление`;
   - элементом `ТаблицаФормы`, привязанным к этому реквизиту.
2. Подтвердить, что до изменения тест падает с `Unexpected property` или parent `Expected union value`.
3. Добавить регистрацию `exportToJSONSchema` по умолчанию в `registerMetadataItemRule`.
4. Подтвердить, что focused-тест проходит.
5. Запустить:
   - `pnpm --filter @nakidka/core exec vitest run metadata/validation`
   - `pnpm --filter @nakidka/core exec vitest run metadata/forms`
   - полный validation на `/home/nikita/git/temp-yaml`
   - `pnpm test`

Команда validation ERP всё ещё ожидаемо завершится с кодом `1`, потому что останутся несвязанные диагностики. Успех измеряется меньшим числом ошибок `УсловноеОформление` в формах и меньшим числом `Expected union value` по видам элементов формы.
