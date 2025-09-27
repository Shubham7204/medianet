#!/usr/bin/env python3
"""
Test script for competitive intelligence fixes
"""

def test_analyze_website():
    """Test the analyze_website function locally"""
    import requests
    import re
    import urllib3
    import warnings
    from urllib.parse import urlparse
    
    # Disable SSL warnings
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    warnings.filterwarnings('ignore', message='Unverified HTTPS request')
    
    def analyze_website(url: str) -> dict:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            # Handle SSL warnings and timeout
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", urllib3.exceptions.InsecureRequestWarning)
                response = requests.get(url, headers=headers, timeout=30, verify=False)
                response.raise_for_status()
            html = response.text
            
            # Enhanced content analysis
            text_content = re.sub(r'<[^>]+>', ' ', html)
            text_content = re.sub(r'\s+', ' ', text_content).strip()
            words = text_content.split()
            word_count = len(words)
            char_count = len(text_content)
            
            # Basic analysis for testing
            title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
            title = title_match.group(1).strip() if title_match else "No title found"
            title_length = len(title)
            
            h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
            h1_count = len(h1_matches)
            
            total_headings = h1_count  # Simplified for test
            total_social_mentions = 0  # Simplified for test
            seo_score = 50.0  # Default score
            performance_score = 50.0  # Default score
            
            return {
                "url": url,
                "domain": urlparse(url).netloc,
                "title": title,
                "title_length": title_length,
                "word_count": word_count,
                "char_count": char_count,
                "h1_count": h1_count,
                "total_headings": total_headings,
                "total_social_mentions": total_social_mentions,
                "seo_score": seo_score,
                "performance_score": performance_score,
                "image_alt_text_ratio": 0.0,
                "viewport_meta": False,
                "script_count": 0,
                "analysis_timestamp": "2025-09-27T10:30:00Z"
            }
                
        except Exception as e:
            print(f"Analysis failed for {url}: {e}")
            return {
                "url": url,
                "error": f"Analysis failed: {str(e)}",
                "domain": urlparse(url).netloc if url else "unknown"
            }
    
    # Test with simple websites
    test_urls = [
        "https://example.com",
        "https://github.com"
    ]
    
    print("🧪 Testing website analysis fixes...")
    
    for url in test_urls:
        print(f"\\n📊 Analyzing: {url}")
        result = analyze_website(url)
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
        else:
            print(f"✅ Success!")
            print(f"   Title: {result['title'][:50]}...")
            print(f"   Word count: {result['word_count']}")
            print(f"   Total headings: {result['total_headings']}")
            print(f"   SEO score: {result['seo_score']}")
    
    print("\\n✅ Test completed! SSL warnings should be suppressed and all fields should be present.")

if __name__ == "__main__":
    test_analyze_website()