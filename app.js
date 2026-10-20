
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

tipoValore.addEventListener("change", () => {
  valoreLabel.textContent = labels[tipoValore.value];
  mensilitaField.hidden = tipoValore.value !== "mensile";
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    valoreLabel.textContent = labels[tipoValore.value];
    mensilitaField.hidden = tipoValore.value !== "mensile";
    resultsPanel.hidden = true;
    inputPanel.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 0);
});

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
    !Number.isFinite(valore) ||
    valore <= 0
  ) {
    alert("Controlla il nome dell'azienda, il numero dei dipendenti e il valore inserito.");
    return;
  }

  if (
    tipoValore.value === "mensile" &&
    (!Number.isFinite(mensilita) || mensilita <= 0)
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

  const rivalutazione = 0.015 + (inflazione * 75 / 100);

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

  const deltaPercentuale = tfr > 0
    ? (delta / tfr) * 100
    : 0;

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

  document.getElementById("out-deduzione-dettaglio").textContent =
    euro(deduzione);

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
      input.id !== "coeffTFR" &&
      input.id !== "inflazione" &&
      input.id !== "fondo" &&
      input.id !== "deduzione50" &&
      input.id !== "deduzioneOltre" &&
      input.id !== "imposta" &&
      input.id !== "oneri" &&
      input.id !== "mensilita"
    ) {
      input.value = "";
    }
  });

  resultsPanel.hidden = true;
  inputPanel.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* CREA E APRE IL PDF */
document.getElementById("print-button").addEventListener("click", async event => {
  const button = event.currentTarget;

  if (typeof window.html2pdf !== "function") {
    alert("La libreria PDF non è caricata. Dobbiamo collegarla alla pagina.");
    return;
  }

  if (resultsPanel.hidden) {
    alert("Prima completa l'analisi.");
    return;
  }

  button.disabled = true;
  const testoOriginale = button.textContent;
  button.textContent = "Creazione PDF in corso...";

  let report = null;
  let pdfWindow = null;
  let objectUrl = null;

  try {
    /* Apre subito una finestra vuota per evitare il blocco del browser */
    pdfWindow = window.open("about:blank", "_blank");

    /* Prepara una copia del risultato senza pulsanti */
    report = document.createElement("div");
    report.id = "pdf-report";
    report.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "width:190mm",
      "padding:0",
      "margin:0",
      "background:#ffffff",
      "color:#1e293b",
      "z-index:2147483647",
      "font-family:Arial,sans-serif",
      "font-size:10pt",
      "box-sizing:border-box"
    ].join(";");

    const header = document.querySelector(".app-header").cloneNode(true);
    const contacts = document.querySelector(".contact-bar").cloneNode(true);
    const results = resultsPanel.cloneNode(true);

    results.hidden = false;
    results.removeAttribute("hidden");

    results.querySelectorAll(".actions, #new-analysis").forEach(el => el.remove());

    header.style.cssText =
      "display:flex;align-items:center;gap:12px;padding:8mm;background:#ffffff;color:#17365d;border-bottom:1px solid #dbe3ec;";

    const logo = header.querySelector("img");
    if (logo) {
      logo.style.cssText =
        "display:block;width:25mm;height:18mm;object-fit:contain;";
    }

    const title = header.querySelector("h1");
    if (title) {
      title.style.cssText =
        "font-size:17pt;line-height:1.2;text-align:center;color:#17365d;margin:0;";
    }

    contacts.style.cssText =
      "display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;padding:10px;background:#e8eef5;color:#17365d;font-size:9pt;";

    results.style.cssText =
      "display:block!important;width:100%;margin:0;padding:5mm;border:0;border-radius:0;box-shadow:none;background:#ffffff;";

    results.querySelectorAll(".summary-grid").forEach(el => {
      el.style.cssText =
        "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:18px;";
    });

    results.querySelectorAll(".summary-card").forEach(el => {
      el.style.cssText =
        "padding:12px;border:1px solid #dbe3ec;border-radius:8px;break-inside:avoid;";
    });

    results.querySelectorAll("h2").forEach(el => {
      el.style.cssText = "font-size:16pt;color:#17365d;margin:0 0 8px;";
    });

    results.querySelectorAll("h3").forEach(el => {
      el.style.cssText = "font-size:11pt;color:#17365d;margin:12px 0 7px;";
    });

    results.querySelectorAll(".table-wrap").forEach(el => {
      el.style.cssText = "width:100%;overflow:visible;border:1px solid #dbe3ec;";
    });

    results.querySelectorAll("table").forEach(el => {
      el.style.cssText = "width:100%;border-collapse:collapse;font-size:9pt;";
    });

    results.querySelectorAll("th,td").forEach(el => {
      el.style.cssText =
        "padding:6px 8px;border-bottom:1px solid #dbe3ec;text-align:left;";
    });

    results.querySelectorAll("td").forEach(el => {
      el.style.textAlign = "right";
    });

    results.querySelectorAll(".disclaimer").forEach(el => {
      el.style.cssText =
        "margin-top:12px;padding:10px;background:#e5e7eb;border:1px solid #d1d5db;border-radius:6px;font-size:8pt;line-height:1.4;";
    });

    report.appendChild(header);
    report.appendChild(contacts);
    report.appendChild(results);

    /* Il contenuto deve essere nel documento per essere acquisito */
    document.body.appendChild(report);

    const reportLogo = report.querySelector("img");
    if (reportLogo && !reportLogo.complete) {
      await new Promise(resolve => {
        reportLogo.addEventListener("load", resolve, { once: true });
        reportLogo.addEventListener("error", resolve, { once: true });
      });
    }

    await new Promise(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(resolve)
    ));

    const options = {
      margin: [7, 7, 7, 7],
      filename: "Analisi_TFR_AC_Insurance.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      }
    };

    const pdf = await window.html2pdf()
      .set(options)
      .from(report)
      .toPdf()
      .get("pdf");

    const blob = pdf.output("blob");

    if (!blob || blob.size < 1000) {
      throw new Error("Il PDF generato è vuoto.");
    }

    objectUrl = URL.createObjectURL(blob);

    if (pdfWindow && !pdfWindow.closed) {
      pdfWindow.location.href = objectUrl;
    } else {
      /* Se il browser blocca la finestra, apre il PDF nella scheda corrente */
      window.location.href = objectUrl;
    }
  } catch (error) {
    if (pdfWindow && !pdfWindow.closed) {
      pdfWindow.close();
    }

    console.error("Errore PDF:", error);
    alert(
      "Non è stato possibile creare il PDF. Riprova. " +
      (error && error.message ? error.message : "")
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
      .catch(() => {});
  });
}
