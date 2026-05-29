import os
from dotenv import load_dotenv
load_dotenv()

from src.agents.odisha_agent import create_odisha_agent

try:
    agent = create_odisha_agent()
    print("Agent created successfully")
    # Test invoke
    # result = agent.invoke({"messages": [("user", "hi")]})
    # print(result)
except Exception as e:
    import traceback
    traceback.print_exc()
