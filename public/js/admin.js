// Fetch CSRF token
fetch('/get-csrf-token')
    .then(res => res.json())
    .then(data => {
        document.getElementById('csrfToken').value = data.csrfToken;
    })
    .catch(err => {
        console.error('Error fetching CSRF token:', err);
        document.getElementById('upload-message').innerHTML = '<p class="error-message">Error fetching CSRF token.</p>';
    });

// form submission
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const uploadBtn = e.target.querySelector('button');
    const spinner = document.createElement('span');
    spinner.className = 'loading-spinner';
    uploadBtn.disabled = true;
    uploadBtn.appendChild(spinner);
    const formData = new FormData(e.target);
    try {
        const response = await fetch('/admin/upload-publications', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('upload-message').innerHTML = '<p class="success-message">Publications uploaded successfully!</p>';
        } else {
            document.getElementById('upload-message').innerHTML = `<p class="error-message">${data.message || 'Error uploading publications.'}</p>`;
        }
    } catch (err) {
        document.getElementById('upload-message').innerHTML = '<p class="error-message">Error uploading publications.</p>';
        console.error('Error:', err);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.removeChild(spinner);
    }
});

// GET all users
async function fetchUsers() {
    try {
        const response = await fetch('/admin/users', {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        displayUsers(data.data.users);
    } catch (err) {
        document.getElementById('users-message').innerHTML = '<p class="error-message">Error fetching users.</p>';
        console.error('Error fetching users:', err);
    }
}

function displayUsers(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No users found.</td></tr>';
        return;
    }
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.department}</td>
            <td><button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// DELETE User
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const deleteBtn = document.querySelector(`button[onclick="deleteUser(${userId})"]`);
    const spinner = document.createElement('span');
    spinner.className = 'loading-spinner';
    deleteBtn.disabled = true;
    deleteBtn.appendChild(spinner);
    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
        document.getElementById('users-message').innerHTML = '<p class="success-message">User deleted successfully!</p>';
        fetchUsers();
    } catch (err) {
        document.getElementById('users-message').innerHTML = '<p class="error-message">Error deleting user.</p>';
        console.error('Error deleting user:', err);
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.removeChild(spinner);
    }
}

async function fetchPublications() {
    try {
        const response = await fetch('/admin/publications', {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch publications');
        }
        const data = await response.json();
        displayPublications(data.data.publications); 
    } catch (err) {
        document.getElementById('papers-message').innerHTML = '<p class="error-message">Error fetching publications.</p>';
        console.error('Error fetching publications:', err);
    }
}

function displayPublications(publications) {
    const tbody = document.querySelector('#papers-table tbody');
    tbody.innerHTML = '';
    if (publications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No publications found.</td></tr>';
        return;
    }
    publications.forEach(pub => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pub.id}</td>
            <td>${pub.title}</td>
            <td>
                ${pub.url ? `<a href="${pub.url.startsWith('http') ? pub.url : 'https://doi.org/' + pub.url}" target="_blank">View</a>` : 'N/A'}
            </td>
            <td>${pub.date}</td>
            <td>${pub.teacherId} (${pub.teacher_first_name} ${pub.teacher_last_name})</td>
            <td><button class="delete-btn" onclick="deletePublication(${pub.id})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// DELETE publications
async function deletePublication(publicationId) {
    if (!confirm('Are you sure you want to delete this publication?')) return;
    const deleteBtn = document.querySelector(`button[onclick="deletePublication(${publicationId})"]`);
    const spinner = document.createElement('span');
    spinner.className = 'loading-spinner';
    deleteBtn.disabled = true;
    deleteBtn.appendChild(spinner);
    try {
        const response = await fetch(`/admin/publications/${publicationId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete publication');
        }
        deleteBtn.textContent = 'Deleted';
        setTimeout(() => {
            fetchPublications();
        }, 1000);
    } catch (err) {
        console.error('Error deleting publication:', err);
        deleteBtn.textContent = 'Delete';
        deleteBtn.disabled = false;
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = err.message || 'Failed to delete publication';
        deleteBtn.parentNode.appendChild(errorMessage);
        setTimeout(() => {
            errorMessage.remove();
        }, 3000);
    } finally {
        deleteBtn.removeChild(spinner);
    }
}

fetchUsers();
fetchPublications();