import type { Verb, TenseKey } from '../types'

type Forms = Partial<Record<TenseKey, string[]>>

const END = {
  ar: {
    presente: ['o', 'as', 'a', 'amos', 'am'],
    perfeito: ['ei', 'aste', 'ou', 'ámos', 'aram'],
    imperfeito: ['ava', 'avas', 'ava', 'ávamos', 'avam'],
  },
  er: {
    presente: ['o', 'es', 'e', 'emos', 'em'],
    perfeito: ['i', 'este', 'eu', 'emos', 'eram'],
    imperfeito: ['ia', 'ias', 'ia', 'íamos', 'iam'],
  },
  ir: {
    presente: ['o', 'es', 'e', 'imos', 'em'],
    perfeito: ['i', 'iste', 'iu', 'imos', 'iram'],
    imperfeito: ['ia', 'ias', 'ia', 'íamos', 'iam'],
  },
} as const

const FUT = ['ei', 'ás', 'á', 'emos', 'ão']
const COND = ['ia', 'ias', 'ia', 'íamos', 'iam']

/** -ar spelling change before e: c→qu, g→gu, ç→c */
function arFix(stem: string): string {
  if (stem.endsWith('ç')) return stem.slice(0, -1) + 'c'
  if (stem.endsWith('c')) return stem.slice(0, -1) + 'qu'
  if (stem.endsWith('g')) return stem.slice(0, -1) + 'gu'
  return stem
}

/** presente do conjuntivo from the eu-form of the presente indicativo */
function presConjOf(presenteEu: string, cls: 'ar' | 'er' | 'ir'): string[] {
  const stem = presenteEu.slice(0, -1)
  if (cls === 'ar') {
    const s = arFix(stem)
    return [s + 'e', s + 'es', s + 'e', s + 'emos', s + 'em']
  }
  return [stem + 'a', stem + 'as', stem + 'a', stem + 'amos', stem + 'am']
}

/** imperfeito/futuro do conjuntivo from the eles-form of the pretérito perfeito (always ends -ram) */
function impFutConjOf(elesPerfeito: string, cls: 'ar' | 'er' | 'ir'): { impConj: string[]; futConj: string[] } {
  const stem2 = elesPerfeito.slice(0, -3)
  const accentChar = cls === 'ar' ? 'á' : cls === 'er' ? 'ê' : 'í'
  const accented = stem2.slice(0, -1) + accentChar
  return {
    impConj: [stem2 + 'sse', stem2 + 'sses', stem2 + 'sse', accented + 'ssemos', stem2 + 'ssem'],
    futConj: [stem2 + 'r', stem2 + 'res', stem2 + 'r', stem2 + 'rmos', stem2 + 'rem'],
  }
}

function build(inf: string, over: Forms): Forms {
  const cls = inf.slice(-2) as 'ar' | 'er' | 'ir'
  const stem = inf.slice(0, -2)
  const e = END[cls]
  const presente = over.presente ?? e.presente.map((x) => stem + x)
  const perfeito =
    over.perfeito ??
    e.perfeito.map((x, i) => (cls === 'ar' && i === 0 ? arFix(stem) : stem) + x)
  const imperfeito = over.imperfeito ?? e.imperfeito.map((x) => stem + x)
  const futuro = over.futuro ?? FUT.map((x) => inf + x)
  const condicional = over.condicional ?? COND.map((x) => inf + x)
  let imperativo = over.imperativo
  if (!imperativo) {
    let s = presente[0].slice(0, -1)
    let vow = 'a'
    if (cls === 'ar') {
      s = arFix(s)
      vow = 'e'
    }
    imperativo = [presente[2], s + vow, s + vow + 'mos', s + vow + 'm']
  }
  const presConj = over.presConj ?? presConjOf(presente[0], cls)
  const derived = impFutConjOf(perfeito[4], cls)
  const impConj = over.impConj ?? derived.impConj
  const futConj = over.futConj ?? derived.futConj
  return { presente, perfeito, imperfeito, futuro, condicional, imperativo, presConj, impConj, futConj }
}

const noS = (w: string) => w.replace(/s$/, '')

function reflexive(base: string, f: Forms): Forms {
  const P = ['me', 'te', 'se', 'nos', 'se']
  const encl = (arr: string[]) =>
    arr.map((w, i) => (i === 3 ? `${noS(w)}-nos` : `${w}-${P[i]}`))
  return {
    presente: encl(f.presente!),
    perfeito: encl(f.perfeito!),
    imperfeito: encl(f.imperfeito!),
    futuro: FUT.map((x, i) => `${base}-${P[i]}-${x}`),
    condicional: COND.map((x, i) => `${base}-${P[i]}-${x}`),
    imperativo: f.imperativo!.map((w, i) =>
      i === 0 ? `${w}-te` : i === 2 ? `${noS(w)}-nos` : `${w}-se`,
    ),
    presConj: encl(f.presConj!),
    impConj: encl(f.impConj!),
    futConj: encl(f.futConj!),
  }
}

function v(
  inf: string,
  en: string,
  ex: [string, string],
  over: Forms = {},
  irregular = false,
  participle?: string,
): Verb {
  const refl = inf.endsWith('-se')
  const base = refl ? inf.slice(0, -3) : inf
  let forms = build(base, over)
  if (refl) forms = reflexive(base, forms)
  const verb: Verb = { inf, en, forms, ex: { pt: ex[0], en: ex[1] } }
  if (irregular) verb.irregular = true
  if (participle) verb.participle = participle
  return verb
}

export const verbs: Verb[] = [
  v('ser', 'to be (permanent)', ['Eu sou português.', 'I am Portuguese.'], {
    presente: ['sou', 'és', 'é', 'somos', 'são'],
    perfeito: ['fui', 'foste', 'foi', 'fomos', 'foram'],
    imperfeito: ['era', 'eras', 'era', 'éramos', 'eram'],
    imperativo: ['sê', 'seja', 'sejamos', 'sejam'],
    presConj: ['seja', 'sejas', 'seja', 'sejamos', 'sejam'],
    impConj: ['fosse', 'fosses', 'fosse', 'fôssemos', 'fossem'],
    futConj: ['for', 'fores', 'for', 'formos', 'forem'],
  }, true, 'sido'),
  v('estar', 'to be (temporary)', ['Hoje estou cansado.', 'Today I am tired.'], {
    presente: ['estou', 'estás', 'está', 'estamos', 'estão'],
    perfeito: ['estive', 'estiveste', 'esteve', 'estivemos', 'estiveram'],
    imperativo: ['está', 'esteja', 'estejamos', 'estejam'],
    presConj: ['esteja', 'estejas', 'esteja', 'estejamos', 'estejam'],
    impConj: ['estivesse', 'estivesses', 'estivesse', 'estivéssemos', 'estivessem'],
    futConj: ['estiver', 'estiveres', 'estiver', 'estivermos', 'estiverem'],
  }, true),
  v('ter', 'to have', ['Tenho dois irmãos.', 'I have two brothers.'], {
    presente: ['tenho', 'tens', 'tem', 'temos', 'têm'],
    perfeito: ['tive', 'tiveste', 'teve', 'tivemos', 'tiveram'],
    imperfeito: ['tinha', 'tinhas', 'tinha', 'tínhamos', 'tinham'],
    presConj: ['tenha', 'tenhas', 'tenha', 'tenhamos', 'tenham'],
    impConj: ['tivesse', 'tivesses', 'tivesse', 'tivéssemos', 'tivessem'],
    futConj: ['tiver', 'tiveres', 'tiver', 'tivermos', 'tiverem'],
  }, true),
  v('haver', 'there to be; to have (auxiliary)', ['Há um café perto daqui.', 'There is a café near here.'], {
    presente: ['hei', 'hás', 'há', 'havemos', 'hão'],
    perfeito: ['houve', 'houveste', 'houve', 'houvemos', 'houveram'],
    imperativo: ['há', 'haja', 'hajamos', 'hajam'],
    presConj: ['haja', 'hajas', 'haja', 'hajamos', 'hajam'],
    impConj: ['houvesse', 'houvesses', 'houvesse', 'houvéssemos', 'houvessem'],
    futConj: ['houver', 'houveres', 'houver', 'houvermos', 'houverem'],
  }, true),
  v('ir', 'to go', ['Vou ao supermercado.', 'I am going to the supermarket.'], {
    presente: ['vou', 'vais', 'vai', 'vamos', 'vão'],
    perfeito: ['fui', 'foste', 'foi', 'fomos', 'foram'],
    imperfeito: ['ia', 'ias', 'ia', 'íamos', 'iam'],
    imperativo: ['vai', 'vá', 'vamos', 'vão'],
    presConj: ['vá', 'vás', 'vá', 'vamos', 'vão'],
    impConj: ['fosse', 'fosses', 'fosse', 'fôssemos', 'fossem'],
    futConj: ['for', 'fores', 'for', 'formos', 'forem'],
  }, true),
  v('vir', 'to come', ['Ela vem de Braga.', 'She comes from Braga.'], {
    presente: ['venho', 'vens', 'vem', 'vimos', 'vêm'],
    perfeito: ['vim', 'vieste', 'veio', 'viemos', 'vieram'],
    imperfeito: ['vinha', 'vinhas', 'vinha', 'vínhamos', 'vinham'],
    presConj: ['venha', 'venhas', 'venha', 'venhamos', 'venham'],
    impConj: ['viesse', 'viesses', 'viesse', 'viéssemos', 'viessem'],
    futConj: ['vier', 'vieres', 'vier', 'viermos', 'vierem'],
  }, true, 'vindo'),
  v('fazer', 'to do; to make', ['O que fazes ao fim de semana?', 'What do you do at the weekend?'], {
    presente: ['faço', 'fazes', 'faz', 'fazemos', 'fazem'],
    perfeito: ['fiz', 'fizeste', 'fez', 'fizemos', 'fizeram'],
    futuro: ['farei', 'farás', 'fará', 'faremos', 'farão'],
    condicional: ['faria', 'farias', 'faria', 'faríamos', 'fariam'],
    presConj: ['faça', 'faças', 'faça', 'façamos', 'façam'],
    impConj: ['fizesse', 'fizesses', 'fizesse', 'fizéssemos', 'fizessem'],
    futConj: ['fizer', 'fizeres', 'fizer', 'fizermos', 'fizerem'],
  }, true, 'feito'),
  v('dizer', 'to say; to tell', ['Ele diz sempre a verdade.', 'He always tells the truth.'], {
    presente: ['digo', 'dizes', 'diz', 'dizemos', 'dizem'],
    perfeito: ['disse', 'disseste', 'disse', 'dissemos', 'disseram'],
    futuro: ['direi', 'dirás', 'dirá', 'diremos', 'dirão'],
    condicional: ['diria', 'dirias', 'diria', 'diríamos', 'diriam'],
    presConj: ['diga', 'digas', 'diga', 'digamos', 'digam'],
    impConj: ['dissesse', 'dissesses', 'dissesse', 'disséssemos', 'dissessem'],
    futConj: ['disser', 'disseres', 'disser', 'dissermos', 'disserem'],
  }, true, 'dito'),
  v('dar', 'to give', ['Dou um presente à minha mãe.', 'I give a present to my mother.'], {
    presente: ['dou', 'dás', 'dá', 'damos', 'dão'],
    perfeito: ['dei', 'deste', 'deu', 'demos', 'deram'],
    imperativo: ['dá', 'dê', 'demos', 'deem'],
    presConj: ['dê', 'dês', 'dê', 'demos', 'deem'],
    impConj: ['desse', 'desses', 'desse', 'déssemos', 'dessem'],
    futConj: ['der', 'deres', 'der', 'dermos', 'derem'],
  }, true),
  v('ver', 'to see', ['Vemos televisão à noite.', 'We watch TV in the evening.'], {
    presente: ['vejo', 'vês', 'vê', 'vemos', 'veem'],
    perfeito: ['vi', 'viste', 'viu', 'vimos', 'viram'],
    presConj: ['veja', 'vejas', 'veja', 'vejamos', 'vejam'],
    impConj: ['visse', 'visses', 'visse', 'víssemos', 'vissem'],
    futConj: ['vir', 'vires', 'vir', 'virmos', 'virem'],
  }, true, 'visto'),
  v('pôr', 'to put', ['Põe a mesa, por favor.', 'Set the table, please.'], {
    presente: ['ponho', 'pões', 'põe', 'pomos', 'põem'],
    perfeito: ['pus', 'puseste', 'pôs', 'pusemos', 'puseram'],
    imperfeito: ['punha', 'punhas', 'punha', 'púnhamos', 'punham'],
    futuro: ['porei', 'porás', 'porá', 'poremos', 'porão'],
    condicional: ['poria', 'porias', 'poria', 'poríamos', 'poriam'],
    imperativo: ['põe', 'ponha', 'ponhamos', 'ponham'],
    presConj: ['ponha', 'ponhas', 'ponha', 'ponhamos', 'ponham'],
    impConj: ['pusesse', 'pusesses', 'pusesse', 'puséssemos', 'pusessem'],
    futConj: ['puser', 'puseres', 'puser', 'pusermos', 'puserem'],
  }, true, 'posto'),
  v('poder', 'can; to be able to', ['Posso abrir a janela?', 'Can I open the window?'], {
    presente: ['posso', 'podes', 'pode', 'podemos', 'podem'],
    perfeito: ['pude', 'pudeste', 'pôde', 'pudemos', 'puderam'],
    presConj: ['possa', 'possas', 'possa', 'possamos', 'possam'],
    impConj: ['pudesse', 'pudesses', 'pudesse', 'pudéssemos', 'pudessem'],
    futConj: ['puder', 'puderes', 'puder', 'pudermos', 'puderem'],
  }, true),
  v('querer', 'to want', ['Queria um café, por favor.', 'I would like a coffee, please.'], {
    presente: ['quero', 'queres', 'quer', 'queremos', 'querem'],
    perfeito: ['quis', 'quiseste', 'quis', 'quisemos', 'quiseram'],
    imperativo: ['quer', 'queira', 'queiramos', 'queiram'],
    presConj: ['queira', 'queiras', 'queira', 'queiramos', 'queiram'],
    impConj: ['quisesse', 'quisesses', 'quisesse', 'quiséssemos', 'quisessem'],
    futConj: ['quiser', 'quiseres', 'quiser', 'quisermos', 'quiserem'],
  }, true),
  v('saber', 'to know (facts); can (skill)', ['Sabes onde fica a estação?', 'Do you know where the station is?'], {
    presente: ['sei', 'sabes', 'sabe', 'sabemos', 'sabem'],
    perfeito: ['soube', 'soubeste', 'soube', 'soubemos', 'souberam'],
    imperativo: ['sabe', 'saiba', 'saibamos', 'saibam'],
    presConj: ['saiba', 'saibas', 'saiba', 'saibamos', 'saibam'],
    impConj: ['soubesse', 'soubesses', 'soubesse', 'soubéssemos', 'soubessem'],
    futConj: ['souber', 'souberes', 'souber', 'soubermos', 'souberem'],
  }, true),
  v('conhecer', 'to know (people, places)', ['Conheço bem Lisboa.', 'I know Lisbon well.'], {
    presente: ['conheço', 'conheces', 'conhece', 'conhecemos', 'conhecem'],
  }),
  v('trazer', 'to bring', ['Trago o vinho para o jantar.', 'I am bringing the wine for dinner.'], {
    presente: ['trago', 'trazes', 'traz', 'trazemos', 'trazem'],
    perfeito: ['trouxe', 'trouxeste', 'trouxe', 'trouxemos', 'trouxeram'],
    futuro: ['trarei', 'trarás', 'trará', 'traremos', 'trarão'],
    condicional: ['traria', 'trarias', 'traria', 'traríamos', 'trariam'],
    impConj: ['trouxesse', 'trouxesses', 'trouxesse', 'trouxéssemos', 'trouxessem'],
    futConj: ['trouxer', 'trouxeres', 'trouxer', 'trouxermos', 'trouxerem'],
  }, true),
  v('sair', 'to go out; to leave', ['Saio de casa às oito.', 'I leave home at eight.'], {
    presente: ['saio', 'sais', 'sai', 'saímos', 'saem'],
    perfeito: ['saí', 'saíste', 'saiu', 'saímos', 'saíram'],
    imperfeito: ['saía', 'saías', 'saía', 'saíamos', 'saíam'],
    impConj: ['saísse', 'saísses', 'saísse', 'saíssemos', 'saíssem'],
    futConj: ['sair', 'saíres', 'sair', 'sairmos', 'saírem'],
  }, true),
  v('ler', 'to read', ['Leio o jornal todos os dias.', 'I read the newspaper every day.'], {
    presente: ['leio', 'lês', 'lê', 'lemos', 'leem'],
    perfeito: ['li', 'leste', 'leu', 'lemos', 'leram'],
  }, true),
  v('ouvir', 'to hear; to listen', ['Ouço música no carro.', 'I listen to music in the car.'], {
    presente: ['ouço', 'ouves', 'ouve', 'ouvimos', 'ouvem'],
  }, true),
  v('pedir', 'to ask for; to order', ['Peço a conta, por favor.', 'I ask for the bill, please.'], {
    presente: ['peço', 'pedes', 'pede', 'pedimos', 'pedem'],
  }, true),
  v('dormir', 'to sleep', ['Durmo oito horas por noite.', 'I sleep eight hours a night.'], {
    presente: ['durmo', 'dormes', 'dorme', 'dormimos', 'dormem'],
  }, true),
  v('preferir', 'to prefer', ['Prefiro chá a café.', 'I prefer tea to coffee.'], {
    presente: ['prefiro', 'preferes', 'prefere', 'preferimos', 'preferem'],
  }, true),
  v('subir', 'to go up; to climb', ['Subimos a rua até ao castelo.', 'We walk up the street to the castle.'], {
    presente: ['subo', 'sobes', 'sobe', 'subimos', 'sobem'],
  }, true),
  v('perder', 'to lose; to miss', ['Perdi o autocarro.', 'I missed the bus.'], {
    presente: ['perco', 'perdes', 'perde', 'perdemos', 'perdem'],
  }, true),
  v('falar', 'to speak', ['Falas português?', 'Do you speak Portuguese?']),
  v('trabalhar', 'to work', ['Trabalho num escritório.', 'I work in an office.']),
  v('estudar', 'to study', ['Estudamos português juntos.', 'We study Portuguese together.']),
  v('morar', 'to live (reside)', ['Moro no Porto.', 'I live in Porto.']),
  v('gostar', 'to like (de)', ['Gosto muito de bacalhau.', 'I really like codfish.']),
  v('chamar-se', 'to be called', ['Como te chamas? Chamo-me Ana.', "What's your name? My name is Ana."]),
  v('levantar-se', 'to get up', ['Levanto-me às sete.', 'I get up at seven.']),
  v('deitar-se', 'to go to bed', ['Deito-me tarde.', 'I go to bed late.']),
  v('vestir-se', 'to get dressed', ['Visto-me depressa de manhã.', 'I get dressed quickly in the morning.'], {
    presente: ['visto', 'vestes', 'veste', 'vestimos', 'vestem'],
  }, true),
  v('acordar', 'to wake up', ['Acordo cedo durante a semana.', 'I wake up early during the week.']),
  v('tomar', 'to take; to have (drink, meal)', ['Tomo o pequeno-almoço em casa.', 'I have breakfast at home.']),
  v('jantar', 'to have dinner', ['Jantamos às oito.', 'We have dinner at eight.']),
  v('almoçar', 'to have lunch', ['Almoço com colegas.', 'I have lunch with colleagues.']),
  v('comprar', 'to buy', ['Comprei pão na padaria.', 'I bought bread at the bakery.']),
  v('pagar', 'to pay', ['Posso pagar com cartão?', 'Can I pay by card?'], {}, false, 'pago'),
  v('custar', 'to cost', ['Quanto custa este casaco?', 'How much does this coat cost?']),
  v('precisar', 'to need (de)', ['Preciso de ajuda.', 'I need help.']),
  v('andar', 'to walk; to ride', ['Ando de bicicleta ao domingo.', 'I ride my bike on Sundays.']),
  v('chegar', 'to arrive', ['O comboio chega às dez.', 'The train arrives at ten.']),
  v('ficar', 'to stay; to be located', ['Onde fica a farmácia?', 'Where is the pharmacy?']),
  v('começar', 'to begin; to start', ['A aula começa às nove.', 'The class starts at nine.']),
  v('acabar', 'to finish; to end', ['Acabei o trabalho.', 'I finished the work.']),
  v('viajar', 'to travel', ['Viajámos pelo Algarve.', 'We travelled around the Algarve.']),
  v('comer', 'to eat', ['Comemos peixe ao almoço.', 'We eat fish at lunch.']),
  v('beber', 'to drink', ['Bebo água com gás.', 'I drink sparkling water.']),
  v('aprender', 'to learn', ['Estou a aprender português.', 'I am learning Portuguese.']),
  v('escrever', 'to write', ['Escrevo um e-mail ao meu chefe.', 'I write an email to my boss.'], {}, false, 'escrito'),
  v('correr', 'to run', ['Corro no parque de manhã.', 'I run in the park in the morning.']),
  v('viver', 'to live', ['Vivemos em Lisboa há dois anos.', 'We have lived in Lisbon for two years.']),
  v('abrir', 'to open', ['A loja abre às nove.', 'The shop opens at nine.'], {}, false, 'aberto'),
  v('partir', 'to leave; to break', ['O avião parte às seis.', 'The plane leaves at six.']),
  v('decidir', 'to decide', ['Decidimos ficar em casa.', 'We decided to stay at home.']),
  v('dever', 'must; should; to owe', ['Deves descansar mais.', 'You should rest more.']),
  v('conduzir', 'to drive', ['Conduzo com cuidado.', 'I drive carefully.'], {
    presente: ['conduzo', 'conduzes', 'conduz', 'conduzimos', 'conduzem'],
  }, true),
  v('jogar', 'to play (games, sports)', ['Jogamos futebol ao sábado.', 'We play football on Saturdays.']),
  v('nadar', 'to swim', ['Nado na praia no verão.', 'I swim at the beach in summer.']),
  v('cozinhar', 'to cook', ['O meu pai cozinha muito bem.', 'My father cooks very well.']),
  v('limpar', 'to clean', ['Limpo a casa ao sábado.', 'I clean the house on Saturdays.']),
  v('lavar', 'to wash', ['Lavo a loiça depois do jantar.', 'I wash the dishes after dinner.']),
  v('usar', 'to use; to wear', ['Uso óculos para ler.', 'I wear glasses to read.']),
  v('experimentar', 'to try (on)', ['Posso experimentar estas calças?', 'Can I try on these trousers?']),
  v('doer', 'to hurt', ['Dói-me a cabeça.', 'My head hurts.'], {
    presente: ['doo', 'dóis', 'dói', 'doemos', 'doem'],
    perfeito: ['doí', 'doeste', 'doeu', 'doemos', 'doeram'],
    imperfeito: ['doía', 'doías', 'doía', 'doíamos', 'doíam'],
  }, true),
  v('sentir-se', 'to feel', ['Sinto-me melhor hoje.', 'I feel better today.'], {
    presente: ['sinto', 'sentes', 'sente', 'sentimos', 'sentem'],
  }, true),
  v('esperar', 'to wait; to hope', ['Espero pelo autocarro.', 'I wait for the bus.']),
  v('perguntar', 'to ask (a question)', ['Posso perguntar uma coisa?', 'May I ask something?']),
  v('responder', 'to answer', ['Ela respondeu logo.', 'She answered right away.']),
  v('voltar', 'to return; to come back', ['Volto já!', "I'll be right back!"]),
  v('entrar', 'to enter; to go in', ['Entre, por favor.', 'Come in, please.']),
  v('levar', 'to take; to carry', ['Levo o guarda-chuva.', "I'm taking the umbrella."]),
  v('encontrar', 'to find; to meet', ['Encontrei as chaves!', 'I found the keys!']),
  v('pensar', 'to think', ['Penso em ti.', 'I think of you.']),
  v('achar', 'to think (opinion); to find', ['Acho que vai chover.', 'I think it is going to rain.']),
  v('mudar', 'to change; to move', ['Mudámos de casa no ano passado.', 'We moved house last year.']),
  v('nascer', 'to be born', ['Nasci em Coimbra.', 'I was born in Coimbra.'], {
    presente: ['nasço', 'nasces', 'nasce', 'nascemos', 'nascem'],
  }),
  v('crescer', 'to grow (up)', ['Cresci numa aldeia.', 'I grew up in a village.'], {
    presente: ['cresço', 'cresces', 'cresce', 'crescemos', 'crescem'],
  }),
  v('receber', 'to receive', ['Recebi uma carta.', 'I received a letter.']),
  v('vender', 'to sell', ['Eles vendem fruta no mercado.', 'They sell fruit at the market.']),
  v('marcar', 'to book (appointment); to score', ['Quero marcar uma consulta.', 'I want to book an appointment.']),
  v('reservar', 'to reserve; to book', ['Reservei uma mesa para dois.', 'I booked a table for two.']),
  v('apanhar', 'to catch; to take (transport)', ['Apanho o metro para o trabalho.', 'I take the metro to work.']),
  v('descer', 'to go down', ['Desça esta rua e vire à direita.', 'Go down this street and turn right.'], {
    presente: ['desço', 'desces', 'desce', 'descemos', 'descem'],
  }),
  v('atravessar', 'to cross', ['Atravesse a praça.', 'Cross the square.']),
  v('virar', 'to turn', ['Vire à esquerda no semáforo.', 'Turn left at the traffic lights.']),
  v('ganhar', 'to win; to earn', ['Ganho bem neste emprego.', 'I earn well in this job.'], {}, false, 'ganho'),
  v('gastar', 'to spend (money); to wear out', ['Gastei muito dinheiro.', 'I spent a lot of money.'], {}, false, 'gasto'),
  v('aceitar', 'to accept', ['Aceito o convite com prazer.', 'I accept the invitation with pleasure.'], {}, false, 'aceite'),
  v('cobrir', 'to cover', ['Cubro a panela com a tampa.', 'I cover the pot with the lid.'], {
    presente: ['cubro', 'cobres', 'cobre', 'cobrimos', 'cobrem'],
  }, true, 'coberto'),
  v('explicar', 'to explain', ['Pode explicar outra vez?', 'Can you explain again?']),
  v('contar', 'to count; to tell (a story)', ['Vou contar-te uma história.', 'I am going to tell you a story.']),
  v('chover', 'to rain', ['Hoje chove muito.', 'It is raining a lot today.']),
  v('visitar', 'to visit', ['Visitamos os avós ao domingo.', 'We visit our grandparents on Sundays.']),
  v('resolver', 'to solve; to sort out', ['Vamos resolver este problema.', 'We are going to solve this problem.']),
  v('ajudar', 'to help', ['Posso ajudar?', 'Can I help?']),
  v('alugar', 'to rent', ['Queremos alugar um carro.', 'We want to rent a car.']),
  v('apagar', 'to switch off; to erase', ['Apaga a luz, por favor.', 'Switch off the light, please.']),
  v('apresentar', 'to introduce; to present', ['Quero apresentar a minha amiga.', 'I want to introduce my friend.']),
  v('arranjar', 'to get; to fix', ['Vou arranjar um táxi.', 'I am going to get a taxi.']),
  v('arrumar', 'to tidy up', ['Arrumo o quarto ao sábado.', 'I tidy my room on Saturdays.']),
  v('assinar', 'to sign', ['Assine aqui, por favor.', 'Sign here, please.']),
  v('atender', 'to answer (phone); to serve', ['Atendo o telefone logo.', 'I answer the phone right away.']),
  v('aumentar', 'to increase', ['Os preços aumentaram.', 'Prices have gone up.']),
  v('avisar', 'to warn; to let know', ['Avisa-me quando chegares.', 'Let me know when you arrive.']),
  v('bater', 'to hit; to knock', ['Alguém bate à porta.', 'Someone is knocking at the door.']),
  v('brincar', 'to play (children)', ['As crianças brincam no jardim.', 'The children play in the garden.']),
  v('cair', 'to fall', ['Caí na rua.', 'I fell in the street.'], {
    presente: ['caio', 'cais', 'cai', 'caímos', 'caem'],
    perfeito: ['caí', 'caíste', 'caiu', 'caímos', 'caíram'],
    imperfeito: ['caía', 'caías', 'caía', 'caíamos', 'caíam'],
    impConj: ['caísse', 'caísses', 'caísse', 'caíssemos', 'caíssem'],
    futConj: ['cair', 'caíres', 'cair', 'cairmos', 'caírem'],
  }, true),
  v('cantar', 'to sing', ['Ela canta muito bem.', 'She sings very well.']),
  v('casar', 'to marry', ['Vamos casar em junho.', 'We are getting married in June.']),
  v('compreender', 'to understand', ['Compreendo tudo.', 'I understand everything.']),
  v('conseguir', 'to manage to; to be able', ['Não consigo abrir a porta.', 'I cannot manage to open the door.'], {
    presente: ['consigo', 'consegues', 'consegue', 'conseguimos', 'conseguem'],
  }, true),
  v('continuar', 'to continue', ['Continue em frente.', 'Carry on straight ahead.']),
  v('conversar', 'to chat', ['Gosto de conversar com amigos.', 'I like chatting with friends.']),
  v('cortar', 'to cut', ['Corto o pão às fatias.', 'I cut the bread into slices.']),
  v('costumar', 'to usually do', ['Costumo acordar cedo.', 'I usually wake up early.']),
  v('cumprimentar', 'to greet', ['Cumprimento os vizinhos.', 'I greet the neighbours.']),
  v('dançar', 'to dance', ['Dançamos no sábado à noite.', 'We dance on Saturday night.']),
  v('deixar', 'to leave; to let', ['Deixa-me ajudar.', 'Let me help.']),
  v('demorar', 'to take (time); to be late', ['A viagem demora duas horas.', 'The journey takes two hours.']),
  v('descansar', 'to rest', ['Preciso de descansar.', 'I need to rest.']),
  v('desculpar', 'to excuse; to forgive', ['Desculpe o atraso.', 'Sorry for the delay.']),
  v('desenhar', 'to draw', ['Ele desenha muito bem.', 'He draws very well.']),
  v('desistir', 'to give up', ['Não desisto!', 'I do not give up!']),
  v('desligar', 'to switch off; to hang up', ['Desliga a televisão.', 'Switch off the TV.']),
  v('despedir-se', 'to say goodbye', ['Despeço-me de todos.', 'I say goodbye to everyone.'], {
    presente: ['despeço', 'despedes', 'despede', 'despedimos', 'despedem'],
  }, true),
  v('devolver', 'to give back', ['Devolvo o livro amanhã.', 'I will give the book back tomorrow.']),
  v('divertir-se', 'to have fun', ['Divertimo-nos muito.', 'We had a lot of fun.'], {
    presente: ['divirto', 'divertes', 'diverte', 'divertimos', 'divertem'],
  }, true),
  v('duvidar', 'to doubt', ['Duvido que venha.', 'I doubt he will come.']),
  v('emprestar', 'to lend', ['Podes emprestar-me a caneta?', 'Can you lend me the pen?']),
  v('encomendar', 'to order (goods)', ['Encomendei dois livros.', 'I ordered two books.']),
  v('ensinar', 'to teach', ['Ela ensina português.', 'She teaches Portuguese.']),
  v('entender', 'to understand', ['Não entendo a pergunta.', 'I do not understand the question.']),
  v('entregar', 'to deliver; to hand in', ['Entrego o trabalho amanhã.', 'I hand in the work tomorrow.'], {}, false, 'entregue'),
  v('enviar', 'to send', ['Envio-lhe um e-mail.', 'I will send you an email.']),
  v('escolher', 'to choose', ['Escolhe tu o restaurante.', 'You choose the restaurant.']),
  v('escutar', 'to listen to', ['Escuta com atenção.', 'Listen carefully.']),
  v('esquecer-se', 'to forget', ['Esqueci-me das chaves.', 'I forgot my keys.'], {
    presente: ['esqueço', 'esqueces', 'esquece', 'esquecemos', 'esquecem'],
  }),
  v('esquiar', 'to ski', ['Esquiamos nas montanhas.', 'We ski in the mountains.']),
  v('estacionar', 'to park', ['Posso estacionar aqui?', 'Can I park here?']),
  v('evitar', 'to avoid', ['Evito o trânsito.', 'I avoid the traffic.']),
  v('falhar', 'to fail; to miss', ['O plano falhou.', 'The plan failed.']),
  v('faltar', 'to be missing; to be absent', ['Falta um prato.', 'A plate is missing.']),
  v('fechar', 'to close', ['A loja fecha às sete.', 'The shop closes at seven.']),
  v('festejar', 'to celebrate', ['Festejamos o aniversário em casa.', 'We celebrate the birthday at home.']),
  v('fumar', 'to smoke', ['Não fumo.', 'I do not smoke.']),
  v('funcionar', 'to work; to function', ['O elevador não funciona.', 'The lift does not work.']),
  v('guardar', 'to keep; to put away', ['Guardo o bilhete na mala.', 'I keep the ticket in my bag.']),
  v('guiar', 'to drive; to guide', ['Ele guia o grupo.', 'He guides the group.']),
  v('imaginar', 'to imagine', ['Imagino que sim.', 'I imagine so.']),
  v('importar-se', 'to mind', ['Importa-se de fechar a janela?', 'Would you mind closing the window?']),
  v('imprimir', 'to print', ['Vou imprimir o bilhete.', 'I am going to print the ticket.'], {}, false, 'impresso'),
  v('indicar', 'to show; to indicate', ['Pode indicar-me o caminho?', 'Can you show me the way?']),
  v('interessar', 'to interest', ['Interessa-me muito a história.', 'History interests me a lot.']),
  v('juntar', 'to join; to put together', ['Junto-me a vocês.', 'I will join you.']),
  v('lembrar-se', 'to remember', ['Lembro-me do teu nome.', 'I remember your name.']),
  v('ligar', 'to switch on; to call', ['Ligo-te à noite.', 'I will call you tonight.']),
  v('lutar', 'to fight', ['Lutamos pelos nossos direitos.', 'We fight for our rights.']),
  v('melhorar', 'to improve', ['O tempo vai melhorar.', 'The weather is going to improve.']),
  v('merecer', 'to deserve', ['Mereces um descanso.', 'You deserve a rest.'], {
    presente: ['mereço', 'mereces', 'merece', 'merecemos', 'merecem'],
  }),
  v('mostrar', 'to show', ['Mostro-te a cidade.', 'I will show you the city.']),
  v('necessitar', 'to need', ['Necessito de ajuda.', 'I need help.']),
  v('notar', 'to notice', ['Noto a diferença.', 'I notice the difference.']),
  v('obedecer', 'to obey', ['Obedeço às regras.', 'I obey the rules.'], {
    presente: ['obedeço', 'obedeces', 'obedece', 'obedecemos', 'obedecem'],
  }),
  v('obrigar', 'to force', ['Ninguém te obriga.', 'Nobody forces you.']),
  v('ocupar', 'to occupy', ['Este lugar está ocupado.', 'This seat is taken.']),
  v('oferecer', 'to offer; to give (a present)', ['Ofereço-te um café.', 'I will treat you to a coffee.'], {
    presente: ['ofereço', 'ofereces', 'oferece', 'oferecemos', 'oferecem'],
  }),
  v('olhar', 'to look', ['Olha para mim.', 'Look at me.']),
  v('parar', 'to stop', ['O autocarro para aqui.', 'The bus stops here.']),
  v('parecer', 'to seem', ['Parece que vai chover.', 'It looks like it is going to rain.'], {
    presente: ['pareço', 'pareces', 'parece', 'parecemos', 'parecem'],
  }),
  v('passar', 'to pass; to spend (time)', ['Passo o verão no Algarve.', 'I spend the summer in the Algarve.']),
  v('passear', 'to go for a walk', ['Passeamos à beira-mar.', 'We stroll by the sea.'], {
    presente: ['passeio', 'passeias', 'passeia', 'passeamos', 'passeiam'],
    presConj: ['passeie', 'passeies', 'passeie', 'passeemos', 'passeiem'],
    imperativo: ['passeia', 'passeie', 'passeemos', 'passeiem'],
  }, true),
  v('pentear-se', "to comb one's hair", ['Penteio-me antes de sair.', 'I comb my hair before going out.'], {
    presente: ['penteio', 'penteias', 'penteia', 'penteamos', 'penteiam'],
    presConj: ['penteie', 'penteies', 'penteie', 'penteemos', 'penteiem'],
    imperativo: ['penteia', 'penteie', 'penteemos', 'penteiem'],
  }, true),
  v('permitir', 'to allow', ['Não permitem animais.', 'Animals are not allowed.']),
  v('poupar', 'to save (money)', ['Poupo dinheiro todos os meses.', 'I save money every month.']),
  v('preencher', 'to fill in', ['Preencha este formulário.', 'Fill in this form.']),
  v('preocupar-se', 'to worry', ['Não te preocupes.', 'Do not worry.']),
  v('procurar', 'to look for', ['Procuro um hotel barato.', 'I am looking for a cheap hotel.']),
  v('prometer', 'to promise', ['Prometo chegar a horas.', 'I promise to arrive on time.']),
  v('puxar', 'to pull', ['Puxe a porta.', 'Pull the door.']),
  v('queixar-se', 'to complain', ['Queixo-me do barulho.', 'I complain about the noise.']),
  v('recomendar', 'to recommend', ['Recomendo este restaurante.', 'I recommend this restaurant.']),
  v('regressar', 'to return', ['Regresso a casa às seis.', 'I return home at six.']),
  v('reparar', 'to notice; to repair', ['Reparaste no preço?', 'Did you notice the price?']),
  v('repetir', 'to repeat', ['Pode repetir, por favor?', 'Can you repeat, please?'], {
    presente: ['repito', 'repetes', 'repete', 'repetimos', 'repetem'],
  }, true),
  v('rir', 'to laugh', ['Rimos muito no jantar.', 'We laughed a lot at dinner.'], {
    presente: ['rio', 'ris', 'ri', 'rimos', 'riem'],
  }, true),
  v('saltar', 'to jump', ['As crianças saltam de alegria.', 'The children jump for joy.']),
  v('sentar-se', 'to sit down', ['Sente-se, por favor.', 'Sit down, please.']),
  v('sentir', 'to feel', ['Sinto frio.', 'I feel cold.'], {
    presente: ['sinto', 'sentes', 'sente', 'sentimos', 'sentem'],
  }, true),
  v('seguir', 'to follow; to continue', ['Siga sempre em frente.', 'Keep going straight ahead.'], {
    presente: ['sigo', 'segues', 'segue', 'seguimos', 'seguem'],
  }, true),
  v('servir', 'to serve; to fit', ['Servem o jantar às oito.', 'They serve dinner at eight.'], {
    presente: ['sirvo', 'serves', 'serve', 'servimos', 'servem'],
  }, true),
  v('significar', 'to mean', ['O que significa esta palavra?', 'What does this word mean?']),
  v('sofrer', 'to suffer', ['Ela sofre de alergias.', 'She suffers from allergies.']),
  v('sonhar', 'to dream', ['Sonho com as férias.', 'I dream about the holidays.']),
  v('sorrir', 'to smile', ['Ela sorri sempre.', 'She always smiles.'], {
    presente: ['sorrio', 'sorris', 'sorri', 'sorrimos', 'sorriem'],
  }, true),
  v('sujar', 'to make dirty', ['Não sujes a camisa.', 'Do not get your shirt dirty.']),
  v('telefonar', 'to phone', ['Telefono-te amanhã.', 'I will phone you tomorrow.']),
  v('terminar', 'to finish', ['A aula termina às cinco.', 'The class finishes at five.']),
  v('tirar', 'to take out; to take off', ['Tiro o casaco.', 'I take off my coat.']),
  v('tocar', 'to touch; to play (music)', ['Ele toca guitarra.', 'He plays the guitar.']),
  v('tratar', 'to treat; to deal with', ['Trato disso amanhã.', 'I will deal with that tomorrow.']),
  v('utilizar', 'to use', ['Utilizo o telemóvel todos os dias.', 'I use my mobile every day.']),
  v('vencer', 'to win; to overcome', ['Vencemos o jogo.', 'We won the match.'], {
    presente: ['venço', 'vences', 'vence', 'vencemos', 'vencem'],
  }),
  v('vestir', 'to wear; to put on', ['Visto o casaco.', 'I put on my coat.'], {
    presente: ['visto', 'vestes', 'veste', 'vestimos', 'vestem'],
  }, true),
  v('amar', 'to love', ['Amo a minha família.', 'I love my family.']),
  v('adorar', 'to love; to adore', ['Adoro o Porto.', 'I love Porto.']),
  v('adiar', 'to postpone', ['Vamos adiar a reunião.', 'We are going to postpone the meeting.']),
  v('acontecer', 'to happen', ['O que aconteceu?', 'What happened?'], {
    presente: ['aconteço', 'aconteces', 'acontece', 'acontecemos', 'acontecem'],
  }),
  v('agradecer', 'to thank', ['Agradeço a vossa ajuda.', 'I thank you for your help.'], {
    presente: ['agradeço', 'agradeces', 'agradece', 'agradecemos', 'agradecem'],
  }),
  v('aparecer', 'to appear; to turn up', ['Apareço lá às oito.', 'I will turn up there at eight.'], {
    presente: ['apareço', 'apareces', 'aparece', 'aparecemos', 'aparecem'],
  }),
  v('aborrecer', 'to bore; to annoy', ['Isso aborrece-me.', 'That annoys me.'], {
    presente: ['aborreço', 'aborreces', 'aborrece', 'aborrecemos', 'aborrecem'],
  }),
  v('amanhecer', 'to dawn', ['Amanhece cedo no verão.', 'Dawn comes early in summer.'], {
    presente: ['amanheço', 'amanheces', 'amanhece', 'amanhecemos', 'amanhecem'],
  }),
  v('assistir', 'to watch; to attend', ['Assisto às aulas todos os dias.', 'I attend classes every day.']),
  v('tentar', 'to try', ['Vou tentar outra vez.', 'I am going to try again.']),
  v('discutir', 'to discuss; to argue', ['Discutimos o projeto.', 'We discussed the project.']),
  v('lavar-se', 'to wash (oneself)', ['Lavo-me de manhã.', 'I wash in the morning.']),
  v('preparar-se', 'to get ready', ['Preparo-me para o exame.', 'I am getting ready for the exam.']),
  v('nevar', 'to snow', ['Neva no inverno na Serra da Estrela.', 'It snows in winter in the Serra da Estrela.']),
  v('candidatar-se', 'to apply (for a job)', ['Candidato-me a este emprego.', 'I am applying for this job.']),
  v('confirmar', 'to confirm', ['Confirmo a reserva.', 'I confirm the booking.']),
  v('cancelar', 'to cancel', ['Quero cancelar a reserva.', 'I want to cancel the booking.']),
  v('lamentar', 'to regret; to be sorry', ['Lamento muito.', 'I am very sorry.']),
  v('convidar', 'to invite', ['Convido-te para jantar.', 'I invite you to dinner.']),
  v('comparar', 'to compare', ['Comparo os preços.', 'I compare the prices.']),
  v('aconselhar', 'to advise', ['Aconselho-te a descansar.', 'I advise you to rest.']),
  v('recear', 'to fear', ['Receio que seja tarde.', 'I fear it is late.'], {
    presente: ['receio', 'receias', 'receia', 'receamos', 'receiam'],
  }),
  v('sugerir', 'to suggest', ['Sugiro um café.', 'I suggest a coffee.'], {
    presente: ['sugiro', 'sugeres', 'sugere', 'sugerimos', 'sugerem'],
  }, true),
  v('exigir', 'to demand', ['Exijo uma explicação.', 'I demand an explanation.'], {
    presente: ['exijo', 'exiges', 'exige', 'exigimos', 'exigem'],
  }),
]

export const verbMap: Record<string, Verb> = Object.fromEntries(verbs.map((v) => [v.inf, v]))
