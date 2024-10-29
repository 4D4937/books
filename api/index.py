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
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": os.getenv("DB_PORT")
}

@app.get("/api/test")
async def test_connection():
    """测试数据库连接"""
    try:
        conn = mysql.connector.connect(**db_config)
        return {"status": "success", "message": "数据库连接成功"}
    except Exception as e:
        return {"status": "error", "message": f"连接错误: {str(e)}"}

@app.get("/api/books")
async def get_books():
    """获取books表前10行数据"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # 查询前10行数据
        cursor.execute("SELECT * FROM books LIMIT 10")
        books = cursor.fetchall()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        return {
            "status": "success", 
            "count": len(books),
            "data": books
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/books/columns")
async def get_columns():
    """获取books表的列信息"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # 获取表结构
        cursor.execute("DESCRIBE books")
        columns = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "columns": [col[0] for col in columns]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
