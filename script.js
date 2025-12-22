document.addEventListener("DOMContentLoaded", () => {

  /* =======================
     STORAGE
  ======================== */
  const STORAGE_KEY = "posts";

  const feedsContainer = document.querySelector(".feeds");
  const form = document.getElementById("createPostForm");
  const postText = document.getElementById("postText");
  const postImage = document.getElementById("postImage");

  /* =======================
     HELPERS
  ======================== */
  const getProfile = () => ({
    name: "Beg Joker",
    img: "profile-1.jpeg"
  });

  const getPosts = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const savePosts = posts =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

  /* =======================
     CREATE POST
  ======================== */
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!postText.value.trim()) return;

    const posts = getPosts();

    const newPost = {
      id: Date.now(),
      text: postText.value.trim(),
      image: "",
      likes: 0,
      liked: false,
      comments: [],
      createdAt: Date.now()
    };

    const file = postImage.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        newPost.image = reader.result;
        posts.unshift(newPost);
        savePosts(posts);
        resetForm();
        renderPosts();
      };
      reader.readAsDataURL(file);
    } else {
      posts.unshift(newPost);
      savePosts(posts);
      resetForm();
      renderPosts();
    }
  });

  function resetForm() {
    postText.value = "";
    postImage.value = "";
  }

  /* =======================
     RENDER POSTS
  ======================== */
  function renderPosts() {
    const posts = getPosts();
    feedsContainer.innerHTML = "";
    posts.forEach(post => {
      feedsContainer.innerHTML += createPostHTML(post);
    });
    bindEvents();
  }

  function createPostHTML(post) {
    const profile = getProfile();
    return `
      <div class="feed" data-id="${post.id}">
        <div class="head">
          <div class="profile-post">
            <img src="${profile.img}">
          </div>
          <div class="info">
            <h3>${profile.name}</h3>
            <small>${new Date(post.createdAt).toLocaleString()}</small>
          </div>
        </div>

        ${post.image ? `<div class="photo"><img src="${post.image}"></div>` : ""}

        <div class="caption">
          <p><b>${profile.name}</b> ${post.text}</p>
        </div>

        <div class="interaction-buttons">
          <span class="like-btn ${post.liked ? "active" : ""}">
            ❤️ Like <span class="like-count">${post.likes}</span>
          </span>
          <span>💬 ${post.comments.length} Comments</span>
        </div>

        <div class="comments-list">
          ${post.comments
            .map(c => `<div class="comment">${c}</div>`)
            .join("")}
        </div>

        <div class="comment-box">
          <input type="text" placeholder="Write a comment...">
          <button>Send</button>
        </div>
      </div>
    `;
  }

  /* =======================
     EVENTS (LIKE / COMMENT)
  ======================== */
  function bindEvents() {
    document.querySelectorAll(".feed").forEach(feed => {
      const id = +feed.dataset.id;
      const posts = getPosts();
      const post = posts.find(p => p.id === id);

      // ❤️ LIKE
      feed.querySelector(".like-btn").onclick = () => {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        post.likes = Math.max(0, post.likes);
        savePosts(posts);
        renderPosts();
      };

      // 💬 COMMENT
      const input = feed.querySelector(".comment-box input");
      const btn = feed.querySelector(".comment-box button");

      btn.onclick = () => {
        if (!input.value.trim()) return;
        post.comments.push(input.value.trim());
        savePosts(posts);
        renderPosts();
      };
    });
  }

  /* =======================
     INIT
  ======================== */
  renderPosts();
});

document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("theme-btn");

  // تحميل الحالة المحفوظة
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.innerHTML = '<i class="fa fa-sun"></i>';
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    themeBtn.innerHTML = isDark
      ? '<i class="fa fa-sun"></i>'
      : '<i class="fa fa-moon"></i>';
  });
});

window.addEventListener("storage", () => {
  renderPosts();
  updateSavedCounter();
});

/***********************
  GLOBAL VARIABLES
************************/
const storiesWrapper = document.getElementById("stories-wrapper");
const viewStoryModal = document.getElementById("viewStoryModal");
const storyDisplay = document.getElementById("storyDisplay");
const progressBar = document.getElementById("progressBar");

const currentUser = {
    id: 1,
    name: "Omar Rami",
    avatar: "profile-1.jpeg"
};

let stories = JSON.parse(localStorage.getItem("stories")) || [];
let notifications = JSON.parse(localStorage.getItem("notifications")) || [];

let currentStoryIndex = 0;
let progressTimer;
let isHolding = false;
let storyDuration = 5000;
let isMuted = JSON.parse(localStorage.getItem("storyMuted")) ?? true;

let startX = 0;

/***********************
  SAVE / LOAD
************************/
function saveStories() {
    localStorage.setItem("stories", JSON.stringify(stories));
}

function saveNotifications() {
    localStorage.setItem("notifications", JSON.stringify(notifications));
}

/***********************
  CLEAN EXPIRED STORIES
************************/
function cleanExpiredStories() {
    const now = Date.now();
    stories = stories.filter(s => now - s.time < 24 * 60 * 60 * 1000);
    saveStories();
}

/***********************
  RENDER STORIES
************************/
function renderStories() {
    document.querySelectorAll(".story.user").forEach(s => s.remove());

    const grouped = {};
    stories.forEach(s => {
        if (!grouped[s.userId]) grouped[s.userId] = s;
    });

    Object.values(grouped).forEach(story => {
        const div = document.createElement("div");
        div.className = "story user";
        div.innerHTML = `
            <img src="${story.src}">
            <div class="story-profile">
                <img src="${story.userAvatar}">
            </div>
            <p>${story.userName}</p>
        `;
        div.onclick = () => {
            const userStories = stories.filter(s => s.userId === story.userId);
            stories = userStories;
            currentStoryIndex = 0;
            openStory(0);
        };
        storiesWrapper.insertBefore(div, storiesWrapper.firstChild);
    });
}

/***********************
  OPEN STORY
************************/
function openStory(index) {
    currentStoryIndex = index;
    const story = stories[index];

    markAsSeen(index);
    clearInterval(progressTimer);

    storyDisplay.innerHTML = `
        <div class="story-swipe" id="storySwipe">
            ${story.type === "image"
                ? `<img src="${story.src}">`
                : `<video src="${story.src}" autoplay muted></video>`
            }
            ${story.text ? `<p>${story.text}</p>` : ""}
        </div>

        <div class="story-like">
            <i id="likeStory" class="fa fa-heart"></i>
            <span>${story.likes.length}</span>
        </div>

        <div class="story-actions">
            <input id="replyInput" placeholder="Reply to story..." />
            <button id="sendReply">Send</button>
        </div>

        <div class="story-sound" id="soundToggle">
            <i class="fa-solid fa-volume-xmark"></i>
        </div>
    `;

    viewStoryModal.style.display = "block";
    document.body.style.overflow = "hidden";

    handleLike(story);
    handleReply(story);
    handleSound();

    startProgress();
}

/***********************
  PROGRESS
************************/
function startProgress() {
    let startTime = Date.now();
    progressBar.style.width = "0%";

    progressTimer = setInterval(() => {
        if (isHolding) return;

        let elapsed = Date.now() - startTime;
        let percent = (elapsed / storyDuration) * 100;
        progressBar.style.width = percent + "%";

        if (elapsed >= storyDuration) {
            clearInterval(progressTimer);
            if (currentStoryIndex < stories.length - 1) {
                openStory(currentStoryIndex + 1);
            } else {
                closeStory();
            }
        }
    }, 50);
}

/***********************
  SEEN
************************/
function markAsSeen(index) {
    const story = stories[index];
    if (!story.views.includes(currentUser.id)) {
        story.views.push(currentUser.id);
        saveStories();
    }
}

/***********************
  LIKE
************************/
function handleLike(story) {
    const icon = document.getElementById("likeStory");
    icon.classList.toggle("liked", story.likes.includes(currentUser.id));

    icon.onclick = () => {
        const i = story.likes.indexOf(currentUser.id);
        if (i === -1) story.likes.push(currentUser.id);
        else story.likes.splice(i, 1);

        saveStories();
        openStory(currentStoryIndex);
    };
}

/***********************
  REPLY + NOTIFICATION
************************/
function handleReply(story) {
    document.getElementById("sendReply").onclick = () => {
        const input = document.getElementById("replyInput");
        if (!input.value.trim()) return;

        story.replies.push({
            from: currentUser.name,
            text: input.value,
            time: Date.now()
        });

        if (story.userId !== currentUser.id) {
            notifications.unshift({
                from: currentUser.name,
                text: "replied to your story",
                seen: false
            });
            saveNotifications();
        }

        saveStories();
        input.value = "";
        alert("Reply sent ✅");
    };
}

/***********************
  SOUND CONTROL
************************/
function handleSound() {
    const video = storyDisplay.querySelector("video");
    const btn = document.getElementById("soundToggle");
    if (!video) {
        btn.style.display = "none";
        return;
    }

    video.muted = isMuted;
    btn.onclick = () => {
        isMuted = !isMuted;
        video.muted = isMuted;
        localStorage.setItem("storyMuted", JSON.stringify(isMuted));
        btn.querySelector("i").className =
            isMuted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
    };
}

/***********************
  CLOSE STORY
************************/
function closeStory() {
    viewStoryModal.style.display = "none";
    document.body.style.overflow = "auto";
}

/***********************
  GESTURES
************************/
viewStoryModal.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    isHolding = true;
});

viewStoryModal.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    isHolding = false;

    if (Math.abs(diff) > 80) {
        if (diff < 0 && currentStoryIndex < stories.length - 1)
            openStory(currentStoryIndex + 1);
        if (diff > 0 && currentStoryIndex > 0)
            openStory(currentStoryIndex - 1);
    }
});

viewStoryModal.addEventListener("click", e => {
    const x = e.clientX;
    if (x > window.innerWidth / 2 && currentStoryIndex < stories.length - 1)
        openStory(currentStoryIndex + 1);
    else if (currentStoryIndex > 0)
        openStory(currentStoryIndex - 1);
});

/***********************
  INIT
************************/
cleanExpiredStories();
renderStories();
///////////////////////////////
const createPostForm = document.getElementById('createPostForm');
const feeds = document.getElementById('feeds');

createPostForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const postText = document.getElementById('postText').value;
    const postImage = document.getElementById('postImage').files[0];
    const postVideo = document.getElementById('postVideo').files[0];

    if (!postText && !postImage && !postVideo) {
        alert('Please add text, image, or video.');
        return;
    }

    const postDiv = document.createElement('div');
    postDiv.classList.add('feed');

    // هانعمل div لكل نوع وسنعرضهم جنب بعض لو اتنين موجودين
    const mediaContainer = document.createElement('div');
    mediaContainer.classList.add('media-container');
    mediaContainer.style.display = "flex";
    mediaContainer.style.gap = "10px";
    mediaContainer.style.flexWrap = "wrap";

    // الصورة
    if(postImage) {
        const imgDiv = document.createElement('div');
        imgDiv.classList.add('photo');
        imgDiv.style.flex = "1 1 300px";

        const img = document.createElement('img');
        img.src = URL.createObjectURL(postImage);
        img.style.width = "100%";
        img.style.maxHeight = "400px";
        img.style.objectFit = "cover";
        imgDiv.appendChild(img);

        mediaContainer.appendChild(imgDiv);
    }

    // الفيديو
    if(postVideo) {
        const videoDiv = document.createElement('div');
        videoDiv.classList.add('video');
        videoDiv.style.flex = "1 1 300px";

        const video = document.createElement('video');
        video.src = URL.createObjectURL(postVideo);
        video.controls = true;
        video.style.width = "100%";
        video.style.maxHeight = "400px";
        video.style.objectFit = "cover";

        videoDiv.appendChild(video);
        mediaContainer.appendChild(videoDiv);
    }

    postDiv.innerHTML = `
        <div class="head">
            <div class="user">
                <div class="profile-post">
                    <img src="profile-1.jpeg" alt="">
                </div>
                <div class="info">
                    <h3>You</h3>
                    <small class="text-gry">Just now</small>
                </div>
            </div>
        </div>
        <div class="caption"><p>${postText}</p></div>
    `;

    postDiv.insertBefore(mediaContainer, postDiv.querySelector(".caption"));

    feeds.prepend(postDiv);
    createPostForm.reset();
});

