#pragma once

// Copie este arquivo para "secrets.h" (ignorado pelo git) e preencha os valores.
// NUNCA coloque a service_role key do Supabase no dispositivo.

#define WIFI_SSID       "sua-rede"
#define WIFI_SENHA      "sua-senha"
#define WIFI_SSID_2     "rede-reserva"   // opcional: usada se a primeira nao estiver disponivel
#define WIFI_SENHA_2    "senha-reserva"

// Edge Function que recebe a situação da vaga.
// Supabase local: use o IP do notebook na rede Wi-Fi (não "localhost"), ex.:
//   "http://192.168.0.10:54321/functions/v1/iot-situacao-vaga"
// Supabase na nuvem:
//   "https://<project-ref>.supabase.co/functions/v1/iot-situacao-vaga"
#define URL_FUNCAO      "http://192.168.0.10:54321/functions/v1/iot-situacao-vaga"

// Credenciais exibidas uma única vez ao registrar o dispositivo no app
// (o banco guarda só o hash do token).
#define DISPOSITIVO_ID      "esp32-vaga-01"
#define DISPOSITIVO_TOKEN   "token-do-dispositivo"
