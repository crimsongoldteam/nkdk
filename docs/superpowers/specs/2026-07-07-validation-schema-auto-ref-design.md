# Оптимизация validation schema ref через регистрации rules

## Контекст

Сейчас validation умеет собирать JSON Schema graph с внешними `$ref`, но значительная часть связей описана вручную через `registerProjectJSONSchema`, `registerProjectJSONSchemaPropertyRef` и `registerProjectJSONSchemaPropertyRefFactory`. Это работает для уже подключённых тяжёлых схем, но плохо масштабируется на все `rules.ts`: появляются отдельные списки частных типов, а оркестрация коллекций продолжает строить вложенные схемы сама.

Цель этой доработки ограничена validation cache и AJV standalone. Публичный вывод `schema --json-schema` может использовать тот же механизм, но не является обязательным результатом.

## Решение

Основной путь: использовать стандартные регистрации metadata item и collection rule как источник schema identity.

`registerMetadataItemRule({ propertyType, itemRule, schemaName? })` дополнительно регистрирует схему одиночного rules-объекта. Если `schemaName` не задан, имя схемы выводится из `itemRule.itemType`. Экспортёр по умолчанию строит схему через `exportMetadataItemToJSONSchema({ context, rule: itemRule })`.

`registerMetadataItemCollectionRule({ propertyType, itemRule, ..., schemaName?, schemaShape? })` дополнительно регистрирует явную связь коллекции с rules-объектом элемента. Для коллекций не выводим связь из `propertyType`: форма коллекции и item-rule должны быть заданы регистрацией. По умолчанию для текущих metadata collection это `record` со значениями `$ref` на схему item-rule; `yamlAsArray` даёт `array` со значениями `$ref`.

Явные регистрации остаются для нестандартных случаев:

- схемы с особым экспортёром, например формы и discriminated form elements;
- параметризованные схемы, например DCS values/settings parameter values;
- случаи, где один rules-объект учитывает другой и нужно задать стабильное имя или способ сборки схемы вручную.

## Границы слоёв

Orchestration не должна импортировать конкретные applied/common/form rules. Она знает только нейтральные понятия: `MetadataItemRule`, `PropertyRuleType`, schema identity, schema shape и режим экспорта.

Регистрация конкретной связи живёт рядом с объектом или фабрикой, где уже известны `propertyType`, `itemRule` и форма YAML. Project/validation layer читает нейтральный registry и строит graph, не проверяя имена объектов, папки или конкретные `itemType`.

## Поток данных

1. При загрузке модулей локальные для объекта `registerMetadataItemRule` и `registerMetadataItemCollectionRule` наполняют registry schema identities.
2. Validation exporter создаёт root-схему для project spec в режиме `externalRefs`.
3. `exportPropertyToJSONSchema` при `externalRefs` спрашивает registry, есть ли ref-схема для `rule.type`.
4. Для одиночного item возвращается `$ref` на schema name из регистрации item-rule.
5. Для коллекции возвращается schema shape (`record` или `array`) с `$ref` на item schema.
6. Graph collector рекурсивно раскрывает найденные refs через зарегистрированные exporters.
7. Validation cache и standalone компилируют root schema плюс reachable refs с `inlineRefs: false`.

## Рекурсия и зависимости rules

Если один rules-объект прямо или косвенно использует другой, связь выражается через registry и `$ref`, а не через ручной inline-вызов в оркестрации. Для циклов graph collector должен дедуплицировать refs по имени, как сейчас делает `exportJSONSchemaGraph`.

Существующий `schemaStack` остаётся как защита для inline-режима и для старых экспортёров. В externalRefs основная защита от рекурсии переносится на стабильные `$ref` и дедупликацию graph.

## Ошибки

Если в externalRefs встречается property type с зарегистрированной collection schema, но item schema exporter не найден, validation должна падать с ошибкой, где указаны `propertyType`, `itemRule.itemType` и ожидаемое schema name.

Если два разных rules регистрируют одно schema name с разными exporters, registry должен выбросить ошибку при регистрации. Повторная регистрация того же rules-объекта с тем же именем допустима для идемпотентной загрузки модулей.

Если коллекция не имеет явной schema-связи, она остаётся на текущем inline-поведении. Это сохраняет постепенную миграцию и не ломает нестандартные типы.

## Тестирование

Нужны модульные тесты на registry:

- `registerMetadataItemRule` регистрирует schema name из `itemType`;
- явный `schemaName` переопределяет имя;
- `registerMetadataItemCollectionRule` создаёт `record` или `array` ref только при явной collection-связи;
- конфликт имён даёт понятную ошибку;
- цикл rules через коллекцию не приводит к бесконечному inline-экспорту.

Нужны интеграционные тесты validation graph:

- свойства `MetadataCatalogAttributes` ссылаются на `MetadataCatalogAttribute` через collection registration;
- graph содержит reachable refs для nested rules;
- standalone schema set сохраняет refs и компилируется;
- публичный `schema --json-schema` не обязан менять формат, но не должен регрессировать существующие тесты.

## Миграция

Первый шаг — добавить registry и подключить его к существующим двум стандартным регистрациям. Затем перенести ручные property-ref регистрации, которые дублируют metadata item/collection registrations. Нестандартные ручные регистрации оставить и явно пометить как особые schema exporters.

Изменение должно быть совместимым: если для property type нет schema identity, текущий inline-export продолжает работать.
