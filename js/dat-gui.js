/**
     * Creates the dat.GUI controller to change properties of the visualization.
     */
export function createController(params) {
    const gui = new dat.GUI({ autoPlace: false });
    const customContainer = document.getElementById('gui');
    customContainer.appendChild(gui.domElement);

    const chromaticScales = [
        'interpolateViridis', 'interpolateInferno', 'interpolateMagma', 'interpolatePlasma',
        'interpolateCividis', 'interpolateWarm', 'interpolateCool', 'interpolateCubehelixDefault',
        'interpolateBrBG', 'interpolatePRGn', 'interpolatePiYG', 'interpolatePuOr',
        'interpolateRdBu', 'interpolateRdGy', 'interpolateRdYlBu', 'interpolateRdYlGn',
        'interpolateSpectral', 'interpolateBlues', 'interpolateGreens', 'interpolateGreys',
        'interpolateOranges', 'interpolatePurples', 'interpolateReds', 'interpolateTurbo',
        'interpolateRainbow', 'interpolateSinebow',
        'schemeCategory10', 'schemeAccent', 'schemeDark2', 'schemeObservable10', 'schemePaired', 
        'schemePastel1', 'schemePastel2', 'schemeSet1', 'schemeSet2', 'schemeSet3', 'schemeTableau10',
        // ... add more as needed from https://d3js.org/d3-scale-chromatic
    ];

    // Create folders for different visualizations
    const arcDiagramFolder = gui.addFolder('Tag arc diagram');
    const heatmapFolder = gui.addFolder('Tag heatmap');
    const streamgraphFolder = gui.addFolder('Tag streamgraph');

    // arc diagram controls
    arcDiagramFolder.add(params, 'arcDiagramColorScheme', chromaticScales).onChange(params.redraw);
    arcDiagramFolder.add(params, 'arcDiagramWidth', 600, 1200).step(1).onChange(params.redraw);
    arcDiagramFolder.add(params, 'arcDiagramClampColorScaleMax', 0, 1).step(0.01).onChange(params.redraw);
    arcDiagramFolder.add(params, 'arcDiagramDefaultStrokeOpacity', 0, 1).step(0.01).onChange(params.redraw);
    arcDiagramFolder.add(params, 'arcDiagramDimmedStrokeOpacity', 0, 1).step(0.01).onChange(params.redraw);
    arcDiagramFolder.add(params, 'arcDiagramCurveBundleBeta', 0, 1).step(0.01).onChange(params.redraw);

    // Heatmap controls
    heatmapFolder.add(params, 'heatmapCellColorScheme', chromaticScales).onChange(params.redraw);
    heatmapFolder.add(params, 'heatmapSumColorScheme', chromaticScales).onChange(params.redraw);

    // Streamgraph controls
    streamgraphFolder.add(params, 'streamgraphColorScheme', chromaticScales).onChange(params.redraw);
    streamgraphFolder.add(params, 'streamgraphHeight', 100, 400).step(1).onChange(params.redraw);
    streamgraphFolder.add(params, 'streamgraphWidth', 600, 1200).step(1).onChange(params.redraw);

    // some tweaks to the GUI
    gui.close(); 
    gui.domElement.querySelector('.close-button').innerHTML = 'Toggle visual controls';

    return gui;
}