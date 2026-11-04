#pragma once

// Copie este arquivo para "secrets.h" (ignorado pelo git) e preencha os valores.
// NUNCA coloque a service_role key do Supabase no dispositivo.

#define WIFI_SSID       "sua-rede"
#define WIFI_PASSWORD   "sua-senha"

// URL da Edge Function que recebe o estado da vaga
#define API_ENDPOINT    "https://<project-ref>.supabase.co/functions/v1/<nome-da-funcao>"

// Credenciais do dispositivo (cadastradas em iot_devices; o banco guarda só o hash do token)
#define DEVICE_ID       "esp32-vaga-50"
#define DEVICE_TOKEN    "token-do-dispositivo"
