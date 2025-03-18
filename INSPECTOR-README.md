# WebCoop Chrome-like Inspector Implementation

This document explains how the Chrome DevTools-like inspector functionality has been implemented in WebCoop for website feedback.

## Architecture Overview

The inspector allows users to hover over elements in a website iframe, highlights them, and lets users attach feedback dots directly to specific DOM elements. The feedback dots will remain attached to their elements even when the page scrolls or resizes.

### Key Components

1. **Inspector Module** (`/lib/inspector.js`): 
   - Core functionality for element selection, highlighting, and getting unique CSS selectors
   - Chrome-like visual highlighting and tooltips
   - Functions to calculate element positions for feedback dots

2. **Scroll Manager** (`/lib/scrollManager.js`):
   - Tracks iframe scroll position
   - Ensures feedback dots remain attached to elements during scrolling

3. **Project Page** (split into multiple components):
   - `ProjectHeader.js`: Navigation and edit mode toggle
   - `IframeViewer.js`: Website iframe with inspector integration
   - `FeedbackEditor.js`: Manages feedback dots, forms, and tooltips
   - `FeedbackDot.js`: Individual feedback indicator
   - `FeedbackForm.js`: Input form for adding/editing feedback
   - `FeedbackTooltip.js`: Display feedback details on hover

## How It Works

### Inspector Functionality

1. When edit mode is enabled, the inspector is activated on the iframe
2. As the user moves their mouse over the website, elements are highlighted with a dashed outline
3. A tooltip shows element details (tag, class, ID, dimensions)
4. When clicking an element, it's "selected" with a solid outline
5. A unique CSS selector is generated for that element
6. The feedback form appears, allowing the user to add text feedback

### Element Attachment

Feedback dots are attached to DOM elements using:
1. CSS selectors to identify elements
2. Relative positioning within elements (as percentages)
3. Fallback positioning when elements can't be found

### Scrolling Support

The implementation:
1. Allows the iframe content to scroll normally
2. Tracks scroll position with scroll event listeners
3. Adjusts feedback dot positions based on element positions
4. Ensures dots stay attached to their elements

### Styling

- We use custom CSS classes like `webcoop-highlight` and `webcoop-target` for element highlighting
- Feedback dots use transform for precise positioning
- All interactive elements work during scroll operations

## File Structure

```
/app
  /project
    /[id]
      page.js           # Main project page (now simplified)
    /components
      FeedbackDot.js    # Individual feedback indicator
      FeedbackForm.js   # Input form for feedback
      FeedbackTooltip.js # Hover tooltip for viewing feedback
      FeedbackEditor.js  # Manages all feedback UI elements
      IframeViewer.js    # Website iframe with inspector
      ProjectHeader.js   # Project navigation header
    api.js              # API functions for project data

/lib
  inspector.js          # Core inspector functionality
  scrollManager.js      # Scroll position tracking
```

## Improvements Made

1. **Chrome-like Inspector**: Matches Chrome DevTools' element highlighting and selection
2. **DOM Element Attachment**: Feedback dots stay attached to elements instead of fixed positions
3. **Scroll Support**: Works while scrolling the website content
4. **Code Organization**: Split into separate components for better maintainability
5. **Enhanced UX**: Better tooltips, smoother highlights, and clearer element targeting

## Usage

1. Navigate to a project page
2. Toggle "Edit Mode" to enable the inspector
3. Hover over elements to highlight them
4. Click on an element to select it and add feedback
5. The feedback dot will remain attached to that element even during scrolling

The implementation follows modern React best practices with hooks, forwarded refs, and component composition.
