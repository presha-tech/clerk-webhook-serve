const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.handleClerkWebhook = functions.https.onRequest(async (req, res) => {
  const event = req.body;

  try {
    if (event.type === 'user.created') {
      const user = event.data;

      await db.collection('users').doc(user.id).set({
        email: user.email_addresses[0].email_address,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        createdAt: new Date(),
      });

      console.log('User synced:', user.id);
    }

    res.status(200).send('Webhook handled');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});
