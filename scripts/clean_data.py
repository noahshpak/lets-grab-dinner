import pandas as pd
from os.path import join

FILEPATH_CSV = join('..', join('resources', join('dataset', 'restaurants_info.csv')))
FILEPATH_JSON = join('..', join('resources', join('dataset', 'restaurants_list.json')))

def clean_line(str):
    return str.replace(',', '').replace(';', ',')

def read_file_lines(filepath=FILEPATH_CSV):
    with open(filepath, 'r') as f:
        lines = f.read().splitlines()
    return lines

def write_correct_csv(corrected_lines, output_file='corrected_csv.csv'):
    with open(output_file, 'a') as csv_file:
        for line in corrected_lines:
            csv_file.write(line + '\n')
    return output_file

if __name__ == '__main__':
    # swap out semicolons for commas so that pandas can process as CSV
    corrected_lines = map(clean_line, read_file_lines(FILEPATH_CSV))
    output_file_name = write_correct_csv(corrected_lines)

    list_df = pd.read_csv(output_file_name)
    json_df = pd.read_json(FILEPATH_JSON)

    # merge data frames on objectID and write to json file
    # this json file will be uploaded and indexed by Algolia
    merged = pd.merge(list_df, json_df, on="objectID")
    with open('merged_restaurant_data.json', 'a') as f:
         json_data = merged.to_json(orient='records')
         f.write(json_data)
