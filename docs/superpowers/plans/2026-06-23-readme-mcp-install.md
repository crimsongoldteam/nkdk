# README MCP Install Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the obsolete CLI installation section in README with MCP server connection instructions for AI agents.

**Architecture:** This is a documentation-only change in `README.md`. The new section describes NKDK as a local MCP server, shows repository setup, gives a JSON agent configuration example, and lists first-version MCP tools. No runtime code changes are needed.

**Tech Stack:** Markdown, shell snippets, JSON snippet.

---

## File Structure

- Modify: `README.md`
  - Responsibility: user-facing installation/connection instructions.

---

### Task 1: Replace README Installation Section

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the old CLI installation section**

Replace the whole section starting at `## Установка` with:

~~~md
## Подключение MCP-сервера

NKDK подключается к агенту как локальный MCP-сервер.

Склонируйте репозиторий и установите зависимости:

```sh
git clone https://github.com/crimsongoldteam/nkdk.git
cd nkdk
pnpm install
```

Укажите агенту команду запуска сервера:

```json
{
  "mcpServers": {
    "nkdk": {
      "command": "/path/to/nkdk/packages/mcp/bin/nkdk-mcp"
    }
  }
}
```

Замените `/path/to/nkdk` на абсолютный путь к локальному репозиторию.

После подключения агенту доступны MCP tools:

- `nkdk.get_schema` — получить схему YAML-файла или краткую сводку по ней;
- `nkdk.validate_project` — проверить YAML-проект и получить diagnostics;
- `nkdk.import_from_xml` — импортировать XML-выгрузку 1С в YAML;
- `nkdk.sync_to_xml` — синхронизировать YAML-проект обратно в XML.
~~~

- [ ] **Step 2: Verify old CLI install text is gone**

Run:

```bash
rg -n "@nakidka/cli|Установите CLI-пакет|pnpm add -D @nakidka/cli|CLI-команда" README.md
```

Expected: no matches and exit code 1.

- [ ] **Step 3: Verify MCP connection text is present**

Run:

```bash
rg -n "Подключение MCP-сервера|packages/mcp/bin/nkdk-mcp|nkdk.get_schema|nkdk.sync_to_xml" README.md
```

Expected: matches for the new heading, command path, and tools.

- [ ] **Step 4: Verify Markdown diff has no whitespace errors**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Commit README update**

Run:

```bash
git add README.md docs/superpowers/plans/2026-06-23-readme-mcp-install.md
git commit -m "docs: :memo: обновить подключение MCP в README"
```

Expected: one commit containing the README update and this implementation plan.

---

## Self-Review

- Spec coverage: replaces CLI install block, avoids npm package wording, includes local MCP server setup, JSON config example, and first-version tool list.
- Placeholder scan: no TODO/TBD placeholders.
- Scope check: documentation-only change; no code, tests, or runtime behavior changes.
