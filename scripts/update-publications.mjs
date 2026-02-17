// Fetch publications from ORCID and enrich with OpenAlex metadata
// Outputs to assets/data/publications.json
// Usage: node scripts/update-publications.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'assets', 'data', 'publications.json');

const ORCID_ID = '0000-0002-2537-5082';
const ORCID_API_URL = `https://pub.orcid.org/v3.0/${ORCID_ID}/works`;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000;

async function fetchPublications() {
    console.log(`Fetching publications from ORCID (${ORCID_ID})...`);
    const response = await fetch(ORCID_API_URL, {
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`ORCID API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

async function fetchMetadata(doi) {
    if (!doi) return null;

    try {
        const response = await fetch(`https://api.openalex.org/works/https://doi.org/${doi}`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'mailto:buckeridge@lsbu.ac.uk' }
        });
        if (!response.ok) return null;
        return response.json();
    } catch (error) {
        console.warn(`  Warning: Failed to fetch metadata for DOI ${doi}:`, error.message);
        return null;
    }
}

function parseWork(work) {
    const workSummary = work['work-summary'][0];
    const title = workSummary.title?.title?.value || 'Untitled';
    const year = workSummary['publication-date']?.year?.value || 'Unknown';
    const journal = workSummary['journal-title']?.value || '';
    const type = workSummary.type || 'article';

    const externalIds = workSummary['external-ids']?.['external-id'] || [];
    const doiObj = externalIds.find(id => id['external-id-type'] === 'doi');
    const doi = doiObj ? doiObj['external-id-value'] : null;

    const url = workSummary.url?.value || (doi ? `https://doi.org/${doi}` : null);

    return {
        title,
        year: parseInt(year),
        journal,
        type,
        doi,
        url,
        putCode: workSummary['put-code'],
        authors: null,
        volume: null,
        issue: null,
        pages: null
    };
}

async function enrichPublication(pub) {
    if (!pub.doi) return pub;

    const metadata = await fetchMetadata(pub.doi);
    if (!metadata) return pub;

    if (metadata.authorships && Array.isArray(metadata.authorships)) {
        pub.authors = metadata.authorships.map(authorship => {
            const name = authorship.author?.display_name || '';
            if (!name) return '';
            const parts = name.split(' ');
            if (parts.length >= 2) {
                const family = parts[parts.length - 1];
                const initials = parts.slice(0, -1).map(n => n.charAt(0) + '.').join(' ');
                return `${family}, ${initials}`;
            }
            return name;
        }).filter(a => a);
    }

    const biblio = metadata.biblio || {};
    pub.volume = biblio.volume || null;
    pub.issue = biblio.issue || null;
    if (biblio.first_page) {
        pub.pages = biblio.last_page && biblio.last_page !== biblio.first_page
            ? `${biblio.first_page}-${biblio.last_page}`
            : biblio.first_page;
    }

    const journalName = metadata.primary_location?.source?.display_name;
    if (journalName && !pub.journal) {
        pub.journal = journalName;
    }

    return pub;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const data = await fetchPublications();

    if (!data || !data.group) {
        throw new Error('No publication groups found in ORCID response');
    }

    console.log(`Found ${data.group.length} works on ORCID`);

    let publications = data.group
        .map(work => parseWork(work))
        .filter(pub => pub.year && !isNaN(pub.year))
        .sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return a.title.localeCompare(b.title);
        });

    console.log(`Processing ${publications.length} publications...`);

    // Enrich in batches with delay
    for (let i = 0; i < publications.length; i += BATCH_SIZE) {
        const batch = publications.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(publications.length / BATCH_SIZE);
        console.log(`  Enriching batch ${batchNum}/${totalBatches}...`);

        await Promise.all(batch.map(async (pub, index) => {
            publications[i + index] = await enrichPublication(pub);
        }));

        if (i + BATCH_SIZE < publications.length) {
            await sleep(BATCH_DELAY_MS);
        }
    }

    const output = {
        lastUpdated: new Date().toISOString(),
        orcidId: ORCID_ID,
        publications
    };

    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    console.log(`\nWrote ${publications.length} publications to ${OUTPUT_PATH}`);
    console.log(`Last updated: ${output.lastUpdated}`);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
