const mainApp = document.querySelector(".app");
const firebaseAuthContainer = document.querySelector(
  "#firebaseui-auth-container"
);
const logOutButton = document.querySelector(".logout");
const createpostElement = document.querySelector(".create-post");
const uploadButton = document.querySelector(".upload");
const instagramButton = document.querySelector(".instagram");

//from app.js
const filesEl = document.querySelector("#files");
const sendButton = document.querySelector("#send");
const uploading = document.querySelector("#uploading");
const usernameInput = document.getElementById("username");
const captionInput = document.getElementById("caption");

const modalButton = document.querySelector(".modal-button");
const modal = document.querySelector(".modal");
const closeButton = document.querySelector(".close-modal");
const modalContent = document.querySelector(".modal-content");
const modalActions = document.querySelector(".modal-actions");
const progressEl = document.querySelector("#progress");

const postFeed = document.querySelector(".post-feed");

let selectedPostId = null;
let editingPostId = null;
let editingImageUrl = "";


// Import the functions you need from the SDKs you need
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyCwb-F2XgR_fAs2e6ctOgSZeq1U3I34tG0",
  authDomain: "insta-app-d0320.firebaseapp.com",
  projectId: "insta-app-d0320",
  storageBucket: "insta-app-d0320.firebasestorage.app",
  messagingSenderId: "621954352090",
  appId: "1:621954352090:web:a927ec7da95184d22fb6e3",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
console.log(app);
// Initialize Firebase Authentication and get a reference to the service
const auth = firebase.auth();
console.log(auth);
const storage = firebase.storage();
const storageRef = storage.ref("test-path");
console.log(storage);
console.log(storageRef);
const db = firebase.firestore();
console.log(db);
// Initialize the FirebaseUI Widget using Firebase.
const ui = new firebaseui.auth.AuthUI(firebase.auth());
const redirectToAuth = () => {
  mainApp.style.display = "none";
  createpostElement.style.display = "none";
  firebaseAuthContainer.style.display = "block";

  ui.start("#firebaseui-auth-container", {
    callbacks: {
      signInSuccessWithAuthResult: (authResult, redirectUrl) => {
        // User successfully signed in.
        // Return type determines whether we continue the redirect automatically
        // or whether we leave that to developer to handle.
        console.log("authResult", authResult.user.uid);
        // this.userId = authResult.user.uid;
        // this.$authUserText.innerHTML = user.displayName;
        redirectToApp();
      },
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    // signInFlow: 'popup',
    // signInSuccessUrl: '<url-to-redirect-to-on-success>',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
    //other config options
  });
};

const redirectToApp = () => {
  mainApp.style.display = "block";
  firebaseAuthContainer.style.display = "none";
  createpostElement.style.display = "none";
};
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log(user.uid);
    // this.userId = user.uid;
    // this.$authUserText.innerHTML = user.displayName;
    redirectToApp();
    renderPosts();
  } else {
    console.log("not loggedin");
    redirectToAuth();
  }
});

const handleLogout = () => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      // Sign-out successful.
      createpostElement.style.display = "none";
      redirectToAuth();
      console.log("user signed out");
    })
    .catch((error) => {
      // An error happened.
      console.log("An error has occured", error.message);
    });
};
logOutButton.addEventListener("click", () => {
  console.log("user signed out");
  handleLogout();
});

const createPostHandler = () => {
  mainApp.style.display = "none";
  firebaseAuthContainer.style.display = "none";
  createpostElement.style.display = "block";
};

uploadButton.addEventListener("click", () => {
  createPostHandler();
});

instagramButton.addEventListener("click", () => {
  redirectToApp();
});

createpostElement.style.display = "flex";
createpostElement.style.flexDirection = "column";

let files = [];
filesEl.addEventListener("change", (e) => {
  files = e.target.files;
});

sendButton.addEventListener("click", () => {
  const user = firebase.auth().currentUser;
  if (!user) return alert("Please log in first.");

  const username = usernameInput.value.trim();
  const caption = captionInput.value.trim();

  if (editingPostId) {
    //  EDIT MODE First
    if (files.length > 0) {
      const file = files[0];
      const uniquePath = `posts/${user.uid}/${Date.now()}-${file.name}`;
      const fileRef = storage.ref(uniquePath);
      const uploadTask = fileRef.put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percentage =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressEl.value = percentage;
        },
        (error) => {
          console.error("Upload failed:", error);
          alert("Upload failed.");
        },
        () => {
          fileRef.getDownloadURL().then((downloadURL) => {
            updatePost(editingPostId, downloadURL, caption);
            resetForm();
            redirectToApp();
          });
        }
      );
    } else {
      // Only caption updated
      updatePost(editingPostId, editingImageUrl, caption);
      resetForm();
      redirectToApp();
    }
  } else {
    //  NORMAL UPLOAD 
    if (files.length === 0) return alert("No file chosen");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uniquePath = `posts/${user.uid}/${Date.now()}-${file.name}`;
      const fileRef = storage.ref(uniquePath);

      const uploadTask = fileRef.put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percentage =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressEl.value = percentage;
        },
        (error) => {
          console.error("Upload failed:", error);
          alert("Upload failed.");
        },
        () => {
          fileRef.getDownloadURL().then((downloadURL) => {
            db.collection("posts")
              .add({
                userId: user.uid,
                username: username,
                imageUrl: downloadURL,
                caption: caption,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              })
              .then(() => {
                renderPosts();
                uploading.innerHTML += `${file.name} uploaded and saved!<br>`;
                resetForm();
                redirectToApp();
              });
          });
        }
      );
    }
  }
});



function resetForm() {
  captionInput.value = "";
  usernameInput.value = "";
  filesEl.value = "";
  progressEl.value = 0;
  files = [];
  editingPostId = null;
  editingImageUrl = null;
}
function generatePostHTML({ imageUrl, caption, username, postId, userId, timestamp }) {
  return `
      <div class="post"  data-post-id="${postId}" data-user-id="${userId}">
        <div class="header">
          <div class="profile-area">
            <div class="post-pic">
              <img
                alt="${username}'s profile picture"
                class="_6q-tv"
                data-testid="user-avatar"
                draggable="false"
                src="assets/akhil.png" />
            </div>
            <span class="profile-name">${username}</span>
          </div>
          <div class="options">
            <div class="Igw0E rBNOH YBx95" style="height: 24px; width: 24px  modal-button" onclick="openModal('${postId}', '${userId}')">
              <svg aria-label="More options" class="_8-yf5" fill="#262626" height="16" viewBox="0 0 48 48" width="16">
                <circle cx="8" cy="24" r="4.5"></circle>
                <circle cx="24" cy="24" r="4.5"></circle>
                <circle cx="40" cy="24" r="4.5"></circle>
              </svg>
            </div>
          </div>
        </div>
        <div class="body">
          <img
            alt="Post image"
            class="FFVAD"
            decoding="auto"
            sizes="614px"
            src="${imageUrl}"
            style="object-fit: cover" />
        </div>
        <div class="footer">
          <div class="user-actions">
                      <div class="like-comment-share">
                        <div>
                          <span class=""
                            ><svg
                              aria-label="Like"
                              class="_8-yf5"
                              fill="#262626"
                              height="24"
                              viewBox="0 0 48 48"
                              width="24"
                            >
                              <path
                                d="M34.6 6.1c5.7 0 10.4 5.2 10.4 11.5 0 6.8-5.9 11-11.5 16S25 41.3 24 41.9c-1.1-.7-4.7-4-9.5-8.3-5.7-5-11.5-9.2-11.5-16C3 11.3 7.7 6.1 13.4 6.1c4.2 0 6.5 2 8.1 4.3 1.9 2.6 2.2 3.9 2.5 3.9.3 0 .6-1.3 2.5-3.9 1.6-2.3 3.9-4.3 8.1-4.3m0-3c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5.6 0 1.1-.2 1.6-.5 1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"
                              ></path></svg
                          ></span>
                        </div>
                        <div class="margin-left-small">
                          <svg
                            aria-label="Comment"
                            class="_8-yf5"
                            fill="#262626"
                            height="24"
                            viewBox="0 0 48 48"
                            width="24"
                          >
                            <path
                              clip-rule="evenodd"
                              d="M47.5 46.1l-2.8-11c1.8-3.3 2.8-7.1 2.8-11.1C47.5 11 37 .5 24 .5S.5 11 .5 24 11 47.5 24 47.5c4 0 7.8-1 11.1-2.8l11 2.8c.8.2 1.6-.6 1.4-1.4zm-3-22.1c0 4-1 7-2.6 10-.2.4-.3.9-.2 1.4l2.1 8.4-8.3-2.1c-.5-.1-1-.1-1.4.2-1.8 1-5.2 2.6-10 2.6-11.4 0-20.6-9.2-20.6-20.5S12.7 3.5 24 3.5 44.5 12.7 44.5 24z"
                              fill-rule="evenodd"
                            ></path>
                          </svg>
                        </div>
                        <div class="margin-left-small">
                          <svg
                            aria-label="Share Post"
                            class="_8-yf5"
                            fill="#262626"
                            height="24"
                            viewBox="0 0 48 48"
                            width="24"
                          >
                            <path
                              d="M47.8 3.8c-.3-.5-.8-.8-1.3-.8h-45C.9 3.1.3 3.5.1 4S0 5.2.4 5.7l15.9 15.6 5.5 22.6c.1.6.6 1 1.2 1.1h.2c.5 0 1-.3 1.3-.7l23.2-39c.4-.4.4-1 .1-1.5zM5.2 6.1h35.5L18 18.7 5.2 6.1zm18.7 33.6l-4.4-18.4L42.4 8.6 23.9 39.7z"
                            ></path>
                          </svg>
                        </div>
                      </div>
                      <div class="bookmark">
                        <div class="QBdPU rrUvL">
                          <svg
                            aria-label="Save"
                            class="_8-yf5"
                            fill="#262626"
                            height="24"
                            viewBox="0 0 48 48"
                            width="24"
                          >
                            <path
                              d="M43.5 48c-.4 0-.8-.2-1.1-.4L24 29 5.6 47.6c-.4.4-1.1.6-1.6.3-.6-.2-1-.8-1-1.4v-45C3 .7 3.7 0 4.5 0h39c.8 0 1.5.7 1.5 1.5v45c0 .6-.4 1.2-.9 1.4-.2.1-.4.1-.6.1zM24 26c.8 0 1.6.3 2.2.9l15.8 16V3H6v39.9l15.8-16c.6-.6 1.4-.9 2.2-.9z"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
          <span class="caption">
            <span class="caption-username"><b>${username}</b></span>
            <span class="caption-text">${caption}</span>
          </span>
          <span class="posted-time">just now</span>
        </div>
        <div class="add-comment">
          <input type="text" placeholder="Add a comment..." />
          <a class="post-btn">Post</a>
        </div>
      </div>
    `;
}

const renderPosts = () => {
  db.collection("posts")
    .orderBy("timestamp", "desc")
    .get()
    .then((querySnapshot) => {
      postFeed.innerHTML = ""; // clearing the post feed before rendering
      querySnapshot.forEach((doc) => {
        const post = doc.data();
        const postElement = document.createElement("div");
        postElement.classList.add("post");

        postElement.innerHTML = generatePostHTML({
          imageUrl: post.imageUrl,
          caption: post.caption || "",
          username: post.username || "anonymous",
          postId: doc.id,
          userId: post.userId,
        });

        postFeed.appendChild(postElement);
        console.log("Post data:", post);
      });
    })
    .catch((error) => {
      console.error("Error getting posts:", error);
    });
};

modalButton.addEventListener("click", () => {
  modal.style.display = "block";
});
closeButton.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

function openModal(postId, userId) {
  selectedPostId = postId;
  const currentUser = firebase.auth().currentUser;

  modalActions.innerHTML= "";

  if (currentUser && currentUser.uid === userId) {
  const deleteBtn = document.createElement("span");
  deleteBtn.innerText = "Delete";
  deleteBtn.classList.add("red-text");
  deleteBtn.onclick = () => handleDelete(postId);

  const editBtn = document.createElement("span");
   editBtn.innerText = "Edit";
   editBtn.classList.add("red-text");
    editBtn.onclick = () => {
      db.collection("posts")
        .doc(postId)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const post = doc.data();
            openEditPost(postId, post.imageUrl, post.caption || "");
          } else {
            console.error("No such post found");
            alert("Post not found.");
          }
        })
        .catch((error) => {
          console.error("Error fetching post data:", error);
          alert("Failed to load post data.");
        });
    };

    modalActions.appendChild(deleteBtn);
    modalActions.appendChild(editBtn);
  }

  document.querySelector(".modal").style.display = "block";
}

function handleDelete(postId) {
  if (!postId) return;

  const confirmDelete = confirm("Are you sure you want to delete this post?");
  if (!confirmDelete) return;

  db.collection("posts")
    .doc(postId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        throw new Error("Post not found");
      }

      const post = doc.data();
      const imageUrl = post.imageUrl;

      // delete the Firestore document
      return db
        .collection("posts")
        .doc(postId)
        .delete()
        .then(() => {
          console.log("Post deleted successfully");
          renderPosts(); // Refresh the feed
          document.querySelector(".modal").style.display = "none";

          // then deleting the image from storage
          if (imageUrl) {
            const imageRef = storage.refFromURL(imageUrl);
            return imageRef.delete().then(() => {
              console.log("Image deleted from storage");
            });
          }
        });
    })
    .catch((error) => {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    });
}

function openEditPost(postId, imageUrl, caption) {
  createPostHandler()
  // Pre-filling the form with existing data
  editingPostId = postId;
  editingImageUrl = imageUrl;
 captionInput.value = caption;
  
  // showing the existing image that needs an update
  const previewEl = document.getElementById("preview-image");
  if (previewEl) {
    previewEl.src = imageUrl;
    previewEl.style.display = "block";
  }
}

function updatePost(postId, imageUrl, caption) {
  db.collection("posts")
    .doc(postId)
    .update({
      imageUrl,
      caption,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      alert("Post updated successfully.");
      editingPostId = null;
      editingImageUrl = "";
      captionInput.value = "";
      files = [];
      renderPosts();
    })
    .catch((error) => {
      console.error("Error updating post:", error);
      alert("Failed to update post.");
    });
}
