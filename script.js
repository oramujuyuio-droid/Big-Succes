// ===============================
// LIKE COUNTER
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // كل أزرار اللايك الموجودة في الصفحة
    const likeButtons = document.querySelectorAll(".like-btn");

    likeButtons.forEach((btn) => {
        // إنشاء سبان تعرض عدد اللايكات بجانب زر اللايك
        const counterSpan = document.createElement("span");
        counterSpan.className = "like-count";
        counterSpan.textContent = "0";
        counterSpan.style.marginLeft = "4px";

        // نضيف العداد داخل زر اللايك
        btn.appendChild(counterSpan);

        // متغير يحتفظ بعدد اللايكات لهذا البوست فقط
        let count = 0;

        btn.addEventListener("click", () => {
            const isActive = btn.classList.toggle("active");

            if (isActive) {
                count++;
            } else {
                count = Math.max(0, count - 1);
            }

            counterSpan.textContent = count.toString();
        });
    });

    // ===============================
    // PROFILE PAGE – DATA & EDIT
    // ===============================
    const editableFields = document.querySelectorAll("[data-editable]");
    const editBtn = document.getElementById("editProfileBtn");
    const profilePage = document.querySelector(".profile-page");
    const onboardingModal = document.getElementById("onboardingModal");
    const onboardingForm = document.getElementById("onboardingForm");
    const STORAGE_KEY = "facelook_profile_data";

    const nameEl = document.getElementById("profileName");
    const usernameEl = document.getElementById("profileUsername");
    const bioEl = document.getElementById("profileBio");
    const ageEl = document.getElementById("profileAge");
    const locationEl = document.getElementById("profileLocation");
    const jobEl = document.getElementById("profileJob");
    const postsCountEl = document.getElementById("profilePostsCount");
    const friendsCountEl = document.getElementById("profileFriendsCount");
    const photosCountEl = document.getElementById("profilePhotosCount");

    function applyProfileData(data) {
        if (!data) return;
        if (nameEl) nameEl.textContent = data.name || "اسم المستخدم";
        if (usernameEl) usernameEl.textContent = data.username ? `@${data.username.replace(/^@/, "")}` : "@username";
        if (bioEl) bioEl.textContent = data.bio || bioEl.textContent;
        if (ageEl) ageEl.innerHTML = `<strong>العمر:</strong> ${data.age || "—"}`;
        if (locationEl) locationEl.innerHTML = `<strong>الموقع:</strong> ${data.location || "—"}`;
        if (jobEl) jobEl.innerHTML = `<strong>العمل / الدراسة:</strong> ${data.job || "—"}`;
        if (postsCountEl) postsCountEl.textContent = data.posts != null ? data.posts : "0";
        if (friendsCountEl) friendsCountEl.textContent = data.friends != null ? data.friends : "0";
        if (photosCountEl) photosCountEl.textContent = data.photos != null ? data.photos : "0";
    }

    function loadProfileData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function saveProfileData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            // ignore
        }
    }

    function collectProfileFromDom() {
        return {
            name: nameEl ? nameEl.textContent.trim() : "",
            username: usernameEl ? usernameEl.textContent.replace("@", "").trim() : "",
            bio: bioEl ? bioEl.textContent.trim() : "",
            age: ageEl ? ageEl.textContent.replace("العمر:", "").trim() : "",
            location: locationEl ? locationEl.textContent.replace("الموقع:", "").trim() : "",
            job: jobEl ? jobEl.textContent.replace("العمل / الدراسة:", "").trim() : "",
            posts: postsCountEl ? parseInt(postsCountEl.textContent.trim(), 10) || 0 : 0,
            friends: friendsCountEl ? parseInt(friendsCountEl.textContent.trim(), 10) || 0 : 0,
            photos: photosCountEl ? parseInt(photosCountEl.textContent.trim(), 10) || 0 : 0,
        };
    }

    // فقط لو نحن في صفحة البروفايل
    if (profilePage) {
        // أولاً نحاول تحميل بيانات سابقة إن وُجدت
        const existing = loadProfileData();
        if (existing) {
            applyProfileData(existing);
        } else if (onboardingModal) {
            // أول مرة: نفتح مودال الأسئلة
            onboardingModal.classList.add("show");
        }

        // استقبال إجابات المستخدم في أول مرة
        if (onboardingForm) {
            onboardingForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const data = {
                    name: document.getElementById("onbName").value.trim(),
                    username: document.getElementById("onbUsername").value.trim(),
                    age: document.getElementById("onbAge").value.trim(),
                    location: document.getElementById("onbLocation").value.trim(),
                    job: document.getElementById("onbJob").value.trim(),
                    friends: parseInt(document.getElementById("onbFriends").value.trim(), 10) || 0,
                    posts: parseInt(document.getElementById("onbPosts").value.trim(), 10) || 0,
                    photos: parseInt(document.getElementById("onbPhotos").value.trim(), 10) || 0,
                    bio: document.getElementById("onbBio").value.trim(),
                };

                applyProfileData(data);
                saveProfileData(data);

                if (onboardingModal) {
                    onboardingModal.classList.remove("show");
                }
            });
        }
    }

    // التعامل مع وضع التعديل (Edit profile)
    if (editableFields.length && editBtn) {
        let isEditing = false;

        const setEditing = (value) => {
            // لو نخرج من وضع التعديل، نحفظ آخر نسخة
            if (isEditing && !value && profilePage) {
                const updated = collectProfileFromDom();
                saveProfileData(updated);
            }

            isEditing = value;
            editableFields.forEach((el) => {
                el.contentEditable = value ? "true" : "false";
                el.classList.toggle("is-editing", value);
            });
            editBtn.textContent = value ? "Save profile" : "Edit profile";
        };

        // بدايةً يكون معطّل (عرض فقط)
        setEditing(false);

        editBtn.addEventListener("click", () => {
            setEditing(!isEditing);
        });

        // تبديل التابات في صفحة البروفايل
        const tabButtons = document.querySelectorAll(".tab-btn");
        const tabContents = document.querySelectorAll(".tab-content");

        tabButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-tab");
                if (!targetId) return;

                tabButtons.forEach((b) => b.classList.remove("active"));
                tabContents.forEach((c) => c.classList.remove("active"));

                btn.classList.add("active");
                const target = document.getElementById(targetId);
                if (target) target.classList.add("active");
            });
        });
    }
});
