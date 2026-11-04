#include <Arduino.h>

// Fluxo previsto:
// 1. Ler o sensor de presença.
// 2. Detectar mudança de estado (com debounce).
// 3. Enviar o novo estado via HTTP para a Edge Function do Supabase.

void setup() {
    Serial.begin(115200);
    Serial.println("SpotSense ESP32 iniciado");
}

void loop() {
    delay(1000);
}
