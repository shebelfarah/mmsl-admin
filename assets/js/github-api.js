/* ============================================================
   MMSL Admin — GitHub API Wrapper
   Read/write JSON files via GitHub Contents API
   ============================================================ */

const GitHubAPI = {
  // Configuration — update these after setting up the repo
  OWNER: 'shebelfarah',
  REPO: 'MMSL',
  BRANCH: 'main',

  getHeaders() {
    const pat = Auth.getPAT();
    return {
      'Authorization': `token ${pat}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    };
  },

  /**
   * Read a file from the repo
   * Returns { content (parsed JSON), sha }
   */
  async readFile(path) {
    const url = `https://api.github.com/repos/${this.OWNER}/${this.REPO}/contents/${path}?ref=${this.BRANCH}&t=${Date.now()}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error(`Failed to read ${path}: ${response.status}`);
    }

    const data = await response.json();
    const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
    return { content, sha: data.sha };
  },

  /**
   * Write a file to the repo
   * Creates a commit with the new content
   */
  async writeFile(path, content, sha, message) {
    const url = `https://api.github.com/repos/${this.OWNER}/${this.REPO}/contents/${path}`;
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

    const body = {
      message: message || `Update ${path}`,
      content: encoded,
      sha: sha,
      branch: this.BRANCH
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to write ${path}: ${error.message}`);
    }

    return await response.json();
  },

  /**
   * Helper: Read, modify, and write back a JSON file
   */
  async updateFile(path, modifyFn, commitMessage) {
    const { content, sha } = await this.readFile(path);
    const updated = modifyFn(content);
    updated.lastUpdated = new Date().toISOString();
    return await this.writeFile(path, updated, sha, commitMessage);
  }
};
