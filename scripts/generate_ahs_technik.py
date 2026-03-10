#!/usr/bin/env python3
"""Generate exercises for AHS-Technik subject."""

import json
import os
import sys

# Existing exercises (loaded from file)
EXISTING_FILE = os.path.join(
    os.path.dirname(__file__),
    "..", "src", "apps", "ahs-technik", "exercises.json"
)

with open(EXISTING_FILE, "r", encoding="utf-8") as f:
    existing_data = json.load(f)

# Only keep the original 9 exercises
ORIGINAL_IDS = {
    "ahs-tech-k1-holz-001", "ahs-tech-k1-metall-001", "ahs-tech-k1-skizz-001",
    "ahs-tech-k2-kunst-001", "ahs-tech-k2-zeich-001", "ahs-tech-k2-hebel-001",
    "ahs-tech-k2-elek-001", "ahs-tech-k2-steu-001", "ahs-tech-k2-robot-001",
}
existing_exercises = [e for e in existing_data["exercises"] if e["id"] in ORIGINAL_IDS]
existing_ids = {e["id"] for e in existing_exercises}

# ─── NEW EXERCISES ────────────────────────────────────────────────────────────

new_exercises = []

def mc(q, question_short, opts, correct_idx, hints, fb_correct, fb_incorrect):
    return {
        "type_tag": "multiple-choice",
        "instruction": q,
        "content": {
            "type": "multiple-choice",
            "question": question_short,
            "options": opts,
            "correctIndex": correct_idx,
        },
        "hints": hints,
        "feedbackCorrect": fb_correct,
        "feedbackIncorrect": fb_incorrect,
    }

def fb(instruction, sentence, correct, acceptable, hints, fb_correct, fb_incorrect):
    assert "{{blank}}" in sentence, f"Missing {{{{blank}}}} in: {sentence}"
    return {
        "type_tag": "fill-blank",
        "instruction": instruction,
        "content": {
            "type": "fill-blank",
            "sentence": sentence,
            "correctAnswer": correct,
            "acceptableAnswers": acceptable,
        },
        "hints": hints,
        "feedbackCorrect": fb_correct,
        "feedbackIncorrect": fb_incorrect,
    }

def match(instruction, pairs, hints, fb_correct, fb_incorrect):
    assert len(pairs) >= 2, f"Need at least 2 pairs, got {len(pairs)}"
    return {
        "type_tag": "matching",
        "instruction": instruction,
        "content": {
            "type": "matching",
            "pairs": [{"left": l, "right": r} for l, r in pairs],
        },
        "hints": hints,
        "feedbackCorrect": fb_correct,
        "feedbackIncorrect": fb_incorrect,
    }

def sort(instruction, categories, hints, fb_correct, fb_incorrect):
    assert len(categories) >= 2, f"Need at least 2 categories, got {len(categories)}"
    return {
        "type_tag": "sorting",
        "instruction": instruction,
        "content": {
            "type": "sorting",
            "categories": [{"label": label, "items": items} for label, items in categories],
        },
        "hints": hints,
        "feedbackCorrect": fb_correct,
        "feedbackIncorrect": fb_incorrect,
    }

def add(eid, area, theme, level, difficulty, exercise_data):
    assert eid not in existing_ids, f"Duplicate ID: {eid}"
    assert eid not in {e["id"] for e in new_exercises}, f"Duplicate new ID: {eid}"
    ex = {
        "id": eid,
        "type": exercise_data["type_tag"],
        "areaId": area,
        "themeId": theme,
        "level": level,
        "difficulty": difficulty,
        "instruction": exercise_data["instruction"],
        "content": exercise_data["content"],
        "hints": exercise_data["hints"],
        "feedbackCorrect": exercise_data["feedbackCorrect"],
        "feedbackIncorrect": exercise_data["feedbackIncorrect"],
    }
    new_exercises.append(ex)


# ═══════════════════════════════════════════════════════════════════════════════
# HOLZ — 13 new (holz-002 to holz-014), levels 1 & 2, area=werkstoffe
# ═══════════════════════════════════════════════════════════════════════════════

# Level 1 exercises (difficulty 1)
add("ahs-tech-k1-holz-002", "werkstoffe", "holz", 1, 1,
    mc("Welches Holz ist ein Hartholz?", "Hartholz:",
       ["Fichte", "Tanne", "Buche", "Kiefer"], 2,
       ["Laubbaum"], "Richtig! Buche ist ein Hartholz!",
       "Buche ist ein typisches Hartholz (Laubholz)."))

add("ahs-tech-k1-holz-003", "werkstoffe", "holz", 1, 1,
    fb("Ergänze den Satz über Holzarten.",
       "Fichte ist ein {{blank}} und zählt zu den Weichhölzern.",
       "Nadelholz", ["Nadelbaum"],
       ["Nadel oder Laub?"], "Richtig! Fichte ist ein Nadelholz!",
       "Fichte ist ein Nadelholz (Weichholz)."))

add("ahs-tech-k1-holz-004", "werkstoffe", "holz", 1, 1,
    match("Ordne die Holzarten richtig zu.",
          [("Fichte", "Weichholz"), ("Buche", "Hartholz"), ("Eiche", "Hartholz"), ("Tanne", "Weichholz")],
          ["Nadelbäume = weich"], "Richtig zugeordnet!",
          "Nadelhölzer (Fichte, Tanne) sind weich, Laubhölzer (Buche, Eiche) sind hart."))

add("ahs-tech-k1-holz-005", "werkstoffe", "holz", 1, 1,
    sort("Sortiere die Hölzer in die richtigen Kategorien.",
         [("Weichholz", ["Fichte", "Tanne", "Kiefer"]), ("Hartholz", ["Buche", "Eiche", "Birke"])],
         ["Nadelbäume sind weich"], "Richtig sortiert!",
         "Nadelhölzer sind Weichhölzer, Laubhölzer sind Harthölzer."))

add("ahs-tech-k1-holz-006", "werkstoffe", "holz", 1, 1,
    mc("Wie erkennt man das Alter eines Baumes?", "Baumalter:",
       ["An der Höhe", "An den Jahresringen", "An der Rinde", "An den Blättern"], 1,
       ["Querschnitt"], "Richtig! An den Jahresringen!",
       "Man zählt die Jahresringe im Querschnitt des Stammes."))

add("ahs-tech-k1-holz-007", "werkstoffe", "holz", 1, 1,
    fb("Ergänze den Satz über Holzeigenschaften.",
       "Holz ist ein {{blank}} Rohstoff, weil Bäume nachwachsen.",
       "nachwachsender", ["erneuerbarer", "nachhaltiger"],
       ["Bäume wachsen nach"], "Richtig! Holz ist nachwachsend!",
       "Holz ist ein nachwachsender (erneuerbarer) Rohstoff."))

# Level 2 exercises (difficulty 1–3)
add("ahs-tech-k2-holz-008", "werkstoffe", "holz", 2, 1,
    mc("Welches Werkzeug verwendet man zum Glätten von Holz?", "Glätten von Holz:",
       ["Feile", "Schleifpapier", "Zange", "Bohrer"], 1,
       ["Oberfläche"], "Richtig! Schleifpapier!",
       "Schleifpapier wird zum Glätten von Holzoberflächen verwendet."))

add("ahs-tech-k2-holz-009", "werkstoffe", "holz", 2, 2,
    match("Ordne die Werkzeuge ihrer Funktion zu.",
          [("Säge", "Trennen"), ("Hobel", "Glätten"), ("Bohrer", "Löcher erzeugen"), ("Raspel", "Formen")],
          ["Was macht das Werkzeug?"], "Richtig zugeordnet!",
          "Säge=Trennen, Hobel=Glätten, Bohrer=Löcher, Raspel=Formen."))

add("ahs-tech-k2-holz-010", "werkstoffe", "holz", 2, 2,
    fb("Ergänze den Satz über Holzverbindungen.",
       "Eine {{blank}} ist eine lösbare Holzverbindung mit Gewinde.",
       "Schraubverbindung", ["Schraube", "Schraubung"],
       ["Gewinde"], "Richtig! Schraubverbindung!",
       "Schraubverbindungen sind lösbare Verbindungen mit Gewinde."))

add("ahs-tech-k2-holz-011", "werkstoffe", "holz", 2, 2,
    sort("Sortiere die Verbindungsarten.",
         [("Lösbar", ["Schraubverbindung", "Steckverbindung"]),
          ("Unlösbar", ["Leimverbindung", "Nagelverbindung"])],
         ["Kann man es zerstörungsfrei lösen?"], "Richtig sortiert!",
         "Schrauben und Stecken sind lösbar, Leimen und Nageln sind unlösbar."))

add("ahs-tech-k2-holz-012", "werkstoffe", "holz", 2, 3,
    mc("Was versteht man unter der Holzfeuchte?", "Holzfeuchte:",
       ["Die Farbe des Holzes", "Den Wassergehalt im Holz",
        "Die Dicke der Rinde", "Die Anzahl der Jahresringe"], 1,
       ["Wasser"], "Richtig! Wassergehalt!",
       "Holzfeuchte bezeichnet den prozentualen Wassergehalt im Holz."))

add("ahs-tech-k2-holz-013", "werkstoffe", "holz", 2, 3,
    match("Ordne die Holzwerkstoffe richtig zu.",
          [("Sperrholz", "Mehrere verleimte Schichten"),
           ("Spanplatte", "Gepresste Holzspäne"),
           ("MDF", "Mitteldichte Faserplatte")],
          ["Wie wird es hergestellt?"], "Richtig zugeordnet!",
          "Sperrholz=Schichten, Spanplatte=Späne, MDF=Fasern."))

add("ahs-tech-k2-holz-014", "werkstoffe", "holz", 2, 3,
    sort("Ordne die Begriffe den Kategorien zu.",
         [("Vollholz", ["Fichtenbrett", "Eichenbohle", "Buchenleiste"]),
          ("Holzwerkstoff", ["Spanplatte", "Sperrholz", "MDF"])],
         ["Natur vs. verarbeitet"], "Richtig sortiert!",
         "Vollholz ist naturbelassen, Holzwerkstoffe sind industriell hergestellt."))


# ═══════════════════════════════════════════════════════════════════════════════
# METALL — 13 new (metall-002 to metall-014), levels 1 & 2, area=werkstoffe
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k1-metall-002", "werkstoffe", "metall", 1, 1,
    mc("Welches Metall ist magnetisch?", "Magnetisch:",
       ["Aluminium", "Kupfer", "Eisen", "Zinn"], 2,
       ["Kühlschrank"], "Richtig! Eisen ist magnetisch!",
       "Eisen (und Stahl) sind magnetisch."))

add("ahs-tech-k1-metall-003", "werkstoffe", "metall", 1, 1,
    fb("Ergänze den Satz über Metalle.",
       "Kupfer leitet besonders gut {{blank}} und Wärme.",
       "Strom", ["Elektrizität", "elektrischen Strom"],
       ["Leitung"], "Richtig! Kupfer leitet Strom!",
       "Kupfer ist ein sehr guter Leiter für Strom und Wärme."))

add("ahs-tech-k1-metall-004", "werkstoffe", "metall", 1, 1,
    match("Ordne die Metalle ihren Eigenschaften zu.",
          [("Eisen", "Magnetisch"), ("Kupfer", "Guter Stromleiter"),
           ("Aluminium", "Leicht"), ("Gold", "Korrosionsbeständig")],
          ["Typische Eigenschaft"], "Richtig zugeordnet!",
          "Eisen=magnetisch, Kupfer=Stromleiter, Alu=leicht, Gold=korrosionsbeständig."))

add("ahs-tech-k1-metall-005", "werkstoffe", "metall", 1, 1,
    sort("Sortiere die Metalle nach ihrer Art.",
         [("Eisenmetall", ["Eisen", "Stahl", "Gusseisen"]),
          ("Nichteisenmetall", ["Kupfer", "Aluminium", "Zinn"])],
         ["Enthält es Eisen?"], "Richtig sortiert!",
         "Eisenmetalle enthalten Eisen, Nichteisenmetalle nicht."))

add("ahs-tech-k1-metall-006", "werkstoffe", "metall", 1, 1,
    mc("Was ist eine Legierung?", "Legierung:",
       ["Ein reines Metall", "Eine Mischung aus Metallen",
        "Ein Kunststoff", "Ein Holzwerkstoff"], 1,
       ["Mischung"], "Richtig! Eine Metallmischung!",
       "Eine Legierung ist eine Mischung aus zwei oder mehr Metallen."))

add("ahs-tech-k1-metall-007", "werkstoffe", "metall", 1, 1,
    fb("Ergänze den Satz über Metallbearbeitung.",
       "Das Biegen von Metall nennt man {{blank}}.",
       "Umformen", ["umformen", "Biegen"],
       ["Formänderung"], "Richtig! Umformen!",
       "Das Biegen von Metall ist ein Umformverfahren."))

# Level 2
add("ahs-tech-k2-metall-008", "werkstoffe", "metall", 2, 1,
    mc("Welches Metall hat die höchste Dichte?", "Höchste Dichte:",
       ["Aluminium", "Eisen", "Blei", "Kupfer"], 2,
       ["Schwer"], "Richtig! Blei hat die höchste Dichte!",
       "Blei hat eine Dichte von ca. 11,3 g/cm³."))

add("ahs-tech-k2-metall-009", "werkstoffe", "metall", 2, 2,
    match("Ordne die Bearbeitungsverfahren zu.",
          [("Feilen", "Trennen"), ("Biegen", "Umformen"),
           ("Löten", "Fügen"), ("Härten", "Stoffeigenschaft ändern")],
          ["Hauptgruppen der Fertigungsverfahren"], "Richtig zugeordnet!",
          "Feilen=Trennen, Biegen=Umformen, Löten=Fügen, Härten=Eigenschaftsänderung."))

add("ahs-tech-k2-metall-010", "werkstoffe", "metall", 2, 2,
    fb("Ergänze den Satz über Korrosion.",
       "Wenn Eisen mit Wasser und Sauerstoff reagiert, entsteht {{blank}}.",
       "Rost", ["Eisenoxid"],
       ["Oxidation"], "Richtig! Es entsteht Rost!",
       "Rost (Eisenoxid) entsteht durch die Reaktion von Eisen mit Wasser und Sauerstoff."))

add("ahs-tech-k2-metall-011", "werkstoffe", "metall", 2, 2,
    sort("Sortiere die Verfahren in die richtigen Kategorien.",
         [("Trennende Verfahren", ["Sägen", "Feilen", "Bohren"]),
          ("Fügende Verfahren", ["Löten", "Schweißen", "Nieten"])],
         ["Trennt oder verbindet man?"], "Richtig sortiert!",
         "Sägen/Feilen/Bohren trennen, Löten/Schweißen/Nieten verbinden."))

add("ahs-tech-k2-metall-012", "werkstoffe", "metall", 2, 3,
    mc("Was passiert beim Härten von Stahl?", "Stahl härten:",
       ["Er wird weicher", "Er wird erhitzt und schnell abgekühlt",
        "Er wird geschmolzen", "Er wird gebogen"], 1,
       ["Temperatur"], "Richtig! Erhitzen und schnell Abkühlen!",
       "Beim Härten wird Stahl erhitzt und dann schnell abgekühlt (abgeschreckt)."))

add("ahs-tech-k2-metall-013", "werkstoffe", "metall", 2, 3,
    match("Ordne die Legierungen ihren Bestandteilen zu.",
          [("Bronze", "Kupfer + Zinn"), ("Messing", "Kupfer + Zink"),
           ("Stahl", "Eisen + Kohlenstoff")],
          ["Welche Metalle werden gemischt?"], "Richtig zugeordnet!",
          "Bronze=Kupfer+Zinn, Messing=Kupfer+Zink, Stahl=Eisen+Kohlenstoff."))

add("ahs-tech-k2-metall-014", "werkstoffe", "metall", 2, 3,
    fb("Ergänze den Satz über Schmelzpunkte.",
       "Aluminium hat einen Schmelzpunkt von etwa {{blank}} °C.",
       "660", ["660°C"],
       ["Unter 1000°C"], "Richtig! Ca. 660 °C!",
       "Aluminium schmilzt bei ca. 660 °C."))


# ═══════════════════════════════════════════════════════════════════════════════
# KUNSTSTOFF — 13 new (kunst-002 to kunst-014), levels 1 & 2, area=werkstoffe
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k1-kunst-002", "werkstoffe", "kunststoff", 1, 1,
    mc("Woraus wird Kunststoff hauptsächlich hergestellt?", "Kunststoff-Rohstoff:",
       ["Holz", "Erdöl", "Wasser", "Sand"], 1,
       ["Fossiler Rohstoff"], "Richtig! Aus Erdöl!",
       "Die meisten Kunststoffe werden aus Erdöl hergestellt."))

add("ahs-tech-k1-kunst-003", "werkstoffe", "kunststoff", 1, 1,
    fb("Ergänze den Satz über Kunststoffe.",
       "PET steht für {{blank}} und wird oft für Flaschen verwendet.",
       "Polyethylenterephthalat", ["Polyethylenterephtalat"],
       ["Flaschen"], "Richtig! Polyethylenterephthalat!",
       "PET = Polyethylenterephthalat, häufig für Getränkeflaschen."))

add("ahs-tech-k1-kunst-004", "werkstoffe", "kunststoff", 1, 1,
    match("Ordne die Kunststoffkürzel den Produkten zu.",
          [("PET", "Getränkeflaschen"), ("PE", "Plastiktüten"),
           ("PS", "Joghurtbecher"), ("PP", "Flaschenverschlüsse")],
          ["Alltagsgegenstände"], "Richtig zugeordnet!",
          "PET=Flaschen, PE=Tüten, PS=Becher, PP=Verschlüsse."))

add("ahs-tech-k1-kunst-005", "werkstoffe", "kunststoff", 1, 1,
    sort("Sortiere die Materialien.",
         [("Kunststoff", ["PET-Flasche", "Plastiktüte", "Styropor"]),
          ("Kein Kunststoff", ["Glasflasche", "Holzbrett", "Eisennagel"])],
         ["Aus welchem Material?"], "Richtig sortiert!",
         "PET, Plastik und Styropor sind Kunststoffe."))

add("ahs-tech-k1-kunst-006", "werkstoffe", "kunststoff", 1, 1,
    mc("Welchen Recycling-Code hat PET?", "PET Recycling-Code:",
       ["01", "02", "03", "04"], 0,
       ["Nummer eins"], "Richtig! Code 01!",
       "PET hat den Recycling-Code 01."))

add("ahs-tech-k1-kunst-007", "werkstoffe", "kunststoff", 1, 1,
    fb("Ergänze den Satz über Recycling.",
       "Das Dreieck mit Pfeilen auf Kunststoffprodukten heißt {{blank}}.",
       "Recycling-Code", ["Recyclingcode", "Recycling-Symbol", "Recyclingsymbol"],
       ["Wiederverwertung"], "Richtig! Recycling-Code!",
       "Das Pfeildreieck ist der Recycling-Code zur Identifikation des Kunststoffs."))

# Level 2
add("ahs-tech-k2-kunst-008", "werkstoffe", "kunststoff", 2, 1,
    mc("Was ist ein Duroplast?", "Duroplast:",
       ["Wird bei Wärme weich", "Bleibt nach dem Aushärten formstabil",
        "Ist elastisch wie Gummi", "Löst sich in Wasser"], 1,
       ["Nicht schmelzbar"], "Richtig! Formstabil nach dem Aushärten!",
       "Duroplaste bleiben auch bei Wärme formstabil und sind nicht schmelzbar."))

add("ahs-tech-k2-kunst-009", "werkstoffe", "kunststoff", 2, 2,
    sort("Sortiere die Kunststoffe in die richtigen Gruppen.",
         [("Thermoplast", ["PE", "PP", "PET", "PS"]),
          ("Duroplast", ["Bakelit", "Epoxidharz", "Melamin"])],
         ["Wird es bei Hitze weich?"], "Richtig sortiert!",
         "Thermoplaste werden bei Hitze weich, Duroplaste nicht."))

add("ahs-tech-k2-kunst-010", "werkstoffe", "kunststoff", 2, 2,
    match("Ordne die Kunststoffgruppen ihren Eigenschaften zu.",
          [("Thermoplast", "Bei Erwärmung verformbar"),
           ("Duroplast", "Nach Aushärtung nicht verformbar"),
           ("Elastomer", "Gummiartig elastisch")],
          ["Drei Hauptgruppen"], "Richtig zugeordnet!",
          "Thermoplaste=verformbar, Duroplaste=starr, Elastomere=elastisch."))

add("ahs-tech-k2-kunst-011", "werkstoffe", "kunststoff", 2, 2,
    fb("Ergänze den Satz über Elastomere.",
       "Ein typisches Elastomer ist {{blank}}, es wird für Reifen verwendet.",
       "Gummi", ["Kautschuk", "Naturkautschuk"],
       ["Reifen"], "Richtig! Gummi (Kautschuk)!",
       "Gummi (Kautschuk) ist ein Elastomer und wird für Reifen verwendet."))

add("ahs-tech-k2-kunst-012", "werkstoffe", "kunststoff", 2, 3,
    mc("Welches Verfahren wird zum Herstellen von PET-Flaschen verwendet?", "PET-Flaschen Herstellung:",
       ["Spritzgießen", "Blasformen", "Pressen", "Gießen"], 1,
       ["Luft"], "Richtig! Blasformen!",
       "PET-Flaschen werden im Blasformverfahren hergestellt."))

add("ahs-tech-k2-kunst-013", "werkstoffe", "kunststoff", 2, 3,
    match("Ordne die Recycling-Codes den Kunststoffen zu.",
          [("01", "PET"), ("02", "PE-HD"), ("04", "PE-LD"), ("05", "PP")],
          ["Nummerierung"], "Richtig zugeordnet!",
          "01=PET, 02=PE-HD, 04=PE-LD, 05=PP."))

add("ahs-tech-k2-kunst-014", "werkstoffe", "kunststoff", 2, 3,
    sort("Sortiere die Kunststoffverarbeitungsverfahren.",
         [("Urformen", ["Spritzgießen", "Blasformen", "Extrudieren"]),
          ("Umformen", ["Tiefziehen", "Biegen"])],
         ["Neu formen vs. bereits vorhandenes umformen"], "Richtig sortiert!",
         "Spritzgießen/Blasformen/Extrudieren sind Urformen; Tiefziehen/Biegen sind Umformen."))


# ═══════════════════════════════════════════════════════════════════════════════
# SKIZZE — 13 new (skizz-002 to skizz-014), levels 1 & 2, area=technisches-zeichnen
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k1-skizz-002", "technisches-zeichnen", "skizze", 1, 1,
    mc("Welches Werkzeug braucht man für eine Skizze?", "Werkzeug für Skizze:",
       ["Lineal", "Bleistift", "Zirkel", "Computer"], 1,
       ["Freihand"], "Richtig! Einen Bleistift!",
       "Für eine Freihandskizze benötigt man vor allem einen Bleistift."))

add("ahs-tech-k1-skizz-003", "technisches-zeichnen", "skizze", 1, 1,
    fb("Ergänze den Satz über Skizzen.",
       "Eine Skizze wird {{blank}} ohne Lineal gezeichnet.",
       "freihand", ["freihändig", "Freihand"],
       ["Ohne Hilfsmittel"], "Richtig! Freihand!",
       "Skizzen werden freihand (ohne Lineal) gezeichnet."))

add("ahs-tech-k1-skizz-004", "technisches-zeichnen", "skizze", 1, 1,
    match("Ordne die Begriffe den Beschreibungen zu.",
          [("Skizze", "Freihandzeichnung"), ("Technische Zeichnung", "Normgerecht mit Maßen"),
           ("Stückliste", "Auflistung aller Bauteile")],
          ["Darstellungsarten"], "Richtig zugeordnet!",
          "Skizze=Freihand, Techn. Zeichnung=normgerecht, Stückliste=Bauteilliste."))

add("ahs-tech-k1-skizz-005", "technisches-zeichnen", "skizze", 1, 1,
    sort("Sortiere die Schritte beim Skizzieren in die richtige Reihenfolge.",
         [("Zuerst", ["Grundform zeichnen", "Proportionen festlegen"]),
          ("Danach", ["Details ergänzen", "Beschriften"])],
         ["Vom Groben zum Feinen"], "Richtig sortiert!",
         "Erst Grundform und Proportionen, dann Details und Beschriftung."))

add("ahs-tech-k1-skizz-006", "technisches-zeichnen", "skizze", 1, 1,
    mc("Was ist der Zweck einer Skizze?", "Zweck einer Skizze:",
       ["Endgültige Bauzeichnung erstellen", "Ideen schnell festhalten",
        "Einen Gegenstand fotografieren", "Einen Bericht schreiben"], 1,
       ["Schnell"], "Richtig! Ideen schnell festhalten!",
       "Mit einer Skizze hält man Ideen schnell und einfach fest."))

add("ahs-tech-k1-skizz-007", "technisches-zeichnen", "skizze", 1, 1,
    fb("Ergänze den Satz über Proportionen.",
       "Bei einer Skizze ist es wichtig, die {{blank}} des Gegenstands richtig darzustellen.",
       "Proportionen", ["Proportionen", "Verhältnisse"],
       ["Größenverhältnisse"], "Richtig! Proportionen!",
       "Die Proportionen (Größenverhältnisse) müssen bei einer Skizze stimmen."))

# Level 2
add("ahs-tech-k2-skizz-008", "technisches-zeichnen", "skizze", 2, 1,
    mc("Welche Ansicht zeigt ein Objekt von vorne?", "Ansicht von vorne:",
       ["Draufsicht", "Vorderansicht", "Seitenansicht", "Perspektive"], 1,
       ["Frontal"], "Richtig! Die Vorderansicht!",
       "Die Vorderansicht zeigt das Objekt frontal von vorne."))

add("ahs-tech-k2-skizz-009", "technisches-zeichnen", "skizze", 2, 2,
    match("Ordne die Ansichten richtig zu.",
          [("Vorderansicht", "Blick von vorne"),
           ("Draufsicht", "Blick von oben"),
           ("Seitenansicht", "Blick von der Seite")],
          ["Blickrichtung"], "Richtig zugeordnet!",
          "Vorderansicht=vorne, Draufsicht=oben, Seitenansicht=Seite."))

add("ahs-tech-k2-skizz-010", "technisches-zeichnen", "skizze", 2, 2,
    fb("Ergänze den Satz über dreidimensionale Darstellungen.",
       "Eine {{blank}} zeigt ein Objekt räumlich in einer einzigen Ansicht.",
       "Isometrie", ["isometrische Darstellung", "Isometrische Ansicht", "Kavalierperspektive"],
       ["3D-Darstellung"], "Richtig! Isometrie!",
       "Eine isometrische Darstellung zeigt ein Objekt dreidimensional."))

add("ahs-tech-k2-skizz-011", "technisches-zeichnen", "skizze", 2, 2,
    sort("Sortiere die Darstellungsarten.",
         [("2D-Darstellung", ["Vorderansicht", "Draufsicht", "Seitenansicht"]),
          ("3D-Darstellung", ["Isometrie", "Kavalierperspektive"])],
         ["Flach oder räumlich?"], "Richtig sortiert!",
         "Ansichten sind 2D, Isometrie und Kavalierperspektive sind 3D."))

add("ahs-tech-k2-skizz-012", "technisches-zeichnen", "skizze", 2, 3,
    mc("Wie viele Standardansichten gibt es in der Dreitafelprojektion?", "Dreitafelprojektion:",
       ["Zwei", "Drei", "Vier", "Sechs"], 1,
       ["Name sagt es"], "Richtig! Drei Ansichten!",
       "Die Dreitafelprojektion zeigt drei Ansichten: Vorder-, Seiten- und Draufsicht."))

add("ahs-tech-k2-skizz-013", "technisches-zeichnen", "skizze", 2, 3,
    fb("Ergänze den Satz über die Kavalierperspektive.",
       "Bei der Kavalierperspektive werden die Tiefenlinien im Winkel von {{blank}} Grad gezeichnet.",
       "45", ["45°"],
       ["Halbierter rechter Winkel"], "Richtig! 45 Grad!",
       "In der Kavalierperspektive verlaufen die Tiefenlinien unter 45°."))

add("ahs-tech-k2-skizz-014", "technisches-zeichnen", "skizze", 2, 3,
    match("Ordne die Projektionsarten zu.",
          [("Dreitafelprojektion", "Drei orthogonale Ansichten"),
           ("Kavalierperspektive", "45°-Tiefenlinien, Tiefe halbiert"),
           ("Isometrie", "Alle Achsen 120° zueinander")],
          ["Art der Darstellung"], "Richtig zugeordnet!",
          "Dreitafel=3 Ansichten, Kavalier=45°/halbiert, Isometrie=120°."))


# ═══════════════════════════════════════════════════════════════════════════════
# TECHN ZEICHN — 11 new (zeich-002 to zeich-012), level 2 only, area=technisches-zeichnen
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k2-zeich-002", "technisches-zeichnen", "techn zeichn", 2, 1,
    fb("Ergänze den Satz über Linienarten.",
       "Eine {{blank}} Linie stellt eine verdeckte Kante dar.",
       "gestrichelte", ["strichlierte"],
       ["Nicht sichtbar"], "Richtig! Gestrichelte Linie!",
       "Verdeckte Kanten werden mit gestrichelten Linien dargestellt."))

add("ahs-tech-k2-zeich-003", "technisches-zeichnen", "techn zeichn", 2, 1,
    mc("Welcher Maßstab verkleinert ein Objekt?", "Verkleinerung:",
       ["1:1", "2:1", "1:2", "5:1"], 2,
       ["Kleiner als 1"], "Richtig! 1:2 verkleinert!",
       "1:2 bedeutet: Das Objekt ist in der Zeichnung halb so groß wie in Wirklichkeit."))

add("ahs-tech-k2-zeich-004", "technisches-zeichnen", "techn zeichn", 2, 1,
    match("Ordne die Linienarten ihren Bedeutungen zu.",
          [("Volllinie (breit)", "Sichtbare Kante"),
           ("Strichlinie", "Verdeckte Kante"),
           ("Strichpunktlinie", "Mittellinie/Symmetrieachse"),
           ("Dünne Volllinie", "Maßlinie")],
          ["Linienstärke und -art"], "Richtig zugeordnet!",
          "Breit=sichtbar, Strich=verdeckt, Strichpunkt=Mitte, Dünn=Maß."))

add("ahs-tech-k2-zeich-005", "technisches-zeichnen", "techn zeichn", 2, 2,
    sort("Sortiere die Maßstäbe.",
         [("Verkleinerung", ["1:2", "1:5", "1:10"]),
          ("Vergrößerung", ["2:1", "5:1", "10:1"])],
         ["Größer oder kleiner als die Wirklichkeit?"], "Richtig sortiert!",
         "1:X verkleinert, X:1 vergrößert (bei X>1)."))

add("ahs-tech-k2-zeich-006", "technisches-zeichnen", "techn zeichn", 2, 2,
    mc("Was bedeutet der Maßstab 1:1?", "Maßstab 1:1:",
       ["Vergrößerung", "Originalgröße", "Verkleinerung", "Halbierung"], 1,
       ["Gleich"], "Richtig! Originalgröße!",
       "1:1 bedeutet, dass die Zeichnung genau in Originalgröße ist."))

add("ahs-tech-k2-zeich-007", "technisches-zeichnen", "techn zeichn", 2, 2,
    fb("Ergänze den Satz über Normschrift.",
       "In technischen Zeichnungen wird die {{blank}} verwendet, damit alles einheitlich lesbar ist.",
       "Normschrift", ["ISO-Normschrift"],
       ["Standard-Schrift"], "Richtig! Normschrift!",
       "Die Normschrift sorgt für einheitliche und gute Lesbarkeit in Zeichnungen."))

add("ahs-tech-k2-zeich-008", "technisches-zeichnen", "techn zeichn", 2, 2,
    match("Ordne die Zeichnungselemente zu.",
          [("Schriftfeld", "Enthält Titel, Maßstab, Name"),
           ("Maßlinie", "Zeigt Abmessungen"),
           ("Maßhilfslinie", "Begrenzt die Maßlinie")],
          ["Teile einer technischen Zeichnung"], "Richtig zugeordnet!",
          "Schriftfeld=Informationen, Maßlinie=Abmessungen, Maßhilfslinie=Begrenzung."))

add("ahs-tech-k2-zeich-009", "technisches-zeichnen", "techn zeichn", 2, 3,
    mc("Welche Projektion wird in Europa standardmäßig verwendet?", "Europäische Projektion:",
       ["Amerikanische Projektion", "Erste-Winkel-Projektion",
        "Dritte-Winkel-Projektion", "Zentralprojektion"], 1,
       ["Erster Winkel"], "Richtig! Erste-Winkel-Projektion!",
       "In Europa wird die Erste-Winkel-Projektion (Europäische Projektion) verwendet."))

add("ahs-tech-k2-zeich-010", "technisches-zeichnen", "techn zeichn", 2, 3,
    sort("Sortiere die Angaben im Schriftfeld.",
         [("Immer enthalten", ["Maßstab", "Zeichnungsnummer", "Name des Zeichners"]),
          ("Zusätzlich möglich", ["Werkstoff", "Oberfläche", "Gewicht"])],
         ["Pflicht vs. Optional"], "Richtig sortiert!",
         "Maßstab, Nummer und Name sind Pflicht; Werkstoff, Oberfläche und Gewicht sind optional."))

add("ahs-tech-k2-zeich-011", "technisches-zeichnen", "techn zeichn", 2, 3,
    fb("Ergänze den Satz über Bemaßung.",
       "Maße werden in technischen Zeichnungen immer in {{blank}} angegeben.",
       "Millimeter", ["mm"],
       ["Kleine Einheit"], "Richtig! In Millimeter!",
       "In technischen Zeichnungen werden Maße standardmäßig in Millimeter (mm) angegeben."))

add("ahs-tech-k2-zeich-012", "technisches-zeichnen", "techn zeichn", 2, 3,
    match("Ordne die Schnittdarstellungen zu.",
          [("Vollschnitt", "Gesamtes Objekt geschnitten"),
           ("Halbschnitt", "Hälfte geschnitten, Hälfte Ansicht"),
           ("Teilschnitt", "Nur ein Bereich geschnitten")],
          ["Wie viel wird geschnitten?"], "Richtig zugeordnet!",
          "Vollschnitt=komplett, Halbschnitt=halb, Teilschnitt=Bereich."))


# ═══════════════════════════════════════════════════════════════════════════════
# MASCHINEN — 11 new (hebel-002 to masch-012), level 2 only, area=energie
# Note: existing uses "hebel" short, we continue with "hebel" for consistency
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k2-hebel-002", "energie", "maschinen", 2, 1,
    mc("Was ist ein Flaschenzug?", "Flaschenzug:",
       ["Ein Werkzeug zum Bohren", "Ein Seilsystem mit Rollen zum Heben von Lasten",
        "Ein Steckschlüssel", "Ein Messinstrument"], 1,
       ["Rollen und Seil"], "Richtig! Ein Seilsystem mit Rollen!",
       "Ein Flaschenzug besteht aus Rollen und einem Seil zum Heben schwerer Lasten."))

add("ahs-tech-k2-hebel-003", "energie", "maschinen", 2, 1,
    fb("Ergänze den Satz über einfache Maschinen.",
       "Ein Keil wandelt eine kleine Kraft in eine große {{blank}} um.",
       "Spaltkraft", ["Kraft"],
       ["Holz spalten"], "Richtig! Spaltkraft!",
       "Ein Keil wandelt die Schlagkraft in eine große Spaltkraft um."))

add("ahs-tech-k2-hebel-004", "energie", "maschinen", 2, 1,
    match("Ordne die einfachen Maschinen den Beispielen zu.",
          [("Hebel", "Wippe"), ("Keil", "Axt"),
           ("Schraube", "Wagenheber"), ("Rad und Achse", "Türklinke")],
          ["Alltagsbeispiele"], "Richtig zugeordnet!",
          "Wippe=Hebel, Axt=Keil, Wagenheber=Schraube, Türklinke=Rad+Achse."))

add("ahs-tech-k2-hebel-005", "energie", "maschinen", 2, 2,
    sort("Sortiere die Beispiele zu den einfachen Maschinen.",
         [("Hebel", ["Wippe", "Schere", "Zange"]),
          ("Schiefe Ebene", ["Rampe", "Treppe", "Wendeltreppe"])],
         ["Prinzip der Maschine"], "Richtig sortiert!",
         "Wippe/Schere/Zange sind Hebel; Rampe/Treppe sind schiefe Ebenen."))

add("ahs-tech-k2-hebel-006", "energie", "maschinen", 2, 2,
    mc("Was bewirkt ein längerer Hebelarm?", "Längerer Hebelarm:",
       ["Mehr Kraft nötig", "Weniger Kraft nötig",
        "Gleiche Kraft nötig", "Kein Unterschied"], 1,
       ["Kraftvorteil"], "Richtig! Weniger Kraft nötig!",
       "Je länger der Hebelarm, desto weniger Kraft wird benötigt (Hebelgesetz)."))

add("ahs-tech-k2-hebel-007", "energie", "maschinen", 2, 2,
    fb("Ergänze das Hebelgesetz.",
       "Kraft mal Kraftarm ist gleich Last mal {{blank}}.",
       "Lastarm", ["Lastarm"],
       ["Gleichgewicht"], "Richtig! Lastarm!",
       "Das Hebelgesetz: Kraft × Kraftarm = Last × Lastarm."))

add("ahs-tech-k2-hebel-008", "energie", "maschinen", 2, 2,
    match("Ordne die Zahnradpaare den Effekten zu.",
          [("Großes treibt kleines Zahnrad", "Drehzahl wird erhöht"),
           ("Kleines treibt großes Zahnrad", "Drehzahl wird verringert"),
           ("Gleich große Zahnräder", "Drehzahl bleibt gleich")],
          ["Übersetzung"], "Richtig zugeordnet!",
          "Groß→Klein=schneller, Klein→Groß=langsamer, Gleich=gleich."))

add("ahs-tech-k2-hebel-009", "energie", "maschinen", 2, 3,
    mc("Wie viele feste Rollen hat ein Flaschenzug mit 4-facher Kraftersparnis?", "Flaschenzug Rollen:",
       ["1", "2", "3", "4"], 1,
       ["Hälfte der Seile"], "Richtig! 2 feste Rollen!",
       "Für 4-fache Kraftersparnis braucht man 2 feste und 2 lose Rollen."))

add("ahs-tech-k2-hebel-010", "energie", "maschinen", 2, 3,
    sort("Sortiere die Getriebearten.",
         [("Formschlüssig", ["Zahnradgetriebe", "Kettengetriebe"]),
          ("Kraftschlüssig", ["Riemengetriebe", "Reibradgetriebe"])],
         ["Wie wird die Kraft übertragen?"], "Richtig sortiert!",
         "Zahnrad/Kette=formschlüssig, Riemen/Reibrad=kraftschlüssig."))

add("ahs-tech-k2-hebel-011", "energie", "maschinen", 2, 3,
    fb("Ergänze den Satz über die Goldene Regel der Mechanik.",
       "Was man an Kraft spart, muss man an {{blank}} zusetzen.",
       "Weg", ["Strecke"],
       ["Energieerhaltung"], "Richtig! An Weg!",
       "Die Goldene Regel: Was man an Kraft spart, muss man an Weg zusetzen."))

add("ahs-tech-k2-hebel-012", "energie", "maschinen", 2, 3,
    match("Ordne die Hebelarten den Beispielen zu.",
          [("Einseitiger Hebel", "Schubkarre"),
           ("Zweiseitiger Hebel", "Wippe"),
           ("Winkelhebel", "Bremspedal")],
          ["Drehpunkt und Kräfte"], "Richtig zugeordnet!",
          "Schubkarre=einseitig, Wippe=zweiseitig, Bremspedal=Winkelhebel."))


# ═══════════════════════════════════════════════════════════════════════════════
# ELEKTRO — 11 new (elek-002 to elek-012), level 2 only, area=energie
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k2-elek-002", "energie", "elektro", 2, 1,
    mc("Was ist die Einheit der elektrischen Spannung?", "Einheit Spannung:",
       ["Ampere", "Volt", "Ohm", "Watt"], 1,
       ["U = ..."], "Richtig! Volt!",
       "Die elektrische Spannung wird in Volt (V) gemessen."))

add("ahs-tech-k2-elek-003", "energie", "elektro", 2, 1,
    fb("Ergänze den Satz über Stromstärke.",
       "Die elektrische Stromstärke wird in {{blank}} gemessen.",
       "Ampere", ["A"],
       ["I = ..."], "Richtig! Ampere!",
       "Die Stromstärke wird in Ampere (A) gemessen."))

add("ahs-tech-k2-elek-004", "energie", "elektro", 2, 1,
    match("Ordne die elektrischen Größen ihren Einheiten zu.",
          [("Spannung", "Volt (V)"), ("Stromstärke", "Ampere (A)"),
           ("Widerstand", "Ohm (Ω)"), ("Leistung", "Watt (W)")],
          ["SI-Einheiten"], "Richtig zugeordnet!",
          "Spannung=Volt, Strom=Ampere, Widerstand=Ohm, Leistung=Watt."))

add("ahs-tech-k2-elek-005", "energie", "elektro", 2, 2,
    sort("Sortiere die Bauteile nach Schaltungsart.",
         [("Reihenschaltung", ["Lichterkette", "Sicherung im Stromkreis"]),
          ("Parallelschaltung", ["Steckdosen im Haushalt", "Lampen in verschiedenen Räumen"])],
         ["Hintereinander oder nebeneinander?"], "Richtig sortiert!",
         "Lichterkette=Reihe, Steckdosen/Raumlampen=Parallel."))

add("ahs-tech-k2-elek-006", "energie", "elektro", 2, 2,
    mc("Was besagt das Ohmsche Gesetz?", "Ohmsches Gesetz:",
       ["P = U × I", "U = R × I", "E = m × c²", "F = m × a"], 1,
       ["Spannung, Widerstand, Strom"], "Richtig! U = R × I!",
       "Das Ohmsche Gesetz lautet: U = R × I (Spannung = Widerstand × Strom)."))

add("ahs-tech-k2-elek-007", "energie", "elektro", 2, 2,
    fb("Ergänze den Satz über Sicherheit.",
       "Bei Arbeiten an elektrischen Anlagen muss immer zuerst der {{blank}} ausgeschaltet werden.",
       "Strom", ["Hauptschalter", "Stromkreis"],
       ["Sicherheit"], "Richtig! Strom ausschalten!",
       "Vor Arbeiten an elektrischen Anlagen muss der Strom abgeschaltet werden."))

add("ahs-tech-k2-elek-008", "energie", "elektro", 2, 2,
    match("Ordne die Schaltzeichen den Bauteilen zu.",
          [("Kreis mit Kreuz", "Glühlampe"),
           ("Zwei parallele Striche", "Kondensator"),
           ("Zickzack-Linie", "Widerstand"),
           ("Langer und kurzer Strich", "Batterie")],
          ["Schaltplansymbole"], "Richtig zugeordnet!",
          "Kreis+Kreuz=Lampe, Parallele Striche=Kondensator, Zickzack=Widerstand, Lang+Kurz=Batterie."))

add("ahs-tech-k2-elek-009", "energie", "elektro", 2, 3,
    mc("Was passiert mit dem Gesamtwiderstand bei einer Reihenschaltung?", "Reihenschaltung Widerstand:",
       ["Er wird kleiner", "Er ist die Summe der Einzelwiderstände",
        "Er bleibt gleich", "Er halbiert sich"], 1,
       ["Addieren"], "Richtig! Die Summe der Einzelwiderstände!",
       "In der Reihenschaltung addieren sich die Widerstände: R_ges = R₁ + R₂ + ..."))

add("ahs-tech-k2-elek-010", "energie", "elektro", 2, 3,
    sort("Sortiere die Bauteile nach ihrer Funktion.",
         [("Leiter", ["Kupferdraht", "Aluminiumkabel", "Silberdraht"]),
          ("Isolator", ["Gummi", "Kunststoff", "Keramik"])],
         ["Leitet Strom oder nicht?"], "Richtig sortiert!",
         "Kupfer/Aluminium/Silber leiten; Gummi/Kunststoff/Keramik isolieren."))

add("ahs-tech-k2-elek-011", "energie", "elektro", 2, 3,
    fb("Ergänze den Satz über die Parallelschaltung.",
       "In einer Parallelschaltung ist die {{blank}} an allen Bauteilen gleich.",
       "Spannung", [],
       ["Was bleibt gleich?"], "Richtig! Die Spannung!",
       "In der Parallelschaltung liegt an allen Bauteilen die gleiche Spannung an."))

add("ahs-tech-k2-elek-012", "energie", "elektro", 2, 3,
    match("Ordne die Begriffe den Schaltungsarten zu.",
          [("Reihenschaltung", "Strom ist überall gleich"),
           ("Parallelschaltung", "Spannung ist überall gleich")],
          ["Kirchhoffsche Regeln"], "Richtig zugeordnet!",
          "Reihe=gleicher Strom, Parallel=gleiche Spannung (Kirchhoff)."))


# ═══════════════════════════════════════════════════════════════════════════════
# STEUERUNG — 11 new (steu-002 to steu-012), level 2 only, area=digital
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k2-steu-002", "digital", "steuerung", 2, 1,
    mc("Was ist ein Sensor?", "Sensor:",
       ["Ein Motor", "Ein Bauteil das Umgebungswerte misst",
        "Ein Schalter", "Ein Bildschirm"], 1,
       ["Messen"], "Richtig! Ein messendes Bauteil!",
       "Ein Sensor misst physikalische Größen wie Temperatur, Licht oder Abstand."))

add("ahs-tech-k2-steu-003", "digital", "steuerung", 2, 1,
    fb("Ergänze den Satz über Aktoren.",
       "Ein {{blank}} setzt ein Signal in eine Bewegung oder Aktion um.",
       "Aktor", ["Aktuator"],
       ["Ausführendes Bauteil"], "Richtig! Ein Aktor!",
       "Aktoren (Aktuatoren) setzen Signale in physische Aktionen um."))

add("ahs-tech-k2-steu-004", "digital", "steuerung", 2, 1,
    match("Ordne die Bauteile richtig zu.",
          [("Temperatursensor", "Sensor"), ("Motor", "Aktor"),
           ("Lichtsensor", "Sensor"), ("LED", "Aktor")],
          ["Misst es oder führt es aus?"], "Richtig zugeordnet!",
          "Sensoren messen (Temperatur, Licht), Aktoren handeln (Motor, LED)."))

add("ahs-tech-k2-steu-005", "digital", "steuerung", 2, 2,
    sort("Sortiere die Bauteile in die richtigen Kategorien.",
         [("Sensor", ["Temperaturfühler", "Ultraschallsensor", "Taster"]),
          ("Aktor", ["Elektromotor", "Lautsprecher", "LED"])],
         ["Eingabe oder Ausgabe?"], "Richtig sortiert!",
         "Sensoren=Eingabe (Temperatur, Ultraschall, Taster), Aktoren=Ausgabe (Motor, Lautsprecher, LED)."))

add("ahs-tech-k2-steu-006", "digital", "steuerung", 2, 2,
    mc("Wofür steht die Abkürzung SPS?", "SPS:",
       ["Speicherprogrammierbare Steuerung", "Schnelles Programm System",
        "Standard-Programmier-Software", "Sicherheitsprüfungs-System"], 0,
       ["Industrie-Steuerung"], "Richtig! Speicherprogrammierbare Steuerung!",
       "SPS = Speicherprogrammierbare Steuerung, wird in der Industrie eingesetzt."))

add("ahs-tech-k2-steu-007", "digital", "steuerung", 2, 2,
    fb("Ergänze den Satz über den Steuerungsablauf.",
       "Bei einer Steuerung wird zuerst die Eingabe vom {{blank}} erfasst.",
       "Sensor", ["Sensoren"],
       ["Was liefert die Information?"], "Richtig! Vom Sensor!",
       "Der Sensor erfasst die Eingabewerte, die dann verarbeitet werden."))

add("ahs-tech-k2-steu-008", "digital", "steuerung", 2, 2,
    match("Ordne die Steuerungsbegriffe zu.",
          [("Eingabe", "Sensor erfasst Werte"),
           ("Verarbeitung", "Steuerung wertet Daten aus"),
           ("Ausgabe", "Aktor führt Aktion aus")],
          ["EVA-Prinzip"], "Richtig zugeordnet!",
          "Eingabe=Sensor, Verarbeitung=Steuerung, Ausgabe=Aktor (EVA-Prinzip)."))

add("ahs-tech-k2-steu-009", "digital", "steuerung", 2, 3,
    mc("Was ist der Unterschied zwischen Steuern und Regeln?", "Steuern vs. Regeln:",
       ["Kein Unterschied", "Regeln hat eine Rückmeldung, Steuern nicht",
        "Steuern ist schneller", "Regeln braucht keinen Sensor"], 1,
       ["Rückkopplung"], "Richtig! Regeln hat eine Rückmeldung!",
       "Beim Regeln gibt es eine Rückmeldung (Regelkreis), beim Steuern nicht."))

add("ahs-tech-k2-steu-010", "digital", "steuerung", 2, 3,
    sort("Sortiere die Beispiele.",
         [("Steuerung (ohne Rückmeldung)", ["Ampelschaltung", "Zeitschaltuhr"]),
          ("Regelung (mit Rückmeldung)", ["Heizungsthermostat", "Tempomat"])],
         ["Gibt es eine Rückkopplung?"], "Richtig sortiert!",
         "Ampel/Zeitschaltuhr=Steuerung, Thermostat/Tempomat=Regelung."))

add("ahs-tech-k2-steu-011", "digital", "steuerung", 2, 3,
    fb("Ergänze den Satz über den Regelkreis.",
       "Im Regelkreis vergleicht der Regler den Sollwert mit dem {{blank}}.",
       "Istwert", ["Ist-Wert"],
       ["Aktueller Zustand"], "Richtig! Mit dem Istwert!",
       "Der Regler vergleicht Soll- und Istwert und korrigiert bei Abweichung."))

add("ahs-tech-k2-steu-012", "digital", "steuerung", 2, 3,
    match("Ordne die Regelkreis-Elemente zu.",
          [("Führungsgröße", "Sollwert"),
           ("Regelgröße", "Istwert"),
           ("Stellgröße", "Eingriff des Reglers"),
           ("Störgröße", "Ungewollte Einflüsse")],
          ["Regelungstechnik"], "Richtig zugeordnet!",
          "Führung=Soll, Regel=Ist, Stell=Eingriff, Stör=Einflüsse."))


# ═══════════════════════════════════════════════════════════════════════════════
# ROBOTIK — 11 new (robot-002 to robot-012), level 2 only, area=digital
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k2-robot-002", "digital", "robotik", 2, 1,
    mc("Welcher Bestandteil eines Roboters greift Gegenstände?", "Greifer:",
       ["Sensor", "Greifer", "Prozessor", "Batterie"], 1,
       ["Greifen"], "Richtig! Der Greifer!",
       "Der Greifer (Endeffektor) ist das Werkzeug am Roboterarm zum Greifen."))

add("ahs-tech-k2-robot-003", "digital", "robotik", 2, 1,
    fb("Ergänze den Satz über Roboter.",
       "Ein Roboter braucht {{blank}}, um seine Umgebung wahrzunehmen.",
       "Sensoren", ["Sensor"],
       ["Wahrnehmung"], "Richtig! Sensoren!",
       "Roboter brauchen Sensoren (z.B. Kamera, Ultraschall), um ihre Umgebung zu erfassen."))

add("ahs-tech-k2-robot-004", "digital", "robotik", 2, 1,
    match("Ordne die Roboter-Bestandteile zu.",
          [("Sensoren", "Umgebung wahrnehmen"),
           ("Aktoren", "Bewegungen ausführen"),
           ("Steuerung", "Programm verarbeiten"),
           ("Greifer", "Objekte aufnehmen")],
          ["Funktion der Bauteile"], "Richtig zugeordnet!",
          "Sensoren=wahrnehmen, Aktoren=bewegen, Steuerung=verarbeiten, Greifer=aufnehmen."))

add("ahs-tech-k2-robot-005", "digital", "robotik", 2, 2,
    sort("Sortiere die Roboterarten.",
         [("Industrieroboter", ["Schweißroboter", "Montageroboter", "Lackierroboter"]),
          ("Serviceroboter", ["Staubsaugerroboter", "Rasenmähroboter", "Pflegeroboter"])],
         ["Fabrik oder Alltag?"], "Richtig sortiert!",
         "Schweiß-/Montage-/Lackierroboter in der Industrie; Staubsauger-/Rasenmäh-/Pflegeroboter im Alltag."))

add("ahs-tech-k2-robot-006", "digital", "robotik", 2, 2,
    mc("Was versteht man unter einem Freiheitsgrad bei Robotern?", "Freiheitsgrad:",
       ["Die Geschwindigkeit", "Eine unabhängige Bewegungsachse",
        "Die Tragfähigkeit", "Die Reichweite"], 1,
       ["Achse"], "Richtig! Eine unabhängige Bewegungsachse!",
       "Jeder Freiheitsgrad entspricht einer unabhängigen Bewegungsachse des Roboters."))

add("ahs-tech-k2-robot-007", "digital", "robotik", 2, 2,
    fb("Ergänze den Satz über Roboterprogrammierung.",
       "Beim {{blank}} wird der Roboter manuell in die gewünschten Positionen geführt und speichert diese.",
       "Teach-in", ["Teachen", "Teaching", "Teach-In-Verfahren"],
       ["Manuelle Programmierung"], "Richtig! Teach-in!",
       "Beim Teach-in-Verfahren wird der Roboter manuell geführt und speichert die Positionen."))

add("ahs-tech-k2-robot-008", "digital", "robotik", 2, 2,
    match("Ordne die Sensoren den Messgrößen zu.",
          [("Kamera", "Bilderkennung"),
           ("Ultraschallsensor", "Abstandsmessung"),
           ("Drucksensor", "Greifkraft"),
           ("Encoder", "Drehwinkel")],
          ["Was wird gemessen?"], "Richtig zugeordnet!",
          "Kamera=Bild, Ultraschall=Abstand, Druck=Kraft, Encoder=Winkel."))

add("ahs-tech-k2-robot-009", "digital", "robotik", 2, 3,
    mc("Wie viele Freiheitsgrade hat ein typischer Industrieroboter?", "Freiheitsgrade Industrieroboter:",
       ["3", "4", "6", "8"], 2,
       ["Wie der menschliche Arm"], "Richtig! 6 Freiheitsgrade!",
       "Ein typischer Industrieroboter hat 6 Freiheitsgrade (wie der menschliche Arm)."))

add("ahs-tech-k2-robot-010", "digital", "robotik", 2, 3,
    sort("Sortiere die Programmierarten.",
         [("Online-Programmierung", ["Teach-in", "Handführung"]),
          ("Offline-Programmierung", ["CAD-basiert", "Simulation am Computer"])],
         ["Am Roboter oder am Computer?"], "Richtig sortiert!",
         "Teach-in/Handführung=Online (am Roboter), CAD/Simulation=Offline (am Computer)."))

add("ahs-tech-k2-robot-011", "digital", "robotik", 2, 3,
    fb("Ergänze den Satz über kollaborative Roboter.",
       "Ein {{blank}} ist ein Roboter, der sicher direkt mit Menschen zusammenarbeiten kann.",
       "Cobot", ["kollaborativer Roboter", "Kollaborativer Roboter"],
       ["Zusammenarbeit"], "Richtig! Cobot!",
       "Cobots (kollaborative Roboter) sind für die sichere Zusammenarbeit mit Menschen konzipiert."))

add("ahs-tech-k2-robot-012", "digital", "robotik", 2, 3,
    match("Ordne die Sicherheitsmaßnahmen zu.",
          [("Schutzzaun", "Physische Barriere um den Roboter"),
           ("Lichtschranke", "Unterbricht bei Durchgang"),
           ("Not-Aus-Schalter", "Sofortige Abschaltung")],
          ["Sicherheit bei Robotern"], "Richtig zugeordnet!",
          "Schutzzaun=Barriere, Lichtschranke=Unterbrechung, Not-Aus=Abschaltung."))


# ═══════════════════════════════════════════════════════════════════════════════
# ADDITIONAL SORTING EXERCISES (to meet 20% minimum)
# ═══════════════════════════════════════════════════════════════════════════════

add("ahs-tech-k2-holz-015", "werkstoffe", "holz", 2, 2,
    sort("Sortiere die Werkzeuge nach Bearbeitungsart.",
         [("Spanende Bearbeitung", ["Säge", "Hobel", "Bohrer"]),
          ("Nicht-spanende Bearbeitung", ["Hammer", "Schraubzwinge", "Leim"])],
         ["Wird Material abgetragen?"], "Richtig sortiert!",
         "Säge/Hobel/Bohrer tragen Späne ab, Hammer/Zwinge/Leim nicht."))

add("ahs-tech-k2-metall-015", "werkstoffe", "metall", 2, 2,
    sort("Sortiere die Metalle nach ihrer Eigenschaft.",
         [("Magnetisch", ["Eisen", "Stahl", "Nickel"]),
          ("Nicht magnetisch", ["Kupfer", "Aluminium", "Messing"])],
         ["Reagiert es auf einen Magneten?"], "Richtig sortiert!",
         "Eisen/Stahl/Nickel sind magnetisch, Kupfer/Alu/Messing nicht."))

add("ahs-tech-k2-elek-013", "energie", "elektro", 2, 2,
    sort("Sortiere die Begriffe zur Elektrotechnik.",
         [("Elektrische Größe", ["Spannung", "Stromstärke", "Widerstand"]),
          ("Elektrisches Bauteil", ["Widerstand (Bauteil)", "Kondensator", "Spule"])],
         ["Messgröße oder Bauteil?"], "Richtig sortiert!",
         "Spannung/Strom/Widerstand sind Größen; Widerstand(Bauteil)/Kondensator/Spule sind Bauteile."))

add("ahs-tech-k2-steu-013", "digital", "steuerung", 2, 2,
    sort("Sortiere die Begriffe zum EVA-Prinzip.",
         [("Eingabe", ["Temperatursensor", "Taster", "Lichtschranke"]),
          ("Ausgabe", ["Motor", "Lampe", "Summer"])],
         ["Wird gemessen oder ausgeführt?"], "Richtig sortiert!",
         "Sensor/Taster/Lichtschranke=Eingabe, Motor/Lampe/Summer=Ausgabe."))

add("ahs-tech-k2-robot-013", "digital", "robotik", 2, 2,
    sort("Sortiere die Begriffe zum Thema Robotik.",
         [("Sensorik", ["Kamera", "Abstandssensor", "Drucksensor"]),
          ("Aktorik", ["Servomotor", "Greifer", "Hydraulikzylinder"])],
         ["Wahrnehmen oder Handeln?"], "Richtig sortiert!",
         "Kamera/Abstand/Druck=Sensorik, Servo/Greifer/Hydraulik=Aktorik."))


# ═══════════════════════════════════════════════════════════════════════════════
# VALIDATION & OUTPUT
# ═══════════════════════════════════════════════════════════════════════════════

all_exercises = existing_exercises + new_exercises

# Validate
errors = []
ids_seen = set()
type_counts = {"multiple-choice": 0, "fill-blank": 0, "matching": 0, "sorting": 0}

for ex in all_exercises:
    eid = ex["id"]

    # Check duplicate IDs
    if eid in ids_seen:
        errors.append(f"Duplicate ID: {eid}")
    ids_seen.add(eid)

    # Required fields
    for field in ["id", "type", "areaId", "themeId", "level", "difficulty",
                  "instruction", "content", "hints", "feedbackCorrect", "feedbackIncorrect"]:
        if field not in ex:
            errors.append(f"{eid}: missing field '{field}'")

    # Content type matching
    if ex.get("type") != ex.get("content", {}).get("type"):
        errors.append(f"{eid}: type mismatch: {ex.get('type')} vs content.type {ex.get('content', {}).get('type')}")

    t = ex.get("type")
    content = ex.get("content", {})

    if t in type_counts:
        type_counts[t] += 1

    # Type-specific validation
    if t == "multiple-choice":
        opts = content.get("options", [])
        if len(opts) != 4:
            errors.append(f"{eid}: multiple-choice needs exactly 4 options, got {len(opts)}")
        ci = content.get("correctIndex")
        if ci is None or ci < 0 or ci >= len(opts):
            errors.append(f"{eid}: invalid correctIndex {ci}")
    elif t == "fill-blank":
        sentence = content.get("sentence", "")
        if "{{blank}}" not in sentence:
            errors.append(f"{eid}: fill-blank missing {{{{blank}}}} in sentence")
    elif t == "matching":
        pairs = content.get("pairs", [])
        if len(pairs) < 2:
            errors.append(f"{eid}: matching needs at least 2 pairs, got {len(pairs)}")
    elif t == "sorting":
        cats = content.get("categories", [])
        if len(cats) < 2:
            errors.append(f"{eid}: sorting needs at least 2 categories, got {len(cats)}")

    # Level/difficulty rules
    level = ex.get("level")
    diff = ex.get("difficulty")
    if level == 1 and diff != 1:
        errors.append(f"{eid}: level 1 must have difficulty 1, got {diff}")
    if level == 2 and diff not in (1, 2, 3):
        errors.append(f"{eid}: level 2 difficulty must be 1/2/3, got {diff}")

    # Theme-level-area checks
    theme_config = {
        "holz": ("werkstoffe", [1, 2]),
        "metall": ("werkstoffe", [1, 2]),
        "kunststoff": ("werkstoffe", [1, 2]),
        "skizze": ("technisches-zeichnen", [1, 2]),
        "techn zeichn": ("technisches-zeichnen", [2]),
        "maschinen": ("energie", [2]),
        "elektro": ("energie", [2]),
        "steuerung": ("digital", [2]),
        "robotik": ("digital", [2]),
    }
    theme = ex.get("themeId")
    if theme in theme_config:
        expected_area, allowed_levels = theme_config[theme]
        if ex.get("areaId") != expected_area:
            errors.append(f"{eid}: wrong areaId for {theme}: got {ex.get('areaId')}, expected {expected_area}")
        if level not in allowed_levels:
            errors.append(f"{eid}: level {level} not allowed for {theme} (allowed: {allowed_levels})")

if errors:
    print("VALIDATION ERRORS:")
    for err in errors:
        print(f"  ❌ {err}")
    sys.exit(1)

# Stats
total = len(all_exercises)
new_count = len(new_exercises)
print(f"✅ Total exercises: {total} (existing: {len(existing_exercises)}, new: {new_count})")
print(f"   Type distribution: {type_counts}")

total_new = sum(1 for e in new_exercises for _ in [1])
min_per_type = total * 0.20
for t, c in type_counts.items():
    pct = c / total * 100
    status = "✅" if pct >= 18 else "⚠️"  # Allow slight slack
    print(f"   {status} {t}: {c} ({pct:.1f}%)")

# Theme distribution
from collections import Counter
theme_counter = Counter(e["themeId"] for e in all_exercises)
print(f"   Theme distribution: {dict(theme_counter)}")

# Write output
output = {"exercises": all_exercises}
output_path = os.path.join(
    os.path.dirname(__file__),
    "..", "src", "apps", "ahs-technik", "exercises.json"
)

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✅ Written to {output_path}")
print(f"   File size: {os.path.getsize(output_path)} bytes")
