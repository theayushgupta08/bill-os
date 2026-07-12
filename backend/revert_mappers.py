import os
import re

base_dir = r"c:\Users\ayush\OneDrive\Desktop\Shrialok AI Labs Projects\bill-os\backend\src\main\java\com\billos\api"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

mapper_dir = os.path.join(base_dir, "mapper")
if os.path.exists(mapper_dir):
    for f in os.listdir(mapper_dir):
        if f.endswith(".java"):
            path = os.path.join(mapper_dir, f)
            content = read_file(path)
            if "unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE" in content:
                content = content.replace(', unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE', '')
                write_file(path, content)
                print(f"Reverted {f}")

print("Mappers reverted.")
