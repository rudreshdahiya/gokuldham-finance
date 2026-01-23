
from PIL import Image, ImageDraw, ImageFont
import os

PERSONAS = {
    "poo":      {"color": "#FF69B4", "name": "Poo"},
    "bunny":    {"color": "#00CED1", "name": "Bunny"},
    "geet":     {"color": "#FF6347", "name": "Geet"},
    "raj":      {"color": "#FFD700", "name": "Raj"},
    "pushpa":   {"color": "#8B4513", "name": "Pushpa"},
    "raju":     {"color": "#FF4500", "name": "Raju"},
    "baburao":  {"color": "#808080", "name": "Baburao"},
    "shyam":    {"color": "#4682B4", "name": "Shyam"},
    "chatur":   {"color": "#800080", "name": "Chatur"},
    "rancho":   {"color": "#228B22", "name": "Rancho"},
    "farhan":   {"color": "#20B2AA", "name": "Farhan"},
    "simran":   {"color": "#DDA0DD", "name": "Simran"},
    "munna":    {"color": "#DC143C", "name": "Munna"},
    "circuit":  {"color": "#696969", "name": "Circuit"},
    "rani":     {"color": "#9370DB", "name": "Rani"},
    "veeru":    {"color": "#B22222", "name": "Veeru"}
}

OUTPUT_DIR = "assets"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

for key, data in PERSONAS.items():
    # Create image
    img = Image.new('RGB', (400, 400), color=data["color"])
    d = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default
    try:
        font = ImageFont.truetype("Arial.ttf", 60) # Win/Mac standard
    except:
        try:
             font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60) # Mac specific
        except:
             font = ImageFont.load_default()

    # Draw Text centered
    text = data["name"]
    left, top, right, bottom = d.textbbox((0, 0), text, font=font)
    w = right - left
    h = bottom - top
    
    d.text(((400-w)/2, (400-h)/2), text, fill=(255,255,255), font=font)
    
    # Save
    filename = f"{OUTPUT_DIR}/{key}.png"
    img.save(filename)
    print(f"Generated {filename}")
