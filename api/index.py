from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# 数据库配置
# 数据库配置
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": int(os.getenv("DB_PORT")),
    "ssl": {"ca": os.getenv("SSL_CA")},
    "tls_versions": ['TLSv1.2', 'TLSv1.3']
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
        
        # 获取前10行数据
        cursor.execute("SELECT * FROM books LIMIT 10")
        books = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "data": books
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": str(e)
        }
