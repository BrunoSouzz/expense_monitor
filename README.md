# Expense Monitor

Aplicação web para acompanhar despesas, entradas financeiras e saldo disponível
de forma simples e organizada. O projeto foi desenvolvido com uma arquitetura
separada entre frontend e API, facilitando a manutenção e permitindo que a
aplicação evolua para uma versão desktop no futuro.

## Sobre o projeto

O Expense Monitor permite registrar os gastos do dia a dia, acompanhar as
principais categorias de despesas e controlar as fontes de entrada de dinheiro,
como salário, mesada ou outros recebimentos.

A interface foi pensada para ser confortável e acessível, com uma paleta Warm &
Cozy em creme, lavanda, pêssego e verde sálvia, temas visuais, configurações de
leitura e feedback visual para as principais ações.

## Funcionalidades

- Cadastro, edição e remoção de despesas.
- Categorias, formas de pagamento e observações personalizadas.
- Cadastro e remoção de entradas financeiras.
- Cálculo do saldo disponível com base nas entradas e despesas.
- Gráfico de gastos por categoria com visualizações de barras, colunas e pizza.
- Percentuais e valores proporcionais para facilitar a comparação entre categorias.
- Despesas recorrentes semanais, mensais ou anuais.
- Fontes de entrada como salário, mesada e freelance.
- Processamento manual de despesas recorrentes vencidas pelo botão `Recorrentes`.
- Ícones SVG para os cards de despesas e saldo, além do logo e favicon.
- Modal personalizado para confirmar exclusões.
- Temas Pastel, Crepúsculo e Contraste.
- Controle de tamanho do texto e espaçamento entre linhas.
- Assistente de voz opcional para leitura do resumo e comandos básicos.
- Guia de voz que identifica controles e áreas ao passar o cursor ou receber foco.
- Destaque de foco para navegação por teclado.
- Cursor ampliado e opção para reduzir animações.
- Tooltips discretos para orientar a utilização.
- Scrollbar personalizada e layout responsivo.
- Persistência dos dados em banco SQLite local.

> O processamento de uma recorrência cria um novo lançamento no sistema. A
> despesa recorrente é somada novamente aos gastos e reduz o saldo disponível.
> O sistema não realiza pagamentos reais em bancos, cartões ou outros serviços
> externos.

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

- Node.js 22.13 ou superior (a API usa o SQLite nativo do Node, sem dependências).
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

## Versão para Windows (.exe)

A pasta `monitor_desktop` empacota a API e a interface em um aplicativo Electron:
ele sobe a API em `127.0.0.1` numa porta livre e abre a interface numa janela própria.
Os dados ficam em `%APPDATA%\Expense Monitor\data`, fora do programa.

```powershell
cd monitor_desktop
npm install
npm start      # abre o app para testar
npm run dist   # gera os .exe em monitor_desktop\release (instalador e portátil)
```

Também é possível gerar os `.exe` sem instalar nada: o workflow
`.github/workflows/build-windows.yml` roda em **Actions → Build Windows app → Run workflow**
(ou ao criar uma tag `v*`) e publica os arquivos como artefato.

Para levar dados da versão web, copie `monitor_api/data/expense-monitor.db` para a pasta de dados do app com ele fechado.

## Como o projeto funciona

1. A interface Vue inicia no Vite e apresenta o dashboard ao usuário.
2. A interface faz requisições HTTP para a API Node.js.
3. A API valida os dados recebidos e grava as informações no SQLite.
4. Ao abrir o dashboard, despesas e entradas são carregadas do banco. Recorrências
   não são processadas sem uma ação explícita do usuário.
5. O saldo é calculado a partir do total de entradas menos o total de despesas.
6. O gráfico agrupa as despesas por categoria e permite alternar entre barras,
   colunas e pizza.
7. As preferências visuais, de acessibilidade e do tipo de gráfico são armazenadas no
   `localStorage` do navegador.

Os dados financeiros não dependem do `localStorage`: eles ficam no banco SQLite
para continuar disponíveis depois que a interface ou a API forem reiniciadas.

## API

A API possui os seguintes recursos principais:

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verifica se a API está funcionando |
| `GET` | `/api/v1/expenses?month=AAAA-MM` | Lista as despesas (do mês, se informado) |
| `POST` | `/api/v1/expenses` | Cria uma despesa |
| `PUT` | `/api/v1/expenses/:id` | Atualiza uma despesa |
| `DELETE` | `/api/v1/expenses/:id` | Remove uma despesa |
| `GET` | `/api/v1/income` | Lista as entradas |
| `POST` | `/api/v1/income` | Cria uma entrada |
| `PUT` | `/api/v1/income/:id` | Atualiza uma entrada |
| `DELETE` | `/api/v1/income/:id` | Remove uma entrada |
| `GET` | `/api/v1/summary?month=AAAA-MM` | Gasto do mês, por categoria, e saldo (valores calculados em centavos) |
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

Despesas recorrentes possuem uma periodicidade e uma próxima data de cobrança.
As opções disponíveis são:

- semanal;
- mensal;
- anual.

Quando uma despesa vence, o botão `Recorrentes` pode criar uma nova cobrança não
recorrente, mantendo o lançamento original como modelo para a próxima cobrança.
O processamento apenas registra o lançamento no sistema; não realiza pagamentos
reais em bancos, cartões ou serviços externos.

As recorrências não são processadas automaticamente:

- não são processadas ao iniciar ou reiniciar a API;
- não são processadas ao consultar despesas ou entradas;
- não existe temporizador executando cobranças em segundo plano;
- são processadas somente pelo botão `Recorrentes` na interface.

Essa decisão evita alterações inesperadas no saldo e mantém a cobrança sob
controle explícito do usuário.

## Acessibilidade e temas

O menu de acessibilidade permite ajustar:

- tema visual;
- tamanho geral do texto;
- espaçamento entre linhas;
- tamanho do cursor;
- destaque de foco;
- redução de animações.
- assistente de voz para leitura, orientação e comandos.

As configurações são aplicadas imediatamente e ficam salvas no navegador para
que a preferência seja mantida entre acessos.

### Gráficos de despesas

O card `Gastos por categoria` oferece três visualizações:

- **Barras:** comparação horizontal, com preenchimento proporcional e valores
  percentuais;
- **Colunas:** comparação vertical com linha de base, linhas de referência,
  categorias e percentuais;
- **Pizza:** gráfico circular segmentado com fatias proporcionais, separadores e
  percentuais dentro do gráfico.

As quatro categorias de maior valor são exibidas no gráfico. A preferência
selecionada é mantida no navegador.

### Paleta visual

O tema principal usa a identidade Warm & Cozy:

- Warm Cream: `#FDFBF7`;
- Lavanda Soft: `#CDB4DB`;
- Pêssego Pastel: `#FFD6A5`;
- Verde Sálvia: `#C1E1C1`;
- Charcoal Quente: `#292524`.

Os temas Crepúsculo e Contraste usam variações da mesma identidade, com ajustes
de fundo, bordas e contraste para preservar a legibilidade.

### Assistente de voz

O menu de acessibilidade possui um assistente de voz opcional. Com ele ativado,
é possível:

- ouvir um resumo financeiro;
- iniciar o formulário dizendo “nova despesa”;
- abrir as preferências dizendo “acessibilidade”;
- interromper a leitura dizendo “parar”.

A leitura usa a API nativa de síntese de voz do navegador. Os comandos usam a
API de reconhecimento de voz quando disponível, normalmente no Chrome e no
Edge. O navegador pode solicitar permissão para usar o microfone. Caso o
reconhecimento não seja compatível, a leitura em voz alta ainda poderá ser
utilizada e leitores de tela tradicionais continuarão funcionando normalmente.

Com o assistente de voz ativado, o sistema anuncia somente por áudio uma
descrição breve do elemento sob o cursor ou em foco, incluindo sua finalidade
e o conteúdo principal. Não é exibida nenhuma janela flutuante. A mensagem é
reproduzida após uma pequena pausa para evitar interromper a navegação a cada
movimento rápido do cursor.

#### Campos de formulário

O guia por voz também reconhece caixas de texto e controles de formulário,
incluindo:

- descrição, observações e nome da entrada;
- valor numérico;
- data;
- categoria, forma de pagamento e periodicidade;
- tamanho do texto e demais opções de acessibilidade.

Ao entrar em um campo, o assistente informa o rótulo, o tipo do controle, o
valor atual ou exemplo indicado no placeholder e, nos campos de seleção, as
opções disponíveis.

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
