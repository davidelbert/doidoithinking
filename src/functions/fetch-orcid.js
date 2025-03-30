// Add this function in src/functions/fetch-orcid.js
async function handler({ orcid }) {
    try {
      const response = await fetch(`https://pub.orcid.org/v3.0/${orcid}/person`, {
        headers: {
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        return { error: 'Invalid ORCID ID' };
      }
  
      const data = await response.json();
      return {
        firstName: data.name?.['given-names']?.value || '',
        lastName: data.name?.['family-name']?.value || '',
        affiliation: data.employments?.['affiliation-group']?.[0]?.summaries?.[0]?.['employment-summary']?.organization?.name || ''
      };
    } catch (error) {
      return { error: 'Failed to fetch ORCID data' };
    }
  }