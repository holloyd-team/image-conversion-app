import os
import tempfile
from flask import Flask, render_template, request, jsonify, send_from_directory
from PIL import Image
import io
import base64

def get_app():
    """Return the Flask app instance for integration with the parent app"""
    app = Flask(__name__, 
                template_folder='templates',
                static_folder='static')
    
    # Register the routes
    register_routes(app)
    
    return app

def register_routes(app):
    """Register the routes for the app"""
    
    @app.route('/image-conversion-app/convert', methods=['POST'])
    def convert_image():
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        image_file = request.files['image']
        if not image_file.filename:
            return jsonify({'error': 'No image selected'}), 400
        
        target_format = request.form.get('format', 'PNG')
        
        try:
            # Read the original image
            original_img = Image.open(image_file)
            
            # Get the original format
            original_format = original_img.format or 'Unknown'
            
            # Get original file size - save the file position first
            image_file.seek(0, os.SEEK_END)
            original_size = image_file.tell()
            image_file.seek(0)  # Reset file position to beginning
            
            # Check if target format is the same as original format
            is_same_format = original_format == target_format
            
            # Convert the image and save to BytesIO
            converted_data = io.BytesIO()
            
            # If same format conversion, try to preserve original data
            if is_same_format:
                # Re-read the file directly to avoid re-encoding
                image_file.seek(0)
                converted_data.write(image_file.read())
                converted_data.seek(0)
            else:
                # Handle format-specific requirements for different format conversions
                if target_format == 'JPEG' and original_img.mode in ('RGBA', 'LA'):
                    # JPEG doesn't support transparency, convert to RGB
                    original_img = original_img.convert('RGB')
                    # Use high quality to preserve details
                    original_img.save(converted_data, format=target_format, quality=95, optimize=True)
                elif target_format == 'JPEG':
                    # Use high quality to preserve details
                    original_img.save(converted_data, format=target_format, quality=95, optimize=True)
                elif target_format == 'PNG':
                    # Use best compression without losing quality
                    original_img.save(converted_data, format=target_format, optimize=True, compress_level=9)
                elif target_format == 'WEBP':
                    # Use lossless for best quality
                    original_img.save(converted_data, format=target_format, lossless=True, quality=100)
                elif target_format == 'GIF':
                    # Optimize GIF without losing quality
                    original_img.save(converted_data, format=target_format, optimize=True)
                elif target_format == 'TIFF':
                    # Use lossless compression for TIFF
                    original_img.save(converted_data, format=target_format, compression='tiff_lzw')
                elif target_format == 'BMP':
                    # BMP is uncompressed, so just save it
                    original_img.save(converted_data, format=target_format)
                elif target_format == 'ICO':
                    # Save with best quality for ICO
                    original_img.save(converted_data, format=target_format)
                else:
                    # Default fallback with optimization
                    original_img.save(converted_data, format=target_format, optimize=True)
            
            # Get converted file size
            converted_size = len(converted_data.getvalue())
            
            # Prepare result without saving to disk
            converted_data.seek(0)
            # Convert to base64
            b64_data = base64.b64encode(converted_data.getvalue()).decode('utf-8')
            converted_base64 = f"data:image/{target_format.lower()};base64,{b64_data}"
            
            # Get file extension for the client
            format_extension_map = {
                'JPEG': 'jpg',
                'PNG': 'png',
                'GIF': 'gif',
                'BMP': 'bmp',
                'TIFF': 'tiff',
                'WEBP': 'webp',
                'ICO': 'ico'
            }
            file_ext = format_extension_map.get(target_format, target_format.lower())
            
            return jsonify({
                'original_format': original_format,
                'converted_format': target_format,
                'original_size': original_size,
                'converted_size': converted_size,
                'converted_data': converted_base64,
                'file_extension': file_ext
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/image-conversion-app/get_resources')
    def get_resources():
        """Return the resources needed to render the app"""
        return jsonify({
            'html': f'/api/image-conversion-app/index',  # Use actual app name instead of app.name
            'css': '/static/image-conversion-app/css/style.css',
            'js': '/static/image-conversion-app/js/app.js'
        })
    
    @app.route('/image-conversion-app/')
    def index():
        """Render the main app template when run standalone"""
        return render_template('index.html')
    
    @app.route('/image-conversion-app/index')
    def get_index_html():
        """Return the app's HTML content directly"""
        return render_template('index.html')
    
    # Add routes for standalone mode
    @app.route('/')
    def standalone_index():
        """Render the main app template when run standalone"""
        return render_template('index.html')
    
    @app.route('/convert', methods=['POST'])
    def standalone_convert():
        """Convert image endpoint for standalone mode"""
        return convert_image()
    
    @app.route('/get_resources')
    def standalone_get_resources():
        """Get resources endpoint for standalone mode"""
        return get_resources()

# Allow the app to be run standalone
if __name__ == '__main__':
    app = Flask(__name__, 
                template_folder='templates',
                static_folder='static')
    register_routes(app)
    app.run(debug=True, port=5002) 