# Produto e escopo inicial

## Objetivo

Conectar a dúvida de quem está começando à prática e, depois, à construção de um portfólio e à busca de oportunidades. Base: apresentação educaDev fornecida pelo usuário. Prioridade confirmada: **trilhas e desafios de programação**.

## Fluxo principal implementado

1. A pessoa encontra uma trilha na visão geral, na busca ou no catálogo.
2. Abre uma aula, lê a explicação e explora o exemplo no seu próprio editor.
3. Marca a aula como concluída e recebe 30 XP uma única vez.
4. Navega para a aula seguinte ou pratica com um desafio de múltipla escolha.
5. Recebe uma explicação ao acertar e pode tentar novamente ao errar. O primeiro acerto concede 60 XP.
6. Retoma o aprendizado após fechar a página ou reiniciar o servidor, com o progresso salvo em SQLite.

O catálogo inicial inclui oito aulas e três desafios. É conteúdo introdutório para validar o produto, não uma formação profissional completa. Os tempos exibidos incluem a prática sugerida e são estimativas.

## Fluxos complementares

- Referências externas para documentação oficial.
- Perfil com apresentação, tecnologias, GitHub e projetos.
- Registro local de publicações e curtidas.
- Catálogo de vagas fictícias para experimentar a navegação e os favoritos.

Não há envio de candidaturas, recrutamento real, publicação pública de perfis ou comunicação entre pessoas. A comunidade funciona no mesmo perfil local, sem contas separadas.

## Decisões técnicas

- React e TypeScript organizam uma interface responsiva com navegação por fragmento de URL.
- Express expõe uma API JSON e serve o build do Vite quando executado em modo compilado.
- SQLite nativo no Node 24 simplifica a execução inicial sem provisionar outro serviço. Os dados alterados ficam no banco; aulas e desafios são versionados no servidor.
- Identificadores únicos no banco tornam conclusões e acertos idempotentes.
- A correção dos desafios ocorre na API; o catálogo enviado ao cliente não inclui gabaritos.
- Links são validados como HTTP(S), sem credenciais na URL. SQL usa parâmetros; conteúdo de usuário é renderizado como texto pelo React.
- O servidor vincula-se ao loopback por padrão. Esta versão não oferece autenticação, autorização ou controles suficientes para uma implantação pública.

## Próximas entregas sugeridas

### 1. Evoluir o aprendizado

- Validar textos e exercícios com iniciantes e revisão pedagógica.
- Aumentar o catálogo de trilhas, com pré-requisitos, objetivos e critérios de conclusão.
- Incluir questionários por aula, vídeos acessíveis e acompanhamento de projetos práticos.
- Criar uma área administrativa para curadoria e publicação de conteúdo.

### 2. Preparar uma plataforma com usuários

- Autenticação, recuperação de acesso e autorização por perfil.
- Progresso, publicações e portfólio separados por usuário.
- Políticas de privacidade, retenção, exclusão de dados e moderação.
- Migrações do banco, backups, limites de requisições, observabilidade e testes de recuperação.
- Avaliar PostgreSQL caso sejam necessárias múltiplas instâncias e maior concorrência.

### 3. Ampliar comunidade e carreira

- Comentários, denúncias e moderação antes de abrir interações públicas.
- Perfis públicos opcionais e publicação de oportunidades por empresas verificadas.
- Candidaturas e acompanhamento de processos seletivos, com consentimento e regras de acesso.
- Conteúdos de currículo, entrevistas e organização de portfólio.
- Notícias e atualização profissional com fontes e curadoria.

Um editor que execute código de usuários exige isolamento e limites de recursos próprios; ele não deve ser adicionado como execução direta na API existente.

## Critérios verificados nesta entrega

- Build com verificação de tipos.
- Testes de API para catálogo, correção de desafios, pontuação, validação de entradas, perfil, projetos, publicações, favoritos, erros e persistência após reinício.
- Testes de navegador para layout móvel, navegação, busca, conclusão e retomada de aula, erro e acerto em desafio, edição de perfil, inclusão/remoção de projeto, publicações e favoritos.

Publicação, autenticação, carga simultânea e avaliação pedagógica não foram validadas nesta entrega.
