#pragma once

#include <Arduino.h>

// SpotSense — lógica do sensor da vaga física, compartilhada entre o UNO e o ESP32.
//
// Calibração automática: ao iniciar, mede a distância da vaga vazia (o "fundo").
// A vaga fica ocupada quando algo aparece bem mais perto que o fundo, então
// funciona em qualquer altura de montagem. Se o fundo ficar mais longe depois
// (ex.: ligou com o carrinho na vaga e ele saiu), o fundo é corrigido sozinho.

class SensorVaga {
public:
    SensorVaga(uint8_t pinoGatilho, uint8_t pinoEco);

    // Configura os pinos e calibra o fundo (ligar com a vaga vazia).
    void iniciar();

    // Faz uma leitura filtrada e atualiza a situação.
    // Retorna true somente quando a situação mudou (já confirmada).
    bool atualizar();

    bool ocupada() const { return _ocupada; }
    const char* situacao() const { return _ocupada ? "ocupada" : "livre"; }
    float distanciaFundoCm() const { return _fundoCm; }
    float ultimaDistanciaCm() const { return _ultimaDistanciaCm; }

    // Fundo muito perto: o sensor provavelmente está encostado na superfície.
    bool fundoMuitoPerto() const;

private:
    float lerDistanciaCm();
    float lerDistanciaMediana();
    float margemCm() const;

    uint8_t _pinoGatilho;
    uint8_t _pinoEco;
    float _fundoCm = 0;
    float _ultimaDistanciaCm = 0;
    bool _ocupada = false;
    uint8_t _leiturasDiferentes = 0;
    uint8_t _leiturasAlemDoFundo = 0;
};
