/**
 * Positions the popup in the top right corner of the visualizations
 */
export const positionPopup = () => {
    const popup = document.querySelector('.tutorial-popup');
    const arcDiagram = document.querySelector('#arc-diagram svg'); // Update with your actual selector
    
    if (popup && arcDiagram) {
        const arcRect = arcDiagram.getBoundingClientRect();
        popup.style.left = `${arcRect.right - 150}px`;
        popup.style.top = `${arcRect.bottom}px`;
    }
};
/**
 * Dismisses the popup permanently
 * @returns {void}
 */
export const dismissPopupPermanently = () => {
    // Hide the popup
    const popup = document.querySelector('.tutorial-popup');
    if (popup) {
        popup.style.display = 'none';
    }
    
    // Store in localStorage that user has dismissed the popup
    localStorage.setItem('tutorialPopupDismissed', 'true');
};

// Function to check if popup should be shown
export const shouldShowPopup = () => {
    // Create the GUI controller only if debug parameter is present in URL
    const urlParams = new URLSearchParams(window.location.search);
    return (urlParams.has('debug') ? true : localStorage.getItem('tutorialPopupDismissed') !== 'true');    
};