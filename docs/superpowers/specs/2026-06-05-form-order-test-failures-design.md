# Порядок формы в XML и YAML

## Контекст

После предыдущих исправлений `pnpm test` падает на трёх проверках порядка:

- `metadata/forms/commonObjects/formAttribute/toXML.test.ts`: `should export full`;
- `metadata/forms/commonObjects/formAttribute/toXML.test.ts`: `should export choice list`;
- `metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`: `metadataCommonForm` на этапе `XML -> YAML`.

Падения не связаны с ПВХ, подписками или `ExtDimension*`: они воспроизводятся отдельно и касаются только порядка свойств форм.

## Цель

Вернуть порядок экспорта форм к реальному порядку XML из `/home/nikita/git/round-trip` и обновить устаревшие unit-фикстуры форм.

## Решение

Исправление локальное для правил и тестовых фикстур форм.

Перед правкой проверен реальный набор `/home/nikita/git/round-trip`:

- `Form.xml`: 34 323 файла;
- `Attribute`: 364 106 реквизитов формы;
- `Settings -> Title -> Type`: 0 случаев;
- `Title -> Type -> Settings`: 4 810 случаев;
- `ChildItems` перед `Attributes`: 33 676 случаев;
- `Attributes` перед `ChildItems`: 0 случаев.

### `FormAttributeRules`

Порядок XML-реквизита формы должен совпадать с реальной выгрузкой 1С. Для этого в правилах реквизита формы явно закрепляется порядок:

```text
Title -> Type -> View -> Edit -> MainAttribute -> SavedData -> FillCheck -> UseAlways -> Save -> FunctionalOptions -> Settings
```

Для `valueType`, `dynamicList` и других свойств, которые экспортируются в `<Settings>`, порядок ставится в конец. Это соответствует реальным формам: `Settings` встречается после `Type` и других основных свойств.

### Тестовые фикстуры `formAttributes`

Фикстуры `packages/core/tests/fixtures/formAttributes/full.xml` и `choiceList.xml` были устаревшими:

- в `choiceList.xml` был порядок `Settings -> Title -> Type`, который не встречается в реальном наборе;
- в `full.xml` были последовательности, которые не встречаются в реальном наборе.

Их нужно обновить под порядок, который генерируется после правки `FormAttributeRules`.

### `metadataCommonForm` YAML

Порядок YAML формы должен выводить `Элементы` перед `Реквизиты`, потому что в реальном XML `ChildItems` всегда идёт перед `Attributes`.

Правило YAML-фикстуры:

```text
Элементы -> Реквизиты
```

Правила `ClientApplicationFormRules` менять не нужно: текущий вывод уже соответствует реальному XML-порядку.

## Границы

- Не менять XML-фикстуры из `/home/nikita/git/round-trip`.
- Разрешено менять unit/sync-фикстуры внутри `packages/core`, если они противоречат реальному XML.
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
