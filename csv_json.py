import csv
import json

def csv_to_json(csv_file_path, json_file_path):
    # Read the CSV file
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        data = list(csv_reader)

    # Convert the data to JSON
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=2, ensure_ascii=False)

    print(f"Conversion complete. JSON file saved as {json_file_path}")

# Usage
csv_file_path = 'Restaurants - italy(csv).csv'
json_file_path = 'restaurants_italy.json'

csv_to_json(csv_file_path, json_file_path)
