/* CREA E SALVA O CONDIVIDE IL PDF */

document.getElementById("print-button").addEventListener("click", async () => {
  const pulsante = document.getElementById("print-button");
  const testoOriginale = pulsante.textContent;

  if (resultsPanel.hidden) {
    alert("Prima completa l'analisi.");
    return;
  }

  pulsante.disabled = true;
  pulsante.textContent = "Preparazione PDF...";

  let urlPDF = null;

  try {
    const blob = await generaPDF();

    if (!blob || blob.size < 1000) {
      throw new Error("Il PDF generato non contiene dati sufficienti.");
    }

    const nome = nomeFilePDF();
    urlPDF = URL.createObjectURL(blob);

    /*
      RILEVAMENTO DISPOSITIVO
      PC: download diretto.
      iPhone/iPad: condivisione nativa, se disponibile.
    */

    const piattaformaApple =
      /iPhone|iPod|iPad/i.test(navigator.userAgent) ||
      (
        navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1
      );

    if (piattaformaApple) {
      const file = new File([blob], nome, {
        type: "application/pdf"
      });

      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "Analisi personalizzata TFR",
            text: "Analisi TFR elaborata da AC Insurance."
          });

          return;
        } catch (erroreCondivisione) {
          if (erroreCondivisione.name === "AbortError") {
            return;
          }

          console.warn(
            "Condivisione non riuscita, provo ad aprire il PDF:",
            erroreCondivisione
          );
        }
      }

      /*
        Alternativa per iPhone/iPad:
        apre il PDF nel browser, dove è possibile salvarlo
        tramite le funzioni disponibili sul dispositivo.
      */

      const linkApple = document.createElement("a");
      linkApple.href = urlPDF;
      linkApple.target = "_blank";
      linkApple.rel = "noopener";
      linkApple.download = nome;
      document.body.appendChild(linkApple);
      linkApple.click();
      linkApple.remove();

    } else {
      /*
        PC Windows e altri dispositivi desktop:
        download diretto, senza finestra di condivisione.
      */

      const linkDownload = document.createElement("a");
      linkDownload.href = urlPDF;
      linkDownload.download = nome;
      linkDownload.style.display = "none";

      document.body.appendChild(linkDownload);
      linkDownload.click();
      linkDownload.remove();
    }

  } catch (errore) {
    console.error("Errore PDF:", errore);

    alert(
      "Non è stato possibile salvare il PDF: " +
      (errore.message || "riprova.")
    );

  } finally {
    pulsante.disabled = false;
    pulsante.textContent = testoOriginale;

    if (urlPDF) {
      setTimeout(() => URL.revokeObjectURL(urlPDF), 60000);
    }
  }
});
