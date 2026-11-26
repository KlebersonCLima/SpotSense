# Firmware ESP32 — SpotSense

Mede a vaga com o HC-SR04 e envia `livre` ou `ocupada` ao servidor por Wi-Fi.
Passo a passo completo (ligação do sensor, divisor de tensão, configuração): [../README.md](../README.md).

## Comandos (dentro de `firmware/esp32`)

```bash
python -m platformio run                # compila
python -m platformio run -t upload      # grava na placa (USB)
python -m platformio device monitor     # monitor serial (115200)
```

## Configuração

Copie `include/secrets.example.h` para `include/secrets.h` (ignorado pelo git) e preencha:
`WIFI_SSID`, `WIFI_SENHA`, `URL_FUNCAO`, `DISPOSITIVO_ID`, `DISPOSITIVO_TOKEN`.

> Nunca coloque a `service_role` key do Supabase no firmware.

## Estrutura

```
esp32/
├── platformio.ini            # placa e bibliotecas (usa ../comum)
├── include/secrets.example.h # modelo de credenciais
└── src/main.cpp              # Wi-Fi + envio; a lógica do sensor está em ../comum
```
