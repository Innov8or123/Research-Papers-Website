// Check authentication status and toggle login/logout links
async function checkAuthStatus() {
    try {
        const response = await fetch('/profile');
        const signupLink = document.querySelector('.signup-link');
        const loginLink = document.querySelector('.login-link');
        const logoutLink = document.querySelector('.logout-link');

        if (response.ok) {
            signupLink.style.display = 'none';
            loginLink.style.display = 'none';
            logoutLink.style.display = 'inline';
        } else {
            signupLink.style.display = 'inline';
            loginLink.style.display = 'inline';
            logoutLink.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// Handle logout
document.querySelector('.logout-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
        });
        const result = await response.json();
        if (response.ok) {
            alert('Logout successful!');
            window.location.href = 'login.html';
        } else {
            alert('Error logging out: ' + result.message);
        }
    } catch (error) {
        console.error('Error logging out:', error);
        alert('An error occurred while logging out.');
    }
});

// Handle login form submission
document.querySelector('.login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
            alert('Login successful!');
            window.location.href = 'profile.html'; 
        } else {
            alert('Error logging in: ' + result.message);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('An error occurred while logging in.');
    }
});

// Handle signup form submission
document.querySelector('.signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (data['password'] !== data['confirm-password']) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
            alert('Signup successful! Please log in.');
            window.location.href = 'login.html';
        } else {
            alert('Error signing up: ' + result.message);
        }
    } catch (error) {
        console.error('Error signing up:', error);
        alert('An error occurred while signing up.');
    }
});

// Handle contact form submission
document.querySelector('.contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
            alert('Message sent successfully!');
            e.target.reset();
        } else {
            alert('Error sending message: ' + result.message);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('An error occurred while sending the message.');
    }
});

// Fetch profile details for the teacher profile page
async function fetchProfileDetails() {
    if (!window.location.pathname.includes('profile.html')) return;

    try {
        const response = await fetch('/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const user = await response.json();

        document.querySelector('.profile-name').textContent = `${user.firstName} ${user.lastName}`;
        document.querySelector('.profile-role').textContent = user.role === 'teacher' ? 'Professor of Computer Science' : 'Student';
        const emailLink = document.querySelector('.profile-email-link');
        emailLink.textContent = user.email;
        emailLink.href = `mailto:${user.email}`;
    } catch (error) {
        console.error('Error fetching profile details:', error);
        window.location.href = 'login.html'; // Redirect to login if not authenticated
    }
}

// Determine the current page
const isProfilePage = window.location.pathname.includes('profile.html');
const isPublicationsPage = window.location.pathname.includes('publications.html');

// Fetch paper links for the teacher profile or publications page
async function fetchPaperLinks() {
    try {
        const url = isProfilePage ? '/papers/links' : '/papers/all-links';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch links');
        const links = await response.json();

        if (isProfilePage) {
            const paperList = document.querySelector('.papers-list');
            paperList.innerHTML = ''; // Clear existing list
            links.forEach(link => {
                const li = document.createElement('li');
                li.className = 'paper-item';
                li.innerHTML = `
                    <a href="${link.url}" target="_blank" class="paper-link" rel="noopener noreferrer">${link.title}</a>
                    <span class="paper-date">Submitted: ${link.date}</span>
                `;
                paperList.appendChild(li);
            });
        } else if (isPublicationsPage) {
            const papersGrid = document.querySelector('#papers-grid');
            papersGrid.innerHTML = ''; // Clear existing grid
            links.forEach(link => {
                const article = document.createElement('article');
                article.className = 'paper-card';
                article.innerHTML = `
                    <h3 class="paper-title">${link.title}</h3>
                    <p class="paper-author">Author: ${link.firstName} ${link.lastName}</p>
                    <a href="${link.url}" target="_blank" class="download-btn" rel="noopener noreferrer">View Paper</a>
                `;
                papersGrid.appendChild(article);
            });
        }
    } catch (error) {
        console.error('Error fetching paper links:', error);
    }
}

// Handle form submission for submitting a new link (profile page)
document.querySelector('.upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Client-side URL validation
    const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
    if (!urlPattern.test(data['paper-link'])) {
        alert('Please enter a valid URL (e.g., https://example.com/paper.pdf)');
        return;
    }

    try {
        const response = await fetch('/papers/submit-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
            alert('Link submitted successfully!');
            fetchPaperLinks(); // Refresh the list
            e.target.reset(); // Clear the form
        } else {
            alert('Error submitting link: ' + result.message);
        }
    } catch (error) {
        console.error('Error submitting link:', error);
        alert('An error occurred while submitting the link.');
    }
});

// Handle search form submission (publications page)
document.querySelector('.search-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchTerm = document.querySelector('#search').value.toLowerCase();
    try {
        const response = await fetch('/papers/all-links');
        const links = await response.json();
        const filteredLinks = links.filter(link =>
            link.title.toLowerCase().includes(searchTerm) ||
            link.firstName.toLowerCase().includes(searchTerm) ||
            link.lastName.toLowerCase().includes(searchTerm)
        );

        const papersGrid = document.querySelector('#papers-grid');
        papersGrid.innerHTML = ''; // Clear existing grid
        filteredLinks.forEach(link => {
            const article = document.createElement('article');
            article.className = 'paper-card';
            article.innerHTML = `
                <h3 class="paper-title">${link.title}</h3>
                <p class="paper-author">Author: ${link.firstName} ${link.lastName}</p>
                <a href="${link.url}" target="_blank" class="download-btn" rel="noopener noreferrer">View Paper</a>
            `;
            papersGrid.appendChild(article);
        });
    } catch (error) {
        console.error('Error searching papers:', error);
    }
});

// Call fetch functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    fetchProfileDetails();
    fetchPaperLinks();
});