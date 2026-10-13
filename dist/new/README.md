# QUEDAÇO - Calendário — 0.2.2

Calendário e diário de campanha para Foundry VTT 13. Requer **SmallTime**.
Integração opcional com **QUEDAÇO - Jornal da Queda**. O ID continua
`opath-calendar` para preservar a instalação, os dados e o canal de atualização.

Manifesto permanente:
<https://github.com/yurisatelite/opath-calendar/releases/latest/download/module.json>.

## Instalar / atualizar
Use Configuração → Módulos adicionais → Instalar módulo com o endereço acima,
ou a atualização normal na lista de módulos. Recarregue os clientes. A Mestra deve
entrar primeiro para preparar os diários individuais. A versão 0.1.0 é migrada
automaticamente; os Journals originais são preservados como cópias privadas com
referência ao novo registro. Não altere o ID do módulo.

O botão **QUEDAÇO - Calendário** está nos controles de Notas e junto ao SmallTime.
A barra compacta fica ao lado do relógio, liberando a área acima dele usada pelo
FA Nexus. Ela mostra o nome do dia, número, Ciclo, Anel e as duas luas.
No calendário, apenas o dia atual recebe contorno; feriados têm uma barra branca
de 3 pixels na base, e a seleção de consulta usa apenas fundo destacado.

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

A iluminação continua sob o SmallTime: ambos usam `game.time.worldTime`, e o
calendário apenas altera o tempo e o vínculo `smalltime.darkness-link`. Ele não
escreve o nível de escuridão da cena. As luas são exibidas no calendário, sem
substituir a lua única do slider ou as configurações de luz do SmallTime.

## API e testes
```js
const api = game.modules.get('opath-calendar').api;
api.open();
api.getCurrentDate();
api.getDayRecords();
api.getTimelines();
await api.switchTimeline('main'); // só Mestra
await api.linkJournalToDay('JournalEntry.ID', {location:'Alberich',weather:'Chuva'});
```

`npm ci` / `npm test`: 24 testes com calendário, permissões, publicação/revogação,
migração, lixeira com duas confirmações, notificações, rascunhos, anexos, integração
do jornal e ida/volta no tempo. Os testes usam substitutos de documentos Foundry.
As telas lunar, solar e diário também foram renderizadas para conferência visual.

Validação real com Mestra/jogadores e SmallTime permanece necessária: salvar um
rascunho como jogador, publicar para dois destinatários, despublicar, verificar
permissões, usar a lixeira e trocar linhas do tempo em um mundo de teste.
