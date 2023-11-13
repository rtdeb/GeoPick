from nbconvert.exporters import get_exporter
from nbformat import read

notebook_filename = "geopick_notebook.ipynb"  # Replace with your notebook file name

exporter = get_exporter("custom_exporter.CustomHTMLExporter")

# Read the notebook file
with open(notebook_filename, 'r', encoding='utf-8') as f:
    notebook_content = read(f, as_version=4)

# Convert and save as HTML
(output, resources) = exporter.from_notebook_node(notebook_content)

with open("your_output.html", 'w', encoding='utf-8') as f:
    f.write(output)
