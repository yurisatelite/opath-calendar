# Changelog

## 0.4.1 — 14/10/2026 — Arraste estável e iluminação simplificada

- Painel manual não é mais repelido por áreas vazias dos contêineres de controles. Evita obstáculos automaticamente apenas antes de uma posição manual ou depois de ↺.
- Slider e botões internos usam intervalos de 30 minutos. O painel aguarda todas as gravações pendentes antes de redesenhar, evitando o retorno ao horário anterior com latência.
- Retirado seletor de controlador. Mantidos botão de ativar/desativar por cena, aviso de SmallTime ativo e configurações de amanhecer/anoitecer/escuridão.
- 37 testes; teste de interação inclui latência artificial e arraste até a borda esquerda.
- Propostas visuais de estações e diário ainda não implementadas no módulo; aguardam aprovação. Dados e API QUEDAÇO v1 preservados.

## 0.4.0 — 14/10/2026 — Relógio nativo e interface limpa

- SmallTime deixa de ser obrigatório. Relógio nativo com sol/lua arrastável, hora do mundo, ±10 minutos e ±1 hora; jogadores somente leitura.
- Iluminação opt-in por cena, amanhecer/anoitecer graduais e limites configuráveis. Somente a Mestra ativa escreve, respeitando o bloqueio da cena. SmallTime ativo tem prioridade para evitar dois controladores.
- Painel independente com data e luas, detecção de obstáculos (incluindo Nexus), arrastar/posição local e reposicionamento automático. Recolhimento quando não há espaço livre completo.
- Filtros recolhidos, controles de hora em aba própria, histórico/viagem no tempo recolhidos e seções vazias removidas do painel do dia.
- ID `quedaco-calendario`, `contractVersion: 1`. Capabilities: `calendar`, `currentDate`, `currentTime`, `advanceTime`, `daylightControl`, `campaignDiary`, `moonPhases`, `holidays`, `timelines`, `placeNotes`.
- Métodos públicos novos: `getClockStatus`, `setClockMode`, `setDaylightConfig`, `setSceneDaylight`, `setTimeOfDay`. Métodos anteriores preservados: `open`, `getStatus`, `getCurrentDate`, `getCurrentTime`, `worldTimeToDate`, `dateToWorldTime`, `advanceTime`, `setDate`, `calibrate`, `getSmallTimeStatus`, `setSmallTimeSceneLink`, `getMoonPhases`, `getHolidays`, `lunarAge`, `getTimelines`, `switchTimeline`, `getDayRecords`, `linkJournalToDay`, `saveLocationRecord`, `listPlaceNotes`, `openRecord`.
- Integrações opcionais: SmallTime (compatibilidade), QUEDAÇO principal, Jornal da Queda e Explorador (APIs públicas). Sem qualquer outro módulo: calendário, relógio/iluminação, diário, luas, feriados e linhas do tempo continuam disponíveis.
- Implementação própria inspirada no SmallTime; sem importação de arquivos de outro módulo ou cópia integral. Nenhum documento de Jornal/Explorador foi alterado.
- 36 testes automatizados e interação em navegador com slider/iluminação, jogador, arrastar e Nexus simulado em 375px. Teste em mundo Foundry real ainda necessário.

## 0.3.3 — 14/10/2026 — Ajustes compactos de interface

- Data e luas acima do SmallTime, limitadas à largura do relógio e à tela, acompanhando seu movimento.
- Feriados indicados somente pela barra branca inferior de 3 pixels, sem fundo ou número vermelho. Contorno continua exclusivo do dia atual.
- API QUEDAÇO v1, integrações e dados da campanha preservados; sem novas capabilities ou métodos.

## 0.3.2 — 14/10/2026 — Integração QUEDAÇO concluída

- ID: `quedaco-calendario`; título `QUEDAÇO - Calendário`; `contractVersion: 1`.
- Capabilities: `calendar`, `currentDate`, `currentTime`, `advanceTime`, `daylightControl` (SmallTime ativo), `campaignDiary`, `moonPhases`, `holidays`, `timelines`, `placeNotes`. Cada uma corresponde a um método real.
- Métodos: `open`, `getStatus`, `getCurrentDate`, `getCurrentTime`, `worldTimeToDate`, `dateToWorldTime`, `advanceTime`, `setDate`, `calibrate`, `getSmallTimeStatus`, `setSmallTimeSceneLink`, `getMoonPhases`, `getHolidays`, `lunarAge`, `getTimelines`, `switchTimeline`, `getDayRecords`, `linkJournalToDay`, `saveLocationRecord`, `listPlaceNotes`, `openRecord`.
- Registro público `quedaco:register` verificado depois do ready; API e capabilities congeladas.
- Integrações opcionais reconhecidas por API: QUEDAÇO principal, Jornal da Queda (newspaper/open/getAccessibleJournals), Explorador (registros por localidade). Declaradas em relationships.modules e recommends. SmallTime permanece obrigatório na instalação.
- Sem outros QUEDAÇO: calendário, horário, diário, luas, feriados e linhas do tempo disponíveis. getStatus é leitura pura; não invoca APIs de outros módulos.
- Consultas públicas de registros retornam somente resumos autorizados. Jogadores não recebem snapshots de linhas do tempo inativas.
- Migração do ID antigo preserva diários, páginas, permissões, configurações e datas; não altera o relógio nem documentos do Jornal da Queda. Migração repetida não sobrescreve os dados novos.
- Nova consulta getCurrentTime e atualização da interface quando outra API QUEDAÇO é registrada.
- Manifesto canônico: quedaco-calendario.json. O module.json antigo permanece como pacote de transição, sem iniciar um segundo calendário.
- 31 testes passaram. Validação com servidor Foundry e jogadores reais permanece necessária após instalação/migração.

## 0.3.1

- `listPlaceNotes` devolve `dateLabel` formatado para o QUEDAÇO - Explorador.

## 0.3.0 — Protocolo de Integração QUEDAÇO

- Novo id `quedaco-calendario` (antes `opath-calendar`); pacote de transição `opath-calendar` mantido. Os dados antigos (configurações e diários) são copiados pela Mestra na primeira entrada, sem apagar os originais.
- `contractVersion`: 1. Capabilities: `calendar`, `currentDate`, `currentTime`, `advanceTime`, `daylightControl` (só com SmallTime), `campaignDiary`, `moonPhases`, `holidays`, `timelines`.
- Métodos públicos: `open`, `getStatus`, `getCurrentDate`, `getMoonPhases`, `getHolidays`, `getTimelines`, `switchTimeline`, `getDayRecords`, `linkJournalToDay`, `saveLocationRecord`, `listPlaceNotes`, `openRecord` (+ relógio: avançar/definir dia, para a Mestra).
- Integrações opcionais reconhecidas: SmallTime (obrigatório para o relógio), QUEDAÇO - Jornal da Queda (via `getAccessibleJournals`), QUEDAÇO - Explorador (notas com local por `saveLocationRecord`/`listPlaceNotes`).
- Sem outros módulos: calendário, luas, feriados, diário e linhas do tempo continuam funcionando.
- Hooks: `quedaco:register`, `quedaco-calendario:ready`, `quedaco-calendario:dateChanged`.

## 0.2.2 — 13/10/2026

- Contorno reservado ao dia atual; seleção e hover não acrescentam contorno.
- Barra inferior dos feriados branca, mantendo a espessura de 3 pixels.
- Indicador compacto ao lado do SmallTime, sem ocupar a faixa superior do FA Nexus.
- Nome do dia e número explícito na data compacta; posição acompanha movimento do relógio e redimensionamento.

## 0.2.1 — 13/10/2026

- Luas redesenhadas em SVG, com diâmetro igual em todas as fases, independentemente da fonte.
- Miniaturas de Lápis e Varmah na barra de data junto ao SmallTime, atualizadas com o dia atual.
- Nome e fase de cada lua disponíveis no tooltip; ausência representada por contorno pontilhado.
- Conferência visual e teste de atualização das miniaturas; inclusão do SVG no pacote.

## 0.2.0 — 13/10/2026

- Nome atualizado para QUEDAÇO - Calendário, com ID e manifesto preservados.
- Aba Meu diário: registros individuais por data, localidade, clima, texto e imagem.
- Journals/páginas/Items anexados por arraste ou UUID e integração com edições acessíveis do Jornal da Queda.
- Publicação, compartilhamento com jogadores escolhidos e despublicação sem apagar originais.
- Papel nos dias com registros, títulos clicáveis na caixa à direita e leitura coletiva da edição do dia.
- Luas maiores, feriados destacados/clicáveis e notificação só para a Mestra na mudança do dia.
- Lixeira com duas confirmações, restauração e bloqueio de exclusão direta de diários gerenciados.
- Linhas do tempo para missões no passado e retorno ao instante guardado da campanha principal.
- Treze históricos do livro, privados à Mestra, com precisão de Anel quando o dia é desconhecido.
- Migração dos registros 0.1.0 preservando os Journals originais.
- Vinte e quatro testes automatizados e conferência visual das telas lunar, solar e diário.

Conferência real de publicação/revogação multijogador e iluminação ainda pendente.

## 0.1.0 — 13/10/2026

- Primeira versão alfa para Foundry 13, com SmallTime como dependência.
- Calendários lunar/solar, ciclos de 15 dias, duas luas e estações de 120 dias.
- Dezessete eventos oficiais e cadastro de registros com permissões de diário.
- Relógio compartilhado com SmallTime e vínculo de iluminação por cena.
- Calibração de data sem alterar a hora; API e 13 testes automatizados.
- Canal de instalação e atualização pelo manifesto hospedado no GitHub.

Validação completa de cena e multijogador ainda pendente.
