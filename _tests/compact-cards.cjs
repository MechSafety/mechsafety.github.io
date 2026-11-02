const fs = require('node:fs');
const assert = require('node:assert/strict');
const css = fs.readFileSync('.design-preview/style-modern.css', 'utf8');
const projects = fs.readFileSync('projects/index.html', 'utf8');
const courses = fs.readFileSync('courses/index.html', 'utf8');
const members = fs.readFileSync('members/index.html', 'utf8');

assert.match(projects, /class="project-funding">[\s\S]*?class="project-agency"[\s\S]*?class="project-program"[\s\S]*?<\/div>/);
assert.match(css, /\.project-funding\s*\{[^}]*display: flex;[^}]*flex-wrap: wrap;[^}]*gap: 6px 32px;/);
assert.match(css, /\.project-copy \.project-program\s*\{\s*margin: 0;/);

const heading = courses.match(/<header class="course-heading">([\s\S]*?)<\/header>/)?.[1];
assert.ok(heading);
assert.match(heading, /class="course-identity"/);
assert.match(heading, /class="course-meta"/);
assert.match(heading, /for offering in course\.offerings/);
assert.equal((courses.match(/class="course-meta"/g) ?? []).length, 1);
assert.match(css, /\.course-heading\s*\{[^}]*display: flex;[^}]*justify-content: space-between;/);
assert.match(css, /\.course-card\s*\{ min-height: 112px;/);
assert.match(css, /\.course-meta\s*\{[^}]*margin: 0;/);
assert.match(css, /\.course-meta \.offering-list\s*\{[^}]*flex-wrap: wrap;/);
assert.match(courses, /for image in course\.images limit: 2/);
assert.match(css, /\.course-card\.has-media \.course-card-inner \{ grid-template-columns: 1fr; \}/);

assert.doesNotMatch(css, /member-row:last-child:nth-child\(odd\)/);
assert.match(css, /\.member-list\s*\{[^}]*border: 0;[^}]*background: transparent;/);
assert.match(css, /\.member-row\s*\{\s*border: 1px solid/);
assert.match(members, /group_name == 'Principal Investigator'[^\n]*member-list--principal/);
assert.match(css, /\.member-list--principal \{ grid-template-columns: 1fr; \}/);

const mobile = css.slice(css.lastIndexOf('@media (max-width: 720px)'));
assert.match(mobile, /\.course-heading\s*\{[^}]*flex-direction: column;/);
assert.match(mobile, /\.course-meta\s*\{[^}]*max-width: 100%;/);
assert.match(mobile, /\.member-row \.portrait-placeholder\s*\{[^}]*width: 140px;[^}]*height: 180px;/);
assert.match(mobile, /object-fit: contain;/);
console.log(JSON.stringify({pass: true, checks: ['inline project funding', 'right-aligned course offerings', 'accumulated semesters preserved', 'compact course minimum height', 'single student and alumni stay half-width', 'blank slot uses page background', 'principal layout preserved', 'mobile stacking and portraits preserved', 'optional course images retained']}));
