import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Helper function to send notification
async function sendNotification(userId: string, title: string, body: string) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData && Array.isArray(userData.fcmTokens) && userData.fcmTokens.length > 0) {
      const message = {
        notification: { title, body },
        tokens: userData.fcmTokens,
      };
      
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Notification sent to ${userId}. Success count: ${response.successCount}`);
    }
  } catch (error) {
    console.error(`Failed to send notification to ${userId}:`, error);
  }
}

// 1. Content Decay Cron Job (Runs every 24 hours)
export const decaySecrets = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = new Date();
  const secretsRef = db.collection('secrets');
  
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const snapshot = await secretsRef.where('createdAt', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo)).get();

  const batch = db.batch();
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const createdAt = data.createdAt.toDate();
    const listens = data.listens || 0;
    const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    let shouldDelete = false;
    let reason = '';

    if (ageDays > 60) {
      shouldDelete = true;
      reason = 'reaching the 60-day limit';
    } else if (ageDays > 21 && listens < 5) {
      shouldDelete = true;
      reason = 'receiving too few listens';
    } else if (ageDays > 7 && listens === 0) {
      shouldDelete = true;
      reason = 'receiving no listens in the first week';
    }

    if (shouldDelete) {
      batch.delete(doc.ref);
      deletedCount++;
      
      // Notify the creator that their secret vanished
      if (data.creatorId) {
        await sendNotification(
          data.creatorId,
          'A secret vanished into thin air 💨',
          `Your secret was removed due to ${reason}. Stay active to keep your secrets alive!`
        );
      }
    }
  }

  if (deletedCount > 0) {
    await batch.commit();
    console.log(`Deleted ${deletedCount} decayed secrets.`);
  } else {
    console.log('No secrets to decay.');
  }

  return null;
});

// 2. Push Notification on Secret interaction (Liked or Saved)
export const onSecretUpdated = functions.firestore
  .document('secrets/{secretId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const creatorId = newData.creatorId;

    if (!creatorId) return null;

    // Check if likes increased
    if (newData.likes > oldData.likes) {
      await sendNotification(
        creatorId,
        'Someone liked your secret! ❤️',
        'A user nearby discovered and liked your secret.'
      );
    }

    // Check if savedBy array increased (someone saved the secret)
    const oldSaved = oldData.savedBy || [];
    const newSaved = newData.savedBy || [];
    if (newSaved.length > oldSaved.length) {
      await sendNotification(
        creatorId,
        'Someone saved your secret! 🔖',
        'Your secret was so intriguing that someone saved it to their private collection.'
      );
    }
    
    return null;
  });
