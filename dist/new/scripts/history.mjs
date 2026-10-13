// Short paraphrases. The source gives rings, not exact cycle/day dates.
export const HISTORY = [
  [-226,'Desaparecimento de Sa’Al','O transporte de Sarfo e o colapso dos portais deixaram elfes e gnomos presos em Opath.',334],
  [-176,'As Quatro Cortes em Opath','Elfes e gnomos instauram as Cortes; Opath passa a ter quatro estações.',334],
  [-97,'Ausência temporária das luas','As luas ficam ausentes por três Ciclos. A Arquiteta orienta os walshies a se esconderem em Walsh.',334],
  [-1,'Deicídio e Firmamento','Após a morte da Arquiteta, os poderes de Opath encerram a guerra e fundam o Senado de Alberich.',335],
  [2,'Fundação da Universidade Arcana','A língua dos gnomos é adotada como comum e a Universidade Arcana de Opath é fundada.',335],
  [5,'Primeira Porta de Alberich','Uma Porta abre caminho para Walsh; o Senado estabelece regras para guildas.',335],
  [120,'Primeira Grande Queda','Salim é destruída por um maremoto causado pela Grande Queda; inicia a Era das Quedas.',336],
  [205,'Segunda Grande Queda','A Grande Queda destrói Törmund e inicia a diáspora dos tôras.',336],
  [264,'Nova Yutzeral','Nasce a nova Árvore da Vida de Sarfo.',336],
  [290,'Revelação dos Delírios Esquecidos','A Expedição Dourada ataca o Senado e os dragões voltam à forma dracônica; Alberich sofre perdas imensas.',336],
  [300,'Chegada dos Urodelos','Um portal para os Salões Elementais surge na Praça Portal de Alberich.',336],
  [348,'Colapso do portal dos Salões','O portal explode e os urodelos ficam presos em Opath.',336],
  [349,'Morte anunciada de Bryn','Blurgh’ta anuncia a morte de Bryn; o Senado nega reconhecimento divino à Sombra e dois senadores são encontrados mortos.',336]
].map(([year,title,description,page])=>({year,title,description:`${description}\nFonte: Livro Básico DIGITAL 1.25, p. ${page}. Dia e Ciclo não informados.`,key:`book-${year}-${page}`}));
