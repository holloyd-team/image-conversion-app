# Image Conversion App

A web-based tool for converting images between different file formats.

## Features

- Drag-and-drop interface for image uploads
- Convert between multiple formats:
  - PNG
  - JPEG
  - GIF
  - BMP
  - TIFF
  - WebP
  - ICO
- Informative descriptions about each format
- Preview images before conversion
- Simple, user-friendly interface

## Usage

### Standalone Mode

1. Clone this repository:
```
git clone https://github.com/holloyd-team/image-conversion-app.git
cd image-conversion-app
```

2. Install dependencies:
```
pip install Flask Pillow
```

3. Run the app:
```
python run.py
```

4. Open your browser and navigate to `http://localhost:5002`

### With HomeTools

This app can be installed and run directly from [HomeTools](https://github.com/holloyd-team/HomeTools).

## Requirements

- Python 3.7+
- Flask
- Pillow (PIL Fork)

## How It Works

The app uses the Python Imaging Library (Pillow) to convert images between formats. It handles format-specific requirements like converting RGBA images to RGB when saving to formats that don't support transparency (like JPEG).

## License

This project is licensed under the MIT License. 