import os
import json
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

load_dotenv()

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "odisha_tourism_knowledge.json")
CHROMA_PATH = os.path.join(BASE_DIR, "vector_store")

def get_vector_store():
    """Returns the Chroma vector store instance."""
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    return Chroma(
        collection_name="odisha_tourism",
        embedding_function=embeddings,
        persist_directory=CHROMA_PATH
    )

def initialize_knowledge_base():
    """Reads the JSON data and indexes it into Chroma DB if not already present."""
    if not os.path.exists(DATA_PATH):
        print(f"Data file not found at {DATA_PATH}. Please run generate_data.py first.")
        return

    # Check if vector store is already populated (basic check)
    if os.path.exists(CHROMA_PATH) and len(os.listdir(CHROMA_PATH)) > 0:
        print("Vector store already exists. Skipping initialization.")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    documents = []
    for item in data:
        doc = Document(
            page_content=item["content"],
            metadata={
                "category": item["category"],
                "topic": item["topic"]
            }
        )
        documents.append(doc)

    print(f"Indexing {len(documents)} documents into Chroma...")
    vector_store = get_vector_store()
    vector_store.add_documents(documents)
    print("Indexing complete.")

def get_retriever(k=3):
    """Returns a LangChain retriever for the knowledge base."""
    vector_store = get_vector_store()
    return vector_store.as_retriever(search_kwargs={"k": k})

if __name__ == "__main__":
    initialize_knowledge_base()
