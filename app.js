
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

/* RIEPILOGO TESTUALE PER WHATSAPP ED EMAIL */
function creaRiepilogo() {
  const azienda = document.getElementById("result-company").textContent;
  const dipendenti = document.getElementById("out-dipendenti").textContent;

  const righe = [
    "AC INSURANCE",
    "ANALISI PERSONALIZZATA TFR AZIENDA",
    "",
    "================================",
    "DATI AZIENDALI",
    "================================",
    "Azienda: " + azienda,
    "Numero dipendenti: " + dipendenti,
    "",
    "RIEPILOGO ECONOMICO",
    "--------------------------------",
    "TFR annuo: " + document.getElementById("out-tfr").textContent,
    "Costo TFR in azienda: " + document.getElementById("out-cost-positive").textContent,
    "Deduzione fiscale: " + document.getElementById("out-deduzione").textContent,
    "Delta complessivo: " + document.getElementById("out-delta").textContent,
    "Incidenza sul TFR annuo: " + document.getElementById("out-percentuale-dettaglio").textContent,
    "",
    "DETTAGLIO DEI COSTI",
    "--------------------------------",
    "RAL media annua: " + document.getElementById("out-ral").textContent,
    "Monte stipendi: " + document.getElementById("out-monte").textContent,
    "Rivalutazione TFR: " + document.getElementById("out-rivalutazione-pct").textContent,
    "",
    "Costo rivalutazione TFR: " + document.getElementById("out-rivalutazione").textContent,
    "Imposta sulla rivalutazione: " + document.getElementById("out-imposta").textContent,
    "Fondo garanzia INPS: " + document.getElementById("out-fondo").textContent,
    "Oneri impropri: " + document.getElementById("out-oneri").textContent,
    "",
    "Totale costi evitabili: " + document.getElementById("out-costo-totale").textContent,
    "Deduzione fiscale: " + document.getElementById("out-deduzione-dettaglio").textContent,
    "",
    "VANTAGGI DELLA DESTINAZIONE DEL TFR AL FONDO PENSIONE",
    "--------------------------------",
    "Fonte normativa: D.Lgs. 252/2005, art. 10.",
    "",
    "NOTA INFORMATIVA",
    "Analisi puramente indicativa, elaborata sulla base dei dati forniti dall'azienda. Gli importi possono variare in funzione dei dati effettivi e delle condizioni applicabili.",
    "",
    "================================",
    "AC INSURANCE",
    "Via T. De Amicis 50, 80145 Napoli",
    "Telefono: 081 19344322",
    "WhatsApp: 081 5520622"
  ];

  return righe.join("\n");
}

/* CONDIVISIONE WHATSAPP */
function condividiWhatsApp() {
  const testo = creaRiepilogo();
  const url = "https://wa.me/?text=" + encodeURIComponent(testo);
  window.open(url, "_blank", "noopener,noreferrer");
}

/* CONDIVISIONE EMAIL */
function condividiEmail() {
  const oggetto = "Analisi personalizzata TFR - " +
    document.getElementById("result-company").textContent;

  const corpo = creaRiepilogo();

  window.location.href =
    "mailto:?subject=" + encodeURIComponent(oggetto) +
    "&body=" + encodeURIComponent(corpo);
}

/* STAMPA / PDF */
document.getElementById("print-button").addEventListener("click", () => {
  window.print();
});

/* CREA I PULSANTI DI CONDIVISIONE */
const actions = document.querySelector("#results-panel .actions");

if (actions) {
  const whatsappButton = document.createElement("button");
  whatsappButton.type = "button";
  whatsappButton.className = "secondary";
  whatsappButton.textContent = "Condividi su WhatsApp";
  whatsappButton.addEventListener("click", condividiWhatsApp);

  const emailButton = document.createElement("button");
  emailButton.type = "button";
  emailButton.className = "secondary";
  emailButton.textContent = "Invia via email";
  emailButton.addEventListener("click", condividiEmail);

  actions.appendChild(whatsappButton);
  actions.appendChild(emailButton);
}

/* FUNZIONAMENTO OFFLINE */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(() => {});
  });
}
