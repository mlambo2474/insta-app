// firebaseCore.js

// Firebase Configuration and Initialization (Assuming Firebase is initialized elsewhere)
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// Authentication Function
function isAuthenticated() {
  return firebase.auth().currentUser;
}

// Upload file to Firebase Storage
function uploadFile(file, userId) {
  const uniquePath = `posts/${userId}/${Date.now()}-${file.name}`;
  const fileRef = storage.ref(uniquePath);
  
  return fileRef.put(file);
}

// Add new post to Firestore
function addPostToFirestore(userId, username, imageUrl, caption) {
  return db.collection("posts").add({
    userId,
    username,
    imageUrl,
    caption,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// Get all posts from Firestore
function getPostsFromFirestore() {
  return db.collection("posts").orderBy("timestamp", "desc").get();
}

// Delete post from Firestore
function deletePostFromFirestore(postId) {
  return db.collection("posts").doc(postId).delete();
}

// Update post in Firestore
function updatePostInFirestore(postId, imageUrl, caption) {
  return db.collection("posts").doc(postId).update({
    imageUrl,
    caption,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// Export functions
export {
  isAuthenticated,
  uploadFile,
  addPostToFirestore,
  getPostsFromFirestore,
  deletePostFromFirestore,
  updatePostInFirestore
};
