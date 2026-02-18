/* ============================================================
   MMSL Admin — Authentication
   Password hash verification + session management
   ============================================================ */

const Auth = {
  // SHA-256 hash of the admin password
  // To generate: open browser console, run:
  //   crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSWORD'))
  //     .then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,'0')).join(''))
  //     .then(console.log)
  // Then replace the hash below:
  PASSWORD_HASH: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // default: "password"

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async login(password, pat) {
    const hash = await this.hashPassword(password);
    if (hash !== this.PASSWORD_HASH) {
      return { success: false, error: 'Invalid password' };
    }

    // Verify PAT works by making a test API call
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${pat}` }
      });

      if (!response.ok) {
        return { success: false, error: 'Invalid GitHub token. Please check your Personal Access Token.' };
      }

      // Store PAT in sessionStorage (cleared when tab closes)
      sessionStorage.setItem('mmsl_pat', pat);
      sessionStorage.setItem('mmsl_auth', 'true');

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  },

  isAuthenticated() {
    return sessionStorage.getItem('mmsl_auth') === 'true' && sessionStorage.getItem('mmsl_pat');
  },

  getPAT() {
    return sessionStorage.getItem('mmsl_pat');
  },

  logout() {
    sessionStorage.removeItem('mmsl_pat');
    sessionStorage.removeItem('mmsl_auth');
    window.location.href = 'index.html';
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
};
