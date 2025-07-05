// --- Unified Add Member Modal Logic (Dashboard Quick Action & Member Tab) ---
document.addEventListener('DOMContentLoaded', function() {
  const addMemberBtn = document.getElementById('addMemberBtn'); // Dashboard quick action
  const addMemberBtnTab = document.getElementById('addMemberBtnTab'); // Member tab button
  const addMemberModal = document.getElementById('addMemberModal');
  const closeAddMemberModal = document.getElementById('closeAddMemberModal');
  const addMemberForm = document.getElementById('addMemberForm');
  const addMemberSuccessMsg = document.getElementById('addMemberSuccessMsg');
  const memberProfileImageInput = document.getElementById('memberProfileImage');
  const memberImageTag = document.getElementById('memberImageTag');

  // Helper to open modal
  function openAddMemberModal() {
    if (addMemberModal) {
      addMemberModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (addMemberSuccessMsg) addMemberSuccessMsg.style.display = 'none';
      if (addMemberForm) addMemberForm.reset();
      if (memberImageTag) memberImageTag.src = 'https://via.placeholder.com/96?text=Photo';
    }
  }
  // Helper to close modal
  function closeAddMemberModalFunc() {
    if (addMemberModal) addMemberModal.style.display = 'none';
    document.body.style.overflow = '';
    if (addMemberSuccessMsg) addMemberSuccessMsg.style.display = 'none';
    if (addMemberForm) addMemberForm.reset();
    if (memberImageTag) memberImageTag.src = 'https://via.placeholder.com/96?text=Photo';
  }

  // Open modal from dashboard quick action
  if (addMemberBtn && addMemberModal) {
    addMemberBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openAddMemberModal();
    });
  }
  // Open modal from member tab button
  if (addMemberBtnTab && addMemberModal) {
    addMemberBtnTab.addEventListener('click', function(e) {
      e.preventDefault();
      openAddMemberModal();
    });
  }
  // Close modal on close button
  if (closeAddMemberModal && addMemberModal) {
    closeAddMemberModal.addEventListener('click', closeAddMemberModalFunc);
  }
  // Close modal if clicking outside modal-content
  if (addMemberModal) {
    addMemberModal.addEventListener('mousedown', function(e) {
      if (e.target === addMemberModal) closeAddMemberModalFunc();
    });
  }

  // Image upload logic
  const uploadMemberImageBtn = document.getElementById('uploadMemberImageBtn');
  if (uploadMemberImageBtn && memberProfileImageInput) {
    uploadMemberImageBtn.addEventListener('click', function() {
      memberProfileImageInput.click();
    });
  }
  if (memberProfileImageInput && memberImageTag) {
    memberProfileImageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          memberImageTag.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        memberImageTag.src = 'https://via.placeholder.com/96?text=Photo';
      }
    });
  }

  // Handle form submit (with image, membership ID, and email notification)
  if (addMemberForm) {
    addMemberForm.onsubmit = async function(e) {
      e.preventDefault();
      const token = localStorage.getItem('gymAdminToken');
      if (!token) {
        alert('You must be logged in as a gym admin.');
        return;
      }
      // Gather form data
      const formData = new FormData(addMemberForm); // includes file
      // Generate membership ID and valid date
      const gymName = (window.currentGymProfile && (window.currentGymProfile.gymName || window.currentGymProfile.name)) ? (window.currentGymProfile.gymName || window.currentGymProfile.name) : 'GYM';
      const plan = formData.get('planSelected') || 'PLAN';
      const monthlyPlan = formData.get('monthlyPlan') || '';
      const memberEmail = formData.get('memberEmail') || '';
      const memberName = formData.get('memberName') || '';
      // Membership ID: GYMNAME-YYYYMM-PLAN-UNIQUE
      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
      const random = Math.floor(1000 + Math.random() * 9000);
      const gymShort = gymName.replace(/[^A-Za-z0-9]/g, '').substring(0,6).toUpperCase();
      const planShort = plan.replace(/[^A-Za-z0-9]/g, '').substring(0,6).toUpperCase();
      const membershipId = `${gymShort}-${ym}-${planShort}-${random}`;
      formData.append('membershipId', membershipId);
      // Calculate valid date (add months)
      let validDate = '';
      let months = 1;
      if (/1\s*Month/i.test(monthlyPlan)) months = 1;
      else if (/3\s*Month/i.test(monthlyPlan)) months = 3;
      else if (/6\s*Month/i.test(monthlyPlan)) months = 6;
      else if (/12\s*Month/i.test(monthlyPlan)) months = 12;
      const validUntil = new Date(now);
      validUntil.setMonth(validUntil.getMonth() + months);
      validDate = validUntil.toISOString().split('T')[0];
      formData.append('membershipValidUntil', validDate);
      try {
        // 1. Add member to backend
        const res = await fetch('http://localhost:5000/api/members', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          // 2. Send membership email (do not block UI if email fails)
          fetch('http://localhost:5000/api/members/send-membership-email', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: memberEmail,
              memberName,
              membershipId,
              plan,
              monthlyPlan,
              validUntil: validDate,
              gymName
            })
          }).catch((err) => {
            console.error('Failed to send membership email:', err);
          });
          if (addMemberSuccessMsg) {
            addMemberSuccessMsg.textContent = `Member added! Membership ID: ${membershipId}`;
            addMemberSuccessMsg.style.display = 'block';
          }
          addMemberForm.reset();
          if (memberImageTag) memberImageTag.src = 'https://via.placeholder.com/96?text=Photo';
          setTimeout(() => {
            closeAddMemberModalFunc();
          }, 1500);
        } else {
          if (addMemberSuccessMsg) {
            addMemberSuccessMsg.textContent = data.message || 'Failed to add member.';
            addMemberSuccessMsg.style.display = 'block';
          }
        }
      } catch (err) {
        if (addMemberSuccessMsg) {
          addMemberSuccessMsg.textContent = 'Server error. Please try again.';
          addMemberSuccessMsg.style.display = 'block';
        }
      }
    };
  }
});
let currentGymProfile = {}; // Store fetched profile data

        async function fetchAndUpdateAdminProfile() {
    // Debug: Log all localStorage items
    console.log('All localStorage items:', Object.keys(localStorage).map(key => {
        return { key, value: localStorage.getItem(key) };
    }));

    // Wait for token to appear (retry up to 1 second)
    let token = localStorage.getItem('gymAdminToken');
    let tries = 0;
    while (!token && tries < 10) {
        await new Promise(res => setTimeout(res, 100));
        token = localStorage.getItem('gymAdminToken');
        tries++;
    }
     const adminNameElement = document.getElementById('adminName');
    const adminAvatarElement = document.getElementById('adminAvatar');

            console.group('Admin Profile Fetch');
            console.log('Fetching admin profile');
            console.log('Token retrieval:', {
                gymAuthToken: !!localStorage.getItem('gymAuthToken'),
                token: !!localStorage.getItem('token'),
                authToken: !!localStorage.getItem('authToken')
            });

            // Set default placeholders
            if (adminNameElement) adminNameElement.textContent = 'Gym Admin';
            if (adminAvatarElement) adminAvatarElement.src = 'https://via.placeholder.com/40';

            if (!token) {
        console.error("No authentication token found after retry. Redirecting to login.");
        console.groupEnd();
        window.location.replace('http://localhost:5000/public/admin-login.html');
        return;
    }

            try {
                console.log('Sending profile request to:', 'http://localhost:5000/api/gym/profile/me');
                const response = await fetch('http://localhost:5000/api/gyms/profile/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Profile fetch response status:', response.status);

                const responseData = await response.json();
                console.log('Profile fetch response data:', responseData);

                if (!response.ok) {
                    console.error(`Error fetching profile: ${response.status} ${response.statusText}`);
                    console.error('Detailed server response:', responseData);
                    
                    // Clear token and redirect if unauthorized
                    if (response.status === 401 || response.status === 403) {
                        console.error('Unauthorized access. Clearing tokens.');
                       localStorage.removeItem('gymAdminToken');
                        console.groupEnd();
                       window.location.replace('http://localhost:5000/public/admin-login.html');
                    } else {
                        throw new Error(responseData.message || 'Failed to fetch profile');
                    }
                    return;
                }

                currentGymProfile = responseData;

                // Update profile name and logo
                if (adminNameElement) {
                    adminNameElement.textContent = responseData.gymName || responseData.name || 'Gym Admin';
                    console.log('Updated admin name:', adminNameElement.textContent);
                }
                if (adminAvatarElement) {
                    if (responseData.logoUrl) {
                        let logoPath = responseData.logoUrl;
                        // Ensure full URL for local images
                        if (!logoPath.startsWith('http')) {
                            logoPath = `http://localhost:5000${logoPath.startsWith('/') ? logoPath : '/' + logoPath}`;
                        }
                        adminAvatarElement.src = logoPath;
                        console.log('Updated admin logo:', logoPath);
                    } else {
                        adminAvatarElement.src = 'https://via.placeholder.com/40';
                        console.log('Using default avatar');
                    }
                }

                console.groupEnd();
            } catch (error) {
                console.error('Comprehensive error fetching or updating admin profile:', error);
                
                // Always provide a fallback
                if (adminNameElement) adminNameElement.textContent = 'Admin';
                if (adminAvatarElement) adminAvatarElement.src = 'https://via.placeholder.com/40';
                
                // Clear all potential token keys
               localStorage.removeItem('gymAdminToken');

                console.groupEnd();
                
                // Optional: Show user-friendly error message
                alert('Unable to fetch profile. Please try logging in again.');
                window.location.replace('http://localhost:5000/public/admin-login.html');
            }
        }

        document.addEventListener('DOMContentLoaded', function () {
            const deletePhotoConfirmModal = document.getElementById('deletePhotoConfirmModal');
            const closeDeletePhotoConfirmModal = document.getElementById('closeDeletePhotoConfirmModal');
            const confirmDeletePhotoBtn = document.getElementById('confirmDeletePhotoBtn');
            const cancelDeletePhotoBtn = document.getElementById('cancelDeletePhotoBtn');
            let pendingDeletePhotoId = null;
            fetchAndUpdateAdminProfile();
            fetchGymPhotos();

            function fetchGymPhotos() {
                const token = localStorage.getItem('gymAdminToken');
                fetch('http://localhost:5000/api/gyms/photos', {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && Array.isArray(data.photos)) {
                            renderPhotoGrid(data.photos);
                        } else {
                            renderPhotoGrid([]);
                        }
                    })
                    .catch(() => renderPhotoGrid([]));
            }

            function renderPhotoGrid(photos) {
                const grid = document.getElementById('photoGrid');
                if (!grid) return;
                grid.innerHTML = '';
                if (!photos.length) {
                    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: #888;">No photos uploaded yet.</div>';
                    return;
                }
                photos.forEach(photo => {
                    const card = document.createElement('div');
                    card.className = 'photo-card';
                    card.style = 'background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 12px; display: flex; flex-direction: column; align-items: center;';
                    card.innerHTML = `
                        <img src="${photo.imageUrl}" alt="${photo.title || ''}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
                        <h3 style="margin: 4px 0 2px 0; font-size: 1.1em;">${photo.title || ''}</h3>
                        <p style="margin: 0 0 6px 0; color: #666; font-size: 0.95em;">${photo.description || ''}</p>
                        <div style="font-size: 0.85em; color: #aaa; margin-bottom: 6px;">${photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleString() : ''}</div>
                        <button class="edit-photo-btn" data-photo-id="${photo._id || ''}" style="margin-top: 4px; padding: 4px 10px; border: none; background: #1976d2; color: #fff; border-radius: 4px; cursor: pointer;">Edit</button>
                    `;
                    grid.appendChild(card);
                });
            }

            // Edit button handler (delegation)
            document.getElementById('photoGridSection').addEventListener('click', async function(e) {
                // Edit button logic (already present)
                if (e.target.classList.contains('edit-photo-btn')) {
                    const photoId = e.target.getAttribute('data-photo-id');
                    // Find photo data from last loaded grid
                    const photo = (window._lastPhotoGrid || []).find(p => (p._id || p.id) === photoId);
                    if (!photo) return alert('Photo not found.');
                    // Populate modal
                    document.getElementById('editPhotoId').value = photoId;
                    document.getElementById('editPhotoTitle').value = photo.title || '';
                    document.getElementById('editPhotoDescription').value = photo.description || '';
                    document.getElementById('editPhotoFile').value = '';
                    document.getElementById('editPhotoPreview').innerHTML = photo.imageUrl ? `<img src="${photo.imageUrl}" style="max-width:180px;max-height:120px;border-radius:6px;">` : '';
                    document.getElementById('editPhotoModal').style.display = 'flex';
                    return;
                }
                // Remove button logic
                if (e.target.classList.contains('remove-photo-btn')) {
                    const photoId = e.target.getAttribute('data-photo-id');
                    if (!photoId) return alert('Photo ID missing.');
                    pendingDeletePhotoId = photoId;
        // Show the confirmation modal
        deletePhotoConfirmModal.style.display = 'flex';
    }
});
            // Modal close/cancel logic
            document.getElementById('closeEditPhotoModal').onclick = document.getElementById('cancelEditPhotoBtn').onclick = function() {
                document.getElementById('editPhotoModal').style.display = 'none';
            };
            if (closeDeletePhotoConfirmModal) {
    closeDeletePhotoConfirmModal.onclick = () => {
        deletePhotoConfirmModal.style.display = 'none';
        pendingDeletePhotoId = null;
    };
}
if (cancelDeletePhotoBtn) {
    cancelDeletePhotoBtn.onclick = () => {
        deletePhotoConfirmModal.style.display = 'none';
        pendingDeletePhotoId = null;
    };
}
if (confirmDeletePhotoBtn) {
    confirmDeletePhotoBtn.onclick = async () => {
        if (!pendingDeletePhotoId) return;
        const token = localStorage.getItem('gymAdminToken');
        try {
            const res = await fetch(`http://localhost:5000/api/gyms/photos/${pendingDeletePhotoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Photo removed successfully!');
                fetchGymPhotos();
            } else {
                alert(data.message || 'Failed to remove photo');
            }
        } catch (err) {
            alert('Network error while removing photo');
        }
        deletePhotoConfirmModal.style.display = 'none';
        pendingDeletePhotoId = null;
    };
}
            // Preview new image
            document.getElementById('editPhotoFile').addEventListener('change', function(e) {
                const file = e.target.files[0];
                const preview = document.getElementById('editPhotoPreview');
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        preview.innerHTML = `<img src="${evt.target.result}" style="max-width:180px;max-height:120px;border-radius:6px;">`;
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.innerHTML = '';
                }
            });

            // Store last loaded grid for easy lookup
            function renderPhotoGrid(photos) {
                window._lastPhotoGrid = photos;
                const grid = document.getElementById('photoGrid');
                if (!grid) return;
                grid.innerHTML = '';
                if (!photos.length) {
                    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: #888;">No photos uploaded yet.</div>';
                    return;
                }
                photos.forEach(photo => {
                    const card = document.createElement('div');
                    card.className = 'photo-card';
                    card.style = 'background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 12px; display: flex; flex-direction: column; align-items: center;';
                   card.innerHTML = `
    <img src="${photo.imageUrl}" alt="${photo.title || ''}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
    <h3 style="margin: 4px 0 2px 0; font-size: 1.1em;">${photo.title || ''}</h3>
    <p style="margin: 0 0 6px 0; color: #666; font-size: 0.95em;">${photo.description || ''}</p>
    <div style="font-size: 0.85em; color: #aaa; margin-bottom: 6px;">${photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleString() : ''}</div>
    <div style="display: flex; gap: 8px; justify-content: center;">
        <button class="edit-photo-btn" data-photo-id="${photo._id || ''}" style="padding: 4px 10px; border: none; background: #1976d2; color: #fff; border-radius: 4px; cursor: pointer;">Edit</button>
        <button class="remove-photo-btn" data-photo-id="${photo._id || ''}" style="padding: 4px 10px; border: none; background: #e53935; color: #fff; border-radius: 4px; cursor: pointer;">Remove</button>
    </div>
`;
                    grid.appendChild(card);
                });
            }

            // Handle edit form submit
            document.getElementById('editPhotoForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const token = localStorage.getItem('gymAdminToken');
                const photoId = document.getElementById('editPhotoId').value;
                if (!photoId) {
                    alert('Photo ID missing. Cannot update.');
                    return;
                }
                const title = document.getElementById('editPhotoTitle').value;
                const description = document.getElementById('editPhotoDescription').value;
                const fileInput = document.getElementById('editPhotoFile');
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                if (fileInput.files[0]) {
                    formData.append('photo', fileInput.files[0]);
                }
                try {
                    const res = await fetch(`http://localhost:5000/api/gyms/photos/${photoId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });
                    const data = await res.json();
                    if (res.status === 404) {
                        alert('Photo not found. It may have been deleted or does not exist.');
                        document.getElementById('editPhotoModal').style.display = 'none';
                        fetchGymPhotos();
                        return;
                    }
                    if (res.ok && data.success) {
                        const msgDiv = document.getElementById('editPhotoMsg');
                        msgDiv.textContent = 'Photo updated successfully!';
                        msgDiv.style.color = 'green';
                        setTimeout(() => {
                            msgDiv.textContent = '';
                            document.getElementById('editPhotoModal').style.display = 'none';
                        }, 1500);
                        fetchGymPhotos();
                    } else {
                        const msgDiv = document.getElementById('editPhotoMsg');
                        msgDiv.textContent = data.message || 'Update failed';
                        msgDiv.style.color = 'red';
                    }
                } catch (err) {
                    const msgDiv = document.getElementById('editPhotoMsg');
                    msgDiv.textContent = 'Network error';
                    msgDiv.style.color = 'red';
                }
            });
// --- Unified Add Member Modal Logic (Dashboard & Member Tab) ---
const addMemberBtn = document.getElementById('addMemberBtn'); // Dashboard quick action
const addMemberBtnTab = document.getElementById('addMemberBtnTab'); // Member tab button
const addMemberModal = document.getElementById('addMemberModal');
const closeAddMemberModal = document.getElementById('closeAddMemberModal');
const addMemberForm = document.getElementById('addMemberForm');
const addMemberSuccessMsg = document.getElementById('addMemberSuccessMsg');
const memberProfileImageInput = document.getElementById('memberProfileImage');
const memberImageTag = document.getElementById('memberImageTag');
const uploadMemberImageBtn = document.getElementById('uploadMemberImageBtn');

// Ensure modal is hidden on load
if (addMemberModal) addMemberModal.style.display = 'none';

// Open modal from either dashboard quick action or member tab
function openAddMemberModal() {
  addMemberModal.style.display = 'flex';
  if (addMemberSuccessMsg) addMemberSuccessMsg.style.display = 'none';
  if (addMemberForm) addMemberForm.reset();
  if (memberImageTag) memberImageTag.src = 'https://via.placeholder.com/96?text=Photo';
}
if (addMemberBtn && addMemberModal) {
  addMemberBtn.addEventListener('click', openAddMemberModal);
}
if (addMemberBtnTab && addMemberModal) {
  addMemberBtnTab.addEventListener('click', function(e) {
    e.preventDefault();
    openAddMemberModal();
    document.body.style.overflow = 'hidden';
  });
}

// Close modal helper
function closeAddMemberModalFunc() {
  if (addMemberModal) addMemberModal.style.display = 'none';
  if (addMemberSuccessMsg) addMemberSuccessMsg.style.display = 'none';
  if (addMemberForm) addMemberForm.reset();
  if (memberImageTag) memberImageTag.src = 'https://via.placeholder.com/96?text=Photo';
  document.body.style.overflow = '';
}

// Close on close button
if (closeAddMemberModal && addMemberModal) {
  closeAddMemberModal.onclick = closeAddMemberModalFunc;
}

// Close on outside click (only for Add Member modal)
if (addMemberModal) {
  addMemberModal.addEventListener('mousedown', function(e) {
    if (e.target === addMemberModal) closeAddMemberModalFunc();
  });
}

// Image upload logic
if (uploadMemberImageBtn && memberProfileImageInput) {
  uploadMemberImageBtn.addEventListener('click', function() {
    memberProfileImageInput.click();
  });
}
if (memberProfileImageInput && memberImageTag) {
  memberProfileImageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        memberImageTag.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      memberImageTag.src = 'https://via.placeholder.com/96?text=Photo';
    }
  });
}

// Handle form submit (with image, membership ID, and email notification)
if (addMemberForm) {
  addMemberForm.onsubmit = async function(e) {
    e.preventDefault();
    const token = localStorage.getItem('gymAdminToken');
    if (!token) {
      alert('You must be logged in as a gym admin.');
      return;
    }
    // Gather form data
    const formData = new FormData(addMemberForm); // includes file
    // Generate membership ID and valid date
    const gymName = (currentGymProfile && (currentGymProfile.gymName || currentGymProfile.name)) ? (currentGymProfile.gymName || currentGymProfile.name) : 'GYM';
    const plan = formData.get('planSelected') || 'PLAN';
    const monthlyPlan = formData.get('monthlyPlan') || '';
    const memberEmail = formData.get('memberEmail') || '';
    const memberName = formData.get('memberName') || '';
    // Membership ID: GYMNAME-YYYYMM-PLAN-UNIQUE
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    const gymShort = gymName.replace(/[^A-Za-z0-9]/g, '').substring(0,6).toUpperCase();
    const planShort = plan.replace(/[^A-Za-z0-9]/g, '').substring(0,6).toUpperCase();
    const membershipId = `${gymShort}-${ym}-${planShort}-${random}`;
    formData.append('membershipId', membershipId);
    // Calculate valid date (add months)
    let validDate = '';
    let months = 1;
    if (/1\s*Month/i.test(monthlyPlan)) months = 1;
    else if (/3\s*Month/i.test(monthlyPlan)) months = 3;
    else if (/6\s*Month/i.test(monthlyPlan)) months = 6;
    else if (/12\s*Month/i.test(monthlyPlan)) months = 12;
    const validUntil = new Date(now);
    validUntil.setMonth(validUntil.getMonth() + months);
    validDate = validUntil.toISOString().split('T')[0];
    formData.append('membershipValidUntil', validDate);
    try {
      // 1. Add member to backend
      const res = await fetch('http://localhost:5000/api/members', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        // 2. Send membership email (do not block UI if email fails)
        fetch('http://localhost:5000/api/members/send-membership-email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: memberEmail,
            memberName,
            membershipId,
            plan,
            monthlyPlan,
            validUntil: validDate,
            gymName
          })
        }).catch((err) => {
          console.error('Failed to send membership email:', err);
        });
        if (addMemberSuccessMsg) {
          addMemberSuccessMsg.textContent = `Member added! Membership ID: ${membershipId}`;
          addMemberSuccessMsg.style.display = 'block';
        }
        addMemberForm.reset();
        if (memberImageTag) memberImageTag.src = 'https://via.placeholder.com/96?text=Photo';
        setTimeout(() => {
          closeAddMemberModalFunc();
        }, 1500);
      } else {
        if (addMemberSuccessMsg) {
          addMemberSuccessMsg.textContent = data.message || 'Failed to add member.';
          addMemberSuccessMsg.style.display = 'block';
        }
      }
    } catch (err) {
      if (addMemberSuccessMsg) {
        addMemberSuccessMsg.textContent = 'Server error. Please try again.';
        addMemberSuccessMsg.style.display = 'block';
      }
    }
  };
}
            // --- Gym Photo Upload Logic ---
            const uploadGymPhotoForm = document.getElementById('uploadGymPhotoForm');
            if (uploadGymPhotoForm) {
                uploadGymPhotoForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const formData = new FormData(uploadGymPhotoForm);
                    const token = localStorage.getItem('gymAdminToken');
                    try {
                        const res = await fetch('http://localhost:5000/api/gyms/photos', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
    const msgDiv = document.getElementById('uploadPhotoMsg');
    msgDiv.textContent = 'Photo uploaded successfully!';
    msgDiv.style.color = 'green';
    uploadGymPhotoForm.reset();
    setTimeout(() => {
        msgDiv.textContent = '';
        // Use style.display for modal closing (consistent with your other modals)
        document.getElementById('uploadPhotoModal').style.display = 'none';
    }, 1200);
    fetchGymPhotos();
}
                      else {
                            const msgDiv = document.getElementById('uploadPhotoMsg');
                            msgDiv.textContent = data.message || 'Upload failed';
                            msgDiv.style.color = 'red';
                        }
                    } catch (err) {
                        const msgDiv = document.getElementById('editPhotoMsg');
                        msgDiv.textContent = 'Network error';
                        msgDiv.style.color = 'red';
                    }
                });
            }

        });
        // Profile Dropdown Toggle Functionality
        const userProfileToggle = document.getElementById('userProfileToggle');
        const profileDropdownMenu = document.getElementById('profileDropdownMenu');
        const editProfileLink = document.getElementById('editProfileLink');
        const logoutLink = document.getElementById('logoutLink');

        if (userProfileToggle && profileDropdownMenu) {
            userProfileToggle.addEventListener('click', function(event) {
                event.stopPropagation(); // Prevent click from closing menu immediately
                profileDropdownMenu.classList.toggle('show');
            });
        }

        window.addEventListener('click', function(event) {
            if (profileDropdownMenu && profileDropdownMenu.classList.contains('show')) {
                if (!userProfileToggle.contains(event.target) && !profileDropdownMenu.contains(event.target)) {
                    profileDropdownMenu.classList.remove('show');
                }
            }
        });

        // Edit Profile Modal elements and logic
        const editProfileModal = document.getElementById('editProfileModal');
        const editProfileForm = document.getElementById('editProfileForm');
        const logoPreviewImage = document.getElementById('logoPreviewImage');

        function populateEditProfileModal() {
            if (!currentGymProfile) return;

            document.getElementById('editGymName').value = currentGymProfile.gymName || '';
            document.getElementById('editGymEmail').value = currentGymProfile.email || '';
            document.getElementById('editGymPhone').value = currentGymProfile.phone || '';
            document.getElementById('editGymAddress').value = currentGymProfile.address || '';
            document.getElementById('editGymCity').value = currentGymProfile.location?.city || '';
            document.getElementById('editGymPincode').value = currentGymProfile.location?.pincode || '';
            document.getElementById('editGymDescription').value = currentGymProfile.description || '';

            if (currentGymProfile.logoUrl) {
                let logoPath = currentGymProfile.logoUrl;
                if (!logoPath.startsWith('http')) {
                    logoPath = `http://localhost:5000${logoPath.startsWith('/') ? logoPath : '/' + logoPath}`;
                }
                logoPreviewImage.src = `${logoPath}?${new Date().getTime()}`;
                logoPreviewImage.style.display = 'block';
            } else {
                logoPreviewImage.src = '#';
                logoPreviewImage.style.display = 'none';
            }
        }

        if (editProfileLink) {
            editProfileLink.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default anchor behavior
                populateEditProfileModal(); // Populate data before showing
                editProfileModal.style.display = 'flex';
                if (profileDropdownMenu) profileDropdownMenu.classList.remove('show'); // Close dropdown
            });
        }

        if (logoutLink) {
            logoutLink.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default anchor behavior
                console.log('Logout clicked');
               localStorage.removeItem('gymAdminToken');
                window.location.href = 'http://localhost:5000/public/admin-login.html'; // Redirect to login page
            });
        }

      



        // Handle Modals general closing
        const modals = document.querySelectorAll('.modal');
        const closeButtons = document.querySelectorAll('.modal-close');

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modalToClose = button.closest('.modal');
                if (modalToClose) modalToClose.style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            modals.forEach(modal => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Specific Modals (Notification, Upload Photo, Add Equipment)
        const sendNotificationBtn = document.getElementById('sendNotificationBtn');
        const notificationModal = document.getElementById('notificationModal');
        if (sendNotificationBtn && notificationModal) {
            sendNotificationBtn.addEventListener('click', () => notificationModal.style.display = 'flex');
        }

        const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
        const uploadPhotoModal = document.getElementById('uploadPhotoModal');
        if (uploadPhotoBtn && uploadPhotoModal) {
            uploadPhotoBtn.addEventListener('click', () => uploadPhotoModal.style.display = 'flex');
        }

        const addEquipmentBtn = document.getElementById('uploadEquipmentBtn');
        const addEquipmentModal = document.getElementById('addEquipmentModal');
        if (addEquipmentBtn && addEquipmentModal) {
            addEquipmentBtn.addEventListener('click', () => addEquipmentModal.style.display = 'flex');
        }

        // File input change for logo preview in Edit Profile Modal
        const editGymLogoInput = document.getElementById('editGymLogo');
        if (editGymLogoInput && logoPreviewImage) {
            editGymLogoInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        logoPreviewImage.src = e.target.result;
                        logoPreviewImage.style.display = 'block';
                    }
                    reader.readAsDataURL(file);
                } else {
                    logoPreviewImage.src = '#';
                    logoPreviewImage.style.display = 'none';
                }
            });
        }

        // Edit Profile Form Submission
        if (editProfileForm) {
            let pendingFormData = null;
            let pendingPasswordChange = false;

            // Password confirmation modal elements
            const passwordConfirmDialog = document.getElementById('passwordConfirmDialog');
            const passwordConfirmForm = document.getElementById('passwordConfirmForm');
            const closePasswordConfirmDialog = document.getElementById('closePasswordConfirmDialog');

            // Helper to show modal
            function showPasswordConfirmDialog() {
                if (passwordConfirmDialog) passwordConfirmDialog.style.display = 'flex';
                if (document.getElementById('currentPassword')) document.getElementById('currentPassword').value = '';
            }
            // Helper to hide modal
            function hidePasswordConfirmDialog() {
                if (passwordConfirmDialog) passwordConfirmDialog.style.display = 'none';
            }
            // Handle closing modal
            if (closePasswordConfirmDialog) {
                closePasswordConfirmDialog.onclick = hidePasswordConfirmDialog;
            }

            editProfileForm.addEventListener('submit', function(event) {
                event.preventDefault();
                // Always construct FormData and append logo if present
                pendingFormData = new FormData(editProfileForm);
                const logoInput = document.getElementById('editGymLogo');
                if (logoInput && logoInput.files.length > 0) {
                    pendingFormData.set('gymLogo', logoInput.files[0]);
                }
                // Password validation if changing password
                const passwordFields = document.getElementById('passwordFields');
                const passwordInput = document.getElementById('editGymPassword');
                const passwordConfirmInput = document.getElementById('editGymPasswordConfirm');
                if (passwordFields && passwordFields.style.display !== 'none' && passwordInput.value) {
                    const password = passwordInput.value;
                    const confirmPassword = passwordConfirmInput.value;
                    if (!password || !confirmPassword) {
                        showProfileUpdateMessage('Both password fields are required to change password.', 'error');
                        return;
                    }
                    if (password !== confirmPassword) {
                        showProfileUpdateMessage('Passwords do not match.', 'error');
                        return;
                    }
                    pendingFormData.append('newPassword', password);
                }
                // Always require current password for any update
                showPasswordConfirmDialog();
            });

            // Handle password confirmation form submit
            if (passwordConfirmForm) {
                passwordConfirmForm.addEventListener('submit', async function(event) {
                    event.preventDefault();
                    const currentPassword = document.getElementById('currentPassword').value;
                    if (!currentPassword) {
                        alert('Please enter your current password.');
                        return;
                    }
                    if (!pendingFormData) {
                        alert('No pending profile update.');
                        hidePasswordConfirmDialog();
                        return;
                    }
                    pendingFormData.append('currentPassword', currentPassword);
                    await submitProfileUpdate(pendingFormData);
                    // Only clear pendingFormData and hide the dialog on success or non-password errors (handled in submitProfileUpdate)

                });
            }

            // Profile update submission function
            async function submitProfileUpdate(formData) {
                try {
                    const response = await fetch('http://localhost:5000/api/gyms/profile/me', {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('gymAdminToken')}`
                        },
                        body: formData
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showProfileUpdateMessage('Profile updated successfully!', 'success');
                        // Update logo preview in modal and avatar if new logo is present
                        if (result.gym && result.gym.logoUrl) {
                            let logoPath = result.gym.logoUrl;
                            // Always construct full URL for logo
                            if (!logoPath.startsWith('http')) {
                                logoPath = `http://localhost:5000/${logoPath.replace(/^\/+/, '')}`;
                            }
                            const cacheBustedLogo = `${logoPath}?${new Date().getTime()}`;
                            const logoPreviewImage = document.getElementById('logoPreviewImage');
                            if (logoPreviewImage) {
                                logoPreviewImage.src = cacheBustedLogo;
                                logoPreviewImage.style.display = 'block';
                            }
                            const adminAvatarElement = document.getElementById('adminAvatar');
                            if (adminAvatarElement) adminAvatarElement.src = `${logoPath}?${new Date().getTime()}`;
                            // Debug: Log the final logo URL used
                            console.log('Logo preview URL:', cacheBustedLogo);
                        }
                        if(editProfileModal) editProfileModal.style.display = 'none';
                        if(typeof hidePasswordConfirmDialog === 'function') hidePasswordConfirmDialog(); // Hide password dialog on success
                        pendingFormData = null;
                        fetchAndUpdateAdminProfile(); // Refresh the displayed profile info
                    } else {
                        // Show specific error for invalid current password
                        if (result.message && result.message.toLowerCase().includes('invalid current password')) {
                            showProfileUpdateMessage('Current password is incorrect.', 'error');
                            if (typeof hidePasswordConfirmDialog === 'function') hidePasswordConfirmDialog(); // Close only the password dialog
                            // Do NOT close the edit profile modal
                        } else {
                            showProfileUpdateMessage(`Error updating profile: ${result.message || 'Unknown error'}`, 'error');
                            if(editProfileModal) editProfileModal.style.display = 'none'; // Close modal for other errors
                        }
                    }
                } catch (error) {
                    console.error('Error submitting profile update:', error);
                    showProfileUpdateMessage('An error occurred while updating your profile. Please try again.', 'error');
                    if(editProfileModal) editProfileModal.style.display = 'none'; // Close modal on network/unknown error
                }
                // Only close modal on success or non-password errors
            }
        // --- Profile Update Message UI ---
        function showProfileUpdateMessage(message, type) {
            let msgDiv = document.getElementById('profileUpdateMessage');
            if (!msgDiv) {
                msgDiv = document.createElement('div');
                msgDiv.id = 'profileUpdateMessage';
                msgDiv.style.position = 'fixed';
                msgDiv.style.top = '80px';
                msgDiv.style.left = '50%';
                msgDiv.style.transform = 'translateX(-50%)';
                msgDiv.style.zIndex = 10000;
                msgDiv.style.padding = '12px 28px';
                msgDiv.style.borderRadius = '6px';
                msgDiv.style.fontWeight = 'bold';
                msgDiv.style.fontSize = '1.1rem';
                msgDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
                document.body.appendChild(msgDiv);
            }
            msgDiv.textContent = message;
            msgDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
            msgDiv.style.color = type === 'success' ? '#155724' : '#721c24';
            msgDiv.style.border = type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
            msgDiv.style.display = 'block';
            clearTimeout(msgDiv._hideTimeout);
            msgDiv._hideTimeout = setTimeout(() => { msgDiv.style.display = 'none'; }, 3000);
        }
        // --- Change Password Logic ---
        const showChangePasswordFields = document.getElementById('showChangePasswordFields');
        const passwordFields = document.getElementById('passwordFields');
        const passwordInput = document.getElementById('editGymPassword');
        const passwordConfirmInput = document.getElementById('editGymPasswordConfirm');

        if (showChangePasswordFields && passwordFields) {
            showChangePasswordFields.addEventListener('click', function() {
                passwordFields.style.display = passwordFields.style.display === 'none' ? 'block' : 'none';
            });
        }
        // --- End Change Password Logic ---

        // File upload interaction
        const fileUploads = document.querySelectorAll('.file-upload');
        fileUploads.forEach(upload => {
            const input = upload.querySelector('input[type="file"]');
            
            upload.addEventListener('click', () => {
                input.click();
            });
            
            input.addEventListener('change', () => {
                if (input.files.length > 0) {
                    const fileName = input.files[0].name;
                    const textElement = upload.querySelector('.file-upload-text');
                    textElement.textContent = fileName;
                    upload.style.borderColor = 'var(--primary)';
                    upload.style.backgroundColor = 'rgba(58, 134, 255, 0.05)';
                }
            });
            
            // Drag and drop functionality
            upload.addEventListener('dragover', (e) => {
                e.preventDefault();
                upload.style.borderColor = 'var(--primary)';
                upload.style.backgroundColor = 'rgba(58, 134, 255, 0.1)';
            });
            
            upload.addEventListener('dragleave', () => {
                upload.style.borderColor = '#ced4da';
                upload.style.backgroundColor = 'transparent';
            });
            
            upload.addEventListener('drop', (e) => {
                e.preventDefault();
                input.files = e.dataTransfer.files;
                const fileName = input.files[0].name;
                const textElement = upload.querySelector('.file-upload-text');
                textElement.textContent = fileName;
                upload.style.borderColor = 'var(--primary)';
                upload.style.backgroundColor = 'rgba(58, 134, 255, 0.05)';
            });
        });
       
        // Rush hour toggle
        const rushHourToggle = document.querySelector('.rush-hour-toggle input');
        const rushHourIcon = document.querySelector('.rush-hour-icon');
        
        rushHourToggle.addEventListener('change', () => {
            if (rushHourToggle.checked) {
                rushHourIcon.classList.add('pulse');
                document.querySelector('.rush-hour-text h4').textContent = 'Rush Hour Active';
                document.querySelector('.rush-hour-text p').textContent = 'Extra staff deployed during peak hours (5PM-8PM)';
            } else {
                rushHourIcon.classList.remove('pulse');
                document.querySelector('.rush-hour-text h4').textContent = 'Rush Hour Inactive';
                document.querySelector('.rush-hour-text p').textContent = 'Normal operations during peak hours';
            }
        });

        // Quick action buttons
        const quickActionBtns = document.querySelectorAll('.quick-action');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Add ripple effect
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                btn.appendChild(ripple);
                
                // Remove ripple after animation
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Table row actions
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('tr');
                
                if (btn.classList.contains('approve')) {
                    const statusCell = row.querySelector('.status');
                    statusCell.textContent = 'Active';
                    statusCell.className = 'status active';
                    row.querySelectorAll('.action-btn').forEach(b => b.remove());
                    const viewBtn = document.createElement('button');
                    viewBtn.className = 'action-btn view';
                    viewBtn.textContent = 'View';
                    row.querySelector('td:last-child').appendChild(viewBtn);
                } else if (btn.classList.contains('reject')) {
                    row.remove();
                }
            });
        });

        // Table row click
        const tableRows = document.querySelectorAll('tbody tr');
        tableRows.forEach(row => {
            row.addEventListener('click', () => {
                // You can implement view member details functionality here
                console.log('View member details');
            });
        });
    }

// Sidebar toggle logic for desktop and mobile
const toggleBtn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const topNav = document.getElementById('topNav'); // Navbar element

// Desktop toggle (collapse/expand)
if (toggleBtn && sidebar && mainContent) {
    toggleBtn.addEventListener('click', () => {
        if (window.innerWidth > 900) {
            const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
            // Always update margins for both tabs and navbar on toggle
            updateMainContentMargins();
            // Rotate the icon
            const icon = toggleBtn.querySelector('i');
            if (isCollapsed) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-left');
            }
        }
    });
}



// Hide sidebar when clicking outside on mobile
document.addEventListener('click', (event) => {
    if (
        window.innerWidth <= 900 &&
        sidebar.classList.contains('sidebar-open') &&
        !sidebar.contains(event.target) &&
        (!mobileMenuBtn || !mobileMenuBtn.contains(event.target))
    ) {
        sidebar.classList.remove('sidebar-open');
    }
});

// --- Member Display Tab Logic ---
const sidebarMenuLinks = document.querySelectorAll('.sidebar .menu-link');
const membersMenuLink = Array.from(sidebarMenuLinks).find(link => link.querySelector('.fa-users'));
const dashboardMenuLink = Array.from(sidebarMenuLinks).find(link => link.querySelector('.fa-tachometer-alt'));
const memberDisplayTab = document.getElementById('memberDisplayTab');
const dashboardContent = document.querySelector('.content');


// --- Dynamic Members Stats Card ---
async function updateMembersStatsCard() {
  const membersStatValue = document.querySelector('.stat-card.new-users .stat-value');
  const membersStatChange = document.querySelector('.stat-card.new-users .stat-change');
  if (!membersStatValue || !membersStatChange) return;
  try {
    const token = localStorage.getItem('gymAdminToken');
    const res = await fetch('http://localhost:5000/api/members', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch members');
    const members = await res.json();
    // Filter active memberships (validUntil >= today)
    const today = new Date();
    const activeMembers = (Array.isArray(members) ? members : []).filter(m => {
      if (!m.membershipValidUntil) return false;
      const valid = new Date(m.membershipValidUntil);
      return valid >= today;
    });
    membersStatValue.textContent = activeMembers.length;

    // Growth rate calculation
    // Get joinDate for each member (assume ISO string or Date)
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
    let joinedThisWeek = 0, joinedLastWeek = 0, joinedThisMonth = 0, joinedLastMonth = 0;
    activeMembers.forEach(m => {
      if (!m.joinDate) return;
      const join = new Date(m.joinDate);
      if (join >= weekAgo && join <= now) joinedThisWeek++;
      if (join >= monthAgo && join <= now) joinedThisMonth++;
      // For previous week/month
      const lastWeekStart = new Date(weekAgo); lastWeekStart.setDate(weekAgo.getDate() - 7);
      if (join >= lastWeekStart && join < weekAgo) joinedLastWeek++;
      const lastMonthStart = new Date(monthAgo); lastMonthStart.setMonth(monthAgo.getMonth() - 1);
      if (join >= lastMonthStart && join < monthAgo) joinedLastMonth++;
    });
    // Calculate growth rates
    let weekGrowth = 0, monthGrowth = 0;
    if (joinedLastWeek > 0) weekGrowth = ((joinedThisWeek - joinedLastWeek) / joinedLastWeek) * 100;
    else if (joinedThisWeek > 0) weekGrowth = 100;
    if (joinedLastMonth > 0) monthGrowth = ((joinedThisMonth - joinedLastMonth) / joinedLastMonth) * 100;
    else if (joinedThisMonth > 0) monthGrowth = 100;
    // Show as positive/negative
    const weekGrowthText = weekGrowth >= 0 ? `<i class="fas fa-arrow-up"></i> ${Math.abs(weekGrowth).toFixed(1)}% from last week` : `<i class="fas fa-arrow-down"></i> ${Math.abs(weekGrowth).toFixed(1)}% from last week`;
    membersStatChange.innerHTML = weekGrowthText;
    if (weekGrowth >= 0) {
      membersStatChange.classList.add('positive');
      membersStatChange.classList.remove('negative');
    } else {
      membersStatChange.classList.add('negative');
      membersStatChange.classList.remove('positive');
    }
    // Optionally, you can show month growth in a tooltip or elsewhere
    membersStatChange.title = `Monthly growth: ${monthGrowth >= 0 ? '+' : '-'}${Math.abs(monthGrowth).toFixed(1)}% from last month`;
  } catch (err) {
    membersStatValue.textContent = '--';
    membersStatChange.innerHTML = '<i class="fas fa-minus"></i> N/A';
    membersStatChange.classList.remove('positive', 'negative');
    membersStatChange.title = '';
  }
}

// --- Dynamic Payments Stats Card ---
async function updatePaymentsStatsCard() {
  const paymentsStatValue = document.querySelector('.stat-card.payments .stat-value');
  const paymentsStatChange = document.querySelector('.stat-card.payments .stat-change');
  const paymentsStatTitle = document.querySelector('.stat-card.payments .stat-title');
  if (paymentsStatTitle) paymentsStatTitle.innerHTML = 'Total Payments';
  if (!paymentsStatValue || !paymentsStatChange) return;
  try {
    const token = localStorage.getItem('gymAdminToken');
    const res = await fetch('http://localhost:5000/api/members', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch members');
    const members = await res.json();
    // Sum all payments
    let totalPayments = 0;
    let paymentsThisMonth = 0;
    let paymentsLastMonth = 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    (Array.isArray(members) ? members : []).forEach(m => {
      if (typeof m.paymentAmount === 'number') {
        totalPayments += m.paymentAmount;
        // Check payment date (use joinDate as fallback)
        let payDate = m.paymentDate ? new Date(m.paymentDate) : (m.joinDate ? new Date(m.joinDate) : null);
        if (payDate) {
          if (payDate.getMonth() === thisMonth && payDate.getFullYear() === thisYear) {
            paymentsThisMonth += m.paymentAmount;
          } else if (payDate.getMonth() === lastMonth && payDate.getFullYear() === lastMonthYear) {
            paymentsLastMonth += m.paymentAmount;
          }
        }
      }
    });
    // Format as rupees
    paymentsStatValue.innerHTML = `<i class="fas fa-indian-rupee-sign"></i> ${totalPayments.toLocaleString('en-IN')}`;
    // Calculate monthly growth
    let monthGrowth = 0;
    if (paymentsLastMonth > 0) monthGrowth = ((paymentsThisMonth - paymentsLastMonth) / paymentsLastMonth) * 100;
    else if (paymentsThisMonth > 0) monthGrowth = 100;
    // Show as positive/negative
    const growthIcon = monthGrowth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    const growthClass = monthGrowth >= 0 ? 'positive' : 'negative';
    paymentsStatChange.innerHTML = `<i class="fas ${growthIcon}"></i> ${Math.abs(monthGrowth).toFixed(1)}% from last month`;
    paymentsStatChange.classList.remove('positive', 'negative');
    paymentsStatChange.classList.add(growthClass);
    paymentsStatChange.title = `This month: ₹${paymentsThisMonth.toLocaleString('en-IN')} | Last month: ₹${paymentsLastMonth.toLocaleString('en-IN')}`;
  } catch (err) {
    paymentsStatValue.innerHTML = '<i class="fas fa-indian-rupee-sign"></i> --';
    paymentsStatChange.innerHTML = '<i class="fas fa-minus"></i> N/A';
    paymentsStatChange.classList.remove('positive', 'negative');
    paymentsStatChange.title = '';
  }
}

// Call on load
document.addEventListener('DOMContentLoaded', function() {
  updateMembersStatsCard();
  updatePaymentsStatsCard();
});

function updateMainContentMargins() {
  if (!mainContent) return;
  const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
  const dashboardTab = mainContent.querySelector('.content');
  const memberTab = document.getElementById('memberDisplayTab');
  // --- Top Navbar dynamic left/width/height ---
  // (All navbar collapse/expand logic is now handled by CSS classes)
  // --- Main content margins ---
  if (dashboardTab && dashboardTab.style.display !== 'none') {
    if (window.innerWidth > 900) {
      dashboardTab.style.marginLeft = isCollapsed ? '80px' : '250px';
    } else {
      dashboardTab.style.marginLeft = '0';
    }
  }
  if (memberTab && memberTab.style.display !== 'none') {
    if (window.innerWidth > 900) {
      memberTab.style.marginLeft = isCollapsed ? '80px' : '250px';
    } else {
      memberTab.style.marginLeft = '0';
    }
  }
}

// Dynamic sidebar menu highlight
sidebarMenuLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    // Only handle tab switching links (not external/settings etc.)
    const menuText = link.querySelector('.menu-text')?.textContent.trim();
    if (menuText === 'Dashboard') {
      // Show dashboard, hide members
      dashboardContent.style.display = 'block';
      memberDisplayTab.style.display = 'none';
      updateMainContentMargins();
      // Remove active from all, add to dashboard
      sidebarMenuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    } else if (menuText === 'Members') {
      // Show members, hide dashboard
      dashboardContent.style.display = 'none';
      memberDisplayTab.style.display = 'block';
      updateMainContentMargins();
      // Remove active from all, add to members
      sidebarMenuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      // Fetch members if needed
      if (typeof fetchAndDisplayMembers === 'function') fetchAndDisplayMembers();
    } else {
      // For other tabs, just highlight
      sidebarMenuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
    e.preventDefault();
  });
});

async function fetchAndDisplayMembers() {
  const token = localStorage.getItem('gymAdminToken');
  if (!membersTableBody) return;
  membersTableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Loading...</td></tr>';
  try {
    const res = await fetch('http://localhost:5000/api/members', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch members');
    const members = await res.json();
    allMembersCache = Array.isArray(members) ? members : [];
    renderMembersTable(allMembersCache);
  } catch (err) {
    membersTableBody.innerHTML = `<tr><td colspan="10" style="color:red;text-align:center;">Error loading members</td></tr>`;
  }
}

function renderMembersTable(members) {
  if (!membersTableBody) return;
  if (!Array.isArray(members) || !members.length) {
    membersTableBody.innerHTML = '<tr><td colspan="13" style="text-align:center; color:#888;">No members found.</td></tr>';
    return;
  }
  membersTableBody.innerHTML = '';
  members.forEach(member => {
    const imgSrc = member.profileImage ? `http://localhost:5000${member.profileImage}` : 'https://via.placeholder.com/48?text=Photo';
    const joinDate = member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '';
    const membershipId = member.membershipId || '';
    const validUntil = member.membershipValidUntil ? new Date(member.membershipValidUntil).toLocaleDateString() : '';
    const amountPaid = member.paymentAmount !== undefined ? member.paymentAmount : '';
    membersTableBody.innerHTML += `
      <tr>
        <td style="text-align:center;"><img src="${imgSrc}" alt="Profile" style="width:48px;height:48px;border-radius:50%;object-fit:cover;"></td>
        <td>${member.memberName || ''}</td>
         <td>${membershipId}</td>
        <td>${member.age || ''}</td>
        <td>${member.gender || ''}</td>
        <td>${member.phone || ''}</td>
        <td>${member.email || ''}</td>
        <td>${member.planSelected || ''}</td>
        <td>${member.monthlyPlan || ''}</td>
        <td>${member.activityPreference || ''}</td>
         <td>${joinDate}</td>
        <td>${validUntil}</td>
        <td>${amountPaid}</td>
      </tr>
    `;
  });
}
document.addEventListener('DOMContentLoaded', function() {
  // Mobile sidebar logic with backdrop and animation
  const hamburger = document.getElementById('hamburgerMenuBtn');
  const dropdown = document.getElementById('mobileSidebarDropdown');
  const closeBtn = document.getElementById('closeMobileSidebar');
  const backdrop = document.getElementById('mobileSidebarBackdrop');

  function openMobileSidebar() {
    dropdown.classList.add('open');
    backdrop.classList.add('active');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileSidebar() {
    dropdown.classList.remove('open');
    backdrop.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburger && dropdown && backdrop) {
    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      openMobileSidebar();
    });
    backdrop.addEventListener('click', function() {
      closeMobileSidebar();
    });
  }
  if (closeBtn && dropdown && backdrop) {
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeMobileSidebar();
    });
  }
  // Prevent click inside sidebar from closing it
  if (dropdown) {
    dropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  // Hide sidebar if clicking outside (failsafe for edge cases)
  document.addEventListener('click', function(e) {
    if (
      dropdown.classList.contains('open') &&
      !dropdown.contains(e.target) &&
      e.target !== hamburger &&
      !backdrop.contains(e.target)
    ) {
      closeMobileSidebar();
    }
  });

  // --- Mobile Sidebar Menu Link Logic ---
  // Map menu text to tab IDs (update as needed)
  const tabMap = {
    'Dashboard': 'dashboardTab',
    'Members': 'memberDisplayTab',
    // Add more mappings as you implement more tabs
  };
  // Get all mobile menu links
  const mobileMenuLinks = dropdown.querySelectorAll('.menu-link');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      // Remove active from all
      mobileMenuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      // Also update desktop sidebar highlight if present
      const desktopLinks = document.querySelectorAll('.sidebar .menu-link');
      desktopLinks.forEach(l => {
        if (l.textContent.trim() === link.textContent.trim()) {
          l.classList.add('active');
        } else {
          l.classList.remove('active');
        }
      });
      // Show/hide tabs
      const tabName = link.querySelector('.menu-text')?.textContent.trim();
      Object.entries(tabMap).forEach(([menu, tabId]) => {
        const tab = document.getElementById(tabId);
        if (tab) tab.style.display = (menu === tabName) ? 'block' : 'none';
      });
      // Hide dashboard content if not dashboard
      const dashboardContent = document.querySelector('.content');
      if (tabName === 'Dashboard') {
        if (dashboardContent) dashboardContent.style.display = 'block';
        const memberTab = document.getElementById('memberDisplayTab');
        if (memberTab) memberTab.style.display = 'none';
        updateMainContentMargins();
      } else if (tabName === 'Members') {
        if (dashboardContent) dashboardContent.style.display = 'none';
        const memberTab = document.getElementById('memberDisplayTab');
        if (memberTab) memberTab.style.display = 'block';
        updateMainContentMargins();
        if (typeof fetchAndDisplayMembers === 'function') fetchAndDisplayMembers();
      } else {
        updateMainContentMargins();
      }
      // Close sidebar after click
      closeMobileSidebar();
    });
  });

  // On load and on resize, always update margins
  updateMainContentMargins();
  window.addEventListener('resize', updateMainContentMargins);
});