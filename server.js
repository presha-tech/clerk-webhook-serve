const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
require("dotenv").config(); // Load environment variables

// Initialize Firebase Admin SDK
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

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Clerk middleware to get auth info from headers
const clerk = ClerkExpressWithAuth();

// --- TEMPORARY: Disable Clerk middleware for diagnostics ---
// app.post("/create-firebase-token", clerk, async (req, res) => {
app.post("/create-firebase-token", async (req, res) => {
  console.log("✅ Route hit");
  res.json({ firebaseToken: "fake_token_for_testing" });
});
// ----------------------------------------------------------

// Webhook endpoint for Clerk events
app.post("/webhook", async (req, res) => {
  const event = req.body;

  try {
    if (event.type === "user.created") {
      const user = event.data;

      // Ensure the user exists in Firebase Auth
      await admin.auth().getUser(user.id).catch(async () => {
        await admin.auth().createUser({ uid: user.id });
      });

      // Sync to Firestore
      await db.collection("users").doc(user.id).set({
        email: user.email_addresses[0].email_address,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        createdAt: new Date(),
      });

      console.log("✅ User synced:", user.id);
    }

    res.status(200).send("Webhook handled");
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).send("Internal error");
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Clerk Webhook Server is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});