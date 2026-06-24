# YAML Required Validation

## Проблема

`required: true` в `rules.ts` сейчас не делает YAML-поле обязательным в JSON Schema. Генератор схемы оборачивает все YAML-свойства в `Type.Optional(...)`, поэтому валидатор проверяет тип поля только когда поле присутствует.

Из-за этого проект `/home/nikita/git/new-test-yaml` проходит валидацию, хотя `Язык/Русский/Свойства.yaml` не содержит обязательный `КодЯзыка`.

## Решение

`required: true` должен означать обязательность поля и в YAML. Если правило имеет `yaml` и `required: true`, соответствующий YAML-ключ попадает в массив `required` JSON Schema.

Поля с `required: true` не должны одновременно иметь `implicitValueYAML`: если поле можно не писать в YAML из-за неявного значения, оно не является обязательным YAML-полем.

## Очистка существующих правил

Снять `required: true` с текущих конфликтующих правил:

- `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`: `autofill`, потому что `implicitValueYAML: "Истина"`.
- `packages/core/metadata/forms/elements/columnGroup/rules.ts`: `group`, потому что `implicitValueYAML: "Вертикальная"`.
- `packages/core/metadata/forms/elements/usualGroup/rules.ts`: `group`, потому что `implicitValueYAML: "ГоризонтальнаяЕслиВозможно"`.

`packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`: `languageCode` остаётся `required: true`, потому что у него нет `implicitValueYAML`; `КодЯзыка` обязан присутствовать в YAML.

## Архитектура

В `exportPropertiesToJSONSchema` нужно перестать безусловно оборачивать YAML-свойства в `Type.Optional(...)`. Если у правила есть `yaml` и `required: true`, в карту свойств кладётся исходная схема свойства; иначе сохраняется текущее поведение с `Type.Optional(...)`.

`Type.Object(properties, { additionalProperties: false })` сам сформирует массив `required` для свойств, не обёрнутых в `Type.Optional`. Inline-представления остаются без изменений: если объект сворачивается в inline-схему через `findInlineProperty`, используется схема inline-свойства.

## Ошибки

При отсутствии обязательного YAML-поля валидатор должен выдавать structure-ошибку с путём к отсутствующему ключу, например:

```text
Язык/Русский/Свойства.yaml:1:1 error: Отсутствует обязательное свойство "КодЯзыка"
```

Формат сообщения должен использовать уже принятый русский текст для отсутствующих обязательных свойств.

## Проверки

Добавить тесты:

- JSON Schema для `MetadataLanguage` содержит `required: ["КодЯзыка"]`.
- `validateProject` для языка без `КодЯзыка` возвращает structure-ошибку с `path: "/КодЯзыка"`.
- Три очищенных правила больше не имеют пары `required: true` и `implicitValueYAML`.
- Существующие минимальные YAML-проекты, где поле покрывается `implicitValueYAML`, не начинают требовать это поле.

Перед закрытием задачи выполнить `pnpm test`.
