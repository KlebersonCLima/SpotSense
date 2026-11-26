#include <Arduino.h>
#include <HTTPClient.h>
#include <SensorVaga.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#include "secrets.h"

// SpotSense — vaga física no ESP32 (sensor HC-SR04 + envio por Wi-Fi).
//
// A lógica do sensor está em firmware/comum/SensorVaga (compartilhada com o UNO).
// Quando a situação muda (e a cada INTERVALO_REENVIO_MS), envia:
//   POST <URL_FUNCAO>  headers x-dispositivo-id / x-dispositivo-token
//   corpo {"situacao":"ocupada"} ou {"situacao":"livre"}
//
// Ligue com a vaga VAZIA: a placa mede o fundo e calibra sozinha.
//
// Ligação (ESP32 DevKit): VCC -> 5V (VIN) | GND -> GND | Trig -> GPIO 5
//   Echo -> GPIO 18 **através de divisor de tensão** (o Echo responde com 5 V
//   e o pino do ESP32 aguenta no máximo 3,3 V): Echo -> 1 kΩ -> GPIO 18 -> 2 kΩ -> GND.

const uint8_t PINO_GATILHO = 5;
const uint8_t PINO_ECO = 18;
const uint8_t PINO_LED = 2;  // LED da placa; acende quando a vaga está ocupada

const unsigned long INTERVALO_LEITURA_MS = 100;
const unsigned long INTERVALO_REENVIO_MS = 30000;  // reenvia mesmo sem mudança
const unsigned long INTERVALO_NOVA_TENTATIVA_MS = 3000;
const unsigned long TEMPO_LIMITE_WIFI_MS = 15000;

SensorVaga sensor(PINO_GATILHO, PINO_ECO);
bool envioPendente = true;  // envia a situação inicial assim que houver rede
unsigned long ultimoEnvioMs = 0;
unsigned long ultimaTentativaMs = 0;

void conectarWifi() {
    if (WiFi.status() == WL_CONNECTED) {
        return;
    }
    Serial.printf("Conectando ao Wi-Fi \"%s\"...\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_SENHA);

    unsigned long inicio = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - inicio < TEMPO_LIMITE_WIFI_MS) {
        delay(300);
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("Wi-Fi conectado. IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("Wi-Fi indisponível; nova tentativa em breve.");
    }
}

// Envia a situação atual. Retorna true se o servidor respondeu 2xx.
bool enviarSituacao() {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }

    // Ordem importa: o HTTPClient guarda um ponteiro para o cliente de conexão.
    // Os clientes são declarados ANTES para serem destruídos DEPOIS do http
    // (declarar o http primeiro derrubava a placa ao sair da função).
    WiFiClientSecure clienteSeguro;
    WiFiClient cliente;
    HTTPClient http;

    bool https = String(URL_FUNCAO).startsWith("https");
    if (https) {
        clienteSeguro.setInsecure();  // projeto acadêmico: sem validar o certificado
        http.begin(clienteSeguro, URL_FUNCAO);
    } else {
        http.begin(cliente, URL_FUNCAO);
    }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-dispositivo-id", DISPOSITIVO_ID);
    http.addHeader("x-dispositivo-token", DISPOSITIVO_TOKEN);

    String corpo = String("{\"situacao\":\"") + sensor.situacao() + "\"}";
    int codigo = http.POST(corpo);
    String resposta = http.getString();
    http.end();

    Serial.printf("POST %s -> HTTP %d %s\n", corpo.c_str(), codigo, resposta.c_str());
    return codigo >= 200 && codigo < 300;
}

void setup() {
    Serial.begin(115200);
    Serial.println("SpotSense ESP32 iniciado");
    pinMode(PINO_LED, OUTPUT);
    sensor.iniciar();  // ligar com a vaga vazia: calibra o fundo
    Serial.printf("Vaga vazia calibrada em %.1f cm\n", sensor.distanciaFundoCm());
    if (sensor.fundoMuitoPerto()) {
        Serial.println("AVISO: sensor muito perto da superficie; eleve o sensor (ideal 10 a 30 cm)");
    }
    conectarWifi();
}

void loop() {
    if (sensor.atualizar()) {
        digitalWrite(PINO_LED, sensor.ocupada() ? HIGH : LOW);
        Serial.printf("Situação mudou: %s (%.1f cm)\n", sensor.situacao(), sensor.ultimaDistanciaCm());
        envioPendente = true;
    }

    unsigned long agora = millis();
    if (!envioPendente && agora - ultimoEnvioMs >= INTERVALO_REENVIO_MS) {
        envioPendente = true;
    }

    if (envioPendente && agora - ultimaTentativaMs >= INTERVALO_NOVA_TENTATIVA_MS) {
        ultimaTentativaMs = agora;
        conectarWifi();
        if (enviarSituacao()) {
            envioPendente = false;
            ultimoEnvioMs = millis();
        }
    }

    delay(INTERVALO_LEITURA_MS);
}
