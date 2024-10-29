from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import os
from dotenv import load_dotenv
import tempfile

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# CA证书内容
CA_CERT = """-----BEGIN CERTIFICATE-----
MIIEQTCCAqmgAwIBAgIUZ9YA26GzCiIqxona3L01zqQRGIwwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvNzI0ODE5NzUtY2FkOC00YmYyLTkzNWEtOGNjNzI0NDNi
ZDVjIFByb2plY3QgQ0EwHhcNMjQxMDI4MDYyNzUyWhcNMzQxMDI2MDYyNzUyWjA6
MTgwNgYDVQQDDC83MjQ4MTk3NS1jYWQ4LTRiZjItOTM1YS04Y2M3MjQ0M2JkNWMg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAKQOyBnC
1Se8/5UdXLPGtVzRu26NERj3Drb1BnSHRPe/tKIYde4VoBA5N4mJhwGxVrJBOLNR
RB+KSkFkB2gdKnSEzgOCdJS/Zm7YgvFBQSgJqQNjWaV8P4nNBSapotOZMNSWfIdn
q4nnRMLhdPZsFCIha+ZGJBAB8LHvkYdm52HcDQw26W2kAzJYkZHsa01B8JSY2CfU
crFt55IyXUKSCrXvEFVjCVLtvEfRrd765bPaT1m9TVkLmRH+NAwYoHQDpk6geOcW
288DlCCNpMv3Jpie/8FJKwSPUebfJP933Viog5bdNHwTD1/UJPdAq7nb/oRqBdBc
eqw5Y+brT6C87BWOjGT5Ymvqpbem7XzdFVBeAW8l4CuPyXMq5qa2vvtNMRQ9/qk3
Fa2XdqrsfZWbU5HDocoYAOc36MOpGlBRo90bhi8AmSsCgskgXjem9NqEOn95lbzO
HhDcA/H3i3MV5b5/3Fn4RM1M6kJ2Oo+vswTZVi0VxzcaaXP15n9U6+s3HwIDAQAB
oz8wPTAdBgNVHQ4EFgQUhEfun6CqZC/yp5UdlK7jZbZqtIYwDwYDVR0TBAgwBgEB
/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAElIrhbzCsteHQkv
uVhZf0QPCprs2M4QAEKFvGOL/WKczOkj6R3xJGh7E01TlTFIQVBbu33KQ2fX2UCL
qq0d0SCr35nKaGp9U/TbDQUrQfoxnHkzOWXMqKzZ8ejn2ayz2KKUiPlCZWJRoWEN
BcECaSG9RV6A8E/ZMwFSDa4yFXhF8U8pqXEYts/ScSnjkXfj1z1GY1/qeENMGLls
KVkqtYpSpzJ1+pwRS2TD+G9Ge1m9ZpIUvEtLowjdjvwQSrUBIQU76SgbbcyFPB5J
XlQ7R3yUKWLQMgFZTu9wmI3ZtHn0BImFK7wbLKT8njvcVfNvRUj0GX6fOU38Cg1y
m6foYMc6F2nHBql00FQgcQWVBvisz+E9ky7eTObEKpenho9stdKTbJrN4af7eJkK
QjdwGNt0qSl/aL3xP7Np87JplOUJ3/8JXOi3lUoYtrxTOPzP4ueGA7Dehq8SLFWd
Ja/dEKG9URGl90INY96z+ITS3KBq0mYeT+7JY1ey4kqzk9V0rg==
-----END CERTIFICATE-----"""

def get_ssl_cert_path():
    # 创建临时文件保存证书
    cert_file = tempfile.NamedTemporaryFile(delete=False)
    cert_file.write(CA_CERT.encode())
    cert_file.close()
    return cert_file.name

# 获取证书路径
ssl_cert_path = get_ssl_cert_path()

# 数据库配置
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": int(os.getenv("DB_PORT")),
    "ssl_ca": ssl_cert_path
}

@app.get("/api/test")
async def test_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.close()
        conn.close()
        return {"status": "success", "message": "数据库连接成功"}
    except Exception as e:
        return {
            "status": "error", 
            "message": f"连接错误: {str(e)}"
        }

@app.get("/api/books")
async def get_books():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM books LIMIT 10")
        books = cursor.fetchall()
        cursor.close()
        conn.close()
        return {"status": "success", "data": books}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 清理函数
@app.on_event("shutdown")
async def cleanup():
    try:
        os.unlink(ssl_cert_path)
    except:
        pass
