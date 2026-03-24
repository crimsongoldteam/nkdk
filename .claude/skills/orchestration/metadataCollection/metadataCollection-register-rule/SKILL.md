---
name: metadataCollection-register-rule
description: Регистрация коллекций metadataItem через registerMetadataItemCollectionRule в packages/core/metadata/orchestration/metadataCollection. Используй, когда переводишь тип на ruleFactory или добавляешь новый collection property type с XML/YAML импортом и экспортом.
---

Используй этот скилл, когда нужно зарегистрировать или исправить коллекцию `metadataItem` через `registerMetadataItemCollectionRule(...)`.

## Что делает registerMetadataItemCollectionRule

`registerMetadataItemCollectionRule` автоматически регистрирует 4 операции для `propertyType`:

1. `importFromXML`
2. `importFromYAML`
3. `exportToYAML`
4. `exportToXML`

Регистрация выполняется в `types.ts` объекта через side-effect импорт.

## Где и как регистрировать

1. Открой `types.ts` нужного объекта.
2. Импортируй:
   - `registerMetadataItemCollectionRule` из `~/metadata/orchestration`
   - `...Rules` из `./rules`
3. Добавь вызов:

```ts
registerMetadataItemCollectionRule({
  propertyType: "YourCollectionPropertyType",
  itemRule: YourItemRules,
  xmlElement: "xr:YourElement",
})
```

## Дополнительные опции (когда нужны)

`registerMetadataItemCollectionRule` поддерживает кастомизацию поведения коллекции:

- `nameFromYAMLKey(yamlKey)` — преобразование YAML-ключа в `name` metadata-item при `importFromYAML`.
- `yamlKeyFromName(name)` — преобразование `name` в YAML-ключ при `exportToYAML`.
- `returnUndefinedWhenEmptyYAML` — возвращать `undefined`, а не `[]`, если YAML пустой/не задан.
- `extendDataForExportToXML({ data, rule })` — дополнить/нормализовать коллекцию перед `exportToXML` (например, добавить обязательные элементы из `rule.standartAttributeNames`).
- `omitIdAttributeInXML` — не добавлять `_id` в XML-элементы коллекции.

## Обязательные проверки после регистрации

1. **Property type существует** в `PropertyTypeRegistry` (`packages/core/metadata/orchestration/property/registry.ts`).
2. **`itemRule.itemType` зарегистрирован** в `MetadataItemTypeRegistry` (`packages/core/metadata/orchestration/metadataItem/registry.ts`).
3. **Side-effect импорт не потерян**:
   - в индекс-файле домена (`commonObjects/index.ts`, `forms/index.ts`, `appliedObjects/index.ts`) должен импортироваться модуль, где выполняется регистрация (обычно `types.ts` или конвертеры).
4. **Тесты читают локальные фикстуры** из `__fixtures__` рядом с тестом, если фикстуры перенесены из `tests/fixtures`.
5. Если у `PropertyRule` есть обязательные поля (например, `standartAttributeNames`), обязательно передавай их в тестах `fromYAML/toYAML/toXML`.

## Минимальный тестовый набор

- `fromXML.test.ts`
- `toXML.test.ts`
- `fromYAML.test.ts`
- `toYAML.test.ts`

Проверь кейсы:

1. полный объект;
2. минимальный объект;
3. значения по умолчанию;
4. `undefined`/пустые входные данные.

## Частые ошибки

1. Удалили `fromXML.ts`, но в `index.ts` остался side-effect импорт удаленного файла.
2. Регистрация перенесена в `types.ts`, но `types.ts` не импортируется в индексах.
3. `xmlElement` не совпадает с реальным тегом в XML fixture.
4. После импорта получается пустой массив `[]` вместо `undefined` для "пустого" результата.
5. Для `toXML` не учтены служебные `id`/нумерация и тесты сравнивают XML в неверном формате.

## Критерий готовности

- Коллекция корректно конвертируется XML <-> metadata <-> YAML.
- Регистрация выполняется стабильно через side-effect импорты.
- Тесты на все 4 направления проходят.
