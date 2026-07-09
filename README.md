# Nutrition Tracker with Apps Script + Firebase

This project uses Google Apps Script as the web app frontend and Firebase Realtime Database as the data store.

## Setup
1. Create a Firebase project at https://firebase.google.com/
2. Enable the Realtime Database.
3. Set the database rules to allow reads and writes for testing, or restrict them to authenticated users later.
4. In Apps Script, open Project Settings and add a script property named `FIREBASE_URL` with your Realtime Database URL, for example:
   `https://your-project-id-default-rtdb.firebaseio.com`
5. Deploy the web app again after saving the script property.

## Notes
- The app stores entries in Firebase under the `entries` node.
- Each entry contains: timestamp, date, meal, calories, protein, and source.
