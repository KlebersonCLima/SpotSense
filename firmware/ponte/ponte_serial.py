"""SpotSense — ponte entre o Arduino UNO (serial) e a Edge Function do Supabase.

Lê as linhas "situacao=livre|ocupada" enviadas pelo UNO e faz o
POST /functions/v1/iot-situacao-vaga com as credenciais do dispositivo.
Linhas começando com # (avisos do firmware) são só exibidas.

Configuração: variáveis de ambiente ou arquivo .env nesta pasta (veja .env.example).
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    import serial
except ImportError:
    sys.exit("Falta o pacote pyserial. Instale com: pip install pyserial")

SITUACOES_VALIDAS = ("livre", "ocupada")
ESPERA_RECONEXAO_S = 3
TEMPO_LIMITE_HTTP_S = 8


def carregar_env():
    """Lê o arquivo .env desta pasta (se existir) sem sobrescrever o ambiente."""
    arquivo = Path(__file__).with_name(".env")
    if not arquivo.exists():
        return
    for linha in arquivo.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        os.environ.setdefault(chave.strip(), valor.strip().strip('"').strip("'"))


def configuracao():
    carregar_env()
    cfg = {
        "porta": os.environ.get("PORTA_SERIAL", "COM5"),
        "baud": int(os.environ.get("BAUD", "9600")),
        "url": os.environ.get(
            "URL_FUNCAO", "http://127.0.0.1:54321/functions/v1/iot-situacao-vaga"
        ),
        "dispositivo_id": os.environ.get("DISPOSITIVO_ID", ""),
        "dispositivo_token": os.environ.get("DISPOSITIVO_TOKEN", ""),
    }
    if not cfg["dispositivo_id"] or not cfg["dispositivo_token"]:
        sys.exit("Defina DISPOSITIVO_ID e DISPOSITIVO_TOKEN (copie .env.example para .env).")
    return cfg


def agora():
    return time.strftime("%H:%M:%S")


def enviar(cfg, situacao):
    """Envia a situação. Retorna "ok", "recusado" (4xx: não adianta repetir) ou "falha" (tentar de novo)."""
    corpo = json.dumps({"situacao": situacao}).encode("utf-8")
    requisicao = urllib.request.Request(
        cfg["url"],
        data=corpo,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-dispositivo-id": cfg["dispositivo_id"],
            "x-dispositivo-token": cfg["dispositivo_token"],
        },
    )
    try:
        with urllib.request.urlopen(requisicao, timeout=TEMPO_LIMITE_HTTP_S) as resposta:
            print(f"[{agora()}] enviado {situacao} -> HTTP {resposta.status} {resposta.read().decode()}")
            return "ok"
    except urllib.error.HTTPError as erro:
        print(f"[{agora()}] servidor respondeu HTTP {erro.code}: {erro.read().decode()}")
        return "recusado" if erro.code < 500 else "falha"
    except (urllib.error.URLError, TimeoutError) as erro:
        print(f"[{agora()}] sem conexão com o servidor ({erro}); tentando de novo")
        return "falha"


def executar(cfg):
    pendente = None       # situação ainda não aceita pelo servidor
    ultima_tentativa = 0.0

    while True:
        try:
            with serial.Serial(cfg["porta"], cfg["baud"], timeout=1) as porta:
                print(f"[{agora()}] ouvindo {cfg['porta']} -> {cfg['url']}")
                while True:
                    linha = porta.readline().decode(errors="ignore").strip()

                    if linha.startswith("situacao="):
                        situacao = linha.split("=", 1)[1]
                        if situacao in SITUACOES_VALIDAS:
                            print(f"[{agora()}] placa: {situacao}")
                            pendente = situacao
                            ultima_tentativa = 0.0  # envia já
                    elif linha:
                        print(f"[{agora()}] {linha}")

                    # Envia o que está pendente; se falhar por rede, repete a cada poucos segundos.
                    if pendente and time.time() - ultima_tentativa >= ESPERA_RECONEXAO_S:
                        ultima_tentativa = time.time()
                        resultado = enviar(cfg, pendente)
                        if resultado in ("ok", "recusado"):
                            pendente = None
        except serial.SerialException as erro:
            print(f"[{agora()}] porta {cfg['porta']} indisponível ({erro}); nova tentativa em {ESPERA_RECONEXAO_S}s")
            time.sleep(ESPERA_RECONEXAO_S)
        except KeyboardInterrupt:
            print("Ponte encerrada.")
            return


if __name__ == "__main__":
    executar(configuracao())
