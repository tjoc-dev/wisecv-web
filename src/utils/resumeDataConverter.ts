/**
 * Utility functions for converting between different resume data formats
 * to ensure no data is lost during the improvement and generation process.
 */

export interface ResumeSections {
  summary: string;
  experience: any[];
  education: any[];
  skills: any[];
  projects: any[];
  certifications: any[];
}

export interface Suggestion {
  id: string;
  section: string;
  type: string;
  original: any;
  suggested: any;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

type ParsedData = {
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: Skills;
  projects: ProjectItem[];
  certifications: CertificationItem[];
};

type ExperienceItem = {
  title: string;
  body: string;
};

type EducationItem = {
  school: string;
  degree: string;
  duration: string;
};

type Skills = {
  languages: string[];
  frameworks: string[];
  databases: string[];
  devops: string[];
  methodologies: string[];
  architecture: string[];
  tools: string[];
  other: string[];
};

type ProjectItem = {
  title: string;
  description: string;
};

type CertificationItem = {
  title: string;
  issuer: string;
  year: string;
};

/**
 * Converts accepted suggestions directly to structured resume data
 * without losing information through text conversion.
 */
export function convertSuggestionsToStructuredData(
  suggestions: Suggestion[],
  acceptedSuggestionIds: string[]
): ResumeSections {
  const structuredData: ResumeSections = {
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  };

  // Group suggestions by section and process additions/removals
  const sectionData: { [key: string]: { additions: any[], removals: any[], replacements: any[] } } = {};
  
  suggestions.forEach(suggestion => {
    const sectionKey = suggestion.section.toLowerCase();
    
    // Initialize section data if it doesn't exist
    if (!sectionData[sectionKey]) {
      sectionData[sectionKey] = { additions: [], removals: [], replacements: [] };
    }
    
    // Only process accepted suggestions
    if (acceptedSuggestionIds.includes(suggestion.id)) {
      if (suggestion.type === 'addition' && suggestion.suggested) {
        sectionData[sectionKey].additions.push(suggestion.suggested);
      } else if (suggestion.type === 'removal' && suggestion.original) {
        sectionData[sectionKey].removals.push(suggestion.original);
      } else if (suggestion.type === 'improvement' || suggestion.type === 'replace') {
        sectionData[sectionKey].replacements.push(suggestion.suggested);
      }
    }
  });

  // Map section data to structured format
  Object.entries(sectionData).forEach(([section, data]) => {
    const { additions, removals, replacements } = data;
    
    // Combine all content for the section
    let finalContent: any[] = [];
    
    // Add replacements first (these are complete section updates)
    if (replacements.length > 0) {
      finalContent = replacements.flatMap(content => 
        Array.isArray(content) ? content : [content]
      );
    }
    
    // Add new additions
    if (additions.length > 0) {
      finalContent = finalContent.concat(additions.flatMap(content => 
        Array.isArray(content) ? content : [content]
      ));
    }
    
    // Filter out removals (if any)
    if (removals.length > 0) {
      const removalTexts = removals.map(r => typeof r === 'string' ? r : JSON.stringify(r));
      finalContent = finalContent.filter(item => {
        const itemText = typeof item === 'string' ? item : JSON.stringify(item);
        return !removalTexts.some(removal => itemText.includes(removal));
      });
    }
    
    // Apply to structured data based on section type
    switch (section) {
      case 'summary':
      case 'profile':
      case 'about':
      case 'objective':
        structuredData.summary = normalizeToString(finalContent);
        break;
      case 'experience':
      case 'work experience':
      case 'employment':
        structuredData.experience = normalizeToStructuredArray(finalContent);
        break;
      case 'education':
        structuredData.education = normalizeToStructuredArray(finalContent);
        break;
      case 'skills':
        structuredData.skills = normalizeToStructuredArray(finalContent);
        break;
      case 'projects':
        structuredData.projects = normalizeToStructuredArray(finalContent);
        break;
      case 'certifications':
      case 'certificates':
        structuredData.certifications = normalizeToStructuredArray(finalContent);
        break;
    }
  });
  
  return structuredData;
}

export function parseFormattedText(text: string): ParsedData {
  // Add safety check for undefined/null text
  if (!text || typeof text !== 'string') {
    return {
      summary: '',
      experience: [],
      education: [],
      skills: {},
      projects: [],
      certifications: []
    } as ParsedData;
  }
  
  const sections = text.split(/\n(?=[A-Z ]+:)/g);

  const result: Partial<ParsedData> = {};

  for (const section of sections) {
    const [headerLine, ...rest] = section.trim().split('\n');
    const sectionName = headerLine.replace(':', '').toUpperCase();
    const content = rest.join('\n').trim();

    switch (sectionName) {
      case 'SUMMARY':
        result.summary = content;
        break;

      case 'EXPERIENCE':
        if (content) {
          result.experience = content.split('\n\n').map(entry => {
            const [title, ...bodyLines] = entry.trim().split('\n');
            return {
              title: title?.trim() || '',
              body: bodyLines.join('\n').trim()
            };
          });
        } else {
          result.experience = [];
        }
        break;

      case 'EDUCATION':
        if (content) {
          result.education = content.split('\n\n').map(entry => {
            const parts = entry.split(' - ');
            return {
              school: parts[0]?.trim() || '',
              degree: parts[1]?.trim() || '',
              duration: parts.slice(2).join(' - ').trim()
            };
          });
        } else {
          result.education = [];
        }
        break;

      case 'SKILLS':
        if (content) {
          result.skills = Object.fromEntries(
            content.split('\n').map(line => {
              const [category, values] = line.split(':');
              return [category?.trim().toLowerCase() || 'other', values?.split(',').map(v => v.trim()) || []];
            })
          ) as Skills;
        } else {
          result.skills = {
            languages: [],
            frameworks: [],
            databases: [],
            devops: [],
            methodologies: [],
            architecture: [],
            tools: [],
            other: []
          };
        }
        break;

      case 'PROJECTS':
        if (content) {
          result.projects = content.split('\n\n').map(entry => {
            const [title, ...desc] = entry.trim().split(' - ');
            return {
              title: title?.trim() || '',
              description: desc.join(' - ').trim()
            };
          });
        } else {
          result.projects = [];
        }
        break;

      case 'CERTIFICATIONS':
        if (content) {
          result.certifications = content.split('\n\n').map(entry => {
            const [title, issuer, year] = entry.trim().split(' - ');
            return {
              title: title?.trim() || '',
              issuer: issuer?.trim() || '',
              year: year?.trim() || ''
            };
          });
        } else {
          result.certifications = [];
        }
        break;

      default:
        break;
    }
  }

  return result as ParsedData;
}

/**
 * Converts accepted suggestions to a structured object for backend storage
 */
export function convertSuggestionsToAcceptedData(
  suggestions: Suggestion[],
  acceptedSuggestionIds: string[]
): Record<string, any> {
  const acceptedData: Record<string, any> = {};
  
  // Group accepted suggestions by section
  const sectionGroups: { [key: string]: Suggestion[] } = {};
  
  acceptedSuggestionIds.forEach(suggestionId => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      const sectionKey = suggestion.section.toLowerCase();
      if (!sectionGroups[sectionKey]) {
        sectionGroups[sectionKey] = [];
      }
      sectionGroups[sectionKey].push(suggestion);
    }
  });
  
  // Process each section's suggestions
  Object.entries(sectionGroups).forEach(([section, sectionSuggestions]) => {
    const additions = sectionSuggestions
      .filter(s => s.type === 'addition')
      .map(s => s.suggested)
      .filter(Boolean);
    
    const replacements = sectionSuggestions
      .filter(s => s.type === 'improvement' || s.type === 'replace')
      .map(s => s.suggested)
      .filter(Boolean);
    
    // For backend storage, combine all accepted content
    if (replacements.length > 0) {
      acceptedData[section] = replacements.length === 1 ? replacements[0] : replacements;
    } else if (additions.length > 0) {
      acceptedData[section] = additions.length === 1 ? additions[0] : additions;
    }
  });
  
  return acceptedData;
}

/**
 * Normalizes content to a string format
 */
function normalizeToString(content: any): string {
  if (!content) return '';
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        // Handle structured objects like experience entries
        if (item.title && item.company) {
          return `${item.title} at ${item.company} (${item.dates || 'Present'})\n${item.description || ''}`;
        }
        // Handle other object types
        return Object.values(item).filter(v => v).join(' - ');
      }
      return String(item);
    }).join('\n\n');
  }
  
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  }
  
  return String(content);
}

/**
 * Normalizes content to a structured array format, preserving object structure
 */
export function normalizeToStructuredArray(content: any): any[] {
  if (!content) return [];
  
  // If already an array, check if it contains a broken JSON string that needs reconstruction
  if (Array.isArray(content)) {
    // Check if the array contains what looks like a broken JSON string
    if (content.length > 0 && typeof content[0] === 'string' && content[0].includes('{')) {
      // Try to reconstruct the JSON string from array elements
      const reconstructed = content.join('');
      try {
        const parsed = JSON.parse(reconstructed);
        if (typeof parsed === 'object' && parsed !== null) {
          return [parsed];
        }
      } catch {
        // If reconstruction fails, try joining with spaces
        try {
          const reconstructedWithSpaces = content.join(' ');
          const parsed = JSON.parse(reconstructedWithSpaces);
          if (typeof parsed === 'object' && parsed !== null) {
            return [parsed];
          }
        } catch {
          // If still fails, return the original array
        }
      }
    }
    // Return the array as-is to preserve structure
    return content;
  }
  
  // If it's a string, try to parse as JSON first
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      // If parsed successfully, handle the result
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // If it's an object (like structured skills), return as array
      if (typeof parsed === 'object' && parsed !== null) {
        return [parsed];
      }
      // If it's a primitive, wrap in array
      return [parsed];
    } catch {
      // If JSON parsing fails, check if it looks like a JSON string that got corrupted
      if (content.includes('{') && content.includes('}')) {
        // Try to clean up the JSON string and parse again
        try {
          const cleanedContent = content.replace(/\n/g, '').replace(/\"/g, '"');
          const parsed = JSON.parse(cleanedContent);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          if (typeof parsed === 'object' && parsed !== null) {
            return [parsed];
          }
        } catch {
          // Still failed, fall through to string splitting
        }
      }
      
      // If JSON parsing fails, split by common delimiters and return as strings
      return content
        .split(/\n|\r\n|•|\*|-|;/)
        .map(item => item.trim())
        .filter(item => 
          item.length > 0 && 
          !item.match(/^(experience|education|skills|projects|certifications):?$/i) &&
          !item.match(/^\d+\.$/) // Remove numbered list markers
        );
    }
  }
  
  // For other types, wrap in array
  return [content];
}


/**
 * Generates final resume text from suggestions with accepted changes applied
 */
export function generateFinalResumeText(
  suggestions: Suggestion[],
  acceptedSuggestionIds: string[]
): string {
  if (!suggestions || suggestions.length === 0) return '';
  
  // Use the structured data conversion to get properly formatted content
  const structuredData = convertSuggestionsToStructuredData(suggestions, acceptedSuggestionIds);
  
  // Convert structured data back to text format
  const sections: string[] = [];
  
  if (structuredData.summary) {
    sections.push(`SUMMARY:\n${structuredData.summary}`);
  }
  
  if (structuredData.experience.length > 0) {
    const experienceText = structuredData.experience.map(exp => {
      if (typeof exp === 'object' && exp.title && exp.company) {
        return `${exp.title} at ${exp.company} (${exp.dates || 'Present'})\n${exp.description || ''}`;
      }
      return typeof exp === 'string' ? exp : JSON.stringify(exp);
    }).join('\n\n');
    sections.push(`EXPERIENCE:\n${experienceText}`);
  }
  
  if (structuredData.education.length > 0) {
    const educationText = structuredData.education.map(edu => {
      if (typeof edu === 'object' && edu.degree && edu.institution) {
        return `${edu.degree} from ${edu.institution} (${edu.year || 'Present'})`;
      }
      return typeof edu === 'string' ? edu : JSON.stringify(edu);
    }).join('\n\n');
    sections.push(`EDUCATION:\n${educationText}`);
  }
  
  if (structuredData.skills.length > 0) {
    const skillsText = structuredData.skills.map(skill => 
      typeof skill === 'string' ? skill : JSON.stringify(skill)
    ).join(', ');
    sections.push(`SKILLS:\n${skillsText}`);
  }
  
  if (structuredData.projects.length > 0) {
    const projectsText = structuredData.projects.map(proj => {
      if (typeof proj === 'object' && proj.name) {
        return `${proj.name}: ${proj.description || ''}`;
      }
      return typeof proj === 'string' ? proj : JSON.stringify(proj);
    }).join('\n\n');
    sections.push(`PROJECTS:\n${projectsText}`);
  }
  
  if (structuredData.certifications.length > 0) {
    const certificationsText = structuredData.certifications.map(cert => {
      if (typeof cert === 'object' && cert.name) {
        return `${cert.name} - ${cert.issuing_organization || ''} (${cert.date || ''})`;
      }
      return typeof cert === 'string' ? cert : JSON.stringify(cert);
    }).join('\n\n');
    sections.push(`CERTIFICATIONS:\n${certificationsText}`);
  }
  
  return sections.join('\n\n');
}