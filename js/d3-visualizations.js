import { 
    updateList
} from "./utils.js";

/**
 * Creates an interactive heatmap visualization of tag co-occurrences
 * @param {Object} matrix - Co-occurrence matrix
 * @param {Object[]} preprocessedData - Processed data array
 */
export function visualizeCooccurrenceMatrix(matrix, preprocessedData, GUIparams) {
    const tags = Object.keys(matrix);
    const margin = { top: 80, right: 100, bottom: 100, left: 80 };
    const size = 800;
    const innerSize = size - margin.left - margin.right;
    const cellSize = innerSize / (tags.length + 1);
    const heatmapSumColorScheme = GUIparams.heatmapSumColorScheme;
    const heatmapCellColorScheme = GUIparams.heatmapCellColorScheme;

    const svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", size)
        .attr("height", size);

    // Helper function to create axis tag labels
    function createAxisLabels(svg, tags, cellSize, margin, isXAxis) {
        // stuff for both axis
        const labelGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        const labelsData = [...tags, "Sum"];
        const labels = labelGroup.selectAll(isXAxis ? ".x-label" : ".y-label")
            .data(labelsData)
            .enter().append("text")
            .attr("class", isXAxis ? "x-label" : "y-label")
            .text(d => d);

        // stuff for x axis
        if (isXAxis) {
            labels
                .attr("x", (d, i) => (i * cellSize) + cellSize/2)
                .attr("y", -10)
                .attr("text-anchor", "start")
                .attr("transform", (d, i) => {
                    const x = (i * cellSize) + cellSize/2;
                    return `rotate(-45, ${x}, -10)`;
                });

        // stuff for y axis
        } else {
            labels
                .attr("x", -10)
                .attr("y", (d, i) => (i * cellSize) + cellSize/2)
                .attr("text-anchor", "end")
                .attr("alignment-baseline", "middle");
        }

        return labels;
    }

    // Create x and y axis labels
    const xLabels = createAxisLabels(svg, tags, cellSize, margin, true);
    const yLabels = createAxisLabels(svg, tags, cellSize, margin, false);

    // Count entries with the tag in preprocessedData array
    // the matrix contains pair counts but not items with tag counts (and pairs are not triplets etc)
    const axisSums = tags.map(tag1 =>
        preprocessedData.filter(item => item.tags.includes(tag1)).length
    );

    // Create matrix color scales
    const maxValue = d3.max(tags.flatMap(tag1 =>
        tags.map(tag2 => matrix[tag1][tag2] || 0)
    ));

    // Update color scales to use params
    const sumColorScale = d3.scaleSequential(d3[heatmapSumColorScheme])
        .domain([0, d3.max(axisSums)]);

    const cellColorScale = d3.scaleSequential(d3[heatmapCellColorScheme])
        .domain([0, maxValue]);

    const highlightColorScale = d3.scaleSequential(d3[heatmapCellColorScheme])
        .domain([0, maxValue]);

    const cellData = [
        // Original matrix data
        ...tags.flatMap((tag1, i) =>
            tags.map((tag2, j) => ({
                tag1,
                tag2,
                value: matrix[tag1][tag2] || 0,
                x: j,
                y: i,
                isSum: false
            }))
        ),
        // Row sums
        ...tags.map((tag, i) => ({
            tag1: tag,
            tag2: 'Sum',
            value: axisSums[i],
            x: tags.length,
            y: i,
            isSum: true
        })),
        // Column sums
        ...tags.map((tag, i) => ({
            tag1: 'Sum',
            tag2: tag,
            value: axisSums[i],
            x: i,
            y: tags.length,
            isSum: true
        })),
        // Total sum cell
        {
            tag1: 'Sum',
            tag2: 'Sum',
            value: d3.sum(axisSums),
            x: tags.length,
            y: tags.length,
            isSum: true
        }
    ];

    const heatmapGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add the 2D array data to the cells
    const cells = heatmapGroup.selectAll(".cell")
        .data(cellData)
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => d.x * cellSize)
        .attr("y", d => d.y * cellSize)
        .attr("width", d => (d.tag2 === 'Sum' && d.tag1 !== 'Sum')  ? Math.max(10, Math.round(Math.log(d.value + 1) * 10)) + 'px' : cellSize)
        .attr("height", d => (d.tag1 === 'Sum' && d.tag2 !== 'Sum') ? Math.max(10, Math.round(Math.log(d.value + 1) * 10)) + 'px' : cellSize)
        .style("fill", d => d.isSum ? sumColorScale(d.value) : cellColorScale(d.value))
        .on("click", (event, d) => {
            if (d.value > 0) {  // Only process clicks on cells with values greater than 0
                let selectedTags = [];
                if (d.tag1 === 'Sum' && d.tag2 === 'Sum') {
                    // Clicking total sum cell shows all items
                    selectedTags = [];
                } else if (d.tag1 === 'Sum') {
                    // Clicking column sum shows items with that tag
                    selectedTags = [d.tag2];
                } else if (d.tag2 === 'Sum') {
                    // Clicking row sum shows items with that tag
                    selectedTags = [d.tag1];
                } else {
                    // Clicking regular cell shows items with both tags
                    selectedTags = [d.tag1, d.tag2];
                }

                updateList(selectedTags, preprocessedData);
            }
        });

    // Add the text labels to the cells where necessary
    const texts = heatmapGroup.selectAll(".cell-value")
        .data(cellData)
        .enter().append("text")
        .attr("class", "cell-value")
        .attr("x", d => (d.x + 0.5) * cellSize)
        .attr("y", d => (d.y + 0.5) * cellSize)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", d => {
            // Ensure text color contrasts with background color
            const backgroundColor = d.isSum ? sumColorScale(d.value) : cellColorScale(d.value);
            const rgb = d3.color(backgroundColor).rgb();
            const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
            return luminance > 180 ? "black" : "white";
        })
        .text(d => d.value > 0 ? d.value : '')
        .on("click", (event, d) => {
            if (d.value > 0) {  // Only process clicks on cells with values greater than 0
                let selectedTags = [];
                if (d.tag1 === 'Sum' && d.tag2 === 'Sum') {
                    // Clicking total sum cell shows all items
                    selectedTags = [];
                } else if (d.tag1 === 'Sum') {
                    // Clicking column sum shows items with that tag
                    selectedTags = [d.tag2];
                } else if (d.tag2 === 'Sum') {
                    // Clicking row sum shows items with that tag
                    selectedTags = [d.tag1];
                } else {
                    // Clicking regular cell shows items with both tags
                    selectedTags = [d.tag1, d.tag2];
                }

                updateList(selectedTags, preprocessedData);
            }
        });

    // Helper function to deal with hover effects.
    function applyHoverEffects(d, highlight = true) {
        if (!d) return;

        cells.style("fill", cell => {
            if (cell.isSum) return sumColorScale(cell.value);
            return (cell.x === d.x || cell.y === d.y)
                ? highlightColorScale(cell.value + 3)
                : cellColorScale(cell.value);
        });

        xLabels.classed("labelHighlight", (_, i) => i === d.x);
        yLabels.classed("labelHighlight", (_, i) => i === d.y);
    }

    // Add hover effects to cells and text
    [cells, texts].forEach(selection => {
        selection
        .on("mouseover", (event, d) => applyHoverEffects(d, true))
        .on("mouseout", () => applyHoverEffects(null, false));
    });

    // Adjust text size to fit within cells
    function adjustTextSize() {
        texts.each(function() {
            const text = d3.select(this);
            const maxSize = cellSize * 0.8;
            const currentSize = parseFloat(text.style("font-size"));
            const textWidth = this.getBBox().width;

            if (textWidth > maxSize) {
                const newSize = (maxSize / textWidth) * currentSize;
                text.style("font-size", `${newSize}px`);
            }
        });
    }
    adjustTextSize();
}

/**
 * Creates a hierarchical arc diagram visualization of tag relationships
 * @param {Object} matrix - Co-occurrence matrix
 * @param {Object[]} preprocessedData - Processed data array
 * @param {Object} GUIparams - Parameters from dat.GUI
 */
export function visualizeArcDiagram(matrix, preprocessedData, GUIparams) {
    const tags = Object.keys(matrix);
    const width = GUIparams.arcDiagramWidth;
    const radius = width / 2;
    const clampColorScaleMax = GUIparams.arcDiagramClampColorScaleMax;
    const colorScheme = GUIparams.arcDiagramColorScheme
    const defaultStrokeOpacity = GUIparams.arcDiagramDefaultStrokeOpacity;
    const dimmedStrokeOpacity = GUIparams.arcDiagramDimmedStrokeOpacity;
    const curveBundleBeta = GUIparams.arcDiagramCurveBundleBeta;

    // Define what a link line looks like
    const line = d3.lineRadial()
        .curve(d3.curveBundle.beta(curveBundleBeta))
        .radius(d => d.y)
        .angle(d => d.x);

    // Create hierarchical data structure
    const tree = d3.cluster()
        .size([2 * Math.PI, radius - 100]);
    const root = {
        name: "root",
        children: tags.map(tag => ({
            name: tag,
            size: d3.sum(Object.values(matrix[tag]))
        }))
    };
    const hierarchy = d3.hierarchy(root);
    tree(hierarchy);

    // Create links data structure
    const links = [];
    tags.forEach(source => {
        tags.forEach(target => {
            if (source !== target && matrix[source][target] > 0) {
                links.push({
                    source,
                    target,
                    value: matrix[source][target]
                });
            }
        });
    });

    // Create the color palette for the links
    const linkColorMaxValue = d3.quantile(links, clampColorScaleMax, d => d.value);
    const linkColorScale = d3.scaleSequential(d3[colorScheme])
        .domain([0, linkColorMaxValue]);

    const svg = d3.select("#arc-diagram")
        .append("svg")
        .attr("viewBox", [-width/2, -width/2, width, width])
        .attr("width", width)
        .attr("height", width)
        .on("click", function(event) {
        // If clicking on the background (svg itself)
        if (event.target === this) {
            // Remove frozen state
            d3.select(this).classed("frozen", false);
            // Reset all effects
            d3.selectAll(".arc-diagram-node text")
                .style("font-weight", null);
            link.style("stroke", d => linkColorScale(d.value))
                .style("stroke-opacity", defaultStrokeOpacity)
                .style("mix-blend-mode", "multiply");
        }
    });


    const node = svg.append("g")
        .selectAll(".arc-diagram-node")
        .data(hierarchy.leaves())
        .join("g")
        .attr("class", "arc-diagram-node")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

    // Add text labels to the nodes
    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .html(d => {
            // For outside of the ring - show the tag name
            if (d.x >= Math.PI) {
            return `${d.data.name} <tspan class="tag-count">[${d3.sum(Object.values(matrix[d.data.name]))}]</tspan>`;
            }
            // For inside of the ring - count entries with the tag in preprocessedData array
            // the matrix contains pair counts but not items with tag counts (and pairs are not triplets etc)
            return `<tspan class="tag-count">[${preprocessedData.filter(entry => entry.tags.includes(d.data.name)).length}]</tspan> ${d.data.name}`;
        })
        .on("mouseover", (event, d) => {
            if (!svg.classed("arc-diagram-locked")) {
                handleNodeMouseOver(event, d);
            }
        })
        .on("mouseout", () => {
            if (!svg.classed("arc-diagram-locked")) {
                // Restore original boldness
                d3.selectAll(".arc-diagram-node text")
                    .style("font-weight", null);
                // Restore original link styles
                link.style("stroke", d => linkColorScale(d.value))
                    .style("stroke-opacity", defaultStrokeOpacity)
                    .style("mix-blend-mode", "multiply");
            }
        })
        .on("click", function(event, d) {
            if (svg.classed("arc-diagram-locked")) {
                // Reset filter to nil. 
                updateList([], preprocessedData);
                // Reset all styles to default
                resetStyles();
                // now act as per regular mouseover event
                handleNodeMouseOver(event, d)
            } else {
                // Filter by tag name when clicking on a label
                updateList([d.data.name], preprocessedData);
            }
            // Toggle frozen state
            svg.classed("arc-diagram-locked", !svg.classed("arc-diagram-locked"));
        });

    function handleNodeMouseOver(event, d) {
        // Bolden the hovered label and labels connected to it
        d3.selectAll(".arc-diagram-node text")
            .filter(n => {
                const isHovered = n.data.name === d.data.name;
                const isConnected = links.some(l =>
                    (l.source === d.data.name && l.target === n.data.name)
                );
                return isHovered || isConnected;
            })
            .style("font-weight", "bold");
        // Dim all the links
        link.style("stroke-opacity", dimmedStrokeOpacity);
        // Now highlight only relevant links
        link.filter(l => l.source === d.data.name || l.target === d.data.name)
            .style("stroke-opacity", 1)
            .raise(); // Bring highlighted links to front    
    };

    // Create the links between nodes
    const link = svg.append("g")
        .attr("fill", "none")
        .selectAll(".arc-diagram-link")
        .data(links)
        .join("path")
        .attr("class", "arc-diagram-link")
        .attr("d", d => {
            const source = hierarchy.leaves().find(node => node.data.name === d.source);
            const target = hierarchy.leaves().find(node => node.data.name === d.target);
            return line(createLinkPath(source, target));
        })
        .style("stroke-width", d => Math.sqrt(d.value))
        .style("stroke", d => linkColorScale(d.value))
        .style("mix-blend-mode", "multiply")
        .style("stroke-opacity", defaultStrokeOpacity)
        .on("mouseover", function(event, d) {
            if (!svg.classed("arc-diagram-locked")) {
                handleLinkMouseOver(event, d);
            }
        })
        .on("mouseout", function(event, d) {
            if (!svg.classed("arc-diagram-locked")) {
                link.style("stroke-opacity", defaultStrokeOpacity)
                    .style("stroke", d => linkColorScale(d.value))
                    .style("mix-blend-mode", "multiply");
            }
        })
        .on("click", function(event, d) {
            if (svg.classed("arc-diagram-locked")) {
                // Reset filter to nil. 
                updateList([], preprocessedData);
                // Reset all styles to default
                resetStyles();
                // now act as per regular mouseover event
                handleLinkMouseOver(event, d)
            } else {
                // Filter by both connected tags when clicking on a link
                updateList([d.source, d.target], preprocessedData);
            }
            // Toggle frozen state
            svg.classed("arc-diagram-locked", !svg.classed("arc-diagram-locked"));

        });

    function handleLinkMouseOver(event, d){
        link.style("stroke-opacity", dimmedStrokeOpacity);
        d3.select(event.currentTarget)
            .style("stroke-opacity", 1)
            .style("mix-blend-mode", null);            
    }

    function resetStyles() {
        // Reset all styles to default
        d3.selectAll(".arc-diagram-node text")
            .style("font-weight", null);                    
        link.style("stroke-opacity", defaultStrokeOpacity)
            .style("stroke", d => linkColorScale(d.value))
            .style("mix-blend-mode", "multiply");
    }

    function createLinkPath(source, target) {
        return [
            source,
            source.parent,
            target.parent,
            target
        ].map(node => ({
            x: node.x,
            y: node.y
        }));
    }
}

/**
 * Creates a streamgraph visualization of tag usage over time
 * @param {Object} matrix - Co-occurrence matrix (not used but kept for consistency with other viz functions)
 * @param {Object[]} preprocessedData - Processed data array
 * @param {Object} GUIparams - Parameters from dat.GUI
 */
export function visualizeStreamgraph(matrix, preprocessedData, GUIparams) {
    // Get parent container dimensions
    const container = d3.select("#streamgraph");
    const containerWidth = container.node().getBoundingClientRect().width;
    
    const margin = { 
        top: 0, 
        right: 20, 
        bottom: 25, 
        left: 20 
    };
    const width = containerWidth - margin.left - margin.right;
    const height = GUIparams.streamgraphHeight - margin.top - margin.bottom;

    // Get computed styles from body for consistent typography
    const computedStyle = window.getComputedStyle(document.body);
    const fontFamily = computedStyle.getPropertyValue('font-family');
    const fontSize = parseInt(computedStyle.getPropertyValue('font-size'));

    // Clear existing SVG
    container.selectAll("svg").remove();

    // Get all unique tags and sort by total usage
    const allTags = [...new Set(preprocessedData.flatMap(d => d.tags))]
        .sort((a, b) => {
            const countA = preprocessedData.filter(d => d.tags.includes(a)).length;
            const countB = preprocessedData.filter(d => d.tags.includes(b)).length;
            return countB - countA;
        });

    // Group data by year and count tag occurrences
    const yearGroups = d3.group(preprocessedData, d => d3.timeYear(d.time_added));
    
    // Convert to array of objects with consistent structure
    const timeData = Array.from(yearGroups, ([date, entries]) => {
        const counts = {};
        allTags.forEach(tag => {
            counts[tag] = entries.filter(entry => entry.tags.includes(tag)).length;
        });
        return {
            date,
            ...counts
        };
    }).sort((a, b) => d3.ascending(a.date, b.date));

    // Stack the data
    const stack = d3.stack()
        .offset(d3.stackOffsetWiggle)
        .order(d3.stackOrderInsideOut)
        .keys(allTags);

    const series = stack(timeData);

    // Create scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(timeData, d => d.date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(series.flat(2)))
        .range([height, 0]);

    // Create color scale using d3's built-in interpolators
    const colorScale = d3.scaleSequential()
        .domain([0, allTags.length - 1])
        .interpolator(d3[GUIparams.streamgraphColorScheme]);

    // Create responsive SVG
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .style("display", "block") // Ensures proper sizing
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create the area generator with smooth curves
    const area = d3.area()
        .x((d, i) => xScale(timeData[i].date))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveBasis);

    // Add the streams
    const paths = svg.selectAll("path")
        .data(series)
        .join("path")
        .attr("d", area)
        .attr("fill", (d, i) => colorScale(i))
        .attr("opacity", 0.8)
        .attr("class", "streamgraph-path")
        .style("transition", "opacity 0.2s ease, stroke-width 0.2s ease");

    // Add interaction handlers
    paths.on("mouseover", function(event, d) {
            if (!d3.select(this).classed("stream-locked")) {
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1);
                showTooltip(event, d);
            }
        })
        .on("mousemove", (event, d) => showTooltip(event, d))
        .on("mouseout", function() {
            if (!d3.select(this).classed("stream-locked")) {
                d3.select(this)
                    .attr("opacity", 0.8)
                    .attr("stroke", null);
                tooltip.style("opacity", 0);
            }
        })
        .on("click", function(event, d) {
            const element = d3.select(this);
            const isLocked = element.classed("stream-locked");
            
            paths.classed("stream-locked", false);
            
            if (!isLocked) {
                element.classed("stream-locked", true);
                updateList([d.key], preprocessedData);
            } else {
                updateList([], preprocessedData);
            }
        });

    // Create and style axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(1))
        .tickFormat(d3.timeFormat("%Y"));

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .style("font-family", fontFamily)
        .style("font-size", `${fontSize}px`);

    // Style axis lines and text
    svg.selectAll(".x-axis path, .x-axis line")
        .style("stroke", "#666")
        .style("stroke-width", "1px");

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "streamgraph-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "rgba(255, 255, 255, 0.95)")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "8px 12px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
        .style("pointer-events", "none")
        .style("font-family", fontFamily)
        .style("font-size", `${fontSize}px`)
        .style("z-index", 1000);

    function showTooltip(event, d) {
        const mouseX = d3.pointer(event)[0];
        const date = xScale.invert(mouseX);
        const dateIndex = timeData.findIndex(t => t.date > date) - 1;
        const currentValue = dateIndex >= 0 ? 
            Math.round(d[dateIndex][1] - d[dateIndex][0]) : 0;
        const totalCount = Math.round(d3.sum(d, layer => layer[1] - layer[0]));
        
        tooltip
            .style("opacity", 1)
            .html(`
                <strong>${d.key}</strong><br>
                <span>Total: ${totalCount}</span><br>
                <span>${date.getFullYear()}: ${currentValue}</span>
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`);
    }

    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            // Get the new width of the container
            const newWidth = entry.contentRect.width - margin.left - margin.right;
            
            // Update the scale
            xScale.range([0, newWidth]);
            
            // Update SVG dimensions
            svg.attr("transform", `translate(${margin.left},${margin.top})`);
            
            // Update the paths
            paths.attr("d", area);
            
            // Update the x-axis
            svg.select(".x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(xAxis);
        }
    });

    resizeObserver.observe(container.node());

    // Cleanup function
    return () => resizeObserver.disconnect();
}

