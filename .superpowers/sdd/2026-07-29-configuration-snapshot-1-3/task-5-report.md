# Task 5: четыре владельца `omittedChildren`

## Результат

- Добавлены нейтральные helpers `mergeOmittedNames`, `readOmittedNames`,
  `readOmittedTypedNames`. Они зависят только от `OmittedChildren` и получают
  `propertyType` только для диагностики.
- `ConfigurationChildObjects` записывает настоящие пары `{ xmlName, name }`,
  отбрасывает удалённые пары, сохраняет порядок оставшихся и добавляет новые
  пары в порядке текущего состава Проекта.
- `ChildFormNames`, `ChildTemplateNames`, `ChildFileItemNames` читают и
  записывают только `kind: names`, после успешного экспорта собирают итоговый
  порядок и не переносят список при пустом актуальном составе.
- Повторы в текущем и сохранённом порядке отклоняются; несовпадающий `kind`
  даёт диагностику с именем property-типа.

## RED

1. Helpers:

   ```text
   pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/omittedChildren.test.ts --no-isolate
   FAIL: Cannot find module './omittedChildren'
   ```

2. `ConfigurationChildObjects`:

   ```text
   pnpm --filter @nkdk/core exec vitest run \
     metadata/appliedObjects/configuration/configurationChildObjects.test.ts --no-isolate
   4 failed: setOrder/xmlNode отсутствуют, typedNames не реализован
   ```

3. Три именных типа:

   ```text
   pnpm --filter @nkdk/core exec vitest run \
     metadata/commonObjects/childFormNames/fromXML.test.ts \
     metadata/commonObjects/childFormNames/toXML.test.ts \
     metadata/commonObjects/childTemplateNames/fromXML.test.ts \
     metadata/commonObjects/childTemplateNames/toXML.test.ts \
     metadata/commonObjects/childFileItemNames/fromXML.test.ts \
     metadata/commonObjects/childFileItemNames/toXML.test.ts --no-isolate
   7 failed, 23 passed: setOrder/getConfigurationIndexPropertyOrder отсутствуют
   ```

4. Отдельные RED-проверки:

   - две проверки повторных typed-пар сначала не получали исключение;
   - несовпадающий `kind` при пустом текущем составе сначала не получал
     исключение.

## GREEN

```text
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/omittedChildren.test.ts \
  metadata/appliedObjects/configuration/configurationChildObjects.test.ts \
  metadata/commonObjects/childFormNames/fromXML.test.ts \
  metadata/commonObjects/childFormNames/toXML.test.ts \
  metadata/commonObjects/childTemplateNames/fromXML.test.ts \
  metadata/commonObjects/childTemplateNames/toXML.test.ts \
  metadata/commonObjects/childFileItemNames/fromXML.test.ts \
  metadata/commonObjects/childFileItemNames/toXML.test.ts --no-isolate

Test Files  8 passed (8)
Tests       45 passed (45)
```

Отдельно helpers: 8/8, `ConfigurationChildObjects`: 6/6, три именных типа:
31/31.

## TypeScript

```text
pnpm --filter @nkdk/core type-check
exit code: 2
changed_error_count: 0
```

Общий type-check ожидаемо остаётся красным на немигрированных API Tasks 6–8.
Фильтр по всем изменённым файлам Task 5 не нашёл ошибок TypeScript.

## Границы писателей

```text
rg -n "setOmittedChildren" packages/core/metadata
```

Кроме collector и его тестов, production-вызовы находятся только в четырёх
property-type файлах:

- `configuration/configurationChildObjects.ts`;
- `childFormNames/fromXML.ts`;
- `childTemplateNames/fromXML.ts`;
- `childFileItemNames/fromXML.ts`.

В `ConfigurationChildObjects` отсутствуют `JSON.stringify`/`JSON.parse`.
`setOrder`, `xmlNode()` и `getConfigurationIndexPropertyOrder` удалены из
четырёх типов.

## Изменённые файлы

- `packages/core/metadata/commonObjects/omittedChildren.ts`
- `packages/core/metadata/commonObjects/omittedChildren.test.ts`
- `packages/core/metadata/appliedObjects/configuration/configurationChildObjects.ts`
- `packages/core/metadata/appliedObjects/configuration/configurationChildObjects.test.ts`
- `packages/core/metadata/appliedObjects/configuration/register.ts`
- `packages/core/metadata/commonObjects/childFormNames/fromXML.ts`
- `packages/core/metadata/commonObjects/childFormNames/toXML.ts`
- `packages/core/metadata/commonObjects/childFormNames/toXML.test.ts`
- `packages/core/metadata/commonObjects/childTemplateNames/fromXML.ts`
- `packages/core/metadata/commonObjects/childTemplateNames/toXML.ts`
- `packages/core/metadata/commonObjects/childTemplateNames/toXML.test.ts`
- `packages/core/metadata/commonObjects/childFileItemNames/fromXML.ts`
- `packages/core/metadata/commonObjects/childFileItemNames/toXML.ts`
- `packages/core/metadata/commonObjects/childFileItemNames/toXML.test.ts`

`register.ts` изменён только для передачи уже построенного текущего состава
Проекта в `ConfigurationChildObjects`.

## Самопроверка и замечания

- `git diff --check` — без ошибок.
- XML-фикстуры не изменены.
- Существующий untracked
  `packages/core/metadata/appliedObjects/configuration/__fixtures__/_partial_xml_tmp/`
  не изменялся и не включён в коммит.
- Расширенный запуск по трём каталогам дал 51/54: три
  `childFormNames/syncExternalFromXML.test.ts` падают на удалённых
  `setUuid/setXmlId` вне Task 5. Эти места не изменялись согласно границам
  Tasks 6–8.
