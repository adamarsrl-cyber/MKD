#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera js/catalogo.js enlazando cada estudio del portal con su archivo .md.

Fuentes posibles (se usa la primera que exista):
  1. --md-dir CARPETA   Escanea una carpeta con los .md reales. Ademas de las
                        rutas, lee el titulo de cada archivo (primer "# ...").
  2. --indice ARCHIVO   Lee un listado generado con:  dir /s /-c  > indexmd.txt
                        (o con "dir /s" normal) desde la carpeta MKD.
  3. Automatico         Si existe la carpeta  md/  con archivos .md, la escanea;
                        si no, busca indexmd.txt junto a este script.

Uso:
  python gen_catalogo.py
  python gen_catalogo.py --indice indexmd.txt
  python gen_catalogo.py --md-dir md
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path, PureWindowsPath

AQUI = Path(__file__).resolve().parent

# ----------------------------------------------------------------------
# Estructura biblica del catalogo (sin cambios respecto a la version PDF)
# ----------------------------------------------------------------------
libros_at = [
    ("Génesis", 50), ("Éxodo", 40), ("Levítico", 27), ("Números", 36), ("Deuteronomio", 34),
    ("Josué", 24), ("Jueces", 21), ("Rut", 4), ("1 Samuel", 31), ("2 Samuel", 24),
    ("1 Reyes", 22), ("2 Reyes", 25), ("1 Crónicas", 29), ("2 Crónicas", 36), ("Esdras", 10),
    ("Nehemías", 13), ("Ester", 10), ("Job", 42), ("Salmos", 150), ("Proverbios", 31),
    ("Eclesiastés", 12), ("Cantares", 8), ("Isaías", 66), ("Jeremías", 52), ("Lamentaciones", 5),
    ("Ezequiel", 48), ("Daniel", 12), ("Oseas", 14), ("Joel", 3), ("Amós", 9),
    ("Abdías", 1), ("Jonás", 4), ("Miqueas", 7), ("Nahúm", 3), ("Habacuc", 3),
    ("Sofonías", 3), ("Hageo", 2), ("Zacarías", 14), ("Malaquías", 4),
]
libros_nt = [
    ("San Mateo", 28), ("San Marcos", 16), ("San Lucas", 24), ("San Juan", 21), ("Hechos", 28),
    ("Romanos", 16), ("1 Corintios", 16), ("2 Corintios", 13), ("Gálatas", 6), ("Efesios", 6),
    ("Filipenses", 4), ("Colosenses", 4), ("1 Tesalonicenses", 5), ("2 Tesalonicenses", 3),
    ("1 Timoteo", 6), ("2 Timoteo", 4), ("Tito", 3), ("Filemón", 1), ("Hebreos", 13),
    ("Santiago", 5), ("1 Pedro", 5), ("2 Pedro", 3), ("1 Juan", 5), ("2 Juan", 1),
    ("3 Juan", 1), ("San Judas", 1), ("Apocalipsis", 22),
]

# (testamento, titulo del grupo, libros). El orden coincide con 01..05 de tematicos/AT y tematicos/NT
grupos_tematicos = [
    ("AT", "Pentateuco", ["Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio"]),
    ("AT", "Históricos", ["Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel", "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras", "Nehemías", "Ester"]),
    ("AT", "Poéticos", ["Job", "Salmos", "Proverbios", "Eclesiastés", "Cantares"]),
    ("AT", "Profetas Mayores", ["Isaías", "Jeremías", "Lamentaciones", "Ezequiel", "Daniel"]),
    ("AT", "Profetas Menores", ["Oseas", "Joel", "Amós", "Abdías", "Jonás", "Miqueas", "Nahúm", "Habacuc", "Sofonías", "Hageo", "Zacarías", "Malaquías"]),
    ("NT", "Evangelios", ["San Mateo", "San Marcos", "San Lucas", "San Juan"]),
    ("NT", "Hechos de los Apóstoles", ["Hechos"]),
    ("NT", "Cartas Paulinas", ["Romanos", "1 Corintios", "2 Corintios", "Gálatas", "Efesios", "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses", "1 Timoteo", "2 Timoteo", "Tito", "Filemón"]),
    ("NT", "Cartas Universales", ["Hebreos", "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "San Judas"]),
    ("NT", "Revelación", ["Apocalipsis"]),
]

AYUDAS_SOLICITADAS_TOTAL = 33   # carpeta ayudas-espirituales / ayuda-especial-NN-vf.md
AYUDAS_BIBLICAS_TOTAL = 68      # carpeta ayudas-especiales / encontrarayudabiblico-NN-vf.md
PARABOLAS_TOTAL = 52
BIENAVENTURANZAS_TOTAL = 9

# Carpetas de primer nivel que reconoce el generador
CARPETAS = {"libro-completo", "por-capitulo", "tematicos", "parabolas",
            "bienaventuranzas", "ayudas-especiales", "ayudas-espirituales"}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return s.lower().replace(" ", "-")


# ----------------------------------------------------------------------
# Lectura de la fuente: devuelve {ruta_relativa_posix: bytes}
# ----------------------------------------------------------------------
def decodificar(raw):
    for enc in ("utf-8-sig", "cp850", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1", errors="replace")


RE_DIR = re.compile(r"^\s*(?:Directorio de|Directory of)\s+(.*\S)\s*$", re.I)
RE_ARCH = re.compile(
    r"^\s*\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4}\s+\d{1,2}:\d{2}"
    r"(?:\s*[ap]\.?\s?m\.?)?\s+([\d.,\u00a0 ]+?)\s+(\S.*?)\s*$", re.I)


def leer_indice(ruta):
    texto = decodificar(Path(ruta).read_bytes())
    actual = None
    res = {}
    for linea in texto.splitlines():
        m = RE_DIR.match(linea)
        if m:
            partes = list(PureWindowsPath(m.group(1)).parts)
            # Quedarse desde la primera carpeta conocida (ignora la ruta de la PC)
            idx = next((i for i, p in enumerate(partes) if p.lower() in CARPETAS), None)
            actual = None if idx is None else partes[idx:]
            continue
        m = RE_ARCH.match(linea)
        if m and actual is not None:
            nombre = m.group(2)
            if not nombre.lower().endswith(".md"):
                continue
            tam = int(re.sub(r"\D", "", m.group(1)) or 0)
            res["/".join(actual + [nombre])] = tam
    return res


def escanear_carpeta(carpeta):
    base = Path(carpeta)
    res = {}
    for p in base.rglob("*.md"):
        partes = list(p.relative_to(base).parts)
        if partes and partes[0].lower() in CARPETAS:
            res["/".join(partes)] = p.stat().st_size
    return res


def leer_titulo(ruta):
    """Titulo del estudio: 'title:' del front matter o primer encabezado '# '."""
    try:
        txt = decodificar(Path(ruta).read_bytes()[:20000])
    except OSError:
        return None
    lineas = txt.replace("\r", "").split("\n")
    i = 0
    if lineas and lineas[0].strip() == "---":
        for j in range(1, min(len(lineas), 60)):
            if lineas[j].strip() in ("---", "..."):
                i = j + 1
                break
            m = re.match(r"\s*title\s*:\s*(.+)$", lineas[j], re.I)
            if m:
                return limpiar_titulo(m.group(1))
    for l in lineas[i:i + 80]:
        m = re.match(r"\s{0,3}#\s+(.+?)\s*#*\s*$", l)
        if m:
            return limpiar_titulo(m.group(1))
    return None


def limpiar_titulo(t):
    t = re.sub(r"[*_`]+", "", t).strip().strip("\"'")
    t = re.sub(r"\s+", " ", t)
    return t[:140] or None


# ----------------------------------------------------------------------
# Construccion del catalogo
# ----------------------------------------------------------------------
RE_CAP = re.compile(r"^(?P<stem>.+?)-(?P<n>\d+)-vf\.md$", re.I)
RE_NUM_PREFIJO = re.compile(r"^(\d+)-")
RE_NUM_FINAL = re.compile(r"-(\d+)-vf\.md$", re.I)


def construir(archivos, titulos):
    avisos = []
    usados = set()

    def entrada_md(ruta):
        if ruta is None:
            return {"md": None, "tam": 0, "disponible": False}
        usados.add(ruta)
        e = {"md": ruta, "tam": archivos[ruta], "disponible": True}
        if titulos.get(ruta):
            e["titulo_md"] = titulos[ruta]
        return e

    # --- Indices auxiliares --------------------------------------------------
    libro_completo = {}   # numero -> ruta
    por_capitulo = {}     # (slug_libro, capitulo) -> ruta
    tematicos = {}        # (AT|NT, numero) -> ruta
    simples = {"parabolas": {}, "bienaventuranzas": {},
               "ayudas-espirituales": {}, "ayudas-especiales": {}}
    sin_clasificar = []
    duplicados = []

    for ruta in sorted(archivos):
        partes = ruta.split("/")
        carpeta, nombre = partes[0].lower(), partes[-1]
        destino, clave = None, None
        if carpeta == "libro-completo":
            m = RE_NUM_PREFIJO.match(nombre)
            if m:
                destino, clave = libro_completo, int(m.group(1))
        elif carpeta == "por-capitulo":
            m = RE_CAP.match(nombre)
            if m:
                stem = m.group("stem").lower().replace("_", "-")
                destino, clave = por_capitulo, (stem, int(m.group("n")))
        elif carpeta == "tematicos" and len(partes) >= 3:
            m = RE_NUM_PREFIJO.match(nombre)
            if m:
                destino, clave = tematicos, (partes[1].upper(), int(m.group(1)))
        elif carpeta in simples:
            m = RE_NUM_FINAL.search(nombre)
            if m:
                destino, clave = simples[carpeta], int(m.group(1))
        if destino is None:
            sin_clasificar.append(ruta)
        elif clave in destino:
            duplicados.append((destino[clave], ruta))
        else:
            destino[clave] = ruta

    cat = {k: [] for k in ("libro_completo", "por_capitulo", "tematicos",
                           "ayudas_solicitadas", "ayudas_biblicas",
                           "parabolas", "bienaventuranzas")}
    faltan = []

    # --- Libros completos y capitulos ---------------------------------------
    orden = 0
    for testamento, libros in (("Antiguo Testamento", libros_at), ("Nuevo Testamento", libros_nt)):
        for nombre, caps in libros:
            orden += 1
            sl = slug(nombre)
            ruta = libro_completo.get(orden)
            if ruta is None:
                faltan.append(f"libro completo #{orden:02d} {nombre}")
            cat["libro_completo"].append({
                "id": f"lc-{sl}", "titulo": f"Estudio bíblico completo: {nombre}",
                "testamento": testamento, "libro": nombre, "capitulos": caps,
                **entrada_md(ruta)})
            for c in range(1, caps + 1):
                ruta = por_capitulo.get((sl, c))
                if ruta is None:
                    faltan.append(f"{nombre} {c}")
                cat["por_capitulo"].append({
                    "id": f"cap-{sl}-{c}", "titulo": f"{nombre} {c}",
                    "testamento": testamento, "libro": nombre, "capitulo": c,
                    **entrada_md(ruta)})

    # --- Tematicos -----------------------------------------------------------
    contador = {"AT": 0, "NT": 0}
    for tes, grupo, libros in grupos_tematicos:
        contador[tes] += 1
        ruta = tematicos.get((tes, contador[tes]))
        if ruta is None:
            faltan.append(f"temático {tes} #{contador[tes]} {grupo}")
        cat["tematicos"].append({
            "id": f"tem-{slug(grupo)}", "titulo": f"Estudio bíblico temático: {grupo}",
            "libros": libros, **entrada_md(ruta)})

    # --- Listas simples ------------------------------------------------------
    def simple(clave_cat, carpeta, total, id_pref, titulo_fn, categoria):
        for i in range(1, total + 1):
            ruta = simples[carpeta].get(i)
            if ruta is None:
                faltan.append(f"{categoria} {i}")
            cat[clave_cat].append({
                "id": f"{id_pref}-{i}", "titulo": titulo_fn(i), "categoria": categoria,
                **entrada_md(ruta)})

    simple("ayudas_solicitadas", "ayudas-espirituales", AYUDAS_SOLICITADAS_TOTAL, "ayu-sol",
           lambda i: f"Ayuda Bíblica Solicitada {i}", "Ayudas Bíblicas Solicitadas")
    simple("ayudas_biblicas", "ayudas-especiales", AYUDAS_BIBLICAS_TOTAL, "ayu-bib",
           lambda i: f"Ayuda Bíblica {i}", "Ayudas Bíblicas")
    simple("parabolas", "parabolas", PARABOLAS_TOTAL, "parabola",
           lambda i: f"Estudio bíblico de la parábola {i}", "Parábolas")
    simple("bienaventuranzas", "bienaventuranzas", BIENAVENTURANZAS_TOTAL, "bienav",
           lambda i: f"Estudio de la bienaventuranza {i}", "Bienaventuranzas")

    sobrantes = sorted(set(archivos) - usados)
    return cat, {"faltan": faltan, "sobrantes": sobrantes,
                 "sin_clasificar": sin_clasificar, "duplicados": duplicados}


def observaciones_nombres(archivos):
    """Nombres de archivo que se apartan del patron habitual (informativo)."""
    obs = []
    for ruta in sorted(archivos):
        nombre = ruta.split("/")[-1]
        if re.search(r"[A-Z]", nombre) or "_" in nombre or " " in nombre:
            obs.append(ruta)
    return obs


def main():
    ap = argparse.ArgumentParser(description="Genera js/catalogo.js a partir de los archivos .md")
    ap.add_argument("--indice", help="listado 'dir /s' (por defecto indexmd.txt junto al script)")
    ap.add_argument("--md-dir", help="carpeta con los .md reales (por defecto ./md si tiene archivos)")
    ap.add_argument("--salida", default=str(AQUI / "js" / "catalogo.js"))
    a = ap.parse_args()

    carpeta = Path(a.md_dir) if a.md_dir else AQUI / "md"
    indice = Path(a.indice) if a.indice else None
    if indice is None:
        for nombre in ("indexmd.txt", "indice.txt"):
            if (AQUI / nombre).exists():
                indice = AQUI / nombre
                break

    titulos = {}
    if a.md_dir or (carpeta.is_dir() and any(carpeta.rglob("*.md"))):
        archivos = escanear_carpeta(carpeta)
        fuente = f"carpeta {carpeta}"
        for ruta in archivos:
            t = leer_titulo(carpeta / ruta)
            if t:
                titulos[ruta] = t
    elif indice and indice.exists():
        archivos = leer_indice(indice)
        fuente = f"índice {indice.name}"
    else:
        sys.exit("No encontré ni la carpeta md/ con archivos .md ni el archivo indexmd.txt.")

    if not archivos:
        sys.exit("La fuente no contiene archivos .md reconocibles "
                 "(se esperan carpetas como libro-completo, por-capitulo, parabolas...).")

    cat, info = construir(archivos, titulos)

    destino = Path(a.salida)
    destino.parent.mkdir(parents=True, exist_ok=True)
    with open(destino, "w", encoding="utf-8", newline="\n") as f:
        f.write("// Catálogo generado por gen_catalogo.py. No editar a mano.\n")
        f.write(f"// Fuente: {fuente}\n")
        f.write("// 'md' = ruta del archivo .md dentro de la carpeta definida en js/config.js (RUTA_BASE_MD).\n")
        f.write("// 'disponible: false' = ese estudio no figura en la fuente (se muestra como \"próximamente\").\n")
        f.write("// 'titulo_md' = título leído del propio archivo .md (solo si se generó desde la carpeta md/).\n")
        f.write("const CATALOGO = ")
        f.write(json.dumps(cat, ensure_ascii=False, indent=1))
        f.write(";\n")

    total = sum(len(v) for v in cat.values())
    disp = sum(1 for v in cat.values() for e in v if e["disponible"])
    print(f"Fuente: {fuente}")
    print(f"Archivos .md leídos: {len(archivos)}")
    print(f"Estudios en el catálogo: {total}  (con archivo .md: {disp})")
    for clave, lista in cat.items():
        print(f"  {clave:20s} {sum(1 for e in lista if e['disponible']):5d} / {len(lista)}")
    if titulos:
        print(f"Títulos leídos desde los .md: {len(titulos)}")
    if info["faltan"]:
        print(f"\nAVISO: {len(info['faltan'])} estudios del catálogo sin archivo .md:")
        print("  " + ", ".join(info["faltan"][:30]) + (" ..." if len(info["faltan"]) > 30 else ""))
    if info["sobrantes"]:
        print(f"\nAVISO: {len(info['sobrantes'])} archivos .md no se vincularon a ningún estudio:")
        for r in info["sobrantes"][:30]:
            print("  ", r)
    for a_, b_ in info["duplicados"]:
        print(f"AVISO: duplicado, se usó {a_} e ignoró {b_}")
    obs = observaciones_nombres(archivos)
    if obs:
        print(f"\nNota: {len(obs)} archivos con mayúsculas, guion bajo o espacios en el nombre "
              "(funcionan, pero en hosting con distinción de mayúsculas hay que respetarlos tal cual):")
        for r in obs[:10]:
            print("  ", r)
    print(f"\nEscrito: {destino}")


if __name__ == "__main__":
    main()
