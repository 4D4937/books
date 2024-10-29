from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# 数据库连接配置
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": os.getenv("DB_PORT")
}

@app.get("/api/data")
async def get_data():
    try:
        # 连接数据库
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # 执行查询
        cursor.execute("SELECT * FROM your_table")
        data = cursor.fetchall()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/data")
async def add_data(item: dict):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # 插入数据
        query = "INSERT INTO your_table (name, description) VALUES (%s, %s)"
        values = (item["name"], item["description"])
        cursor.execute(query, values)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
