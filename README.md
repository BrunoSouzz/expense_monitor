# Expense Monitor

Monitor de despesas com frontend em Vue.js + Tailwind CSS e API em Node.js.

## Estrutura

- `monitor_api/`: API em Node.js, com endpoints para listar, criar, editar e remover despesas.
- `monitor_interface/`: aplicação Vue 3 com Vite e Tailwind CSS.

## Como executar

### API (Node.js)

```powershell
cd monitor_api
npm run dev
```

A API ficará disponível em `http://localhost:8000`.

### Interface

```powershell
cd monitor_interface
npm install
npm run dev
```

A interface ficará disponível em `http://localhost:5173`.

Para configurar outra porta no PowerShell, use `$env:PORT=9000; npm start`.
