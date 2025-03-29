async function handler({ metadata }) {
    const DATACITE_API_URL = 'https://api.datacite.org/dois';
    const DATACITE_USERNAME = process.env.DATACITE_USERNAME;
    const DATACITE_PASSWORD = process.env.DATACITE_PASSWORD;
    const DATACITE_PREFIX = process.env.DATACITE_PREFIX;
  
    const credentials = Buffer.from(`${DATACITE_USERNAME}:${DATACITE_PASSWORD}`).toString('base64');
  
    try {
      const response = await fetch(DATACITE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({
          data: {
            type: 'dois',
            attributes: {
              prefix: DATACITE_PREFIX,
              event: 'draft',
              ...metadata
            }
          }
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        return { error: error.errors?.[0]?.detail || 'Failed to mint DOI' };
      }
  
      const data = await response.json();
      return {
        doi: data.data.attributes.doi,
        url: data.data.attributes.url
      };
    } catch (error) {
      return { error: 'Failed to connect to DataCite API' };
    }
  }