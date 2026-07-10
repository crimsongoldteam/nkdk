# ChildItems AJV Discriminator

## Цель

Снизить время и память проверки форм без перехода на standalone. Для этого нужно, чтобы AJV выбирал ветку элемента формы по полю `Вид`, а не прогонял все ветки `oneOf` в `Элементы`.

## Контекст

В `externalRefs`-режиме `GroupChildItems`, `CommandBarChildItems`, `TableChildItems` и `PagesChildItems` сейчас экспортируются как `Record<string, oneOf[$ref...]>` без `discriminator`. Ветки уже имеют обязательное поле `Вид` с `const`, поэтому схема совместима с AJV discriminator.

Эксперимент на формах из `/Users/nikita/git/nkdk-yaml` показал, что добавление `discriminator: { propertyName: "Вид" }` не меняет количество валидных и невалидных файлов, но снижает `schemaSec` примерно с 15.1 с до 4.2 с и RSS примерно с 4.3 ГБ до 1.9 ГБ.

## Решение

Добавить helper для `Record<string, oneOf[$ref...]>` с discriminator по заданному свойству и использовать его только для form child items. Общий helper без discriminator оставить без изменения, чтобы не менять поведение других схем.

`recordOfDiscriminatedOneOfSchemaRefs(names, "Вид")` должен генерировать:

```ts
{
  type: "object",
  additionalProperties: {
    oneOf: names.map((name) => schemaRef(name)),
    discriminator: { propertyName: "Вид" },
  },
}
```

## Проверка

Добавить тест schema graph, что `Элементы.additionalProperties.discriminator.propertyName` равен `Вид` для `UsualGroup`, `Page`, `Table`, `CommandBar` и `ButtonGroup`.

Проверить:

- `pnpm --filter @nakidka/core type-check`
- focused validation/schema tests
- быстрый замер форм на `/Users/nikita/git/nkdk-yaml`

## Не входит

Standalone-схемы не включаем в эту правку. Отдельный dispatcher по `Вид` тоже откладываем: текущая правка меньше и уже даёт подтверждённый эффект.
