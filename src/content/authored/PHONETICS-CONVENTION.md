# Convenção de pronúncia — "leia como português"

Este documento define **como escrevemos a pronúncia** que aparece embaixo de cada
cartão (`Card.phonetic`, renderizado como `/cópi/` em `Learn.tsx` e `Speak.tsx`).

Não usamos IPA. `/ˈkɑpi/` não serve para quem nunca estudou fonética.
Escrevemos do jeito que **uma brasileira lê em voz alta** — `cópi`, `gôu`, `uóter`.

O alvo é o inglês **americano** (General American). Ela precisa ser *entendida*,
não imitar sotaque nenhum.

> **Regra de ouro para quem for continuar:**
> leia sua entrada em voz alta *como se fosse uma palavra em português*.
> Se o que sair não for reconhecível por um americano, está errado.

### Por que americano, e o que isso custa

Esta tabela era neozelandesa até 2026-08-03. O dono pediu a troca para o
americano nessa data — na época, a mulher dele ia morar na Nova Zelândia, e a
troca foi aprovada sabendo do custo de que o `r` de fim de sílaba que
reintroduzimos aqui **não seria** o que ela ouviria por lá.

Isso mudou em 2026-08-17: o destino agora são os EUA, não mais a Nova
Zelândia. Com isso, a exceção do Ear Training abaixo caiu — não sobrou nenhum
motivo pra manter conteúdo neozelandês de propósito em lugar nenhum do app. Só
o nome/marca "Kiwi" continua, por escolha estética, não por causa do destino.

A troca de pronúncia (2026-08-03) e a virada completa NZ→EUA (2026-08-17)
estão registadas em `docs/STATE.md`.

---

## 1. Acento tónico — uma acentuação por palavra

Toda palavra de duas ou mais sílabas **marca a sílaba tónica com acento**, como em
português. O acento é a informação mais útil da lista inteira: as regras de
acentuação do português são diferentes das do inglês, e um acento no lugar errado
é o que mais atrapalha.

- **Um acento gráfico por palavra**, sempre na sílaba tónica: `cópi`, `halôu`,
  `andersténd`, `imêrdjensi`.
- Vogais **átonas nunca levam acento**. A leitura natural do português já dá o
  resultado certo: em `mándei` (Monday) o `ei` átono sai `[ej]`, que é o que
  queremos.
- **Monossílabos tónicos também levam acento**, porque o acento também indica a
  *qualidade* da vogal (ver §2): `bíg`, `hót`, `gôu`, `uént`.
- **Frases**: acentua-se a sílaba tónica de cada **palavra de conteúdo**
  (substantivo, verbo, adjetivo, advérbio). As **palavras funcionais** (artigos,
  preposições, auxiliares) ficam **sem acento e reduzidas**:
  `ken iu ripíit, plíiz`, `ái dôunt andersténd`, `háu ar iú`.

### Acento agudo vs. circunflexo

Exatamente como em português (`avó` vs. `avô`):

| Marca | Som | Exemplos |
|---|---|---|
| `á é í ó ú` | vogal **aberta** | `béd` (bad), `hót` (hot), `cáp` (cup) |
| `â ê ô` | vogal **fechada** | `bêd` (bed), `gôu` (go), `têik` (take) |

Isto não é decoração — é o que separa **bad** de **bed**, e **hair** (`hér`) de
**her** (`hêr`).

---

## 2. Tabela de vogais

Cada linha é um "lexical set" do inglês com o valor americano.

| Set (exemplo) | GA | Escrevemos | Exemplos |
|---|---|---|---|
| KIT (*ship*) | `[ɪ]` | **í / i** | `chíp`, `bíg`, `dís`, `íts` |
| FLEECE (*sheep*) | `[iː]` longo | **íi / ii** | `chíip`, `plíiz`, `níid`, `fríi` |
| DRESS (*bed*) | `[ɛ]` | **ê** | `bêd`, `iês`, `rêd`, `guêt`, `hêlp` |
| TRAP + BATH (*bad, ask*) | `[æ]` | **é** | `béd`, `hét`, `ésk`, `héf`, `ként` |
| STRUT (*cup*) | `[ʌ]` | **á** | `cáp`, `lántch`, `máder`, `uán` |
| LOT + THOUGHT (*hot, walk*) | `[ɑ] / [ɔ]` | **ó** | `hót`, `chóp`, `uók`, `smól` |
| FOOT + GOOSE (*good, food*) | `[ʊ] / [uː]` | **u / ú** | `gúd`, `búk`, `fúd`, `tú`, `frú` |
| NURSE (*work, girl*) | `[ɝ]` | **êr** | `uêrk`, `guêrl`, `fêrst`, `hêr` |
| schwa (*about*) | `[ə]` | **a** átono | `abáut`, `da`, `môumant` |
| lettER (*water, mother*) | `[ɚ]` | **er** átono | `uóter`, `máder`, `díner`, `lêiter` |
| START (*car, park*) | `[ɑr]` | **ár** | `cár`, `párk`, `árm`, `hárd` |
| NORTH/FORCE (*four, morning*) | `[ɔr]` | **ór** | `fór`, `mórning`, `dór`, `córs` |
| PALM sem r (*father*) | `[ɑ]` | **áa** | `fáader`, `dráama` |
| FACE (*day*) | `[eɪ]` | **êi** | `dêi`, `nêim`, `têik` |
| PRICE (*five*) | `[aɪ]` | **ái** | `fáiv`, `táim`, `mái` |
| MOUTH (*how*) | `[aʊ]` | **áu** | `háu`, `háus`, `náu` |
| CHOICE (*boy*) | `[ɔɪ]` | **ói** | `bói`, `tóilat` |
| GOAT (*go*) | `[oʊ]` | **ôu** | `gôu`, `hôum`, `côut`, `dôunt` |
| NEAR (*here*) | `[ɪr]` | **ír** | `hír`, `ír`, `tchírz` |
| SQUARE (*hair*) | `[ɛr]` | **ér** | `hér`, `dér`, `uér`, `tchér` |
| CURE (*sure*) | `[ʊr]` | **úr** | `chúr` |

**Comprimento.** Só marcamos vogal longa **dobrando a letra** no caso que causa
mal-entendido de verdade:

- `íi` **vs.** `í` — *sheep* `chíip` / *ship* `chíp`; *eat* `íit` / *it* `it`.
  O português só tem um `i`; sem isto ela diz *ship* onde queria dizer *sheep*.

O `áa` sobrevive só nas poucas palavras PALM sem `r` (*father* `fáader`,
*drama* `dráama`), onde marca que o `a` é longo e posterior. Os outros pares
longos/curtos (*pull/pool*) não separam palavras que ela vá usar.

### A schwa: escrevemos `a`, não `uh`

O dono escreveu `wókfruh`. Aquele `uh` transcreve o **U de *through*** (`frú` neste
sistema), não uma schwa. Para a schwa de verdade a decisão é outra e é deliberada:

**a schwa é escrita `a` átono.** Motivo: o `a` átono do português **já é** `[ɐ]`,
ou seja, já é praticamente a schwa inglesa. `abáut` sai perfeito.
`uh` lido por uma brasileira dá `[u]` — uma vogal cheia, posterior e arredondada,
que é justamente o erro que queremos evitar. Uma letra, som certo, custo zero.

Quando a schwa vem com `r` (o *lettER* de *water*, *mother*, *teacher*),
escrevemos **`er`**: `uóter`, `máder`, `tíitcher`. É a mesma vogal do `êr` de
*work*, só que átona — daí perder o acento.

---

## 3. Tabela de consoantes

| Som inglês | Escrevemos | Exemplos | Nota |
|---|---|---|---|
| `[k]` | **c** antes de a/o/u/l/r · **k** antes de e/i e no fim | `cópi`, `clíin`, `kéch`, `búk` | nunca `qu`, nunca `x` |
| `[g]` | **g** antes de a/o/u · **gu** antes de e/i | `gót`, `guêt`, `guív`, `guêrl` | regra do português |
| `[ʃ]` | **ch** | `chóp`, `chíi`, `chúz`, `fínich` | como em *chá* |
| `[tʃ]` | **tch** | `tchér`, `mátch`, `bíitch` | como em *tchau* |
| `[dʒ]` | **dj** | `frídj`, `djékat`, `imêrdjensi` | |
| `[s]` | **s** · **ss** entre vogais | `síti`, `rissíit`, `náis` | `s` entre vogais lê-se `[z]` em português |
| `[z]` | **z** | `plíiz`, `sáiz`, `chúz` | |
| `[h]` | **h** — **pronunciado** | `hêlp`, `hév`, `hôum` | ver §4 |
| `[ɹ]` | **r** | `rêd`, `fríi`, `cár`, `uóter` | ver §4 e §5 |
| `[ŋ]` | **ng** | `fíng`, `mórning`, `bénk` | n no fundo da boca |
| `[θ]` (*think*) | **f** | `fínk`, `fríi`, `máuf`, `fénk iú` | ver §4 |
| `[ð]` (*the*) | **d** | `da`, `dís`, `máder`, `uêder` | ver §4 |
| `[w]` | **u** antes de vogal | `uóter`, `uán`, `uíik`, `uái` | como em *quatro*, *água* |
| `[j]` | **i** antes de vogal | `iês`, `iú`, `mêniu` | |

**Nunca escrevemos** `nh`, `lh`, `rr`, `x`, `qu`, `ç` — todos disparam sons
portugueses que não existem no inglês.

**Sem o `iu` depois de n/t/d** (yod-dropping): o americano diz *new* `nú`, não
`niú`. Depois de `m` o `iu` fica: *menu* `mêniu`.

---

## 4. As quatro decisões difíceis

### `th` — `f` para *think*, `d` para *the*

O português não tem nenhum dos dois, e nenhuma transcrição vai fazer ela produzir
o `th` verdadeiro. Escolhemos as substituições mais **legíveis e inteligíveis**:

- **`[θ]` → `f`** (*think* `fínk`, *three* `fríi`, *mouth* `máuf`).
  Não é o som americano padrão — é a substituição que uma brasileira consegue
  ler e que continua a ser entendida. As alternativas são piores: `t` faz
  *think* virar `[tʃĩk]` em boca brasileira (o português palataliza `ti`), e `s`
  faz *three* virar `srí`, que é impronunciável.
- **`[ð]` → `d`** (*the* `da`, *this* `dís`, *mother* `máder`).
  É a variante mundial mais reconhecida, e a que os próprios falantes de inglês
  usam quando relaxam.

**Compromisso assumido:** ela nunca vai produzir o `th` verdadeiro só lendo a
transcrição. Vai produzir uma variante inteligível. O áudio do app existe para o
resto.

### O `h` é pronunciado; o `r` não é o `r` português

Estas duas letras são as únicas que exigem uma regra decorada. Vale a pena:

- **`h` = sopro**, exatamente o som do `r` inicial de *rato* ou do `rr` de
  *carro*, só que mais leve. `hêlp`, `hév`, `háu`, `hôum`.
  Nunca é mudo.
- **`r` = o r inglês**: língua recuada, sem toque, sem raspar na garganta.
  **Nunca** é o `r` de *rato* (garganta) nem o `r` batido de *caro*.
  O que mais se aproxima em português é o `r` de *porta* dito por um mineiro ou
  um caipira — a língua enrola para trás e a garganta não faz nada.
  Por isso o `r` **nunca aparece dobrado**.

### `r` no fim: existe, e é a marca do americano

O inglês americano é **rótico**: *water* termina em `r`, e é isso que separa o
americano de tudo o resto.

| inglês | ❌ | ✅ |
|---|---|---|
| water | ~~uóta~~ | `uóter` |
| card | ~~cáad~~ | `cárd` |
| first | ~~fêst~~ | `fêrst` |
| corner | ~~cóna~~ | `córner` |
| here | ~~hía~~ | `hír` |
| four | ~~fó~~ | `fór` |
| emergency | ~~imêdjansi~~ | `imêrdjensi` |

O erro a evitar agora não é escrever o `r` — é **lê-lo à portuguesa**. Ver a
regra do `r` acima: língua para trás, garganta parada.

### Consoante final: pára e pronto

O português põe uma vogal depois de consoante final: *bed* → "bédji", *big* →
"bígui", *stop* → "stópi". Em inglês isso cria uma sílaba extra e a palavra deixa
de ser reconhecida.

**Escrevemos a consoante nua e ela termina ali:** `bêd` (não "bédji"),
`bíg` (não "bígui"), `stóp` (não "stópi"), `gúd`, `uónt`.
Pela mesma razão, **`t` e `d` nunca viram `tch`/`dj`**: `tíi` (tea) é `[ti]`, não
`[tʃi]`; `dís` (this) é `[dis]`, não `[dʒis]`. O português palataliza antes de `i`
— aqui, não.

**Cuidado com o `l` final.** O português transforma `l` final em `[w]`
("Brasiu"). O americano faz um `l` escuro, com a língua a tocar em cima
(*milk*, *well*, *small*). Escrevemos `l` normalmente (`smól`, `guêrl`, `uêl`) e
a diferença fica para o áudio — é pequena e nunca impede a compreensão.

**Cuidado com nasalização.** Antes de `n`/`m`, o português nasaliza a vogal e come
a consoante: `hénd` viraria "hẽd". Em inglês a vogal fica **oral** e o `n` é
**pronunciado**: `hénd`, `uónt`, `fínk`, `cám`.

---

## 5. Frases: transcreve-se a frase inteira, com ligação

Frases **não** são transcritas palavra a palavra. Transcreve-se como sai na fala,
com as reduções e as ligações naturais:

| inglês | transcrição |
|---|---|
| How are you? | `háu ar iú` |
| Nice to meet you | `náis ta míitchu` |
| Thank you | `fénk iú` |
| I don't understand | `ái dôunt andersténd` |
| Can you speak slowly? | `ken iu spíik slôuli` |
| Of course | `av córs` |

Repare em `míitchu`: *meet you* funde-se em `[miːtʃu]`. Em `av córs`, *of*
reduz-se. Em `ken iu`, *can* reduz-se. É isso que se ouve.

As funcionais com `r` também reduzem, e o `r` fica: *for* → `fer`
(`fénk iu fer iór táim`), *are* → `ar` (`háu ar iú`), *your* → `iór`.

**Cartões de verbo** (`to go`, `to buy`) levam o `to` reduzido: `ta gôu`, `ta bái`.

**Cartões do baralho `irregular`** (o `en` é `go → went`) transcrevem **as duas
formas**, mantendo a seta: `gôu → uént`, `fínk → fót`.

**Cartões de gramática** cujo `en` traz barras espelham a mesma estrutura:
`my / your / his / her` → `mái / iór / híz / hêr`.

---

## 6. Americano — o que é mesmo diferente

### O que escrevemos à maneira americana

1. **Rótico** (§4): todo `r` que o inglês escreve no fim de sílaba é escrito.
   É a mudança que se ouve à distância.

2. **NURSE é `êr`**: *work* `uêrk`, *first* `fêrst`, *girl* `guêrl`, *her* `hêr`.
   Fechado, não aberto — `fárst` puxaria para *fast*.

3. **O `a` curto em BATH**: *ask* `ésk`, *last* `lést`, *can't* `ként`,
   *bath* `béf`, *after* `éfter`, *half* `héf`. Não é o `áask` britânico.

4. **`é` cobre TRAP e BATH ao mesmo tempo**, porque em americano é a mesma vogal
   `[æ]`. E `ê` continua a ser DRESS. Portanto **`béd` é *bad* e `bêd` é *bed***
   — não é gralha, é a mesma diferença de *avó/avô*.

5. **Fusão ferry/fairy**: antes de `r`, DRESS sobe para SQUARE. *ferry* `féri`,
   *very* `véri` — com `é`, não `ê`.

6. **Sem yod depois de n/t/d**: *new* `nú`, *knew* `nú`.

7. **Vocabulário kiwi mantido, fonética americana**: `flét uáit`, `êftpos`,
   `déri`, `da uérhaus`, `káuntdaun`, `tchírz`, `ón spêchal`, `tróli`,
   `têikauei`.

### O que ela vai *ouvir* e não está escrito aqui

- **O flap do `t`** — *water* soa a `uóder`, *city* a `sídi`. Não escrevemos,
  porque `uóter` com `t` limpo é americano cuidado e sempre entendido, e porque
  o `r` batido do português no meio da palavra puxaria para outro som.
- **LOT vs. THOUGHT** — juntámos *cot* e *caught* em `ó`. A maior parte da
  América já os junta na fala; nenhuma palavra do corpo dela depende disso.
- **O sotaque neozelandês inteiro** — *bad* que soa a *bed*, *fish and chips*
  que soa a *fush and chups*, *here* e *hair* iguais. Isso é o Ear Training, e
  continua kiwi de propósito: é o que ela vai ouvir quando chegar.

---

## 7. Checklist antes de dar uma entrada por boa

1. Li em voz alta como português? Sai algo que um americano reconhece?
2. Tem **um** acento por palavra de conteúdo, na sílaba tónica?
3. Todo `r` que o inglês escreve está lá? (`uóter`, não `uóta`)
4. Nenhum `nh`, `lh`, `rr`, `x`, `qu`, `ç`?
5. `[k]`/`[g]` escritos com a letra certa para a vogal seguinte (`guêt`, não `gêt`)?
6. `s` entre vogais está dobrado se for `[s]`?
7. DRESS levou `ê`, TRAP **e BATH** levaram `é`?
8. NURSE levou `êr` e o *lettER* átono levou `er`?
9. É frase? Então está transcrita ligada e com as funcionais reduzidas?
10. Cabe numa linha de telemóvel? (limite de 40 caracteres, testado)

## 8. Onde isto vive

- Entradas: `src/content/authored/phonetics.ts` — `PHONETICS: Record<string, string>`,
  **com chave no `id` do cartão** (`survival_0`, `numbers_3`, `irregular_11`…).
- A junção acontece em `src/content/index.ts`, que faz
  `{ ...card, phonetic: PHONETICS[card.id] ?? card.phonetic }` ao montar `DECKS`.
  `ALL_CARDS` e `CARD_INDEX` derivam dos decks já juntados, portanto todo o app vê.
- `src/content/decks.generated.ts` é gerado por `scripts/extract-content.mjs` e
  **não pode ser editado à mão** — daí a tabela separada.
- A voz do curso é `en-US` (`defaultAccent` em `src/courses/index.ts`), para que
  o que ela lê e o que ela ouve sejam o mesmo sotaque. Perfis criados antes da
  troca mantêm a escolha guardada e mudam nos Ajustes.
- Cobertura e as regras verificáveis (§4, §6, §7) estão testadas em
  `src/content/phonetics.test.ts`.

Uma chave errada **não dá erro**: simplesmente não aparece pronúncia nenhuma.
Confira o `id` no ficheiro de origem antes de escrever a entrada.
