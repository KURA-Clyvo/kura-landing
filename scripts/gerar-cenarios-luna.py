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

from src.ai.triage_engine import TriageEngine, _normalize, _tokenize
from src.ai.triage_rules import COMBINACOES_ALTA
from src.services import inbound_message_service as ims

CENARIOS = [
    {"id": "chocolate", "rotulo": "Comeu chocolate", "pet": "Thor",
     "mensagem": "Meu cachorro comeu uma barra de chocolate inteira agora"},
    {"id": "vomito", "rotulo": "Vomitou e não come", "pet": "Mel",
     "mensagem": "Ele vomitou duas vezes hoje e não quer comer"},
    {"id": "estranho", "rotulo": "Está estranho", "pet": "Bidu",
     "mensagem": "Ele está estranho, deitado no canto e não quer levantar"},
]

luna = pathlib.Path.cwd()
commit = subprocess.run(["git", "-C", str(luna), "rev-parse", "--short", "HEAD"],
                        capture_output=True, text=True, check=True).stdout.strip()
engine = TriageEngine()


def destaques(mensagem, sintomas):
    """Trechos da mensagem que dispararam o nível: keyword direta ou, para
    combinação, os termos dos dois grupos que aparecem na mensagem."""
    tokens = _tokenize(_normalize(mensagem))
    termos = []
    for s in sintomas:
        if s.startswith("combinacao:"):
            cat = s.split(":", 1)[1]
            for categoria, grupo_a, grupo_b in COMBINACOES_ALTA:
                if categoria != cat:
                    continue
                for t in grupo_a + grupo_b:
                    tt = _tokenize(_normalize(t))
                    if any(tokens[i:i + len(tt)] == tt for i in range(len(tokens))):
                        termos.append(t)
        else:
            termos.append(s)
    return termos


saida = []
for c in CENARIOS:
    r = engine.classificar(c["mensagem"])
    saida.append({**c, "urgencia": r.urgencia, "score": r.score,
                  "sintomas": r.sintomas_detectados,
                  "destaques": destaques(c["mensagem"], r.sintomas_detectados),
                  "resposta": ims._RESPOSTAS[r.urgencia]})

destino = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "luna-cenarios.json"
destino.write_text(json.dumps({
    "origem": {
        "repo": "kura-luna-ai",
        "commit": commit,
        "motor": "luna/src/ai/triage_engine.py::TriageEngine.classificar",
        "respostas": "luna/src/services/inbound_message_service.py::_RESPOSTAS",
        "regras_versao": engine.classificar("x").regras_versao,
        "reproduzir": "PYTHONPATH=. python ../../kura-landing/scripts/gerar-cenarios-luna.py",
    },
    "cenarios": saida,
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"ok: {len(saida)} cenarios, luna@{commit}", file=sys.stderr)
