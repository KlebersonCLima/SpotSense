# Firmware ESP32 — SpotSense

Firmware da vaga física da maquete. Lê o sensor de presença e envia o estado da vaga para a Edge Function do Supabase via HTTP.

## Ferramentas

- VS Code + extensão **PlatformIO IDE**
- Placa: ESP32 DevKit (`esp32dev`), framework Arduino

## Configuração

1. Copie `include/secrets.example.h` para `include/secrets.h` (esse arquivo é ignorado pelo git).
2. Preencha Wi-Fi, URL da Edge Function, identificador e token do dispositivo.

> Nunca coloque a `service_role` key do Supabase no firmware.

## Compilar e gravar

Pela barra do PlatformIO no VS Code (✓ Build, → Upload, 🔌 Monitor) ou pelo terminal, dentro de `firmware/esp32`:

```bash
pio run                 # compila
pio run -t upload       # grava na placa
pio device monitor      # monitor serial (115200)
```

## Estrutura

```
esp32/
├── platformio.ini            # placa, framework e bibliotecas
├── include/
│   └── secrets.example.h     # modelo de credenciais
└── src/
    └── main.cpp              # ponto de entrada
```
