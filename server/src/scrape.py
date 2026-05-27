import os
import json
import requests
from bs4 import BeautifulSoup
from typing import List, Dict

# Basic scraper for Odisha Tourism
BASE_URL = "https://odishatourism.gov.in"
TARGET_URL = f"{BASE_URL}/content/tourism/en.html"

def fetch_page_content(url: str) -> str:
    print(f"Fetching URL: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.text

def extract_text_from_html(html_content: str) -> str:
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove script and style elements
    for script_or_style in soup(['script', 'style', 'nav', 'footer', 'header']):
        script_or_style.decompose()
        
    text = soup.get_text(separator='\n')
    
    # Break into lines and remove leading and trailing space on each
    lines = (line.strip() for line in text.splitlines())
    # Break multi-headlines into a line each
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    # Drop blank lines
    text = '\n'.join(chunk for chunk in chunks if chunk)
    return text

def scrape_tourism_data(output_dir: str = "../data"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Phase 1: Scrape the main landing page to extract links and some context
    try:
        html = fetch_page_content(TARGET_URL)
        clean_text = extract_text_from_html(html)
        
        # Save raw text
        with open(os.path.join(output_dir, "odisha_tourism_main.txt"), "w", encoding="utf-8") as f:
            f.write(clean_text)
            
        print("Successfully scraped main page.")
        
        # In a real scenario, we would parse soup.find_all('a') for specific categories 
        # like /heritage, /culture, /food and scrape them iteratively.
        
    except Exception as e:
        print(f"Error scraping data: {e}")

if __name__ == "__main__":
    scrape_tourism_data(output_dir="data")
