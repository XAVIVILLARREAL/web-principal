import express from "express";
import cors from "cors";
import path from "path";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock database for interactive message templates
const templates = [
  {
    id: "template_1",
    keyword: "#enviar_catalogo",
    type: "buttons",
    text: "¡Hola! ¿En qué equipo de diagnóstico estás interesado?",
    footer: "Selecciona una opción abajo",
    buttons: [
      { id: "btn_1", text: "Escáneres Diesel" },
      { id: "btn_2", text: "Software Técnico" }
    ]
  }
];

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get templates
app.get("/api/templates", (req, res) => {
  res.json(templates);
});

// Chatwoot Webhook Endpoint (This Replaces n8n / Make.com)
app.post("/api/webhooks/chatwoot", async (req, res) => {
  console.log("Recibido Webhook de Chatwoot:", req.body);
  
  const { event, message_type, content, conversation } = req.body;

  // Solo procesar mensajes entrantes o notas privadas que contengan un trigger
  if (event === "message_created" && content) {
    
    // Buscar si el contenido tiene alguna palabra clave de nuestros templates
    const template = templates.find(t => content.includes(t.keyword));
    
    if (template && conversation && conversation.meta && conversation.meta.sender) {
      const phoneNumber = conversation.meta.sender.phone_number;
      
      if (phoneNumber) {
        console.log(`Trigger detectado: ${template.keyword}. Enviando a ${phoneNumber} vía Evolution API...`);
        
        // Construir el payload para Evolution API
        const evolutionPayload = {
          number: phoneNumber.replace("+", ""), // Evolution API suele requerir el número sin el +
          options: {
            delay: 1200,
            presence: "composing"
          },
          buttonsMessage: {
            text: template.text,
            footer: template.footer,
            buttons: template.buttons.map((btn, index) => ({
              buttonId: btn.id,
              buttonText: { displayText: btn.text },
              type: 1
            })),
            headerType: 1
          }
        };

        console.log("Payload para Evolution API:", JSON.stringify(evolutionPayload, null, 2));

        // Aquí harías el fetch real a tu Evolution API
        /*
        try {
          await fetch("https://tu-evolution-api.com/message/sendButtons/TU_INSTANCIA", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": "TU_API_KEY"
            },
            body: JSON.stringify(evolutionPayload)
          });
          console.log("Mensaje enviado exitosamente a Evolution API");
        } catch (error) {
          console.error("Error enviando a Evolution API:", error);
        }
        */
      }
    }
  }

  // Siempre responder 200 OK rápido para que Chatwoot no reintente
  res.status(200).json({ success: true });
});

// Endpoint to send messages directly via Evolution API
app.post("/api/evolution/send", async (req, res) => {
  const { phoneNumber, blocks, instanceUrl, apiKey } = req.body;

  if (!phoneNumber || !blocks || !instanceUrl || !apiKey) {
    return res.status(400).json({ error: "Missing required fields: phoneNumber, blocks, instanceUrl, apiKey" });
  }

  const number = phoneNumber.replace("+", "");
  let successCount = 0;
  let errorCount = 0;

  for (const block of blocks) {
    let endpoint = "";
    let payload: any = {
      number,
      options: {
        delay: 1200,
        presence: "composing"
      }
    };

    if (block.msgType === "buttons") {
      endpoint = `${instanceUrl}/message/sendButtons`;
      payload.buttonsMessage = {
        text: block.text || " ",
        footer: block.footer || "",
        buttons: (block.buttons || []).map((btn: any) => ({
          buttonId: btn.id,
          buttonText: { displayText: btn.text },
          type: 1
        })),
        headerType: 1
      };
    } else if (block.msgType === "list") {
      endpoint = `${instanceUrl}/message/sendList`;
      payload.listMessage = {
        title: block.listTitle || "",
        description: block.text || " ",
        buttonText: block.listButtonText || "Opciones",
        footerText: block.footer || "",
        sections: [
          {
            title: "Opciones",
            rows: (block.listOptions || []).map((opt: any) => ({
              title: opt.title,
              description: opt.description || "",
              rowId: opt.id
            }))
          }
        ]
      };
    } else if (block.msgType === "contact") {
      endpoint = `${instanceUrl}/message/sendContact`;
      payload.contactMessage = [
        {
          fullName: block.contactName || "Contacto",
          wuid: (block.contactPhone || "").replace("+", ""),
          phoneNumber: block.contactPhone || ""
        }
      ];
    } else if (block.msgType === "location") {
      endpoint = `${instanceUrl}/message/sendLocation`;
      payload.locationMessage = {
        latitude: parseFloat(block.latitude) || 0,
        longitude: parseFloat(block.longitude) || 0,
        name: block.locationName || "Ubicación",
        address: block.locationAddress || ""
      };
    } else if (block.msgType === "poll") {
      endpoint = `${instanceUrl}/message/sendPoll`;
      payload.pollMessage = {
        name: block.pollName || "Encuesta",
        selectableCount: parseInt(block.pollSelectableCount) || 1,
        values: (block.pollOptions || []).map((opt: any) => opt.title).filter((t: string) => t.trim() !== "")
      };
      if (payload.pollMessage.values.length === 0) {
        payload.pollMessage.values = ["Opción 1", "Opción 2"]; // Fallback to prevent API error
      }
    } else if (block.fileId) {
      // Media message
      endpoint = `${instanceUrl}/message/sendMedia`;
      
      // Determine mediatype based on fileType if available, otherwise default to document
      let mediatype = "document";
      if (block.fileType === "image") mediatype = "image";
      else if (block.fileType === "video") mediatype = "video";
      else if (block.fileType === "audio") mediatype = "audio";

      payload.mediaMessage = {
        mediatype: mediatype,
        caption: block.text || "",
        media: `https://drive.google.com/uc?export=download&id=${block.fileId}`
      };
    } else {
      // Standard text message
      endpoint = `${instanceUrl}/message/sendText`;
      payload.textMessage = {
        text: block.text || " "
      };
    }

    if (endpoint) {
      try {
        console.log(`Sending to Evolution API (${endpoint}):`, JSON.stringify(payload, null, 2));
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          successCount++;
        } else {
          console.error("Evolution API Error:", await response.text());
          errorCount++;
        }
      } catch (error) {
        console.error("Error sending to Evolution API:", error);
        errorCount++;
      }
    }
  }

  res.json({ success: true, successCount, errorCount });
});

// Vite middleware setup for development/production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
