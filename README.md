# Expense Monitor

Aplicação web para acompanhar despesas, entradas financeiras e saldo disponível
de forma simples e organizada. O projeto foi desenvolvido com uma arquitetura
separada entre frontend e API, facilitando a manutenção e permitindo que a
aplicação evolua para uma versão desktop no futuro.

## Sobre o projeto

O Expense Monitor permite registrar os gastos do dia a dia, acompanhar as
principais categorias de despesas e controlar as fontes de entrada de dinheiro,
como salário, mesada ou outros recebimentos.

A interface foi pensada para ser confortável e acessível, com uma paleta em
tons pastel de vinho e ameixa, temas visuais, configurações de leitura e
feedback visual para as principais ações.

## Funcionalidades

- Cadastro, edição e remoção de despesas.
- Categorias, formas de pagamento e observações personalizadas.
- Cadastro e remoção de entradas financeiras.
- Cálculo do saldo disponível com base nas entradas e despesas.
- Card com a categoria de maior gasto e seu percentual do total.
- Despesas recorrentes semanais, mensais ou anuais.
- Processamento de recorrências somente mediante ação explícita do usuário.
- Modal personalizado para confirmar exclusões.
- Temas Pastel, Crepúsculo e Contraste.
- Controle de tamanho do texto e espaçamento entre linhas.
- Destaque de foco para navegação por teclado.
- Cursor ampliado e opção para reduzir animações.
- Tooltips discretos para orientar a utilização.
- Scrollbar personalizada e layout responsivo.
- Persistência dos dados em banco SQLite local.

> O processamento de uma recorrência cria um novo lançamento no sistema. Ele
> não realiza pagamentos reais em bancos, cartões ou outros serviços externos.

## Tecnologias utilizadas

### Frontend

- [Vue 3](https://vuejs.org/) para construção da interface.
- [Vite](https://vite.dev/) para desenvolvimento e build.
- [Tailwind CSS](https://tailwindcss.com/) para o sistema de estilos.
- CSS customizado para temas, acessibilidade, animações e responsividade.

### API e persistência

- [Node.js](https://nodejs.org/) para execução da API.
- Módulo nativo `node:http`, sem dependência de framework web.
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) para acesso ao
  banco SQLite.
- SQLite para armazenamento local das despesas e entradas.

## Estrutura do projeto

```text
expense_monitor/
├── monitor_api/
│   ├── data/             # Banco SQLite local (ignorado pelo Git)
│   ├── package.json
│   └── server.js         # API Node.js
├── monitor_interface/
│   ├── public/           # Recursos públicos, incluindo o logo SVG
│   ├── src/              # Aplicação Vue e estilos
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

## Como executar localmente

### Pré-requisitos

- Node.js 18 ou superior.
- npm, instalado junto com o Node.js.

### 1. Iniciar a API

Abra um terminal na raiz do projeto e execute:

```powershell
cd monitor_api
npm install
npm run dev
```

A API ficará disponível em:

```text
http://localhost:8000
```

Para executar sem o modo de observação:

```powershell
npm start
```

### 2. Iniciar a interface

Em outro terminal, na raiz do projeto:

```powershell
cd monitor_interface
npm install
npm run dev
```

A interface ficará disponível em:

```text
http://localhost:5173
```

Depois, acesse esse endereço no navegador com a API em execução.

### Configuração de portas

A API utiliza a porta `8000` por padrão. Para usar outra porta no PowerShell:

```powershell
$env:PORT=9000
npm start
```

Caso a API seja executada em outra URL, a interface pode receber a variável
`VITE_API_URL` antes do build ou da execução:

```powershell
$env:VITE_API_URL="http://localhost:9000"
npm run dev
```

## Como o projeto funciona

1. A interface Vue inicia no Vite e apresenta o dashboard ao usuário.
2. A interface faz requisições HTTP para a API Node.js.
3. A API valida os dados recebidos e grava as informações no SQLite.
4. Ao abrir o dashboard, despesas e entradas são carregadas do banco.
5. O saldo é calculado a partir do total de entradas menos o total de despesas.
6. As preferências visuais e de acessibilidade são armazenadas no
   `localStorage` do navegador.

Os dados financeiros não dependem do `localStorage`: eles ficam no banco SQLite
para continuar disponíveis depois que a interface ou a API forem reiniciadas.

## API

A API possui os seguintes recursos principais:

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verifica se a API está funcionando |
| `GET` | `/api/v1/expenses` | Lista as despesas |
| `POST` | `/api/v1/expenses` | Cria uma despesa |
| `PUT` | `/api/v1/expenses/:id` | Atualiza uma despesa |
| `DELETE` | `/api/v1/expenses/:id` | Remove uma despesa |
| `GET` | `/api/v1/income` | Lista as entradas |
| `POST` | `/api/v1/income` | Cria uma entrada |
| `DELETE` | `/api/v1/income/:id` | Remove uma entrada |
| `POST` | `/api/v1/recurring/process` | Processa recorrências vencidas |

### Banco de dados

O banco é criado automaticamente no primeiro início da API em:

```text
monitor_api/data/expense-monitor.db
```

Essa pasta e os arquivos do banco são ignorados pelo Git. Para alterar o
diretório dos dados, defina `EXPENSE_MONITOR_DATA_DIR`:

```powershell
$env:EXPENSE_MONITOR_DATA_DIR="C:\Dados\expense-monitor"
npm start
```

### Recorrências

Uma despesa recorrente possui uma periodicidade e uma próxima data de cobrança.
A API não cria lançamentos automaticamente ao:

- iniciar ou reiniciar;
- consultar despesas;
- consultar entradas;
- manter a aplicação aberta.

Para gerar os lançamentos vencidos, o usuário precisa clicar no botão
`Recorrentes` na interface. Essa decisão evita alterações inesperadas no saldo e
deixa a cobrança sob controle explícito do usuário.

## Acessibilidade e temas

O menu de acessibilidade permite ajustar:

- tema visual;
- tamanho geral do texto;
- espaçamento entre linhas;
- tamanho do cursor;
- destaque de foco;
- redução de animações.

As configurações são aplicadas imediatamente e ficam salvas no navegador para
que a preferência seja mantida entre acessos.

## Build de produção

Para gerar os arquivos estáticos da interface:

```powershell
cd monitor_interface
npm run build
```

O resultado será criado em `monitor_interface/dist/`. Para visualizar o build
localmente:

```powershell
npm run preview
```

## Futuro empacotamento como `.exe`

A aplicação foi organizada para futuramente ser distribuída como um programa
desktop usando [Electron](https://www.electronjs.org/) e
[electron-builder](https://www.electron.build/).

O empacotamento deverá:

1. gerar o build do Vue;
2. abrir `monitor_interface/dist/` em uma janela Electron;
3. iniciar a API Node.js como um processo local;
4. salvar o SQLite em `app.getPath('userData')`;
5. gerar um instalador Windows no formato `.exe`.

Essa configuração ainda não faz parte do projeto. Atualmente, a aplicação deve
ser executada com a API e a interface em processos separados.

## Status

O projeto está funcional para uso local e continua em evolução. A próxima etapa
de distribuição planejada é a integração com Electron para gerar a versão
desktop.
