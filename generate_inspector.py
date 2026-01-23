from PIL import Image, ImageDraw, ImageFont
import os

def create_initials_avatar(filename, name, color, size=(200, 200)):
    img = Image.new('RGB', size, color=color)
    d = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default
    try:
        font = ImageFont.truetype("Arial.ttf", 80)
    except:
        font = ImageFont.load_default()
        
    # Draw Initials
    text = name[:2].upper()
    
    # Text Bounding Box
    bbox = d.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    x = (size[0] - text_w) / 2
    y = (size[1] - text_h) / 2
    
    d.text((x, y), text, fill=(255,255,255), font=font)
    
    # Border
    d.rectangle([0, 0, size[0]-1, size[1]-1], outline=(255,255,255), width=5)
    
    # Sunglasses (Simple Rectangles) to imply "Chulbul"
    d.rectangle([50, 80, 90, 100], fill="black")
    d.rectangle([110, 80, 150, 100], fill="black")
    d.line([90, 90, 110, 90], fill="black", width=3)
    
    img.save(f"assets/{filename}")
    print(f"Generated {filename}")

if __name__ == "__main__":
    if not os.path.exists("assets"):
        os.makedirs("assets")
        
    create_initials_avatar("inspector_avatar.png", "Chulbul", "#8B4513") # Police Khaki ish
