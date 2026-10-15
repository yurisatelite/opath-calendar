# QUEDAÇO - Calendário — 0.4.1

Calendário, relógio nativo e diário de campanha para Foundry VTT 13. **SmallTime é opcional**.
Integrações opcionais com **QUEDAÇO principal**, **QUEDAÇO - Jornal da Queda** e
**QUEDAÇO - Explorador**. O ID atual é `quedaco-calendario`; os dados do antigo
`opath-calendar` são migrados sem apagar os originais.

Manifesto permanente:
<https://github.com/yurisatelite/opath-calendar/releases/latest/download/quedaco-calendario.json>.

## Instalar / atualizar
Se você já usa `quedaco-calendario`, execute a atualização normal e recarregue.
Se ainda usa `opath-calendar`, instale o novo manifesto em Configuração → Módulos
adicionais → Instalar módulo. No mundo, desative **Calendário (transição)** / o
calendário antigo e ative **QUEDAÇO - Calendário**. Entre como Mestra
primeiro: configurações, linhas do tempo, diários e permissões anteriores são
copiados para o novo namespace. O relógio global permanece intacto na migração.
Os dados e flags antigos não são removidos. Não desinstale o antigo antes de
conferir o resultado. Faça um backup do mundo antes da primeira migração.

O endereço antigo `.../latest/download/module.json` continua entregando somente
o pacote de transição `opath-calendar`; ele não instala o novo ID automaticamente.

O botão **QUEDAÇO - Calendário** está nos controles de Notas e no painel compacto.
O painel reúne data, duas luas e relógio nativo, sem ocupar uma coluna lateral.
Evita os retângulos visíveis de Nexus, jogadores, controles e janelas; pode ser
arrastado por ⠿, com posição manual respeitada até os limites da tela, salva por usuário/navegador. ↺ retoma o posicionamento
automático. Se não houver espaço para o painel completo, recolhe para um atalho.
Filtros ficam recolhidos, e horário/iluminação têm aba própria. Histórico e viagem
no tempo ficam em uma seção recolhida do painel do dia.
No calendário, apenas o dia atual recebe contorno; feriados têm uma barra branca
de 3 pixels na base, sem fundo ou texto vermelho. A seleção de consulta usa apenas fundo destacado.

## Calendário
- Lunar: 16 ciclos de 15 dias / 240 dias. Solar: 32 ciclos / 480 dias.
- A alternância mostra o mesmo instante, sem duplicar o tempo.
- Estações de 120 dias continuam entre Anéis lunares. Primeira estação configurável.
- Luas em SVG com o mesmo diâmetro em todas as fases, também na barra junto ao
  SmallTime. Passe o cursor para ver o nome e a fase de cada lua; a ausência é
  representada por contorno pontilhado. São indicadores lunares, sem cálculo
  automático de altura/horário da maré.
- Feriados destacados. Clique no dia para ver a caixa à direita,
  com títulos clicáveis, feriados e **Abrir todas as anotações do dia**.
- O papelzinho indica anotações visíveis para aquela pessoa. Registros privados de
  outra pessoa não revelam títulos, quantidade ou marcadores.
- Os filtros de localidade, clima e autor atuam nas anotações visíveis.
- Somente a Mestra define data, hora e linha do tempo. **Definir como dia atual**
  usa o dia selecionado e mantém a hora atual.
- A Mestra recebe uma notificação de feriado ao entrar em um novo dia com evento,
  sem repetir o aviso a cada atualização do relógio.

## Relógio nativo e iluminação

1. Atualize, desative SmallTime em Gerenciar módulos e recarregue o mundo.
2. O painel nativo aparece com data/luas, sol/lua arrastável em intervalos de meia hora e botões de ±30 minutos / ±1 hora.
3. Abra **Relógio e iluminação** e clique **Ativar iluminação nesta cena**.
4. Configure amanhecer/anoitecer e escuridão diurna/noturna. As transições são graduais.

Arrastar o sol/lua escolhe entre 00:00 e 23:30 dentro do mesmo dia; os botões podem cruzar
a meia-noite. Apenas a Mestra altera o tempo. Jogadores veem o painel em leitura.
As horas permanecem de 24h. Não há progressão automática em tempo real nesta versão.

A iluminação é opt-in por cena, usando `flags.quedaco-calendario.daylight` e
`environment.darknessLevel` no Foundry 13. Só a Mestra ativa responsável escreve na
cena ativa, e o bloqueio de escuridão da cena é respeitado. Desligar preserva a
última iluminação; não restaura nem apaga configurações de luz. Os limites e
horários solares são configurações do mundo, o vínculo é individual por cena.

Com SmallTime ativo, ele tem prioridade exclusiva de iluminação; nosso painel
mostra apenas data/luas e evita o relógio externo. Não escondemos nem alteramos
o painel ou flags do SmallTime. Para o modo nativo, desative SmallTime; não precisa
desinstalá-lo. A interface traz apenas o botão de ativar/desativar por cena e um
aviso quando SmallTime está ativo. Amanhecer, anoitecer e níveis de escuridão permanecem.
A API de seleção de modo continua disponível para compatibilidade com integrações antigas.

Implementação própria inspirada na interação do SmallTime, não uma cópia integral
do módulo. As duas luas continuam como indicadores de fase: não calculam a maré
nem ajustam automaticamente a escuridão noturna nesta versão.

## Meu diário
Cada jogador recebe um Journal particular, com páginas para seus registros.
A Mestra acessa os registros; os outros jogadores só acessam versões compartilhadas.

Clique **Escrever neste dia**, escolha título, localidade, clima e texto. É possível
anexar imagem pelo seletor de arquivos, arrastar Journals/páginas/Items ou informar
um UUID. A página do Journal também mostra a data. Use **Voltar ao calendário** para
consultar outros dias; o rascunho é conservado quando o relógio atualiza a janela.

Visibilidades:
- **Só eu e a Mestra**: privado.
- **Jogadores escolhidos**: leitura para as pessoas marcadas.
- **Todos os jogadores**: público, com indicador no dia.

Para despublicar, escolha **Só eu e a Mestra** e salve. Editores e compartilhamento
usam as permissões nativas dos Journals. A Mestra precisa estar conectada para
publicar, despublicar ou atualizar uma publicação. Rascunhos privados podem ser
salvos sem a Mestra se o diário já foi preparado.

A leitura coletiva é uma “edição do dia”, reunindo os registros acessíveis e os
feriados. Compartilhar uma referência não concede acesso ao documento referenciado.

## Proteção contra exclusão acidental
A ação **Lixeira** exige duas confirmações distintas, retira a publicação e mantém
o texto. O autor ou a Mestra pode restaurar pela aba **Lixeira / restaurar**.
Exclusão direta das páginas gerenciadas e dos diários particulares é bloqueada
pelos hooks do módulo. Essa proteção exige que o módulo esteja ativo; não substitui
os backups do mundo. A atualização não apaga os registros 0.1.0.

## Jornal da Queda: edição de cada dia
O diário permite anexar o Journal de uma edição já comprada/liberada pelo outro
módulo, vinculando-a à data e à linha do tempo. A seleção não lista o arquivo
privado da Mestra e mantém o fluxo de compra/liberação do Jornal da Queda.
Na “edição do dia”, a referência pode ser aberta pelo título.

O botão **Jornal da Queda** abre o módulo original. Também é possível arrastar o
Item de jornal do inventário ou um Journal autorizado para o registro.
Não foi criada uma edição comercial automaticamente nem alterado o outro módulo:
a edição diária do calendário organiza o log e suas referências.

## Viagem no tempo
No formulário **Data e viagem no tempo**, informe um Anel negativo (ex.: -730),
Ciclo, dia, hora e nome da missão. Clique **Criar missão nesta data e entrar**.

A campanha principal guarda o seu instante e marco. A missão tem seu próprio
instante e registros. Ao selecionar **Campanha principal**, ela retoma exatamente
o ponto guardado. Ao retornar à missão, ela também retoma de onde parou.

A troca altera o relógio global do Foundry usado pelo SmallTime. Portanto, módulos
que dependem de worldTime também percebem o salto. As linhas do tempo separam
datas e diários; não são uma cópia de fichas, cenas ou efeitos de outros módulos.
Durante a troca, o calendário restaura a linha anterior se a mudança do relógio
falhar. Só a Mestra cria e troca linhas do tempo.

## Históricos privados
**Importar históricos do livro** cria 13 registros históricos só para a Mestra,
na linha do tempo ativa, sem duplicar importações. A seção histórica aparece pelo
Anel lunar correspondente, inclusive no modo solar. Quando o livro só informa o
Anel, o registro diz **dia e Ciclo não informados**; ele não inventa um dia exato
nem marca um papelzinho em todos os dias daquele Anel.

Fonte: Livro Básico DIGITAL 1.25, p. 334–336. As descrições são paráfrases curtas.
A imagem fornecida tem 17 eventos de calendário; seus nomes/dias foram preservados.
Lápis e Varmah seguem ativas. Sa’Al é o planeta desaparecido referido no livro;
“Va’Al” é a grafia da imagem no feriado Repouso.

## Implementação e permissões
Os originais são páginas de Journals privados com proprietário individual.
Publicações são cópias somente de leitura, sincronizadas pela Mestra através das
queries nativas do Foundry 13. A query aceita apenas o UUID de uma página já salva:
ela valida a origem no mapa de diários, deriva o autor do Journal de origem,
valida referências e usa a visibilidade persistida. Não aceita conteúdo arbitrário,
um autor declarado pelo solicitante nem comandos para alterar o relógio.

O compartilhamento não exige liberar criação global de Journals aos jogadores.
Retirar uma publicação revoga os acessos anteriores sem apagar o original.
Hooks de alterações de páginas sincronizam edições feitas no Journal nativo quando
a Mestra responsável está conectada. Prefira o editor do calendário para gerenciar
texto, metadados e visibilidade em conjunto.

O relógio usa `game.time.worldTime`, com ou sem SmallTime. A API legada
`setSmallTimeSceneLink` permanece para integrações antigas; o novo controlador
usa `setSceneDaylight` e nunca modifica flags de iluminação de outro módulo.

## API e testes

Contrato publicado no `ready`: `family: "quedaco"`, `contractVersion: 1`,
`id: "quedaco-calendario"`, título e versão do manifesto. O descritor e suas
capabilities são congelados, com emissão de `quedaco:register`.

Capabilities: `calendar`, `currentDate`, `currentTime`, `advanceTime`,
`daylightControl` (nativo, sem depender de SmallTime), `campaignDiary`, `moonPhases`,
`holidays`, `timelines`, `placeNotes`. Só são anunciadas quando seus métodos existem.

Métodos públicos: `open`, `getStatus`, `getCurrentDate`, `getCurrentTime`,
`worldTimeToDate`, `dateToWorldTime`, `advanceTime`, `setDate`, `calibrate`,
`getSmallTimeStatus`, `setSmallTimeSceneLink`, `getMoonPhases`, `getHolidays`,
`lunarAge`, `getTimelines`, `switchTimeline`, `getDayRecords`, `linkJournalToDay`,
`saveLocationRecord`, `listPlaceNotes`, `openRecord`, `getClockStatus`, `setClockMode`,
`setDaylightConfig`, `setSceneDaylight`, `setTimeOfDay`.

`getStatus()` é somente leitura e retorna disponibilidade das integrações e do
diário. Não cria documentos nem aciona métodos de outro módulo. As consultas de
registros devolvem resumos autorizados, sem o texto integral das notas. Jogadores
só recebem a linha do tempo ativa; a Mestra pode consultar as demais. Métodos de
tempo/linhas do tempo exigem Mestra e métodos de diário validam autoria/permissões.

O Jornal da Queda é reconhecido por sua API pública `family: "quedaco"`, contrato
1 e capability `newspaper`; suas referências usam `getAccessibleJournals()`.
O Explorador usa `saveLocationRecord`, `listPlaceNotes` (com `dateLabel`) e
`openRecord`. Ausência dessas APIs é normal. Nenhum arquivo é importado de outro
módulo e nenhum documento do Jornal/Explorador é modificado pelo calendário.
As integrações opcionais estão em `relationships.modules`, também declaradas em
`relationships.recommends` para a compatibilidade nativa do Foundry 13. SmallTime
é opcional; nenhum módulo é requisito obrigatório.
Sem outros módulos, calendário, relógio, iluminação, diário, luas, feriados e linhas do tempo
continuam disponíveis.
```js
const api = game.modules.get('quedaco-calendario').api;
api.open();
api.getCurrentDate();
api.getDayRecords();
api.getTimelines();
await api.switchTimeline('main'); // só Mestra
await api.linkJournalToDay('JournalEntry.ID', {location:'Alberich',weather:'Chuva'});
```

`npm ci` / `npm test`: 37 testes com calendário, contrato, iluminação nativa, permissões, publicação/revogação,
migração, lixeira com duas confirmações, notificações, rascunhos, anexos, integração
do jornal e ida/volta no tempo. Os testes usam substitutos de documentos Foundry.
As telas lunar, solar e diário também foram renderizadas para conferência visual.
`tools/preview-clock.mjs` testa interação real no navegador com substitutos Foundry;
exige Playwright (ou `QUEDACO_PLAYWRIGHT_DIR` apontando para a instalação).

Validação real com Mestra/jogadores permanece necessária: testar iluminação com
SmallTime desativado, depois compatibilidade com ele ativo, salvar um
rascunho como jogador, publicar para dois destinatários, despublicar, verificar
permissões, usar a lixeira e trocar linhas do tempo em um mundo de teste.
