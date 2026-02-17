// Fetch citation/publication stats from OpenAlex author profile
// Updates the hardcoded fallback values in index.html and publications.html
// Usage: node scripts/update-citations.mjs

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, '..', 'index.html');
const PUBLICATIONS_PATH = join(__dirname, '..', 'publications.html');

const ORCID_ID = '0000-0002-2537-5082';
const OPENALEX_AUTHOR_URL = `https://api.openalex.org/authors/https://orcid.org/${ORCID_ID}`;
const HEADERS = { 'Accept': 'application/json', 'User-Agent': 'mailto:buckeridge@lsbu.ac.uk' };

// Round down to nearest multiple
function roundDown(n, multiple) {
    return Math.floor(n / multiple) * multiple;
}

// Replace text content of an element by its id attribute
// Matches patterns like: id="some-id">OLD_VALUE</span> or id="some-id">OLD_VALUE</div>
function updateElementById(html, id, newValue) {
    const pattern = new RegExp(`(id="${id}">)[^<]*(</)`);
    const match = html.match(pattern);
    if (match) {
        html = html.replace(pattern, `$1${newValue}$2`);
        return { html, oldValue: match[0].replace(match[1], '').replace(match[2], '') };
    }
    return { html, oldValue: null };
}

async function fetchAuthorData() {
    console.log(`Fetching author data from OpenAlex for ORCID ${ORCID_ID}...`);

    const response = await fetch(OPENALEX_AUTHOR_URL, { headers: HEADERS });

    if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

function getEarliestYear(authorData) {
    // Use counts_by_year to find the earliest year with publications
    if (authorData.counts_by_year && authorData.counts_by_year.length > 0) {
        const yearsWithWorks = authorData.counts_by_year
            .filter(y => y.works_count > 0)
            .map(y => y.year);
        if (yearsWithWorks.length > 0) {
            return Math.min(...yearsWithWorks);
        }
    }
    return null;
}

async function main() {
    const authorData = await fetchAuthorData();

    const worksCount = authorData.works_count || 0;
    const citations = authorData.cited_by_count || 0;
    const hIndex = authorData.summary_stats?.h_index || 0;
    const earliestYear = getEarliestYear(authorData);
    const currentYear = new Date().getFullYear();

    // Apply rounding rules
    const roundedPubs = roundDown(worksCount, 5);         // e.g. 64 -> 60
    const roundedCitations = roundDown(citations, 100);    // e.g. 5999 -> 5900
    const roundedHIndex = roundDown(hIndex, 5);            // e.g. 33 -> 30
    const yearsResearch = earliestYear ? (currentYear - earliestYear) : null;

    console.log(`Raw stats: ${worksCount} publications, ${citations} citations, h-index ${hIndex}`);
    console.log(`Earliest year: ${earliestYear || 'unknown'}`);
    console.log(`Rounded: ${roundedPubs}+ pubs, ${roundedCitations}+ citations, ${roundedHIndex}+ h-index, ${yearsResearch || '?'}+ years`);

    // --- Update index.html ---
    let indexHtml = readFileSync(INDEX_PATH, 'utf-8');
    let result;

    result = updateElementById(indexHtml, 'stat-publications', `${roundedPubs}+`);
    indexHtml = result.html;
    console.log(`\nindex.html: stat-publications ${result.oldValue} -> ${roundedPubs}+`);

    result = updateElementById(indexHtml, 'stat-citations', `${roundedCitations}+`);
    indexHtml = result.html;
    console.log(`index.html: stat-citations ${result.oldValue} -> ${roundedCitations}+`);

    if (yearsResearch !== null) {
        result = updateElementById(indexHtml, 'stat-years', `${yearsResearch}+`);
        indexHtml = result.html;
        console.log(`index.html: stat-years ${result.oldValue} -> ${yearsResearch}+`);
    }

    writeFileSync(INDEX_PATH, indexHtml, 'utf-8');
    console.log('index.html updated successfully');

    // --- Update publications.html ---
    let pubsHtml = readFileSync(PUBLICATIONS_PATH, 'utf-8');

    result = updateElementById(pubsHtml, 'pub-stat-publications', `${roundedPubs}+`);
    pubsHtml = result.html;
    console.log(`\npublications.html: pub-stat-publications ${result.oldValue} -> ${roundedPubs}+`);

    result = updateElementById(pubsHtml, 'pub-stat-citations', `${roundedCitations}+`);
    pubsHtml = result.html;
    console.log(`publications.html: pub-stat-citations ${result.oldValue} -> ${roundedCitations}+`);

    result = updateElementById(pubsHtml, 'pub-stat-hindex', `${roundedHIndex}+`);
    pubsHtml = result.html;
    console.log(`publications.html: pub-stat-hindex ${result.oldValue} -> ${roundedHIndex}+`);

    writeFileSync(PUBLICATIONS_PATH, pubsHtml, 'utf-8');
    console.log('publications.html updated successfully');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
