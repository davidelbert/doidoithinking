import { useState } from 'react';

function MainComponent() {
    {creators.map((creator, index) => (
        <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-inter text-gray-900 dark:text-white mb-2">ORCID ID</label>
              <input
                type="text"
                value={creator.orcid}
                onChange={async (e) => {
                  updateCreator(index, 'orcid', e.target.value);
                  // Only fetch if we have a complete ORCID ID
                  if (e.target.value.match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/)) {
                    const response = await fetch('/api/fetch-orcid', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orcid: e.target.value })
                    });
                    const data = await response.json();
                    if (!data.error) {
                      updateCreator(index, 'firstName', data.firstName);
                      updateCreator(index, 'lastName', data.lastName);
                      updateCreator(index, 'affiliation', data.affiliation);
                    }
                  }
                }}
                placeholder="0000-0000-0000-0000"
                className="w-full p-2 border border-gray-200 rounded-lg font-inter"
              />
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
            <div>
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
      
      {/* Update the JSON output section */}
      {jsonOutput && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-inter font-semibold">JSON Output</h3>
            <button
              onClick={downloadJson}
              className="bg-gray-900 hover:bg-gray-700 text-white font-inter px-4 py-2 rounded-md transition-colors"
            >
              Download JSON
            </button>
          </div>
          <div className="relative">
            <textarea
              readOnly
              value={jsonOutput}
              className="w-full h-64 p-4 font-mono text-sm border border-gray-200 rounded-lg dark:bg-gray-800 dark:text-white overflow-auto"
            />
          </div>
        </div>
      )}
}

export default MainComponent;