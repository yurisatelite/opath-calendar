# Calendário de Opath — Skyfall (0.1.0)

Primeira versão para Foundry VTT 13. Requer SmallTime ativo. Não depende do Simple
Calendar, não fornece sua API e não instala pontes de compatibilidade.

## Instalação local

Manifesto permanente para instalar e atualizar pelo Foundry:
<https://github.com/yurisatelite/opath-calendar/releases/latest/download/module.json>.
Em Configuração → Módulos adicionais → Instalar módulo, cole esse endereço.

Extraia o ZIP em `Data/modules/opath-calendar/`, de forma que `module.json` fique
diretamente nessa pasta. Reinicie o Foundry, habilite SmallTime e Calendário de
Opath no mundo. Abra pelo botão **Calendário de Opath** no grupo de Notas ou pelo
novo botão de data acrescentado ao widget do SmallTime.

O ZIP também permite instalação manual. O manifesto permanente oferece as
atualizações publicadas no GitHub. Gerar o pacote não altera dados de um mundo.

## Uso

- A Mestra pode avançar/recuar horas e dias e definir uma data e hora.
- **Calibrar data** associa a data escolhida ao dia atual sem alterar a hora. Use-o
  no primeiro acesso para definir o Anel da campanha. Sem calibração, tempo zero
  significa dia 1 de Fogo do Anel 0 D.F.
- A navegação do Anel e a seleção de dias são apenas consulta.
- A alternância lunar/solar mostra o mesmo instante. Lunar: 16 ciclos/240 dias.
  Solar: 32 ciclos/480 dias, com os mesmos nomes nas duas voltas.
- As estações duram 120 dias e continuam de um Anel lunar ao próximo. A ordem
  inicial é Primavera, Verão, Outono, Inverno; a primeira estação é ajustável nas
  configurações para a região da campanha. A escolha regional é uma convenção da
  mesa, não uma tabela astronômica extraída do livro.
- Os 17 feriados/eventos da imagem já estão cadastrados. Repetem a cada 240 dias,
  portanto aparecem duas vezes em um Anel solar.
- Registros da campanha podem ser únicos ou repetir a cada 240/480 dias. Só a
  Mestra cadastra, edita ou exclui registros nesta versão.
- Registros são JournalEntries com dados em flags e permissões nativas do Foundry.
  Registros privados têm acesso padrão `NONE`; públicos, `OBSERVER`. Jogadores
  só veem os documentos que têm permissão para observar. Sua coleção de diários
  continuará contendo esses registros enquanto o módulo estiver desativado.

## SmallTime e iluminação

Ambos usam exclusivamente `game.time.worldTime`. O módulo chama
`game.time.advance()` e escuta `updateWorldTime`; SmallTime recebe o mesmo evento
e controla a escuridão da cena conforme suas configurações de nascer/pôr do sol,
intensidade e transição. O calendário não escreve valores de escuridão da cena.

O botão **Vincular iluminação** altera apenas o flag `smalltime.darkness-link` da
cena aberta, igual ao vínculo configurável no SmallTime. O efeito acompanha as
próximas mudanças do relógio. Pequenos ajustes finos de luminosidade permanecem nas
configurações do SmallTime.

O botão de data de Opath no widget é independente da bandeja de data nativa do
SmallTime. Não substituímos o calendário global do sistema, métodos internos do
SmallTime ou APIs de outros módulos. O botão pode exigir uma adaptação futura se o
SmallTime mudar o ID de sua janela ou seu hook de renderização. A sincronização do
relógio continua funcionando mesmo sem o botão.

As duas luas aparecem no calendário. A lua única do slider do SmallTime continua
com a configuração nativa dele; esta versão não mistura as duas luas na iluminação
nem sincroniza o desenho desse slider. Os ícones de Varmah são uma representação
simplificada dos símbolos da imagem, não um modelo físico de iluminação lunar.

## Fontes e interpretação

Livro Básico DIGITAL 1.25, páginas impressas 67, 331, 334 e 336; imagem
`E:/RPG/OPATH/calendario.jfif`. Feriados são paráfrases curtas da imagem. Nenhuma
página, imagem ou extração integral do livro é distribuída no pacote.

Lápis (azul) tem período de 5 dias e Varmah (vermelha), 15 dias. O desaparecimento
histórico que aprisionou os elfos é de **Sa’Al**, descrito no livro como planeta
(226 A.F., p. 334). A imagem usa **Va’Al** no feriado Repouso; a grafia do feriado
foi preservada. Não se desativou Lápis nem Varmah por esse evento. Tenedris é a
ausência periódica de Lápis no quinto dia da Lua.

Anéis A.F./D.F. são exibidos. O marco zero é uma convenção técnica calibrável; esta
versão mantém ano zero, sem inventar uma regra de supressão dele.

A idade permanece lunar: 18 Anéis = 4.320 dias ≈ 11,83 anos terrestres; 27 Anéis =
6.480 dias ≈ 17,74 anos. Os dois modos não duplicam a idade.

Código SmallTime conferido na tag **2.0.5**:
<https://github.com/unsoluble/smalltime/blob/2.0.5/scripts/helpers.mjs> e
<https://github.com/unsoluble/smalltime/blob/2.0.5/scripts/smalltime-app.mjs>.

## API e validação

```js
const calendar = game.modules.get('opath-calendar').api;
calendar.open();
calendar.getCurrentDate();
calendar.getMoonPhases();
await calendar.advanceTime(86400); // apenas GM
await calendar.calibrate({year: 349, cycle: 1, day: 1});
Hooks.on('opath-calendar:dateChanged', date => console.log(date));
```

`npm ci` e `npm test` verificam conversões, viradas, estações, recorrência, permissões,
calibração, sincronização do relógio e renderização do template. O runtime não
precisa de npm nem das dependências de desenvolvimento.

Verificação manual necessária em um mundo de teste Foundry 13 com SmallTime:

1. Calibrar data e confirmar que SmallTime conserva a hora.
2. Vincular uma cena e avançar manhã/noite pelo calendário; verificar a iluminação.
3. Avançar pela meia-noite usando SmallTime e confirmar a virada no calendário.
4. Trocar lunar/solar e confirmar relógio e cena sem salto.
5. Conectar um jogador: sem controles da Mestra e sem registros privados.
6. Reabrir/recarregar SmallTime: só um botão Opath, calendário acessível.

Sem um mundo Foundry em execução conectado a esta tarefa, o teste real de cena e
multijogador permanece pendente. Esta versão deve ser tratada como alfa local.
