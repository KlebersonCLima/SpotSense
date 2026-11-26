# Firmware — como funciona

## A ideia em 30 segundos

```
HC-SR04 ──▶ placa (mede, decide) ──▶ Edge Function ──▶ banco ──▶ mapa no app
 distância     "livre" ou "ocupada"    confere o token    Realtime
```

1. O **sensor** mede a distância até a vaga (ultrassom, igual a um morcego).
2. A **placa** compara com o "fundo" (a vaga vazia, medido ao ligar). Se algo chegou bem mais perto, a vaga está **ocupada**.
3. Só quando a situação **muda**, ela avisa o servidor: `{"situacao":"ocupada"}` + identificador + token.
4. O servidor confere o token, grava no banco, e o app atualiza o mapa sozinho.

## Pastas

| Pasta | O que é |
|---|---|
| `comum/SensorVaga` | A lógica do sensor (medir, filtrar, calibrar). **Usada pelas duas placas.** |
| `esp32/` | Firmware do ESP32: lógica do sensor + Wi-Fi + envio. **É o definitivo.** |
| `uno/` | Firmware do Arduino UNO: só imprime a situação na USB. Foi usado para testar. |
| `ponte/` | Script do notebook que leva a situação do UNO até o servidor (UNO não tem Wi-Fi). |

## Ligação do sensor no ESP32

| HC-SR04 | ESP32 (DevKit) | Observação |
|---|---|---|
| VCC | **VIN** (5V) | Não use o 3V3: o sensor fica fraco |
| GND | **GND** | |
| Trig | **GPIO 5** (D5) | |
| Echo | **GPIO 18** (D18) | **Passar pelo divisor de tensão** (abaixo) |

**Por que o divisor?** O Echo devolve 5 V, mas o pino do ESP32 só aguenta 3,3 V.

```
Echo ──[ 1 kΩ ]──┬── GPIO 18
                 │
              [ 2 kΩ ]
                 │
                GND
```

Serve qualquer par com a proporção 1:2 (ex.: 2,2 kΩ e 4,7 kΩ). Desligue o USB antes de ligar os fios.

## Colocar o ESP32 para funcionar

1. **Ligue o sensor** como na tabela acima. Aponte-o para a vaga, a 10 a 30 cm da superfície. Ele precisa estar parado.
2. **Suba o sistema:** Docker aberto, `pnpm db:start`, `pnpm dev`.
3. **Registre o dispositivo** no app (vaga **física** → dispositivo IoT). Copie o **identificador** e o **token**: o token aparece uma única vez.
4. **Descubra o IP do notebook** (`ipconfig`, linha "Adaptador de Rede sem Fio Wi-Fi"). O ESP32 não enxerga `localhost`: ele precisa do IP. O notebook e o ESP32 têm que estar **na mesma rede Wi-Fi**.
5. **Configure o ESP32:** em `esp32/include/`, copie `secrets.example.h` para `secrets.h` e preencha Wi-Fi, a URL (`http://<IP>:54321/functions/v1/iot-situacao-vaga`), o identificador e o token.
6. **Grave:** conecte o ESP32 por USB e, em `firmware/esp32`, rode `python -m platformio run -t upload`.
7. **Acompanhe:** `python -m platformio device monitor` (115200). Deve aparecer o IP do Wi-Fi e `POST ... -> HTTP 200`.
8. **Ligue a placa com a vaga vazia**: é nesse momento que ela mede o fundo.

Se o monitor mostrar `HTTP 401`: identificador ou token errado. Se não aparecer nada de rede, confira se o Windows está bloqueando a porta 54321 (Firewall).

## Como ela decide (resumo do código)

- Mede **5 vezes** e usa a **mediana** (ignora picos).
- **Ocupada**: algo está ~8% (mínimo 1,5 cm) mais perto que o fundo.
- **3 leituras seguidas** para trocar de estado (evita piscar).
- Se o fundo aumentar (ligou com algo na vaga e saiu), ele se **corrige sozinho**.
- Código completo: [comum/SensorVaga/src/SensorVaga.cpp](comum/SensorVaga/src/SensorVaga.cpp).

## Testar o UNO (sem Wi-Fi)

`python -m platformio run -t upload` em `firmware/uno`, copie `ponte/.env.example` para `.env` (com identificador e token) e rode `python ponte/ponte_serial.py`. Fecha o monitor serial antes: a porta COM só aceita um programa.
