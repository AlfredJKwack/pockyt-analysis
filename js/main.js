
import { createController } from "./dat-gui.js";
import { 
    loadJsonFile,
    preprocessData, 
    updateList, 
    visuallyShortenURL,
    analyzeTagCooccurrence,
    generateCooccurrenceMatrix
} from "./utils.js";
import {
    visualizeCooccurrenceMatrix,
    visualizeArcDiagram,
    visualizeStreamgraph
} from "./d3-visualizations.js";
import {
    positionPopup,
    dismissPopupPermanently,
    shouldShowPopup
} from "./tutorial.js";

/**
 * Main function for this application
 */
window.addEventListener('load', () => {
    loadJsonFile('pocket-data.json')
        .then(data => {
            const preprocessedData = preprocessData(data);
            updateList(null, preprocessedData); // Initialize the list with all items

            // load up the table
            var $table = $('#fresh-table')
            $table.bootstrapTable({
                data: preprocessedData,
                classes: 'table table-hover table-striped',
                search: true,
                searchAlign: 'left',
                pagination: true,
                striped: true,
                sortable: true,
                showExport: true,
                export: 'bi-download',
                exportDataType: 'all',
                exportTypes: ['json', 'xml', 'csv', 'txt', 'sql', 'excel', 'pdf'],
                pageSize: parseInt(localStorage.getItem('pockytTablePageSize')) || 10,               
                pageList: [10, 25, 50, 100],
                formatShowingRows: function (pageFrom, pageTo, totalRows) {
                    return ''
                },
                formatRecordsPerPage: function (pageNumber) {
                    return pageNumber + ' rows visible'
                },
                columns: [{
                    field: 'time_added',
                    title: 'Date Added',
                    sortable: true,
                    sortName: 'time_added',
                    sorter: function(a, b) {
                        return a.getTime() - b.getTime();
                    },
                    formatter: function(value) {
                        return value.toLocaleDateString('en-GB', {
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric'
                        }).replace(/ /g, '-');
                    }
                }, {
                    field: 'link',
                    title: 'Link',
                    sortable: true,
                    formatter: function(value, row) {
                        let displayText = row.title || "No Title";
                        if (displayText === value) {
                            displayText = visuallyShortenURL(value, 50);
                        }
                        return `<a href="${value}" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                title="${value}"
                                class="text-decoration-none">
                                ${displayText}
                                <i class="bi bi-box-arrow-up-right ms-1"></i>
                                </a>`;
                    }
                }, {
                    field: 'tags',
                    title: 'Tags',
                    sortable: true,
                    formatter: function(value) {
                        if (!Array.isArray(value)) return '';
                        
                        // Get tag frequencies from the current filtered data
                        const tagFrequencies = {};
                        $('#fresh-table').bootstrapTable('getData').forEach(item => {
                            item.tags.forEach(tag => {
                                tagFrequencies[tag] = (tagFrequencies[tag] || 0) + 1;
                            });
                        });

                        // Sort tags by frequency
                        const sortedTags = [...value].sort((a, b) => 
                            tagFrequencies[b] - tagFrequencies[a]
                        );

                        return sortedTags.map(tag => 
                            `<span class="ms-1 badge rounded-pill text-bg-success">${tag}</span>`
                        ).join('');
                    }
                }]
            });

            // Store bootstrap table page size changes
            $table.on('page-change.bs.table', function(e, pageNumber, pageSize) {
                localStorage.setItem('pockytTablePageSize', pageSize);
            });             

            const cooccurrenceData = analyzeTagCooccurrence(preprocessedData);
            const cooccurrenceMatrix = generateCooccurrenceMatrix(cooccurrenceData);
            
            // Initialize controller with modified behavior
            const params = {
                // Arc Diagram Parameters
                arcDiagramColorScheme: 'interpolateViridis',
                arcDiagramWidth: Math.min(
                    document.querySelector('.visualization').getBoundingClientRect().width, 
                    window.innerHeight
                ),
                arcDiagramClampColorScaleMax: 0.80,
                arcDiagramDefaultStrokeOpacity: 0.5,
                arcDiagramDimmedStrokeOpacity: 0.05,
                arcDiagramCurveBundleBeta: 0.3,
                // Heatmap Parameters
                heatmapCellColorScheme: 'interpolateGreens',
                heatmapSumColorScheme: 'interpolateOranges',
                // Streamgraph Parameters
                streamgraphColorScheme: 'interpolateSpectral',
                streamgraphWidth: Math.max(600, window.innerWidth*0.8),
                streamgraphHeight: Math.max(600, window.innerHeight*0.8),
                redraw: function() {
                    const activeTab = document.querySelector('.nav-link.active').getAttribute('id');
                    if (activeTab === 'arc-diagram-tab') {
                        d3.select("#arc-diagram svg").remove();
                        visualizeArcDiagram(cooccurrenceMatrix, preprocessedData, params);
                    } else if (activeTab === 'heatmap-tab') {
                        d3.select("#heatmap svg").remove();
                        visualizeCooccurrenceMatrix(cooccurrenceMatrix, preprocessedData, params);
                    } else if (activeTab === 'streamgraph-tab') {
                        d3.select("#streamgraph svg").remove();
                        visualizeStreamgraph(cooccurrenceMatrix, preprocessedData, params);
                    } else {
                        console.error('Unknown tab:', activeTab);
                    }
                }
            };

            // Create the GUI controller only if debug parameter is present in URL
            const urlParams = new URLSearchParams(window.location.search);
            const gui = urlParams.has('debug') ? createController(params) : null;

            // Add Bootstrap tab event listeners
            const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
            tabElements.forEach(tab => {
                tab.addEventListener('shown.bs.tab', (event) => {
                    params.redraw(event.target.id);
                });
            });

            // Initial drawing of the active tab
            params.redraw();

            // Tutorial popup handling
            const popup = document.querySelector('.tutorial-popup');
    
            // Only show popup if user hasn't dismissed it before
            console.log("shouldShowPopup", shouldShowPopup());
            if (!shouldShowPopup()) {
                popup.style.display = 'none';
            } else {
                console.log("positionPopup");
                positionPopup()
            }
            
            // Add click handler to dismiss button/popup
            popup.addEventListener('click', dismissPopupPermanently);        

        })
        .catch(error => console.error(error));
});



// Call on window resize
window.addEventListener('resize', positionPopup);

