# Prototype

Protótipo desenvolvido com **Next.js**, **MapLibre GL JS**, **Ant Design** e **JSON Server** para experimentação de funcionalidades de geoprocessamento e visualização de grafos.

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Ant Design
- MapLibre GL JS
- React Flow
- Axios
- JSON Server

## Estrutura do projeto

```
components/
├── Flow/
├── Layout/
├── Location/
├── Map/
└── Sidebar/

services/
├── api.ts
├── locationService.ts
└── endpoints.ts

types/

utils/

mocks/
└── db.json
```

## Instalação

Clone o repositório:

```bash
git clone <url-do-repositorio>
```

Instale as dependências:

```bash
npm install
```

## Executando o projeto

O projeto utiliza dois servidores:

- Next.js (frontend)
- JSON Server (API simulada)

### 1. Inicie a API

```bash
npm run server
```

A API ficará disponível em:

```
http://localhost:3001
```

### 2. Inicie o frontend

Em outro terminal:

```bash
npm run dev
```

A aplicação ficará disponível em:

```
http://localhost:3000
```

## Scripts

```bash
npm run dev       # Executa o frontend
npm run server    # Executa o JSON Server
npm run build     # Build de produção
npm run start     # Executa a build
npm run lint      # Executa o ESLint
```

## Funcionalidades implementadas

- ✅ Renderização do mapa utilizando MapLibre
- ✅ Coordenada inicial configurável
- ✅ Marcadores personalizados
- ✅ Popup nos marcadores
- ✅ Tooltip ao passar o mouse
- ✅ Cadastro de novos locais
- ✅ Persistência utilizando JSON Server
- ✅ Carregamento automático dos locais cadastrados
- ✅ Traçar linhas entre pontos (Polyline)
- ✅ Cadastro de zonas (Polygon)
- ✅ Modal com detalhes do local
- ✅ Relações entre locais
- ✅ Grafo utilizando React Flow
