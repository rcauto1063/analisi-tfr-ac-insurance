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

/* GENERAZIONE E APERTURA DEL PDF */

document.getElementById("print-button").addEventListener("click", async event => {
  const button = event.currentTarget;

  if (typeof window.html2pdf !== "function") {
    alert("La libreria PDF non è caricata. Ricarica la pagina e riprova.");
    return;
  }

  if (resultsPanel.hidden) {
    alert("Prima completa l'analisi.");
    return;
  }

  const pdfWindow = window.open("about:blank", "_blank");

  if (!pdfWindow) {
    alert(
      "Il browser ha bloccato la finestra. Consenti i popup per questo sito e riprova."
    );
    return;
  }

  try {
    pdfWindow.document.open();
    pdfWindow.document.write(
      "<!doctype html><html lang='it'><head><meta charset='utf-8'>" +
      "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
      "<title>Preparazione PDF</title></head>" +
      "<body style='font-family:Arial,sans-serif;padding:24px'>" +
      "<p>Preparazione del PDF in corso...</p></body></html>"
    );
    pdfWindow.document.close();
  } catch (error) {
    console.error("Errore apertura finestra PDF:", error);
  }

  button.disabled = true;
  const testoOriginale = button.textContent;
  button.textContent = "Creazione PDF in corso...";

  let report = null;
  let objectUrl = null;

  try {
    report = document.createElement("div");

    report.style.cssText = [
      "position:absolute",
      "top:0",
      "left:0",
      "width:794px",
      "padding:28px",
      "margin:0",
      "background:#ffffff",
      "color:#1e293b",
      "font-family:Arial,sans-serif",
      "font-size:12px",
      "line-height:1.45",
      "box-sizing:border-box",
      "z-index:2147483647"
    ].join(";");

    const header = document.querySelector(".app-header").cloneNode(true);
    const contacts = document.querySelector(".contact-bar").cloneNode(true);
    const results = resultsPanel.cloneNode(true);

    results.hidden = false;
    results.removeAttribute("hidden");

    results.querySelectorAll(".actions, #new-analysis, #print-button")
      .forEach(el => el.remove());

    header.style.cssText = [
      "display:block",
      "width:100%",
      "padding:12px",
      "margin:0",
      "background:#ffffff",
      "color:#17365d",
      "border-bottom:1px solid #dbe3ec",
      "text-align:center",
      "box-sizing:border-box"
    ].join(";");

    const logo = header.querySelector("img");

    if (logo) {
      logo.style.cssText = [
        "display:block",
        "width:100px",
        "height:auto",
        "max-height:65px",
        "object-fit:contain",
        "margin:0 auto 8px"
      ].join(";");
    }

    const title = header.querySelector("h1");

    if (title) {
      title.style.cssText =
        "font-size:20px;line-height:1.3;color:#17365d;margin:0;";
    }

    contacts.style.cssText = [
      "display:block",
      "width:100%",
      "padding:10px",
      "margin:0",
      "background:#e8eef5",
      "color:#17365d",
      "font-size:11px",
      "line-height:1.6",
      "box-sizing:border-box"
    ].join(";");

    contacts.querySelectorAll("span").forEach(el => {
      el.style.display = "block";
    });

    contacts.querySelectorAll("a").forEach(el => {
      el.style.color = "#17365d";
      el.style.textDecoration = "none";
      el.style.overflowWrap = "anywhere";
    });

    results.style.cssText = [
      "display:block",
      "width:100%",
      "max-width:none",
      "min-width:0",
      "margin:0",
      "padding:14px 0",
      "border:0",
      "border-radius:0",
      "box-shadow:none",
      "background:#ffffff",
      "box-sizing:border-box",
      "overflow:visible"
    ].join(";");

    results.querySelectorAll(".summary-grid").forEach(el => {
      el.style.cssText = [
        "display:grid",
        "grid-template-columns:repeat(2,minmax(0,1fr))",
        "gap:10px",
        "margin:0 0 16px",
        "width:100%",
        "box-sizing:border-box"
      ].join(";");
    });

    results.querySelectorAll(".summary-card").forEach(el => {
      el.style.cssText = [
        "display:block",
        "width:auto",
        "min-width:0",
        "margin:0",
        "padding:10px",
        "border:1px solid #dbe3ec",
        "border-radius:5px",
        "box-sizing:border-box",
        "overflow-wrap:anywhere",
        "background:#ffffff"
      ].join(";");
    });

    results.querySelectorAll("h2").forEach(el => {
      el.style.cssText =
        "font-size:18px;line-height:1.3;color:#17365d;margin:0 0 10px;";
    });

    results.querySelectorAll("h3").forEach(el => {
      el.style.cssText =
        "font-size:14px;line-height:1.3;color:#17365d;margin:14px 0 8px;";
    });

    results.querySelectorAll(".table-wrap").forEach(el => {
      el.style.cssText =
        "display:block;width:100%;max-width:none;overflow:visible;";
    });

    results.querySelectorAll("table").forEach(el => {
      el.style.cssText = [
        "display:table",
        "width:100%",
        "max-width:100%",
        "border-collapse:collapse",
        "table-layout:fixed",
        "font-size:11px",
        "box-sizing:border-box"
      ].join(";");
    });

    results.querySelectorAll("th,td").forEach(el => {
      el.style.cssText = [
        "padding:6px",
        "border-bottom:1px solid #dbe3ec",
        "vertical-align:top",
        "text-align:left",
        "white-space:normal",
        "overflow-wrap:anywhere",
        "word-break:normal",
        "box-sizing:border-box"
      ].join(";");
    });

    results.querySelectorAll("td").forEach(el => {
      el.style.textAlign = "right";
    });

    results.querySelectorAll(".disclaimer").forEach(el => {
      el.style.cssText = [
        "display:block",
        "width:100%",
        "margin-top:14px",
        "padding:10px",
        "background:#f1f3f5",
        "border:1px solid #d1d5db",
        "font-size:10px",
        "line-height:1.5",
        "white-space:normal",
        "box-sizing:border-box"
      ].join(";");
    });

    const footer = document.createElement("p");
    footer.textContent =
      "AC Insurance · Analisi personalizzata TFR azienda";
    footer.style.cssText =
      "padding:10px 0 0;margin:0;text-align:center;color:#64748b;font-size:10px;";

    report.appendChild(header);
    report.appendChild(contacts);
    report.appendChild(results);
    report.appendChild(footer);

    document.body.appendChild(report);

    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const larghezzaReport = report.getBoundingClientRect().width;
    const altezzaReport = report.scrollHeight;

    if (larghezzaReport < 700 || altezzaReport < 200) {
      throw new Error(
        "Le dimensioni del riepilogo non sono corrette. Riprova."
      );
    }

    const options = {
      margin: [8, 8, 8, 8],
      filename: "Analisi_TFR_AC_Insurance.pdf",
      image: {
        type: "jpeg",
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 850,
        windowHeight: Math.max(1100, altezzaReport + 100)
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: ["tr", ".summary-card", ".disclaimer"]
      }
    };

    const pdf = await window.html2pdf()
      .set(options)
      .from(report)
      .toPdf()
      .get("pdf");

    if (!pdf || pdf.internal.getNumberOfPages() < 1) {
      throw new Error("Il PDF non contiene pagine.");
    }

    const blob = pdf.output("blob");

    if (!blob || blob.size < 1000) {
      throw new Error("Il PDF generato è vuoto.");
    }

    objectUrl = URL.createObjectURL(blob);
    pdfWindow.location.href = objectUrl;

  } catch (error) {
    console.error("Errore PDF:", error);

    if (pdfWindow && !pdfWindow.closed) {
      pdfWindow.close();
    }

    alert(
      "Errore durante la creazione del PDF: " +
      (error && error.message ? error.message : "riprova.")
    );

  } finally {
    if (report && report.parentNode) {
      report.parentNode.removeChild(report);
    }

    button.disabled = false;
    button.textContent = testoOriginale;
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
