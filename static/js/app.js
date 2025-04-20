// Image Conversion App JavaScript

// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const previewImage = document.getElementById('preview-image');
const clearBtn = document.getElementById('clear-btn');
const formatSelect = document.getElementById('format-select');
const formatInfo = document.getElementById('format-info');
const convertBtn = document.getElementById('convert-btn');
const resultsSection = document.getElementById('results-section');
const originalFormatEl = document.getElementById('original-format');
const convertedFormatEl = document.getElementById('converted-format');
const downloadBtn = document.getElementById('download-btn');
const loadingOverlay = document.getElementById('loading-overlay');

// Variables
let currentFile = null;
let convertedImage = null;
let isStandalone = window.location.pathname === '/' || window.location.pathname === '/image-conversion-app/';

// Format information
const formatDescriptions = {
    'PNG': 'PNG (Portable Network Graphics) is a lossless compression format that supports transparency. Ideal for graphics with sharp edges, text, or images that need to maintain high quality.',
    'JPEG': 'JPEG (Joint Photographic Experts Group) is a lossy compression format best suited for photographs and complex images with many colors. Does not support transparency.',
    'GIF': 'GIF (Graphics Interchange Format) supports animation and transparency. Limited to 256 colors, making it best for simple animations and graphics with few colors.',
    'BMP': 'BMP (Bitmap) is an uncompressed raster graphics format. Results in large file sizes but preserves exact pixel data without any compression artifacts.',
    'TIFF': 'TIFF (Tagged Image File Format) is a flexible format that can be lossless or lossy. Often used for high-quality images and professional publishing.',
    'WEBP': 'WebP is a modern format developed by Google that provides both lossless and lossy compression. Supports transparency and can be smaller than PNG or JPEG.',
    'ICO': 'ICO is used primarily for favicons (website icons). Can contain multiple images of different sizes and color depths.'
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Make sure loading overlay is hidden initially
    if (loadingOverlay) {
        loadingOverlay.hidden = true;
    }
    
    // Initialize the app
    initDropArea();
    initFileInput();
    initFormatSelect();
    initConvertButton();
    initClearButton();
    initDownloadButton();
    
    // Add error handling for image loading
    previewImage.addEventListener('error', function(event) {
        // Prevent infinite loop by checking if we're already trying to load the error image
        if (!this.src.includes('image-error.png') && !this.hasErrored) {
            this.hasErrored = true;
            console.error('Failed to load image preview');
            
            // Use a simple placeholder instead of loading another image
            this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ff6b6b' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='15' y1='9' x2='9' y2='15'%3E%3C/line%3E%3Cline x1='9' y1='9' x2='15' y2='15'%3E%3C/line%3E%3C/svg%3E";
        }
    });
});

// Get the appropriate path for a resource based on whether we're in standalone mode
function getResourcePath(path) {
    return isStandalone ? path : `/static/image-conversion-app/${path}`;
}

// Initialize drag and drop functionality
function initDropArea() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Find the browse button and add a click handler to it
    const browseBtn = document.querySelector('.upload-btn');
    if (browseBtn) {
        browseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up to the drop area
            fileInput.click();
        });
    }
    
    // Make the entire drop area clickable to open file dialog
    // except when clicking on the clear button
    dropArea.addEventListener('click', function(e) {
        // Don't open file dialog if clicking the clear button or its children
        if (e.target.id === 'clear-btn' || e.target.closest('#clear-btn')) {
            return;
        }
        
        // For all other clicks on the drop area or its children, open file dialog
        fileInput.click();
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('highlight');
}

function unhighlight() {
    dropArea.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
        handleFile(files[0]);
    }
}

// Initialize file input handling
function initFileInput() {
    fileInput.addEventListener('change', (e) => {
        // Reset the file input if it has no files to ensure it triggers 'change' even with the same file
        if (!e.target.files.length) {
            fileInput.value = '';
            return;
        }
        
        handleFile(e.target.files[0]);
    });
}

// Add a function to show a disappearing alert
function showTemporaryAlert(message, duration = 3000) {
    // Create alert element if it doesn't exist
    let alertElement = document.getElementById('temporary-alert');
    if (!alertElement) {
        alertElement = document.createElement('div');
        alertElement.id = 'temporary-alert';
        alertElement.style.position = 'fixed';
        alertElement.style.top = '20px';
        alertElement.style.left = '50%';
        alertElement.style.transform = 'translateX(-50%)';
        alertElement.style.backgroundColor = '#ff6b6b';
        alertElement.style.color = 'white';
        alertElement.style.padding = '10px 20px';
        alertElement.style.borderRadius = '4px';
        alertElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        alertElement.style.zIndex = '9999';
        alertElement.style.opacity = '0';
        alertElement.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(alertElement);
    }
    
    // Set message and show alert
    alertElement.textContent = message;
    alertElement.style.opacity = '1';
    
    // Hide alert after duration
    setTimeout(() => {
        alertElement.style.opacity = '0';
    }, duration);
}

function handleFile(file) {
    // Check if file is an image with supported types
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp', 'image/x-icon'];
    
    if (!file.type.match('image.*') || !supportedTypes.includes(file.type)) {
        showTemporaryAlert('Unsupported file type. Please use JPEG, PNG, GIF, BMP, TIFF, WebP, or ICO images.');
        return;
    }
    
    // Log file details
    console.log('File selected:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes (', formatFileSize(file.size), ')');
    
    // Store the file
    currentFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewContainer.hidden = false;
        document.querySelector('.upload-instruction').hidden = true;
        enableConvertButton();
    };
    reader.onerror = () => {
        showError('Failed to read the selected file. Please try again.');
    };
    reader.readAsDataURL(file);
}

// Initialize format select
function initFormatSelect() {
    formatSelect.addEventListener('change', updateFormatInfo);
    
    // Initial format info
    updateFormatInfo();
}

function updateFormatInfo() {
    const format = formatSelect.value;
    const formatTitle = document.querySelector('#format-info h3');
    const formatDescription = document.querySelector('#format-info p');
    
    formatTitle.textContent = `About ${format} Format`;
    formatDescription.textContent = formatDescriptions[format] || 'No information available for this format.';
}

// Initialize convert button
function initConvertButton() {
    convertBtn.addEventListener('click', convertImage);
}

function enableConvertButton() {
    convertBtn.disabled = false;
}

function disableConvertButton() {
    convertBtn.disabled = true;
}

// Initialize clear button
function initClearButton() {
    clearBtn.addEventListener('click', clearImage);
}

function clearImage() {
    currentFile = null;
    convertedImage = null;
    previewImage.src = '';
    previewContainer.hidden = true;
    document.querySelector('.upload-instruction').hidden = false;
    disableConvertButton();
    resultsSection.hidden = true;
    resetResults();
    
    // Reset the file input value to ensure 'change' event can be triggered with same file
    fileInput.value = '';
}

// Initialize download button
function initDownloadButton() {
    downloadBtn.addEventListener('click', downloadConvertedImage);
}

// Get the appropriate API endpoint based on whether we're in standalone mode or not
function getConvertEndpoint() {
    // Log for debugging
    console.log('Current pathname:', window.location.pathname);
    console.log('isStandalone:', isStandalone);
    
    const endpoint = isStandalone ? '/convert' : '/image-conversion-app/convert';
    console.log('Using endpoint:', endpoint);
    return endpoint;
}

function getDownloadEndpoint(filename) {
    return isStandalone ? `/download/${filename}` : `/image-conversion-app/download/${filename}`;
}

// Show error message to the user
function showError(message) {
    alert(message);
    console.error(message);
}

// Convert the image
function convertImage() {
    console.log('convertImage called');
    
    if (!currentFile) {
        console.error('No file selected for conversion');
        return;
    }
    
    console.log('File to convert:', currentFile.name, 'type:', currentFile.type, 'size:', currentFile.size);
    console.log('Target format:', formatSelect.value);
    
    // Show loading overlay
    loadingOverlay.classList.add('visible');
    loadingOverlay.hidden = false;
    
    const endpoint = getConvertEndpoint();
    console.log('Sending conversion request to:', endpoint);
    
    // Create form data
    const formData = new FormData();
    formData.append('image', currentFile);
    formData.append('format', formatSelect.value);
    
    // Send request to server
    fetch(endpoint, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Server response status:', response.status);
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Conversion successful, data received:', Object.keys(data));
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Hide loading overlay
        loadingOverlay.classList.remove('visible');
        loadingOverlay.hidden = true;
        
        // Display results
        displayResults(data);
        
        // Save the converted data
        convertedImage = {
            data: data.converted_data,
            format: data.file_extension || 'png'
        };
        
        // Enable download button
        downloadBtn.disabled = false;
    })
    .catch(error => {
        console.error('Conversion error:', error);
        
        // Hide loading overlay
        loadingOverlay.classList.remove('visible');
        loadingOverlay.hidden = true;
        
        showError(`Error converting image: ${error.message}`);
    });
}

// Display conversion results
function displayResults(data) {
    console.log('Displaying conversion results:', data);
    
    // Display formats with file sizes
    const originalSize = formatFileSize(data.original_size || 0);
    const convertedSize = formatFileSize(data.converted_size || 0);
    
    console.log('Original size:', data.original_size, '(', originalSize, ')');
    console.log('Converted size:', data.converted_size, '(', convertedSize, ')');
    
    // Check if the formats are the same
    const isSameFormat = data.original_format === data.converted_format;
    
    originalFormatEl.textContent = `${data.original_format || 'Unknown'} (${originalSize})`;
    convertedFormatEl.textContent = `${data.converted_format || 'Unknown'} (${convertedSize})`;
    
    // Add a special note when preserving the original format
    if (isSameFormat) {
        // Create or update a special message element
        let preservationMsg = document.getElementById('preservation-msg');
        if (!preservationMsg) {
            preservationMsg = document.createElement('div');
            preservationMsg.id = 'preservation-msg';
            preservationMsg.className = 'preservation-msg';
            resultsSection.insertBefore(preservationMsg, document.querySelector('.download-container'));
        }
        
        // File sizes should be identical or nearly identical
        const sizeRatio = Math.abs(data.original_size - data.converted_size) / data.original_size;
        
        if (sizeRatio < 0.01) { // Less than 1% difference
            preservationMsg.innerHTML = `<p><strong>Original preserved:</strong> The file has been kept in its original format with no re-encoding.</p>`;
        } else {
            preservationMsg.innerHTML = `<p><strong>Format maintained:</strong> The image has been optimized while keeping its original format.</p>`;
        }
        preservationMsg.style.display = 'block';
    } else {
        // Hide the message if it exists
        const preservationMsg = document.getElementById('preservation-msg');
        if (preservationMsg) {
            preservationMsg.style.display = 'none';
        }
    }
    
    // Show results section
    resultsSection.hidden = false;
    
    // Scroll to results section
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Reset results
function resetResults() {
    originalFormatEl.textContent = '-';
    convertedFormatEl.textContent = '-';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === undefined || bytes === null) {
        console.error('Invalid file size value:', bytes);
        return 'Unknown';
    }
    
    const numBytes = Number(bytes);
    if (isNaN(numBytes)) {
        console.error('File size is not a number:', bytes);
        return 'Unknown';
    }
    
    if (numBytes < 1024) return numBytes + ' B';
    else if (numBytes < 1048576) return (numBytes / 1024).toFixed(2) + ' KB';
    else return (numBytes / 1048576).toFixed(2) + ' MB';
}

// Download converted image
function downloadConvertedImage() {
    if (!convertedImage || !convertedImage.data) {
        showError('No converted image available!');
        return;
    }
    
    try {
        // Create a download link
        const link = document.createElement('a');
        
        // Set link properties
        link.href = convertedImage.data;
        link.download = `converted_image.${convertedImage.format}`;
        
        // Append to document, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        showError(`Error downloading image: ${error.message}`);
    }
} 