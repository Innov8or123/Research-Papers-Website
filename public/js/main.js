class AuthService {
    static async checkAuthStatus() {
        try {
            const response = await fetch('/profile');
            const elements = {
                signup: document.querySelector('.signup-link'),
                login: document.querySelector('.login-link'),
                logout: document.querySelector('.logout-link')
            };

            const isAuthenticated = response.ok;
            this.toggleAuthLinks(elements, isAuthenticated);
            return isAuthenticated;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    static toggleAuthLinks(elements, isAuthenticated) {
        elements.signup.style.display = isAuthenticated ? 'none' : 'inline';
        elements.login.style.display = isAuthenticated ? 'none' : 'inline';
        elements.logout.style.display = isAuthenticated ? 'inline' : 'none';
    }

    static async logout() {
        try {
            const response = await fetch('/auth/logout', { method: 'POST' });
            const result = await response.json();
            return this.handleResponse(response, result, 'Logout successful!', 'login.html');
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout error occurred');
            return false;
        }
    }

    static async login(formData) {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });
            const result = await response.json();
            return this.handleResponse(response, result, 'Login successful!', 'profile.html');
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login error occurred');
            return false;
        }
    }

    static async signup(formData) {
        const data = Object.fromEntries(formData);
        if (data.password !== data['confirm-password']) {
            alert('Passwords do not match!');
            return false;
        }

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return this.handleResponse(response, result, 'Signup successful! Please log in.', 'login.html');
        } catch (error) {
            console.error('Signup failed:', error);
            alert('Signup error occurred');
            return false;
        }
    }

    static handleResponse(response, result, successMsg, redirectUrl) {
        if (response.ok) {
            alert(successMsg);
            window.location.href = redirectUrl;
            return true;
        }
        alert(`Error: ${result.message}`);
        return false;
    }
}

class ProfileService {
    static async fetchProfile() {
        if (!window.location.pathname.includes('profile.html')) return;

        try {
            const response = await fetch('/profile');
            if (!response.ok) throw new Error('Profile fetch failed');
            const user = await response.json();
            this.displayProfile(user);
        } catch (error) {
            console.error('Profile fetch failed:', error);
            window.location.href = 'login.html';
        }
    }

    static displayProfile(user) {
        document.querySelector('.profile-name').textContent = `${user.firstName} ${user.lastName}`;
        document.querySelector('.profile-role').textContent = 
            user.role === 'teacher' ? 'Professor of Computer Science' : 'Student';
        const emailLink = document.querySelector('.profile-email-link');
        emailLink.textContent = user.email;
        emailLink.href = `mailto:${user.email}`;
    }
}

class PaperService {
    static isProfilePage = window.location.pathname.includes('profile.html');
    static isPublicationsPage = window.location.pathname.includes('publications.html');

    static async fetchPapers() {
        try {
            const url = this.isProfilePage ? '/teachers/publications' : '/publications';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Papers fetch failed');
            const links = await response.json();
            this.displayPapers(links);
        } catch (error) {
            console.error('Papers fetch failed:', error);
        }
    }

    static displayPapers(links) {
        if (this.isProfilePage) {
            const paperList = document.querySelector('.papers-list');
            if (!paperList) return; 
            paperList.innerHTML = '';
            links.forEach(link => {
                paperList.appendChild(this.createProfilePaperItem(link));
            });
        } else if (this.isPublicationsPage) {
            const papersGrid = document.querySelector('#papers-grid');
            if (!papersGrid) return;
            papersGrid.innerHTML = '';
            links.forEach(link => {
                papersGrid.appendChild(this.createPublicationCard(link));
            });
        }
    }

    static createProfilePaperItem(link) {
        const li = document.createElement('li');
        li.className = 'paper-item';
        li.innerHTML = `
            <a href="${link.url}" target="_blank" class="paper-link" rel="noopener noreferrer">${link.title}</a>
            <span class="paper-date">Submitted: ${link.date}</span>
        `;
        return li;
    }

    static createPublicationCard(link) {
        const article = document.createElement('article');
        article.className = 'paper-card';
        article.innerHTML = `
            <h3 class="paper-title">${link.title}</h3>
            <p class="paper-author">Author: ${link.firstName} ${link.lastName}</p>
            <a href="${link.url}" target="_blank" class="download-btn" rel="noopener noreferrer">View Paper</a>
        `;
        return article;
    }

    static async submitPaper(formData) {
        const data = Object.fromEntries(formData);
        if (!this.validateUrl(data['paper-link'])) {
            alert('Please enter a valid URL');
            return false;
        }

        try {
            const response = await fetch('/teachers/submit-publication', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                alert('Link submitted successfully!');
                this.fetchPapers();
                return true;
            }
            alert(`Error submitting link: ${result.message}`);
            return false;
        } catch (error) {
            console.error('Paper submission failed:', error);
            alert('Submission error occurred');
            return false;
        }
    }

    static validateUrl(url) {
        return /^(https?:\/\/[^\s$.?#].[^\s]*)$/.test(url);
    }
}

class ContactService {
    static async submitContact(formData) {
        try {
            const response = await fetch('/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });
            const result = await response.json();
            const messageDiv = document.getElementById('form-message');
            messageDiv.className = 'message'; 

            if (response.ok) {
                messageDiv.className = 'message success';
                messageDiv.textContent = 'Message sent successfully!';
                formData.get('form').reset();
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = result.message || 'Failed to send message.';
            }
        } catch (error) {
            console.error('Contact submission failed:', error);
            const messageDiv = document.getElementById('form-message');
            messageDiv.className = 'message error';
            messageDiv.textContent = 'An error occurred. Please try again.';
        } finally {
            const btn = document.querySelector('.contact-btn');
            btn.disabled = false;
            setTimeout(() => {
                document.getElementById('form-message').style.display = 'none';
            }, 5000); 
        }
    }
}

class FormHandler {
    static init() {
        this.bindForm('.logout-link', AuthService.logout.bind(AuthService));
        this.bindForm('.login-form', AuthService.login.bind(AuthService));
        this.bindForm('.signup-form', AuthService.signup.bind(AuthService));
        this.bindForm('.upload-form', PaperService.submitPaper.bind(PaperService));
        this.bindForm('.contact-form', ContactService.submitContact.bind(ContactService));
        this.bindSearchForm();
    }

    static bindForm(selector, handler) {
        const element = document.querySelector(selector);
        if (!element) return;

        element.addEventListener(selector.includes('link') ? 'click' : 'submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            formData.append('form', e.target);
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            await handler(formData);
            btn.disabled = false;
            if (selector.includes('contact-form') && formData.get('form')) {
                setTimeout(() => {
                    formData.get('form').reset();
                }, 0); 
            }
        });
    }

    static bindSearchForm() {
        const searchForm = document.querySelector('.search-form');
        if (!searchForm) return;

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchTerm = document.querySelector('#search').value.toLowerCase();
            try {
                const response = await fetch('/papers/all-links');
                const links = await response.json();
                const filtered = links.filter(link =>
                    [link.title, link.firstName, link.lastName].some(field =>
                        field.toLowerCase().includes(searchTerm)
                    )
                );
                PaperService.displayPapers(filtered);
            } catch (error) {
                console.error('Search failed:', error);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    AuthService.checkAuthStatus();
    ProfileService.fetchProfile();
    if (!window.location.pathname.includes('profile.html')) {
        PaperService.fetchPapers(); 
    }
    FormHandler.init();
});