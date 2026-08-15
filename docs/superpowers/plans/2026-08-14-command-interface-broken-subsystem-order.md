# План регистрации битого UUID в порядке подсистем

**Цель:** сохранить невосстановимую UUID-ссылку из `SubsystemsOrder` через
согласованный `!xml`, не ослабляя обычный формат YAML.

1. Добавить RED-тесты XML → YAML, YAML → XML и JSON Schema для
   `CommandInterfaceSubsystemsOrder`.
2. Создать конкретный carrier в `commonObjects/rootCommandInterface` и
   подключить его в `metadata/composition`.
3. Добавить аномалию в `.agents/xml-anomalies.md`.
4. Запустить целевые тесты, type-check и поиск дублей.
5. Закоммитить слой и повторить round-trip Tester вне песочницы.

