const form = document.getElementById("analysis-form");
const tipoValore = document.getElementById("tipoValore");
const valoreLabel = document.getElementById("valore-label");
const mensilitaField = document.getElementById("mensilita-field");
const resultsPanel = document.getElementById("results-panel");
const inputPanel = document.getElementById("input-panel");

const labels = {
  ral: "RAL media annua (€)",
  tfr: "TFR annuo (€)",
  monte: "Monte stipendi (€)",
  mensile: "Stipendio mensile (€)"
};

const euro = n =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(n);

const percent = n =>
  new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n) + "%";

const num = id => Number(document.getElementById(id).value);

/* CAMBIO TIPO DI VALORE */

tipoValore.addEventListener("change", () => {
  valoreLabel.textContent = labels[tipoValore.value];
  mensilitaField.hidden = tipoValore.value !== "mensile";
});

/* RESET DEL MODULO */

form.addEventListener("reset", () => {
  setTimeout(() => {
    valoreLabel.textContent = labels[tipoValore.value];
    mensilitaField.hidden = tipoValore.value !== "mensile";
    resultsPanel.hidden = true;
    inputPanel.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 0);
});

/* CALCOLO DELL'ANALISI */

form.addEventListener("submit", event => {
  event.preventDefault();

  const azienda = document.getElementById("azienda").value.trim();
  const dipendenti = num("dipendenti");
  const valore = num("valore");
  const mensilita = num("mensilita");

  if (
    !azienda ||
    !Number.isFinite(dipendenti) ||
    dipendenti <= 0 ||
    !Number.isInteger(dipendenti) ||
    !Number.isFinite(valore) ||
    valore <= 0
  ) {
    alert(
      "Controlla il nome dell'azienda, il numero dei dipendenti e il valore inserito."
    );
    return;
  }

  if (
    tipoValore.value === "mensile" &&
    (!Number.isFinite(mensilita) ||
      mensilita <= 0 ||
      !Number.isInteger(mensilita))
  ) {
    alert("Inserisci un numero di mensilità valido.");
    return;
  }

  const coeffTFR = num("coeffTFR") / 100;
  const inflazione = num("inflazione") / 100;
  const fondoGaranzia = num("fondo") / 100;
  const deduzione50 = num("deduzione50") / 100;
  const deduzioneOltre = num("deduzioneOltre") / 100;
  const impostaRivalutazione = num("imposta") / 100;
  const oneriImpropri = num("oneri") / 100;

  if (
    !Number.isFinite(coeffTFR) ||
    coeffTFR <= 0 ||
    !Number.isFinite(inflazione) ||
    !Number.isFinite(fondoGaranzia) ||
    !Number.isFinite(deduzione50) ||
    !Number.isFinite(deduzioneOltre) ||
    !Number.isFinite(impostaRivalutazione) ||
    !Number.isFinite(oneriImpropri)
  ) {
    alert("Controlla i parametri di calcolo inseriti.");
    return;
  }

  let ral, monte, tfr;

  if (tipoValore.value === "ral") {
    ral = valore;
    monte = dipendenti * ral;
    tfr = monte * coeffTFR;
  } else if (tipoValore.value === "tfr") {
    tfr = valore;
    monte = tfr / coeffTFR;
    ral = monte / dipendenti;
  } else if (tipoValore.value === "monte") {
    monte = valore;
    ral = monte / dipendenti;
    tfr = monte * coeffTFR;
  } else {
    ral = valore * mensilita;
    monte = dipendenti * ral;
    tfr = monte * coeffTFR;
  }

  const rivalutazione = 0.015 + inflazione * 75 / 100;

  const deduzioneTFR = dipendenti < 50
    ? deduzione50
    : deduzioneOltre;

  const deduzione = tfr * deduzioneTFR;
  const costiAzienda = dipendenti <= 60;

  const costoRivalutazione = costiAzienda
    ? tfr * rivalutazione
    : 0;

  const costoImposta = costiAzienda
    ? tfr * rivalutazione * impostaRivalutazione
    : 0;

  const costoFondo = costiAzienda
    ? monte * fondoGaranzia
    : 0;

  const costoOneri = costiAzienda
    ? monte * oneriImpropri
    : 0;

  const costoTotale =
    costoRivalutazione +
    costoImposta +
    costoFondo +
    costoOneri;

  const delta = costoTotale + deduzione;
  const deltaPercentuale = tfr > 0 ? delta / tfr * 100 : 0;

  document.getElementById("result-company").textContent = azienda;
  document.getElementById("out-tfr").textContent = euro(tfr);
  document.getElementById("out-cost-positive").textContent = euro(costoTotale);
  document.getElementById("out-deduzione").textContent = euro(deduzione);
  document.getElementById("out-delta").textContent = euro(delta);
  document.getElementById("out-percentuale").textContent =
    percent(deltaPercentuale) + " del TFR annuo";

  document.getElementById("out-dipendenti").textContent =
    new Intl.NumberFormat("it-IT").format(dipendenti);

  document.getElementById("out-ral").textContent = euro(ral);
  document.getElementById("out-monte").textContent = euro(monte);
  document.getElementById("out-rivalutazione-pct").textContent =
    percent(rivalutazione * 100);

  document.getElementById("out-rivalutazione").textContent =
    euro(costoRivalutazione);

  document.getElementById("out-imposta").textContent = euro(costoImposta);
  document.getElementById("out-fondo").textContent = euro(costoFondo);
  document.getElementById("out-oneri").textContent = euro(costoOneri);
  document.getElementById("out-costo-totale").textContent = euro(costoTotale);
  document.getElementById("out-deduzione-dettaglio").textContent = euro(deduzione);
  document.getElementById("out-delta-dettaglio").textContent = euro(delta);
  document.getElementById("out-percentuale-dettaglio").textContent =
    percent(deltaPercentuale);

  inputPanel.hidden = true;
  resultsPanel.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* NUOVA ANALISI */

document.getElementById("new-analysis").addEventListener("click", () => {
  form.reset();

  form.querySelectorAll("input").forEach(input => {
    if (
      ![
        "coeffTFR",
        "inflazione",
        "fondo",
        "deduzione50",
        "deduzioneOltre",
        "imposta",
        "oneri",
        "mensilita"
      ].includes(input.id)
    ) {
      input.value = "";
    }
  });

  resultsPanel.hidden = true;
  inputPanel.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* DATI PER IL PDF */

function valorePDF(id) {
  const elemento = document.getElementById(id);
  return elemento ? elemento.textContent.trim() : "";
}

function nomeFilePDF() {
  const azienda = valorePDF("result-company")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return "Analisi_TFR_" + (azienda || "Azienda") + ".pdf";
}

/* CODIFICA TESTO PDF: EURO COME SIMBOLO, NON COME ?EUR */

function testoPDF(testo) {
  return String(testo)
    .replace(/€/g, "__SIMBOLO_EURO__")
    .replace(/\u00A0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/__SIMBOLO_EURO__/g, "\\200");
}

/* GENERATORE PDF GRAFICO: NON DIPENDE DA LIBRERIE ESTERNE */

function generaPDF() {
  const azienda = valorePDF("result-company");
  const dipendenti = valorePDF("out-dipendenti");
  const tfr = valorePDF("out-tfr");
  const costi = valorePDF("out-cost-positive");
  const deduzione = valorePDF("out-deduzione");
  const delta = valorePDF("out-delta");
  const percentuale = valorePDF("out-percentuale-dettaglio");

  const navy = "0.09 0.21 0.36";
  const blu = "0.14 0.35 0.55";
  const verde = "0.08 0.43 0.25";
  const verdeChiaro = "0.91 0.96 0.93";
  const grigio = "0.39 0.45 0.52";
  const grigioChiaro = "0.96 0.97 0.98";
  const linea = "0.85 0.88 0.91";
  const bianco = "1 1 1";
  const arancio = "0.93 0.49 0.19";

  let stream = "";

  function rettangolo(x, y, w, h, colore) {
    stream += `${colore} rg ${x} ${y} ${w} ${h} re f\n`;
  }

  function lineaPDF(x1, y1, x2, y2, colore, spessore = 0.7) {
    stream += `${colore} RG ${spessore} w ${x1} ${y1} m ${x2} ${y2} l S\n`;
  }

  function testoPDFPos(testo, x, y, size = 10, bold = false, colore = navy) {
    stream +=
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${colore} rg ` +
      `1 0 0 1 ${x} ${y} Tm (${testoPDF(testo)}) Tj ET\n`;
  }

  function rigaDettaglio(etichetta, valore, y, bold = false) {
    testoPDFPos(etichetta, 48, y, 9, bold, bold ? navy : grigio);
    testoPDFPos(valore || "—", 360, y, 9, true, navy);
    lineaPDF(48, y - 8, 547, y - 8, linea, 0.45);
  }

  /* INTESTAZIONE */

  rettangolo(0, 730, 595, 112, navy);
  rettangolo(0, 730, 7, 112, arancio);

  testoPDFPos("AC INSURANCE", 42, 809, 11, true, bianco);
  testoPDFPos("ANALISI PERSONALIZZATA TFR", 42, 779, 20, true, bianco);
  testoPDFPos("ANALISI DEI COSTI AZIENDALI E DEI BENEFICI FISCALI", 42, 758, 8, false, "0.87 0.91 0.96");

  /* DATI AZIENDALI */

  testoPDFPos("DATI AZIENDALI", 42, 705, 9, true, grigio);
  testoPDFPos(azienda, 42, 681, 17, true, navy);
  testoPDFPos("Numero dipendenti: " + dipendenti, 42, 662, 10, false, grigio);

  lineaPDF(42, 646, 553, 646, linea, 0.8);

  /* RIQUADRI ECONOMICI */

  const cardW = 247;
  const cardH = 55;
  const leftX = 42;
  const rightX = 306;

  rettangolo(leftX, 574, cardW, cardH, grigioChiaro);
  rettangolo(rightX, 574, cardW, cardH, grigioChiaro);
  rettangolo(leftX, 509, cardW, cardH, grigioChiaro);
  rettangolo(rightX, 509, cardW, cardH, verdeChiaro);

  testoPDFPos("TFR ANNUO", leftX + 13, 610, 8, true, grigio);
  testoPDFPos(tfr, leftX + 13, 588, 15, true, navy);

  testoPDFPos("COSTI AZIENDALI EVITABILI", rightX + 13, 610, 8, true, grigio);
  testoPDFPos(costi, rightX + 13, 588, 15, true, navy);

  testoPDFPos("DEDUZIONE FISCALE", leftX + 13, 545, 8, true, grigio);
  testoPDFPos(deduzione, leftX + 13, 523, 15, true, navy);

  testoPDFPos("DELTA COMPLESSIVO", rightX + 13, 545, 8, true, verde);
  testoPDFPos(delta, rightX + 13, 523, 15, true, verde);
  testoPDFPos(percentuale + " del TFR annuo", rightX + 13, 496, 9, true, verde);

  /* DETTAGLIO COSTI */

  testoPDFPos("DETTAGLIO COSTI E PARAMETRI", 42, 474, 10, true, navy);

  rigaDettaglio("RAL media annua", valorePDF("out-ral"), 453);
  rigaDettaglio("Monte stipendi", valorePDF("out-monte"), 432);
  rigaDettaglio("Rivalutazione TFR", valorePDF("out-rivalutazione-pct"), 411);
  rigaDettaglio("Costo rivalutazione TFR", valorePDF("out-rivalutazione"), 390);
  rigaDettaglio("Imposta sulla rivalutazione", valorePDF("out-imposta"), 369);
  rigaDettaglio("Fondo garanzia INPS", valorePDF("out-fondo"), 348);
  rigaDettaglio("Oneri impropri", valorePDF("out-oneri"), 327);
  rigaDettaglio("Totale costi evitabili", valorePDF("out-costo-totale"), 306, true);
  rigaDettaglio("Deduzione fiscale", valorePDF("out-deduzione-dettaglio"), 285);

  /* RIFERIMENTO NORMATIVO */

  rettangolo(42, 218, 511, 43, grigioChiaro);
  rettangolo(42, 218, 4, 43, arancio);
  testoPDFPos("RIFERIMENTO NORMATIVO", 55, 243, 9, true, navy);
  testoPDFPos("Decreto legislativo n. 252 del 5 dicembre 2005, art. 10.", 55, 228, 9, false, grigio);

  /* NOTA INFORMATIVA */

  testoPDFPos("NOTA INFORMATIVA", 42, 193, 9, true, navy);
  testoPDFPos("Analisi puramente indicativa, elaborata sulla base dei dati forniti dall'azienda.", 42, 177, 8, false, grigio);
  testoPDFPos("Gli importi possono variare in funzione dei dati effettivi e delle condizioni applicabili.", 42, 164, 8, false, grigio);

  /* PIE' DI PAGINA */

  lineaPDF(42, 145, 553, 145, linea, 0.8);
  testoPDFPos("AC INSURANCE", 42, 126, 9, true, navy);
  testoPDFPos("Via T. De Amicis 50, 80145 Napoli", 42, 111, 8, false, grigio);
  testoPDFPos("Telefono: 081 19344322  |  WhatsApp: 081 5520622", 42, 97, 8, false, grigio);
  testoPDFPos("powered by Marco Rossi", 42, 72, 8, true, blu);

  /* STRUTTURA PDF */

  const oggetti = [];

  oggetti[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  oggetti[2] = "<< /Type /Pages /Kids [5 0 R] /Count 1 >>";
  oggetti[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  oggetti[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  oggetti[5] =
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
    "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>";

  oggetti[6] =
    "<< /Length " + stream.length + " >>\nstream\n" +
    stream + "endstream";

  let pdf = "%PDF-1.4\n";
  const offset = [0];

  for (let i = 1; i <= 6; i++) {
    offset[i] = pdf.length;
    pdf += i + " 0 obj\n" + oggetti[i] + "\nendobj\n";
  }

  const inizioXref = pdf.length;

  pdf += "xref\n0 7\n";
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= 6; i++) {
    pdf += String(offset[i]).padStart(10, "0") + " 00000 n \n";
  }

  pdf +=
    "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n" +
    inizioXref + "\n%%EOF";

  return new Blob([pdf], { type: "application/pdf" });
}

/* CREA E CONDIVIDE IL PDF */

document.getElementById("print-button").addEventListener("click", async () => {
  const pulsante = document.getElementById("print-button");
  const testoOriginale = pulsante.textContent;

  if (resultsPanel.hidden) {
    alert("Prima completa l'analisi.");
    return;
  }

  pulsante.disabled = true;
  pulsante.textContent = "Preparazione PDF...";

  try {
    const blob = generaPDF();

    if (!blob || blob.size < 1000) {
      throw new Error("Il PDF generato non contiene dati sufficienti.");
    }

    const nome = nomeFilePDF();
    const file = new File([blob], nome, { type: "application/pdf" });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: "Analisi personalizzata TFR",
        text: "Analisi TFR elaborata da AC Insurance."
      });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = nome;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  } catch (errore) {
    console.error("Errore PDF:", errore);

    if (errore.name !== "AbortError") {
      alert(
        "Non è stato possibile creare il PDF: " +
        (errore.message || "riprova.")
      );
    }
  } finally {
    pulsante.disabled = false;
    pulsante.textContent = testoOriginale;
  }
});

/* FUNZIONAMENTO OFFLINE */

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(error => console.error("Errore service worker:", error));
  });
}
