
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

function euro(n) {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n) + " €";
}

function percent(n) {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n) + "%";
}

function num(id) {
  return Number(document.getElementById(id).value);
}

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

  if (!azienda || !Number.isFinite(dipendenti) ||
      dipendenti <= 0 || !Number.isFinite(valore) || valore <= 0) {
    alert("Controlla il nome dell'azienda, il numero dei dipendenti e il valore inserito.");
    return;
  }

  if (tipoValore.value === "mensile" &&
      (!Number.isFinite(mensilita) || mensilita <= 0)) {
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
    monte = coeffTFR > 0 ? tfr / coeffTFR : 0;
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
  const deduzioneTFR = dipendenti < 50 ? deduzione50 : deduzioneOltre;
  const deduzione = tfr * deduzioneTFR;
  const costiAzienda = dipendenti <= 60;

  const costoRivalutazione = costiAzienda ? tfr * rivalutazione : 0;
  const costoImposta = costiAzienda
    ? tfr * rivalutazione * impostaRivalutazione
    : 0;
  const costoFondo = costiAzienda ? monte * fondoGaranzia : 0;
  const costoOneri = costiAzienda ? monte * oneriImpropri : 0;

  const costoTotale =
    costoRivalutazione + costoImposta + costoFondo + costoOneri;

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

document.getElementById("new-analysis").addEventListener("click", () => {
  form.reset();

  form.querySelectorAll("input").forEach(input => {
    if (![
      "coeffTFR", "inflazione", "fondo", "deduzione50",
      "deduzioneOltre", "imposta", "oneri", "mensilita"
    ].includes(input.id)) {
      input.value = "";
    }
  });

  resultsPanel.hidden = true;
  inputPanel.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* GENERAZIONE DEL PDF GRAFICO */
document.getElementById("print-button").addEventListener("click", async () => {
  if (resultsPanel.hidden) {
    alert("Prima completa l'analisi.");
    return;
  }

  if (typeof html2pdf === "undefined") {
    alert("La libreria PDF non è disponibile. Controlla che html2pdf.bundle.min.js sia presente nel progetto GitHub.");
    return;
  }

  const button = document.getElementById("print-button");
  const testoOriginale = button.textContent;
  button.disabled = true;
  button.textContent = "Preparazione PDF...";

  try {
    const report = document.createElement("div");

    report.style.cssText = `
      box-sizing:border-box;
      width:100%;
      padding:8mm;
      background:#ffffff;
      color:#1e293b;
      font-family:Arial,Helvetica,sans-serif;
      font-size:10px;
      line-height:1.35;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      display:flex;
      align-items:center;
      gap:16px;
      padding:12px;
      background:#17365d;
      color:#ffffff;
      border-radius:6px;
      margin-bottom:8px;
    `;

    const logo = document.createElement("img");
    logo.src = new URL("./logo-ac-insurance.png", document.baseURI).href;
    logo.alt = "AC Insurance";
    logo.style.cssText = "width:105px;height:auto;max-height:65px;object-fit:contain;";

    const heading = document.createElement("div");
    heading.innerHTML = `
      <div style="font-size:10px;letter-spacing:1px;font-weight:bold;color:#dbeafe">
        AC INSURANCE
      </div>
      <div style="font-size:19px;font-weight:bold;line-height:1.2;margin-top:4px">
        Analisi personalizzata TFR azienda
      </div>
    `;

    header.append(logo, heading);
    report.appendChild(header);

    const contacts = document.createElement("div");
    contacts.style.cssText = `
      background:#e8eef5;
      color:#17365d;
      padding:8px 10px;
      margin-bottom:10px;
      text-align:center;
      font-size:9px;
      border-bottom:1px solid #dbe3ec;
    `;
    contacts.textContent =
      "Via T. De Amicis 50, 80145 Napoli  |  Telefono: 081 19344322  |  WhatsApp: 081 5520622";
    report.appendChild(contacts);

    const title = document.createElement("h2");
    title.textContent = "RIEPILOGO ECONOMICO";
    title.style.cssText =
      "font-size:14px;color:#17365d;margin:8px 0 5px;";
    report.appendChild(title);

    const company = document.createElement("p");
    company.textContent =
      "Azienda: " + document.getElementById("result-company").textContent +
      "   |   Numero dipendenti: " +
      document.getElementById("out-dipendenti").textContent;
    company.style.cssText = "font-size:10px;margin:4px 0 8px;";
    report.appendChild(company);

    const summary = document.querySelector(".summary-grid").cloneNode(true);
    summary.style.cssText = `
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:7px;
      margin-bottom:10px;
    `;

    summary.querySelectorAll(".summary-card").forEach(card => {
      card.style.cssText = `
        display:block;
        box-sizing:border-box;
        padding:9px;
        border:1px solid #dbe3ec;
        border-left:4px solid #245a8d;
        border-radius:4px;
        background:#f3f6fa;
        color:#1e293b;
        min-height:48px;
      `;

      const label = card.querySelector("span");
      if (label) {
        label.style.cssText =
          "display:block;font-size:9px;color:#475569;margin-bottom:4px;";
      }

      const value = card.querySelector("strong");
      if (value) {
        value.style.cssText =
          "display:block;font-size:14px;color:#17365d;font-weight:bold;";
      }

      const small = card.querySelector("small");
      if (small) {
        small.style.cssText =
          "display:block;font-size:8px;color:#167447;margin-top:3px;";
      }
    });

    report.appendChild(summary);

    const sectionTitles = document.createElement("h3");
    sectionTitles.textContent = "Vantaggi destinazione TFR sul fondo pensione";
    sectionTitles.style.cssText =
      "font-size:11px;color:#17365d;margin:8px 0 3px;";
    report.appendChild(sectionTitles);

    const legal = document.createElement("p");
    legal.textContent =
      "Fonte normativa: Decreto legislativo n. 252 del 5 dicembre 2005, art. 10.";
    legal.style.cssText = "font-size:9px;margin:3px 0 8px;";
    report.appendChild(legal);

    const detailTitle = document.createElement("h3");
    detailTitle.textContent = "DETTAGLIO COSTI";
    detailTitle.style.cssText =
      "font-size:12px;color:#17365d;margin:7px 0 5px;";
    report.appendChild(detailTitle);

    const table = document.querySelector(".table-wrap table").cloneNode(true);
    table.style.cssText =
      "width:100%;border-collapse:collapse;font-size:9px;";

    table.querySelectorAll("th,td").forEach(cell => {
      cell.style.cssText =
        "border:1px solid #dbe3ec;padding:4px 7px;text-align:left;vertical-align:top;";
    });

    table.querySelectorAll("th").forEach(cell => {
      cell.style.cssText +=
        "width:65%;background:#f3f6fa;color:#17365d;font-weight:bold;";
    });

    table.querySelectorAll(".total-row th,.total-row td").forEach(cell => {
      cell.style.cssText +=
        "background:#e8eef5;color:#17365d;font-weight:bold;";
    });

    report.appendChild(table);

    const disclaimer = document.querySelector(".disclaimer").cloneNode(true);
    disclaimer.style.cssText = `
      margin-top:9px;
      padding:7px 9px;
      border:1px solid #dbe3ec;
      background:#f8fafc;
      font-size:8px;
      color:#475569;
    `;
    disclaimer.querySelectorAll("p").forEach(p => {
      p.style.cssText = "margin:0;";
    });
    report.appendChild(disclaimer);

    const footer = document.createElement("div");
    footer.innerHTML = `
      <div style="border-top:1px solid #dbe3ec;margin-top:9px;padding-top:5px;text-align:center;color:#17365d;font-size:9px;font-weight:bold">
        AC INSURANCE
      </div>
      <div style="text-align:center;font-size:8px;color:#64748b;margin-top:2px">
        powered by Marco Rossi
      </div>
    `;
    report.appendChild(footer);

    const options = {
      margin: [5, 5, 5, 5],
      filename: "Analisi_TFR_AC_Insurance.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },
      pagebreak: { mode: ["css", "legacy"] }
    };

    await html2pdf().set(options).from(report).toPdf().get("pdf").then(pdf => {
      const blob = pdf.output("blob");
      const file = new File([blob], "Analisi_TFR_AC_Insurance.pdf", {
        type: "application/pdf"
      });

      if (navigator.share && navigator.canShare &&
          navigator.canShare({ files: [file] })) {
        return navigator.share({
          files: [file],
          title: "Analisi TFR - AC Insurance",
          text: "Analisi personalizzata TFR azienda"
        });
      }

      pdf.save("Analisi_TFR_AC_Insurance.pdf");
    });
  } catch (error) {
    console.error("Errore creazione PDF:", error);
    alert("Non è stato possibile creare il PDF. Riprova e, se il problema continua, controlliamo la libreria PDF.");
  } finally {
    button.disabled = false;
    button.textContent = testoOriginale;
  }
});

/* SUPPORTO OFFLINE */
if ("serviceWorker" in navigator &&
    location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
