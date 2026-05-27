import json
import os

def generate_mock_knowledge_base(output_dir: str = "../data"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    data = [
        {
            "category": "Heritage",
            "topic": "Jagannath Temple, Puri",
            "content": "The Shree Jagannath Temple of Puri is an important Hindu temple dedicated to Lord Jagannath, a form of Lord Vishnu, located on the eastern coast of India, at Puri in the state of Odisha. The temple is an important pilgrimage destination and one of the four great 'Char Dham' pilgrimage sites. Dress Code: Strictly traditional. Men must wear Dhoti/Kurta or formal trousers and shirts. Women must wear Sarees or Salwar Kameez. Shorts, skirts, and sleeveless dresses are strictly prohibited. Non-Hindus are not allowed inside the main temple, but can view it from the Raghunandan Library roof."
        },
        {
            "category": "Heritage",
            "topic": "Konark Sun Temple",
            "content": "Konark Sun Temple is a 13th-century CE Sun temple at Konark about 35 kilometres northeast from Puri on the coastline of Odisha. The temple is attributed to king Narasimhadeva I of the Eastern Ganga Dynasty. It is a UNESCO World Heritage Site. It is designed in the shape of a colossal chariot with 24 wheels, pulled by seven horses. Dress Code: Modest clothing is recommended. No strict religious dress code as it is a monument, but visitors should dress comfortably for the hot weather, preferably in cottons."
        },
        {
            "category": "Heritage",
            "topic": "Lingaraj Temple, Bhubaneswar",
            "content": "Lingaraj Temple is a Hindu temple dedicated to Shiva and is one of the oldest temples in Bhubaneswar, the capital of the Indian state of Odisha. The temple is the most prominent landmark of the Bhubaneswar city and one of the major tourist attractions of the state. Dress Code: Strictly traditional attire. Only Hindus are allowed inside the main shrine."
        },
        {
            "category": "Food",
            "topic": "Pakhala Bhata",
            "content": "Pakhala is an Odia term for an Indian food consisting of cooked rice washed or lightly fermented in water. The liquid part is known as torani. It is popular in Odisha. Best paired with fried fish, Badi chura, and saga bhaja. Excellent for beating the summer heat."
        },
        {
            "category": "Food",
            "topic": "Chhena Poda",
            "content": "Chhena Poda is the quintessential cheese dessert from the state of Odisha. It literally means 'roasted cheese' in Odia. It is made of well-kneaded homemade fresh cottage cheese (chhena), sugar, cashew nuts, and raisins, and is baked for several hours until it browns. It is a must-try for tourists."
        },
        {
            "category": "Culture",
            "topic": "Odissi Dance",
            "content": "Odissi is one of the pre-eminent classical dance forms of India which originated in the Hindu temples of Odisha. It is known for its graceful postures, especially the Tribhangi (three-part break), where the body is bent at the neck, torso, and knees."
        },
        {
            "category": "Culture",
            "topic": "Rath Yatra",
            "content": "The Ratha Yatra is a major Hindu festival associated with Lord Jagannath held at Puri in Odisha, India. It involves the public procession of the deities Jagannath, Balabhadra, and Subhadra on massive, beautifully decorated chariots. It usually takes place in June or July."
        }
    ]
    
    file_path = os.path.join(output_dir, "odisha_tourism_knowledge.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
        
    print(f"Successfully generated clean knowledge base at {file_path}")

if __name__ == "__main__":
    generate_mock_knowledge_base("data")
