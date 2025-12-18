const { initFirebaseAdmin } = require('./firebaseAdmin.service');

const writeThreadSnapshot = async (threadId, payload) => {
  const { admin, firebaseInitialized } = initFirebaseAdmin();
  if (!firebaseInitialized) return;
  await admin.firestore().collection('chats').doc(threadId).set(payload, { merge: true });
};

const writeMessageSnapshot = async (threadId, messageId, payload) => {
  const { admin, firebaseInitialized } = initFirebaseAdmin();
  if (!firebaseInitialized) return;
  await admin
    .firestore()
    .collection('chats')
    .doc(threadId)
    .collection('messages')
    .doc(messageId)
    .set(payload, { merge: true });
};

module.exports = {
  writeThreadSnapshot,
  writeMessageSnapshot,
};
