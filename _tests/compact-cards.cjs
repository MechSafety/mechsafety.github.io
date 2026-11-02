const fs = require('node:fs');
const assert = require('node:assert/strict');
const css = fs.readFileSync('.design-preview/style-modern.css', 'utf8');
const projects = fs.readFileSync('projects/index.html', 'utf8');
const courses = fs.readFileSync('courses/index.html', 'utf8');
const members = fs.readFileSync('members/index.html', 'utf8');

assert.match(projects, /if agency_text\.size > 0[^\n]*class="project-agency"/);
assert.doesNotMatch(projects, /item\.program|program_text|project-program|project-funding/);
assert.doesNotMatch(css, /project-program|project-funding/);

const heading = courses.match(/<header class="course-heading">([\s\S]*?)<\/header>/)?.[1];
assert.ok(heading);
assert.match(heading, /class="course-identity"/);
assert.match(heading, /class="course-meta"/);
assert.match(heading, /for offering in course\.offerings/);
assert.equal((courses.match(/class="course-meta"/g) ?? []).length, 1);
assert.match(css, /\.course-heading\s*\{[^}]*display: grid;[^}]*grid-template-columns: minmax\(0, 200px\) minmax\(0, 1fr\);/);
assert.doesNotMatch(courses, /audience|수강대상/);
assert.match(heading, /<dt>개설학기<\/dt>/);
assert.match(css, /\.course-card\s*\{ min-height: 112px;/);
assert.match(css, /\.course-meta\s*\{[^}]*margin: 0;/);
assert.match(css, /\.course-meta \.offering-list\s*\{[^}]*flex-wrap: wrap;/);
assert.match(courses, /for image in course\.images limit: 2/);
assert.match(css, /\.course-card\.has-media \.course-card-inner \{ grid-template-columns: 1fr; \}/);

assert.doesNotMatch(css, /member-row:last-child:nth-child\(odd\)/);
assert.match(css, /\.member-list\s*\{[^}]*border: 0;[^}]*background: transparent;/);
assert.match(css, /\.member-row\s*\{\s*border: 1px solid/);
assert.doesNotMatch(members, /member-list--principal/);
assert.doesNotMatch(css, /member-list--principal/);

const mobile = css.slice(css.lastIndexOf('@media (max-width: 720px)'));
assert.match(mobile, /\.course-heading\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/);
assert.match(mobile, /\.course-meta\s*\{[^}]*max-width: 100%;/);
assert.match(mobile, /\.member-row \.portrait-placeholder\s*\{[^}]*width: 140px;[^}]*height: 180px;/);
assert.match(mobile, /object-fit: contain;/);
const cms = fs.readFileSync('.pages.yml', 'utf8');
const cmsProjects = cms.split('      - name: projects')[1].split('      - name: courses')[0];
assert.doesNotMatch(cmsProjects, /program|세부사업명/);
const cmsCourses = cms.split('      - name: courses')[1].split('      - name: contact')[0];
assert.doesNotMatch(cmsCourses, /audience|수강대상/);
assert.match(css, /\.course-meta dt\s*\{[^}]*font-size: 0\.8125rem;/);
assert.match(css, /\.course-meta dd\s*\{[^}]*font-size: 0\.8125rem;/);
assert.doesNotMatch(projects, /!= blank/);
console.log(JSON.stringify({pass: true, checks: ['project agency retained without program labels', 'course offerings in fixed nearby column', 'no empty audience row', 'uniform offering typography', 'accumulated semesters preserved', 'compact course minimum height', 'all member cards use same grid including principal', 'blank slot uses page background', 'mobile stacking and portraits preserved', 'optional course images retained']}));
