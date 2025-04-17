# @deguto/query-param-builder

> **GitHub Description:** Type-safe decorator & builder to generate dynamic SQL WHERE clauses from annotated TypeScript DTOs.

## 📖 Overview

`query-param-builder` fornece um **decorator** `@QueryParam` e uma classe `ParametroQueryBuilder` para facilitar a construção dinâmica de condições SQL (cláusulas WHERE) e seus _replacements_ a partir de DTOs anotados em TypeScript.

### 🎯 Features

- **Decorator `@QueryParam`**: Anote propriedades do seu DTO com condições SQL e chaves de _replacement_.
- **ParametroQueryBuilder**: Agrupa condições por alias e gera o SQL final com _replacements_.
- Transporte simples e modular para projetos Node.js + TypeScript.

## 🚀 Installation

```bash
npm i @deguto/query-param-builder
# ou, se for scoped:
npm i @deguto/query-param-builder --save
```

## ⚙️ Usage

### 1. Defina seu DTO

```ts
import { QueryParam } from '@deguto/query-param-builder';

export class AnalisePrevisaoInput {
  @QueryParam(`a.cod_campo1 IN (:campo1)`, 'campo1', 'main')
  @QueryParam(`a.cod_campo1 IN (:campo1)`, 'campo1', 'contexto2')
  campo1?: string[];

  @QueryParam(`TRUNC(C.data) >= TO_DATE(:dataInicial, 'YYYY-MM-DD')`, 'dataInicial', 'contexto2')
  dataInicial?: string;

  @QueryParam(`TRUNC(C.data) <= TO_DATE(:dataFinal, 'YYYY-MM-DD')`, 'dataFinal', 'contexto2')
  dataFinal?: string;
}
```

### 2. Gere as condições SQL

```ts
import { ParametroQueryBuilder } from '@deguto/query-param-builder';

const input = new AnalisePrevisaoInput();
input.campo1 = ['0111', '0222'];
input.dataInicial = '2025-04-01';
input.dataFinal = '2025-04-30';

const builder = new ParametroQueryBuilder(input);

// Obtém string com condições para o alias 'contexto2'
const whereClause = builder.getConditions('contexto2');
// Obtém objeto de replacements para passar ao Sequelize, TypeORM, etc.
const replacements = builder.getReplacements('contexto2');

```

## 🏗️ Development

1. Clone o repositório:
   ```bash
git clone https://github.com/d3gut0/query-param-builder.git
cd query-param-builder
```
2. Instale dependências:
   ```bash
npm install
```
3. Build:
   ```bash
npm run build
```
4. Teste local com `npm link`:
   ```bash
npm link
# no projeto consumidor:
npm link @deguto/query-param-builder
```

## 📚 API Reference

### `@QueryParam(condition: string, replacementKey: string, alias: string)`
- **condition**: string da condição SQL (ex.: `a.id = :id`).
- **replacementKey**: chave usada no objeto de replacements.
- **alias**: contexto/alias onde a condição será aplicada.

### `class ParametroQueryBuilder`
- **constructor(input: object)**: recebe instância do DTO.
- **getConditions(alias: string): string**: retorna string de condições SQL concatenadas.
- **getReplacements(alias: string): Record<string, any>**: retorna objeto de replacements.

## 📝 License

Este projeto está licenciado sob a [MIT License](LICENSE).

# query-param-builder
