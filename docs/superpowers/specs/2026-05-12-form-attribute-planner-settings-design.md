# FormAttribute Planner Settings Design

Дата: 2026-05-12

## Контекст

Полный short round-trip по XML-конфигурациям показывает diff в
`Catalogs/КонтактныеЛица/Forms/ФормаЛиды/Ext/Form.xml`: у реквизита формы `Канбан`
тип `pl:Planner` сохраняется в `<Type>`, но большой узел
`<Settings xmlns:pl="http://v8.1c.ru/8.3/data/planner" xsi:type="pl:Planner">`
после цикла заменяется на `<Settings xsi:type="v8:TypeDescription"/>`.

Владеющий модуль: `packages/core/metadata/forms/commonObjects/formAttribute`.

В проекте уже есть механизм typed settings для `FormAttribute.Settings`: `Chart` и
`SpreadsheetDocument` хранят внутренности `Settings` как XML-фрагмент, а
`formAttribute/settings.ts` выбирает нужное свойство по `xsi:type`.

## Цель

Сохранять `FormAttribute.Settings` с `xsi:type="pl:Planner"` без потери XML-структуры
и без моделирования отдельных полей планировщика.

Успех:

- `import plannerSettings` читает planner settings в ожидаемую TS-модель.
- `export plannerSettings` возвращает исходный XML без схлопывания в `v8:TypeDescription`.
- YAML round-trip для этого свойства работает так же, как у `Chart` и `SpreadsheetDocument`.
- Поведение `valueType`, `dynamicList`, `chart` и `spreadsheetDocument` не меняется.

## Решение

Добавить новый property type `Planner` по существующему шаблону `SettingsFragment`.

Новый модуль `packages/core/metadata/forms/commonObjects/planner/types.ts`:

- экспортирует `Planner`, `PlannerXML`, `PlannerYAML`;
- регистрирует тип `Planner`;
- использует canonical XML wrapper:
  - `_xmlns:pl`: `http://v8.1c.ru/8.3/data/planner`;
  - `_xsi:type`: `pl:Planner`;
- распознаёт `xsi:type`, равный `pl:Planner` или заканчивающийся на `:Planner`.

`FormAttribute` расширяется новым свойством:

- модельное поле: `planner`;
- XML-тег: `Settings`;
- YAML-ключ: `Планировщик`;
- XML/YAML значение хранит только внутренние узлы `Settings`, без внешней оболочки.

`formAttribute/settings.ts` расширяет dispatch:

- при import `Settings xsi:type="...:Planner"` возвращает `{ planner }`;
- при export сначала проверяет уже существующие typed settings, затем `planner`;
- если typed settings нет, текущая логика `valueType` и пустого `v8:TypeDescription`
  работает как раньше.

## Тесты

Добавить focused fixture в `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__`:

- `plannerSettings.xml`: один `Attribute` с `Type = pl:Planner` и полным характерным
  `Settings xsi:type="pl:Planner"` из round-trip diff.
- `plannerSettings.ts`: ожидаемая `FormAttributes`-модель с `planner` как XML-фрагментом.

Добавить проверки:

- `fromXML.test.ts`: `it("import plannerSettings")`;
- `toXML.test.ts`: `it("export plannerSettings")`;
- `fromYAML.test.ts`: import YAML с ключом `Планировщик`;
- `toYAML.test.ts`: export YAML с ключом `Планировщик`.

Отдельный round-trip тест не нужен: пара import/export покрывает тот же сценарий.

## Не входит

- Полная доменная модель `Planner`.
- Человеческое YAML-представление отдельных свойств планировщика.
- Обобщённый `UnknownTypedSettings` для всех неизвестных `Settings xsi:type`.
- Изменение поведения `Chart`, `SpreadsheetDocument`, `DynamicList` или `TypeDescription`.
- Исправление других diff из полного round-trip.
