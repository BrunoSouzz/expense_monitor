# 🤝 Guia de Contribuição - Expense Monitor

Obrigado pelo seu interesse em contribuir com o **Expense Monitor**! 🎉  
Este projeto é de código aberto e recebe com entusiasmo qualquer tipo de contribuição, seja reportando bugs, melhorando a documentação, propondo novas ideias de design ou desenvolvendo código.

---

## 🧭 Código de Conduta

Ao participar deste projeto, você concorda em manter um ambiente acolhedor, respeitoso e livre de assédio para todas as pessoas, independentemente de experiência, identidade de gênero, orientação sexual, deficiência, etnia ou religião.

---

## 🛠️ Como Posso Ajudar?

### 1. Reportando Bugs
- Verifique nas **Issues do GitHub** se o problema já foi reportado anteriormente.
- Se não foi, abra uma nova issue descrevendo:
  - O que você tentou fazer.
  - O que esperava que acontecesse.
  - O que realmente aconteceu (com prints ou mensagens de erro, se possível).
  - Seu ambiente (navegador, versão do Node.js, versão do Windows/Linux).

### 2. Sugerindo Novas Funcionalidades
- Abra uma issue com a tag `enhancement` detalhando o caso de uso e como a novidade ajudaria outros usuários.

### 3. Escrevendo Código
Para enviar alterações de código:

1. **Faça um Fork** do projeto para a sua conta no GitHub.
2. Clone o seu fork localmente:
   ```bash
   git clone https://github.com/SEU-USUARIO/expense_monitor.git
   cd expense_monitor
   ```
3. Instale as dependências:
   ```bash
   npm install
   npm --prefix monitor_interface install
   npm --prefix monitor_api install
   ```
4. Crie uma branch para a sua alteração:
   ```bash
   git checkout -b feature/minha-melhoria
   # ou
   git checkout -b fix/correcao-bug
   ```
5. Faça suas alterações seguindo o padrão de código existente:
   - Use o padrão **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
6. Rode os testes e a compilação para garantir que nada foi quebrado:
   ```bash
   npm run test:api
   npm run build:interface
   ```
7. Envie a branch para o seu repositório remoto:
   ```bash
   git push origin feature/minha-melhoria
   ```
8. Abra um **Pull Request** no repositório principal explicando suas alterações!

---

## 📋 Padrão de Commits

Seguimos a convenção [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):

- `feat:` Nova funcionalidade para o usuário final.
- `fix:` Correção de um bug.
- `docs:` Alterações na documentação (README, comentários, etc.).
- `style:` Formatação de código sem alteração lógica (espaços, ponto e vírgula).
- `refactor:` Refatoração de código sem adicionar funcionalidade nem corrigir bug.
- `test:` Adição ou modificação de testes automatizados.
- `chore:` Atualizações de tarefas de build, pacotes ou scripts.

---

Muito obrigado por ajudar a construir um gerenciador financeiro seguro, privado e acessível para todos! 💜
