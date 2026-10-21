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

  if (resultsPanel.hidden) {
    alert("Prima completa l'analisi.");
    return;
  }

  if (typeof window.html2pdf !== "function") {
    alert("La libreria PDF non è caricata. Ricarica la pagina e riprova.");
    return;
  }

  button.disabled = true;
  const testoOriginale = button.textContent;
  button.textContent = "Creazione PDF in corso...";

  let report = null;

  try {
    report = document.createElement("div");

    report.style.cssText = `
      width: 794px;
      padding: 28px;
      margin: 0;
      background: #ffffff;
      color: #1e293b;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.45;
      box-sizing: border-box;
    `;

    const header = document.querySelector(".app-header").cloneNode(true);
    const contacts = document.querySelector(".contact-bar").cloneNode(true);
    const results = resultsPanel.cloneNode(true);

    results.hidden = false;
    results.removeAttribute("hidden");

    results.querySelectorAll(".actions, #new-analysis, #print-button")
      .forEach(el => el.remove());

    header.style.cssText =
      "display:block;width:100%;padding:12px;margin:0;background:#fff;color:#17365d;text-align:center;box-sizing:border-box;";

    const logo = header.querySelector("img");
    if (logo) {
      logo.style.cssText =
        "display:block;width:100px;height:auto;max-height:65px;object-fit:contain;margin:0 auto 8px;";
    }

    const title = header.querySelector("h1");
    if (title) {
      title.style.cssText =
        "font-size:20px;line-height:1.3;color:#17365d;margin:0;";
    }

    contacts.style.cssText =
      "display:block;width:100%;padding:10px;margin:0;background:#e8eef5;color:#17365d;font-size:11px;line-height:1.6;box-sizing:border-box;";

    contacts.querySelectorAll("span").forEach(el => {
      el.style.display = "block";
    });

    results.style.cssText =
      "display:block;width:100%;max-width:none;margin:0;padding:14px 0;border:0;box-shadow:none;background:#fff;box-sizing:border-box;overflow:visible;";

    results.querySelectorAll(".summary-grid").forEach(el => {
      el.style.cssText =
        "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 16px;width:100%;box-sizing:border-box;";
    });

    results.querySelectorAll(".summary-card").forEach(el => {
      el.style.cssText =
        "display:block;min-width:0;margin:0;padding:10px;border:1px solid #dbe3ec;border-radius:5px;box-sizing:border-box;background:#fff;overflow-wrap:anywhere;";
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
      el.style.cssText = "display:block;width:100%;overflow:visible;";
    });

    results.querySelectorAll("table").forEach(el => {
      el.style.cssText =
        "width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px;box-sizing:border-box;";
    });

    results.querySelectorAll("th,td").forEach(el => {
      el.style.cssText =
        "padding:6px;border-bottom:1px solid #dbe3ec;vertical-align:top;text-align:left;white-space:normal;overflow-wrap:anywhere;box-sizing:border-box;";
    });

    results.querySelectorAll("td").forEach(el => {
      el.style.textAlign = "right";
    });

    results.querySelectorAll(".disclaimer").forEach(el => {
      el.style.cssText =
        "display:block;width:100%;margin-top:14px;padding:10px;background:#f1f3f5;border:1px solid #d1d5db;font-size:10px;line-height:1.5;box-sizing:border-box;";
    });

    const footer = document.createElement("p");
    footer.textContent = "AC Insurance · Analisi personalizzata TFR azienda";
    footer.style.cssText =
      "padding:10px 0 0;margin:0;text-align:center;color:#64748b;font-size:10px;";

    report.appendChild(header);
    report.appendChild(contacts);
    report.appendChild(results);
    report.appendChild(footer);

    /*
      Inserisce il report fuori schermo ma con dimensioni reali.
      html2pdf deve poterlo misurare prima di acquisirlo.
    */
    report.style.position = "fixed";
    report.style.left = "-10000px";
    report.style.top = "0";
    report.style.zIndex = "-1";

    document.body.appendChild(report);

    await new Promise(resolve => setTimeout(resolve, 300));

    const options = {
      margin: 8,
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
        windowWidth: 850
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".summary-card", ".disclaimer"]
      }
    };

    /*
      Genera il PDF e lo scarica direttamente.
      Non apre finestre vuote né crea URL temporanei.
    */
    await window.html2pdf()
      .set(options)
      .from(report)
      .save();

  } catch (error) {
    console.error("Errore PDF:", error);
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
