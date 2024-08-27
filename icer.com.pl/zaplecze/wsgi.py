from dotenv import load_dotenv
from mainAPI import app as application

load_dotenv()

if __name__ == "__main__":
    application.run()
