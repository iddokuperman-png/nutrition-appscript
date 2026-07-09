# Nutrition Tracker with Apps Script + Firebase

This project uses Google Apps Script as the web app frontend and Firebase Realtime Database as the data store.

## Setup
1. Create a Firebase project at https://firebase.google.com/
2. Enable Realtime Database.
3. Set database rules to allow reads/writes for authenticated users only or for testing allow public access.
4. In Apps Script, add the Firebase App Script library or use fetch requests to the Firebase REST API.
5. Replace the placeholder config in Code.gs with your Firebase project details.

## Notes
- The current app stores entries in Firebase under the `entries` node.
- Each entry contains: timestamp, date, meal, calories, protein, source.
