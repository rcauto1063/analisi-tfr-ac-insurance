
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

/* PDF ESTETICO PER IPHONE E PC, CON PDF TESTUALE DI RISERVA */

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

function creaReportEstetico() {
  const azienda = valorePDF("result-company");
  const dipendenti = valorePDF("out-dipendenti");

  const righe = [
    ["TFR annuo", valorePDF("out-tfr")],
    ["Costi aziendali evitabili", valorePDF("out-cost-positive")],
    ["Deduzione fiscale", valorePDF("out-deduzione")]
  ];

  const dettaglio = [
    ["RAL media annua", valorePDF("out-ral")],
    ["Monte stipendi", valorePDF("out-monte")],
    ["Rivalutazione TFR", valorePDF("out-rivalutazione-pct")],
    ["Costo rivalutazione TFR", valorePDF("out-rivalutazione")],
    ["Imposta sulla rivalutazione", valorePDF("out-imposta")],
    ["Fondo garanzia INPS", valorePDF("out-fondo")],
    ["Oneri impropri", valorePDF("out-oneri")],
    ["Totale costi evitabili", valorePDF("out-costo-totale")],
    ["Deduzione fiscale", valorePDF("out-deduzione-dettaglio")]
  ];

  const righeHTML = elenco => elenco.map(([etichetta, valore]) =>
    `<div style="display:flex;justify-content:space-between;gap:18px;padding:9px 0;border-bottom:1px solid #e1e8ef;">
      <span style="color:#526174;">${etichetta}</span>
      <strong style="color:#17365d;text-align:right;">${valore || "—"}</strong>
    </div>`
  ).join("");

  const report = document.createElement("div");
  report.setAttribute("id", "pdf-report-temporaneo");

  report.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:760px",
    "padding:34px",
    "box-sizing:border-box",
    "background:#ffffff",
    "color:#1e293b",
    "font-family:Arial,Helvetica,sans-serif",
    "font-size:15px",
    "line-height:1.45",
    "z-index:-1"
  ].join(";");

  report.innerHTML = `
    <div style="border-radius:14px 14px 0 0;background:#17365d;color:#fff;padding:26px 30px;">
      <div style="font-size:13px;letter-spacing:2px;font-weight:700;color:#dbeafe;">AC INSURANCE</div>
      <div style="font-size:27px;font-weight:700;margin-top:10px;">Analisi personalizzata TFR</div>
      <div style="font-size:14px;margin-top:5px;color:#e5edf7;">Analisi dei costi aziendali e dei benefici fiscali</div>
    </div>
    <div style="border:1px solid #dbe3ec;border-top:0;padding:24px 30px 28px;border-radius:0 0 14px 14px;">
      <div style="font-size:12px;letter-spacing:1.2px;color:#64748b;font-weight:700;margin-bottom:8px;">DATI AZIENDALI</div>
      <div style="font-size:22px;font-weight:700;color:#17365d;margin-bottom:5px;">${azienda}</div>
      <div style="color:#526174;margin-bottom:22px;">Numero dipendenti: <strong>${dipendenti}</strong></div>

      <div style="font-size:12px;letter-spacing:1.2px;color:#64748b;font-weight:700;margin-bottom:10px;">RIEPILOGO ECONOMICO</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        ${righe.map(([etichetta, valore]) => `
          <div style="border:1px solid #dbe3ec;border-radius:10px;padding:15px;background:#f7f9fc;">
            <div style="font-size:12px;color:#64748b;margin-bottom:7px;">${etichetta}</div>
            <div style="font-size:20px;font-weight:700;color:#17365d;">${valore || "—"}</div>
          </div>`).join("")}
        <div style="border-radius:10px;padding:15px;background:#eaf5ef;border:1px solid #c8e5d3;">
          <div style="font-size:12px;color:#35634a;margin-bottom:7px;">Delta complessivo</div>
          <div style="font-size:23px;font-weight:700;color:#17633a;">${valorePDF("out-delta")}</div>
          <div style="font-size:13px;color:#35634a;margin-top:4px;">${valorePDF("out-percentuale-dettaglio")} del TFR annuo</div>
        </div>
      </div>

      <div style="font-size:12px;letter-spacing:1.2px;color:#64748b;font-weight:700;margin:24px 0 8px;">DETTAGLIO COSTI E PARAMETRI</div>
      ${righeHTML(dettaglio)}

      <div style="margin-top:24px;padding:15px 17px;background:#f7f9fc;border-left:4px solid #ed7d31;border-radius:4px;">
        <div style="font-weight:700;color:#17365d;margin-bottom:5px;">Riferimento normativo</div>
        <div>D.Lgs. 252/2005, art. 10.</div>
      </div>

      <div style="margin-top:18px;font-size:12px;color:#64748b;">
        <strong>Nota informativa</strong><br>
        Analisi puramente indicativa, elaborata sulla base dei dati forniti dall'azienda.
        Gli importi possono variare in funzione dei dati effettivi e delle condizioni applicabili.
      </div>

      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #dbe3ec;display:flex;justify-content:space-between;gap:20px;">
        <div>
          <div style="font-weight:700;color:#17365d;">AC INSURANCE</div>
          <div style="font-size:12px;color:#526174;">Via T. De Amicis 50, 80145 Napoli</div>
          <div style="font-size:12px;color:#526174;">Telefono: 081 19344322 · WhatsApp: 081 5520622</div>
        </div>
        <div style="align-self:flex-end;font-size:12px;color:#64748b;font-style:italic;">powered by Marco Rossi</div>
      </div>
    </div>`;

  document.body.appendChild(report);
  return report;
}

/* PDF TESTUALE DI RISERVA */

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

function generaPDFTestuale() {
  const righe = [
    ["AC INSURANCE", 18, true],
    ["ANALISI PERSONALIZZATA TFR AZIENDA", 13, true],
    ["", 10, false],
    ["Azienda: " + valorePDF("result-company"), 10, false],
    ["Numero dipendenti: " + valorePDF("out-dipendenti"), 10, false],
    ["TFR annuo: " + valorePDF("out-tfr"), 10, false],
    ["Costi aziendali evitabili: " + valorePDF("out-cost-positive"), 10, false],
    ["Deduzione fiscale: " + valorePDF("out-deduzione"), 10, false],
    ["Delta complessivo: " + valorePDF("out-delta"), 13, true],
    ["Incidenza sul TFR annuo: " + valorePDF("out-percentuale-dettaglio"), 10, false],
    ["", 10, false],
    ["DETTAGLIO COSTI", 12, true],
    ["RAL media annua: " + valorePDF("out-ral"), 10, false],
    ["Monte stipendi: " + valorePDF("out-monte"), 10, false],
    ["Rivalutazione TFR: " + valorePDF("out-rivalutazione-pct"), 10, false],
    ["Costo rivalutazione TFR: " + valorePDF("out-rivalutazione"), 10, false],
    ["Imposta sulla rivalutazione: " + valorePDF("out-imposta"), 10, false],
    ["Fondo garanzia INPS: " + valorePDF("out-fondo"), 10, false],
    ["Oneri impropri: " + valorePDF("out-oneri"), 10, false],
    ["Totale costi evitabili: " + valorePDF("out-costo-totale"), 10, true],
    ["", 10, false],
    ["RIFERIMENTO NORMATIVO", 12, true],
    ["D.Lgs. 252/2005, art. 10.", 10, false],
    ["", 10, false],
    ["NOTA INFORMATIVA", 11, true],
    ["Analisi indicativa elaborata sulla base dei dati forniti dall'azienda.", 9, false],
    ["Gli importi possono variare in funzione dei dati effettivi e delle condizioni applicabili.", 9, false],
    ["", 10, false],
    ["AC INSURANCE - Via T. De Amicis 50, 80145 Napoli", 9, true],
    ["Telefono: 081 19344322 - WhatsApp: 081 5520622", 9, false],
    ["powered by Marco Rossi", 9, false]
  ];

  const pagine = [];
  let pagina = [];
  let y = 790;

  righe.forEach(([testo, size, bold]) => {
    const altezza = testo === "" ? 9 : (size >= 13 ? 24 : 17);

    if (y < 65) {
      pagine.push(pagina);
      pagina = [];
      y = 790;
    }

    pagina.push({ testo, size, bold, y });
    y -= altezza;
  });

  if (pagina.length) pagine.push(pagina);

  const oggetti = [];
  oggetti[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  oggetti[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  oggetti[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  const riferimenti = [];

  pagine.forEach((contenuto, indice) => {
    const idPagina = 5 + indice * 2;
    const idStream = idPagina + 1;
    riferimenti.push(idPagina + " 0 R");

    let stream = "";

    contenuto.forEach(riga => {
      stream += "BT /" + (riga.bold ? "F2" : "F1") + " " + riga.size +
        " Tf 48 " + riga.y + " Td (" + testoPDF(riga.testo) + ") Tj ET\n";
    });

    oggetti[idPagina] =
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
      "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " +
      idStream + " 0 R >>";

    oggetti[idStream] =
      "<< /Length " + stream.length + " >>\nstream\n" +
      stream + "endstream";
  });

  oggetti[2] =
    "<< /Type /Pages /Kids [" + riferimenti.join(" ") +
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
    pdf += !oggetti[i]
      ? "0000000000 00000 f \n"
      : String(offset[i]).padStart(10, "0") + " 00000 n \n";
  }

  pdf +=
    "trailer\n<< /Size " + numeroOggetti +
    " /Root 1 0 R >>\nstartxref\n" +
    inizioXref + "\n%%EOF";

  return new Blob([pdf], { type: "application/pdf" });
}

/* GENERA PRIMA IL PDF ESTETICO */

async function creaPDFBlob() {
  if (typeof window.html2pdf === "function") {
    const report = creaReportEstetico();

    try {
      const worker = window.html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: nomeFilePDF(),
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: {
            scale: 1.5,
            useCORS: true,
            backgroundColor: "#ffffff",
            width: 760,
            windowWidth: 794,
            scrollX: 0,
            scrollY: 0
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait"
          },
          pagebreak: { mode: ["css", "legacy"] }
        })
        .from(report)
        .toPdf();

      const blob = await worker.outputPdf("blob");

      if (blob && blob.size > 5000) {
        return blob;
      }
    } catch (errore) {
      console.warn(
        "PDF estetico non disponibile, uso il riepilogo:",
        errore
      );
    } finally {
      report.remove();
    }
  }

  return generaPDFTestuale();
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
    const blob = await creaPDFBlob();

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
