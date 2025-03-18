'use client';

import { useState, useEffect } from 'react';
import FeedbackDot from './FeedbackDot';
import FeedbackForm from './FeedbackForm';
import FeedbackTooltip from './FeedbackTooltip';
import ManualSelector from './ManualSelector';
import { v4 as uuidv4 } from 'uuid';
import { getUniqueSelector } from '@/lib/inspector';

export default function FeedbackEditor({
  iframeRef,
  containerRef,
  containerSize,
  editMode,
  projectId,
  feedbackItems,
  setFeedbackItems,
  currentUser
}) {
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [manualMode, setManualMode] = useState(false);

  // Handle manual selection
  const handleManualSelect = (selection) => {
    // Set current feedback with manual selection info
    setCurrentFeedback({
      x: selection.x,
      y: selection.y,
      xPercent: selection.xPercent,
      yPercent: selection.yPercent,
      text: ''
    });
    
    // Exit manual mode
    setManualMode(false);
  };
  
  // Cancel manual selection
  const cancelManualSelection = () => {
    setManualMode(false);
  };

  // Handle canvas click to add feedback
  const handleCanvasClick = (e) => {
    if (!editMode) return;
    
    // If we're in manual mode, don't process the click
    if (manualMode) return;
    
    // Close any open editing
    setEditingFeedback(null);

    // Get position relative to the container
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate the position as percentages for fallback
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    // Try to get the target element through iframe
    try {
      if (iframeRef.current) {
        // Get iframe document and position
        const iframe = iframeRef.current;
        const iframeRect = iframe.getBoundingClientRect();
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Convert to iframe coordinates
        const iframeX = e.clientX - iframeRect.left;
        const iframeY = e.clientY - iframeRect.top;
        
        // Get element at those coordinates
        const targetElement = iframeDoc.elementFromPoint(iframeX, iframeY);
        
        if (targetElement && targetElement.tagName !== 'HTML' && targetElement.tagName !== 'BODY') {
          // A valid element was found, use it
          console.log('Clicked element:', targetElement.tagName, targetElement.className);
          
          // Calculate relative position in the element
          const elementRect = targetElement.getBoundingClientRect();
          const relXPercent = ((iframeX - elementRect.left) / elementRect.width) * 100;
          const relYPercent = ((iframeY - elementRect.top) / elementRect.height) * 100;
          
          // Generate selector
          const elementSelector = getUniqueSelector(targetElement);
          
          // Set current feedback with element info
          setCurrentFeedback({
            x,
            y,
            xPercent,
            yPercent,
            elementSelector,
            relXPercent,
            relYPercent,
            text: ''
          });
          
          // Add highlight to the element
          targetElement.classList.add('webcoop-target');
          return;
        }
      }
    } catch (err) {
      console.error('Error targeting element on click:', err);
    }
    
    // Fallback to position-based if element targeting failed
    console.log('Using position-based feedback (no element targeted)');
    setCurrentFeedback({
      x,
      y,
      xPercent,
      yPercent,
      text: ''
    });
  };

  // Show/hide feedback details on hover
  const showFeedbackDetails = (feedback) => {
    if (!editMode) {
      setActiveFeedback(feedback);
    }
  };

  const hideFeedbackDetails = () => {
    setActiveFeedback(null);
  };
  
  // Start editing an existing feedback
  const startEditingFeedback = (feedback, e) => {
    if (!editMode) return;
    e.stopPropagation();
    
    // Clone the feedback item to avoid direct state mutation
    setEditingFeedback({...feedback});
  };
  
  // Save edited feedback
  const saveEditedFeedback = async () => {
    if (!editingFeedback || !editingFeedback.text.trim()) return;
    
    // Update in local state
    setFeedbackItems(feedbackItems.map(item => 
      item.id === editingFeedback.id ? editingFeedback : item
    ));
    
    // In a real app, update in database
    if (projectId !== 'sample') {
      try {
        await fetch(`/api/projects/${projectId}/feedback/${editingFeedback.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editingFeedback),
        });
      } catch (error) {
        console.error('Error updating feedback:', error);
      }
    }
    
    setEditingFeedback(null);
  };
  
  // Delete feedback
  const deleteFeedback = async (feedbackId) => {
    // Remove from local state
    setFeedbackItems(feedbackItems.filter(item => item.id !== feedbackId));
    
    // In a real app, delete from database
    if (projectId !== 'sample') {
      try {
        await fetch(`/api/projects/${projectId}/feedback/${feedbackId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting feedback:', error);
      }
    }
    
    setEditingFeedback(null);
  };

  // Handle element selection from inspector (passed from parent)
  useEffect(() => {
    // Define a handler that parent can access through the ref
    if (containerRef.current) {
      containerRef.current.handleElementSelect = (elementData) => {
        // Close any open editing
        setEditingFeedback(null);
        
        // Set current feedback with element targeting info
        setCurrentFeedback({
          elementSelector: elementData.elementSelector,
          element: elementData.element,
          relXPercent: elementData.relXPercent,
          relYPercent: elementData.relYPercent,
          xPercent: (elementData.x / containerSize.width) * 100,
          yPercent: (elementData.y / containerSize.height) * 100,
          x: elementData.x,
          y: elementData.y,
          text: ''
        });
      };
    }
  }, [containerSize]);

  // Save new feedback
  const saveFeedback = async () => {
    if (!currentFeedback || !currentFeedback.text.trim()) return;

    const newFeedback = {
      id: uuidv4(),
      projectId,
      xPercent: currentFeedback.xPercent,
      yPercent: currentFeedback.yPercent,
      text: currentFeedback.text.trim(),
      userId: currentUser?.email,
      createdAt: new Date().toISOString()
    };
    
    // Add element selector information if available
    if (currentFeedback.elementSelector) {
      newFeedback.elementSelector = currentFeedback.elementSelector;
      newFeedback.relXPercent = currentFeedback.relXPercent;
      newFeedback.relYPercent = currentFeedback.relYPercent;
    }
    
    // Add to local state first
    setFeedbackItems([...feedbackItems, newFeedback]);
    setCurrentFeedback(null);
    
    // In a real app, save to API
    if (projectId !== 'sample') {
      try {
        await fetch(`/api/projects/${projectId}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newFeedback),
        });
      } catch (error) {
        console.error('Error saving feedback:', error);
      }
    }
  };

  // Cancel current feedback
  const cancelFeedback = () => {
    setCurrentFeedback(null);
    setEditingFeedback(null);
  };

  // Toggle manual selection mode
  const toggleManualMode = () => {
    setManualMode(!manualMode);
    // Clear any current feedback form
    setCurrentFeedback(null);
    setEditingFeedback(null);
  };

  // Calculate position for feedback form
  const getFormPosition = (feedback) => {
    const position = {
      x: feedback.x || 0,
      y: feedback.y || 0
    };
    
    // Add offset for the form
    position.x += 20;
    
    return position;
  };

  return (
    <div 
      className="absolute inset-0 cursor-default"
      onClick={handleCanvasClick}
      style={{ pointerEvents: editMode ? 'auto' : 'none' }}
    >
      {/* Feedback dots */}
      {feedbackItems.map((item) => (
        <FeedbackDot
          key={item.id}
          item={item}
          iframeRef={iframeRef}
          containerSize={containerSize}
          editMode={editMode}
          showFeedbackDetails={showFeedbackDetails}
          hideFeedbackDetails={hideFeedbackDetails}
          startEditingFeedback={startEditingFeedback}
        />
      ))}
      
      {/* Active feedback tooltip in view mode */}
      {!editMode && activeFeedback && (
        <FeedbackTooltip 
          feedback={activeFeedback} 
          position={iframeRef.current ? 
            { 
              x: activeFeedback.x || 0, 
              y: activeFeedback.y || 0 
            } : { x: 0, y: 0 }}
        />
      )}
      
      {/* Current feedback input when adding new */}
      {currentFeedback && (
        <FeedbackForm
          type="new"
          feedback={currentFeedback}
          position={getFormPosition(currentFeedback)}
          setFeedback={setCurrentFeedback}
          onSave={saveFeedback}
          onCancel={cancelFeedback}
        />
      )}
      
      {/* Editing existing feedback form */}
      {editingFeedback && (
        <FeedbackForm
          type="edit"
          feedback={editingFeedback}
          position={getFormPosition(editingFeedback)}
          setFeedback={setEditingFeedback}
          onSave={saveEditedFeedback}
          onCancel={cancelFeedback}
          onDelete={deleteFeedback}
        />
      )}
      
      {/* Manual selection mode overlay */}
      {manualMode && (
        <ManualSelector
          active={manualMode}
          iframeRef={iframeRef}
          containerRef={containerRef}
          onSelect={handleManualSelect}
          onCancel={cancelManualSelection}
        />
      )}
      
      {/* Editing instructions */}
      {editMode && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg border border-slate-700 flex items-center gap-3">
          <p className="text-sm">
            {editingFeedback ? 'Editing feedback' : 
             currentFeedback ? 'Add your feedback' : 
             manualMode ? 'Manual selection mode' :
             'Click anywhere on the website to add feedback'}
          </p>
          
          {/* Toggle manual mode button */}
          {!currentFeedback && !editingFeedback && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleManualMode();
              }}
              className={`text-xs px-2 py-1 rounded ${manualMode ? 'bg-cyan-600' : 'bg-slate-700'}`}
            >
              {manualMode ? 'Exit Manual' : 'Manual Selection'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
