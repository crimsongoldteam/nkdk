# Metadata Round-Trip Cycle

## XML Barrier

XML-цикл всегда идёт раньше YAML-цикла.

Пока XML-цикл не зелёный, запрещено:

- добавлять YAML-фикстуры;
- добавлять `fromYAML.test.ts` и `toYAML.test.ts`;
- добавлять YAML-поведенческие аннотации в `rules.ts`: `defaultValueYAML`, `toYAML: false`, `fromYAML: false`, `excludeIfEqualNameYAML`, `useAsShortValueYAML`.

Разрешено сразу:

- TS-ключи свойств;
- русские имена в `yaml: "..."`;
- `itemType`;
- `itemTypePrefix`;
- XML-аннотации: `xml`, `xmlParents`, `defaultValueXML`, `defaultValueXMLRaw`, `forReferenceOnly`, `required`.

## XML Cycle

1. Напиши или сохрани round-trip блок: XML -> модель -> XML.
2. Запусти точечный тест.
3. При diff правь `rules.ts`.
4. Перезапускай цикл с round-trip.
5. После зелёного round-trip добавляй TS-фикстуры, fromXML и toXML проверки.

## YAML Cycle

1. Начинай только после полного зелёного XML-цикла.
2. Покажи пользователю черновик YAML-структуры.
3. После подтверждения добавь YAML-поведенческие аннотации.
4. Проверь YAML round-trip на уровне parsed object, не строк.
5. Добавь fromYAML и toYAML проверки.

## Эскалация

- Простые diff: отсутствующее правило, булева нормализация, явный XML-default — чини сам.
- Композиты, ссылки, неизвестные атрибуты и смысловые расхождения — спрашивай пользователя.
- Если diff принадлежит подчинённому или чужому metadataItem, остановись, назови тип, путь и фрагмент XML/YAML. Не правь чужой `rules.ts` без отдельного решения.
- После трёх итераций без прогресса остановись и покажи текущий diff пользователю.
