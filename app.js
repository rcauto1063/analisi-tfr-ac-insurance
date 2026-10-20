
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

/* AGGIORNAMENTO DEL CAMPO */
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

/* CALCOLO DELL'ANALISI TFR */
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
  const deltaPercentuale = tfr > 0 ? (delta / tfr) * 100 : 0;

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

  document.getElementById("out-rivalutazione").textContent = euro(costoRivalutazione);
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

/* STAMPA / PDF CON GRAFICA ORIGINALE */
const printButton = document.getElementById("print-button");

if (printButton) {
  printButton.textContent = "Crea PDF";

  printButton.addEventListener("click", () => {
    if (resultsPanel.hidden) {
      alert("Prima completa l'analisi.");
      return;
    }

    window.print();
  });
}

/* FUNZIONAMENTO OFFLINE */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(() => {});
  });
}
