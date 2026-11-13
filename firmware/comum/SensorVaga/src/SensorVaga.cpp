#include "SensorVaga.h"

static const uint8_t AMOSTRAS_POR_LEITURA = 5;
static const uint8_t LEITURAS_PARA_CONFIRMAR = 3;        // a mudança só vale se repetir
static const unsigned long TEMPO_LIMITE_ECO_US = 30000;  // ~5 m; sem eco = sem objeto
static const float DISTANCIA_SEM_ECO_CM = 400.0;

// Ocupada quando o objeto está pelo menos MARGEM mais perto que o fundo.
// MARGEM = o maior entre 1,5 cm e 8% do fundo. Com o fundo a ~20 cm, uma mão
// encostada na superfície (~2 cm de altura) já ocupa a vaga.
static const float MARGEM_MINIMA_CM = 1.5;
static const float MARGEM_PROPORCIONAL = 0.08;
// O fundo só é corrigido (para mais longe) com folga, para o ruído não mexer nele.
static const float FOLGA_CORRECAO_FUNDO_CM = 3.0;
static const float FUNDO_MINIMO_RECOMENDADO_CM = 8.0;

SensorVaga::SensorVaga(uint8_t pinoGatilho, uint8_t pinoEco)
    : _pinoGatilho(pinoGatilho), _pinoEco(pinoEco) {}

void SensorVaga::iniciar() {
    pinMode(_pinoGatilho, OUTPUT);
    pinMode(_pinoEco, INPUT);
    delay(100);

    // Calibração: mediana de três leituras filtradas com a vaga vazia.
    float a = lerDistanciaMediana();
    float b = lerDistanciaMediana();
    float c = lerDistanciaMediana();
    _fundoCm = max(min(a, b), min(max(a, b), c));
    _ultimaDistanciaCm = _fundoCm;
}

bool SensorVaga::fundoMuitoPerto() const {
    return _fundoCm < FUNDO_MINIMO_RECOMENDADO_CM;
}

float SensorVaga::margemCm() const {
    return max(MARGEM_MINIMA_CM, _fundoCm * MARGEM_PROPORCIONAL);
}

// Mede a distância em cm. Retorna -1 se não houve eco.
float SensorVaga::lerDistanciaCm() {
    digitalWrite(_pinoGatilho, LOW);
    delayMicroseconds(2);
    digitalWrite(_pinoGatilho, HIGH);
    delayMicroseconds(10);
    digitalWrite(_pinoGatilho, LOW);

    unsigned long duracao = pulseIn(_pinoEco, HIGH, TEMPO_LIMITE_ECO_US);
    if (duracao == 0) {
        return -1;
    }
    return duracao * 0.0343 / 2.0;  // velocidade do som: 0,0343 cm/µs
}

// Mediana de várias medições: ignora picos isolados.
float SensorVaga::lerDistanciaMediana() {
    float valores[AMOSTRAS_POR_LEITURA];
    for (uint8_t i = 0; i < AMOSTRAS_POR_LEITURA; i++) {
        float d = lerDistanciaCm();
        valores[i] = (d < 0) ? DISTANCIA_SEM_ECO_CM : d;  // sem eco = muito longe
        delay(30);
    }
    for (uint8_t i = 1; i < AMOSTRAS_POR_LEITURA; i++) {
        float atual = valores[i];
        int8_t j = i - 1;
        while (j >= 0 && valores[j] > atual) {
            valores[j + 1] = valores[j];
            j--;
        }
        valores[j + 1] = atual;
    }
    return valores[AMOSTRAS_POR_LEITURA / 2];
}

bool SensorVaga::atualizar() {
    float distancia = lerDistanciaMediana();

    // Sem eco com um fundo conhecido: o som foi desviado ou absorvido (ex.: mão
    // inclinada). Leitura descartada; não libera a vaga nem altera a calibração.
    if (distancia >= DISTANCIA_SEM_ECO_CM && _fundoCm < DISTANCIA_SEM_ECO_CM) {
        return false;
    }
    _ultimaDistanciaCm = distancia;

    // Correção do fundo: se a vaga ficou consistentemente mais longe que o fundo,
    // a calibração foi feita com algo na vaga. Adota a nova distância como fundo.
    if (distancia > _fundoCm + FOLGA_CORRECAO_FUNDO_CM) {
        if (++_leiturasAlemDoFundo >= LEITURAS_PARA_CONFIRMAR) {
            _fundoCm = distancia;
            _leiturasAlemDoFundo = 0;
        }
    } else {
        _leiturasAlemDoFundo = 0;
    }

    // Histerese: para ocupar precisa chegar bem perto; para liberar basta
    // voltar para perto do fundo. Evita oscilar na fronteira.
    float limiteOcupar = _fundoCm - margemCm();
    float limiteLiberar = _fundoCm - margemCm() / 2.0;
    bool novaOcupada = _ocupada ? (distancia < limiteLiberar) : (distancia < limiteOcupar);

    if (novaOcupada == _ocupada) {
        _leiturasDiferentes = 0;
        return false;
    }
    if (++_leiturasDiferentes < LEITURAS_PARA_CONFIRMAR) {
        return false;
    }
    _ocupada = novaOcupada;
    _leiturasDiferentes = 0;
    return true;
}
