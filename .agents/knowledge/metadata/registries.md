# Metadata Registries

## Обязательные точки регистрации

Для нового metadataItem проверь три места:

1. `packages/core/metadata/orchestration/metadataItem/registry.ts`
   - `MetadataItemTypeRegistry`
2. `packages/core/metadata/orchestration/property/registry.ts`
   - `PropertyTypeRegistry`
   - `PropertyRuleTypeKeys`
3. `types.ts` самого объекта
   - `registerMetadataItemRule`
   - или `registerMetadataItemCollectionRule` для массивов

## Одиночный объект

Используй `registerMetadataItemRule`, когда модель хранит объект как одно значение.

## Коллекция

Используй `registerMetadataItemCollectionRule`, когда модель хранит объект как массив `T[]`.

Для коллекции регистрируй и item-тип, и collection-тип, если оба нужны правилам.

## Проверка

После регистрации проверь:

```bash
rg -n "<ObjectName>|<ObjectName>s" packages/core/metadata/orchestration packages/core/metadata
```

Ожидаемо должны находиться:

- тип в `MetadataItemTypeRegistry`, если это metadataItem;
- тип в `PropertyTypeRegistry`;
- ключ в `PropertyRuleTypeKeys`;
- runtime-регистрация в `types.ts`.
