# 💸 Expense Monitor

> **Simulador e monitor de despesas e saldo financeiro sem expor dados reais.**  
> Planeje seu mês: informe quanto dinheiro você tem em conta, acompanhe gastos previstos vs. já pagos e veja exatamente quanto vai sobrar no final do período.

---

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-37.x-47848F?logo=electron&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Por que o Expense Monitor?

Muitos aplicativos financeiros exigem sincronização com contas bancárias, cartões de crédito reais ou cobrança de assinaturas. O **Expense Monitor** nasceu com uma premissa diferente:

1. **Sem dinheiro real nem conexões bancárias**: você digita o valor disponível em caixa (ex: *"Tenho R$ 3.000 na conta hoje"*) e simula seus gastos com segurança e privacidade.
2. **Previsão no início do mês vs. Acompanhamento no dia a dia**: cadastre os gastos que espera ter no início do mês (aluguel, contas, alimentação, etc.) e marque como **"A Pagar"** ou **"Pago"** conforme os dias forem passando.
3. **Diferença e projeção instantânea**: saiba a qualquer momento quanto dinheiro você tem na mão **agora** e quanto **vai sobrar** depois de quitar todos os compromissos do mês.
4. **Versatilidade total**: pode ser usado como **aplicativo Web**, consumido como **API REST independente** em qualquer site externo, ou instalado como **aplicativo Desktop Windows (`.exe`)**.

---

## ✨ Funcionalidades Principais

- 💰 **Saldo em Conta & Entradas**: defina seu saldo inicial com um clique e adicione fontes extras de renda (salário, mesadas, freelances).
- 📅 **Navegação Temporal por Mês**: alterne facilmente entre meses anteriores, mês atual ou visualize todo o histórico consolidado.
- ⏳ **Status de Pagamento Ágil**: alterne despesas entre `✓ Pago` e `⏳ A Pagar` com um clique, recalculando o saldo restante e projetado na hora.
- 🔍 **Busca & Filtros Inteligentes**: pesquise gastos pelo nome ou notas, filtre por categoria ou status e ordene por valor ou data.
- 📊 **Gráficos por Categoria**: visualize a distribuição de gastos em três formatos dinâmicos: **Barras horizontais**, **Colunas verticais** e **Gráfico de Pizza** (com valores em R$ e percentuais).
- 📥 **Exportação & Backup**:
  - Exportação direta para planilha **CSV** (com formatação UTF-8 pronta para Excel e Google Planilhas).
  - Backup e restauração completos em formato **JSON**.
- 🔁 **Lançamentos Recorrentes**: controle despesas ou rendas semanais, mensais ou anuais com processamento sob demanda.
- ♿ **Acessibilidade de Primeiro Nível**:
  - 🎨 **3 Temas Visuais**: *Pastel Cozy*, *Crepúsculo (Modo Escuro)* e *Alto Contraste*.
  - 🗣️ **Assistente de Voz**: leitura de resumo financeiro em voz alta e guia auditivo por elementos.
  - 🎙️ **Comandos por Voz**: abra formulários e solicite resumos falando ao microfone.
  - 🔍 **Controle de Escala**: ajuste o tamanho do texto, espaçamento de linhas, cursor ampliado e foco reforçado para navegação por teclado.

---

## 🏗️ Arquitetura do Projeto

O repositório é organizado de forma limpa e modular:

```text
expense_monitor/
├── electron/               # Inicializador do aplicativo Desktop (Electron)
│   └── main.cjs
├── monitor_api/            # API REST nativa em Node.js (sem frameworks externos)
│   ├── data/               # Armazenamento em arquivo JSON local (ignorado pelo Git)
│   ├── server.js           # Servidor HTTP com CORS flexível e endpoints REST
│   ├── test.js             # Testes unitários nativos com node:test
│   └── package.json
├── monitor_interface/      # Frontend moderno em Vue 3 + Vite
│   ├── public/             # Logotipo SVG e recursos estáticos
│   ├── src/
│   │   ├── App.vue         # Interface completa com estado reativo e acessibilidade
│   │   ├── main.js
│   │   └── style.css       # Estilos customizados, temas e animações
│   └── package.json
├── package.json            # Scripts globais do monorepo e build do Electron
├── LICENSE                 # Licença MIT
└── README.md
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior.
- `npm` (instalado junto com o Node.js).

---

### Opção 1: Desenvolvimento Web (Recomendado)

Na pasta raiz do projeto, você pode gerenciar tudo pelos scripts globais:

1. **Instale as dependências da interface:**
   ```bash
   cd monitor_interface
   npm install
   cd ..
   ```

2. **Inicie a API (Terminal 1):**
   ```bash
   npm run dev:api
   # Disponível em: http://localhost:8000
   ```

3. **Inicie a Interface Web (Terminal 2):**
   ```bash
   npm run dev:interface
   # Disponível em: http://localhost:5173
   ```

Abra `http://localhost:5173` no seu navegador para utilizar o aplicativo!

---

### Opção 2: Aplicativo Desktop (Electron)

Você também pode abrir o Expense Monitor como um aplicativo de janela nativa para Windows:

```bash
# 1. Compilar a interface
npm run build

# 2. Iniciar o aplicativo desktop
npm start
```

Para gerar o instalador executável `.exe` (NSIS) na pasta `dist/`:
```bash
npm run dist
```

---

## 📡 Documentação da API REST

A API do Expense Monitor é extremamente leve, foi desenvolvida com módulos nativos do Node.js (`node:http`, `node:fs`, `node:crypto`) e possui suporte nativo a **CORS**, facilitando seu uso em qualquer site, backend ou aplicativo mobile.

### Configurações de Ambiente (Opcionais)

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `8000` | Porta onde a API irá escutar |
| `CORS_ORIGIN` | `*` | Origens permitidas para requisições cross-origin (ex: `https://meusite.com`) |
| `EXPENSE_MONITOR_DATA_DIR` | `./data` | Pasta onde o arquivo `expense-monitor.json` será gravado |

---

### Rotas Disponíveis

#### 1. Metadados & Saúde
- **`GET /`**: Retorna informações sobre a API e mapa de rotas.
- **`GET /health`**: Verifica o status e uptime da API (`{ "status": "ok", "uptime": 120 }`).

#### 2. Resumo Financeiro & Simulação
- **`GET /api/v1/summary?month=YYYY-MM`**
  - Retorna métricas consolidadas: saldo em conta, total de entradas, despesas pagas, despesas a pagar, saldo atual e saldo projetado no fim do período.

#### 3. Saldo em Conta
- **`GET /api/v1/balance`**: Retorna o saldo disponível configurado.
- **`PUT /api/v1/balance`**: Atualiza o saldo inicial em conta.
  ```json
  { "initialBalance": 3500.00 }
  ```

#### 4. Despesas (`/api/v1/expenses`)
- **`GET /api/v1/expenses`**: Lista despesas. Suporta os seguintes filtros:
  - `?month=2026-10`: filtra por mês.
  - `?status=paid` ou `?status=pending`: filtra por status.
  - `?category=Alimentação`: filtra por categoria.
  - `?q=mercado`: busca por termo na descrição ou notas.
  - `?sort=date_desc|date_asc|amount_desc|amount_asc`: ordenação.
- **`POST /api/v1/expenses`**: Registra uma despesa.
  ```json
  {
    "description": "Supermercado do Mês",
    "amount": 420.50,
    "category": "Alimentação",
    "paymentMethod": "Cartão de débito",
    "date": "2026-10-05",
    "status": "pending",
    "notes": "Compra quinzenal",
    "recurring": false
  }
  ```
- **`PUT /api/v1/expenses/:id`**: Atualiza uma despesa existente.
- **`PATCH /api/v1/expenses/:id/toggle-status`**: Alterna instantaneamente o status entre `paid` e `pending`.
- **`DELETE /api/v1/expenses/:id`**: Remove a despesa.

#### 5. Entradas Financeiras (`/api/v1/income`)
- **`GET /api/v1/income`**: Lista fontes de entrada (salário, freelance, etc.).
- **`POST /api/v1/income`**: Cadastra uma nova entrada.
- **`PUT /api/v1/income/:id`**: Atualiza uma entrada existente.
- **`DELETE /api/v1/income/:id`**: Remove a entrada.

#### 6. Backup & Restauração
- **`GET /api/v1/backup`**: Exporta o banco de dados completo em formato JSON.
- **`POST /api/v1/backup`**: Restaura os dados a partir de um JSON.

#### 7. Recorrências
- **`POST /api/v1/recurring/process`**: Processa cobranças e créditos recorrentes vencidos.

---

### Exemplo de Consumo com `curl`

```bash
# Consultar resumo de Outubro de 2026
curl -X GET "http://localhost:8000/api/v1/summary?month=2026-10"

# Criar uma nova despesa
curl -X POST "http://localhost:8000/api/v1/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Internet Fibra",
    "amount": 119.90,
    "category": "Moradia",
    "paymentMethod": "Pix",
    "date": "2026-10-10",
    "status": "pending",
    "notes": "Vence dia 10"
  }'

# Alternar status para pago
curl -X PATCH "http://localhost:8000/api/v1/expenses/ID_DA_DESPESA/toggle-status"
```

---

## 🧪 Testes Automatizados

A API possui uma suíte de testes unitários utilizando o executor nativo do Node.js:

```bash
npm run test:api
```

---

## 🌐 Publicação na Web

Se você deseja publicar esse projeto em um site online:

1. **Hospedar a API**:
   - Pode ser hospedada gratuitamente em plataformas como [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io) ou qualquer VPS.
   - Configure a variável `CORS_ORIGIN` com a URL do seu site frontend (ou `*`).
2. **Hospedar a Interface**:
   - Pode ser hospedada na [Vercel](https://vercel.com), [Netlify](https://netlify.com) ou [GitHub Pages](https://pages.github.com).
   - Configure a variável `VITE_API_URL` com o endereço público da sua API hospedada.

---

## 🤝 Como Contribuir

Contribuições são super bem-vindas! Se você deseja colaborar com novas funcionalidades ou melhorias:

1. Faça um Fork do projeto.
2. Crie uma branch para sua funcionalidade: `git checkout -b feature/minha-melhoria`.
3. Faça commit das suas alterações: `git commit -m 'feat: adiciona nova funcionalidade'`.
4. Envie para o GitHub: `git push origin feature/minha-melhoria`.
5. Abra um **Pull Request**.

---

## 📄 Licença

Este projeto é de código aberto sob a licença [MIT](LICENSE).
