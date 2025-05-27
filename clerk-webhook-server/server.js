const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config(); // Load env vars from .env

// Initialize Firebase Admin SDK using env vars
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json()); // Parse JSON body

app.post("/webhook", async (req, res) => {
  const event = req.body;

  try {
    if (event.type === "user.created") {
      const user = event.data;

      await db.collection("users").doc(user.id).set({
        email: user.email_addresses[0].email_address,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        createdAt: new Date(),
      });

      console.log("User synced:", user.id);
    }

    res.status(200).send("Webhook handled");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Internal error");
  }
});

app.get("/", (req, res) => {
  res.send("Clerk Webhook Server is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
