import os
import pandas as pd
from dotenv import load_dotenv
from langchain_core.documents import Document

from rag_pipeline import get_vector_store

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL_PATH = os.path.join(BASE_DIR, "data", "Tourist Place Data Sheet (56) Latest Update.xlsx")

def ingest_excel_data():
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: Could not find Excel file at {EXCEL_PATH}")
        return

    print(f"Loading data from {EXCEL_PATH}...")
    try:
        df = pd.read_excel(EXCEL_PATH)
        # Drop rows where all elements are NaN
        df = df.dropna(how='all')
    except Exception as e:
        print(f"Failed to read Excel file: {e}")
        return

    documents = []
    
    # Process each row
    for index, row in df.iterrows():
        # Create a rich text representation of the row
        content_parts = []
        metadata = {"source": "excel_data"}
        
        for col_name, value in row.items():
            if pd.notna(value):
                # We can use the first column as a 'topic' if possible
                if index == 0 or len(metadata) == 1:
                     metadata["topic"] = str(value)[:50]
                content_parts.append(f"{col_name}: {value}")
                
        if content_parts:
            page_content = "\n".join(content_parts)
            doc = Document(page_content=page_content, metadata=metadata)
            documents.append(doc)

    if not documents:
        print("No valid data found in Excel file.")
        return

    print(f"Indexing {len(documents)} new documents into Chroma...")
    vector_store = get_vector_store()
    vector_store.add_documents(documents)
    print("Indexing complete! New knowledge added successfully.")

if __name__ == "__main__":
    ingest_excel_data()
