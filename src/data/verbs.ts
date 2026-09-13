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
    presConj: ['dê', 'dês', 'dê', 'deemos', 'deem'],
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
  v('pagar', 'to pay', ['Posso pagar com cartão?', 'Can I pay by card?']),
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
]

export const verbMap: Record<string, Verb> = Object.fromEntries(verbs.map((v) => [v.inf, v]))
