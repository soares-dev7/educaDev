# educaDev

Aprender. Construir. Compartilhar. Evoluir.

Plataforma que conecta educação, programação, comunidade e carreira. Esta primeira versão foi construída com base na apresentação do projeto, priorizando **trilhas e desafios de programação**.

## O que já funciona

- Dashboard com progresso calculado a partir das atividades concluídas.
- Três trilhas: front-end, lógica de programação e Git/GitHub. São oito aulas com explicações, exemplos de código, exercícios para fazer no editor e referências oficiais.
- Três desafios de múltipla escolha, corrigidos no servidor, com retorno explicativo e tentativas ilimitadas.
- Progresso persistido em SQLite. Cada aula concede 30 XP; cada desafio concede 60 XP. Repetir uma atividade não duplica a pontuação.
- Busca, filtros e interface adaptada para desktop e celular.
- Perfil editável, tecnologias e projetos com links e opção de remoção.
- Publicações e curtidas locais na comunidade de demonstração.
- Oportunidades fictícias com favoritos e links para documentação oficial.

**Escopo desta versão:** protótipo funcional local, com um único perfil compartilhado e sem autenticação. Não é uma plataforma pronta para produção. Vagas e empresas são fictícias; não há candidatura ou integração com recrutadores. Não insira informações sensíveis. Os desafios não executam código enviado por usuários; os exercícios de código são realizados no editor de cada pessoa.

## Tecnologias e requisitos

- Node.js **24 ou superior** (`.nvmrc` aponta para a linha 24), com SQLite nativo.
- React, TypeScript, Vite, Express e SQLite.
- Testes de API com o runner nativo do Node e testes de navegador com Playwright.
- Fontes incluídas nas dependências; a interface não depende de serviços externos para renderizar.

Não é necessário cadastrar tokens, serviços de banco ou chaves de API.

## Desenvolvimento

Na raiz deste repositório:

```bash
npm ci
npm run dev
```

O comando inicia a interface na porta **5173**, acessível pelas interfaces de rede do ambiente, e a API na porta **3001**, vinculada ao loopback por padrão. O Vite encaminha as chamadas `/api` à API. `Ctrl+C` encerra ambos os processos. Na nuvem, use o checkout existente em `/workspace/educaDev`; não é necessário criar um worktree.

Se o ambiente não permitir gravar no cache padrão do npm, utilize:

```bash
npm ci --cache /tmp/educadev-npm-cache
```

Verificação interna da API:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

Resposta esperada: `{"status":"ok","mode":"demo"}`.

## Build e execução do resultado

```bash
npm run build
npm start
```

A API também serve a interface compilada na porta **3001**. `npm start` exige o build prévio; este modo é diferente do servidor de desenvolvimento do Vite.

Variáveis opcionais da API:

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `PORT` | `3001` | Porta da API e da interface compilada |
| `HOST` | `127.0.0.1` | Endereço de escuta; mantenha local enquanto não houver autenticação |
| `DATABASE_PATH` | `.data/educadev.sqlite` | Caminho do banco, relativo ao diretório de execução ou absoluto |

Execute os comandos na raiz do projeto. O proxy do Vite espera a API na porta 3001. Se alterar a porta da API para desenvolvimento, ajuste também o proxy em `vite.config.ts`.

O diretório `.data/` é ignorado pelo Git e guarda o progresso. Ele sobrevive ao reinício dos processos, desde que o sistema de arquivos seja preservado. Para uma nova demonstração vazia, pare o servidor e mova o banco e seus arquivos auxiliares para um backup; a próxima inicialização criará um banco novo. Não faça isso com um servidor em execução.

## Verificações

```bash
npm run build
npm test
```

Para os testes de navegador, instale o Chromium do Playwright uma vez:

```bash
npx playwright install chromium
npm run test:e2e
```

Se houver Chromium instalado no sistema, como neste ambiente na nuvem, é possível reutilizá-lo:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

O build deve existir antes dos testes de navegador. Eles iniciam um servidor temporário na porta 3101, com um banco isolado em `/tmp`, sem alterar os dados da aplicação. Os testes de API também usam bancos isolados. As capturas de desktop e celular ficam em `test-results/`.

## Organização

```text
src/                 Interface React, tipos, estilos e cliente da API
server/app.mjs       API, validações, esquema SQLite e persistência
server/content.mjs   Aulas, desafios e conteúdo demonstrativo
server/index.mjs     Inicialização e encerramento do servidor
scripts/dev.mjs      Inicialização conjunta de Vite e API
tests/               Testes de API e de navegador
docs/                Escopo e próximos passos do produto
```

As respostas dos desafios ficam somente no servidor. O navegador recebe o resultado e a explicação após enviar uma tentativa. Neste modo de estudo, sem autenticação ou sistema de avaliação formal, os pontos servem apenas para acompanhar o progresso local.

O plano de evolução está em [docs/PRODUTO.md](docs/PRODUTO.md). A apresentação orientou o escopo; ela não foi adicionada ao repositório.
