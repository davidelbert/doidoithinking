async function handler({ metadata }) {
    const requiredFields = [
      'titles',
      'creators',
      'publisher',
      'publicationYear',
      'resourceType'
    ];
  
    const errors = [];
  
    if (!metadata) {
      return { error: 'No metadata provided' };
    }
  
    for (const field of requiredFields) {
      if (!metadata[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  
    if (metadata.titles) {
      if (!Array.isArray(metadata.titles) || metadata.titles.length === 0) {
        errors.push('Titles must be a non-empty array');
      } else {
        const invalidTitles = metadata.titles.filter(title => !title.title || typeof title.title !== 'string');
        if (invalidTitles.length > 0) {
          errors.push('Each title must have a non-empty title property');
        }
      }
    }
  
    if (metadata.creators) {
      if (!Array.isArray(metadata.creators) || metadata.creators.length === 0) {
        errors.push('Creators must be a non-empty array');
      } else {
        const invalidCreators = metadata.creators.filter(creator => 
          !creator.name && (!creator.givenName || !creator.familyName)
        );
        if (invalidCreators.length > 0) {
          errors.push('Each creator must have either a name or both givenName and familyName');
        }
      }
    }
  
    if (metadata.publicationYear) {
      const year = parseInt(metadata.publicationYear);
      if (isNaN(year) || year.toString() !== metadata.publicationYear.toString() || year < 1000 || year > 9999) {
        errors.push('Publication year must be a four-digit year');
      }
    }
  
    if (metadata.resourceType && (!metadata.resourceType.resourceTypeGeneral || !metadata.resourceType.resourceType)) {
      errors.push('ResourceType must include both resourceTypeGeneral and resourceType');
    }
  
    if (metadata.identifiers) {
      if (!Array.isArray(metadata.identifiers)) {
        errors.push('Identifiers must be an array');
      } else {
        const invalidIdentifiers = metadata.identifiers.filter(id => !id.identifier || !id.identifierType);
        if (invalidIdentifiers.length > 0) {
          errors.push('Each identifier must have both identifier and identifierType');
        }
      }
    }
  
    if (errors.length > 0) {
      return { errors };
    }
  
    return { valid: true };
  }