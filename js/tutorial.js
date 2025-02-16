/**
 * Positions the popup in the top right corner of the visualizations
 */
export const positionPopup = () => {
    const popup = document.querySelector('.tutorial-popup');
    const arcDiagram = document.querySelector('#arc-diagram svg'); // Update with your actual selector
    
    if (popup && arcDiagram) {
        const arcRect = arcDiagram.getBoundingClientRect();
        popup.style.left = `${arcRect.right - 50}px`;
        popup.style.top = `${arcRect.top + arcRect.height / 6 * 5}px`;
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
    return localStorage.getItem('tutorialPopupDismissed') !== 'true';
};