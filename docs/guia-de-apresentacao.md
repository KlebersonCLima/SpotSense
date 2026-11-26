# Guia de apresentação — SpotSense

Leia este arquivo de cima a baixo uma vez e você consegue explicar o projeto inteiro.
Ele está na ordem em que se apresenta: **o quê → como → por quê → como foi feito**.

---

## 1. O projeto em uma frase

> Um sensor numa vaga de estacionamento detecta se há um carro e, em segundos, o site mostra a vaga como livre ou ocupada, sem ninguém clicar em nada.

**Problema que resolve:** saber, sem olhar, quais vagas estão livres.
**Diferencial:** mistura vagas **simuladas** (clicadas na tela) com **uma vaga física real** (sensor).

---

## 2. O caminho do dado (o mais importante)

```
 ┌────────┐   ┌────────┐  Wi-Fi  ┌─────────────┐  ┌──────────┐ Realtime ┌────────┐
 │ Sensor │──▶│ ESP32  │────────▶│ Edge        │─▶│ Banco    │─────────▶│  Site  │
 │HC-SR04 │   │decide  │  HTTPS  │ Function    │  │PostgreSQL│          │ Nuxt   │
 └────────┘   └────────┘         └─────────────┘  └──────────┘          └────────┘
   1. mede      2. livre?          3. confere        4. grava            5. atualiza
   distância    ocupada?           o token                                a tela
```

| # | Quem | O que faz |
|---|---|---|
| 1 | **Sensor HC-SR04** | Emite um som que ninguém ouve e mede quanto tempo o eco leva para voltar. Tempo → distância. |
| 2 | **ESP32** | Microcontrolador com Wi-Fi. Lê o sensor, decide "livre" ou "ocupada" e avisa o servidor **só quando muda**. |
| 3 | **Edge Function** | Um pequeno programa na nuvem. Confere se quem enviou é um dispositivo autorizado (token) antes de aceitar. |
| 4 | **Banco (PostgreSQL)** | Guarda estacionamentos, vagas, dispositivos e histórico. Também aplica as regras de segurança. |
| 5 | **Realtime + Site** | O banco avisa o site que algo mudou; o site redesenha a vaga sem recarregar a página. |

---

## 3. Cada peça por dentro

### 3.1 O sensor e a decisão "livre / ocupada" (firmware)

Arquivo: [`firmware/comum/SensorVaga/src/SensorVaga.cpp`](../firmware/comum/SensorVaga/src/SensorVaga.cpp)

Um sensor barato é "barulhento": uma leitura isolada pode errar. Por isso o código não confia em uma medida só:

| Técnica | O que faz | Por quê |
|---|---|---|
| **Mediana de 5 leituras** | Mede 5 vezes e usa o valor do meio | Ignora picos errados |
| **Calibração automática** | Ao ligar, mede o "fundo" (a vaga vazia) | Funciona em qualquer altura de instalação |
| **Margem** | Ocupada se algo estiver ≥ 8% (mín. 1,5 cm) mais perto que o fundo | Detecta até uma mão encostada na superfície |
| **Histerese** | Para ocupar precisa chegar bem perto; para liberar basta voltar perto do fundo | Evita ficar piscando na fronteira |
| **3 confirmações** | A mudança só vale se repetir 3 vezes seguidas | Evita falso alarme |
| **Correção do fundo** | Se o fundo ficou mais longe, adota o novo | Perdoa quem ligou a placa com algo na vaga |

> **Regra de ouro ao ligar:** a vaga precisa estar **vazia**, porque é aí que ele mede o fundo.

A mesma biblioteca (`comum/`) é usada pelo Arduino UNO e pelo ESP32: a lógica é escrita **uma vez**.

### 3.2 O ESP32 (envio por Wi-Fi)

Arquivo: [`firmware/esp32/src/main.cpp`](../firmware/esp32/src/main.cpp)

- Conecta numa lista de redes: **casa** e **hotspot do celular**. Usa a que estiver disponível (útil na PUC).
- Quando a situação muda (e a cada 30 s, como "sinal de vida"), faz:

```
POST https://<projeto>.supabase.co/functions/v1/iot-situacao-vaga
x-dispositivo-id:    esp32-vaga-20
x-dispositivo-token: <token secreto>
corpo:               {"situacao":"ocupada"}
```

- Se a rede cair, tenta de novo a cada 3 s, sem travar a leitura do sensor.
- As credenciais ficam em `include/secrets.h`, que **não vai para o git**.

**Ligação elétrica:** o Echo do sensor responde com 5 V, mas o ESP32 só aguenta 3,3 V. Por isso o Echo passa por um **divisor de tensão** (1 kΩ + 2 kΩ). Detalhes em [firmware/README.md](../firmware/README.md).

### 3.3 A Edge Function (o "porteiro")

Arquivo: [`supabase/functions/iot-situacao-vaga/index.ts`](../supabase/functions/iot-situacao-vaga/index.ts)

Recebe o POST e faz, nesta ordem:

1. Só aceita `POST`. Exige os dois headers (senão `401`).
2. Valida o corpo: `situacao` deve ser `livre` ou `ocupada` (senão `400`).
3. Busca o dispositivo pelo identificador e compara o **hash do token** (`401` se não bater).
4. Se o dispositivo estiver desativado: `403`.
5. Se a vaga ligada a ele **não for física**: `409`.
6. Atualiza a situação só se mudou, e responde `200 {ok, numero_vaga, situacao, alterada}`.

**Por que existe essa função, em vez de o ESP32 gravar direto no banco?**
Porque gravar no banco exigiria uma chave poderosa dentro da placa. Se alguém abrisse o ESP32, teria acesso a tudo. Com a função, a placa só carrega um token que serve **para uma única vaga**, e a chave poderosa (`service_role`) fica só no servidor.

### 3.4 O banco de dados

Arquivo: [`supabase/migrations/20261104180000_schema_inicial.sql`](../supabase/migrations/20261104180000_schema_inicial.sql)

| Tabela | O que guarda |
|---|---|
| `tblestacionamentos` | Estacionamentos (cada um tem um dono) |
| `tblvagas` | Vagas: número, **tipo** (simulada/fisica) e **situação** (livre/ocupada) |
| `tbldispositivosiot` | Dispositivos ESP32 vinculados a vagas físicas (guarda o **hash** do token) |
| `tblhistoricovagas` | Cada mudança de situação e a origem (`manual` ou `sensor`) |

> Padrão de nomes: prefixo `tbl` + nome em português, sem `_`.

O banco não é só um depósito: ele **impõe as regras**.

| Regra | Como é garantida |
|---|---|
| Cada usuário só vê os próprios estacionamentos | **RLS** (Row Level Security): políticas por linha |
| **Vaga física não muda pela tela** | *Trigger* `tblvagas_antes_de_atualizar`: se alguém que não é o servidor tenta mudar uma vaga física, o banco recusa |
| Histórico automático | *Trigger* grava em `tblhistoricovagas` a cada mudança; marca `sensor` se veio do servidor, `manual` se veio do usuário |
| O token nunca vaza | Só o **hash SHA-256** é guardado; o frontend nem consegue ler essa coluna |
| Token aparece uma única vez | A função `registrar_dispositivo_iot` gera o token, devolve uma vez e guarda só o hash |

### 3.5 O site (Nuxt 3)

Pasta: [`apps/web`](../apps/web)

Camadas, de cima para baixo (cada uma só conversa com a de baixo):

```
pages  →  components  →  composables  →  services  →  Supabase
telas     peças visuais   estado/lógica    consultas     banco
```

| Camada | Exemplo | Papel |
|---|---|---|
| `pages/` | `estacionamentos/[id].vue` | A tela; junta as peças |
| `components/` | `MapaEstacionamento.vue`, `VagaSlot.vue` | Peças reutilizáveis |
| `composables/` | `useVagas`, `useVagasRealtime` | Estado e lógica reativa |
| `services/` | `vagas.service.ts` | Consultas ao banco, sem nada de tela |

**Tempo real:** [`useVagasRealtime.ts`](../apps/web/composables/useVagasRealtime.ts) se inscreve nas mudanças da tabela `tblvagas`. Quando o sensor muda uma vaga, o banco avisa e a tela atualiza sozinha. Não existe "recarregar".

**Visual:** Glassmorphism, tema escuro, cores `#101010`, `#FFFFFF` e `#C8FF00`, definidas em um só lugar (`assets/css/main.css`).

---

## 4. Por que estas escolhas

| Decisão | Motivo |
|---|---|
| **Supabase** (sem backend próprio) | Já entrega banco, login, tempo real e funções. Menos peças para manter |
| **Edge Function** entre ESP32 e banco | Segurança: a placa nunca carrega chave administrativa |
| **Token com hash** | Mesmo que o banco vaze, o token real não aparece |
| **Regra no banco** (trigger/RLS), não só na tela | A tela pode ser burlada; o banco, não |
| **Wi-Fi + HTTP** | É o que o ESP32 faz de melhor; simples de testar até com `curl` |
| **Biblioteca `comum`** | A lógica do sensor é escrita uma vez e usada por UNO e ESP32 |
| **Dois modos (nuvem e local)** | Se a internet falhar na apresentação, o notebook roda tudo sozinho |
| **Calibração automática** | Evita ajustar números na mão a cada instalação |

---

## 5. Como o projeto foi desenvolvido (metodologia)

Desenvolvimento **incremental, por camadas**: cada etapa entregava algo que já funcionava, e a seguinte se apoiava nela. Os commits do repositório contam essa história.

| Etapa | O que foi feito | Como foi validado |
|---|---|---|
| 1. Estrutura | Monorepo (pnpm), regras do projeto, documentação de contexto | Instalação e `lint` |
| 2. Banco e site | Tabelas, RLS, triggers, telas, mapa em tempo real, Edge Function | `curl` simulando o ESP32, antes de ter a placa |
| 3. Padronização | Todo o código e o banco traduzidos para português | `lint` e `typecheck` a cada passo |
| 4. Protótipo com UNO | Sensor + Arduino UNO + script (`ponte`) que leva os dados ao servidor | Mão na frente do sensor → vaga muda no site |
| 5. Ajuste do sensor | Testes reais mostraram falsos "ocupada"; criamos mediana, calibração, histerese e confirmações | Ensaios com leituras impressas ao vivo |
| 6. ESP32 | Placa com Wi-Fi manda direto à função; sem notebook no meio | Monitor serial: `POST ... HTTP 200` |
| 7. Nuvem (plano B) | Supabase na nuvem + site no GitHub Pages; Wi-Fi duplo | Placa gravando na nuvem, site refletindo |

Princípios seguidos:

1. **Testar cada elo sozinho antes de juntar.** Primeiro a função (com `curl`), depois o sensor, depois tudo junto.
2. **Simular antes de ter o hardware.** O contrato `POST` foi definido e testado sem a placa.
3. **Medir e ajustar com dados reais.** O sensor foi corrigido olhando as leituras, não por palpite.
4. **Segurança desde o início**, não no final.
5. **Plano B guardado.** Rodar local ficou intacto enquanto a nuvem era montada.

---

## 6. Como demonstrar

**Roteiro de 3 minutos:**

1. Abrir o site, entrar, abrir o estacionamento: mostrar o mapa com as vagas.
2. Clicar numa vaga **simulada**: ela troca na hora.
3. Tentar clicar na vaga **física**: não deixa. *(Mostra a regra.)*
4. Passar a mão/objeto na frente do sensor: a vaga física vira **ocupada** sozinha. Tirar: volta a **livre**.
5. Mostrar o feed de atividade: aparece **Sensor IoT** como origem.

**Antes de apresentar (checklist):**

- [ ] Placa ligada com a vaga **vazia** (é nessa hora que calibra).
- [ ] Wi-Fi 2,4 GHz disponível (rede de casa ou hotspot do celular).
- [ ] Site aberto e logado.
- [ ] Plano B: Docker aberto + `pnpm db:start` + `pnpm dev`, e a placa apontando para o notebook.

---

## 7. Perguntas que o professor pode fazer

**Por que não gravar direto no banco pelo ESP32?**
Exigiria uma chave administrativa na placa. Com a Edge Function, a placa só tem um token de uma vaga, e a chave poderosa fica no servidor.

**E se alguém descobrir o token?**
Só consegue mudar a situação daquela vaga. Dá para desativar o dispositivo no painel ou gerar um token novo.

**Como o site sabe que mudou, sem recarregar?**
Supabase Realtime: o site fica "escutando" a tabela de vagas. Mudou uma linha, ele é avisado.

**Como garante que a vaga física não é mexida pela tela?**
Pelo banco: um *trigger* recusa a alteração de quem não é o servidor. Mesmo burlando a interface, não funciona.

**Por que o sensor não dá falso alarme?**
Mediana de 5 leituras, 3 confirmações seguidas e histerese. Uma leitura ruim sozinha não muda nada.

**E se faltar internet?**
Existe o modo local: banco e site no notebook (Docker), ESP32 apontando para o IP do notebook.

**Por que o divisor de tensão no Echo?**
O sensor responde com 5 V e o pino do ESP32 aguenta 3,3 V. Sem divisor, queimaria o pino.

**Quais as limitações?**
Uma vaga física só; o sensor ultrassônico não distingue carro de outro objeto; precisa de Wi-Fi 2,4 GHz; o ESP32 usa HTTPS sem validar o certificado (aceitável no projeto acadêmico, em produção validaria).

**Como escalaria?**
Mais vagas físicas = mais dispositivos, cada um com seu token. O banco e a função já suportam isso; falta só montar os sensores.

---

## 8. Mapa dos arquivos (onde procurar)

| Quero ver... | Arquivo |
|---|---|
| Como o sensor decide | `firmware/comum/SensorVaga/src/SensorVaga.cpp` |
| Envio por Wi-Fi | `firmware/esp32/src/main.cpp` |
| Wi-Fi, URL e token do ESP32 | `firmware/esp32/include/secrets.h` (local, fora do git) |
| O "porteiro" | `supabase/functions/iot-situacao-vaga/index.ts` |
| Tabelas, regras e segurança | `supabase/migrations/20261104180000_schema_inicial.sql` |
| Tempo real no site | `apps/web/composables/useVagasRealtime.ts` |
| Consultas ao banco | `apps/web/services/*.service.ts` |
| Mapa de vagas | `apps/web/components/vagas/MapaEstacionamento.vue` |
| Publicação no GitHub Pages | `.github/workflows/pages.yml` |

---

## 9. Glossário rápido

| Termo | Significa |
|---|---|
| **IoT** | Internet das Coisas: objetos físicos conectados à internet |
| **ESP32** | Placa com processador e Wi-Fi, que lê o sensor |
| **HC-SR04** | Sensor ultrassônico de distância |
| **Edge Function** | Programa pequeno que roda na nuvem, sob demanda |
| **RLS** | Regras do banco que dizem quem pode ver/alterar cada linha |
| **Trigger** | Regra automática do banco, disparada quando uma linha muda |
| **Realtime** | Aviso instantâneo do banco para o site quando algo muda |
| **Hash** | "Impressão digital" irreversível do token: dá para conferir, não para recuperar |
| **Histerese** | Limites diferentes para ligar e desligar, para não oscilar |
| **Token** | Senha de máquina que identifica o dispositivo |
