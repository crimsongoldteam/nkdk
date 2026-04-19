# Reproducer для form-элементов (`forms/elements/<element>/`)

Модули form-элементов (`forms/elements/*`: `table`, `inputField`, `labelField`, …) **не имеют** собственных `fromXML.test.ts` / `toXML.test.ts`. XML-тесты для всех элементов централизованы в:

- `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

Оба файла — это `it.each` поверх списка `ElementFixtures` из `packages/core/metadata/forms/elements/__tests__/fixtures.ts`. Поэтому основная схема скилла (`testImportPropertyFromXML` + локальный `rule`) к ним **не применяется** — вместо неё добавляй запись в `ElementFixtures`.

## Отличия от базовой схемы

| Артефакт | Как в базовой схеме | Как для form-элемента |
|---|---|---|
| XML-фикстура | `<module>/__fixtures__/<slug>.xml` | `forms/elements/<element>/__fixtures__/<slug>.xml` |
| TS-фикстура | `<module>/__fixtures__/<slug>.ts`, экспорт `<slug>` | то же, экспорт `<slug>` типа `<ElementType>` |
| Подключение тестов | вручную `it("import <slug>")` / `it("export <slug>")` в `fromXML.test.ts` / `toXML.test.ts` модуля | **новая запись** в `ElementFixtures` в `forms/elements/__tests__/fixtures.ts` (имя `name: "<slug>"`) — тесты получаются автоматически через `it.each` |
| Калибровка через vitest | `-t "export <slug>"` | `-t "<slug>"` (имя теста = `name` из фикстуры) |

## Шаги

1. Определи целевой element-модуль (`forms/elements/<element>/`). Он же — владелец `rules.ts`, который будет поправлен. Slug — как в базовой схеме (camelCase, описывает баг).
2. Создай XML-фикстуру `forms/elements/<element>/__fixtures__/<slug>.xml`. Корневой тег — `<ItemType name="..." id="...">` (как в `full.xml` соседей). Черновик — минимально воспроизводящий diff, затем **откалибруй через `toXML`** (см. [fixture-conventions.md](./fixture-conventions.md#как-выйти-на-полный-вид)) — при калибровке используй `-t "<slug>"`, так как тест называется именем фикстуры, не `export <slug>`.
3. Создай TS-фикстуру `forms/elements/<element>/__fixtures__/<slug>.ts` с экспортом `<slug>` типа `<ElementType>` из `types.ts` (ожидаемая форма, строим от типа, не от сломанного выхода `fromXML`).
4. Добавь запись в `ElementFixtures` в `packages/core/metadata/forms/elements/__tests__/fixtures.ts` — внутри существующего `//#region <ItemType>` соответствующего элемента:

   ```typescript
   {
     group: "<ItemType>",          // напр. "Table"
     name: "<slug>",               // совпадает со slug'ом
     element: <NkdkSymbolOrUndefined>, // берём у соседей в том же region'е
     xml: "<slug>.xml",
     xmlFolder: undefined,         // или имя элементной папки, если xml лежит в другой
     model: <slug>,                // TS-фикстура
     yaml: undefined,
     enterprise: undefined,
   },
   ```

   Не дублируй группу — вставляй рядом с существующими записями элемента. Импорт `<slug>` добавь рядом с существующими импортами из `../<element>/__fixtures__/data`.

5. Другие тестовые файлы (`fromYAML.test.ts`, `toYAML.test.ts`, `toEnterprise.test.ts`, `exportToPreview.test.ts`) тоже используют `ElementFixtures`, но фикстура с `yaml: undefined` / `enterprise: undefined` из них выпадает — дополнительных действий не нужно.

## Коллизии

- `<slug>.xml` уже есть в `forms/elements/<element>/__fixtures__/` → **стоп**, спрашивай новый slug.
- Запись с `name: "<slug>"` уже есть в `ElementFixtures` → **стоп**, спрашивай новый slug.

## Финальное сообщение

Повторяй шаблон из `SKILL.md` (Шаг 8), но добавь в список изменённых файлов также `forms/elements/__tests__/fixtures.ts`. `fromXML.test.ts` / `toXML.test.ts` руками не правятся — тесты создаются автоматически через `it.each` от новой записи в `ElementFixtures`.
