
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
    !Number.isInteger(dipendenti) ||
    !Number.isFinite(valore) ||
    valore <= 0
  ) {
    alert("Controlla il nome dell'azienda, il numero dei dipendenti e il valore inserito.");
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
  const deltaPercentuale = tfr > 0
    ? delta / tfr * 100
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

/* CREA E APRE IL PDF */
document.getElementById("print-button").addEventListener(
  "click",
  async event => {
    const button = event.currentTarget;

    if (typeof window.html2pdf !== "function") {
      alert(
        "La libreria PDF non è caricata. " +
        "Controlla html2pdf.bundle.min.js e ricarica la pagina."
      );
      return;
    }

    if (resultsPanel.hidden) {
      alert("Prima completa l'analisi.");
      return;
    }

    /*
      Apriamo la finestra direttamente al clic dell'utente.
      Questo aiuta a evitare il blocco dei popup su Safari.
    */
    const pdfWindow = window.open("about:blank", "_blank");

    if (!pdfWindow) {
      alert(
        "Il browser ha bloccato l'apertura del PDF. " +
        "Consenti i popup per questo sito e riprova."
      );
      return;
    }

    try {
      pdfWindow.document.open();
      pdfWindow.document.write(
        "<!doctype html><html lang='it'><head>" +
        "<meta charset='utf-8'>" +
        "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
        "<title>Preparazione PDF</title></head>" +
        "<body style='font-family:Arial,sans-serif;padding:24px'>" +
        "<p>Preparazione del PDF in corso...</p>" +
        "</body></html>"
      );
      pdfWindow.document.close();
    } catch (e) {
      /* La finestra è già stata aperta: proseguiamo comunque. */
    }

    button.disabled = true;

    const testoOriginale = button.textContent;
    button.textContent = "Creazione PDF in corso...";

    let report = null;
    let objectUrl = null;

    try {
      /*
        Prepariamo un documento autonomo.
        Non convertiamo direttamente il pannello visibile dell'app.
      */
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
        "font-family:Arial,sans-serif",
        "font-size:10pt",
        "box-sizing:border-box",
        "z-index:2147483647"
      ].join(";");

      const header = document
        .querySelector(".app-header")
        .cloneNode(true);

      const contacts = document
        .querySelector(".contact-bar")
        .cloneNode(true);

      const results = resultsPanel.cloneNode(true);

      results.hidden = false;
      results.removeAttribute("hidden");

      results.querySelectorAll(
        ".actions, #new-analysis, #print-button"
      ).forEach(el => el.remove());

      header.style.cssText =
        "display:flex;align-items:center;gap:12px;" +
        "padding:8mm;background:#ffffff;color:#17365d;" +
        "border-bottom:1px solid #dbe3ec;";

      const logo = header.querySelector("img");

      if (logo) {
        logo.style.cssText =
          "display:block;width:25mm;height:18mm;object-fit:contain;";
      }

      const title = header.querySelector("h1");

      if (title) {
        title.style.cssText =
          "font-size:17pt;line-height:1.2;text-align:center;" +
          "color:#17365d;margin:0;";
      }

      contacts.style.cssText =
        "display:flex;flex-wrap:wrap;justify-content:space-between;" +
        "gap:8px;padding:10px;background:#e8eef5;color:#17365d;" +
        "font-size:9pt;line-height:1.5;";

      contacts.querySelectorAll("a").forEach(link => {
        link.style.color = "#17365d";
        link.style.textDecoration = "none";
      });

      results.style.cssText =
        "display:block;width:100%;margin:0;padding:5mm;" +
        "border:0;border-radius:0;box-shadow:none;" +
        "background:#ffffff;box-sizing:border-box;";

      results.querySelectorAll(".summary-grid").forEach(el => {
        el.style.cssText =
          "display:block;margin-bottom:18px;";
      });

      results.querySelectorAll(".summary-card").forEach(el => {
        el.style.cssText =
          "display:inline-block;vertical-align:top;" +
          "width:46%;margin:1%;padding:12px;" +
          "border:1px solid #dbe3ec;border-radius:8px;" +
          "box-sizing:border-box;break-inside:avoid;";
      });

      results.querySelectorAll(".summary-card span").forEach(el => {
        el.style.cssText =
          "display:block;font-size:9pt;color:#64748b;margin-bottom:6px;";
      });

      results.querySelectorAll(".summary-card strong").forEach(el => {
        el.style.cssText =
          "display:block;font-size:14pt;color:#17365d;";
      });

      results.querySelectorAll(".summary-card small").forEach(el => {
        el.style.cssText =
          "display:block;margin-top:5px;font-size:8pt;";
      });

      results.querySelectorAll("h2").forEach(el => {
        el.style.cssText =
          "font-size:16pt;color:#17365d;margin:0 0 8px;";
      });

      results.querySelectorAll("h3").forEach(el => {
        el.style.cssText =
          "font-size:11pt;color:#17365d;margin:12px 0 7px;";
      });

      results.querySelectorAll(".table-wrap").forEach(el => {
        el.style.cssText =
          "display:block;width:100%;overflow:visible;" +
          "border:1px solid #dbe3ec;";
      });

      results.querySelectorAll("table").forEach(el => {
        el.style.cssText =
          "width:100%;border-collapse:collapse;" +
          "font-size:9pt;table-layout:auto;";
      });

      results.querySelectorAll("th,td").forEach(el => {
        el.style.cssText =
          "padding:6px 8px;border-bottom:1px solid #dbe3ec;" +
          "text-align:left;vertical-align:top;";
      });

      results.querySelectorAll("td").forEach(el => {
        el.style.textAlign = "right";
      });

      results.querySelectorAll("th").forEach(el => {
        el.style.width = "62%";
      });

      results.querySelectorAll(".disclaimer").forEach(el => {
        el.style.cssText =
          "margin-top:12px;padding:10px;background:#e5e7eb;" +
          "border:1px solid #d1d5db;border-radius:6px;" +
          "font-size:8pt;line-height:1.5;";
      });

      results.querySelectorAll(".legal-reference").forEach(el => {
        el.style.cssText =
          "font-size:8pt;color:#64748b;margin:6px 0 12px;";
      });

      const footer = document.createElement("div");

      footer.style.cssText =
        "padding:8px 5mm 5mm;text-align:center;" +
        "font-size:8pt;color:#64748b;";

      footer.textContent =
        "AC Insurance · Analisi personalizzata TFR azienda";

      report.appendChild(header);
      report.appendChild(contacts);
      report.appendChild(results);
      report.appendChild(footer);

      document.body.appendChild(report);

      /*
        Aspettiamo il caricamento del logo e dei caratteri
        prima di iniziare la conversione.
      */
      const images = Array.from(report.querySelectorAll("img"));

      await Promise.all(
        images.map(img => {
          if (img.complete) {
            return Promise.resolve();
          }

          return new Promise(resolve => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          });
        })
      );

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      const options = {
        margin: [7, 7, 7, 7],

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
          windowWidth: report.scrollWidth,
          onclone: clonedDocument => {
            const clonedReport =
              clonedDocument.getElementById("pdf-report");

            if (clonedReport) {
              clonedReport.style.position = "static";
              clonedReport.style.left = "0";
              clonedReport.style.top = "0";
              clonedReport.style.display = "block";
              clonedReport.style.visibility = "visible";
              clonedReport.style.opacity = "1";
            }
          }
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true
        },

        pagebreak: {
          mode: ["css", "legacy"],
          avoid: [".summary-card", ".disclaimer", "tr"]
        }
      };

      const pdf = await window.html2pdf()
        .set(options)
        .from(report)
        .toPdf()
        .get("pdf");

      if (
        !pdf ||
        typeof pdf.internal.getNumberOfPages !== "function" ||
        pdf.internal.getNumberOfPages() < 1
      ) {
        throw new Error("Il documento PDF non contiene pagine.");
      }

      const blob = pdf.output("blob");

      if (!blob || blob.size < 1000) {
        throw new Error("Il file PDF generato è vuoto o incompleto.");
      }

      if (blob.type !== "application/pdf") {
        throw new Error("Il file generato non è un PDF valido.");
      }

      objectUrl = URL.createObjectURL(blob);

      /*
        Mostriamo il PDF nella finestra aperta al clic.
        Evitiamo di sostituire la pagina principale dell'app.
      */
      pdfWindow.location.replace(objectUrl);

      /*
        Non revocare subito l'URL: Safari potrebbe averne
        ancora bisogno per visualizzare il documento.
      */

    } catch (error) {
      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.close();
      }

      console.error("Errore PDF:", error);

      alert(
        "Non è stato possibile creare il PDF.\n\n" +
        (error && error.message
          ? error.message
          : "Riprova dopo aver ricaricato la pagina.")
      );

    } finally {
      if (report && report.parentNode) {
        report.parentNode.removeChild(report);
      }

      button.disabled = false;
      button.textContent = testoOriginale;
    }
  }
);

/* FUNZIONAMENTO OFFLINE */
if (
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(error => {
        console.error("Errore service worker:", error);
      });
  });
}
