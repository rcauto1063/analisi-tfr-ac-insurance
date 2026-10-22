
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

/* PREPARA IL CONTENUTO DEL PDF */

function creaRighePDF() {
  const azienda = document.getElementById("result-company").textContent;
  const dipendenti = document.getElementById("out-dipendenti").textContent;

  return [
    { text: "AC INSURANCE", size: 18, bold: true },
    { text: "ANALISI PERSONALIZZATA TFR AZIENDA", size: 13, bold: true },
    { text: "" },
    { text: "DATI AZIENDALI", size: 12, bold: true },
    { text: "Azienda: " + azienda },
    { text: "Numero dipendenti: " + dipendenti },
    { text: "" },
    { text: "RIEPILOGO ECONOMICO", size: 12, bold: true },
    { text: "TFR annuo: " + document.getElementById("out-tfr").textContent },
    { text: "Costo TFR in azienda: " + document.getElementById("out-cost-positive").textContent },
    { text: "Deduzione fiscale: " + document.getElementById("out-deduzione").textContent },
    { text: "Delta complessivo: " + document.getElementById("out-delta").textContent, bold: true },
    { text: "Incidenza sul TFR annuo: " + document.getElementById("out-percentuale-dettaglio").textContent },
    { text: "" },
    { text: "DETTAGLIO COSTI", size: 12, bold: true },
    { text: "RAL media annua: " + document.getElementById("out-ral").textContent },
    { text: "Monte stipendi: " + document.getElementById("out-monte").textContent },
    { text: "Rivalutazione TFR: " + document.getElementById("out-rivalutazione-pct").textContent },
    { text: "Costo rivalutazione TFR: " + document.getElementById("out-rivalutazione").textContent },
    { text: "Imposta sulla rivalutazione: " + document.getElementById("out-imposta").textContent },
    { text: "Fondo garanzia INPS: " + document.getElementById("out-fondo").textContent },
    { text: "Oneri impropri: " + document.getElementById("out-oneri").textContent },
    { text: "Totale costi evitabili: " + document.getElementById("out-costo-totale").textContent, bold: true },
    { text: "Deduzione fiscale: " + document.getElementById("out-deduzione-dettaglio").textContent },
    { text: "" },
    { text: "RIFERIMENTO NORMATIVO", size: 12, bold: true },
    { text: "D.Lgs. 252/2005, art. 10." },
    { text: "" },
    { text: "NOTA INFORMATIVA", size: 11, bold: true },
    { text: "Analisi puramente indicativa, elaborata sulla base dei dati forniti dall'azienda." },
    { text: "Gli importi possono variare in funzione dei dati effettivi e delle condizioni applicabili." },
    { text: "" },
    { text: "AC INSURANCE", bold: true },
    { text: "Via T. De Amicis 50, 80145 Napoli" },
    { text: "Telefono: 081 19344322" },
    { text: "WhatsApp: 081 5520622" },
    { text: "powered by Marco Rossi" }
  ];
}

/* CONVERTE IL TESTO IN CARATTERI COMPATIBILI CON IL PDF */

function testoPDF(testo) {
  return String(testo)
    .replace(/€/g, "EUR")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/* CREA UN PDF SENZA LIBRERIE ESTERNE */

function generaPDF() {
  const righe = creaRighePDF();
  const pagine = [];
  let pagina = [];
  let y = 790;

  righe.forEach(riga => {
    const dimensione = riga.size || 10;
    const altezza = dimensione >= 16 ? 25 : dimensione >= 12 ? 20 : 16;

    if (y < 65) {
      pagine.push(pagina);
      pagina = [];
      y = 790;
    }

    pagina.push({
      text: riga.text,
      y,
      size: dimensione,
      bold: Boolean(riga.bold)
    });

    y -= riga.text === "" ? 9 : altezza;
  });

  if (pagina.length) pagine.push(pagina);

  const oggetti = [];

  oggetti[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  oggetti[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  oggetti[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  const riferimentiPagine = [];

  pagine.forEach((contenuto, indice) => {
    const idPagina = 5 + indice * 2;
    const idContenuto = idPagina + 1;

    riferimentiPagine.push(idPagina + " 0 R");

    let stream = "";

    contenuto.forEach(riga => {
      const font = riga.bold ? "F2" : "F1";

      stream +=
        "BT /" + font + " " + riga.size +
        " Tf 48 " + riga.y +
        " Td (" + testoPDF(riga.text) +
        ") Tj ET\n";
    });

    oggetti[idPagina] =
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
      "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> " +
      "/Contents " + idContenuto + " 0 R >>";

    oggetti[idContenuto] =
      "<< /Length " + stream.length + " >>\nstream\n" +
      stream + "endstream";
  });

  oggetti[2] =
    "<< /Type /Pages /Kids [" + riferimentiPagine.join(" ") +
    "] /Count " + pagine.length + " >>";

  let pdf = "%PDF-1.4\n";
  const offset = [0];
  const numeroOggetti = oggetti.length;

  for (let i = 1; i < numeroOggetti; i++) {
    if (!oggetti[i]) continue;

    offset[i] = pdf.length;
    pdf += i + " 0 obj\n" + oggetti[i] + "\nendobj\n";
  }

  const inizioXref = pdf.length;

  pdf += "xref\n0 " + numeroOggetti + "\n";
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < numeroOggetti; i++) {
    if (!oggetti[i]) {
      pdf += "0000000000 00000 f \n";
    } else {
      pdf += String(offset[i]).padStart(10, "0") + " 00000 n \n";
    }
  }

  pdf +=
    "trailer\n<< /Size " + numeroOggetti +
    " /Root 1 0 R >>\nstartxref\n" +
    inizioXref + "\n%%EOF";

  return new Blob([pdf], { type: "application/pdf" });
}

/* NOME DEL FILE PDF */

function nomeFilePDF() {
  const azienda = document.getElementById("result-company").textContent
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return "Analisi_TFR_" + (azienda || "Azienda") + ".pdf";
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
