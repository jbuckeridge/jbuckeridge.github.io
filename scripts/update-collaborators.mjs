// Fetch collaborators from OpenAlex using ORCID
// Extracts unique co-authors across all publications
// Outputs to assets/data/collaborators.json
// Usage: node scripts/update-collaborators.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'assets', 'data', 'collaborators.json');

const ORCID_ID = '0000-0002-2537-5082';
const OPENALEX_WORKS_URL = `https://api.openalex.org/works?filter=author.orcid:${ORCID_ID}&per_page=200`;
const HEADERS = { 'Accept': 'application/json', 'User-Agent': 'mailto:buckeridge@lsbu.ac.uk' };

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllWorks() {
    console.log(`Fetching works from OpenAlex for ORCID ${ORCID_ID}...`);
    let allWorks = [];
    let url = OPENALEX_WORKS_URL + '&cursor=*';

    while (url) {
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) {
            throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const works = data.results || [];
        allWorks = allWorks.concat(works);

        console.log(`  Fetched ${allWorks.length} works so far...`);

        // Handle pagination via cursor
        const nextCursor = data.meta?.next_cursor;
        if (nextCursor && works.length > 0) {
            url = `${OPENALEX_WORKS_URL}&cursor=${nextCursor}`;
            await sleep(500);
        } else {
            url = null;
        }
    }

    console.log(`Total works fetched: ${allWorks.length}`);
    return allWorks;
}

function extractCollaborators(works) {
    const coauthorMap = new Map();

    // Find the primary author's OpenAlex ID to exclude them
    const primaryAuthorIds = new Set();

    for (const work of works) {
        const authorships = work.authorships || [];
        for (const authorship of authorships) {
            const orcid = authorship.author?.orcid;
            if (orcid && orcid.includes(ORCID_ID)) {
                primaryAuthorIds.add(authorship.author.id);
            }
        }
    }

    console.log(`Primary author OpenAlex IDs: ${[...primaryAuthorIds].join(', ')}`);

    for (const work of works) {
        const authorships = work.authorships || [];

        for (const authorship of authorships) {
            const authorId = authorship.author?.id;
            const authorName = authorship.author?.display_name;

            if (!authorId || !authorName) continue;
            if (primaryAuthorIds.has(authorId)) continue;

            // Get the most recent institution
            const institutions = authorship.institutions || [];
            const institution = institutions.length > 0
                ? institutions[0].display_name || ''
                : '';

            if (coauthorMap.has(authorId)) {
                const existing = coauthorMap.get(authorId);
                existing.papersCount += 1;
                if (!existing.institute && institution) {
                    existing.institute = institution;
                }
            } else {
                coauthorMap.set(authorId, {
                    name: authorName,
                    institute: institution,
                    papersCount: 1,
                    openAlexId: authorId
                });
            }
        }
    }

    // Sort by paper count descending, then by name
    const collaborators = [...coauthorMap.values()]
        .sort((a, b) => {
            if (b.papersCount !== a.papersCount) return b.papersCount - a.papersCount;
            return a.name.localeCompare(b.name);
        });

    return collaborators;
}

async function main() {
    const works = await fetchAllWorks();

    if (works.length === 0) {
        throw new Error('No works found on OpenAlex for this ORCID');
    }

    console.log('\nExtracting collaborators from authorships...');
    const collaborators = extractCollaborators(works);

    console.log(`Found ${collaborators.length} unique collaborators`);

    const output = {
        lastUpdated: new Date().toISOString(),
        orcidId: ORCID_ID,
        totalWorks: works.length,
        collaborators
    };

    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    console.log(`\nWrote ${collaborators.length} collaborators to ${OUTPUT_PATH}`);
    console.log(`Last updated: ${output.lastUpdated}`);

    // Show top 10
    console.log('\nTop 10 collaborators:');
    collaborators.slice(0, 10).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name} (${c.institute || 'Unknown'}) - ${c.papersCount} papers`);
    });
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
