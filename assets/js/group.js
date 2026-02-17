// Group Members and Positions Dynamic Renderer
(function () {
    'use strict';

    // Fetch members data
    async function fetchMembers() {
        try {
            const response = await fetch('/assets/data/members.json');
            if (!response.ok) throw new Error('Failed to load members data');
            return await response.json();
        } catch (error) {
            console.error('Error loading members:', error);
            return null;
        }
    }

    // Fetch positions data
    async function fetchPositions() {
        try {
            const response = await fetch('/assets/data/positions.json');
            if (!response.ok) throw new Error('Failed to load positions data');
            return await response.json();
        } catch (error) {
            console.error('Error loading positions:', error);
            return [];
        }
    }

    // Render member card
    function renderMemberCard(member) {
        const socialLinks = [];

        if (member.website) {
            socialLinks.push(`<a href="${member.website}" target="_blank" rel="noopener noreferrer" title="Website"><i class="fas fa-globe"></i></a>`);
        }
        if (member.linkedin) {
            socialLinks.push(`<a href="${member.linkedin}" target="_blank" rel="noopener noreferrer" title="LinkedIn"><i class="fab fa-linkedin"></i></a>`);
        }
        if (member.googleScholar) {
            socialLinks.push(`<a href="${member.googleScholar}" target="_blank" rel="noopener noreferrer" title="Google Scholar"><i class="ai ai-google-scholar"></i></a>`);
        }
        if (member.github) {
            socialLinks.push(`<a href="${member.github}" target="_blank" rel="noopener noreferrer" title="GitHub"><i class="fab fa-github"></i></a>`);
        }

        const socialLinksHTML = socialLinks.length > 0
            ? `<div class="social-links" style="margin-top: 1rem; justify-content: center;">${socialLinks.join('')}</div>`
            : '';

        const imageHTML = member.image
            ? `<img src="${member.image}" alt="${member.name}" style="width: 150px; height: 150px; border-radius: 50%; margin: 0 auto 1rem auto; display: block; object-fit: cover;" onerror="this.src='/img/default-avatar.png'">`
            : '';

        return `
            <div class="card">
                <div class="card-body" style="text-align: center;">
                    ${imageHTML}
                    <h4 class="card-title">${member.name}</h4>
                    <p class="card-subtitle">${member.position}</p>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">${member.researchTopic || ''}</p>
                    ${member.email ? `<p style="font-size: 0.85rem;"><i class="fas fa-envelope"></i> <a href="mailto:${member.email}">${member.email}</a></p>` : ''}
                    ${socialLinksHTML}
                </div>
            </div>
        `;
    }

    // Render alumni card
    function renderAlumniCard(alumni) {
        const socialLinks = [];

        if (alumni.website) {
            socialLinks.push(`<a href="${alumni.website}" target="_blank" rel="noopener noreferrer" title="Website"><i class="fas fa-globe"></i></a>`);
        }
        if (alumni.linkedin) {
            socialLinks.push(`<a href="${alumni.linkedin}" target="_blank" rel="noopener noreferrer" title="LinkedIn"><i class="fab fa-linkedin"></i></a>`);
        }
        if (alumni.googleScholar) {
            socialLinks.push(`<a href="${alumni.googleScholar}" target="_blank" rel="noopener noreferrer" title="Google Scholar"><i class="ai ai-google-scholar"></i></a>`);
        }
        if (alumni.github) {
            socialLinks.push(`<a href="${alumni.github}" target="_blank" rel="noopener noreferrer" title="GitHub"><i class="fab fa-github"></i></a>`);
        }

        const socialLinksHTML = socialLinks.length > 0
            ? `<div class="social-links" style="margin-top: 0.5rem; justify-content: center;">${socialLinks.join('')}</div>`
            : '';

        return `
            <div class="card">
                <div class="card-body" style="text-align: center;">
                    <h4 class="card-title">${alumni.name}</h4>
                    <p class="card-subtitle">${alumni.groupPosition} (${alumni.duration})</p>
                    <p style="font-size: 0.9rem;"><strong>Current Position:</strong> ${alumni.currentPosition}</p>
                    ${alumni.researchTitle ? `<p style="font-size: 0.85rem; color: var(--text-muted);"><strong>Research:</strong> ${alumni.researchTitle}</p>` : ''}
                    ${alumni.email ? `<p style="font-size: 0.85rem;"><i class="fas fa-envelope"></i> <a href="mailto:${alumni.email}">${alumni.email}</a></p>` : ''}
                    ${socialLinksHTML}
                </div>
            </div>
        `;
    }

    // Render collaborator card
    function renderCollaboratorCard(collaborator) {
        return `
            <div class="card">
                <div class="card-body" style="text-align: center;">
                    <h4 class="card-title">${collaborator.name}</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">${collaborator.institute}</p>
                    <p style="font-size: 0.85rem;"><strong>${collaborator.papersCount}</strong> joint publications</p>
                </div>
            </div>
        `;
    }

    // Render position card
    function renderPositionCard(position) {
        const requirementsHTML = position.requirements
            ? `<ul>${position.requirements.map(req => `<li>${req}</li>`).join('')}</ul>`
            : '';

        return `
            <div class="card" style="margin-bottom: var(--spacing-md);">
                <div class="card-header">
                    <h3 class="card-title">${position.title}</h3>
                    <span class="badge" style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: var(--border-radius); font-size: 0.85rem;">${position.type}</span>
                </div>
                <div class="card-body">
                    <p><strong>Deadline:</strong> ${position.deadline}</p>
                    <p>${position.description}</p>
                    ${position.requirements ? '<p><strong>Requirements:</strong></p>' : ''}
                    ${requirementsHTML}
                    ${position.funding ? `<p><strong>Funding:</strong> ${position.funding}</p>` : ''}
                    ${position.contact ? `<p><strong>Contact:</strong> <a href="mailto:${position.contact}">${position.contact}</a></p>` : ''}
                </div>
            </div>
        `;
    }

    // Try loading cached collaborators from OpenAlex
    async function loadCachedCollaborators() {
        try {
            const response = await fetch('/assets/data/collaborators.json');
            if (!response.ok) return null;
            const data = await response.json();
            if (data && Array.isArray(data.collaborators) && data.collaborators.length > 0) {
                return data.collaborators;
            }
            return null;
        } catch (error) {
            console.warn('Collaborators cache not available, falling back to members.json:', error.message);
            return null;
        }
    }

    // Render members
    async function renderMembers() {
        const membersData = await fetchMembers();

        if (!membersData) {
            console.error('No members data available');
            return;
        }

        const { currentMembers, alumni, collaborators } = membersData;

        // Render PhD Students
        const phdContainer = document.getElementById('phd-students-container');
        if (phdContainer && currentMembers.phdStudents && currentMembers.phdStudents.length > 0) {
            phdContainer.innerHTML = currentMembers.phdStudents.map(renderMemberCard).join('');
        } else if (phdContainer) {
            phdContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No PhD students at the moment.</p>';
        }

        // Render Bachelor Students
        const bachelorContainer = document.getElementById('bachelor-students-container');
        if (bachelorContainer && currentMembers.bachelorsStudents && currentMembers.bachelorsStudents.length > 0) {
            bachelorContainer.innerHTML = currentMembers.bachelorsStudents.map(renderMemberCard).join('');
        } else if (bachelorContainer) {
            bachelorContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No bachelor students at the moment.</p>';
        }

        // Render Alumni
        const alumniContainer = document.getElementById('alumni-container');
        if (alumniContainer && alumni && alumni.length > 0) {
            alumniContainer.innerHTML = alumni.map(renderAlumniCard).join('');
        } else if (alumniContainer) {
            alumniContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No alumni information available.</p>';
        }

        // Render Collaborators - try cached collaborators first, fall back to members.json
        const collaboratorsContainer = document.getElementById('collaborators-container');
        if (collaboratorsContainer) {
            const cachedCollaborators = await loadCachedCollaborators();
            const collabData = cachedCollaborators || collaborators;

            if (collabData && collabData.length > 0) {
                const topCollaborators = collabData.slice(0, 6);
                collaboratorsContainer.innerHTML = topCollaborators.map(renderCollaboratorCard).join('');
            } else {
                collaboratorsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No collaborators information available.</p>';
            }
        }
    }

    // Render positions
    async function renderPositions() {
        const positions = await fetchPositions();
        const container = document.getElementById('positions-container');

        if (!container) return;

        if (positions && positions.length > 0) {
            container.innerHTML = positions.map(renderPositionCard).join('');
        } else {
            container.innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <p>No open positions at the moment. However, we welcome inquiries from motivated candidates.</p>
                        <p>If you're interested in pursuing a PhD or postdoctoral position, please contact Dr Buckeridge with your CV and research interests.</p>
                        <a href="/contact.html" class="btn btn-primary mt-2">Get in Touch</a>
                    </div>
                </div>
            `;
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', async () => {
        await renderMembers();
        await renderPositions();
    });
})();
