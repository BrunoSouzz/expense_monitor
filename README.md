# 💸 Expense Monitor

<div align="center">

> **Simulador e monitor de despesas e projeção financeira pessoal, 100% de código aberto, com foco total em privacidade e acessibilidade.**  
> Planeje seu mês: declare quanto dinheiro você tem em conta, controle despesas previstas vs. quitadas e saiba com precisão cirúrgica quanto vai sobrar no final do mês.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Electron](https://img.shields.io/badge/Electron-37.x-47848F?logo=electron&logoColor=white)](https://www.electronjs.org)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20Desktop-blue.svg)](#-aplicativo-desktop-windows-estilo-discord)

</div>

---

## 📌 Sumário

- [🎯 A Filosofia do Projeto](#-a-filosofia-do-projeto)
- [✨ Funcionalidades](#-funcionalidades)
- [🏗️ Arquitetura do Repositório](#️-arquitetura-do-repositório)
- [🚀 Começando Rapidamente](#-começando-rapidamente)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
  - [Opção 1: Rodando na Web](#opção-1-rodando-na-web)
  - [Opção 2: Rodando como Aplicativo Desktop](#opção-2-rodando-como-aplicativo-desktop)
- [📦 Compilando o Instalador Executável (.exe)](#-compilando-o-instalador-executável-exe)
- [📡 Documentação da API REST](#-documentação-da-api-rest)
- [🧪 Testes Automatizados](#-testes-automatizados)
- [🌐 Guia de Deploy Web](#-guia-de-deploy-web)
- [🤝 Como Contribuir (Open Source)](#-como-contribuir-open-source)
- [🗺️ Roadmap & Ideias para a Comunidade](#️-roadmap--ideias-para-a-comunidade)
- [📄 Licença](#-licença)

---

## 🎯 A Filosofia do Projeto

A grande maioria dos aplicativos de controle financeiro hoje sofre de pelo menos um destes problemas:
1. **Invasão de privacidade**: Exigem login social obrigatório, sincronização forçada de senhas bancárias (Open Finance) e armazenam seus hábitos de consumo em servidores de terceiros.
2. **Complexidade excessiva**: Dezenas de telas, planos pagos recorrentes (*freemium*) e recursos desnecessários para quem só quer saber quanto tem na conta e quanto vai sobrar.

O **Expense Monitor** foi construído sob uma premissa aberta e libertadora:

- 🔒 **Zero Conexões Bancárias & Máxima Privacidade**: Não há integração com dinheiro real ou credenciais bancárias. Você simplesmente informa quanto dinheiro tem em caixa (ex: *"Tenho R$ 2.500 hoje"*) e simula seus gastos em um ambiente seguro e isolado.
- 📆 **Previsão vs. Acompanhamento no Dia a Dia**: Cadastre todos os gastos esperados no início do mês (aluguel, contas, alimentação, assinaturas). Conforme os dias passarem, marque como `✓ Pago` ou mantenha `⏳ A Pagar`.
- 📊 **Projeção em Tempo Real**: Saiba a todo momento quanto dinheiro você tem na mão **agora** e quanto **vai sobrar no final do período**.
- 🖥️ **Tecnologia Híbrida Web + Desktop**: Use direto no navegador ou instale como aplicativo nativo para computador com instalador `.exe` (usando a mesma arquitetura do **Discord** e **Slack** via **Electron**).
- ♿ **Acessibilidade Universal Inclusiva**: Projetado desde o dia zero com assistente de voz nativo, comandos falados, temas de alto contraste e redimensionamento visual dinâmico.

---

## ✨ Funcionalidades

### 💰 Gestão Financeira Direta
- **Saldo em Caixa & Fontes de Renda**: Defina o saldo inicial com um clique e registre entradas extras (salário, comissões, mesadas, freelances).
- **Status Instantâneo**: Alterne despesas entre `✓ Pago` e `⏳ A Pagar` com um único clique, recalculando instantaneamente o saldo líquido atual e a sobra projetada.
- **Navegação Temporal por Mês**: Visualize meses anteriores, o mês vigente ou ative o modo histórico consolidado (*Todo o Período*).
- **Lançamentos Recorrentes**: Controle despesas e receitas periódicas (semanais, mensais ou anuais).

### 🔍 Busca, Filtros e Gráficos
- **Filtros Ágeis**: Busque despesas em tempo real por nome, categoria ou notas; filtre por status de quitação e ordene por data ou valor.
- **Visualização Gráfica Dinâmica**: Alterne entre 3 tipos de gráficos para visualizar seus gastos por categoria:
  - 📊 **Barras Horizontais**
  - 📶 **Colunas Verticais**
  - 🥧 **Gráfico de Pizza** interativo com percentuais e valores em R$

### 💾 Privacidade & Portabilidade de Dados
- **Exportação CSV UTF-8**: Baixe suas despesas em planilha compatível diretamente com Microsoft Excel, Google Planilhas e LibreOffice Calc.
- **Backup e Restauração em JSON**: Exporte todos os seus dados em um arquivo seguro e restaure em qualquer computador sem perdas.
- **Armazenamento 100% Local**: Os dados ficam salvos localmente no disco do usuário em arquivos JSON limpos.

### ♿ Acessibilidade de Primeiro Nível
- **3 Temas Visuais**:
  - 🌸 *Pastel Cozy*: Tema suave, aconchegante e descansado para os olhos.
  - 🌙 *Crepúsculo*: Modo escuro moderno para baixa luminosidade.
  - ⚡ *Alto Contraste*: Cores vibrantes com máxima legibilidade e bordas reforçadas.
- **Assistente de Voz Integrado**: Leitura em voz alta do resumo financeiro atual e guia auditivo por elementos focados.
- **Comandos por Voz via Microfone**: Fale comandos como *"adicionar despesa"*, *"abrir configurações"* ou *"ler resumo"*.
- **Controles Tipográficos**: Ajuste de tamanho de fonte, espaçamento ampliado de parágrafos, cursor grande e realce de foco por teclado.

---

## 🏗️ Arquitetura do Repositório

O projeto é estruturado como um monorepo modular e desacoplado:

```text
expense_monitor/
├── electron/               # Inicializador do aplicativo Desktop Windows
│   └── main.cjs            # Gerenciamento de ciclo de vida, janelas e API interna
├── monitor_api/            # API REST nativa em Node.js (sem frameworks pesados)
│   ├── data/               # Banco de dados local em formato JSON (ignorado pelo Git)
│   ├── server.js           # Servidor HTTP nativo com CORS, rotas e CRUD completo
│   ├── test.js             # Bateria de testes unitários com node:test
│   └── package.json
├── monitor_interface/      # Frontend reativo em Vue 3 + Tailwind CSS + Vite
│   ├── public/             # Logotipo SVG e recursos estáticos
│   ├── src/
│   │   ├── App.vue         # Painel completo com estado reativo e acessibilidade
│   │   ├── main.js
│   │   └── style.css       # Estilos customizados, temas e animações
│   ├── vite.config.js      # Configuração com suporte a caminhos relativos
│   └── package.json
├── dist/                   # Artefatos compilados (.exe para Windows e executáveis descompactados)
├── package.json            # Scripts globais de orquestração do monorepo
├── LICENSE                 # Licença de código aberto MIT
└── README.md
```

---

## 🚀 Começando Rapidamente

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão **18.x** ou superior.
- `npm` (instalado automaticamente com o Node.js) ou `yarn` / `pnpm`.

---

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/expense_monitor.git
   cd expense_monitor
   ```

2. Instale as dependências da raiz e dos módulos:
   ```bash
   npm install
   npm --prefix monitor_interface install
   npm --prefix monitor_api install
   ```

---

### Opção 1: Rodando na Web

Para desenvolver ou utilizar no navegador:

1. **Inicie o servidor de API (Terminal 1):**
   ```bash
   npm run dev:api
   # Disponível em: http://localhost:8000
   ```

2. **Inicie a interface web (Terminal 2):**
   ```bash
   npm run dev:interface
   # Disponível em: http://localhost:5173
   ```

Abra seu navegador em **`http://localhost:5173`**.

---

### Opção 2: Rodando como Aplicativo Desktop

Você pode testar a experiência desktop nativa em tempo de desenvolvimento:

```bash
# 1. Compila os arquivos estáticos da interface
npm run build

# 2. Inicia o aplicativo Electron
npm start
```

---

## 📦 Compilando o Instalador Executável (.exe)

O Expense Monitor utiliza o **Electron Builder** para gerar instaladores nativos para Windows (NSIS), exatamente como o instalador do Discord:

```bash
npm run dist
```

Ao término da compilação, você encontrará os seguintes executáveis na pasta `dist/`:

| Arquivo | Descrição |
| :--- | :--- |
| **`dist/Expense Monitor Setup 1.0.0.exe`** | **Instalador Oficial**: cria assistente de instalação com opção de criar atalhos na Área de Trabalho e no Menu Iniciar. |
| **`dist/win-unpacked/Expense Monitor.exe`** | **Versão Portátil**: pode ser executada diretamente sem necessidade de instalação prévia. |

### 🛠️ Otimizações Desktop Implementadas:
- **Janela Limpa**: Barra de menus de navegador desativada para visual imersivo e minimalista.
- **Instância Única (`Single Instance Lock`)**: Impede que múltiplas janelas abram acidentalmente, focando na janela já ativa.
- **Inicialização Fluida (`ready-to-show`)**: Sem flashes brancos ao iniciar o executável.
- **Isolamento de Links Externos**: URLs externas são redirecionadas para o navegador padrão do sistema operacional.

---

## 📡 Documentação da API REST

A API do Expense Monitor é extremamente rápida, construída apenas com os módulos nativos do Node.js (`node:http`, `node:fs`, `node:crypto`), sem dependências externas de frameworks pesados.

### Variáveis de Ambiente (Opcionais)

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `8000` | Porta onde a API irá escutar requisições |
| `CORS_ORIGIN` | `*` | Origens autorizadas para CORS |
| `EXPENSE_MONITOR_DATA_DIR` | `./data` | Diretório onde o arquivo de dados JSON é persistido |

---

### Principais Endpoints

#### 1. Verificação de Saúde
- **`GET /health`**
  ```json
  { "status": "ok", "uptime": 45.2 }
  ```

#### 2. Resumo Financeiro Consolidado
- **`GET /api/v1/summary?month=YYYY-MM`**
  - Retorna o saldo disponível, total de entradas, total pago, total a pagar e o saldo final projetado.

#### 3. Saldo em Conta
- **`GET /api/v1/balance`**
- **`PUT /api/v1/balance`**
  ```json
  { "initialBalance": 3500.00 }
  ```

#### 4. Despesas (`/api/v1/expenses`)
- **`GET /api/v1/expenses`**: Lista despesas cadastradas. Suporta filtros:
  - `?month=YYYY-MM`
  - `?status=paid` ou `?status=pending`
  - `?category=Alimentação`
  - `?q=mercado`
  - `?sort=date_desc|date_asc|amount_desc|amount_asc`
- **`POST /api/v1/expenses`**: Cadastra nova despesa:
  ```json
  {
    "description": "Conta de Energia",
    "amount": 185.40,
    "category": "Moradia",
    "paymentMethod": "Pix",
    "date": "2026-10-15",
    "status": "pending",
    "notes": "Vencimento dia 15",
    "recurring": false
  }
  ```
- **`PATCH /api/v1/expenses/:id/toggle-status`**: Alterna o status entre `paid` e `pending` com um clique.
- **`PUT /api/v1/expenses/:id`**: Edita uma despesa.
- **`DELETE /api/v1/expenses/:id`**: Remove uma despesa.

#### 5. Entradas Financeiras (`/api/v1/income`)
- **`GET /api/v1/income`**: Lista rendas e créditos.
- **`POST /api/v1/income`**: Registra uma nova renda.
- **`DELETE /api/v1/income/:id`**: Remove a renda.

#### 6. Backup e Restauração
- **`GET /api/v1/backup`**: Exporta o snapshot JSON completo do banco de dados.
- **`POST /api/v1/backup`**: Restaura os dados substituindo pelo JSON fornecido.

---

## 🧪 Testes Automatizados

O projeto conta com suíte de testes unitários nativa do Node.js:

```bash
npm run test:api
```

Os testes cobrem cálculo de saldo, CRUD de despesas, alternância de status, persistência e métricas de resumo.

---

## 🌐 Guia de Deploy Web

Se você deseja disponibilizar sua própria instância do Expense Monitor na internet:

1. **Deploy da API (Backend)**:
   - Pode ser hospedada gratuitamente ou sob demanda no [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io) ou em qualquer servidor Linux/VPS.
   - Configure a variável `CORS_ORIGIN` com o domínio da sua interface web.

2. **Deploy da Interface (Frontend)**:
   - Pode ser hospedada na [Vercel](https://vercel.com), [Netlify](https://netlify.com) ou [Cloudflare Pages](https://pages.cloudflare.com).
   - Configure a variável `VITE_API_URL` apontando para o endereço público da sua API (ex: `https://api-expense.seudominio.com`).

---

## 🤝 Como Contribuir (Open Source)

Contribuições da comunidade são o coração dos projetos abertos! Queremos tornar este o gerenciador financeiro pessoal mais acessível, seguro e agradável de usar.

### Passo a Passo para Contribuir:

1. **Faça um Fork** do projeto no GitHub.
2. **Crie uma Branch** descritiva para sua contribuição:
   ```bash
   git checkout -b feature/grafico-mensal-comparativo
   ```
3. **Faça seus commits** seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: adiciona suporte a exportação em PDF`
   - `fix: corrige formatação monetária em moedas estrangeiras`
   - `docs: atualiza documentação dos endpoints da API`
   - `test: adiciona casos de teste para lançamentos recorrentes`
4. **Execute os testes** antes de enviar:
   ```bash
   npm run test:api
   npm run build:interface
   ```
5. **Faça o Push** para o seu repositório:
   ```bash
   git push origin feature/grafico-mensal-comparativo
   ```
6. Abra um **Pull Request** detalhando as motivações e as alterações realizadas.

---

## 🗺️ Roadmap & Ideias para a Comunidade

Tem vontade de contribuir mas não sabe por onde começar? Aqui estão algumas das ideias planejadas:

- [ ] 🐧 **Suporte a compilação Linux**: Adicionar alvos `.AppImage` e `.deb` no `electron-builder`.
- [ ] 🍏 **Suporte a macOS**: Configurar alvos `.dmg` para arquiteturas Intel e Apple Silicon.
- [ ] 📄 **Exportação de Relatório PDF**: Gerar extrato consolidado do mês em formato pronto para impressão.
- [ ] 🌍 **Internacionalização (i18n)**: Suporte dinâmico a múltiplos idiomas (Inglês, Espanhol e Português).
- [ ] 💱 **Multi-moedas**: Configuração de moeda padrão (BRL, USD, EUR, etc.).
- [ ] 📱 **PWA (Progressive Web App)**: Permitir instalação no Android e iOS direto pelo navegador.

---

## 📄 Licença

Este projeto é distribuído sob os termos da licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.

<div align="center">

Desenvolvido com carinho e focado na privacidade financeira de todos. Se você gostou, deixe uma ⭐ no repositório!

</div>
