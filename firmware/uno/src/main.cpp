#include <Arduino.h>
#include <SensorVaga.h>

// SpotSense — vaga física no Arduino UNO (sensor HC-SR04 + ponte serial no notebook).
//
// A lógica do sensor está em firmware/comum/SensorVaga (compartilhada com o ESP32).
// Ligue a placa com a vaga VAZIA: ela mede o fundo e calibra sozinha.
// Saída na serial: "situacao=livre" ou "situacao=ocupada", ao ligar e a cada mudança.
// Ao receber "?" pela serial, responde a situação atual (usado pela ponte).
// Linhas começando com # são avisos; a ponte as ignora.
//
// Ligação: VCC -> 5V | GND -> GND | Trig -> D9 | Echo -> D10

const uint8_t PINO_GATILHO = 9;
const uint8_t PINO_ECO = 10;
const uint8_t PINO_LED = LED_BUILTIN;  // acende quando a vaga está ocupada

const unsigned long INTERVALO_LEITURA_MS = 100;

SensorVaga sensor(PINO_GATILHO, PINO_ECO);

void enviarSituacao() {
    Serial.print("situacao=");
    Serial.println(sensor.situacao());
}

void setup() {
    pinMode(PINO_LED, OUTPUT);
    Serial.begin(9600);
    sensor.iniciar();
    Serial.print("# SpotSense UNO iniciado. Vaga vazia calibrada em ");
    Serial.print(sensor.distanciaFundoCm(), 1);
    Serial.println(" cm");
    if (sensor.fundoMuitoPerto()) {
        Serial.println("# AVISO: sensor muito perto da superficie; eleve o sensor (ideal 10 a 30 cm)");
    }
    enviarSituacao();
}

void loop() {
    bool mudou = sensor.atualizar();
#ifdef DIAGNOSTICO
    Serial.print("# distancia_cm=");
    Serial.print(sensor.ultimaDistanciaCm(), 1);
    Serial.print(" fundo_cm=");
    Serial.print(sensor.distanciaFundoCm(), 1);
    Serial.print(" ");
    Serial.println(sensor.situacao());
#endif
    if (mudou) {
        digitalWrite(PINO_LED, sensor.ocupada() ? HIGH : LOW);
        enviarSituacao();
    }
    // Pedido da ponte: "?" devolve a situação atual.
    while (Serial.available() > 0) {
        if (Serial.read() == '?') {
            enviarSituacao();
        }
    }
    delay(INTERVALO_LEITURA_MS);
}
