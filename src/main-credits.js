import './styles/index.css';
import './styles/credits.css';

class CreditsTable {
  constructor() {
    this.projects = [];
    this.sortColumn = 'year';
    this.sortDirection = 'desc';

    this.tbody = document.getElementById('creditsBody');
    this.imagePopup = document.getElementById('imagePopup');
    this.popupImg = this.imagePopup.querySelector('img');

    this.init();
  }

  async init() {
    await this.loadProjects();
    this.initEventListeners();
    this.initImagePopup();
    this.render();
  }

  async loadProjects() {
    try {
      const response = await fetch('./data/projects.json');
      const data = await response.json();
      this.projects = data.projects;
    } catch (error) {
      console.error('Error loading projects:', error);
      this.tbody.innerHTML = `
        <tr>
          <td colspan="4" class="no-results">
            Error loading projects. Please check that data/projects.json exists.
          </td>
        </tr>
      `;
    }
  }

  initEventListeners() {
    document.querySelectorAll('th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const column = th.dataset.column;
        this.handleSort(column);
      });
    });
  }

  initImagePopup() {
    document.addEventListener('mousemove', (e) => {
      if (this.imagePopup.classList.contains('visible')) {
        this.imagePopup.style.left = e.clientX + 20 + 'px';
        this.imagePopup.style.top = e.clientY + 20 + 'px';
      }
    });

    this.tbody.addEventListener(
      'mouseenter',
      (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.poster) {
          this.showPopup(row.dataset.poster);
        }
      },
      true,
    );

    this.tbody.addEventListener(
      'mouseleave',
      (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.poster) {
          this.hidePopup();
        }
      },
      true,
    );
  }

  showPopup(posterUrl) {
    this.popupImg.src = posterUrl;
    this.imagePopup.classList.add('visible');
  }

  hidePopup() {
    this.imagePopup.classList.remove('visible');
  }

  handleSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = column === 'year' ? 'desc' : 'asc';
    }

    this.updateSortIndicators();
    this.sortProjects();
    this.render();
  }

  updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.column === this.sortColumn) {
        th.classList.add(`sort-${this.sortDirection}`);
      }
    });
  }

  sortProjects() {
    this.projects.sort((a, b) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      let comparison = 0;
      if (valA > valB) comparison = 1;
      if (valA < valB) comparison = -1;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  render() {
    if (this.projects.length === 0) {
      this.tbody.innerHTML = `
        <tr>
          <td colspan="4" class="no-results">No projects available.</td>
        </tr>
      `;
      return;
    }

    this.tbody.innerHTML = this.projects
      .map(
        (project) => `
      <tr data-poster="${project.poster || ''}">
        <td class="title">${this.escapeHtml(project.title)}</td>
        <td class="platform">${this.escapeHtml(project.platform)}</td>
        <td class="year">${project.year}</td>
        <td class="role">${this.escapeHtml(project.role)}</td>
      </tr>
    `,
      )
      .join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CreditsTable());
} else {
  new CreditsTable();
}
