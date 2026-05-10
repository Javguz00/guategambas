from PIL import Image
import sys

def rotate(path, degrees=180):
    try:
        img = Image.open(path)
        img = img.rotate(degrees, expand=True)
        img.save(path)
        print(f"Rotated {path} by {degrees} degrees")
    except Exception as e:
        print(f"Error rotating {path}: {e}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: rotate_image.py <image_path> [degrees]')
    else:
        path = sys.argv[1]
        degrees = int(sys.argv[2]) if len(sys.argv) > 2 else 180
        rotate(path, degrees)
