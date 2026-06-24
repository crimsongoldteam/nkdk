# Дизайн: восстановить фикстуры форм для тестов core

## Контекст

После исправления `packages/graph` оставшиеся падения `packages/core` относятся к формам:

- тесты элементов формы ищут XML для `HTMLDocumentField` и `PDFDocumentField` в папках `hTMLDocumentField` и `pDFDocumentField`;
- реальные проектные фикстуры уже лежат в `htmlDocumentField/__fixtures__` и `pdfDocumentField/__fixtures__`;
- тест `registers commonObjects before reading form title from XML` в `clientApplicationForm/convertFromXML.test.ts` читает форму по абсолютному пути `/Users/nikita/git/round-trip-source/...`, которого нет в текущей среде.

Дополнительный разбор показал, что этот тест фактически проверяет `Title` у вложенного `ButtonGroup`, а не поведение `clientApplicationForm/convertFromXML` как полного конвертера формы.

## Цель

Сделать тесты `packages/core` независимыми от внешних абсолютных путей и восстановить доступ к уже перенесённым XML-фикстурам HTML/PDF элементов.

## Выбранный подход

1. Для `HTMLDocumentField` и `PDFDocumentField` явно указать `xmlFolder` в списке элементных фикстур:
   - `HTMLDocumentField` -> `htmlDocumentField`;
   - `PDFDocumentField` -> `pdfDocumentField`.
2. Удалить тест `registers commonObjects before reading form title from XML`, потому что он:
   - зависит от внешнего абсолютного пути;
   - проверяет поведение `ButtonGroup`/`Title`, а не конвертацию формы;
   - не должен порождать отдельную форму-фикстуру в `clientApplicationForm`.

## Почему так

Фикстуры остаются в проекте и становятся воспроизводимыми на любой машине.
Мы не меняем существующие XML-фикстуры и не добавляем новую фикстуру ради теста, который оказался не про форму как объект.
Проверка чтения `Title` у `ButtonGroup` должна жить в тестах `ButtonGroup`, если она понадобится отдельно.

## Изменения

- `packages/core/metadata/forms/elements/__tests__/fixtures.ts`:
  - добавить `xmlFolder` для двух групп HTML/PDF.
- `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`:
  - удалить тест с абсолютным путём `/Users/nikita/git/round-trip-source/...`.

## Проверка

После реализации выполнить:

```sh
pnpm --filter @nakidka/core test -- metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/clientApplicationForm/convertFromXML.test.ts
pnpm --filter @nakidka/core test
pnpm test
```

Ожидаемый результат: ранее падавшие тесты `packages/core` проходят без зависимости от `/Users/...`.
