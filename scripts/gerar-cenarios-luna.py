"""Gera src/data/luna-cenarios.json rodando o motor REAL de triagem da Luna.

Nada do simulador da landing é escrito à mão: a classificação, os termos que
dispararam o nível e o texto enviado ao tutor saem do código de produção.

Uso (de dentro de kura-luna-ai/luna, com Python 3.12):
    PYTHONPATH=. python ../../kura-landing/scripts/gerar-cenarios-luna.py
"""
import json
import pathlib
import subprocess
import sys
from types import SimpleNamespace

from src.ai.triage_engine import TriageEngine
from src.services import inbound_message_service as ims

CENARIOS = [
    {"id": "chocolate", "rotulo": "Comeu chocolate", "pet": "Thor",
     "mensagem": "Meu cachorro comeu uma barra de chocolate inteira agora"},
    {"id": "vomito", "rotulo": "Vomitou e não come", "pet": "Max",
     "mensagem": "Ele vomitou duas vezes hoje e não quer comer"},
    {"id": "estranho", "rotulo": "Está estranho", "pet": "Bidu",
     "mensagem": "Ele está estranho, deitado no canto e não quer levantar"},
]

luna = pathlib.Path.cwd()
commit = subprocess.run(["git", "-C", str(luna), "rev-parse", "--short", "HEAD"],
                        capture_output=True, text=True, check=True).stdout.strip()
engine = TriageEngine()


saida = []
for c in CENARIOS:
    r = engine.classificar(c["mensagem"])
    saida.append({**c, "urgencia": r.urgencia, "score": r.score,
                  "sintomas": r.sintomas_detectados,
                  # Tutor cadastrado com 1 pet: o caso da demonstração. A resposta
                  # sai de _compor_resposta, a mesma função da produção (G2 da
                  # landing, achado 6: antes lia _RESPOSTAS cru e perdia o prefixo).
                  "resposta": ims.InboundMessageService._compor_resposta(
                      r.urgencia, SimpleNamespace(pets=[SimpleNamespace(nm_pet=c["pet"])]))})

destino = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "luna-cenarios.json"
destino.write_text(json.dumps({
    "origem": {
        "repo": "kura-luna-ai",
        "commit": commit,
        "motor": "luna/src/ai/triage_engine.py::TriageEngine.classificar",
        "respostas": "luna/src/services/inbound_message_service.py::InboundMessageService._compor_resposta (tutor cadastrado, 1 pet)",
        "regras_versao": engine.classificar("x").regras_versao,
        "reproduzir": "PYTHONPATH=. python ../../kura-landing/scripts/gerar-cenarios-luna.py",
    },
    "cenarios": saida,
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"ok: {len(saida)} cenarios, luna@{commit}", file=sys.stderr)
