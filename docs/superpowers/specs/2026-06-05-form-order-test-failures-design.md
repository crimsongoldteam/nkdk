# Порядок формы в XML и YAML

## Контекст

После предыдущих исправлений `pnpm test` падает на трёх проверках порядка:

- `metadata/forms/commonObjects/formAttribute/toXML.test.ts`: `should export full`;
- `metadata/forms/commonObjects/formAttribute/toXML.test.ts`: `should export choice list`;
- `metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`: `metadataCommonForm` на этапе `XML -> YAML`.

Падения не связаны с ПВХ, подписками или `ExtDimension*`: они воспроизводятся отдельно и касаются только порядка свойств форм.

## Цель

Вернуть порядок экспорта форм к текущему контракту тестов и фикстур, не меняя XML-фикстуры.

## Решение

Исправление локальное для правил форм.

### `FormAttributeRules`

Порядок XML-реквизита формы должен совпадать с текущими XML-фикстурами. Для этого в правилах реквизита формы явно закрепляется порядок:

```text
Edit -> FillCheck -> MainAttribute -> Save -> SavedData -> Type -> UseAlways -> View -> ...
```

Для `valueType`, `dynamicList` и других свойств, которые экспортируются в `<Settings>`, порядок остаётся после основных полей, если нет reference.

### `ClientApplicationFormRules`

Порядок YAML формы должен снова выводить `Реквизиты` перед `Элементы`, как в существующей sync-фикстуре `metadataCommonForm`.

Правило:

```text
Реквизиты -> Элементы
```

Остальные поля формы не переупорядочиваются без необходимости.

## Границы

- Не менять исходные XML-фикстуры.
- Не менять общий механизм `getOrderedKeysToXML`.
- Не менять правила неформовых объектов.
- Не решать предупреждения `Dimension/Resource` и ошибку исходной формы `ДинамическийСписок`; они зафиксированы отдельно.

## Проверка

Минимальные проверки:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts
pnpm --dir packages/core exec vitest run metadata/appliedObjects/__tests__/syncRoundTrip.test.ts -t metadataCommonForm
```

Финальная проверка:

```bash
pnpm test
```
