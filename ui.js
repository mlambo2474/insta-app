// ui.js

import {
    isAuthenticated,
    uploadFile,
    addPostToFirestore,
    getPostsFromFirestore,
    deletePostFromFirestore,
    updatePostInFirestore
  } from './firebaseCore.js';
  
  // DOM elements
  const sendButton = document.getElementById("send-button");
  const filesEl = document.getElementById("file-input");
  const captionInput = document.getElementById("caption-input");
  const usernameInput = document.getElementById("username-input");
  const progressEl = document.getElementById("progress-bar");
  const postFeed = document.getElementById("post-feed");
  const modal = document.querySelector(".modal");
  const closeButton = document.getElementById("close-modal");
  const modalButton = document.getElementById("modal-button");
  
  let files = [];
  let editingPostId = null;
  let editingImageUrl = null;
  
  // Handle file input change
  filesEl.addEventListener("change", (e) => {
    files = e.target.files;
  });
  
  // Handle send button click (create or edit post)
  sendButton.addEventListener("click", () => {
    const user = isAuthenticated();
    if (!user) return alert("Please log in first.");
  
    const username = usernameInput.value.trim();
    const caption = captionInput.value.trim();
  
    if (editingPostId) {
      // --- Edit Mode ---
      if (files.length > 0) {
        const file = files[0];
        uploadFile(file, user.uid).then((snapshot) => {
          snapshot.ref.getDownloadURL().then((downloadURL) => {
            updatePostInFirestore(editingPostId, downloadURL, caption);
            resetForm();
            renderPosts();
          });
        }).catch((error) => {
          console.error("Upload failed:", error);
          alert("Upload failed.");
        });
      } else {
        // Only update caption
        updatePostInFirestore(editingPostId, editingImageUrl, caption);
        resetForm();
        renderPosts();
      }
    } else {
      // --- Normal Upload ---
      if (files.length === 0) return alert("No file chosen");
  
      const file = files[0];
      uploadFile(file, user.uid).then((snapshot) => {
        snapshot.ref.getDownloadURL().then((downloadURL) => {
          addPostToFirestore(user.uid, username, downloadURL, caption)
            .then(() => {
              renderPosts();
              resetForm();
            });
        });
      }).catch((error) => {
        console.error("Upload failed:", error);
        alert("Upload failed.");
      });
    }
  });
  
  // Reset form after upload or edit
  function resetForm() {
    captionInput.value = "";
    usernameInput.value = "";
    filesEl.value = "";
    progressEl.value = 0;
    files = [];
    editingPostId = null;
    editingImageUrl = null;
  }
  
  // Render posts from Firestore
  function renderPosts() {
    getPostsFromFirestore().then((querySnapshot) => {
      postFeed.innerHTML = ""; // clear before rendering
      querySnapshot.forEach((doc) => {
        const post = doc.data();
        const postElement = generatePostHTML({
          imageUrl: post.imageUrl,
          caption: post.caption || "",
          username: post.username || "anonymous",
          postId: doc.id,
          userId: post.userId,
        });
        postFeed.appendChild(postElement);
      });
    }).catch((error) => {
      console.error("Error getting posts:", error);
    });
  }
  
  // Generate post HTML
  function generatePostHTML({ imageUrl, caption, username, postId, userId }) {
    const postElement = document.createElement("div");
    postElement.classList.add("post");
    postElement.innerHTML = `
      <div class="post-header">
        <span class="username">${username}</span>
        <button onclick="openModal('${postId}', '${userId}')">Options</button>
      </div>
      <img src="${imageUrl}" alt="Post image" />
      <div class="caption">${caption}</div>
    `;
    return postElement;
  }
  
  // Open the modal with post options
  function openModal(postId, userId) {
    const currentUser = isAuthenticated();
    if (currentUser && currentUser.uid === userId) {
      document.getElementById("modal-action-1").innerText = "Delete";
      document.getElementById("modal-action-2").innerText = "Edit";
      document.getElementById("modal-action-1").onclick = () => handleDelete(postId);
      document.getElementById("modal-action-2").onclick = () => openEditPost(postId);
    } else {
      document.getElementById("modal-action-1").innerText = "Report";
      document.getElementById("modal-action-2").innerText = "Unfollow";
    }
    modal.style.display = "block";
  }
  
  // Handle post deletion
  function handleDelete(postId) {
    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (confirmDelete) {
      deletePostFromFirestore(postId).then(() => {
        renderPosts();
        modal.style.display = "none";
      }).catch((error) => {
        console.error("Error deleting post:", error);
        alert("Failed to delete post.");
      });
    }
  }
  
  // Open edit form for post
  function openEditPost(postId) {
    // Load post data, pre-fill form, and set `editingPostId`
    const post = getPostData(postId); // Assuming this is a function that gets post data.
    captionInput.value = post.caption || "";
    editingPostId = postId;
    editingImageUrl = post.imageUrl;
    // Show the form and hide other UI
  }
  
  // Close the modal when clicked outside or on the close button
  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
  });
  
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
  