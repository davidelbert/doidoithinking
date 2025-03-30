import { useState } from 'react';

export default function MainComponent() {
  const [doi, setDoi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [relatedDoi, setRelatedDoi] = useState('');
  const [creators, setCreators] = useState([{ firstName: '', lastName: '', affiliation: '', type: 'Person', orcid: '' }]);
  const [jsonOutput, setJsonOutput] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const startMinting = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mint-draft-doi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            publisher: 'PARADIM',
            publicationYear: new Date().getFullYear()
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to mint DOI');
      const data = await response.json();
      setDoi(data.doi);
    } catch (err) {
      setError('Failed to mint DOI. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addCreator = () => {
    setCreators([...creators, { firstName: '', lastName: '', affiliation: '', type: 'Person', orcid: '' }]);
  };

  const updateCreator = (index, field, value) => {
    const newCreators = [...creators];
    newCreators[index] = { ...newCreators[index], [field]: value };
    setCreators(newCreators);
  };

  const fetchOrcidDetails = async (orcidId, creatorIndex) => {
    if (!orcidId) return;
    
    try {
      const response = await fetch('/api/fetch-orcid-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcidId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch ORCID details');
      }

      const data = await response.json();
      
      if (data.error) {
        setError(`ORCID Error: ${data.error}`);
        return;
      }

      const newCreators = [...creators];
      const currentCreator = newCreators[creatorIndex];

      newCreators[creatorIndex] = {
        ...currentCreator,
        firstName: data.firstName || currentCreator.firstName,
        lastName: data.lastName || currentCreator.lastName,
        affiliation: data.employer || currentCreator.affiliation,
        orcid: orcidId
      };

      setCreators(newCreators);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch ORCID details. Please check the ORCID ID and try again.');
    }
  };

  const validateAndGenerateJson = async () => {
    const localValidationErrors = [];
    
    if (!title.trim()) {
      localValidationErrors.push('Title is required');
    }
    
    creators.forEach((creator, index) => {
      if (!creator.firstName.trim() || !creator.lastName.trim()) {
        localValidationErrors.push(`Creator ${index + 1} must have both first and last name`);
      }
    });

    if (localValidationErrors.length > 0) {
      setValidationErrors(localValidationErrors);
      return;
    }

    const metadata = {
      titles: [{ title }],
      creators: creators.map(c => ({
        name: `${c.lastName}, ${c.firstName}`,
        affiliation: c.affiliation ? [{ name: c.affiliation }] : [],
        nameType: c.type,
        nameIdentifiers: c.orcid ? [{
          nameIdentifier: c.orcid,
          nameIdentifierScheme: 'ORCID',
          schemeUri: 'https://orcid.org'
        }] : []
      })),
      publisher: 'PARADIM',
      publicationYear: new Date().getFullYear(),
      url: doi ? `https://data.paradim.org/doi/${doi}` : '',
      descriptions: description ? [{ description, descriptionType: 'Abstract' }] : [],
      subjects: keywords ? keywords.split(',').map(keyword => ({ subject: keyword.trim() })) : [],
      relatedIdentifiers: relatedDoi ? [{
        relatedIdentifier: relatedDoi,
        relatedIdentifierType: 'DOI',
        relationType: 'IsSupplementTo'
      }] : [],
      resourceType: {
        resourceTypeGeneral: 'Dataset',
        resourceType: 'Dataset'
      }
    };

    try {
      const validation = await fetch('/api/validate-data-cite-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata })
      });
      
      const result = await validation.json();
      
      if (result.errors) {
        setValidationErrors(result.errors);
        return;
      }
      
      setValidationErrors([]);
      setJsonOutput(JSON.stringify(metadata, null, 2));
    } catch (err) {
      setValidationErrors(['Validation failed. Please try again.']);
      console.error(err);
    }
  };

  const downloadJson = () => {
    if (!jsonOutput) return;
    
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datacite-metadata.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white dark:bg-gray-900">
      {!doi ? (
        <div className="text-center mb-8">
          <button
            onClick={startMinting}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-700 text-white font-inter px-6 py-2 rounded-md transition-colors"
          >
            {loading ? 'Minting...' : 'Start DOI Creation'}
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        <h1 className="text-2xl md:text-3xl font-bold font-inter text-gray-900 dark:text-white mb-8">
          DOI: {doi}
        </h1>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg font-inter text-gray-900 dark:text-white dark:bg-gray-800"
          />
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your dataset..."
              className="w-full p-2 border border-gray-200 rounded-lg font-inter text-gray-900 dark:text-white dark:bg-gray-800 h-32"
            />
          </div>

          <div>
            <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">Keywords</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords separated by commas"
              className="w-full p-2 border border-gray-200 rounded-lg font-inter text-gray-900 dark:text-white dark:bg-gray-800"
            />
            <p className="text-sm text-gray-500 mt-1">Enter up to 5 keywords or keyword pairs, separated by commas</p>
          </div>

          <div>
            <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">Related Publication DOI</label>
            <input
              type="text"
              value={relatedDoi}
              onChange={(e) => setRelatedDoi(e.target.value)}
              placeholder="10.XXXX/XXXXX"
              className="w-full p-2 border border-gray-200 rounded-lg font-inter text-gray-900 dark:text-white dark:bg-gray-800"
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-inter font-semibold text-gray-900 dark:text-white mb-4">Pre-populated Fields</h3>
            <div className="space-y-2">
              <div>
                <span className="font-inter text-gray-600 dark:text-gray-400">Publisher:</span>
                <span className="ml-2 font-inter text-gray-900 dark:text-white">PARADIM</span>
              </div>
              <div>
                <span className="font-inter text-gray-600 dark:text-gray-400">Publication Year:</span>
                <span className="ml-2 font-inter text-gray-900 dark:text-white">{new Date().getFullYear()}</span>
              </div>
              {doi && (
                <div>
                  <span className="font-inter text-gray-600 dark:text-gray-400">URL:</span>
                  <span className="ml-2 font-inter text-gray-900 dark:text-white">
                    https://data.paradim.org/doi/{doi}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-inter font-bold text-gray-900 dark:text-white mb-4">Creators</h2>
          {creators.map((creator, index) => (
            <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">ORCID ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={creator.orcid}
                      onChange={(e) => updateCreator(index, 'orcid', e.target.value)}
                      onBlur={() => fetchOrcidDetails(creator.orcid, index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          fetchOrcidDetails(creator.orcid, index);
                          e.target.blur();
                        }
                      }}
                      placeholder="https://orcid.org/0000-0000-0000-0000"
                      className="flex-1 p-2 border border-gray-200 rounded-lg font-inter"
                    />
                    <button
                      onClick={() => fetchOrcidDetails(creator.orcid, index)}
                      disabled={!creator.orcid}
                      className="bg-gray-900 hover:bg-gray-700 text-white font-inter px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Fetch Details
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">First Name</label>
                  <input
                    type="text"
                    value={creator.firstName}
                    onChange={(e) => updateCreator(index, 'firstName', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">Last Name</label>
                  <input
                    type="text"
                    value={creator.lastName}
                    onChange={(e) => updateCreator(index, 'lastName', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg font-inter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">Affiliation</label>
                  <input
                    type="text"
                    value={creator.affiliation}
                    onChange={(e) => updateCreator(index, 'affiliation', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg font-inter"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">Type</label>
                  <div className="space-x-4">
                    {['Person', 'Organization', 'Unknown'].map((type) => (
                      <label key={type} className="inline-flex items-center">
                        <input
                          type="radio"
                          checked={creator.type === type}
                          onChange={() => updateCreator(index, 'type', type)}
                          className="mr-2"
                        />
                        <span className="font-inter text-gray-900 dark:text-white">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addCreator}
            className="border border-gray-200 text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white font-inter px-4 py-2 rounded-md transition-colors"
          >
            Add Another Creator
          </button>
        </div>

        <div className="mt-8">
          <button
            onClick={validateAndGenerateJson}
            className="bg-gray-900 hover:bg-gray-700 text-white font-inter px-6 py-2 rounded-md transition-colors"
          >
            Generate DataCite JSON
          </button>

          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
              <ul className="list-disc pl-4">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-red-600 dark:text-red-400">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {jsonOutput && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-inter font-semibold text-gray-900 dark:text-white">JSON Output</h3>
                <button
                  onClick={downloadJson}
                  className="bg-gray-900 hover:bg-gray-700 text-white font-inter px-4 py-2 rounded-md transition-colors"
                >
                  Download JSON
                </button>
              </div>
              <textarea
                readOnly
                value={jsonOutput}
                className="w-full h-64 p-4 font-mono text-sm border border-gray-200 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}