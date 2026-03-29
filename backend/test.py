import requests

url = "http://127.0.0.1:5000/upload"

with open(r"C:\Users\abhim\Downloads\Feature-2.pdf", "rb") as f:
    files = {"file": f}
    data = {"depth": "student"}
    response = requests.post(url, files=files, data=data)

print("Status code:", response.status_code)
print("Response text:", response.text)