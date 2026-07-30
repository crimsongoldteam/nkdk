# Переход на TypeScript 7

## Цель

Полностью перевести NKDK с TypeScript 6.0.3 на TypeScript 7 без совместимого
пакета TypeScript 6 и без стороннего анализатора TypeScript AST.

## Зависимости и команды

- Обновить `typescript` до стабильной ветки `~7.0.0` в корне и пакетах.
- Удалить `ts-patch`, команды `prepare` для него и пустую настройку
  `compilerOptions.plugins`.
- Сохранить текущие команды `tsc` для сборки и проверки типов: после обновления
  они должны запускать нативный компилятор TypeScript 7.
- Исправлять настройки и исходный код только там, где TypeScript 7 выявит
  реальную несовместимость.

## Удаление временных инструментов

Удалить:

- `packages/core/scripts/conversion-test-migration`;
- временную миграцию `packages/core/metadata/rulesBuilderMigration`, включая CLI,
  преобразование, каталог builder-правил и их модульные тесты;
- зависящую от `inventoryRulesSource` проверку из
  `packages/core/metadata/importBoundaries.test.ts`.

Проверка через `inventoryRulesSource` не является надёжным постоянным
ограничением: на существующих production `rules.ts` она не находит прямые
правила, поэтому её удаление не ослабляет фактически работающую проверку.

## Fixture wizard

Сохранить fixture wizard, но убрать чтение `rules.ts` через Compiler API.
`targetResolver` должен находить правило объекта в существующем
`TopLevelMetadataItemRules` и брать из него `xmlDir`. Если объект или строковый
`xmlDir` не найдены, мастер сохраняет текущее поведение с `undefined` и выбором
каталога пользователем.

Так fixture wizard использует рабочую модель metadata-правил вместо повторного
анализа её исходного текста.

## Проверка результата

После изменения выполнить:

1. точечные тесты `targetResolver` и архитектурных границ;
2. `pnpm type-check`;
3. `pnpm build`;
4. полный `pnpm test`.

Переход завершён, если в дереве зависимостей нет TypeScript 6, все команды
используют TypeScript 7 и перечисленные проверки проходят.
