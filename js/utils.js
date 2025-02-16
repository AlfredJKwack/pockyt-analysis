/**
 * Loads and parses a JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} - JSON data object
 * @throws {Error} On HTTP or parsing errors
 */
export async function loadJsonFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading JSON file:', error);
        throw error;
    }
}

/**
 * Preprocesses raw data into a standardized format with id, title, tags, time_added, and link.
 * @param {Object[]} data - Raw data array
 * @returns {Object[]} Processed and sorted data array
 */
export function preprocessData(data) {
    return data
        .filter(item => item.time_added)
        .map(item => ({
            id: item.id,
            title: item.title,
            tags: item.tags || [],
        time_added: new Date(item.time_added * 1000),
        link: item.link
        }))
        .sort((a, b) => b.time_added - a.time_added);
}

/**
 * Updates the displayed list of items based on tag selection
 * @param {string[]} selectedTags - Array of selected tag names
 * @param {Object[]} data - Processed data array
 */
export function updateList(selectedTags, data) {
    // Filter items based on selected tags
    let filteredItems;
    if (selectedTags && selectedTags.length > 0) {
        // Check if all selected tags are the same
        const allSameTags = selectedTags.every(tag => tag === selectedTags[0]);

        if (allSameTags && selectedTags.length > 1) {
            // If all selected tags are the same, find items with ONLY that tag
            filteredItems = data.filter(item =>
                item.tags.length === 1 && item.tags[0] === selectedTags[0]
            );
        } else {
            // Original filtering logic for different tags
            filteredItems = data.filter(item =>
                selectedTags.every(tag => item.tags.includes(tag))
            );
        }
    } else {
        filteredItems = data;
    }

    // Update the bootstrap table with filtered data
    $('#fresh-table').bootstrapTable('load', filteredItems);
}

/**
 * Visually shortens a URL to a maximum length
 * @param {string} url - The URL to shorten
 * @param {number} maxLength - The maximum length of the shortened URL
 * @returns {string} - The shortened URL
 */
export function visuallyShortenURL(url, maxLength = 50) {
    if (url.length <= maxLength) {
        return url;
    }

    // Extract the domain and the end of the URL
    const domainEndIndex = url.indexOf('/', url.indexOf('://') + 3);
    if (domainEndIndex === -1) {
        return url;
    }

    const domain = url.substring(0, domainEndIndex);
    const path = url.substring(domainEndIndex);

    // Shorten the path if it's too long
    if (path.length > maxLength - domain.length - 3) {
        const middleLength = maxLength - domain.length - 3 - 5; // 5 for ".../" at the end
        const shortenedPath = path.substring(0, middleLength / 2) + '...' + path.substring(path.length - middleLength / 2);
        return domain + shortenedPath;
    }

    return url;
}

/**
 * Analyzes tag co-occurrence in the dataset
 * @param {Object[]} data - Processed data array
 * @returns {Object[]} Array of tag pairs and their co-occurrence counts
 */
export function analyzeTagCooccurrence(data) {
    const pairs = [];
    data.forEach(item => {
        if (Array.isArray(item.tags)) {
            const sortedTags = item.tags.sort();

            // Add individual occurrences only if it's a single tag
            if (sortedTags.length === 1) {
                pairs.push([sortedTags[0], sortedTags[0]]);
            }

            for (let i = 0; i < sortedTags.length; i++) {
                for (let j = i + 1; j < sortedTags.length; j++) {
                    pairs.push([sortedTags[i], sortedTags[j]]);
                }
            }
        } else {
            console.error("Item tags are not an array:", item);
        }
    });

    const cooccurrenceCounts = pairs.reduce((acc, pair) => {
        const key = pair.join('|');
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(cooccurrenceCounts).map(([key, count]) => {
        const [tag1, tag2] = key.split('|');
        return { Tag1: tag1, Tag2: tag2, Cooccurrence: count };
    });
}

/**
 * Generates a matrix of tag co-occurrences
 * @param {Object[]} cooccurrenceData - Co-occurrence data
 * @param {boolean} orderByTagCount - Whether to order by tag count or tag name
 * @returns {Object} Matrix of tag co-occurrences
 */
export function generateCooccurrenceMatrix(cooccurrenceData, orderByTagCount = false) {
    // Create initial matrix
    const matrix = {};
    cooccurrenceData.forEach(({ Tag1, Tag2, Cooccurrence }) => {
        if (!matrix[Tag1]) matrix[Tag1] = {};
        if (!matrix[Tag2]) matrix[Tag2] = {};

        // Avoid double-counting self-references in the matrix
        if (Tag1 === Tag2) {
            matrix[Tag1][Tag2] = (matrix[Tag1][Tag2] || 0) + Cooccurrence;
        } else {
            matrix[Tag1][Tag2] = (matrix[Tag1][Tag2] || 0) + Cooccurrence;
            matrix[Tag2][Tag1] = (matrix[Tag2][Tag1] || 0) + Cooccurrence;
        }
    });

    let sortedTags;

    if (orderByTagCount) {
        // Order by total tag count
        const tagCounts = {};
        cooccurrenceData.forEach(({ Tag1, Tag2, Cooccurrence }) => {
            tagCounts[Tag1] = (tagCounts[Tag1] || 0) + Cooccurrence;
            if (Tag1 !== Tag2) { // Only add Tag2 count if it's not a self-reference
                tagCounts[Tag2] = (tagCounts[Tag2] || 0) + Cooccurrence;
            }
        });
        sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]); // Sort descending
    } else {
        // Order alphabetically
        sortedTags = Object.keys(matrix).sort();
    }

    // Create ordered matrix
    const orderedMatrix = {};

    sortedTags.forEach(tag1 => {
        orderedMatrix[tag1] = {};
        sortedTags.forEach(tag2 => {
            orderedMatrix[tag1][tag2] = matrix[tag1][tag2] || 0;
        });
    });

    return orderedMatrix;
}