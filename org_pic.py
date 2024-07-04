import os
import json
from PIL import Image

def convert_webp_to_jpg(file_path):
    with Image.open(file_path) as img:
        rgb_im = img.convert('RGB')
        jpg_path = os.path.splitext(file_path)[0] + '.jpg'
        rgb_im.save(jpg_path, 'JPEG')
    os.remove(file_path)
    return jpg_path

def update_json_with_image_urls(json_file_path, base_directory):
    # Read the JSON file
    with open(json_file_path, 'r', encoding='utf-8') as json_file:
        restaurants = json.load(json_file)

    # Process each restaurant
    for restaurant in restaurants:
        restaurant_name = restaurant['Restaurant Name '].strip()
        folder_path = os.path.join(base_directory, restaurant_name)
        
        # Get all image files in the restaurant's folder
        image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')) and os.path.isfile(os.path.join(folder_path, f))]
        
        # Create the Images array with relative paths
        restaurant['Images'] = [f"pic/{restaurant_name}/{image}" for image in image_files]

    # Write the updated data back to the JSON file
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(restaurants, json_file, indent=2, ensure_ascii=False)

def create_folders_and_rename_files(json_file_path, base_directory):
    # Read the JSON file
    with open(json_file_path, 'r', encoding='utf-8') as json_file:
        restaurants = json.load(json_file)

    # Create the base directory if it doesn't exist
    if not os.path.exists(base_directory):
        os.makedirs(base_directory)

    # Process each restaurant
    for restaurant in restaurants:
        restaurant_name = restaurant['Restaurant Name '].strip()
        folder_path = os.path.join(base_directory, restaurant_name)
        
        if os.path.exists(folder_path):
            print(f"Folder already exists: {folder_path}")
        else:
            os.makedirs(folder_path)
            print(f"Created folder: {folder_path}")
        
        # Check for files in the folder and rename them
        files = os.listdir(folder_path)

        files = [f for f in files if os.path.isfile(os.path.join(folder_path, f)) and f != '.DS_Store']
        files.sort()  # Sort files to ensure consistent numbering
        new_index = 1
        for file in files:
            file_path = os.path.join(folder_path, file)
            file_extension = os.path.splitext(file)[1].lower()
            
            # Convert .webp files to .jpg
            if file_extension == '.webp':
                file_path = convert_webp_to_jpg(file_path)
                file_extension = '.jpg'
                file = os.path.basename(file_path)
            
            # Check if the file already has the correct naming format or starts with the restaurant name
            if not file.startswith(f"{restaurant_name}_") and not file.startswith(restaurant_name):
                # Find the next available index
                while True:
                    new_name = f"{restaurant_name}_{new_index}{file_extension}"
                    new_path = os.path.join(folder_path, new_name)
                    if not os.path.exists(new_path):
                        break
                    new_index += 1
                
                # Rename the file
                os.rename(file_path, new_path)
                print(f"Renamed file: {file} to {new_name}")
            else:
                print(f"File already has correct format or starts with restaurant name: {file}")
            new_index += 1

    # Update the JSON file with image URLs
    update_json_with_image_urls(json_file_path, base_directory)

# Usage
json_file_path = 'restaurants_italy.json'
base_directory = '/Users/task_tamer/Documents/html_projects/Restaurants/Italy/pic'  # Change this to the desired directory

# If the base directory does not exist, use the 'pic' folder in the current directory
if not os.path.exists(base_directory):
    base_directory = os.path.join(os.getcwd(), 'pic')

if __name__ == "__main__":
    create_folders_and_rename_files(json_file_path, base_directory)
else:
    # This allows the script to be imported as a module without running the main function
    pass
