'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { ArrowLeft, Edit, Eye, X, Save, Trash, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function ProjectPage({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const iframeRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const screenshotCanvasRef = useRef(null);
  
  const [projectData, setProjectData] = useState({ name: 'Sample Project', url: 'https://example.com' });
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Bypass auth for development
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev-bypass', 'true');
    }
  }, []);

  // Fetch project data and feedback
  useEffect(() => {
    // For demo, just use sample data
    setProjectData({
      id: 'sample',
      name: 'Sample Project',
      url: 'https://example.com',
      createdBy: session?.user?.email
    });
    
    setFeedbackItems([
      { id: '1', xPercent: 25, yPercent: 20, text: 'Logo should be larger' },
      { id: '2', xPercent: 75, yPercent: 40, text: 'Change this button color' }
    ]);
    
    setLoading(false);
  }, [id, session]);

  // Capture screenshot when entering edit mode
  useEffect(() => {
    if (editMode && !isCapturing && iframeRef.current) {
      captureScreenshot();
    }
  }, [editMode, isCapturing]);

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setCanvasSize({
          width: canvasContainerRef.current.offsetWidth,
          height: canvasContainerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setCurrentFeedback(null);
    setEditingFeedback(null);
  };
  
  // Capture screenshot of iframe content using html2canvas
  const captureScreenshot = async () => {
    try {
      setIsCapturing(true);

      // Make sure iframe is loaded
      if (!iframeRef.current) {
        console.error('Iframe reference not available');
        setIsCapturing(false);
        return;
      }

      // Access iframe content
      const iframe = iframeRef.current;
      const iframeWindow = iframe.contentWindow;
      const iframeDocument = iframe.contentDocument || iframeWindow.document;
      
      if (!iframeDocument || !iframeDocument.body) {
        console.error('Cannot access iframe content');
        setIsCapturing(false);
        return;
      }

      // Use html2canvas to take a screenshot
      console.log('Capturing screenshot...');
      
      // Calculate proper dimensions
      const iframeRect = iframe.getBoundingClientRect();
      const canvasWidth = iframeRect.width;
      const canvasHeight = iframeRect.height;
      
      // Set canvas container size
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.width = `${canvasWidth}px`;
        canvasContainerRef.current.style.height = `${canvasHeight}px`;
      }
      
      // Take screenshot
      const canvas = await html2canvas(iframeDocument.body, {
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
    } finally {
      setIsCapturing(false);
    }
  };
  
  // Handle canvas click to add feedback
  const handleCanvasClick = (e) => {
    if (!editMode || isCapturing) return;
    
    // Close any open editing
    setEditingFeedback(null);

    // Get position relative to the canvas
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate the position as percentages
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
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
    // Convert percentage position to pixels
    const x = (item.xPercent / 100) * canvasSize.width;
    const y = (item.yPercent / 100) * canvasSize.height;
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
    
    setFeedbackItems([...feedbackItems, newFeedback]);
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
            {editMode && (
              <button
                onClick={captureScreenshot}
                className="p-2 rounded-md bg-slate-700 text-gray-200 hover:bg-slate-600"
                title="Refresh Screenshot"
              >
                <RefreshCw size={16} />
              </button>
            )}
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
                  <span>Edit Mode</span>
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
              EDIT MODE
            </div>
          )}

          {/* Loading indicator during screenshot capture */}
          {isCapturing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="text-white">Capturing Screenshot...</div>
            </div>
          )}
          
          {/* Website iframe (hidden in edit mode) */}
          <div className={`${editMode ? 'hidden' : 'block'}`} style={{ height: 'calc(100vh - 8rem)' }}>
            <iframe
              ref={iframeRef}
              src={projectData.url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms"
              title="Website Preview"
            />
          </div>
          
          {/* Canvas container (shown in edit mode) */}
          <div 
            ref={canvasContainerRef}
            className={`relative ${editMode ? 'block' : 'hidden'}`}
            style={{ height: 'calc(100vh - 8rem)' }}
            onClick={handleCanvasClick}
          >
            {/* This is where the screenshot canvas will be rendered */}
          </div>
          
          {/* Feedback dots */}
          <div className={`absolute inset-0 pointer-events-none ${editMode ? 'z-10' : ''}`}>
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
                  onClick={(e) => startEditingFeedback(item, e)}
                />
              );
            })}
          </div>
          
          {/* Active feedback tooltip */}
          {!editMode && activeFeedback && (
            <div 
              className="absolute bg-slate-800 text-white p-3 rounded shadow-lg z-50 max-w-xs"
              style={{
                left: `${getDotPosition(activeFeedback).x + 15}px`,
                top: `${getDotPosition(activeFeedback).y + 15}px`
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
                top: `${currentFeedback.y}px` 
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
                  onClick={cancelFeedback}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button 
                  onClick={saveFeedback}
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
                top: `${getDotPosition(editingFeedback).y}px` 
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
                    onClick={cancelFeedback}
                    className="text-rose-400 hover:text-rose-300 transition-colors"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                  <button 
                    onClick={() => deleteFeedback(editingFeedback.id)}
                    className="text-rose-400 hover:text-rose-300 transition-colors"
                    title="Delete"
                  >
                    <Trash size={16} />
                  </button>
                </div>
                <button 
                  onClick={saveEditedFeedback}
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
          {isCapturing 
            ? 'Capturing screenshot...' 
            : editingFeedback 
              ? 'Editing feedback' 
              : currentFeedback 
                ? 'Add your feedback' 
                : 'Click anywhere on the page to add feedback'}
        </div>
      )}
    </div>
  );
}
