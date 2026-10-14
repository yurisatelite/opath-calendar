# Changelog

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
