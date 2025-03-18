'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Eye, X, Save, Trash } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function ProjectPage({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const iframeRef = useRef(null);
  
  const [projectData, setProjectData] = useState({ name: 'Sample Project', url: 'https://example.com' });
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Bypass auth for development
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev-bypass', 'true');
    }
  }, []);

  // Fetch project data and feedback
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        // Get project data from API
        const response = await fetch(`/api/projects/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }
        
        const data = await response.json();
        setProjectData(data.project);
        
        // Also fetch feedback for this project
        const feedbackResponse = await fetch(`/api/projects/${id}/feedback`);
        
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          setFeedbackItems(feedbackData.feedback || []);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Failed to load project data');
        
        // Fallback to sample data for development
        // Try to get any URL from localStorage first
        let storedUrl = '';
        try {
          const storedProjects = JSON.parse(localStorage.getItem('webcoop-projects') || '[]');
          const project = storedProjects.find(p => p.id === id);
          storedUrl = project?.url || '';
        } catch (e) {
          console.error('Error reading from localStorage:', e);
        }
        
        setProjectData({
          id: id,
          name: 'Project ' + id,
          url: storedUrl || 'https://example.com', // Use stored URL if available
          createdBy: session?.user?.email
        });
        
        setFeedbackItems([
          { id: '1', xPercent: 25, yPercent: 20, text: 'Logo should be larger' },
          { id: '2', xPercent: 75, yPercent: 40, text: 'Change this button color' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id, session]);

  // Capture screenshot when entering edit mode
  useEffect(() => {
    // No longer needed - we're working directly with the iframe
  }, [editMode]);

  // Update iframe and reposition feedback when content changes
  useEffect(() => {
    // Setup iframe load event to refresh dot positions
    const handleIframeLoad = () => {
      if (!iframeRef.current) return;
      
      try {
        // When the iframe loads, force a re-render of feedback dots
        setFeedbackItems(prev => [...prev]);
      } catch (err) {
        console.error('Error handling iframe load:', err);
      }
    };

    // Handle window resize
    const handleResize = () => {
      // Force update of feedback dots on resize
      setFeedbackItems(prev => [...prev]);
    };

    window.addEventListener('resize', handleResize);
    
    // Set up iframe load event if iframe exists
    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
      }
    };
  }, []);

  // Toggle edit mode
  const toggleEditMode = () => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    setCurrentFeedback(null);
    setEditingFeedback(null);
    
    // Apply styles directly to the iframe when entering edit mode
    if (iframeRef.current) {
      if (newEditMode) {
        // Apply edit mode styles to iframe
        iframeRef.current.style.cursor = 'crosshair';
        iframeRef.current.style.outline = 'red solid 0px'; // Invisible outline but can be toggled for debug
      } else {
        // Remove edit mode styles
        iframeRef.current.style.cursor = '';
        iframeRef.current.style.outline = '';
      }
    }
  };
  
  // Capture screenshot of iframe content using html2canvas
  const captureScreenshot = async () => {
    try {
      // Skip if we're already capturing
      if (isCapturing) {
        console.log('Already capturing screenshot, skipping duplicate request');
        return;
      }
      
      setIsCapturing(true);

      // Make sure iframe is loaded
      if (!iframeRef.current) {
        console.error('Iframe reference not available');
        setIsCapturing(false);
        return;
      }

      // Since we can't access cross-origin iframe content directly,
      // we'll use html2canvas on the iframe element itself
      const iframe = iframeRef.current;
      
      // Calculate proper dimensions
      const iframeRect = iframe.getBoundingClientRect();
      const canvasWidth = iframeRect.width;
      const canvasHeight = iframeRect.height;
      
      // Set canvas container size
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.width = `${canvasWidth}px`;
        canvasContainerRef.current.style.height = `${canvasHeight}px`;
      }
      
      // Take screenshot of the iframe element (not its contents)
      // This is a compromise to avoid cross-origin issues
      const canvas = await html2canvas(iframe, {
        width: canvasWidth,
        height: canvasHeight,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      // Assign to ref
      screenshotCanvasRef.current = canvas;
      
      // Add to DOM
      if (canvasContainerRef.current) {
        // Clear any existing canvas
        canvasContainerRef.current.innerHTML = '';
        
        // Add the new canvas
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvasContainerRef.current.appendChild(canvas);
        
        // Update canvas size state
        setCanvasSize({
          width: canvasWidth,
          height: canvasHeight
        });
      }
      
      console.log('Screenshot captured successfully');
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      
      // If html2canvas fails, create a placeholder canvas
      try {
        if (canvasContainerRef.current) {
          // Clear any existing canvas
          canvasContainerRef.current.innerHTML = '';
          
          // Create a placeholder canvas with message
          const placeholderCanvas = document.createElement('canvas');
          const ctx = placeholderCanvas.getContext('2d');
          
          // Set canvas dimensions
          const containerRect = canvasContainerRef.current.getBoundingClientRect();
          placeholderCanvas.width = containerRect.width;
          placeholderCanvas.height = containerRect.height;
          
          // Style the canvas
          placeholderCanvas.style.width = '100%';
          placeholderCanvas.style.height = '100%';
          placeholderCanvas.style.position = 'absolute';
          placeholderCanvas.style.top = '0';
          placeholderCanvas.style.left = '0';
          
          // Fill background with a more professional look
          // Create a subtle grid pattern
          ctx.fillStyle = '#f8f9fa';
          ctx.fillRect(0, 0, placeholderCanvas.width, placeholderCanvas.height);
          
          // Draw a subtle grid
          ctx.strokeStyle = '#e9ecef';
          ctx.lineWidth = 1;
          
          // Draw vertical grid lines
          const gridSize = 20;
          for (let x = 0; x < placeholderCanvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, placeholderCanvas.height);
            ctx.stroke();
          }
          
          // Draw horizontal grid lines
          for (let y = 0; y < placeholderCanvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(placeholderCanvas.width, y);
            ctx.stroke();
          }
          
          // Add message
          ctx.fillStyle = '#333';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Click anywhere to add feedback', 
          placeholderCanvas.width / 2, placeholderCanvas.height / 2);
          
          // In case of errors, we also set a safety timeout to reset isCapturing
      // This prevents the UI from getting stuck in "capturing" state
      const safetyTimeout = setTimeout(() => {
        if (isCapturing) {
          console.log('Safety timeout: resetting capture state');
          setIsCapturing(false);
        }
      }, 5000); // 5 second safety timeout
      
      return () => clearTimeout(safetyTimeout);
          
          // Add to container
          canvasContainerRef.current.appendChild(placeholderCanvas);
          screenshotCanvasRef.current = placeholderCanvas;
          
          // Update canvas size state
          setCanvasSize({
            width: placeholderCanvas.width,
            height: placeholderCanvas.height
          });
        }
      } catch (fallbackErr) {
        console.error('Error creating fallback canvas:', fallbackErr);
      }
    } finally {
      setIsCapturing(false);
    }
  };
  
  // Note: Element detection functions have been disabled due to cross-origin restrictions
  // These are placeholder functions that maintain API compatibility
  
  // Get element from iframe document at coordinates - disabled due to cross-origin restrictions
  const getElementAtPosition = (x, y) => {
    // We can't access iframe content due to cross-origin restrictions
    return null;
  };
  
  // Generate CSS selector for an element - disabled due to cross-origin restrictions
  const getCssSelector = (element) => {
    return '';
  };
  
  // Get element position relative to its parent - disabled due to cross-origin restrictions
  const getElementRelativePosition = (element) => {
    return { x: 0, y: 0, width: 0, height: 0 };
  };
  
  // Handle canvas click to add feedback
  const handleCanvasClick = (e) => {
    if (!editMode) return;
    
    // Close any open editing
    setEditingFeedback(null);

    // Get position relative to the container
    const container = e.currentTarget; // This is the div that wraps the iframe
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Make sure the click is inside the container
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    
    // Calculate the position as percentages
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    console.log('Adding feedback at:', { x, y, xPercent, yPercent });
    
    // Set current feedback with position information
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
    
    setEditingFeedback({...feedback});
  };
  
  // Calculate position for feedback dots
  const getDotPosition = (item) => {
    // Get the iframe's parent container dimensions
    const iframe = iframeRef.current;
    if (!iframe) return { x: 0, y: 0 };
    
    const container = iframe.parentElement;
    if (!container) return { x: 0, y: 0 };
    
    const rect = container.getBoundingClientRect();
    
    // Use percentage-based positioning within the container
    const x = (item.xPercent / 100) * rect.width;
    const y = (item.yPercent / 100) * rect.height;
    return { x, y };
  };
  
  // Save new feedback
  const saveFeedback = () => {
    if (!currentFeedback || !currentFeedback.text.trim()) return;

    const newFeedback = {
      id: uuidv4(),
      xPercent: currentFeedback.xPercent,
      yPercent: currentFeedback.yPercent,
      text: currentFeedback.text.trim(),
      createdAt: new Date().toISOString()
    };
    
    // Add to feedback items
    setFeedbackItems([...feedbackItems, newFeedback]);
    
    // Clear current feedback
    setCurrentFeedback(null);
  };
  
  // Save edited feedback
  const saveEditedFeedback = () => {
    if (!editingFeedback || !editingFeedback.text.trim()) return;
    
    setFeedbackItems(feedbackItems.map(item => 
      item.id === editingFeedback.id ? editingFeedback : item
    ));
    
    setEditingFeedback(null);
  };
  
  // Delete feedback
  const deleteFeedback = (feedbackId) => {
    setFeedbackItems(feedbackItems.filter(item => item.id !== feedbackId));
    setEditingFeedback(null);
  };
  
  // Cancel feedback
  const cancelFeedback = () => {
    setCurrentFeedback(null);
    setEditingFeedback(null);
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 shadow-md p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-medium text-white">{projectData.name}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEditMode}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                editMode ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-200 hover:bg-slate-600'
              }`}
            >
              {editMode ? (
                <>
                  <Eye size={16} />
                  <span>View Mode</span>
                </>
              ) : (
                <>
                  <Edit size={16} />
                  <span>Add Feedback</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="relative mx-auto bg-white rounded-lg shadow-lg max-w-6xl">
          {/* Edit mode indicator */}
          {editMode && (
            <div className="absolute top-2 left-2 bg-rose-500 text-white px-2 py-1 rounded-md z-50">
              FEEDBACK MODE
            </div>
          )}
          
          {/* Website iframe container - simplified approach like Atarim */}
          <div 
            className="relative w-full" 
            style={{ height: 'calc(100vh - 8rem)' }}
            onClick={editMode ? handleCanvasClick : undefined}
          >
            <iframe
              ref={iframeRef}
              src={projectData.url && projectData.url.startsWith('http') ? projectData.url : `https://${projectData.url}`}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-presentation allow-popups allow-popups-to-escape-sandbox"
              style={{ 
                cursor: editMode ? 'crosshair' : 'auto',
                pointerEvents: editMode ? 'none' : 'auto' // This is critical - we disable pointer events in edit mode
              }} 
              title="Website Preview"
            />
            
            {/* Feedback dots overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {feedbackItems.map((item) => {
                const position = getDotPosition(item);
                return (
                  <div
                    key={item.id}
                    className="feedback-dot"
                    style={{ 
                      left: `${position.x}px`, 
                      top: `${position.y}px`,
                      position: 'absolute',
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#38bdf8',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 50,
                      cursor: 'pointer',
                      boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.2)',
                      pointerEvents: 'auto'
                    }}
                    onMouseEnter={() => showFeedbackDetails(item)}
                    onMouseLeave={hideFeedbackDetails}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent parent container click
                      startEditingFeedback(item, e);
                    }}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Active feedback tooltip */}
          {!editMode && activeFeedback && (
            <div 
              className="absolute bg-slate-800 text-white p-3 rounded shadow-lg z-50 max-w-xs"
              style={{
                left: `${getDotPosition(activeFeedback).x + 15}px`,
                top: `${getDotPosition(activeFeedback).y + 15}px`,
                maxWidth: '280px',
                wordBreak: 'break-word',
                position: 'absolute',
                pointerEvents: 'none'
              }}
            >
              <p>{activeFeedback.text}</p>
            </div>
          )}
          
            {/* Current feedback form */}
            {currentFeedback && (
              <div 
                className="absolute bg-slate-800 p-4 rounded shadow-lg z-50"
                style={{ 
                  left: `${currentFeedback.x + 20}px`, 
                  top: `${currentFeedback.y}px`,
                  zIndex: 1000
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  className="w-64 h-32 border rounded p-2 bg-slate-700 text-white mb-3"
                  placeholder="Enter your feedback..."
                  value={currentFeedback.text}
                  onChange={(e) => setCurrentFeedback({...currentFeedback, text: e.target.value})}
                  autoFocus
                ></textarea>
                <div className="flex justify-between">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelFeedback();
                    }}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      saveFeedback();
                    }}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </div>
              </div>
            )}
          
            {/* Editing feedback form */}
            {editingFeedback && (
              <div 
                className="absolute bg-slate-800 p-4 rounded shadow-lg z-50"
                style={{ 
                  left: `${getDotPosition(editingFeedback).x + 20}px`, 
                  top: `${getDotPosition(editingFeedback).y}px`,
                  zIndex: 1000
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  className="w-64 h-32 border rounded p-2 bg-slate-700 text-white mb-3"
                  placeholder="Enter your feedback..."
                  value={editingFeedback.text}
                  onChange={(e) => setEditingFeedback({...editingFeedback, text: e.target.value})}
                  autoFocus
                ></textarea>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelFeedback();
                      }}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFeedback(editingFeedback.id);
                      }}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEditedFeedback();
                    }}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </div>
              </div>
            )}
        </div>
      </main>
      
      {/* Edit mode instructions */}
      {editMode && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg">
          {editingFeedback 
            ? 'Editing feedback' 
            : currentFeedback 
              ? 'Add your feedback' 
              : 'Click anywhere on the website to add feedback'}
        </div>
      )}
    </div>
  );
}
