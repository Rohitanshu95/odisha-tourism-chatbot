import os
import json
import time
from langchain_core.documents import Document
from dotenv import load_dotenv
load_dotenv()

from src.config.settings import get_settings
from src.rag.pipeline import get_vector_store

settings = get_settings()
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SYNTHETIC_DATA_PATH = os.path.join(BASE_DIR, "data", "Odisha_Tourism_12000_Synthetic.json")

def ingest_synthetic_data():
    if not os.path.exists(SYNTHETIC_DATA_PATH):
        print(f"Data file not found at {SYNTHETIC_DATA_PATH}")
        return

    with open(SYNTHETIC_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} items from synthetic dataset.")
    
    # We'll ingest a sample or process in batches to avoid rate limits
    # Let's ingest a subset (e.g., 500) if 12000 is too large for the rate limit,
    # or just run through all of them with batches.
    # To be safe, let's process the first 1000 for demonstration or all if needed.
    
    documents = []
    for item in data:
        content = (
            f"Place: {item['placeName']}\n"
            f"Category: {item['category']} ({item['subcategory']})\n"
            f"Location: {item['city']}, {item['district']} District, {item['state']}\n"
            f"Description: {item['whyFamous']}\n"
            f"Best Time to Visit: {item['bestTimeToVisit']}"
        )
        doc = Document(
            page_content=content,
            metadata={
                "category": item["category"],
                "topic": item["subcategory"],
                "district": item["district"],
                "url": item.get("officialWebsite", "https://odishatourism.gov.in/")
            }
        )
        documents.append(doc)

    vector_store = get_vector_store()
    
    batch_size = 100
    total_docs = len(documents)
    print(f"Indexing {total_docs} documents into Chroma in batches of {batch_size}...")
    
    for i in range(0, total_docs, batch_size):
        batch = documents[i:i+batch_size]
        try:
            vector_store.add_documents(batch)
            print(f"Indexed batch {i//batch_size + 1}/{(total_docs//batch_size) + 1} ({i + len(batch)}/{total_docs})")
            time.sleep(1) # Sleep to avoid rate limit
        except Exception as e:
            print(f"Error indexing batch {i//batch_size + 1}: {e}")
            time.sleep(5) # Backoff

    print("Synthetic data ingestion complete.")

if __name__ == "__main__":
    ingest_synthetic_data()
