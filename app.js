
const form = document.getElementById("analysis-form");
const tipoValore = document.getElementById("tipoValore");
const valoreLabel = document.getElementById("valore-label");
const mensilitaField = document.getElementById("mensilita-field");
const resultsPanel = document.getElementById("results-panel");
const inputPanel = document.getElementById("input-panel");
const pdfButton = document.getElementById("print-button");

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

const num = id =>
  Number(document.getElementById(id).value);

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
    alert(
      "Controlla il nome dell'azienda, il numero dei dipendenti e il valore inserito."
    );
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

  let ral;
  let monte;
  let tfr;

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

  const deduzioneTFR =
    dipendenti < 50 ? deduzione50 : deduzioneOltre;

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
  document.getElementById("out-cost-positive").textContent =
    euro(costoTotale);
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

  document.getElementById("out-costo-totale").textContent =
    euro(costoTotale);

  document.getElementById("out-deduzione-dettaglio").textContent =
    euro(deduzione);

  document.getElementById("out-delta-dettaglio").textContent =
    euro(delta);

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

/* CREA IL PDF GRAFICO */
pdfButton.addEventListener("click", async () => {
  if (resultsPanel.hidden) {
    alert("Prima completa l'analisi per visualizzare il report.");
    return;
  }

  if (typeof window.html2pdf !== "function") {
    alert(
      "Il generatore PDF non è disponibile. Verifica la connessione e ricarica l'app."
    );
    return;
  }

  const vecchioTesto = pdfButton.textContent;
  pdfButton.disabled = true;
  pdfButton.textContent = "Creazione PDF in corso...";

  let finestraPDF = null;
  let urlPDF = null;
  let contenitore = null;

  try {
    /*
      Apriamo subito una scheda vuota:
      su iPhone Safari può bloccare l'apertura
      di nuove schede avviata dopo un'attesa.
    */
    finestraPDF = window.open("about:blank", "_blank");

    contenitore = document.createElement("div");
    contenitore.className = "pdf-export";
    contenitore.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "width:794px",
      "padding:24px",
      "background:#ffffff",
      "color:#222222",
      "z-index:2147483000",
      "box-sizing:border-box",
      "pointer-events:none"
    ].join(";");

    const intestazione = document.querySelector(".app-header");
    const recapiti = document.querySelector(".contact-bar");
    const risultato = resultsPanel.cloneNode(true);
    const footer = document.querySelector("footer");

    if (intestazione) {
      contenitore.appendChild(intestazione.cloneNode(true));
    }

    if (recapiti) {
      contenitore.appendChild(recapiti.cloneNode(true));
    }

    /* Rimuove i pulsanti dal documento PDF */
    risultato.querySelectorAll("button, .actions").forEach(el => {
      el.remove();
    });

    risultato.hidden = false;
    risultato.style.display = "block";
    risultato.style.margin = "18px 0 0";
    risultato.style.width = "100%";
    risultato.style.boxSizing = "border-box";

    contenitore.appendChild(risultato);

    if (footer) {
      const footerPDF = footer.cloneNode(true);
      footerPDF.style.marginTop = "18px";
      contenitore.appendChild(footerPDF);
    }

    document.body.appendChild(contenitore);

    /* Attende il caricamento delle immagini, incluso il logo */
    const immagini = Array.from(contenitore.querySelectorAll("img"));

    await Promise.all(
      immagini.map(img => {
        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    const opzioni = {
      margin: [8, 8, 8, 8],
      filename: "Analisi_TFR_AC_Insurance.pdf",
      image: {
        type: "jpeg",
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
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
        avoid: [".summary-card", "tr", ".disclaimer"]
      }
    };

    /* Genera un vero file PDF dalla pagina grafica */
    const blob = await window.html2pdf()
      .set(opzioni)
      .from(contenitore)
      .outputPdf("blob");

    if (!blob || blob.size === 0) {
      throw new Error("Il PDF generato è vuoto.");
    }

    urlPDF = URL.createObjectURL(blob);

    const nomeAzienda =
      document.getElementById("azienda").value.trim() || "Azienda";

    const nomeFile =
      "Analisi_TFR_" +
      nomeAzienda
        .replace(/[^a-z0-9_-]/gi, "_")
        .slice(0, 50) +
      ".pdf";

    const filePDF = new File(
      [blob],
      nomeFile,
      { type: "application/pdf" }
    );

    /*
      Se il dispositivo supporta la condivisione dei file,
      propone direttamente il PDF.
    */
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [filePDF] })
    ) {
      if (finestraPDF && !finestraPDF.closed) {
        finestraPDF.close();
        finestraPDF = null;
      }

      try {
        await navigator.share({
          files: [filePDF],
          title: "Analisi personalizzata TFR",
          text: "Analisi TFR elaborata da AC Insurance."
        });

        return;
      } catch (erroreCondivisione) {
        if (erroreCondivisione.name === "AbortError") {
          return;
        }

        /*
          Se la condivisione diretta non è disponibile,
          passa all'apertura del PDF.
        */
      }
    }

    /*
      Alternativa: apre il PDF vero nel browser.
      Da lì l'utente può utilizzare la condivisione
      del dispositivo.
    */
    if (finestraPDF && !finestraPDF.closed) {
      finestraPDF.location.href = urlPDF;
      finestraPDF = null;
    } else {
      const link = document.createElement("a");
      link.href = urlPDF;
      link.download = nomeFile;
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (errore) {
    if (finestraPDF && !finestraPDF.closed) {
      finestraPDF.close();
    }

    console.error("Errore nella creazione PDF:", errore);

    alert(
      "Non è stato possibile creare il PDF. Ricarica l'app e riprova. " +
      "Se il problema continua, verificheremo la compatibilità del dispositivo."
    );
  } finally {
    if (contenitore) {
      contenitore.remove();
    }

    pdfButton.disabled = false;
    pdfButton.textContent = vecchioTesto;

    /*
      Mantiene temporaneamente disponibile il PDF
      per la scheda appena aperta.
    */
    if (urlPDF) {
      setTimeout(() => URL.revokeObjectURL(urlPDF), 60000);
    }
  }
});

/* FUNZIONAMENTO OFFLINE */
if (
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(() => {});
  });
}
